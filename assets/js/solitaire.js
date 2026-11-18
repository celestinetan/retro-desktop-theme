/**
 * Solitaire: the classic one-deck patience game.
 * Build the four piles at the top from ace to king, one suit each.
 * In the seven columns, place cards in descending order, alternating red and black.
 * Tap a card to send it to the first place it fits, or drag it there.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }

	var SUITS = ['♠︎', '♥︎', '♦︎', '♣︎'];
	var SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
	var RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
	var RANK_NAMES = ['', 'Ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Jack', 'Queen', 'King'];

	function red(card) { return card.s === 1 || card.s === 2; }

	// Where the suit marks sit on each number card: [across %, down %]. Marks in the lower half are upside down.
	var L = 35, C = 50, R = 65;
	var PIPS = {
		2: [[C, 20], [C, 80]],
		3: [[C, 20], [C, 50], [C, 80]],
		4: [[L, 20], [R, 20], [L, 80], [R, 80]],
		5: [[L, 20], [R, 20], [C, 50], [L, 80], [R, 80]],
		6: [[L, 20], [R, 20], [L, 50], [R, 50], [L, 80], [R, 80]],
		7: [[L, 20], [R, 20], [C, 35], [L, 50], [R, 50], [L, 80], [R, 80]],
		8: [[L, 20], [R, 20], [C, 35], [L, 50], [R, 50], [C, 65], [L, 80], [R, 80]],
		9: [[L, 20], [R, 20], [L, 40], [R, 40], [C, 50], [L, 60], [R, 60], [L, 80], [R, 80]],
		10: [[L, 20], [R, 20], [C, 30], [L, 40], [R, 40], [L, 60], [R, 60], [C, 70], [L, 80], [R, 80]]
	};

	// The court cards: one half-figure, drawn twice so the card reads the same both ways up.
	var SKIN = '<circle cx="15" cy="10" r="4" fill="#f6d3b0" stroke="#000" stroke-width=".500"/><circle cx="13.500" cy="9.500" r=".550"/><circle cx="16.500" cy="9.500" r=".550"/>';
	var COURT = {
		11: '<path d="M2 23l3-7.500q10-4.500 20 0l3 7.500z" fill="#e8c14a" stroke="#000" stroke-width=".500"/><path d="M9 14.500l6 6 6-6v8.500H9z" fill="#16205e"/><path d="M10.500 8.500q-1 4 .500 6h8q1.500-2 .500-6z" fill="#e8c14a" stroke="#000" stroke-width=".400"/>' + SKIN + '<path d="M9.500 7q5.500-6 11 0z" fill="#d0181c" stroke="#000" stroke-width=".500"/><path d="M19.500 5.500q3-4 5.500-3.500-1 3.500-5 4.500" fill="#fff" stroke="#000" stroke-width=".400"/>',
		12: '<path d="M2 23l3-7.500q10-4.500 20 0l3 7.500z" fill="#d0181c" stroke="#000" stroke-width=".500"/><path d="M10 14.500l5 5 5-5 2 8.500H8z" fill="#e8c14a" stroke="#000" stroke-width=".400"/><path d="M10 6q-2.500 5-1 10h3V8h6v8h3q1.500-5-1-10z" fill="#16205e"/>' + SKIN + '<path d="M10.500 6.500l-.500-4 2.500 2 2.500-3 2.500 3 2.500-2-.500 4z" fill="#e8c14a" stroke="#000" stroke-width=".500"/><circle cx="15" cy="13.800" r=".600" fill="#d0181c"/>',
		13: '<path d="M2 23l3-7.500q10-4.500 20 0l3 7.500z" fill="#3a55c8" stroke="#000" stroke-width=".500"/><path d="M12 15h6v8h-6z" fill="#e8c14a" stroke="#000" stroke-width=".400"/><path d="M5 16l4 7M25 16l-4 7" stroke="#d0181c" stroke-width="1.200"/>' + SKIN + '<path d="M11 10.500q0 6 4 7.500 4-1.500 4-7.500-2 2.500-4 2.500t-4-2.500z" fill="#fff" stroke="#000" stroke-width=".500"/><path d="M10 7V1.500l2.500 3 2.500-3.500 2.500 3.500 2.500-3V7z" fill="#e8c14a" stroke="#000" stroke-width=".500"/><path d="M10 6h10" stroke="#d0181c" stroke-width="1"/>'
	};

	function court(rank) {
		var half = COURT[rank];
		return '<svg class="sol-court" viewBox="0 0 30 46" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g>' + half + '</g><g transform="rotate(180 15 23)">' + half + '</g></svg>';
	}

	function faceOf(card) {
		var suit = SUITS[card.s];
		if (card.r > 10) { return court(card.r); }
		if (card.r === 1) { return '<span class="sol-mid">' + suit + '</span>'; }
		return PIPS[card.r].map(function (at) {
			return '<span class="sol-pip' + (at[1] > 50 ? ' is-flip' : '') + '" style="left:' + at[0] + '%;top:' + at[1] + '%">' + suit + '</span>';
		}).join('');
	}

	P.apps.solitaire = function (win) {
		var board = win.querySelector('.sol-board');
		var status = win.querySelector('.sol-status');
		var movesEl = win.querySelector('.sol-moves');
		var undoBtn = win.querySelector('.sol-undo');
		var slots = {};
		var st, history, moves, won;
		var drag = null;

		// The table: stock, waste, a gap, four foundations; then seven columns.
		var top = document.createElement('div');
		top.className = 'sol-top';
		['stock', 'waste', '', 'f0', 'f1', 'f2', 'f3'].forEach(function (id) {
			var el = document.createElement('div');
			el.className = id ? 'sol-slot' : 'sol-slot sol-gap';
			if (id) { el.dataset.pile = id; slots[id] = el; }
			top.appendChild(el);
		});
		var tab = document.createElement('div');
		tab.className = 'sol-tab';
		for (var t = 0; t < 7; t++) {
			var col = document.createElement('div');
			col.className = 'sol-pile';
			col.dataset.pile = 't' + t;
			slots['t' + t] = col;
			tab.appendChild(col);
		}
		board.appendChild(top);
		board.appendChild(tab);

		function pile(id) {
			if (id === 'stock') { return st.stock; }
			if (id === 'waste') { return st.waste; }
			return id.charAt(0) === 'f' ? st.found[+id.charAt(1)] : st.tab[+id.charAt(1)];
		}

		function canDrop(cards, id) {
			var card = cards[0];
			var target = pile(id);
			var last = target[target.length - 1];
			if (id.charAt(0) === 'f') {
				if (cards.length !== 1) { return false; }
				return last ? last.s === card.s && card.r === last.r + 1 : card.r === 1;
			}
			if (id.charAt(0) === 't') {
				return last ? last.up && red(last) !== red(card) && card.r === last.r - 1 : card.r === 13;
			}
			return false;
		}

		function save() {
			history.push(JSON.stringify(st));
			if (history.length > 300) { history.shift(); }
		}

		function move(from, index, to) {
			save();
			var src = pile(from);
			var cards = src.splice(index);
			Array.prototype.push.apply(pile(to), cards);
			var last = src[src.length - 1];
			if (from.charAt(0) === 't' && last && !last.up) { last.up = true; }
			moves++;
			won = st.found.every(function (f) { return f.length === 13; });
			if (P.sound) { P.sound(won ? 'win' : 'card'); }
			render();
		}

		function draw() {
			if (won) { return; }
			var card;
			if (st.stock.length) {
				save();
				card = st.stock.pop();
				card.up = true;
				st.waste.push(card);
			} else if (st.waste.length) {
				save();
				while (st.waste.length) {
					card = st.waste.pop();
					card.up = false;
					st.stock.push(card);
				}
			} else {
				return;
			}
			moves++;
			if (P.sound) { P.sound('card'); }
			render();
		}

		function undo() {
			if (!history.length) { return; }
			st = JSON.parse(history.pop());
			won = false;
			render();
		}

		// Sends a card (and any cards on top of it) to the first place it fits.
		function auto(from, index) {
			if (won) { return; }
			var cards = pile(from).slice(index);
			var i, id;
			if (cards.length === 1 && from.charAt(0) !== 'f') {
				for (i = 0; i < 4; i++) {
					if (canDrop(cards, 'f' + i)) { move(from, index, 'f' + i); return; }
				}
			}
			var empty = null;
			for (i = 0; i < 7; i++) {
				id = 't' + i;
				if (id === from || !canDrop(cards, id)) { continue; }
				if (st.tab[i].length) { move(from, index, id); return; }
				if (empty === null && !(from.charAt(0) === 't' && index === 0)) { empty = id; }
			}
			if (empty) { move(from, index, empty); return; }
			status.textContent = 'That card has nowhere to go yet.';
		}

		function cardEl(card, index) {
			var el = document.createElement('button');
			el.type = 'button';
			el.dataset.i = String(index);
			if (!card.up) {
				el.className = 'sol-card is-down';
				el.tabIndex = -1;
				el.setAttribute('aria-label', 'Face-down card');
				return el;
			}
			var rank = RANKS[card.r];
			var suit = SUITS[card.s];
			el.className = 'sol-card is-up' + (red(card) ? ' is-red' : '') + (card.r > 10 ? ' is-face' : '');
			el.setAttribute('aria-label', RANK_NAMES[card.r] + ' of ' + SUIT_NAMES[card.s]);
			el.innerHTML = '<span class="sol-c1">' + rank + '<br>' + suit + '</span>' + faceOf(card) + '<span class="sol-c2">' + rank + '<br>' + suit + '</span>';
			return el;
		}

		function render() {
			var cw = slots.t0.clientWidth || 56;
			var ch = cw * 1.4;
			var downStep = Math.round(ch * 0.1);
			var upStep = Math.round(ch * 0.27);
			var room = Math.round(ch + 6 * downStep + 12 * upStep);
			board.style.fontSize = Math.max(9, Math.round(cw * 0.23)) + 'px';
			tab.style.height = room + 'px';

			// Stock: a face-down card to draw from, or a ring to turn the waste over.
			var stock = slots.stock;
			stock.textContent = '';
			var key = document.createElement('button');
			key.type = 'button';
			key.className = st.stock.length ? 'sol-card is-down sol-draw' : 'sol-card sol-draw sol-turn';
			key.setAttribute('aria-label', st.stock.length ? 'Draw a card (' + st.stock.length + ' left)' : 'Turn the pile over');
			if (!st.stock.length && !st.waste.length) { key.disabled = true; }
			stock.appendChild(key);

			['waste', 'f0', 'f1', 'f2', 'f3'].forEach(function (id) {
				var cards = pile(id);
				slots[id].textContent = '';
				if (cards.length > 1) {
					var under = cardEl(cards[cards.length - 2], cards.length - 2);
					under.classList.add('is-under');
					under.tabIndex = -1;
					slots[id].appendChild(under);
				}
				if (cards.length) { slots[id].appendChild(cardEl(cards[cards.length - 1], cards.length - 1)); }
			});

			st.tab.forEach(function (cards, n) {
				var el = slots['t' + n];
				el.textContent = '';
				var down = cards.filter(function (c) { return !c.up; }).length;
				var up = cards.length - down;
				var step = up > 1 ? Math.min(upStep, Math.floor((room - ch - down * downStep) / (up - 1))) : upStep;
				var y = 0;
				cards.forEach(function (card, i) {
					var c = cardEl(card, i);
					c.style.top = y + 'px';
					el.appendChild(c);
					y += card.up ? step : downStep;
				});
			});

			movesEl.textContent = moves === 1 ? '1 move' : moves + ' moves';
			undoBtn.disabled = !history.length;
			if (won) {
				status.textContent = 'You won in ' + moves + ' moves. Press New game to play again.';
			} else {
				status.textContent = 'Tap a card to move it, or drag it. Tap the pile at the top left to draw.';
			}
		}

		function deal() {
			var deck = [];
			for (var s = 0; s < 4; s++) {
				for (var r = 1; r <= 13; r++) { deck.push({ r: r, s: s, up: false }); }
			}
			for (var i = deck.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var swap = deck[i]; deck[i] = deck[j]; deck[j] = swap;
			}
			st = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] };
			for (var col = 0; col < 7; col++) {
				for (var row = 0; row <= col; row++) {
					var card = deck.pop();
					card.up = row === col;
					st.tab[col].push(card);
				}
			}
			st.stock = deck;
			history = [];
			moves = 0;
			won = false;
			render();
		}

		/* ---------- tapping and dragging ---------- */

		function endDrag() {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onCancel);
			if (drag && drag.ghost) { drag.ghost.remove(); }
			drag = null;
		}

		function onMove(e) {
			if (!drag) { return; }
			var dx = e.clientX - drag.x;
			var dy = e.clientY - drag.y;
			if (!drag.ghost) {
				if (Math.abs(dx) + Math.abs(dy) < 6) { return; }
				var ghost = document.createElement('div');
				ghost.className = 'sol-ghost';
				ghost.style.width = drag.rect.width + 'px';
				ghost.style.fontSize = board.style.fontSize;
				drag.els.forEach(function (el) {
					var copy = el.cloneNode(true);
					copy.style.top = (el.getBoundingClientRect().top - drag.rect.top) + 'px';
					ghost.appendChild(copy);
					el.style.visibility = 'hidden';
				});
				document.body.appendChild(ghost);
				drag.ghost = ghost;
			}
			drag.ghost.style.left = (drag.rect.left + dx) + 'px';
			drag.ghost.style.top = (drag.rect.top + dy) + 'px';
		}

		function onUp(e) {
			if (!drag) { return; }
			var from = drag.from;
			var index = drag.index;
			var dragged = !!drag.ghost;
			endDrag();
			if (!dragged) {
				auto(from, index);
				return;
			}
			var under = document.elementFromPoint(e.clientX, e.clientY);
			var target = under && under.closest ? under.closest('[data-pile]') : null;
			var id = target && board.contains(target) ? target.dataset.pile : '';
			if (id && id !== from && canDrop(pile(from).slice(index), id)) {
				move(from, index, id);
			} else {
				render();
			}
		}

		function onCancel() {
			endDrag();
			render();
		}

		board.addEventListener('pointerdown', function (e) {
			if (e.button !== 0 || won || drag) { return; }
			var el = e.target.closest('.sol-card.is-up');
			if (!el || el.classList.contains('is-under')) { return; }
			var home = el.closest('[data-pile]');
			if (!home) { return; }
			var els = [el];
			if (home.dataset.pile.charAt(0) === 't') {
				var next = el.nextElementSibling;
				while (next) { els.push(next); next = next.nextElementSibling; }
			}
			drag = { from: home.dataset.pile, index: parseInt(el.dataset.i, 10), els: els, x: e.clientX, y: e.clientY, rect: el.getBoundingClientRect(), ghost: null };
			window.addEventListener('pointermove', onMove);
			window.addEventListener('pointerup', onUp);
			window.addEventListener('pointercancel', onCancel);
		});

		// The keyboard (Enter or Space on a card) and the draw pile use plain clicks.
		board.addEventListener('click', function (e) {
			var el = e.target.closest('.sol-card');
			if (!el) { return; }
			if (el.classList.contains('sol-draw')) { draw(); return; }
			if (e.detail !== 0 || !el.classList.contains('is-up') || el.classList.contains('is-under')) { return; }
			var home = el.closest('[data-pile]');
			var from = home.dataset.pile;
			var index = parseInt(el.dataset.i, 10);
			auto(from, index);
			var again = slots[from].querySelector('.sol-card.is-up:last-child') || slots.stock.querySelector('.sol-card');
			if (again) { again.focus(); }
		});

		win.querySelector('.sol-new').addEventListener('click', deal);
		undoBtn.addEventListener('click', undo);

		var resize = function () {
			if (!win.isConnected) { window.removeEventListener('resize', resize); return; }
			if (!drag) { render(); }
		};
		window.addEventListener('resize', resize);

		deal();
	};
})();
