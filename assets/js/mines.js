/**
 * Mines: clear the field without stepping on a mine.
 * Click a square to open it; a number says how many mines touch it.
 * Right-click, press F, or switch on Flag to mark a square.
 * Click an open number whose flags are all placed to open the squares around it.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }

	// Width, height, mines.
	var LEVELS = [[9, 9, 10], [16, 16, 40], [30, 16, 99]];
	var small = window.matchMedia('(max-width: 767px)');

	// Seven-segment digits for the two counters.
	var SEGS = {
		a: '2,1 10,1 8,3 4,3',
		b: '11,2 11,9 9,8 9,4',
		c: '11,11 11,18 9,16 9,12',
		d: '2,19 10,19 8,17 4,17',
		e: '1,11 1,18 3,16 3,12',
		f: '1,2 1,9 3,8 3,4',
		g: '2,10 4,9 8,9 10,10 8,11 4,11'
	};
	var DIGITS = { '0': 'abcdef', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg', '-': 'g' };

	function led(el, value) {
		var n = Math.max(-99, Math.min(999, value));
		var text = n < 0 ? '-' + ('0' + Math.abs(n)).slice(-2) : ('00' + n).slice(-3);
		el.innerHTML = text.split('').map(function (ch) {
			var on = DIGITS[ch] || '';
			return '<svg viewBox="0 0 12 20" width="12" height="20" aria-hidden="true" focusable="false">' + Object.keys(SEGS).map(function (k) {
				return '<polygon points="' + SEGS[k] + '" class="' + (on.indexOf(k) === -1 ? 'off' : 'on') + '"/>';
			}).join('') + '</svg>';
		}).join('');
		el.setAttribute('aria-label', el.dataset.label + ': ' + value);
	}

	var FACES = {
		smile: '<circle cx="6.500" cy="8" r="1.300"/><circle cx="13.500" cy="8" r="1.300"/><path d="M5.500 12q4.500 4 9 0" fill="none" stroke="#000" stroke-width="1.300" stroke-linecap="round"/>',
		oh: '<circle cx="6.500" cy="8" r="1.300"/><circle cx="13.500" cy="8" r="1.300"/><circle cx="10" cy="13.500" r="2" fill="none" stroke="#000" stroke-width="1.300"/>',
		dead: '<path d="M5 6.500l3 3M8 6.500l-3 3M12 6.500l3 3M15 6.500l-3 3" stroke="#000" stroke-width="1.200"/><path d="M5.500 14.500q4.500-3.500 9 0" fill="none" stroke="#000" stroke-width="1.300" stroke-linecap="round"/>',
		cool: '<path d="M3 6.500h14v1.500l-1 2.500h-4l-1.500-2.500h-1L8 10.500H4L3 8z"/><path d="M5.500 13q4.500 3.500 9 0" fill="none" stroke="#000" stroke-width="1.300" stroke-linecap="round"/>'
	};

	P.apps.mines = function (win) {
		var grid = win.querySelector('.mines-grid');
		var status = win.querySelector('.mines-status');
		var leftEl = win.querySelector('.mines-left');
		var timeEl = win.querySelector('.mines-time');
		var flagBtn = win.querySelector('.mines-flag');
		var faceBtn = win.querySelector('.mines-new');
		var levelSel = win.querySelector('.mines-level');
		var W, H, MINES;
		var cells = [];
		var mine, open, flag, started, over, secs, timer, flagMode = false;

		function face(name) {
			faceBtn.innerHTML = '<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="8.500" fill="#ffe14a" stroke="#000" stroke-width="1.200"/>' + FACES[name] + '</svg>';
		}

		function around(i) {
			var x = i % W;
			var y = Math.floor(i / W);
			var list = [];
			for (var dy = -1; dy <= 1; dy++) {
				for (var dx = -1; dx <= 1; dx++) {
					var nx = x + dx;
					var ny = y + dy;
					if ((dx || dy) && nx >= 0 && ny >= 0 && nx < W && ny < H) { list.push(ny * W + nx); }
				}
			}
			return list;
		}

		function count(i) {
			return around(i).filter(function (n) { return mine[n]; }).length;
		}

		// Mines are placed after the first click, so the first square is always safe.
		function plant(safe) {
			var keep = around(safe).concat(safe);
			var placed = 0;
			while (placed < MINES) {
				var i = Math.floor(Math.random() * W * H);
				if (!mine[i] && keep.indexOf(i) === -1) {
					mine[i] = true;
					placed++;
				}
			}
		}

		function paint(i) {
			var cell = cells[i];
			var where = 'Row ' + (Math.floor(i / W) + 1) + ', column ' + (i % W + 1) + ': ';
			cell.className = 'cell';
			cell.removeAttribute('data-n');
			cell.textContent = '';
			if (open[i]) {
				cell.classList.add('is-open');
				if (mine[i]) {
					cell.classList.add('is-mine');
					cell.setAttribute('aria-label', where + 'mine');
				} else {
					var n = count(i);
					if (n) { cell.textContent = String(n); cell.dataset.n = String(n); }
					cell.setAttribute('aria-label', where + (n ? n + ' nearby' : 'empty'));
				}
			} else if (flag[i]) {
				cell.classList.add('is-flag');
				cell.setAttribute('aria-label', where + 'flagged');
			} else {
				cell.setAttribute('aria-label', where + 'closed');
			}
		}

		function header() {
			led(leftEl, MINES - flag.filter(Boolean).length);
			led(timeEl, secs);
		}

		function stop() {
			clearInterval(timer);
			timer = null;
		}

		function finish(won, hit) {
			over = true;
			stop();
			if (won) {
				mine.forEach(function (m, i) { if (m && !flag[i]) { flag[i] = true; paint(i); } });
				header();
				face('cool');
				if (P.sound) { P.sound('win'); }
				status.textContent = 'Field cleared in ' + secs + ' seconds.';
			} else {
				mine.forEach(function (m, i) { if (m && !flag[i]) { open[i] = true; paint(i); } });
				cells[hit].classList.add('is-hit');
				face('dead');
				if (P.sound) { P.sound('boom'); }
				status.textContent = 'That was a mine. Press the face to try again.';
			}
		}

		function start(i) {
			started = true;
			plant(i);
			timer = setInterval(function () {
				if (!win.isConnected) { stop(); return; }
				secs++;
				header();
			}, 1000);
		}

		// Opens one closed square. Returns false when it was a mine.
		function dig(i) {
			if (open[i] || flag[i]) { return true; }
			if (mine[i]) {
				open[i] = true;
				finish(false, i);
				return false;
			}
			var queue = [i];
			while (queue.length) {
				var c = queue.pop();
				if (open[c] || flag[c]) { continue; }
				open[c] = true;
				paint(c);
				if (!count(c)) { queue = queue.concat(around(c)); }
			}
			return true;
		}

		function reveal(i) {
			if (over || flag[i]) { return; }
			if (!started) { start(i); }
			if (open[i]) {
				// An open number with all its flags placed opens the rest around it.
				var near = around(i);
				var n = count(i);
				if (!n || near.filter(function (c) { return flag[c]; }).length !== n) { return; }
				for (var k = 0; k < near.length; k++) {
					if (!dig(near[k])) { return; }
				}
			} else if (!dig(i)) {
				return;
			}
			if (open.filter(Boolean).length === W * H - MINES) { finish(true); } else if (P.sound) { P.sound('tick'); }
		}

		function mark(i) {
			if (over || open[i]) { return; }
			flag[i] = !flag[i];
			if (P.sound) { P.sound('flag'); }
			paint(i);
			header();
		}

		function reset() {
			stop();
			mine = []; open = []; flag = [];
			for (var i = 0; i < W * H; i++) { mine.push(false); open.push(false); flag.push(false); }
			started = false;
			over = false;
			secs = 0;
			cells.forEach(function (c, n) { paint(n); });
			header();
			face('smile');
			status.textContent = MINES + ' mines are hidden. Open every other square.';
		}

		function build(level) {
			var size = LEVELS[small.matches ? 0 : level] || LEVELS[0];
			W = size[0]; H = size[1]; MINES = size[2];
			grid.textContent = '';
			grid.style.gridTemplateColumns = 'repeat(' + W + ', var(--cell))';
			cells = [];
			for (var i = 0; i < W * H; i++) {
				var cell = document.createElement('button');
				cell.type = 'button';
				cell.dataset.i = String(i);
				cell.tabIndex = i === 0 ? 0 : -1;
				grid.appendChild(cell);
				cells.push(cell);
			}
			reset();
			// Keep a bigger field on the screen.
			if (win.classList.contains('is-placed') && win.parentNode) {
				var room = win.parentNode.clientWidth;
				if (win.offsetLeft + win.offsetWidth > room) {
					win.style.left = Math.max(0, Math.round((room - win.offsetWidth) / 2)) + 'px';
				}
			}
		}

		grid.addEventListener('click', function (e) {
			var cell = e.target.closest('.cell');
			if (!cell) { return; }
			var i = parseInt(cell.dataset.i, 10);
			if (flagMode && !open[i]) { mark(i); } else { reveal(i); }
		});

		grid.addEventListener('pointerdown', function (e) {
			if (!over && e.button === 0 && e.target.closest('.cell')) { face('oh'); }
		});
		win.addEventListener('pointerup', function () {
			if (!over) { face('smile'); }
		});
		win.addEventListener('pointercancel', function () {
			if (!over) { face('smile'); }
		});

		grid.addEventListener('contextmenu', function (e) {
			var cell = e.target.closest('.cell');
			if (!cell) { return; }
			e.preventDefault();
			mark(parseInt(cell.dataset.i, 10));
		});

		grid.addEventListener('keydown', function (e) {
			var cell = e.target.closest('.cell');
			if (!cell) { return; }
			var i = parseInt(cell.dataset.i, 10);
			var to = { ArrowLeft: i % W ? i - 1 : i, ArrowRight: i % W < W - 1 ? i + 1 : i, ArrowUp: i >= W ? i - W : i, ArrowDown: i < W * (H - 1) ? i + W : i }[e.key];
			if (to !== undefined) {
				e.preventDefault();
				cell.tabIndex = -1;
				cells[to].tabIndex = 0;
				cells[to].focus();
			} else if (e.key === 'f' || e.key === 'F') {
				e.preventDefault();
				mark(i);
			}
		});

		flagBtn.addEventListener('click', function () {
			flagMode = !flagMode;
			flagBtn.setAttribute('aria-pressed', String(flagMode));
		});

		levelSel.addEventListener('change', function () {
			build(parseInt(levelSel.value, 10) || 0);
		});

		faceBtn.addEventListener('click', reset);
		build(0);
	};
})();
