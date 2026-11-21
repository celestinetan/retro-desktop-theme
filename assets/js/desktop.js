/**
 * Platinum desktop: opens addresses as windows, moves and stacks them,
 * keeps the browser address in step, and runs the menu bar, control strip and clock.
 *
 * Extras (start-up screen, patterns, terminal, puzzle) live in their own
 * files and register themselves on window.Platinum.apps.
 */
(function () {
	'use strict';

	var cfg = window.PLATINUM || { home: '/', title: document.title, site: '' };
	var root = document.documentElement;
	var desk = document.querySelector('.desktop');
	var layer = document.querySelector('.windows');
	if (!desk || !layer) { return; }

	var phone = window.matchMedia('(max-width: 767px)');
	var coarse = window.matchMedia('(pointer: coarse)');
	var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
	var homeUrl = new URL(cfg.home, location.href);
	var siteTitle = cfg.site || document.title;
	var zTop = 10;
	var opened = 0;
	var pending = {};
	var winIds = 0;
	var tasksEl = document.querySelector('.tasks');

	var SIZES = {
		folder: [470, 320],
		doc: [720, 600],
		mail: [540, 600],
		browser: [700, 520],
		pdf: [760, 640],
		notes: [800, 520],
		terminal: [540, 340],
		paint: [500, 450],
		write: [720, 600]
	};

	/* ---------- helpers ---------- */

	function clean(url) {
		var u = new URL(url, location.href);
		u.hash = '';
		return u.href;
	}

	function isHome(url) {
		var u = new URL(url, location.href);
		return u.origin === homeUrl.origin && u.pathname === homeUrl.pathname && !u.search;
	}

	function wins() {
		return Array.prototype.slice.call(layer.querySelectorAll('.window'));
	}

	// The front-most window that is not minimised.
	function topWin() {
		return wins().filter(function (w) { return !w.classList.contains('is-min'); }).sort(function (a, b) {
			return (parseInt(b.style.zIndex, 10) || 0) - (parseInt(a.style.zIndex, 10) || 0);
		})[0] || null;
	}

	function findByUrl(url) {
		var target = clean(url);
		return wins().filter(function (w) {
			return w.dataset.url && clean(w.dataset.url) === target;
		})[0] || null;
	}

	function setAddress(url, title, push) {
		var href = clean(url);
		if (push && href !== clean(location.href)) {
			history.pushState({ platinum: true }, '', href);
		} else {
			history.replaceState({ platinum: true }, '', href);
		}
		document.title = title || siteTitle;
	}

	/* ---------- windows ---------- */

	// Gives a new window its size and place, stepping each one down and right.
	function place(win) {
		if (win.classList.contains('is-placed')) { return; }
		var kind = win.dataset.kind;
		var dw = desk.clientWidth;
		var dh = desk.clientHeight;

		var fixed = SIZES[win.dataset.app];
		if (fixed) {
			win.style.width = Math.min(fixed[0], dw - 16) + 'px';
			win.style.height = Math.min(fixed[1], dh - 16) + 'px';
		}

		if (kind === 'alert' || kind === 'app') {
			win.style.left = '0px';
			win.style.top = '0px';
			win.classList.add('is-placed');
			var rect = win.getBoundingClientRect();
			win.style.left = Math.max(8, Math.round((dw - rect.width) / 2)) + 'px';
			win.style.top = Math.max(8, Math.round((dh - rect.height) / 3)) + 'px';
			return;
		}

		var size = SIZES[kind] || SIZES.doc;
		var step = (opened++ % 6) * 26;
		var w = Math.min(size[0], dw - 16);
		var h = Math.min(size[1], dh - 16);
		var base = 24; // icons sit on the right, so windows start at the left
		var left = Math.min(base + step, Math.max(8, dw - w - 8));
		var top = Math.min(16 + step, Math.max(8, dh - h - 8));
		win.style.width = w + 'px';
		win.style.height = h + 'px';
		win.style.left = left + 'px';
		win.style.top = top + 'px';
		win.classList.add('is-placed');
	}

	function front(win, opts) {
		opts = opts || {};
		win.classList.remove('is-min');
		wins().forEach(function (w) { w.classList.toggle('is-active', w === win); });
		win.style.zIndex = String(++zTop);
		if (win.dataset.url && !opts.keepAddress) {
			setAddress(win.dataset.url, win.dataset.title, opts.push);
		}
		if (opts.focus) {
			win.focus({ preventScroll: true });
		}
		syncTasks();
	}

	// Sends a window down to the taskbar.
	function minimize(win) {
		win.classList.add('is-min');
		win.classList.remove('is-active');
		var next = topWin();
		if (next) {
			front(next, { focus: true });
		} else {
			setAddress(homeUrl.href, siteTitle);
			syncTasks();
		}
	}

	// One entry per open window in the menu at the right of the menu bar.
	function syncTasks() {
		if (!tasksEl) { syncOpenIcons(); return; }
		tasksEl.textContent = '';
		wins().forEach(function (w) {
			if (w.dataset.kind === 'alert') { return; }
			if (!w.id) { w.id = 'win-' + (++winIds); }
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'task';
			btn.dataset.win = w.id;
			btn.textContent = w.getAttribute('aria-label') || '';
			btn.setAttribute('aria-pressed', String(w.classList.contains('is-active')));
			tasksEl.appendChild(btn);
		});
		syncOpenIcons();
	}

	function adopt(win, opts) {
		opts = opts || {};
		if (!win.dataset.title) {
			win.dataset.title = win.dataset.url ? document.title : '';
		}
		place(win);
		restoreFiles(win);
		front(win, opts);
	}

	function close(win, opts) {
		opts = opts || {};
		if (!win) { return; }
		// A window with unsaved work may ask first, and close itself later.
		if (win.platinumBeforeClose && !opts.force && win.platinumBeforeClose() === false) { return; }
		var url = win.dataset.url;
		if (url && !opts.quiet && !phone.matches && !reduced.matches) {
			var back = homeIcon(url);
			if (back && !win.contains(back)) { zoomRects(win.getBoundingClientRect(), back.getBoundingClientRect()); }
		}
		win.remove();
		var next = topWin();
		if (next) {
			front(next, { focus: true });
			if (!next.dataset.url) {
				var behind = wins().filter(function (w) { return w.dataset.url; }).pop();
				if (!behind) { setAddress(homeUrl.href, siteTitle); }
			}
		} else {
			if (!opts.keepAddress && !wins().length) { setAddress(homeUrl.href, siteTitle); }
			var icon = url && iconFor(url);
			(icon || desk).focus({ preventScroll: true });
			syncTasks();
		}
	}

	function closeAll() {
		wins().forEach(function (w) {
			if (w.platinumBeforeClose && w.platinumBeforeClose() === false) { return; }
			w.remove();
		});
		var left = topWin();
		if (left) { front(left, { focus: true }); } else { setAddress(homeUrl.href, siteTitle); }
		syncTasks();
	}

	function iconFor(url) {
		var target = clean(url);
		return Array.prototype.filter.call(document.querySelectorAll('.icons a.icon'), function (a) {
			return clean(a.href) === target;
		})[0] || null;
	}

	// Fetches an address and shows the window it contains.
	function openUrl(url, opts) {
		opts = opts || {};
		var push = opts.push !== false;
		var href = clean(url);

		if (isHome(href)) { return Promise.resolve(null); }

		var existing = findByUrl(href);
		if (existing) {
			front(existing, { focus: true, push: push });
			return Promise.resolve(existing);
		}

		if (pending[href]) { return pending[href]; }

		root.classList.add('is-busy');
		pending[href] = fetch(href, { credentials: 'same-origin' })
			.then(function (res) { return res.text(); })
			.then(function (html) {
				var page = new DOMParser().parseFromString(html, 'text/html');
				var found = page.querySelector('.window[data-main]');
				if (!found) { throw new Error('No window in page'); }
				// A window holding a live form needs the page's own scripts and styles: go to it properly.
				if (found.querySelector('[data-wp-interactive], form.contact-form')) { throw new Error('Needs its own page'); }
				var win = document.importNode(found, true);
				win.dataset.title = page.title;
				if (!win.dataset.url) { win.dataset.url = href; }

				// There is only ever one Notes window; a new note replaces its contents.
				var notes = win.dataset.kind === 'notes' && layer.querySelector('.window[data-kind="notes"]');
				if (notes) {
					win.style.cssText = notes.style.cssText;
					win.className = notes.className;
					notes.replaceWith(win);
				} else {
					layer.appendChild(win);
				}
				adopt(win, { focus: true, push: push });
				return win;
			})
			.catch(function () {
				location.href = href;
				return null;
			})
			.then(function (win) {
				delete pending[href];
				root.classList.remove('is-busy');
				return win;
			});
		return pending[href];
	}

	// Copies a hidden template into a window. One of each at a time.
	function openApp(name) {
		var existing = layer.querySelector('.window[data-app="' + name + '"]');
		if (existing) {
			front(existing, { focus: true });
			return existing;
		}
		var tpl = document.getElementById('tpl-' + name);
		if (!tpl) { return null; }
		var win = tpl.content.querySelector('.window').cloneNode(true);
		layer.appendChild(win);
		var init = Platinum.apps[name];
		if (init) { init(win); }
		adopt(win, { focus: true });
		return win;
	}

	function alertBox(message, title) {
		var win = document.createElement('section');
		win.className = 'window window--alert';
		win.dataset.kind = 'alert';
		win.setAttribute('role', 'alertdialog');
		win.setAttribute('aria-label', title || 'Message');
		win.tabIndex = -1;
		win.innerHTML =
			'<header class="titlebar"><button type="button" class="box box-close" aria-label="Close window"></button>' +
			'<span class="stripes" aria-hidden="true"></span><h1 class="title"></h1><span class="stripes" aria-hidden="true"></span></header>' +
			'<div class="window-body"><div class="alert-body"><p></p>' +
			'<p class="alert-actions"><button type="button" class="button button--default" data-ok>OK</button></p></div></div>';
		win.querySelector('.title').textContent = title || '';
		win.querySelector('.alert-body p').textContent = message;
		layer.appendChild(win);
		adopt(win);
		win.querySelector('[data-ok]').focus({ preventScroll: true });
		return win;
	}

	// A dialog with its own buttons: [{ label, primary, run }]. "extra" is an optional
	// element (a field, a pop-up menu) shown between the message and the buttons.
	function dialog(title, message, buttons, extra) {
		var win = document.createElement('section');
		win.className = 'window window--alert';
		win.dataset.kind = 'alert';
		win.setAttribute('role', 'alertdialog');
		win.setAttribute('aria-label', title || 'Message');
		win.tabIndex = -1;
		win.innerHTML =
			'<header class="titlebar"><span class="stripes" aria-hidden="true"></span><h1 class="title"></h1><span class="stripes" aria-hidden="true"></span></header>' +
			'<div class="window-body"><div class="alert-body"><p></p><div class="alert-extra"></div><p class="alert-actions"></p></div></div>';
		win.querySelector('.title').textContent = title || '';
		win.querySelector('.alert-body p').textContent = message;
		if (extra) { win.querySelector('.alert-extra').appendChild(extra); }
		var actions = win.querySelector('.alert-actions');
		var primary = null;
		buttons.forEach(function (b) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'button' + (b.primary ? ' button--default' : '');
			btn.textContent = b.label;
			btn.addEventListener('click', function () {
				close(win, { force: true });
				if (b.run) { b.run(); }
			});
			actions.appendChild(btn);
			if (b.primary) { primary = btn; }
		});
		win.platinumBeforeClose = function () { return false; }; // only its buttons dismiss it
		layer.appendChild(win);
		adopt(win);
		var first = extra && extra.querySelector('input, select, textarea');
		(first || primary || actions.lastChild).focus({ preventScroll: true });
		return win;
	}

	// Reloads the desktop icons and every open folder, document and Notes window
	// from the site, after something has been saved.
	function refresh() {
		function grab(url) {
			return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
				.then(function (res) { return res.text(); })
				.then(function (html) { return new DOMParser().parseFromString(html, 'text/html'); });
		}
		return grab(homeUrl.href).then(function (page) {
			var fresh = page.querySelector('.icons');
			if (fresh && iconBox) {
				iconBox.innerHTML = fresh.innerHTML;
				layoutIcons();
			}
			return Promise.all(wins().filter(function (w) {
				return w.dataset.url && (w.dataset.kind === 'folder' || w.dataset.kind === 'doc' || w.dataset.kind === 'browser' || w.dataset.kind === 'notes');
			}).map(function (w) {
				return grab(w.dataset.url).then(function (doc) {
					var found = doc.querySelector('.window[data-main]');
					if (!found || found.dataset.kind !== w.dataset.kind) { return; }
					['.window-body', '.infobar', '.title'].forEach(function (part) {
						var from = found.querySelector(part);
						var to = w.querySelector(part);
						if (from && to) { to.innerHTML = from.innerHTML; }
					});
					w.setAttribute('aria-label', found.getAttribute('aria-label') || '');
					w.dataset.title = doc.title;
					restoreFiles(w);
				}).catch(function () {});
			}));
		}).then(syncTasks).catch(function () {});
	}

	/* ---------- dragging and resizing ---------- */

	function startDrag(e, win, mode) {
		if (phone.matches || win.classList.contains('is-zoomed')) { return; }
		var startX = e.clientX;
		var startY = e.clientY;
		var left = win.offsetLeft;
		var top = win.offsetTop;
		var width = win.offsetWidth;
		var height = win.offsetHeight;
		var target = e.target;
		try { target.setPointerCapture(e.pointerId); } catch (err) {}

		function move(ev) {
			var dx = ev.clientX - startX;
			var dy = ev.clientY - startY;
			if (mode === 'move') {
				var maxLeft = desk.clientWidth - 60;
				var maxTop = desk.clientHeight - 24;
				win.style.left = Math.min(maxLeft, Math.max(60 - width, left + dx)) + 'px';
				win.style.top = Math.min(maxTop, Math.max(0, top + dy)) + 'px';
			} else {
				win.style.width = Math.max(240, width + dx) + 'px';
				win.style.height = Math.max(120, height + dy) + 'px';
			}
		}
		function end() {
			target.removeEventListener('pointermove', move);
			target.removeEventListener('pointerup', end);
			target.removeEventListener('pointercancel', end);
		}
		target.addEventListener('pointermove', move);
		target.addEventListener('pointerup', end);
		target.addEventListener('pointercancel', end);
	}

	layer.addEventListener('pointerdown', function (e) {
		var win = e.target.closest('.window');
		if (!win) { return; }
		if (!win.classList.contains('is-active')) { front(win); }
		if (e.button !== 0) { return; }
		if (e.target.closest('.grow')) {
			e.preventDefault();
			startDrag(e, win, 'size');
		} else if (e.target.closest('.titlebar') && !e.target.closest('.box')) {
			e.preventDefault();
			startDrag(e, win, 'move');
		}
	});

	/* ---------- icons ---------- */

	// Selects one icon. With "add" (a shift-click) it joins or leaves the selection instead.
	function select(icon, add) {
		if (add) {
			if (icon) { icon.classList.toggle('is-selected'); }
			return;
		}
		Array.prototype.forEach.call(document.querySelectorAll('.icon.is-selected'), function (el) {
			if (el !== icon) { el.classList.remove('is-selected'); }
		});
		if (icon) { icon.classList.add('is-selected'); }
	}

	// Someone who clicks an icon once and waits is shown, twice at most, how to open it.
	var nudges = 0;
	var nudgeTimer = null;
	var hintEl = null;
	try { nudges = parseInt(localStorage.getItem('platinum-nudged'), 10) || 0; } catch (e) {}
	function hint(text) {
		if (hintEl) { hintEl.remove(); }
		hintEl = document.createElement('div');
		hintEl.className = 'desk-note';
		hintEl.setAttribute('role', 'status');
		hintEl.textContent = text;
		document.body.appendChild(hintEl);
		var mine = hintEl;
		setTimeout(function () { mine.remove(); if (hintEl === mine) { hintEl = null; } }, 4500);
	}
	function nudge() {
		clearTimeout(nudgeTimer);
		if (nudges >= 2 || window.PLATINUM && window.PLATINUM.rest) { return; }
		nudgeTimer = setTimeout(function () {
			nudges++;
			try { localStorage.setItem('platinum-nudged', String(nudges)); } catch (e) {}
			hint('Double-click an icon to open it.');
		}, 1100);
	}

	function activate(icon) {
		clearTimeout(nudgeTimer);
		select(icon);
		if (icon.dataset.alert) {
			alertBox(icon.dataset.alert, icon.dataset.alertTitle);
		} else if (icon.dataset.app) {
			var app = openApp(icon.dataset.app);
			if (app && icon.dataset.arg && app.platinumSelect) { app.platinumSelect(icon.dataset.arg); }
			zoomFrom(icon, app);
		} else if (icon.dataset.ext) {
			// A shortcut: the real site, in a new tab.
			window.open(icon.href, '_blank', 'noopener');
		} else if (icon.href) {
			var known = findByUrl(icon.href);
			openUrl(icon.href).then(function (win) { if (!known) { zoomFrom(icon, win); } });
		}
	}

	// A quick outline that grows from the icon to its window, as a hint of where it went.
	function zoomFrom(icon, win) {
		if (!win || phone.matches || reduced.matches) { return; }
		win.style.visibility = 'hidden';
		zoomRects(icon.getBoundingClientRect(), win.getBoundingClientRect(), function () {
			win.style.visibility = '';
		});
	}

	// A short run of outlines stepping from one place to another, a few on screen at a time.
	function zoomRects(from, to, done) {
		var steps = 9;
		var i = 0;
		var trail = [];
		var timer = setInterval(function () {
			i++;
			var t = i / steps;
			var box = document.createElement('div');
			box.className = 'zoomrect';
			box.style.left = Math.round(from.left + (to.left - from.left) * t) + 'px';
			box.style.top = Math.round(from.top + (to.top - from.top) * t) + 'px';
			box.style.width = Math.round(from.width + (to.width - from.width) * t) + 'px';
			box.style.height = Math.round(from.height + (to.height - from.height) * t) + 'px';
			document.body.appendChild(box);
			trail.push(box);
			if (trail.length > 3) { trail.shift().remove(); }
			if (i >= steps) {
				clearInterval(timer);
				setTimeout(function () {
					trail.forEach(function (el) { el.remove(); });
					if (done) { done(); }
				}, 24);
			}
		}, 24);
	}

	// The icon a window came from: on the desktop, or a file in an open folder.
	function homeIcon(url) {
		var target = clean(url);
		var found = Array.prototype.filter.call(document.querySelectorAll('.icons a.icon, .files a.icon'), function (a) {
			return !a.dataset.ext && clean(a.href) === target && a.offsetParent;
		});
		return found[0] || null;
	}

	// An icon whose window is open is shown dimmed, as it was then.
	function syncOpenIcons() {
		Array.prototype.forEach.call(document.querySelectorAll('.icons a.icon'), function (icon) {
			icon.classList.toggle('is-open', !!findByUrl(icon.href));
		});
	}

	/* ---------- moving icons about the desktop ---------- */

	var iconBox = document.querySelector('.icons');
	var ICON_KEY = 'platinum-icons';
	var justDragged = false;

	function iconId(icon) {
		return icon.getAttribute('href') ? new URL(icon.href, location.href).pathname : icon.textContent.trim();
	}

	function savedSpots() {
		try { return JSON.parse(localStorage.getItem(ICON_KEY)) || {}; } catch (e) { return {}; }
	}

	function clampSpot(x, y, icon) {
		var maxX = Math.max(0, iconBox.clientWidth - icon.offsetWidth);
		var maxY = Math.max(0, iconBox.clientHeight - icon.offsetHeight);
		return [Math.min(maxX, Math.max(0, x)), Math.min(maxY, Math.max(0, y))];
	}

	// Lets the normal layout place every icon, then pins each one where it landed
	// (or where this visitor last left it), so they can be dragged freely.
	// A saved place is kept as its distance from the right edge, where icons live.
	function layoutIcons() {
		if (!iconBox) { return; }
		var icons = Array.prototype.slice.call(iconBox.querySelectorAll('.icon'));
		iconBox.classList.remove('is-free');
		icons.forEach(function (icon) { icon.style.left = ''; icon.style.top = ''; });
		if (phone.matches) { return; }
		var home = iconBox.getBoundingClientRect();
		var saved = savedSpots();
		var spots = icons.map(function (icon) {
			var r = icon.getBoundingClientRect();
			var spot = saved[iconId(icon)];
			return spot ? clampSpot(iconBox.clientWidth - spot[0], spot[1], icon) : [r.left - home.left, r.top - home.top];
		});
		iconBox.classList.add('is-free');
		icons.forEach(function (icon, i) {
			icon.style.left = spots[i][0] + 'px';
			icon.style.top = spots[i][1] + 'px';
			icon.draggable = false;
		});
	}

	function saveSpots(icons) {
		var saved = savedSpots();
		icons.forEach(function (icon) {
			saved[iconId(icon)] = [iconBox.clientWidth - icon.offsetLeft, icon.offsetTop];
		});
		try { localStorage.setItem(ICON_KEY, JSON.stringify(saved)); } catch (e) {}
	}

	// Clean Up tidies the front folder window if there is one, otherwise the desktop.
	function cleanUp() {
		var win = layer.querySelector('.window.is-active');
		var box = win && win.querySelector('.files');
		if (box) {
			var all = filesSaved();
			delete all[folderKey(win)];
			try { localStorage.setItem(FILES_KEY, JSON.stringify(all)); } catch (e) {}
			box.classList.remove('is-free');
			box.style.minHeight = '';
			Array.prototype.forEach.call(box.querySelectorAll('.icon'), function (icon) { icon.style.left = ''; icon.style.top = ''; });
			return;
		}
		try { localStorage.removeItem(ICON_KEY); } catch (e) {}
		layoutIcons();
	}

	/* ---------- moving icons inside a folder window ---------- */

	var FILES_KEY = 'platinum-files';

	function filesSaved() {
		try { return JSON.parse(localStorage.getItem(FILES_KEY)) || {}; } catch (e) { return {}; }
	}

	function folderKey(win) {
		return win.dataset.url ? new URL(win.dataset.url, location.href).pathname : (win.getAttribute('aria-label') || '');
	}

	// Pins a folder's icons where its grid put them, so they can then be dragged.
	function freeFiles(box) {
		if (box.classList.contains('is-free') || phone.matches) { return; }
		var home = box.getBoundingClientRect();
		var icons = Array.prototype.slice.call(box.querySelectorAll('.icon'));
		var spots = icons.map(function (icon) {
			var r = icon.getBoundingClientRect();
			return [r.left - home.left, r.top - home.top];
		});
		box.style.minHeight = box.offsetHeight + 'px';
		box.classList.add('is-free');
		icons.forEach(function (icon, i) {
			icon.style.left = spots[i][0] + 'px';
			icon.style.top = spots[i][1] + 'px';
			icon.draggable = false;
		});
	}

	// Makes the folder tall enough to scroll to its lowest icon.
	function fitFiles(box) {
		var lowest = 0;
		Array.prototype.forEach.call(box.querySelectorAll('.icon'), function (icon) {
			lowest = Math.max(lowest, icon.offsetTop + icon.offsetHeight);
		});
		box.style.minHeight = (lowest + 12) + 'px';
	}

	// Puts a folder's icons back where this visitor last left them.
	function restoreFiles(win) {
		var box = win.querySelector('.files');
		var saved = box && filesSaved()[folderKey(win)];
		if (!box || !saved || phone.matches) { return; }
		freeFiles(box);
		Array.prototype.forEach.call(box.querySelectorAll('.icon'), function (icon) {
			var spot = saved[iconId(icon)];
			if (spot) {
				icon.style.left = spot[0] + 'px';
				icon.style.top = spot[1] + 'px';
			}
		});
		fitFiles(box);
	}

	// The folder (an icon, or an open folder window) under a point, ignoring what is being dragged.
	function folderUnder(x, y, dragged) {
		var hit = document.elementsFromPoint(x, y).filter(function (el) {
			return !dragged.some(function (d) { return d === el || d.contains(el); }) && !el.closest('.drag-ghost');
		})[0];
		if (!hit) { return null; }
		var bin = hit.closest('.icon--trash');
		if (bin && dragged.indexOf(bin) === -1) {
			return { trash: true, name: 'Trash', el: bin };
		}
		var icon = hit.closest('.icon[data-term]');
		if (icon && dragged.indexOf(icon) === -1) {
			return { term: icon.dataset.term, name: icon.querySelector('.icon-label').textContent.trim(), el: icon };
		}
		var win = hit.closest('.window[data-term]');
		if (win) {
			return { term: win.dataset.term, name: win.getAttribute('aria-label') || '', el: win };
		}
		return null;
	}

	var dropMark = null;
	function markDrop(target) {
		if (dropMark && (!target || dropMark !== target.el)) { dropMark.classList.remove('is-drop'); dropMark = null; }
		if (target && Platinum.dropOnFolder) { dropMark = target.el; dropMark.classList.add('is-drop'); }
	}

	// Dragging files in a folder window. A faint copy follows the pointer; letting go inside
	// the window moves the files there, and letting go on a folder hands them to that folder.
	layer.addEventListener('pointerdown', function (e) {
		var icon = e.target.closest('.files .icon');
		if (!icon || e.button !== 0 || phone.matches || e.pointerType === 'touch') { return; }
		var box = icon.closest('.files');
		var win = box.closest('.window');
		var startX = e.clientX;
		var startY = e.clientY;
		var lastX = startX;
		var lastY = startY;
		var moving = null;
		var ghost = null;

		function move(ev) {
			var dx = ev.clientX - startX;
			var dy = ev.clientY - startY;
			lastX = ev.clientX;
			lastY = ev.clientY;
			if (!moving) {
				if (Math.abs(dx) < 4 && Math.abs(dy) < 4) { return; }
				freeFiles(box);
				if (!icon.classList.contains('is-selected')) { select(icon); }
				ghost = document.createElement('div');
				ghost.className = 'drag-ghost';
				moving = Array.prototype.map.call(box.querySelectorAll('.icon.is-selected'), function (el) {
					var r = el.getBoundingClientRect();
					var copy = el.cloneNode(true);
					copy.removeAttribute('href');
					copy.style.left = r.left + 'px';
					copy.style.top = r.top + 'px';
					copy.style.width = r.width + 'px';
					ghost.appendChild(copy);
					return { el: el, x: el.offsetLeft, y: el.offsetTop };
				});
				document.body.appendChild(ghost);
			}
			ghost.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
			var target = folderUnder(lastX, lastY, moving.map(function (m) { return m.el; }));
			markDrop(target && target.el !== win ? target : null);
		}

		function end() {
			document.removeEventListener('pointermove', move);
			document.removeEventListener('pointerup', end);
			document.removeEventListener('pointercancel', end);
			if (!moving) { return; }
			justDragged = true;
			setTimeout(function () { justDragged = false; }, 0);
			ghost.remove();
			markDrop(null);
			var icons = moving.map(function (m) { return m.el; });

			var target = folderUnder(lastX, lastY, icons);
			if (target && target.el !== win && Platinum.dropOnFolder && Platinum.dropOnFolder(icons, target, win)) { return; }
			// Let go on the desktop itself, outside every window: a folder comes out onto the desktop.
			if (!target && Platinum.dropOnDesktop) {
				var under = document.elementsFromPoint(lastX, lastY);
				var onWindow = under.some(function (el) { return el.closest && el.closest('.window, .menubar, .strip'); });
				if (!onWindow && Platinum.dropOnDesktop(icons, win)) { return; }
			}

			// Otherwise, move them within their own window, if that is where they were let go.
			var area = box.getBoundingClientRect();
			if (lastX < area.left || lastX > area.right || lastY < area.top || lastY > area.bottom) { return; }
			var dx = lastX - startX;
			var dy = lastY - startY;
			moving.forEach(function (m) {
				var maxX = Math.max(0, box.clientWidth - m.el.offsetWidth);
				m.el.style.left = Math.min(maxX, Math.max(0, m.x + dx)) + 'px';
				m.el.style.top = Math.max(0, m.y + dy) + 'px';
			});
			fitFiles(box);
			var all = filesSaved();
			var mine = all[folderKey(win)] || {};
			Array.prototype.forEach.call(box.querySelectorAll('.icon'), function (el) {
				mine[iconId(el)] = [el.offsetLeft, el.offsetTop];
			});
			all[folderKey(win)] = mine;
			try { localStorage.setItem(FILES_KEY, JSON.stringify(all)); } catch (err) {}
		}

		document.addEventListener('pointermove', move);
		document.addEventListener('pointerup', end);
		document.addEventListener('pointercancel', end);
	});

	layer.addEventListener('dragstart', function (e) {
		if (e.target.closest && e.target.closest('.files .icon')) { e.preventDefault(); }
	});

	function overlaps(a, b) {
		return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
	}

	if (iconBox) {
		// Dragging an icon (or every selected icon) around the desktop.
		iconBox.addEventListener('pointerdown', function (e) {
			var icon = e.target.closest('.icon');
			if (!icon || e.button !== 0 || phone.matches || e.pointerType === 'touch' || !iconBox.classList.contains('is-free')) { return; }
			var startX = e.clientX;
			var startY = e.clientY;
			var moving = null;

			function move(ev) {
				var dx = ev.clientX - startX;
				var dy = ev.clientY - startY;
				if (!moving) {
					if (Math.abs(dx) < 4 && Math.abs(dy) < 4) { return; }
					if (!icon.classList.contains('is-selected')) { select(icon); }
					moving = Array.prototype.map.call(iconBox.querySelectorAll('.icon.is-selected'), function (el) {
						el.classList.add('is-dragging');
						return { el: el, x: el.offsetLeft, y: el.offsetTop };
					});
				}
				moving.forEach(function (m) {
					var spot = clampSpot(m.x + dx, m.y + dy, m.el);
					m.el.style.left = spot[0] + 'px';
					m.el.style.top = spot[1] + 'px';
				});
			}

			function end() {
				document.removeEventListener('pointermove', move);
				document.removeEventListener('pointerup', end);
				document.removeEventListener('pointercancel', end);
				if (!moving) { return; }
				justDragged = true;
				setTimeout(function () { justDragged = false; }, 0);
				moving.forEach(function (m) { m.el.classList.remove('is-dragging'); });

				// Dropping something on the Trash is politely refused.
				var trash = iconBox.querySelector('.icon--trash');
				var dropped = moving.filter(function (m) { return m.el !== trash; });
				if (trash && dropped.length && dropped.some(function (m) { return overlaps(m.el.getBoundingClientRect(), trash.getBoundingClientRect()); })) {
					moving.forEach(function (m) { m.el.style.left = m.x + 'px'; m.el.style.top = m.y + 'px'; });
					var name = dropped[0].el.querySelector('.icon-label').textContent.trim();
					alertBox(dropped.length > 1 ? 'These items cannot be put in the Trash, because they are still needed.' : '“' + name + '” cannot be put in the Trash, because it is still needed.', 'Trash');
					return;
				}
				var els = moving.map(function (m) { return m.el; });
				var last = moving[0].el.getBoundingClientRect();
				var onto = folderUnder(last.left + last.width / 2, last.top + 20, els);
				if (onto && Platinum.dropOnFolder && Platinum.dropOnFolder(els, onto, null)) {
					moving.forEach(function (m) { m.el.style.left = m.x + 'px'; m.el.style.top = m.y + 'px'; });
					return;
				}
				saveSpots(els);
			}

			document.addEventListener('pointermove', move);
			document.addEventListener('pointerup', end);
			document.addEventListener('pointercancel', end);
		});

		iconBox.addEventListener('dragstart', function (e) { e.preventDefault(); });

		// Dragging on the empty desktop draws a selection rectangle.
		desk.addEventListener('pointerdown', function (e) {
			if (e.button !== 0 || phone.matches || e.pointerType === 'touch') { return; }
			if (e.target !== desk && e.target !== iconBox && e.target !== layer) { return; }
			var area = desk.getBoundingClientRect();
			var startX = e.clientX;
			var startY = e.clientY;
			var band = null;

			function move(ev) {
				if (!band) {
					if (Math.abs(ev.clientX - startX) < 4 && Math.abs(ev.clientY - startY) < 4) { return; }
					band = document.createElement('div');
					band.className = 'marquee';
					desk.appendChild(band);
				}
				var left = Math.max(area.left, Math.min(startX, ev.clientX));
				var top = Math.max(area.top, Math.min(startY, ev.clientY));
				var right = Math.min(area.right, Math.max(startX, ev.clientX));
				var bottom = Math.min(area.bottom, Math.max(startY, ev.clientY));
				band.style.left = (left - area.left) + 'px';
				band.style.top = (top - area.top) + 'px';
				band.style.width = (right - left) + 'px';
				band.style.height = (bottom - top) + 'px';
				var box = { left: left, top: top, right: right, bottom: bottom };
				Array.prototype.forEach.call(iconBox.querySelectorAll('.icon'), function (icon) {
					icon.classList.toggle('is-selected', overlaps(icon.getBoundingClientRect(), box));
				});
			}

			function end() {
				document.removeEventListener('pointermove', move);
				document.removeEventListener('pointerup', end);
				document.removeEventListener('pointercancel', end);
				if (band) {
					band.remove();
					justDragged = true;
					setTimeout(function () { justDragged = false; }, 0);
				}
			}

			document.addEventListener('pointermove', move);
			document.addEventListener('pointerup', end);
			document.addEventListener('pointercancel', end);
		});

		var relayout = null;
		window.addEventListener('resize', function () {
			clearTimeout(relayout);
			relayout = setTimeout(layoutIcons, 120);
		});
	}

	/* ---------- clicks ---------- */

	function plainClick(e) {
		return e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
	}

	// Links that should open as a window: same site, not a file, not the admin.
	function isWindowLink(a) {
		if (!a.href || a.target === '_blank' || a.hasAttribute('download')) { return false; }
		var u = new URL(a.href, location.href);
		if (u.origin !== location.origin) { return false; }
		if (u.pathname === location.pathname && u.hash && u.search === location.search) { return false; }
		if (/\/(wp-admin|wp-login\.php|wp-content|wp-json|feed)(\/|$)/.test(u.pathname)) { return false; }
		if (/\.[a-z0-9]{2,5}$/i.test(u.pathname) && !/\.(html?|php)$/i.test(u.pathname)) { return false; }
		if (u.searchParams.has('preview') || u.searchParams.has('replytocom')) { return false; }
		return true;
	}

	document.addEventListener('click', function (e) {
		var menuTitle = e.target.closest('.menu-title');
		if (menuTitle) { toggleMenu(menuTitle.parentNode); return; }

		var cmd = e.target.closest('[data-cmd]');
		if (cmd) {
			var name = cmd.dataset.cmd;
			if (cmd.closest('.menu-list') && !reduced.matches) {
				// A chosen menu item blinks before the menu goes away.
				blink(cmd, function () { closeMenus(); run(name); });
			} else {
				closeMenus();
				run(name);
			}
			return;
		}

		if (!e.target.closest('.menu')) { closeMenus(); }

		var task = e.target.closest('.task');
		if (task) {
			var target = document.getElementById(task.dataset.win);
			if (!target) { return; }
			target.classList.remove('is-shaded');
			front(target, { focus: true });
			closeMenus();
			return;
		}

		var ok = e.target.closest('[data-ok]');
		if (ok) { close(ok.closest('.window')); return; }

		var box = e.target.closest('.box');
		if (box) {
			var win = box.closest('.window');
			if (box.classList.contains('box-close')) {
				if (!plainClick(e)) { return; }
				e.preventDefault();
				close(win);
			} else if (box.classList.contains('box-zoom')) {
				win.classList.toggle('is-zoomed');
			} else if (box.classList.contains('box-shade')) {
				win.classList.toggle('is-shaded');
			}
			return;
		}

		var icon = e.target.closest('.icon');
		if (icon) {
			if (icon.href && (e.button !== 0 || e.metaKey || e.ctrlKey || e.altKey)) { return; }
			e.preventDefault();
			if (justDragged) { return; }
			// As on the real thing: one click selects, a double-click opens, a shift-click adds to the selection.
			// The keyboard and a finger open straight away.
			if (e.shiftKey) { select(icon, true); return; }
			var direct = e.detail === 0 || e.detail >= 2 || phone.matches || coarse.matches;
			if (direct) { activate(icon); } else { select(icon); nudge(); }
			return;
		}

		var link = e.target.closest('a[href]');
		if (link) {
			if (!plainClick(e)) { return; }
			if (link.hasAttribute('data-desktop')) {
				e.preventDefault();
				closeMenus();
				if (phone.matches) { closeAll(); }
				return;
			}
			if (isHome(link.href) && link.closest('.window')) {
				e.preventDefault();
				close(link.closest('.window'));
				return;
			}
			if (isWindowLink(link)) {
				e.preventDefault();
				closeMenus();
				openUrl(link.href);
			}
			return;
		}

		if ((e.target === desk || e.target.classList.contains('icons') || e.target === layer) && !justDragged) {
			select(null);
		}
	});

	// Double-clicking a title bar rolls the window up, like its collapse box.
	layer.addEventListener('dblclick', function (e) {
		var bar = e.target.closest('.titlebar');
		if (!bar || e.target.closest('.box') || phone.matches) { return; }
		var win = bar.closest('.window');
		if (win.dataset.kind !== 'alert') { win.classList.toggle('is-shaded'); }
	});

	document.addEventListener('keydown', function (e) {
		if (e.key !== 'Escape') { return; }
		if (document.querySelector('.menu-title[aria-expanded="true"]')) {
			closeMenus(true);
			return;
		}
		var win = layer.querySelector('.window.is-active');
		if (win) { close(win); }
	});

	/* ---------- menu bar ---------- */

	function blink(item, done) {
		var n = 0;
		var timer = setInterval(function () {
			n++;
			item.classList.toggle('is-blink', n % 2 === 1);
			item.classList.toggle('is-lit', n % 2 === 0);
			if (n >= 6) {
				clearInterval(timer);
				item.classList.remove('is-blink', 'is-lit');
				done();
			}
		}, 45);
	}

	function closeMenus(refocus) {
		Array.prototype.forEach.call(document.querySelectorAll('.menu-title[aria-expanded="true"]'), function (btn) {
			btn.setAttribute('aria-expanded', 'false');
			btn.parentNode.querySelector('.menu-list').hidden = true;
			if (refocus) { btn.focus(); }
		});
	}

	function toggleMenu(menu) {
		var btn = menu.querySelector('.menu-title');
		var open = btn.getAttribute('aria-expanded') === 'true';
		closeMenus();
		if (!open) {
			btn.setAttribute('aria-expanded', 'true');
			menu.querySelector('.menu-list').hidden = false;
		}
	}

	// With one menu open, moving across the bar opens the others, as it did then.
	document.addEventListener('mouseover', function (e) {
		var title = e.target.closest('.menu-title');
		if (!title || title.getAttribute('aria-expanded') === 'true') { return; }
		if (document.querySelector('.menu-title[aria-expanded="true"]')) {
			toggleMenu(title.parentNode);
		}
	});

	function run(cmd) {
		if (cmd === 'close') {
			close(layer.querySelector('.window.is-active') || topWin());
		} else if (cmd === 'close-all') {
			closeAll();
		} else if (cmd === 'strip') {
			var strip = document.querySelector('.strip');
			if (strip) { strip.classList.toggle('is-closed'); }
		} else if (cmd === 'clean-up') {
			cleanUp();
		} else if (cmd === 'empty-trash') {
			alertBox('The Trash cannot be emptied. Some things are worth keeping.', 'Trash');
		} else if (Platinum.commands[cmd]) {
			Platinum.commands[cmd]();
		} else {
			openApp(cmd);
		}
	}

	/* ---------- browser window ---------- */

	// Hovering a link shows where it goes, in the address field and the status line.
	function browserHover(e, on) {
		var link = e.target.closest ? e.target.closest('.browser-body a[href]') : null;
		if (!link) { return; }
		var box = link.closest('.browser');
		var url = box.querySelector('.browser-url');
		var status = box.querySelector('.browser-status');
		if (on) {
			url.textContent = link.href;
			status.textContent = 'Opens ' + link.hostname.replace(/^www\./, '') + ' in a new tab';
		} else {
			url.textContent = url.dataset.home || '';
			status.textContent = '';
		}
	}
	document.addEventListener('mouseover', function (e) { browserHover(e, true); });
	document.addEventListener('mouseout', function (e) { browserHover(e, false); });
	document.addEventListener('focusin', function (e) { browserHover(e, true); });
	document.addEventListener('focusout', function (e) { browserHover(e, false); });

	/* ---------- clock ---------- */

	var clock = document.querySelector('.clock');
	function tick() {
		if (!clock) { return; }
		var now = new Date();
		clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
		clock.dateTime = now.toISOString();
	}
	tick();
	setInterval(tick, 15000);

	/* ---------- back and forward ---------- */

	window.addEventListener('popstate', function () {
		if (isHome(location.href)) {
			if (phone.matches) { wins().forEach(function (w) { w.remove(); }); syncTasks(); }
			document.title = siteTitle;
			return;
		}
		var existing = findByUrl(location.href);
		if (existing) {
			front(existing, { keepAddress: true, focus: true });
			document.title = existing.dataset.title || siteTitle;
		} else {
			openUrl(location.href, { push: false });
		}
	});

	/* ---------- public surface for the extras ---------- */

	var Platinum = window.Platinum = {
		apps: {},
		commands: {},
		openUrl: openUrl,
		openApp: openApp,
		alert: alertBox,
		dialog: dialog,
		refresh: refresh,
		close: close,
		activeWindow: function () { return layer.querySelector('.window.is-active'); },
		home: homeUrl.href,
		icons: function () {
			return Array.prototype.map.call(document.querySelectorAll('.icons .icon'), function (el) {
				return { name: el.querySelector('.icon-label').textContent.trim(), el: el };
			});
		},
		open: function (el) { activate(el); }
	};

	/* ---------- start ---------- */

	layoutIcons();
	if (phone.addEventListener) { phone.addEventListener('change', layoutIcons); }

	// A first visit opens the Read Me, once the start-up screen has gone.
	(function () {
		var readme = document.querySelector('.icons a.icon[href*="/read-me"]');
		var seen = true;
		try { seen = !!localStorage.getItem('platinum-welcomed'); } catch (e) {}
		if (!readme || seen || layer.querySelector('.window') || clean(location.href) !== clean(homeUrl.href)) { return; }
		var wait = setInterval(function () {
			if (document.documentElement.classList.contains('is-booting')) { return; }
			clearInterval(wait);
			try { localStorage.setItem('platinum-welcomed', '1'); } catch (e) {}
			if (!layer.querySelector('.window')) { activate(readme); }
		}, 300);
	})();

	var first = layer.querySelector('.window');
	if (first) {
		first.dataset.title = document.title;
		if (!first.dataset.url && first.dataset.kind !== 'alert') { first.dataset.url = clean(location.href); }
		adopt(first, { keepAddress: true });
	}
})();

/* The mail window: "Send" in the toolbar sends the form, like the button under the message. */
document.addEventListener('click', function (event) {
	var key = event.target.closest ? event.target.closest('[data-mail="send"]') : null;
	if (!key) { return; }
	var mail = key.closest('.mail');
	var form = mail && mail.querySelector('.doc--mail form');
	if (!form) { return; }
	var go = form.querySelector('button[type="submit"], input[type="submit"]');
	if (go) { go.click(); } else if (form.requestSubmit) { form.requestSubmit(); }
});
