/**
 * Shows a PDF inside its window on phones and tablets, whose browsers cannot
 * embed one. Each page is drawn as a picture, one under the other.
 * Computers keep their browser's own PDF view.
 *
 * The drawing is done by PDF.js (Mozilla, Apache 2.0 licence), fetched from
 * cdnjs only when a visitor opens a PDF on such a device.
 */
(function () {
	'use strict';

	var LIB = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
	var WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
	var layer = document.querySelector('.windows');
	if (!layer) { return; }

	function needed() {
		return window.matchMedia('(max-width: 767px)').matches ||
			window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
			navigator.pdfViewerEnabled === false;
	}

	var loading = null;
	function library() {
		if (window.pdfjsLib) { return Promise.resolve(window.pdfjsLib); }
		if (!loading) {
			loading = new Promise(function (resolve, reject) {
				var tag = document.createElement('script');
				tag.src = LIB;
				tag.onload = function () {
					if (!window.pdfjsLib) { reject(new Error('No PDF.js')); return; }
					window.pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER;
					resolve(window.pdfjsLib);
				};
				tag.onerror = function () { loading = null; reject(new Error('PDF.js did not load')); };
				document.head.appendChild(tag);
			});
		}
		return loading;
	}

	function draw(body) {
		if (body.dataset.drawn || !body.dataset.pdf || !needed()) { return; }
		body.dataset.drawn = '1';
		var note = body.querySelector('.pdf-phone');
		var pages = document.createElement('div');
		pages.className = 'pdf-pages';
		if (note) { note.textContent = 'Opening the document…'; }

		library().then(function (lib) {
			return lib.getDocument(body.dataset.pdf).promise;
		}).then(function (doc) {
			body.classList.add('is-drawn');
			body.appendChild(pages);
			var width = Math.max(240, pages.clientWidth - 16);
			var ratio = Math.min(window.devicePixelRatio || 1, 2.5);
			var chain = Promise.resolve();
			for (var n = 1; n <= doc.numPages; n++) {
				(function (number) {
					chain = chain.then(function () { return doc.getPage(number); }).then(function (page) {
						var base = page.getViewport({ scale: 1 });
						var view = page.getViewport({ scale: (width / base.width) * ratio });
						var canvas = document.createElement('canvas');
						canvas.width = Math.round(view.width);
						canvas.height = Math.round(view.height);
						canvas.setAttribute('role', 'img');
						canvas.setAttribute('aria-label', 'Page ' + number + ' of ' + doc.numPages);
						pages.appendChild(canvas);
						return page.render({ canvasContext: canvas.getContext('2d'), viewport: view }).promise;
					});
				})(n);
			}
			return chain;
		}).catch(function () {
			body.classList.remove('is-drawn');
			pages.remove();
			delete body.dataset.drawn;
			if (note) { note.textContent = 'The document could not be shown here. Tap Full screen to read it, or Download to keep a copy.'; }
		});
	}

	function scan(node) {
		if (node.nodeType !== 1) { return; }
		if (node.matches('.pdf-body')) { draw(node); }
		Array.prototype.forEach.call(node.querySelectorAll('.pdf-body'), draw);
	}

	scan(layer);
	if (window.MutationObserver) {
		new MutationObserver(function (changes) {
			changes.forEach(function (change) {
				Array.prototype.forEach.call(change.addedNodes, scan);
			});
		}).observe(layer, { childList: true, subtree: true });
	}
})();
