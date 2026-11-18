/**
 * Terminal: a small command line for curious visitors.
 * Type "help" to see the commands.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }

	function names() {
		return P.icons().map(function (i) { return i.name; });
	}

	function find(word) {
		var want = word.toLowerCase();
		var icons = P.icons();
		return icons.filter(function (i) { return i.name.toLowerCase() === want; })[0] ||
			icons.filter(function (i) { return i.name.toLowerCase().indexOf(want) === 0; })[0] ||
			icons.filter(function (i) { return i.name.toLowerCase().indexOf(want) !== -1; })[0] || null;
	}

	function openNamed(word) {
		var icon = find(word);
		if (!icon) { return 'Nothing called "' + word + '" here. Type ls to see what there is.'; }
		P.open(icon.el);
		return 'Opening ' + icon.name + '.';
	}

	var COMMANDS = {
		help: function () {
			return [
				'ls              list what is on the desktop',
				'open <name>     open a folder or document, e.g. open creative',
				'about           open About',
				'contact         open Contact',
				'notes           open Notes',
				'puzzle          play the sliding puzzle',
				'mines           play Mines',
				'solitaire       play Solitaire',
				'paint           open Paint',
				'music           open the music player',
				'pattern <name>  change the desktop: ' + (P.wallpapers || []).join(', '),
				'date            today\'s date',
				'whoami          who is asking',
				'clear           clear this window'
			].join('\n');
		},
		ls: function () { return names().join('\n'); },
		open: function (arg) { return arg ? openNamed(arg) : 'Open what? Try: open creative'; },
		about: function () { return openNamed('about'); },
		contact: function () { return openNamed('contact'); },
		cv: function () { return openNamed('cv'); },
		notes: function () { return openNamed('notes'); },
		puzzle: function () { P.openApp('puzzle'); return 'Opening Puzzle.'; },
		mines: function () { P.openApp('mines'); return 'Opening Mines.'; },
		solitaire: function () { P.openApp('solitaire'); return 'Opening Solitaire.'; },
		paint: function () { P.openApp('paint'); return 'Opening Paint.'; },
		music: function () { return P.openApp('player') ? 'Opening Music.' : 'There is no music here yet.'; },
		colour: function (arg) { return COMMANDS.pattern(arg); },
		color: function (arg) { return COMMANDS.pattern(arg); },
		pattern: function (arg) {
			if (!P.setWallpaper) { return 'Patterns are switched off.'; }
			if (!arg) { return 'Choose one of: ' + P.wallpapers.join(', '); }
			return P.setWallpaper(arg.toLowerCase()) ? 'Desktop set to ' + arg.toLowerCase() + '.' : 'No pattern called "' + arg + '". Choose one of: ' + P.wallpapers.join(', ');
		},
		date: function () { return new Date().toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); },
		whoami: function () { return 'A welcome guest.'; },
		hello: function () { return 'Hello. Type help to see what you can do.'; }
	};

	P.apps.terminal = function (win) {
		var out = win.querySelector('.terminal-out');
		var form = win.querySelector('.terminal-form');
		var input = win.querySelector('.terminal-input');
		var body = win.querySelector('.window-body');
		var history = [];
		var at = 0;

		function print(text) {
			out.textContent += text + '\n';
			body.scrollTop = body.scrollHeight;
		}

		print('Welcome. Type help and press Return.');

		form.addEventListener('submit', function (e) {
			e.preventDefault();
			var line = input.value.trim();
			input.value = '';
			if (!line) { return; }
			history.push(line);
			at = history.length;
			print('> ' + line);
			var parts = line.split(/\s+/);
			var name = parts[0].toLowerCase();
			var arg = parts.slice(1).join(' ');
			if (name === 'clear') {
				out.textContent = '';
			} else if (COMMANDS[name]) {
				print(COMMANDS[name](arg));
			} else {
				print('"' + parts[0] + '" is not a command here. Type help to see the list.');
			}
		});

		input.addEventListener('keydown', function (e) {
			if (e.key === 'ArrowUp' && at > 0) {
				e.preventDefault();
				input.value = history[--at];
			} else if (e.key === 'ArrowDown' && at < history.length) {
				e.preventDefault();
				input.value = history[++at] || '';
			}
		});

		win.addEventListener('click', function (e) {
			if (!e.target.closest('.box') && !window.getSelection().toString()) { input.focus({ preventScroll: true }); }
		});

		setTimeout(function () { input.focus({ preventScroll: true }); }, 0);
	};
})();
