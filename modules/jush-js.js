jush.tr.js = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_obj: /\s*\{/, _1: /}/, js_code: /()/ };
jush.tr.js_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, js_doc: /\/\*\*/, com: /\/\*/, num: jush.num, js_write: /(\b)(write(?:ln)?)(\()/, js_http: /(\.)(setRequestHeader|getResponseHeader)(\()/, js: /\{/, _3: /(<)(\/script)(>)/i, _2: /}/, _1: /[^.\])}$\w\s]/ };
jush.tr.js_write = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_write_code: /()/ };
jush.tr.js_http = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_http_code: /()/ };
jush.tr.js_write_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_write: /\(/, _2: /\)/, _1: /[^\])}$\w\s]/ };
jush.tr.js_http_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_http: /\(/, _2: /\)/, _1: /[^\])}$\w\s]/ };
jush.tr.js_one = { php: jush.php, _1: /\n/, _3: /(<)(\/script)(>)/i };
jush.tr.js_reg = { php: jush.php, esc: /\\/, js_reg_bra: /\[/, _1: /\/[a-z]*/i }; //! highlight regexp
jush.tr.js_reg_bra = { php: jush.php, esc: /\\/, _1: /]/ };
jush.tr.js_doc = { _1: /\*\// };
jush.tr.js_arr = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_arr: /\[/, js_obj: /\{/, _1: /]/ };
jush.tr.js_obj = { php: jush.php, js_one: /\s*\/\//, com: /\s*\/\*/, js_val: /:/, _1: /\s*}/, js_key: /()/ };
jush.tr.js_val = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_arr: /\[/, js_obj: /\{/, _1: /,|(?=})/ };
jush.tr.js_key = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, _1: /(?=[:}])/ };
jush.tr.js_bac = { php: jush.php, esc: /\\/, js: /\$\{/, _1: /`/ };

jush.urls.js_write = 'https://developer.mozilla.org/en/docs/DOM/$key.$val';
jush.urls.js_http = 'https://www.w3.org/TR/XMLHttpRequest/#the-$val-$key';

jush.links.js_write = { 'document': /^(write|writeln)$/ };
jush.links.js_http = { 'method': /^(setRequestHeader|getResponseHeader)$/ };

jush.build_links2('js', 'https://developer.mozilla.org/en/$key', /(\b)/, /(\b)/g, {
	'JavaScript/Reference/Global_Objects/$1': /(String\.fromCharCode|Date\.(?:parse|UTC)|Math\.(?:E|LN2|LN10|LOG2E|LOG10E|PI|SQRT1_2|SQRT2|abs|acos|asin|atan|atan2|ceil|cos|exp|floor|log|max|min|pow|random|round|sin|sqrt|tan)|Array|Boolean|Date|Error|Function|JavaArray|JavaClass|JavaObject|JavaPackage|Math|Number|Object|Packages|RegExp|String|Infinity|JSON|NaN|undefined|Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|isNaN|parseFloat|parseInt)/,
	'JavaScript/Reference/Statements/$1': /(break|continue|for|function|return|switch|throw|var|while|with)/,
	'JavaScript/Reference/Statements/do...while': /(do)/,
	'JavaScript/Reference/Statements/if...else': /(if|else)/,
	'JavaScript/Reference/Statements/try...catch': /(try|catch|finally)/,
	'JavaScript/Reference/Operators/Special/$1': /(delete|in|instanceof|new|this|typeof|void)/,
	'DOM/document.$1': /(alinkColor|anchors|applets|bgColor|body|characterSet|compatMode|contentType|cookie|defaultView|designMode|doctype|documentElement|domain|embeds|fgColor|forms|height|images|implementation|lastModified|linkColor|links|plugins|popupNode|referrer|styleSheets|title|tooltipNode|URL|vlinkColor|width|clear|createAttribute|createDocumentFragment|createElement|createElementNS|createEvent|createNSResolver|createRange|createTextNode|createTreeWalker|evaluate|execCommand|getElementById|getElementsByName|importNode|loadOverlay|queryCommandEnabled|queryCommandIndeterm|queryCommandState|queryCommandValue|write|writeln)/,
	'DOM/element.$1': /(attributes|childNodes|className|clientHeight|clientLeft|clientTop|clientWidth|dir|firstChild|id|innerHTML|lang|lastChild|localName|name|namespaceURI|nextSibling|nodeName|nodeType|nodeValue|offsetHeight|offsetLeft|offsetParent|offsetTop|offsetWidth|ownerDocument|parentNode|prefix|previousSibling|scrollHeight|scrollLeft|scrollTop|scrollWidth|style|tabIndex|tagName|textContent|addEventListener|appendChild|blur|click|cloneNode|dispatchEvent|focus|getAttribute|getAttributeNS|getAttributeNode|getAttributeNodeNS|getElementsByTagName|getElementsByTagNameNS|hasAttribute|hasAttributeNS|hasAttributes|hasChildNodes|insertBefore|item|normalize|removeAttribute|removeAttributeNS|removeAttributeNode|removeChild|removeEventListener|replaceChild|scrollIntoView|setAttribute|setAttributeNS|setAttributeNode|setAttributeNodeNS|supports|onblur|onchange|onclick|ondblclick|onfocus|onkeydown|onkeypress|onkeyup|onmousedown|onmousemove|onmouseout|onmouseover|onmouseup|onresize)/,
	'DOM/event.$1': /(altKey|bubbles|button|cancelBubble|cancelable|clientX|clientY|ctrlKey|currentTarget|detail|eventPhase|explicitOriginalTarget|isChar|layerX|layerY|metaKey|originalTarget|pageX|pageY|relatedTarget|screenX|screenY|shiftKey|target|timeStamp|type|view|which|initEvent|initKeyEvent|initMouseEvent|initUIEvent|stopPropagation|preventDefault)/,
	'DOM/form.$1': /(elements|name|acceptCharset|action|enctype|encoding|method|submit|reset)/,
	'DOM/table.$1': /(caption|tHead|tFoot|rows|tBodies|align|bgColor|border|cellPadding|cellSpacing|frame|rules|summary|width|createTHead|deleteTHead|createTFoot|deleteTFoot|createCaption|deleteCaption|insertRow|deleteRow)/,
	'DOM/window.$1': /(content|closed|controllers|crypto|defaultStatus|directories|document|frameElement|frames|history|innerHeight|innerWidth|location|locationbar|menubar|name|navigator|opener|outerHeight|outerWidth|pageXOffset|pageYOffset|parent|personalbar|pkcs11|screen|availTop|availLeft|availHeight|availWidth|colorDepth|height|left|pixelDepth|top|width|scrollbars|scrollMaxX|scrollMaxY|scrollX|scrollY|self|sidebar|status|statusbar|toolbar|window|alert|atob|back|btoa|captureEvents|clearInterval|clearTimeout|close|confirm|dump|escape|find|forward|getAttention|getComputedStyle|getSelection|home|moveBy|moveTo|open|openDialog|print|prompt|releaseEvents|resizeBy|resizeTo|scroll|scrollBy|scrollByLines|scrollByPages|scrollTo|setInterval|setTimeout|sizeToContent|stop|unescape|updateCommands|onabort|onclose|ondragdrop|onerror|onload|onpaint|onreset|onscroll|onselect|onsubmit|onunload)/,
	'https://www.w3.org/TR/XMLHttpRequest/': /(XMLHttpRequest)/,
	'JavaScript/Reference/Global_Objects/Array/$1': /(?<=\.)(length|pop|push|reverse|shift|sort|splice|unshift|concat|join|slice)/,
	'JavaScript/Reference/Global_Objects/Date/$1': /(?<=\.)(getDate|getDay|getFullYear|getHours|getMilliseconds|getMinutes|getMonth|getSeconds|getTime|getTimezoneOffset|getUTCDate|getUTCDay|getUTCFullYear|getUTCHours|getUTCMilliseconds|getUTCMinutes|getUTCMonth|getUTCSeconds|setDate|setFullYear|setHours|setMilliseconds|setMinutes|setMonth|setSeconds|setTime|setUTCDate|setUTCFullYear|setUTCHours|setUTCMilliseconds|setUTCMinutes|setUTCMonth|setUTCSeconds|toDateString|toLocaleDateString|toLocaleTimeString|toTimeString|toUTCString)/,
	'JavaScript/Reference/Global_Objects/Function/$1': /(?<=\.)(apply|call)/,
	'JavaScript/Reference/Global_Objects/Number/$1': /(?<=\.)(toExponential|toFixed|toPrecision)/,
	'JavaScript/Reference/Global_Objects/RegExp/$1': /(?<=\.)(exec|test)/,
	'JavaScript/Reference/Global_Objects/String/$1': /(?<=\.)(charAt|charCodeAt|concat|indexOf|lastIndexOf|localeCompare|match|replace|search|slice|split|substr|substring|toLocaleLowerCase|toLocaleUpperCase|toLowerCase|toUpperCase)/,
}); // collisions: bgColor, height, width, length, name

jush.build_links2('js_doc', 'https://code.google.com/p/jsdoc-toolkit/wiki/Tag$key', /(^[ \t]*|\n\s*\*\s*|(?={))/, /(\b)/g, {
	'$1': /(@(?:augments|author|borrows|class|constant|constructor|constructs|default|deprecated|description|event|example|field|fileOverview|function|ignore|inner|lends|memberOf|name|namespace|param|private|property|public|requires|returns|see|since|static|throws|type|version)|\{@link)/,
	'Param': /(@argument)/,
	'Augments': /(@extends)/,
});
