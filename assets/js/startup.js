/**
 * Start-up screen: shown once per visitor for about two seconds.
 * Any click or key skips it. "Restart" in the Special menu shows it again.
 * Never shown to visitors who ask for reduced motion.
 */
(function () {
	'use strict';

	var root = document.documentElement;
	var screen = document.querySelector('.startup');
	if (!screen || !window.Platinum) { return; }
	var timer = null;

	function finish() {
		clearTimeout(timer);
		root.classList.remove('is-booting');
		try { localStorage.setItem('platinum-booted', '1'); } catch (e) {}
		document.removeEventListener('keydown', finish, true);
		screen.removeEventListener('click', finish);
	}

	function start() {
		root.classList.add('is-booting');
		timer = setTimeout(finish, 2600);
		document.addEventListener('keydown', finish, true);
		screen.addEventListener('click', finish);
	}

	if (root.classList.contains('is-booting')) { start(); }

	window.Platinum.commands.restart = function () {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			window.Platinum.alert('Restarted.', 'Restart');
			return;
		}
		root.classList.remove('is-booting');
		void screen.offsetWidth; // lets the progress bar start again from empty
		start();
	};
})();
