jush.textarea = (function () {
	//! IE sometimes inserts empty <p> in start of a string when newline is entered inside

	function findSelPos(pre) {
		const sel = getSelection();
		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			if (pre.contains(range.startContainer)) { // a selection elsewhere would move to the end of pre
				return findPosition(pre, range.startContainer, range.startOffset);
			}
		}
	}

	function findPosition(el, container, offset) {
		const pos = { pos: 0 };
		findPositionRecurse(el, container, offset, pos);
		return pos.pos;
	}

	function findPositionRecurse(child, container, offset, pos) {
		if (child.nodeType == 3) {
			if (child == container) {
				pos.pos += offset;
				return true;
			}
			pos.pos += child.textContent.length;
		} else if (child == container) {
			for (let i = 0; i < offset; i++) {
				findPositionRecurse(child.childNodes[i], container, offset, pos);
			}
			return true;
		} else {
			if (/^(br|div)$/i.test(child.tagName)) {
				pos.pos++;
			}
			for (const node of child.childNodes) {
				if (findPositionRecurse(node, container, offset, pos)) {
					return true;
				}
			}
			if (/^p$/i.test(child.tagName)) {
				pos.pos++;
			}
		}
	}

	function findOffset(el, pos) {
		return findOffsetRecurse(el, { pos: pos });
	}

	function findOffsetRecurse(child, pos) {
		if (child.nodeType == 3) { // 3 - TEXT_NODE
			if (child.textContent.length >= pos.pos) {
				return { container: child, offset: pos.pos };
			}
			pos.pos -= child.textContent.length;
		} else {
			for (let i = 0; i < child.childNodes.length; i++) {
				if (/^br$/i.test(child.childNodes[i].tagName)) {
					if (!pos.pos) {
						return { container: child, offset: i };
					}
					pos.pos--;
					if (!pos.pos && i == child.childNodes.length - 1) { // last invisible <br>
						return { container: child, offset: i };
					}
				} else {
					const result = findOffsetRecurse(child.childNodes[i], pos);
					if (result) {
						return result;
					}
				}
			}
		}
	}

	/** Get the selection as positions in the text
	* @param {HTMLPreElement} pre
	* @return {number[]|undefined} [start, end]
	*/
	function findSelRange(pre) {
		const sel = getSelection();
		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			if (pre.contains(range.startContainer) && pre.contains(range.endContainer)) {
				return [ findPosition(pre, range.startContainer, range.startOffset), findPosition(pre, range.endContainer, range.endOffset) ];
			}
		}
	}

	/** Place the caret
	* @param {HTMLPreElement} pre
	* @param {number} pos
	* @param {number} [from] select the text from this position to pos
	*/
	function setSelPos(pre, pos, from = pos) {
		if (pos) {
			const end = findOffset(pre, pos);
			const start = (from == pos ? end : findOffset(pre, from));
			if (start && end) {
				const range = document.createRange();
				range.setStart(start.container, start.offset);
				range.setEnd(end.container, end.offset);
				const sel = getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}

	function setText(pre, text, end, from) {
		let lang = 'txt';
		if (text.length < 1e4) { // highlighting is slow with most languages
			const match = /(^|\s)(?:jush|language)-(\S+)/.exec(pre.jushTextarea.className);
			lang = (match ? match[2] : 'htm');
		}
		const html = jush.highlight(lang, text).replace(/\n/g, '<br>');
		setHTML(pre, html, text, end, from);
		if (openAc) {
			openAutocomplete(pre);
			openAc = false;
		} else {
			closeAutocomplete();
		}
	}

	function setHTML(pre, html, text, pos, from) {
		pre.innerHTML = html;
		pre.lastHTML = pre.innerHTML; // not html because IE reformats the string
		pre.jushTextarea.value = text;
		setSelPos(pre, pos, from);
	}

	/** Replace a part of the text as if it was typed
	* @param {HTMLPreElement} pre
	* @param {number} from
	* @param {number} to
	* @param {string} insert
	* @param {boolean} [select] select the inserted text instead of placing the caret after it
	*/
	function replaceText(pre, from, to, insert, select) {
		const text = pre.jushTextarea.value;
		const start = findSelPos(pre);
		const end = from + insert.length;
		let replaced = text.substring(0, from) + insert + text.substring(to);
		if (end == replaced.length && /\n$/.test(replaced)) {
			replaced += '\n'; // the last <br> is invisible, the browser also adds another one after Enter at the end
		}
		forceNewUndo = true; // undo each replacement separately
		setText(pre, replaced, end, (select ? from : end));
		addUndo(pre, start, end);
		fireInput(pre);
	}

	/** Insert a tab or indent the selected lines
	* @param {HTMLPreElement} pre
	* @param {boolean} unindent unindent the selected lines or the line with the caret
	*/
	function indent(pre, unindent) {
		const [ start, end ] = findSelRange(pre) || [ 0, 0 ];
		const text = pre.jushTextarea.value;
		if (!unindent && start == end) {
			replaceText(pre, start, end, '\t');
			return;
		}
		const lineStart = text.lastIndexOf('\n', start - 1) + 1;
		const lineEnd = (end > start && text[end - 1] == '\n' ? end - 1 : end); // a selection ending at the start of a line doesn't include that line
		const lines = text.substring(lineStart, lineEnd).split('\n')
			.map(line => (unindent ? line.replace(/^(\t| {1,4})/, '') : (line ? '\t' + line : line)))
		;
		replaceText(pre, lineStart, lineEnd, lines.join('\n'), start != end);
	}

	/** Start a new line with the indentation of the current line
	* @param {HTMLPreElement} pre
	*/
	function newLine(pre) {
		const [ start, end ] = findSelRange(pre) || [ 0, 0 ];
		const text = pre.jushTextarea.value;
		const lineStart = text.lastIndexOf('\n', start - 1) + 1;
		replaceText(pre, start, end, '\n' + /^[ \t]*/.exec(text.substring(lineStart, start))[0]);
	}

	/** Notify the input listeners about a change made by the script, like the browser does after typing
	* @param {HTMLPreElement} pre
	*/
	function fireInput(pre) {
		pre.dispatchEvent(new Event('input', { bubbles: true })); // also runs pre.oninput, which does nothing if setText() highlighted the text already
	}

	function keydown(event) {
		const ctrl = (event.ctrlKey || event.metaKey);
		if (!event.altKey) {
			if (!ctrl && acEl.options.length) {
				const select =
					(event.key == 'ArrowDown' ? Math.min(acEl.options.length - 1, acEl.selectedIndex + 1) :
					(event.key == 'ArrowUp' ? Math.max(0, acEl.selectedIndex - 1) :
					(event.key == 'PageDown' ? Math.min(acEl.options.length - 1, acEl.selectedIndex + acEl.size) :
					(event.key == 'PageUp' ? Math.max(0, acEl.selectedIndex - acEl.size) :
					null))))
				;
				if (select !== null) {
					acEl.selectedIndex = select;
					return false;
				}
				if (/^(Enter|Tab)$/.test(event.key) && !event.shiftKey) {
					insertAutocomplete(this);
					return false;
				}
			}

			if (!event.shiftKey && /^(Delete|Backspace)$/.test(event.key) && getSelection().toString().length >= this.innerText.replace(/\n$/, '').length) { // native delete of long text is slow in Chrome 150
				this.innerText = '';
				forceNewUndo = true; // undo the whole deletion at once
				fireInput(this); // the assignment fires no input event, so the <textarea> and the undo history would keep the deleted text
				return false;
			}

			const escaped = this.jushEscaped;
			if (!/^(Shift|Control|Alt|Meta)$/.test(event.key)) { // Shift+Tab after Escape also moves the focus
				this.jushEscaped = (event.key == 'Escape');
			}
			if (!ctrl && ((event.key == 'Tab' && this.jushOptions.tab && !escaped) || (event.key == 'Enter' && !event.shiftKey && this.jushOptions.indent))) { // Escape and Tab moves the focus
				highlight(this); // a change typed before may not be highlighted yet
				if (event.key == 'Tab') {
					indent(this, event.shiftKey);
				} else {
					newLine(this);
				}
				closeAutocomplete();
				return false;
			}

			if (ctrl) {
				if (event.key == ' ') {
					openAutocomplete(this);
				}
			} else if (autocomplete.openBy && (autocomplete.openBy.test(event.key) || event.key == 'Backspace' || (event.key == 'Enter' && event.shiftKey))) {
				openAc = true;
			} else if (/^(Escape|ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) {
				closeAutocomplete();
			}
		}

		if (ctrl && !event.altKey) {
			const isUndo = (event.keyCode == 90); // 90 - z
			const isRedo = (event.keyCode == 89 || (event.keyCode == 90 && event.shiftKey)); // 89 - y
			if (isUndo || isRedo) {
				if (isRedo) {
					if (this.jushUndoPos + 1 < this.jushUndo.length) {
						this.jushUndoPos++;
						const undo = this.jushUndo[this.jushUndoPos];
						setText(this, undo.text, undo.end);
						fireInput(this);
					}
				} else if (this.jushUndoPos >= 0) {
					this.jushUndoPos--;
					const undo = this.jushUndo[this.jushUndoPos] || { html: '', text: '' };
					setText(this, undo.text, this.jushUndo[this.jushUndoPos + 1].start);
					fireInput(this);
				}
				return false;
			}
		} else {
			setLastPos(this);
		}
	}

	const maxSize = 8;
	const acEl = document.createElement('select');
	acEl.size = maxSize;
	acEl.className = 'jush-autocomplete';
	acEl.style.position = 'absolute';
	acEl.style.zIndex = 1;
	acEl.onclick = () => {
		insertAutocomplete(pre);
	};
	let openAc = false;
	closeAutocomplete();

	function findState(node) {
		let match;
		// jush-op, jush-help and jush-custom mark an operator and the links, they are not states
		while (node && !(match = (node.className || '').match(/(^|\s)jush-(?!(?:op|help|custom)\b)(\w+)/))) {
			node = node.parentElement;
		}
		return (match ? match[2] : '');
	}

	function openAutocomplete(pre) {
		const prevSelected = acEl.options[acEl.selectedIndex];
		closeAutocomplete();
		const sel = getSelection();
		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			const pos = findSelPos(pre);
			const state = findState(range.startContainer);
			if (state) {
				const ac = autocomplete(
					state,
					pre.innerText.substring(0, pos),
					pre.innerText.substring(pos)
				);
				if (Object.keys(ac).length) {
					let select = 0;
					for (const word in ac) {
						const option = document.createElement('option');
						option.value = ac[word];
						option.textContent = word;
						acEl.append(option);
						if (prevSelected && prevSelected.textContent == word) {
							select = acEl.options.length - 1;
						}
					}
					acEl.selectedIndex = select;
					acEl.size = Math.min(Math.max(acEl.options.length, 2), maxSize);
					positionAutocomplete();
					acEl.style.display = '';
				}
			}
		}
	}

	function positionAutocomplete() {
		const sel = getSelection();
		if (sel.rangeCount && acEl.options.length) {
			const pos = findSelPos(pre);
			const range = sel.getRangeAt(0);
			const range2 = range.cloneRange();
			range2.setStart(range.startContainer, Math.max(0, range.startOffset - acEl.options[0].value)); // autocompletions currently couldn't cross container boundary
			const span = document.createElement('span'); // collapsed ranges have empty bounding rect
			span.innerHTML = ' ';
			range2.insertNode(span);
			acEl.style.left = span.offsetLeft + 'px';
			acEl.style.top = (span.offsetTop - pre.scrollTop + span.offsetHeight * 1.2) + 'px';
			span.remove();
			setSelPos(pre, pos); // required on iOS
		}
	}

	function closeAutocomplete() {
		acEl.options.length = 0;
		acEl.style.display = 'none';
	}

	function insertAutocomplete(pre) {
		const sel = getSelection();
		const range = sel.rangeCount && sel.getRangeAt(0);
		if (range) {
			const insert = acEl.options[acEl.selectedIndex].textContent;
			const offset = +acEl.options[acEl.selectedIndex].value;
			forceNewUndo = true;
			pre.lastPos = findSelPos(pre);
			const start = findOffset(pre, pre.lastPos - offset);
			if (start) {
				range.setStart(start.container, start.offset);
			}
			document.execCommand('insertText', false, insert);
			if (/ $/.test(insert)) {
				setTimeout(() => openAutocomplete(pre));
			}
		}
	}

	function setLastPos(pre) {
		if (pre.lastPos === undefined) {
			pre.lastPos = findSelPos(pre);
		}
	}

	let forceNewUndo = true;

	function highlight(pre) {
		const start = pre.lastPos;
		pre.lastPos = undefined;
		let innerHTML = pre.innerHTML;
		if (innerHTML != pre.lastHTML) {
			let end = findSelPos(pre);
			innerHTML = innerHTML.replace(/<br>((<\/[^>]+>)*<\/?div>)(?!$)/gi, (all, rest) => {
				if (end) {
					end--;
				}
				return rest;
			});
			const parsed = document.createElement('pre'); // outside the document, otherwise the element would be rebuilt twice on each keystroke
			parsed.innerHTML = innerHTML
				.replace(/^<br\b[^>]*>$/i, '') // Mac OS: Firefox, Chrome
				.replace(/<(br|div)\b[^>]*>/gi, '\n') // Firefox, Chrome
				.replace(/&nbsp;(<\/[pP]\b)/g, '$1') // IE
				.replace(/<\/p\b[^>]*>($|<p\b[^>]*>)/gi, '\n') // IE
				.replace(/(&nbsp;)+$/gm, '') // Chrome for some users
			;
			setText(pre, parsed.textContent.replace(/\u00A0/g, ' '), end);
			addUndo(pre, start, end);
		}
	}

	/** Save the text to the undo history, typing continuing at the previous end extends the last step
	* @param {HTMLPreElement} pre
	* @param {number} [start] caret position before the change
	* @param {number} [end] caret position after the change
	*/
	function addUndo(pre, start, end) {
		pre.jushUndo.length = pre.jushUndoPos + 1;
		if (forceNewUndo || !pre.jushUndo.length || pre.jushUndo[pre.jushUndoPos].end !== start) {
			pre.jushUndo.push({ text: pre.jushTextarea.value, start: start, end: (forceNewUndo ? undefined : end) });
			pre.jushUndoPos++;
			forceNewUndo = false;
		} else {
			pre.jushUndo[pre.jushUndoPos].text = pre.jushTextarea.value;
			pre.jushUndo[pre.jushUndoPos].end = end;
		}
	}

	function input() {
		setTimeout(() => highlight(this));
	}

	function paste(event) {
		if (event.clipboardData) {
			setLastPos(this);
			if (document.execCommand('insertHTML', false, jush.htmlspecialchars(event.clipboardData.getData('text')))) { // Opera doesn't support insertText
				event.preventDefault();
			}
			forceNewUndo = true; // highlighted in input
		}
	}

	function click(event) {
		if ((event.ctrlKey || event.metaKey) && event.target.href) {
			open(event.target.href);
		}
		closeAutocomplete();
	}

	let pre;
	let autocomplete = () => ({});
	addEventListener('resize', positionAutocomplete);

	/** Replace a <textarea> by an editable highlighted <pre>
	* @param {HTMLTextAreaElement} el
	* @param {Function} [autocompleter] function (state, before, after) returning { word: number of characters to replace }
	* @param {{tab?: boolean, indent?: boolean}} [options] tab: Tab indents (Escape and Tab moves the focus), indent: Enter keeps the indentation of the line (default)
	* @return {HTMLPreElement|undefined}
	*/
	return function textarea(el, autocompleter, options = {}) {
		if (!window.getSelection) {
			return;
		}
		if (autocompleter) {
			autocomplete = autocompleter;
		}
		pre = document.createElement('pre');
		pre.contentEditable = true;
		pre.className = el.className + ' jush';
		pre.style.width = el.clientWidth + 'px';
		pre.style.height = el.clientHeight + 'px';
		pre.style.padding = '3px';
		pre.style.overflow = 'auto';
		pre.style.resize = 'both';
		if (el.wrap != 'off') {
			pre.style.whiteSpace = 'pre-wrap';
		}
		pre.jushTextarea = el;
		pre.jushOptions = Object.assign({ indent: true }, options);
		pre.jushUndo = [ ];
		pre.jushUndoPos = -1;
		pre.onkeydown = keydown;
		pre.oninput = input;
		pre.onpaste = paste;
		pre.onclick = click;
		pre.appendChild(document.createTextNode(el.value));
		highlight(pre);
		if (el.spellcheck === false) {
			pre.spellcheck = false;
		}
		el.before(pre);
		el.before(acEl);
		if (document.activeElement === el) {
			pre.focus();
			if (!el.value) {
				openAutocomplete(pre);
			}
		}
		acEl.style.font = getComputedStyle(pre).font;
		el.style.display = 'none';
		return pre;
	};
})();
