/**
 * Appearance: lets a visitor pick a desktop pattern.
 * The choice is remembered in their own browser only.
 * To add a colour: add a name here and a matching
 * html[data-wallpaper="name"] line at the top of platinum.css.
 */
(function () {
	'use strict';

	if (!window.Platinum) { return; }
	var root = document.documentElement;
	var PATTERNS = [
		['lavender', 'Lavender', '#6a6ca6'],
		['azure', 'Azure', '#5f7fb6'],
		['sage', 'Sage', '#7c9c86'],
		['slate', 'Slate', '#5b626b'],
		['rose', 'Rose', '#bf8794']
	];

	function current() {
		return root.getAttribute('data-wallpaper') || 'lavender';
	}

	function choose(name) {
		if (name === 'lavender') {
			root.removeAttribute('data-wallpaper');
		} else {
			root.setAttribute('data-wallpaper', name);
		}
		try { localStorage.setItem('platinum-wallpaper', name); } catch (e) {}
	}

	window.Platinum.setWallpaper = function (name) {
		var ok = PATTERNS.some(function (p) { return p[0] === name; });
		if (ok) { choose(name); }
		return ok;
	};
	window.Platinum.wallpapers = PATTERNS.map(function (p) { return p[0]; });

	window.Platinum.apps.wallpaper = function (win) {
		var box = win.querySelector('.swatches');
		PATTERNS.forEach(function (p) {
			var btn = document.createElement('button');
			btn.type = 'button';
			btn.className = 'swatch';
			btn.style.setProperty('--swatch', p[2]);
			btn.setAttribute('role', 'radio');
			btn.setAttribute('aria-label', p[1]);
			btn.setAttribute('aria-checked', String(p[0] === current()));
			btn.addEventListener('click', function () {
				choose(p[0]);
				Array.prototype.forEach.call(box.children, function (el) {
					el.setAttribute('aria-checked', String(el === btn));
				});
			});
			box.appendChild(btn);
		});
	};
})();
