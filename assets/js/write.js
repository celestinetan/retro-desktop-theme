/**
 * Write: a word processor on the desktop, for the site's owner only.
 *
 * File > New Document opens a blank page. Save asks where it goes: Notes (a post),
 * the desktop (a page) or one of the folders (a project). File > Edit This Document
 * opens the document in the front window for changes.
 *
 * This file is only sent to someone who is logged in and allowed to write, and
 * WordPress checks that again on every save.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	var cfg = window.PLATINUM || {};
	if (!P || !cfg.rest || !cfg.nonce) { return; }

	// The kinds of content this editor can open without losing anything.
	var SIMPLE = ['paragraph', 'heading', 'list', 'list-item', 'quote', 'image'];

	/* ---------- talking to WordPress ---------- */

	function api(path, opts) {
		opts = opts || {};
		var headers = opts.headers || {};
		headers['X-WP-Nonce'] = cfg.nonce;
		if (opts.json) { headers['Content-Type'] = 'application/json'; }
		return fetch(cfg.rest + path, {
			method: opts.method || 'GET',
			credentials: 'same-origin',
			headers: headers,
			body: opts.json ? JSON.stringify(opts.json) : opts.body
		}).then(function (res) {
			return res.json().catch(function () { return {}; }).then(function (data) {
				if (!res.ok) {
					var why = res.status === 401 || res.status === 403
						? 'You are no longer logged in, or not allowed to do this. Log in to WordPress in another tab, then try again.'
						: (data && data.message ? String(data.message).replace(/<[^>]+>/g, '') : 'WordPress did not accept it.');
					throw new Error(why);
				}
				return data;
			});
		});
	}

	/* ---------- turning the page into WordPress content and back ---------- */

	function esc(text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}

	function attr(text) {
		return esc(text).replace(/"/g, '&quot;');
	}

	// Keeps bold, italic, underline, links and line breaks; drops everything else.
	function inline(node) {
		var out = '';
		Array.prototype.forEach.call(node.childNodes, function (c) {
			if (c.nodeType === 3) {
				out += esc(c.nodeValue);
			} else if (c.nodeType === 1) {
				var tag = c.tagName.toLowerCase();
				var inner = inline(c);
				if (tag === 'br') {
					out += '<br>';
				} else if (tag === 'img') {
					out += '';
				} else if ((tag === 'b' || tag === 'strong') && inner) {
					out += '<strong>' + inner + '</strong>';
				} else if ((tag === 'i' || tag === 'em') && inner) {
					out += '<em>' + inner + '</em>';
				} else if (tag === 'u' && inner) {
					out += '<u>' + inner + '</u>';
				} else if (tag === 'a' && c.getAttribute('href') && inner) {
					out += '<a href="' + attr(c.getAttribute('href')) + '">' + inner + '</a>';
				} else {
					out += inner;
				}
			}
		});
		return out;
	}

	function trimBreaks(html) {
		return html.replace(/^(\s|<br>)+|(\s|<br>)+$/g, '');
	}

	function imageBlock(img) {
		var id = parseInt(img.getAttribute('data-id'), 10);
		var src = attr(img.getAttribute('src') || '');
		var alt = attr(img.getAttribute('alt') || '');
		if (id) {
			return '<!-- wp:image {"id":' + id + ',"sizeSlug":"large","linkDestination":"none"} -->\n' +
				'<figure class="wp-block-image size-large"><img src="' + src + '" alt="' + alt + '" class="wp-image-' + id + '"/></figure>\n<!-- /wp:image -->';
		}
		return '<!-- wp:image -->\n<figure class="wp-block-image"><img src="' + src + '" alt="' + alt + '"/></figure>\n<!-- /wp:image -->';
	}

	// Writes the page out as WordPress blocks, so it also opens cleanly in the WordPress editor.
	function serialize(body) {
		var blocks = [];
		var firstImage = 0;

		function paragraph(html) {
			html = trimBreaks(html);
			if (html) { blocks.push('<!-- wp:paragraph -->\n<p>' + html + '</p>\n<!-- /wp:paragraph -->'); }
		}

		function pictures(node) {
			var list = node.tagName && node.tagName.toLowerCase() === 'img' ? [node] : (node.querySelectorAll ? node.querySelectorAll('img') : []);
			Array.prototype.forEach.call(list, function (img) {
				if (!firstImage) { firstImage = parseInt(img.getAttribute('data-id'), 10) || 0; }
				blocks.push(imageBlock(img));
			});
		}

		Array.prototype.forEach.call(body.childNodes, function (node) {
			if (node.nodeType === 3) {
				paragraph(esc(node.nodeValue));
				return;
			}
			if (node.nodeType !== 1) { return; }
			var tag = node.tagName.toLowerCase();
			if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4') {
				var level = tag === 'h3' || tag === 'h4' ? 3 : 2;
				var text = trimBreaks(inline(node));
				if (text) {
					blocks.push('<!-- wp:heading' + (level === 3 ? ' {"level":3}' : '') + ' -->\n<h' + level + ' class="wp-block-heading">' + text + '</h' + level + '>\n<!-- /wp:heading -->');
				}
			} else if (tag === 'ul' || tag === 'ol') {
				var items = Array.prototype.filter.call(node.children, function (li) { return li.tagName.toLowerCase() === 'li'; })
					.map(function (li) { return trimBreaks(inline(li)); })
					.filter(Boolean)
					.map(function (li) { return '<!-- wp:list-item -->\n<li>' + li + '</li>\n<!-- /wp:list-item -->'; });
				if (items.length) {
					blocks.push('<!-- wp:list' + (tag === 'ol' ? ' {"ordered":true}' : '') + ' -->\n<' + tag + ' class="wp-block-list">' + items.join('\n') + '</' + tag + '>\n<!-- /wp:list -->');
				}
			} else if (tag === 'blockquote') {
				var quote = trimBreaks(inline(node));
				if (quote) {
					blocks.push('<!-- wp:quote -->\n<blockquote class="wp-block-quote"><!-- wp:paragraph -->\n<p>' + quote + '</p>\n<!-- /wp:paragraph --></blockquote>\n<!-- /wp:quote -->');
				}
			} else {
				paragraph(inline(node));
			}
			pictures(node);
		});

		return { content: blocks.join('\n\n'), firstImage: firstImage };
	}

	// True when saved content holds only things this editor understands.
	function isSimple(raw) {
		var re = /<!--\s+wp:([a-z0-9\/-]+)/g;
		var m;
		while ((m = re.exec(raw))) {
			if (SIMPLE.indexOf(m[1]) === -1) { return false; }
		}
		return true;
	}

	// Turns saved content back into an editable page.
	function toEditor(raw) {
		var box = document.createElement('div');
		box.innerHTML = String(raw).replace(/<!--[\s\S]*?-->/g, '');
		Array.prototype.forEach.call(box.querySelectorAll('figure'), function (figure) {
			var img = figure.querySelector('img');
			var p = document.createElement('p');
			if (img) {
				var id = (img.className.match(/wp-image-(\d+)/) || [])[1];
				var copy = document.createElement('img');
				copy.src = img.getAttribute('src') || '';
				copy.alt = img.getAttribute('alt') || '';
				if (id) { copy.setAttribute('data-id', id); }
				p.appendChild(copy);
			}
			figure.replaceWith(p);
		});
		Array.prototype.forEach.call(box.querySelectorAll('[class], [style]'), function (el) {
			el.removeAttribute('class');
			el.removeAttribute('style');
		});
		var html = box.innerHTML.trim();
		return html || '<p><br></p>';
	}

	P.writeTools = { serialize: serialize, isSimple: isSimple, toEditor: toEditor };
	P.api = api;

	/* ---------- the window ---------- */

	function editorWindow() {
		return document.querySelector('.windows .window[data-app="write"]');
	}

	P.apps.write = function (win) {
		var title = win.querySelector('.write-title');
		var body = win.querySelector('.write-body');
		var status = win.querySelector('.write-status');
		var style = win.querySelector('.write-style');
		var file = win.querySelector('.write-file');
		var saveBtn = win.querySelector('.write-save');
		var state = { id: 0, type: '', status: '', dirty: false, busy: false, target: '' };
		var range = null;

		try {
			document.execCommand('defaultParagraphSeparator', false, 'p');
			document.execCommand('styleWithCSS', false, false);
		} catch (e) {}

		function name() {
			return title.textContent.trim() || 'Untitled';
		}

		function say(text) {
			status.textContent = text;
		}

		function rename() {
			win.setAttribute('aria-label', name());
			win.querySelector('.title').textContent = name();
		}

		function touch() {
			state.dirty = true;
			if (!state.busy) { say(state.id ? 'Changes not saved yet.' : 'Not saved yet.'); }
		}

		function remember() {
			var sel = window.getSelection();
			if (sel.rangeCount && body.contains(sel.anchorNode)) { range = sel.getRangeAt(0).cloneRange(); }
		}

		function recall() {
			body.focus({ preventScroll: true });
			if (range) {
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}

		function format(cmd, value) {
			recall();
			document.execCommand(cmd, false, value || null);
			remember();
			touch();
		}

		// Shows which paragraph style the cursor is in.
		function reflect() {
			var sel = window.getSelection();
			if (!sel.rangeCount || !body.contains(sel.anchorNode)) { return; }
			var node = sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode;
			var block = node.closest ? node.closest('h2, h3, blockquote, p, li') : null;
			var tag = block && body.contains(block) ? block.tagName.toLowerCase() : 'p';
			style.value = tag === 'h2' || tag === 'h3' || tag === 'blockquote' ? tag : 'p';
		}

		title.addEventListener('input', function () { rename(); touch(); });
		title.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') { e.preventDefault(); body.focus(); }
		});
		body.addEventListener('input', touch);
		['keyup', 'mouseup', 'focus'].forEach(function (name) {
			body.addEventListener(name, function () { remember(); reflect(); });
		});

		// Pasted text arrives plain, so stray styling from other programs never gets in.
		[title, body].forEach(function (el) {
			el.addEventListener('paste', function (e) {
				e.preventDefault();
				var text = (e.clipboardData || window.clipboardData).getData('text/plain');
				if (el === title) { text = text.replace(/\s+/g, ' '); }
				document.execCommand('insertText', false, text);
			});
		});

		style.addEventListener('change', function () { format('formatBlock', '<' + style.value + '>'); });

		win.querySelector('.write-tools').addEventListener('mousedown', function (e) {
			// Keeps the text selection while a toolbar button is pressed.
			if (e.target.closest('button')) { e.preventDefault(); }
		});

		win.querySelector('.write-tools').addEventListener('click', function (e) {
			var btn = e.target.closest('button');
			if (!btn) { return; }
			if (btn.dataset.fmt) {
				format(btn.dataset.fmt);
			} else if (btn.dataset.act === 'link') {
				askLink();
			} else if (btn.dataset.act === 'picture') {
				file.click();
			} else if (btn.dataset.act === 'save') {
				save();
			}
		});

		win.addEventListener('keydown', function (e) {
			if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
				e.preventDefault();
				save();
			}
		});

		function askLink() {
			remember();
			var sel = window.getSelection();
			if (!range || sel.isCollapsed) {
				P.alert('Select the words that should become the link first.', 'Write');
				return;
			}
			var field = document.createElement('label');
			field.className = 'alert-field';
			field.innerHTML = '<span>Address</span><input type="url" placeholder="https://">';
			var input = field.querySelector('input');
			P.dialog('Write', 'Where should the link go?', [
				{ label: 'Cancel' },
				{ label: 'Add Link', primary: true, run: function () {
					var url = input.value.trim();
					if (!url) { return; }
					if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) { url = 'https://' + url; }
					format('createLink', url);
				} }
			], field);
		}

		file.addEventListener('change', function () {
			var picked = file.files && file.files[0];
			file.value = '';
			if (!picked) { return; }
			state.busy = true;
			say('Adding the picture…');
			api('media', {
				method: 'POST',
				headers: {
					'Content-Type': picked.type || 'application/octet-stream',
					'Content-Disposition': 'attachment; filename="' + picked.name.replace(/[^\w.\- ]+/g, '_') + '"'
				},
				body: picked
			}).then(function (media) {
				state.busy = false;
				var img = document.createElement('img');
				img.src = (media.media_details && media.media_details.sizes && media.media_details.sizes.large ? media.media_details.sizes.large.source_url : media.source_url);
				img.alt = '';
				img.setAttribute('data-id', media.id);
				var p = document.createElement('p');
				p.appendChild(img);
				var after = document.createElement('p');
				after.innerHTML = '<br>';
				body.appendChild(p);
				body.appendChild(after);
				p.scrollIntoView({ block: 'nearest' });
				touch();
			}).catch(function (err) {
				state.busy = false;
				say('');
				P.alert('The picture could not be added. ' + err.message, 'Write');
			});
		});

		/* ---------- saving ---------- */

		function send(type, extra, done) {
			var out = serialize(body);
			var payload = { title: name(), content: out.content };
			Object.keys(extra || {}).forEach(function (key) { payload[key] = extra[key]; });
			if (type === cfg.projects && out.firstImage) { payload.featured_media = out.firstImage; }
			state.busy = true;
			saveBtn.disabled = true;
			say('Saving…');
			api(type + (state.id ? '/' + state.id : ''), { method: 'POST', json: payload }).then(function (post) {
				state.busy = false;
				saveBtn.disabled = false;
				state.id = post.id;
				state.type = type;
				state.status = post.status;
				state.dirty = false;
				var at = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
				say(post.status === 'publish' ? 'Saved and on the site at ' + at + '.' : 'Saved as a draft at ' + at + '. Visitors cannot see it yet.');
				P.refresh();
				if (done) { done(); }
			}).catch(function (err) {
				state.busy = false;
				saveBtn.disabled = false;
				say('Not saved.');
				P.alert('The document could not be saved. ' + err.message + ' Your text is still here.', 'Write');
			});
		}

		// A new document asks where it should live, as a Save dialog would.
		function askWhere(done) {
			var box = document.createElement('div');
			box.className = 'alert-fields';
			var options = '<option value="posts">Notes</option>';
			if (cfg.canPages) { options += '<option value="pages">The desktop, as a document</option>'; }
			(cfg.folders || []).forEach(function (f) {
				options += '<option value="folder:' + f.id + '">' + esc(f.name) + ' folder</option>';
			});
			box.innerHTML =
				'<label class="alert-field"><span>Where</span><select>' + options + '</select></label>' +
				'<label class="alert-check"><input type="checkbox"> Keep as a draft, hidden from visitors</label>';
			var where = box.querySelector('select');
			if (state.target) { where.value = state.target; }
			var draft = box.querySelector('input');
			if (!cfg.canPublish) { draft.checked = true; draft.disabled = true; }
			P.dialog('Save', 'Save “' + name() + '” to:', [
				{ label: 'Cancel' },
				{ label: 'Save', primary: true, run: function () {
					var extra = { status: draft.checked ? 'draft' : 'publish' };
					var type = where.value;
					if (type.indexOf('folder:') === 0) {
						extra[cfg.folderKey] = [parseInt(type.slice(7), 10)];
						type = cfg.projects;
					}
					send(type, extra, done);
				} }
			], box);
		}

		function save(done) {
			if (state.busy) { return; }
			if (!title.textContent.trim()) {
				P.alert('Give the document a name first. Type it at the top of the page.', 'Write');
				title.focus();
				return;
			}
			if (state.id) { send(state.type, {}, done); } else { askWhere(done); }
		}

		// Closing with unsaved work asks first.
		win.platinumBeforeClose = function () {
			if (!state.dirty) { return true; }
			P.dialog('Write', 'Save changes to the document “' + name() + '” before closing?', [
				{ label: 'Don’t Save', run: function () { state.dirty = false; P.close(win, { force: true }); } },
				{ label: 'Cancel' },
				{ label: 'Save', primary: true, run: function () { save(function () { P.close(win, { force: true }); }); } }
			]);
			return false;
		};

		win.platinumSave = save;

		// Lets a command say where a new document is meant to go (for example, Notes).
		win.platinumTarget = function (type) { state.target = type; };
		win.platinumDirty = function () { return state.dirty; };

		// Opens an existing document for changes.
		win.platinumLoad = function (post, type) {
			state.id = post.id;
			state.type = type;
			state.status = post.status;
			state.dirty = false;
			title.textContent = post.title && post.title.raw ? post.title.raw : '';
			body.innerHTML = toEditor(post.content && post.content.raw ? post.content.raw : '');
			rename();
			say(post.status === 'publish' ? 'On the site. Save to update it.' : 'A draft. Visitors cannot see it yet.');
		};

		say('Not saved yet.');
		setTimeout(function () { title.focus({ preventScroll: true }); }, 0);
	};

	window.addEventListener('beforeunload', function (e) {
		var win = editorWindow();
		if (win && win.platinumDirty && win.platinumDirty()) {
			e.preventDefault();
			e.returnValue = '';
		}
	});

	/* ---------- menu commands ---------- */

	// One document is open for writing at a time.
	function freshEditor() {
		var open = editorWindow();
		if (open && open.platinumDirty && open.platinumDirty()) {
			P.openApp('write');
			P.alert('Save or close the document you are working on first.', 'Write');
			return null;
		}
		if (open) { P.close(open, { force: true }); }
		return P.openApp('write');
	}

	// A new document started while a folder is in front is meant for that folder:
	// the Save dialog opens with it already chosen.
	P.commands.write = function () {
		var front = P.activeWindow();
		var term = front && front.dataset.kind === 'folder' ? front.dataset.term : '';
		var win = freshEditor();
		if (win && term && win.platinumTarget) { win.platinumTarget('folder:' + term); }
	};

	// A new note: the same page, with Notes already chosen in the Save dialog.
	P.commands['new-note'] = function () {
		var win = freshEditor();
		if (win && win.platinumTarget) { win.platinumTarget('posts'); }
	};

	P.commands['save-doc'] = function () {
		var win = editorWindow();
		if (win && win.platinumSave) { P.openApp('write'); win.platinumSave(); } else { P.alert('There is no document open for writing. Choose File, then New Document.', 'Write'); }
	};

	P.commands['edit-doc'] = function () {
		var front = P.activeWindow();
		if (front && front.dataset.app === 'write') { return; }
		var from = front && front.dataset.id && front.dataset.rest ? front : document.querySelector('.icon.is-selected[data-id][data-rest]');
		if (!from) {
			P.alert('Click a document once to select it, or open it, then choose Edit This Document.', 'Write');
			return;
		}
		var id = from.dataset.id;
		var type = from.dataset.rest;
		api(type + '/' + id + '?context=edit').then(function (post) {
			var raw = post.content && post.content.raw ? post.content.raw : '';
			if (!isSimple(raw)) {
				P.dialog('Write', 'This document has parts that can only be changed in WordPress, such as a form, a file or an embedded player.', [
					{ label: 'Cancel' },
					{ label: 'Open in WordPress', primary: true, run: function () { window.open(cfg.admin + 'post.php?post=' + id + '&action=edit', '_blank', 'noopener'); } }
				]);
				return;
			}
			var win = freshEditor();
			if (win && win.platinumLoad) { win.platinumLoad(post, type); }
		}).catch(function (err) {
			P.alert('The document could not be opened for editing. ' + err.message, 'Write');
		});
	};
})();
