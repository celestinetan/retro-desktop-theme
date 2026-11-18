/**
 * Desktop sounds, made by the browser itself: there are no audio files.
 * Every sound is an original, short and quiet. The speaker button in the
 * control strip switches them off, and the choice is remembered per visitor.
 * Browsers only allow sound after a first click or key press.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	var Ctx = window.AudioContext || window.webkitAudioContext;
	if (!P) { return; }

	var root = document.documentElement;
	var button = document.querySelector('[data-cmd="sound"]');
	var on = true;
	try { on = localStorage.getItem('platinum-sound') !== 'off'; } catch (e) {}
	var ctx = null;
	var master = null;
	var owesChime = root.classList.contains('is-booting');
	var quietUntil = 0;

	function show() {
		if (!button) { return; }
		button.setAttribute('aria-pressed', String(on));
		button.title = on ? 'Sound is on' : 'Sound is off';
	}

	function wake() {
		if (!Ctx || !on) { return null; }
		if (!ctx) {
			try {
				ctx = new Ctx();
				master = ctx.createGain();
				master.gain.value = 0.55;
				// A limiter, so the fuller sounds stay clean at this level.
				var limit = ctx.createDynamicsCompressor();
				limit.threshold.value = -10;
				limit.ratio.value = 8;
				master.connect(limit);
				limit.connect(ctx.destination);
			} catch (e) { ctx = null; return null; }
		}
		if (ctx.state === 'suspended') { ctx.resume(); }
		return ctx;
	}

	function tone(freq, at, dur, type, gain, endFreq, out) {
		var osc = ctx.createOscillator();
		var g = ctx.createGain();
		var t = ctx.currentTime + at;
		osc.type = type || 'sine';
		osc.frequency.setValueAtTime(freq, t);
		if (endFreq) { osc.frequency.exponentialRampToValueAtTime(endFreq, t + dur); }
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.012, dur / 3));
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		osc.connect(g);
		g.connect(out || master);
		osc.start(t);
		osc.stop(t + dur + 0.02);
	}

	var hiss = null;
	function noise(at, dur, gain, from, to, kind) {
		if (!hiss) {
			hiss = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
			var data = hiss.getChannelData(0);
			for (var i = 0; i < data.length; i++) { data[i] = Math.random() * 2 - 1; }
		}
		var src = ctx.createBufferSource();
		var filter = ctx.createBiquadFilter();
		var g = ctx.createGain();
		var t = ctx.currentTime + at;
		src.buffer = hiss;
		src.loop = true;
		filter.type = kind || 'bandpass';
		filter.Q.value = 1.2;
		filter.frequency.setValueAtTime(from, t);
		if (to) { filter.frequency.exponentialRampToValueAtTime(to, t + dur); }
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(gain, t + Math.min(0.01, dur / 3));
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		src.connect(filter);
		filter.connect(g);
		g.connect(master);
		src.start(t, Math.random() * 0.5);
		src.stop(t + dur + 0.02);
	}

	// A short, woody knock: a tone that drops in pitch with a tiny click on the front.
	function pock(freq, dur, gain, at) {
		at = at || 0;
		tone(freq, at, dur, 'sine', gain, freq * 0.5);
		noise(at, 0.008, gain * 1.3, 4200, 0, 'highpass');
	}

	// The sounds follow the scheme of a late-1990s desktop: every small action
	// answers with its own short knock, click or swish.
	var SOUNDS = {
		// Menus
		menuOpen: function () { pock(700, 0.045, 0.5); },
		menuItem: function () { pock(1900, 0.012, 0.1); },
		menuClose: function () { pock(480, 0.05, 0.4); },
		select: function () { pock(1100, 0.03, 0.5); pock(1500, 0.04, 0.5, 0.055); },
		// Buttons and other controls: one sound going down, another coming up
		press: function () { pock(1300, 0.02, 0.45); },
		release: function () { pock(900, 0.028, 0.4); },
		tick: function () { pock(1600, 0.016, 0.3); },
		// Icons
		pick: function () { pock(1000, 0.025, 0.3); },
		lift: function () { noise(0, 0.07, 1.5, 900, 2400); },
		drop: function () { pock(300, 0.07, 0.7); noise(0, 0.05, 1.2, 500, 200, 'lowpass'); },
		// Windows
		open: function () { noise(0, 0.14, 2.2, 400, 3000); tone(350, 0, 0.13, 'triangle', 0.3, 900); },
		close: function () { noise(0, 0.14, 2.2, 3000, 400); tone(900, 0, 0.13, 'triangle', 0.3, 350); },
		collapse: function () { noise(0, 0.09, 2, 2400, 500); pock(260, 0.06, 0.7, 0.09); },
		expand: function () { pock(260, 0.04, 0.5); noise(0.03, 0.09, 2, 500, 2400); },
		zoom: function () { tone(400, 0, 0.06, 'triangle', 0.45, 800); pock(800, 0.03, 0.4, 0.06); },
		grab: function () { pock(500, 0.03, 0.4); },
		thunk: function () { pock(220, 0.09, 0.8); },
		// Messages and the Trash
		alert: function () { tone(523.25, 0, 0.14, 'sine', 0.8); tone(392, 0.15, 0.24, 'sine', 0.8); },
		trash: function () {
			for (var i = 0; i < 12; i++) {
				noise(Math.random() * 0.5, 0.04 + Math.random() * 0.06, 2.4, 800 + Math.random() * 2400, 0);
			}
		},
		// Games
		card: function () { noise(0, 0.05, 2.2, 1700, 800, 'lowpass'); tone(220, 0, 0.04, 'sine', 0.3); },
		flag: function () { tone(660, 0, 0.05, 'square', 0.2); },
		boom: function () { noise(0, 0.6, 3, 500, 50, 'lowpass'); tone(95, 0, 0.5, 'sine', 1.4, 38); },
		win: function () {
			[523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { tone(f, i * 0.11, 0.24, 'triangle', 0.55); });
		},
		// The start-up chord: a wide, slow-fading major chord with an added ninth.
		chime: function () {
			var soft = ctx.createBiquadFilter();
			soft.type = 'lowpass';
			soft.frequency.value = 2200;
			soft.connect(master);
			[98, 146.83, 196, 293.66, 392, 493.88, 587.33, 880].forEach(function (f, i) {
				tone(f, 0, 2.8 - i * 0.12, 'sine', 0.42 - i * 0.03, 0, soft);
				tone(f * 2.003, 0.01, 1.6, 'triangle', 0.06, 0, soft);
			});
		}
	};

	function play(name) {
		if (!on || !SOUNDS[name] || !wake() || ctx.state !== 'running') { return; }
		try { SOUNDS[name](); } catch (e) {}
	}

	P.sound = play;

	P.commands.sound = function () {
		on = !on;
		try { localStorage.setItem('platinum-sound', on ? 'on' : 'off'); } catch (e) {}
		show();
		if (on) { wake(); setTimeout(function () { play('select'); }, 60); }
	};

	// The first click or key press of a visit unlocks sound, and plays the
	// start-up chord if the start-up screen was shown.
	function first() {
		document.removeEventListener('pointerdown', first, true);
		document.removeEventListener('keydown', first, true);
		if (!wake()) { return; }
		if (owesChime) {
			owesChime = false;
			quietUntil = Date.now() + 500;
			setTimeout(function () { play('chime'); }, 80);
		}
	}
	document.addEventListener('pointerdown', first, true);
	document.addEventListener('keydown', first, true);

	// The chitter of something being dragged: a run of tiny, dry ticks that follows
	// the pointer, faster when it moves faster and silent when it stops.
	var lastChit = 0;
	function chit(gain) {
		var now = Date.now();
		if (now - lastChit < 24) { return; }
		if (!on || !wake() || ctx.state !== 'running') { return; }
		lastChit = now;
		var pitch = 2100 + Math.random() * 900;
		tone(pitch, 0, 0.009, 'square', gain * 0.5, pitch * 0.7);
		noise(0, 0.007, gain * 2.2, 5200, 0, 'highpass');
	}

	var CONTROL = '.button, .strip button, .box, .mail-tool, .wp-btn, .write-key, .player-key, .player-x, .mines-face, .tile, .chip, .swatch, .task, [data-ok]';

	// Pressing: controls knock on the way down, icons answer when picked, and
	// anything dragged makes one sound when it starts to move and another when let go.
	document.addEventListener('pointerdown', function (e) {
		var t = e.target;
		if (!t.closest || e.button !== 0) { return; }
		if (t.closest('[data-cmd="sound"]')) { return; }

		var title = t.closest('.menu-title');
		if (title) { play(title.getAttribute('aria-expanded') === 'true' ? 'menuClose' : 'menuOpen'); return; }

		var held = t.closest(CONTROL);
		if (held) {
			play('press');
			var up = function () {
				window.removeEventListener('pointerup', up, true);
				window.removeEventListener('pointercancel', up, true);
				play('release');
			};
			window.addEventListener('pointerup', up, true);
			window.addEventListener('pointercancel', up, true);
			return;
		}

		var icon = t.closest('.icon');
		var bar = !icon && t.closest('.titlebar, .grow');
		if (!icon && !bar) { return; }
		if (icon) { play('pick'); }
		// Nothing is dragged on a phone or with a finger; a swipe there is just scrolling.
		if (e.pointerType === 'touch' || window.matchMedia('(max-width: 767px)').matches) { return; }
		var x = e.clientX;
		var y = e.clientY;
		var moving = false;
		var move = function (ev) {
			var gone = Math.abs(ev.clientX - x) + Math.abs(ev.clientY - y);
			if (!moving) {
				if (gone < 6) { return; }
				moving = true;
				play(icon ? 'lift' : 'grab');
			} else if (gone < 9) {
				return; // one tick for every few pixels travelled
			} else {
				chit(icon ? 0.22 : 0.3);
			}
			x = ev.clientX;
			y = ev.clientY;
		};
		var end = function () {
			window.removeEventListener('pointermove', move, true);
			window.removeEventListener('pointerup', end, true);
			window.removeEventListener('pointercancel', end, true);
			if (moving) { play(icon ? 'drop' : 'thunk'); }
		};
		window.addEventListener('pointermove', move, true);
		window.addEventListener('pointerup', end, true);
		window.addEventListener('pointercancel', end, true);
	}, true);

	// Moving through an open menu ticks softly from item to item.
	var lastItem = null;
	document.addEventListener('pointerover', function (e) {
		var item = e.target.closest ? e.target.closest('.menu-list a, .menu-list button') : null;
		if (item && item !== lastItem) { play('menuItem'); }
		lastItem = item;
	}, true);

	document.addEventListener('click', function (e) {
		var t = e.target;
		if (!t.closest) { return; }
		if (t.closest('[data-cmd="sound"]')) { return; }
		if (t.closest('[data-cmd="restart"]')) { quietUntil = Date.now() + 600; setTimeout(function () { play('chime'); }, 250); return; }
		if (t.closest('[data-cmd="empty-trash"]')) { quietUntil = Date.now() + 600; setTimeout(function () { play('trash'); }, 250); return; }
		if (t.closest('.menu-list a, .menu-list button')) { play('select'); return; }
		var shade = t.closest('.box-shade');
		if (shade) {
			var win = shade.closest('.window');
			setTimeout(function () { play(win && win.classList.contains('is-shaded') ? 'collapse' : 'expand'); }, 0);
			return;
		}
		if (t.closest('.box-zoom')) { play('zoom'); return; }
		// Clicking away from an open menu closes it.
		if (!t.closest('.menu') && document.querySelector('.menu-title[aria-expanded="true"]')) { play('menuClose'); }
	}, true);

	document.addEventListener('change', function (e) {
		if (e.target.matches && e.target.matches('input[type="checkbox"], input[type="radio"], select')) { play('tick'); }
	}, true);

	document.addEventListener('dblclick', function (e) {
		var bar = e.target.closest ? e.target.closest('.titlebar') : null;
		if (!bar || e.target.closest('.box')) { return; }
		var win = bar.closest('.window');
		setTimeout(function () { play(win && win.classList.contains('is-shaded') ? 'collapse' : 'expand'); }, 0);
	}, true);

	// Windows arriving and leaving.
	var layer = document.querySelector('.windows');
	if (layer && window.MutationObserver) {
		new MutationObserver(function (changes) {
			if (Date.now() < quietUntil) { return; }
			changes.forEach(function (change) {
				Array.prototype.forEach.call(change.addedNodes, function (node) {
					if (node.nodeType === 1 && node.classList.contains('window')) {
						play(node.dataset.kind === 'alert' ? 'alert' : 'open');
					}
				});
				Array.prototype.forEach.call(change.removedNodes, function (node) {
					if (node.nodeType === 1 && node.classList.contains('window')) { play('close'); }
				});
			});
		}).observe(layer, { childList: true });
	}

	show();
})();
