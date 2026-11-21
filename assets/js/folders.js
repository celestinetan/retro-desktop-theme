/**
 * Folders, for the site's owner only: make a new folder (on the desktop or
 * inside another folder), rename one, drag projects and folders into a folder,
 * and drag a folder out of its window onto the desktop.
 *
 * A folder is a Portfolio project type in WordPress. Like write.js, this file is
 * only sent to someone who is logged in, and WordPress checks every change.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	var cfg = window.PLATINUM || {};
	if (!P || !P.api || !cfg.folderKey) { return; }

	function field(label, value) {
		var wrap = document.createElement('label');
		wrap.className = 'alert-field';
		wrap.innerHTML = '<span></span><input type="text" maxlength="60">';
		wrap.querySelector('span').textContent = label;
		wrap.querySelector('input').value = value || '';
		return wrap;
	}

	function refused(what, err) {
		P.alert(what + ' ' + err.message, 'Folders');
	}

	function allowed() {
		if (cfg.canFolders) { return true; }
		P.alert('Your WordPress account is not allowed to change folders.', 'Folders');
		return false;
	}

	/* ---------- new folder ---------- */

	// The folder window in front, if there is one: a new folder goes inside it.
	function frontFolder() {
		var front = P.activeWindow();
		if (front && front.dataset.term) { return { term: front.dataset.term, name: front.querySelector('.title').textContent.trim() }; }
		return null;
	}

	P.commands['new-folder'] = function () {
		if (!allowed()) { return; }
		var inside = frontFolder();
		var box = field('Name', 'untitled folder');
		var input = box.querySelector('input');
		var where = inside ? 'It goes inside “' + inside.name + '”.' : 'It appears on the desktop straight away.';
		P.dialog('New Folder', 'Name the new folder. ' + where, [
			{ label: 'Cancel' },
			{ label: 'Create', primary: true, run: function () {
				var name = input.value.trim();
				if (!name) { return; }
				var json = { name: name };
				if (inside) { json.parent = parseInt(inside.term, 10); }
				P.api(cfg.folderKey, { method: 'POST', json: json })
					.then(function () { return P.refresh(); })
					.catch(function (err) { refused('The folder could not be created.', err); });
			} }
		], box);
		input.select();
	};

	/* ---------- rename ---------- */

	function saveName(icon, name) {
		var label = icon.querySelector('.icon-label');
		var old = label.textContent;
		name = name.trim();
		if (!name || name === old.trim()) { return; }
		label.textContent = name;
		// A folder is renamed as a project type; a file is renamed by its title.
		var change = icon.dataset.term
			? P.api(cfg.folderKey + '/' + icon.dataset.term, { method: 'POST', json: { name: name } })
			: P.api(icon.dataset.rest + '/' + icon.dataset.id, { method: 'POST', json: { title: name } });
		change.then(function () { return P.refresh(); })
			.catch(function (err) {
				label.textContent = old;
				refused('It could not be renamed.', err);
			});
	}

	// Typing straight onto the icon's name, as on the real thing.
	function renameInPlace(icon) {
		if (document.querySelector('.icon-rename')) { return; }
		if (icon.dataset.term && !allowed()) { return; }
		var label = icon.querySelector('.icon-label');
		var r = label.getBoundingClientRect();
		var input = document.createElement('input');
		input.type = 'text';
		input.className = 'icon-rename';
		input.maxLength = icon.dataset.term ? 60 : 120;
		input.value = label.textContent.trim();
		input.setAttribute('aria-label', 'Name');
		var width = Math.max(110, r.width + 24);
		input.style.left = Math.round(r.left + r.width / 2 - width / 2) + 'px';
		input.style.top = Math.round(r.top - 2) + 'px';
		input.style.width = width + 'px';
		document.body.appendChild(input);
		input.focus();
		input.select();
		var done = false;
		function finish(keep) {
			if (done) { return; }
			done = true;
			var value = input.value;
			input.remove();
			if (keep) { saveName(icon, value); }
		}
		input.addEventListener('keydown', function (e) {
			e.stopPropagation();
			if (e.key === 'Enter') { finish(true); } else if (e.key === 'Escape') { finish(false); }
		});
		input.addEventListener('blur', function () { finish(true); });
	}

	P.commands['rename-folder'] = function () {
		var icon = document.querySelector('.icon.is-selected[data-term], .icon.is-selected[data-id][data-rest]');
		if (!icon) {
			P.alert('Click a folder or a file once to select it, then choose Rename.', 'Rename');
			return;
		}
		renameInPlace(icon);
	};

	// Clicking the name of a folder that is already selected starts renaming it,
	// after a short pause so that a double-click still opens the folder.
	var wasSelected = null;
	var waiting = null;
	document.addEventListener('pointerdown', function (e) {
		var icon = e.target.closest ? e.target.closest('.icon[data-term], .icon[data-id][data-rest]') : null;
		wasSelected = icon && icon.classList.contains('is-selected') ? icon : null;
		clearTimeout(waiting);
	}, true);
	document.addEventListener('click', function (e) {
		var label = e.target.closest ? e.target.closest('.icon-label') : null;
		var icon = label && label.closest('.icon[data-term], .icon[data-id][data-rest]');
		if (!icon || icon !== wasSelected || e.detail !== 1 || e.shiftKey) { return; }
		waiting = setTimeout(function () {
			if (icon.classList.contains('is-selected') && document.body.contains(icon)) { renameInPlace(icon); }
		}, 450);
	});
	document.addEventListener('dblclick', function () { clearTimeout(waiting); });

	/* ---------- adding files from your computer ---------- */

	var note = null;
	function tell(text) {
		if (!text) {
			if (note) { note.remove(); note = null; }
			return;
		}
		if (!note) {
			note = document.createElement('div');
			note.className = 'desk-note';
			note.setAttribute('role', 'status');
			document.body.appendChild(note);
		}
		note.textContent = text;
	}

	function esc(text) {
		return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	// A readable name from a file name: no extension, no underscores.
	function nameOf(file) {
		return file.name.replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim() || 'Untitled';
	}

	// Puts one file into the media library, then makes it a file in the folder.
	function addOne(file, term) {
		var title = nameOf(file);
		return P.api('media', {
			method: 'POST',
			headers: {
				'Content-Type': file.type || 'application/octet-stream',
				'Content-Disposition': 'attachment; filename="' + file.name.replace(/[^\w.\- ]+/g, '_') + '"'
			},
			body: file
		}).then(function (media) {
			var url = media.source_url;
			var payload = { title: title, status: 'publish' };
			payload[cfg.folderKey] = [parseInt(term, 10)];
			if (/^image\//.test(media.mime_type || file.type)) {
				payload.featured_media = media.id;
				payload.content = '<!-- wp:image {"id":' + media.id + ',"sizeSlug":"large","linkDestination":"none"} -->\n<figure class="wp-block-image size-large"><img src="' + esc(url) + '" alt="" class="wp-image-' + media.id + '"/></figure>\n<!-- /wp:image -->';
			} else {
				payload.content = '<!-- wp:file {"id":' + media.id + ',"href":"' + esc(url) + '"} -->\n<div class="wp-block-file"><a id="wp-block-file--media-' + media.id + '" href="' + esc(url) + '">' + esc(title) + '</a><a href="' + esc(url) + '" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-' + media.id + '">Download</a></div>\n<!-- /wp:file -->';
			}
			return P.api(cfg.projects, { method: 'POST', json: payload });
		});
	}

	function addFiles(files, term, folderName) {
		files = Array.prototype.slice.call(files);
		if (!files.length) { return; }
		var failed = [];
		var done = 0;
		function next() {
			var file = files.shift();
			if (!file) {
				tell('');
				P.refresh();
				if (failed.length) {
					P.alert('Not added: ' + failed.join('; ') + '.', 'Add File');
				} else if (P.sound) {
					P.sound('drop');
				}
				return;
			}
			done++;
			tell('Adding “' + file.name + '” to ' + folderName + '… (' + done + ' of ' + (done + files.length) + ')');
			addOne(file, term).catch(function (err) {
				failed.push(file.name + ' (' + err.message + ')');
			}).then(next);
		}
		next();
	}

	// The folder a file is meant for: the folder window in front, or a selected folder.
	function folderInView() {
		var front = P.activeWindow();
		if (front && front.dataset.term) { return { term: front.dataset.term, name: front.querySelector('.title').textContent.trim() }; }
		var icon = document.querySelector('.icon.is-selected[data-term]');
		if (icon) { return { term: icon.dataset.term, name: icon.querySelector('.icon-label').textContent.trim() }; }
		return null;
	}

	var picker = document.createElement('input');
	picker.type = 'file';
	picker.multiple = true;
	picker.hidden = true;
	picker.accept = 'application/pdf,image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.key,.pages,.numbers,.txt,.zip';
	document.body.appendChild(picker);
	var pickFor = null;
	picker.addEventListener('change', function () {
		var files = Array.prototype.slice.call(picker.files || []);
		picker.value = '';
		if (pickFor && files.length) { addFiles(files, pickFor.term, pickFor.name); }
	});

	P.commands['add-file'] = function () {
		var target = folderInView();
		if (target) {
			pickFor = target;
			picker.click();
			return;
		}
		var folders = cfg.folders || [];
		if (!folders.length) {
			P.alert('Make a folder first: choose File, then New Folder.', 'Add File');
			return;
		}
		var box = document.createElement('div');
		box.className = 'alert-fields';
		box.innerHTML = '<label class="alert-field"><span>Folder</span><select>' + folders.map(function (f) {
			return '<option value="' + f.id + '">' + esc(f.name) + '</option>';
		}).join('') + '</select></label>';
		var where = box.querySelector('select');
		P.dialog('Add File', 'Which folder should the file go in?', [
			{ label: 'Cancel' },
			{ label: 'Choose File…', primary: true, run: function () {
				pickFor = { term: where.value, name: where.options[where.selectedIndex].text };
				picker.click();
			} }
		], box);
	};

	// Files dragged in from your computer and let go over a folder, or over an open folder window.
	function dropTarget(e) {
		var types = e.dataTransfer && e.dataTransfer.types;
		if (!types || Array.prototype.indexOf.call(types, 'Files') === -1) { return null; }
		var hit = e.target.closest ? e.target.closest('.icon[data-term], .window[data-term]') : null;
		if (!hit) { return { none: true }; }
		return {
			el: hit,
			term: hit.dataset.term,
			name: hit.classList.contains('icon') ? hit.querySelector('.icon-label').textContent.trim() : hit.querySelector('.title').textContent.trim()
		};
	}
	var lit = null;
	function light(el) {
		if (lit && lit !== el) { lit.classList.remove('is-drop'); }
		lit = el || null;
		if (lit) { lit.classList.add('is-drop'); }
	}
	document.addEventListener('dragover', function (e) {
		var target = dropTarget(e);
		if (!target) { return; }
		e.preventDefault();
		e.dataTransfer.dropEffect = target.none ? 'none' : 'copy';
		light(target.none ? null : target.el);
	});
	document.addEventListener('dragleave', function (e) {
		if (!e.relatedTarget) { light(null); }
	});
	document.addEventListener('drop', function (e) {
		var target = dropTarget(e);
		if (!target) { return; }
		e.preventDefault();
		light(null);
		if (target.none) {
			P.alert('Drop the file onto a folder, or into an open folder window.', 'Add File');
			return;
		}
		addFiles(e.dataTransfer.files, target.term, target.name);
	});

	/* ---------- moving documents to the Trash ---------- */

	// Takes documents off the site. WordPress keeps them in its own Trash for 30 days.
	function trashItems(items) {
		if (!items.length) { return; }
		var one = items.length === 1;
		var what = one ? '“' + items[0].name + '”' : 'these ' + items.length + ' items';
		P.dialog('Trash', 'Move ' + what + ' to the Trash? ' + (one ? 'It' : 'They') + ' will be taken off the site. For 30 days you can put ' + (one ? 'it' : 'them') + ' back from the Trash in WordPress.', [
			{ label: 'Cancel' },
			{ label: 'Move to Trash', primary: true, run: function () {
				Promise.all(items.map(function (item) {
					return P.api(item.rest + '/' + item.id, { method: 'DELETE' });
				})).then(function () {
					items.forEach(function (item) {
						var open = document.querySelector('.windows .window[data-id="' + item.id + '"]');
						if (open && open.dataset.app !== 'write') { P.close(open, { force: true, quiet: true }); }
					});
					if (P.sound) { P.sound('trash'); }
					return P.refresh();
				}).catch(function (err) {
					P.refresh();
					P.alert('Not everything could be moved to the Trash. ' + err.message, 'Trash');
				});
			} }
		]);
	}

	function asItem(icon) {
		return { id: icon.dataset.id, rest: icon.dataset.rest, name: icon.querySelector('.icon-label').textContent.trim() };
	}

	// Icons let go over the Trash. Returns true when it has dealt with them.
	function dropOnTrash(icons) {
		var docs = icons.filter(function (icon) { return icon.dataset.id && icon.dataset.rest; });
		if (docs.length) {
			trashItems(docs.map(asItem));
			return true;
		}
		if (icons.some(function (icon) { return icon.dataset.term; })) {
			P.alert('A folder cannot be put in the Trash from here. To remove one, go to Portfolio > Project Types in WordPress.', 'Trash');
			return true;
		}
		return false; // Notes, Portfolio and the like: just a move on the desktop
	}

	// File > Move to Trash: the document in front, or the files selected in a folder or on the desktop.
	P.commands['trash-doc'] = function () {
		var front = P.activeWindow();
		var items = [];
		if (front && front.dataset.id && front.dataset.rest && front.dataset.app !== 'write') {
			items.push({ id: front.dataset.id, rest: front.dataset.rest, name: front.querySelector('.title').textContent.trim() });
		} else {
			items = Array.prototype.map.call(document.querySelectorAll('.icon.is-selected[data-id][data-rest]'), asItem);
		}
		if (!items.length) {
			P.alert('Click a document once to select it, or open it, then choose Move to Trash.', 'Trash');
			return;
		}
		trashItems(items);
	};

	/* ---------- folders inside folders ---------- */

	// Every folder inside this one, at any depth, from the list the page was given.
	function within(term) {
		var all = cfg.folders || [];
		var found = [term];
		for (var i = 0; i < found.length; i++) {
			all.forEach(function (f) {
				if (f.parent === found[i] && found.indexOf(f.id) === -1) { found.push(f.id); }
			});
		}
		return found;
	}

	function parentOf(term) {
		var match = (cfg.folders || []).filter(function (f) { return f.id === term; })[0];
		return match ? match.parent : 0;
	}

	// Puts folders inside another folder (parent > 0) or back on the desktop (parent 0).
	function moveFolders(icons, parent, name) {
		if (!allowed()) { return true; }
		var moving = icons.map(function (icon) { return parseInt(icon.dataset.term, 10); })
			.filter(function (term) { return parentOf(term) !== parent; });
		if (!moving.length) { return false; } // already there: just a move within the window
		var loop = moving.filter(function (term) { return parent && within(term).indexOf(parent) !== -1; });
		if (loop.length) {
			P.alert('A folder cannot go inside itself, or inside a folder it holds.', 'Folders');
			return true;
		}
		Promise.all(moving.map(function (term) {
			return P.api(cfg.folderKey + '/' + term, { method: 'POST', json: { parent: parent } });
		})).then(function () {
			if (P.sound) { P.sound('drop'); }
			return P.refresh();
		}).catch(function (err) {
			P.refresh();
			refused('Not every folder could be moved to “' + name + '”.', err);
		});
		return true;
	}

	// Called by the desktop when icons are dragged out of a folder window and let go on the
	// desktop itself. A folder comes out onto the desktop; files stay where they are.
	P.dropOnDesktop = function (icons) {
		var folders = icons.filter(function (icon) { return icon.dataset.term; });
		if (!folders.length) { return false; }
		return moveFolders(folders, 0, 'the desktop');
	};

	/* ---------- dropping projects on a folder ---------- */

	// Called by the desktop when icons are let go over a folder. Returns true when it has dealt with them.
	P.dropOnFolder = function (icons, target, fromWindow) {
		if (target.trash) { return dropOnTrash(icons); }
		var projects = icons.filter(function (icon) { return icon.dataset.id && icon.dataset.rest === cfg.projects; });
		var folders = icons.filter(function (icon) { return icon.dataset.term; });
		var others = icons.filter(function (icon) { return projects.indexOf(icon) === -1 && !icon.dataset.term; });

		if (folders.length && !projects.length && !others.length) {
			return moveFolders(folders, parseInt(target.term, 10), target.name);
		}
		if (!projects.length) {
			if (!others.length) { return false; }
			var name = others[0].querySelector('.icon-label').textContent.trim();
			P.alert('“' + name + '” cannot go into a folder. Folders hold projects; this is a desktop document. To put it in a folder, open it, copy the text into a new document and save that to the folder.', 'Folders');
			return true;
		}
		if (fromWindow && fromWindow.dataset.term === String(target.term)) { return false; }

		var payload = {};
		payload[cfg.folderKey] = [parseInt(target.term, 10)];
		Promise.all(projects.map(function (icon) {
			return P.api(cfg.projects + '/' + icon.dataset.id, { method: 'POST', json: payload });
		})).then(function () {
			return P.refresh();
		}).catch(function (err) {
			P.refresh();
			refused('Not everything could be moved to “' + target.name + '”.', err);
		});
		return true;
	};
})();
