/**
 * Music: plays the songs kept on the site's Playlist page, one after another.
 * Every song is one YouTube video, and one file in the My Music folder.
 * Nothing is loaded from YouTube until a visitor opens this window.
 * Closing the window stops the music; rolling it up keeps it playing.
 *
 * The round buttons, the volume and the position bar talk to YouTube's player.
 * When logged in, the site's owner can paste links in and remove them here;
 * they are saved to the Playlist page without opening WordPress. A link to a
 * whole YouTube playlist is split into its songs.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }
	var cfg = window.PLATINUM || {};
	var owner = !!(cfg.rest && cfg.nonce && cfg.canPages);

	function song(id) {
		return { embed: 'https://www.youtube-nocookie.com/embed/' + id, url: 'https://www.youtube.com/watch?v=' + id };
	}

	// Reads a YouTube address: one song, or a whole playlist when it names no song.
	function parse(url) {
		url = String(url || '').trim();
		if (!/^https?:\/\/(www\.|m\.|music\.)?(youtube\.com|youtu\.be)\//i.test(url)) { return null; }
		var m = url.match(/(?:[?&]v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{6,})/);
		if (m && m[1] !== 'videoseries') { return song(m[1]); }
		m = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
		return m ? { list: m[1] } : null;
	}

	function clock(secs) {
		secs = Math.max(0, Math.floor(secs || 0));
		var h = Math.floor(secs / 3600);
		var m = Math.floor((secs % 3600) / 60);
		var s = secs % 60;
		return (h ? h + ':' : '') + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
	}

	function escapeHtml(text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	P.apps.player = function (win) {
		var box = win.querySelector('.player');
		var list = win.querySelector('.player-list');
		var name = win.querySelector('.player-name');
		var frame = win.querySelector('.player-frame');
		var out = win.querySelector('.player-out');
		var timeEl = win.querySelector('.player-time');
		var bar = win.querySelector('.player-bar');
		var fill = bar.querySelector('i');
		var knob = bar.querySelector('b');
		var playBtn = win.querySelector('[data-act="play"]');
		var vol = win.querySelector('.player-vol input');
		var note = win.querySelector('.player-note');
		var form = win.querySelector('.player-add');
		var at = -1;
		var player = null;
		var state = { time: 0, length: 0, playing: false };
		var hello = null;

		function entries() {
			return Array.prototype.map.call(list.querySelectorAll('.player-item'), function (b) {
				return { name: b.textContent, embed: b.dataset.embed, url: b.dataset.url };
			});
		}

		function buttons() {
			return Array.prototype.slice.call(list.querySelectorAll('.player-item'));
		}

		function say(text) {
			if (note) { note.textContent = text || ''; }
		}

		/* ---------- talking to YouTube's player ---------- */

		function send(func, args) {
			if (!player || !player.contentWindow) { return; }
			player.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: args || [], id: 1, channel: 'widget' }), '*');
		}

		function show() {
			var part = state.length ? Math.min(1, state.time / state.length) : 0;
			timeEl.textContent = clock(state.time);
			fill.style.width = (part * 100) + '%';
			knob.style.left = (part * 100) + '%';
			bar.setAttribute('aria-valuenow', String(Math.round(part * 100)));
			playBtn.classList.toggle('is-playing', state.playing);
			playBtn.setAttribute('aria-label', state.playing ? 'Pause' : 'Play');
		}

		function heard(e) {
			if (!win.isConnected) { window.removeEventListener('message', heard); return; }
			if (!player || e.source !== player.contentWindow) { return; }
			var data = e.data;
			if (typeof data === 'string') {
				try { data = JSON.parse(data); } catch (err) { return; }
			}
			if (!data || !data.info) { return; }
			var info = data.info;
			if (typeof info.currentTime === 'number') { state.time = info.currentTime; }
			if (typeof info.duration === 'number' && info.duration > 0) { state.length = info.duration; }
			if (typeof info.playerState === 'number') {
				state.playing = info.playerState === 1 || info.playerState === 3;
				// A song that ends hands over to the next one.
				if (info.playerState === 0 && !state.done) {
					state.done = true;
					if (buttons().length > 1 && !isSeries()) { select(at + 1, true); return; }
				}
			}
			show();
		}
		window.addEventListener('message', heard);

		// Older lists may still hold a whole YouTube playlist as one entry.
		function isSeries() {
			var items = buttons();
			return at >= 0 && items[at] && items[at].dataset.embed.indexOf('videoseries') !== -1;
		}

		function select(i, play) {
			var items = buttons();
			if (!items.length) {
				at = -1;
				player = null;
				frame.innerHTML = '<p class="player-empty">' + (owner ? 'No songs yet. Paste a YouTube link below.' : 'No songs here yet.') + '</p>';
				name.textContent = '';
				out.hidden = true;
				return;
			}
			i = ((parseInt(i, 10) || 0) + items.length) % items.length;
			at = i;
			items.forEach(function (b, n) { b.setAttribute('aria-current', String(n === at)); });
			name.textContent = items[at].textContent;
			out.href = items[at].dataset.url;
			out.hidden = false;
			state = { time: 0, length: 0, playing: false };
			show();

			var src = items[at].dataset.embed;
			src += (src.indexOf('?') === -1 ? '?' : '&') + 'enablejsapi=1&playsinline=1&rel=0' + (play ? '&autoplay=1' : '') + '&origin=' + encodeURIComponent(location.origin);
			player = document.createElement('iframe');
			player.src = src;
			player.title = items[at].textContent;
			player.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen');
			player.setAttribute('allowfullscreen', '');
			player.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
			var mine = player;
			player.addEventListener('load', function () {
				// Ask the player to report its time and state. It may need asking more than once.
				var tries = 0;
				clearInterval(hello);
				hello = setInterval(function () {
					tries++;
					if (!win.isConnected || player !== mine || tries > 8 || state.length) { clearInterval(hello); return; }
					mine.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
					send('setVolume', [parseInt(vol.value, 10)]);
				}, 500);
			});
			frame.textContent = '';
			frame.appendChild(player);
		}

		/* ---------- the controls ---------- */

		box.addEventListener('click', function (e) {
			var btn = e.target.closest('button');
			if (!btn || !box.contains(btn)) { return; }
			var act = btn.dataset.act;
			if (btn.classList.contains('player-item')) {
				select(buttons().indexOf(btn), true);
			} else if (act === 'play') {
				send(state.playing ? 'pauseVideo' : 'playVideo');
			} else if (act === 'first') {
				if (isSeries()) { send('previousVideo'); } else { select(at - 1, true); }
			} else if (act === 'last') {
				if (isSeries()) { send('nextVideo'); } else { select(at + 1, true); }
			} else if (act === 'back') {
				send('seekTo', [Math.max(0, state.time - 15), true]);
			} else if (act === 'ahead') {
				send('seekTo', [state.time + 15, true]);
			} else if (act === 'remove') {
				remove(btn.closest('li'));
			}
		});

		vol.addEventListener('input', function () {
			send('unMute');
			send('setVolume', [parseInt(vol.value, 10)]);
		});

		function seek(clientX) {
			if (!state.length) { return; }
			var r = bar.getBoundingClientRect();
			var part = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
			state.time = part * state.length;
			show();
			send('seekTo', [state.time, true]);
		}
		bar.addEventListener('pointerdown', function (e) {
			seek(e.clientX);
			var move = function (ev) { seek(ev.clientX); };
			var up = function () {
				window.removeEventListener('pointermove', move);
				window.removeEventListener('pointerup', up);
			};
			window.addEventListener('pointermove', move);
			window.addEventListener('pointerup', up);
		});
		bar.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowLeft') { e.preventDefault(); send('seekTo', [Math.max(0, state.time - 5), true]); }
			if (e.key === 'ArrowRight') { e.preventDefault(); send('seekTo', [state.time + 5, true]); }
		});

		/* ---------- adding and removing links (owner only) ---------- */

		function row(entry) {
			var li = document.createElement('li');
			li.innerHTML = '<button type="button" class="player-item"></button>' + (owner ? '<button type="button" class="player-x" data-act="remove" aria-label="Remove" title="Remove">×</button>' : '');
			var b = li.firstChild;
			b.textContent = entry.name;
			b.dataset.embed = entry.embed;
			b.dataset.url = entry.url;
			return li;
		}

		function save(all) {
			var content = all.map(function (entry) {
				var url = entry.url;
				return '<!-- wp:embed {"url":"' + url + '","type":"video","providerNameSlug":"youtube","responsive":true} -->\n' +
					'<figure class="wp-block-embed is-type-video is-provider-youtube wp-block-embed-youtube"><div class="wp-block-embed__wrapper">\n' +
					url + '\n</div><figcaption class="wp-element-caption">' + escapeHtml(entry.name) + '</figcaption></figure>\n<!-- /wp:embed -->';
			}).join('\n\n');
			var body = { content: content, status: 'publish' };
			if (!cfg.playlist) { body.title = 'Playlist'; body.slug = 'playlist'; }
			return fetch(cfg.rest + 'pages' + (cfg.playlist ? '/' + cfg.playlist : ''), {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'X-WP-Nonce': cfg.nonce, 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			}).then(function (res) {
				return res.json().catch(function () { return {}; }).then(function (data) {
					if (!res.ok) {
						throw new Error(res.status === 401 || res.status === 403
							? 'You are no longer logged in. Log in to WordPress in another tab, then try again.'
							: 'WordPress did not save it. Try again.');
					}
					if (data && data.id) { cfg.playlist = data.id; }
				});
			}).then(function () {
				// Later windows, and the My Music folder, should show the same list.
				var tpl = document.getElementById('tpl-player');
				var kept = tpl && tpl.content.querySelector('.player-list');
				if (kept) { kept.innerHTML = list.innerHTML; }
				if (P.refresh) { P.refresh(); }
			});
		}

		function remove(li) {
			if (!owner || !li) { return; }
			var was = buttons().indexOf(li.querySelector('.player-item'));
			var next = li.nextSibling;
			li.remove();
			say('Removing…');
			save(entries()).then(function () {
				say('Removed.');
				if (was === at) { select(Math.min(was, buttons().length - 1)); } else if (was < at) { at--; }
			}).catch(function (err) {
				list.insertBefore(li, next);
				say(err.message);
			});
		}

		// The song's own title, asked for through WordPress. Empty when it cannot be found.
		function titleOf(url) {
			var root = cfg.rest.replace(/wp\/v2\/?$/, '');
			return fetch(root + 'oembed/1.0/proxy?url=' + encodeURIComponent(url), {
				credentials: 'same-origin',
				headers: { 'X-WP-Nonce': cfg.nonce }
			}).then(function (res) { return res.ok ? res.json() : {}; })
				.then(function (data) { return data && data.title ? String(data.title).trim() : ''; })
				.catch(function () { return ''; });
		}

		// Asks YouTube which songs a playlist holds, through a player kept out of sight.
		function songsIn(listId) {
			return new Promise(function (resolve, reject) {
				var probe = document.createElement('iframe');
				probe.className = 'player-probe';
				probe.setAttribute('aria-hidden', 'true');
				probe.tabIndex = -1;
				probe.src = 'https://www.youtube-nocookie.com/embed/videoseries?list=' + listId + '&enablejsapi=1&origin=' + encodeURIComponent(location.origin);
				var ask = null;
				var giveUp = null;
				function done(ids) {
					clearInterval(ask);
					clearTimeout(giveUp);
					window.removeEventListener('message', hear);
					probe.remove();
					if (ids && ids.length) { resolve(ids); } else { reject(new Error('YouTube did not list the songs in that playlist. Check that it is Public or Unlisted, or paste the songs one at a time.')); }
				}
				function hear(e) {
					if (e.source !== probe.contentWindow) { return; }
					var data = e.data;
					if (typeof data === 'string') { try { data = JSON.parse(data); } catch (err) { return; } }
					var ids = data && data.info && data.info.playlist;
					if (ids && ids.length) { done(ids.slice(0, 100)); }
				}
				window.addEventListener('message', hear);
				probe.addEventListener('load', function () {
					ask = setInterval(function () {
						probe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: 2, channel: 'widget' }), '*');
					}, 400);
				});
				giveUp = setTimeout(function () { done(null); }, 12000);
				box.appendChild(probe);
			});
		}

		// Looks up titles a few at a time.
		function named(found) {
			var out = [];
			var queue = found.slice();
			function next() {
				var batch = queue.splice(0, 6);
				if (!batch.length) { return Promise.resolve(out); }
				return Promise.all(batch.map(function (entry) {
					if (entry.name) { return entry; }
					return titleOf(entry.url).then(function (title) { entry.name = title; return entry; });
				})).then(function (got) { out = out.concat(got); return next(); });
			}
			return next();
		}

		if (form) {
			form.addEventListener('submit', function (e) {
				e.preventDefault();
				var link = form.querySelector('.player-link');
				var label = form.querySelector('.player-label');
				var go = form.querySelector('button');
				var found = parse(link.value);
				if (!found) {
					say('That does not look like a YouTube link. Copy the address of a song or a playlist and paste it here.');
					link.focus();
					return;
				}
				var have = entries().map(function (en) { return en.embed; });
				var added = [];
				go.disabled = true;
				say(found.list ? 'Looking up the songs in that playlist…' : 'Saving…');

				var gather = found.list
					? songsIn(found.list).then(function (ids) { return ids.map(song); })
					: Promise.resolve([found]);

				gather.then(function (songs) {
					songs = songs.filter(function (sg) { return have.indexOf(sg.embed) === -1; });
					if (!songs.length) { throw new Error(found.list ? 'Every song in that playlist is already in your list.' : 'That song is already in your list.'); }
					if (!found.list) { songs[0].name = label.value.trim(); }
					return named(songs);
				}).then(function (songs) {
					var count = buttons().length;
					songs.forEach(function (sg) {
						count++;
						if (!sg.name) { sg.name = 'Song ' + count; }
						var li = row(sg);
						list.appendChild(li);
						added.push(li);
					});
					say('Saving…');
					return save(entries());
				}).then(function () {
					say(added.length === 1 ? 'Added. It is now a file in My Music too.' : 'Added ' + added.length + ' songs. Each is now a file in My Music.');
					link.value = '';
					label.value = '';
					if (at === -1) { select(0); }
				}).catch(function (err) {
					added.forEach(function (li) { li.remove(); });
					say(err.message);
				}).then(function () {
					go.disabled = false;
				});
			});
		}

		// Lets a file in the My Music folder choose which playlist to show.
		win.platinumSelect = function (i) { select(i, true); };
		show();
		select(0);
	};
})();
