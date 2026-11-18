/**
 * Puzzle: slide the tiles into order, 1 to 15.
 * Click a tile next to the gap, or use the arrow keys.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }

	P.apps.puzzle = function (win) {
		var board = win.querySelector('.puzzle-board');
		var status = win.querySelector('.puzzle-status');
		var tiles = [];
		var moves = 0;
		var done = false;

		function neighbours(i) {
			var list = [];
			if (i % 4 > 0) { list.push(i - 1); }
			if (i % 4 < 3) { list.push(i + 1); }
			if (i > 3) { list.push(i - 4); }
			if (i < 12) { list.push(i + 4); }
			return list;
		}

		function solved() {
			for (var i = 0; i < 15; i++) {
				if (tiles[i] !== i + 1) { return false; }
			}
			return true;
		}

		function draw(focusValue) {
			board.textContent = '';
			tiles.forEach(function (value, i) {
				var tile = document.createElement('button');
				tile.type = 'button';
				tile.className = 'tile' + (value ? '' : ' tile--gap');
				tile.textContent = value || '';
				tile.dataset.index = String(i);
				if (!value) {
					tile.tabIndex = -1;
					tile.setAttribute('aria-hidden', 'true');
				}
				board.appendChild(tile);
				if (value && value === focusValue) { tile.focus({ preventScroll: true }); }
			});
			if (done) {
				status.textContent = 'Solved in ' + moves + ' moves.';
			} else {
				status.textContent = moves ? 'Moves: ' + moves : 'Put the tiles in order, 1 to 15.';
			}
		}

		function slide(i, quiet) {
			var gap = tiles.indexOf(0);
			if (neighbours(gap).indexOf(i) === -1) { return false; }
			var value = tiles[i];
			tiles[gap] = value;
			tiles[i] = 0;
			if (!quiet) {
				moves++;
				done = solved();
				draw(value);
			}
			return true;
		}

		// Shuffles by making real moves, so every game can be solved.
		function shuffle() {
			tiles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 0];
			var last = -1;
			for (var n = 0; n < 160; n++) {
				var gap = tiles.indexOf(0);
				var options = neighbours(gap).filter(function (i) { return i !== last; });
				var pick = options[Math.floor(Math.random() * options.length)];
				last = gap;
				slide(pick, true);
			}
			moves = 0;
			done = false;
			if (solved()) { shuffle(); return; }
			draw();
		}

		board.addEventListener('click', function (e) {
			var tile = e.target.closest('.tile');
			if (tile && !done) { slide(parseInt(tile.dataset.index, 10)); }
		});

		// Arrow keys move the tile that can travel in that direction.
		win.addEventListener('keydown', function (e) {
			if (done) { return; }
			var gap = tiles.indexOf(0);
			var from = { ArrowLeft: gap % 4 < 3 ? gap + 1 : -1, ArrowRight: gap % 4 > 0 ? gap - 1 : -1, ArrowUp: gap < 12 ? gap + 4 : -1, ArrowDown: gap > 3 ? gap - 4 : -1 }[e.key];
			if (from === undefined || from < 0) { return; }
			e.preventDefault();
			slide(from);
		});

		win.querySelector('.puzzle-shuffle').addEventListener('click', shuffle);
		shuffle();
	};
})();
