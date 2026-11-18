/**
 * Paint: a small drawing pad. Pencil, brush, eraser, fill, sixteen colours.
 * "Save picture" downloads the drawing to the visitor's own device.
 */
(function () {
	'use strict';

	var P = window.Platinum;
	if (!P) { return; }

	var COLOURS = ['#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
		'#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'];
	var WIDTHS = { pencil: 1, brush: 6, eraser: 16 };

	P.apps.paint = function (win) {
		var canvas = win.querySelector('.paint-canvas');
		var stage = win.querySelector('.paint-stage');
		var palette = win.querySelector('.paint-colours');
		var ctx = canvas.getContext('2d', { willReadFrequently: true });
		var tool = 'pencil';
		var colour = COLOURS[0];
		var last = null;

		function blank() {
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		}

		function point(e) {
			var r = canvas.getBoundingClientRect();
			return [
				Math.floor((e.clientX - r.left) * canvas.width / r.width),
				Math.floor((e.clientY - r.top) * canvas.height / r.height)
			];
		}

		function line(a, b) {
			ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : colour;
			ctx.lineWidth = WIDTHS[tool] || 1;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			ctx.beginPath();
			ctx.moveTo(a[0] + 0.5, a[1] + 0.5);
			ctx.lineTo(b[0] + 0.5, b[1] + 0.5);
			ctx.stroke();
		}

		// Fills the area of one colour around the point that was clicked.
		function fill(start) {
			var w = canvas.width;
			var h = canvas.height;
			var image = ctx.getImageData(0, 0, w, h);
			var d = image.data;
			var at = (start[1] * w + start[0]) * 4;
			var from = [d[at], d[at + 1], d[at + 2]];
			var to = [parseInt(colour.slice(1, 3), 16), parseInt(colour.slice(3, 5), 16), parseInt(colour.slice(5, 7), 16)];
			if (from[0] === to[0] && from[1] === to[1] && from[2] === to[2]) { return; }
			var stack = [start[0], start[1]];
			while (stack.length) {
				var y = stack.pop();
				var x = stack.pop();
				if (x < 0 || y < 0 || x >= w || y >= h) { continue; }
				var i = (y * w + x) * 4;
				if (Math.abs(d[i] - from[0]) > 40 || Math.abs(d[i + 1] - from[1]) > 40 || Math.abs(d[i + 2] - from[2]) > 40) { continue; }
				d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; d[i + 3] = 255;
				stack.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
			}
			ctx.putImageData(image, 0, 0);
		}

		canvas.addEventListener('pointerdown', function (e) {
			if (e.button !== 0) { return; }
			e.preventDefault();
			var p = point(e);
			if (tool === 'fill') { fill(p); return; }
			try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
			last = p;
			line(p, p);
		});
		canvas.addEventListener('pointermove', function (e) {
			if (!last) { return; }
			var p = point(e);
			line(last, p);
			last = p;
		});
		['pointerup', 'pointercancel'].forEach(function (name) {
			canvas.addEventListener(name, function () { last = null; });
		});

		COLOURS.forEach(function (c, n) {
			var chip = document.createElement('button');
			chip.type = 'button';
			chip.className = 'chip';
			chip.style.setProperty('--chip', c);
			chip.setAttribute('role', 'radio');
			chip.setAttribute('aria-label', 'Colour ' + (n + 1));
			chip.setAttribute('aria-checked', String(n === 0));
			chip.addEventListener('click', function () {
				colour = c;
				Array.prototype.forEach.call(palette.children, function (el) {
					el.setAttribute('aria-checked', String(el === chip));
				});
			});
			palette.appendChild(chip);
		});

		win.querySelector('.paint-tools').addEventListener('click', function (e) {
			var btn = e.target.closest('button');
			if (!btn) { return; }
			if (btn.dataset.tool) {
				tool = btn.dataset.tool;
				Array.prototype.forEach.call(win.querySelectorAll('[data-tool]'), function (el) {
					el.setAttribute('aria-pressed', String(el === btn));
				});
			} else if (btn.dataset.act === 'clear') {
				blank();
			} else if (btn.dataset.act === 'save') {
				canvas.toBlob(function (blob) {
					if (!blob) { return; }
					var a = document.createElement('a');
					a.href = URL.createObjectURL(blob);
					a.download = 'picture.png';
					a.click();
					setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
				});
			}
		});

		blank();
		// On a narrow screen the drawing area shrinks to fit, once the window is on screen.
		setTimeout(function () {
			var room = stage.clientWidth - 8;
			if (room > 120 && room < canvas.width) {
				canvas.width = room;
				blank();
			}
		}, 0);
	};
})();
