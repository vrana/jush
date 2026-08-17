/** Get callback for autocompletition
* @param {string} esc escaped empty identifier, e.g. `` for MySQL or [] for MS SQL
* @param {Object<string, Array<string>>} tablesColumns keys are table names, values are lists of columns
* @param {Array<string>} [statements] statements offered at the beginning of a query, all by default
* @return {Function} see autocomplete()
*/
jush.autocompleteSql = function (esc, tablesColumns, statements) {
	const mysql = (esc == '``'); // the escaping is the only hint about the database

	/**
	* key: regular expression; ' ' will be expanded to '\\s+', '\\w' to esc[0]+'?\\w'+esc[1]+'?', '$' will be appended
	* value: list of autocomplete words; '?' means to not use the word if it's already in the current query
	*/
	const keywordsDefault = {
		'^': statements || ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'TRUNCATE', 'EXPLAIN'],
		'^EXPLAIN ': ['SELECT'],
		'^INSERT ': (mysql ? ['IGNORE'] : []),
		'^INSERT [^]+\\) ': ['?VALUES'].concat(mysql ? ['ON DUPLICATE KEY UPDATE'] : []),
		'^UPDATE \\w+ ': ['SET'],
		'^UPDATE \\w+ SET [^]+ ': ['?WHERE'],
		'^DELETE FROM \\w+ ': ['WHERE'],
		' JOIN \\w+(( AS)? (?!(ON|USING|AS) )\\w+)? ': ['ON', 'USING'],
		'\\bSELECT ': ['*', 'DISTINCT'],
		'\\bSELECT [^]*[^,] ': ['?FROM'],
		'\\bSELECT (?![^]* (WHERE|GROUP BY|HAVING|ORDER BY|LIMIT) )[^]+ FROM [^]+ ': ['INNER JOIN', 'LEFT JOIN', '?WHERE'],
		'\\bSELECT (?![^]* (HAVING|ORDER BY|LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?GROUP BY'],
		'\\bSELECT (?![^]* (ORDER BY|LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?HAVING'],
		'\\bSELECT (?![^]* (LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?ORDER BY'], // this matches prefixes without LIMIT|OFFSET and offers ORDER BY if it's not already used in prefix or suffix
		'\\bSELECT (?![^]* (OFFSET) )[^]+ FROM [^]+ ': (esc != '[]' ? ['?LIMIT', '?OFFSET'] : []), // MS SQL uses TOP
		' ORDER BY (?![^]* (LIMIT|OFFSET) )[^]+ ': ['DESC'],
	};

	// strings and comments must be found in a single pass, otherwise a delimiter inside the other construct would be honored
	const literals = new RegExp(
		'\'(?:[^\']|\'\')*\'?' // string, possibly unterminated
		+ '|/\\*[^]*?(?:\\*/|$)' // block comment
		+ '|(?:^|\\s)--' + (mysql ? ' ' : '') + '[^\\n]*' // line comment
		+ (mysql ? '|#[^\\n]*' : '') // # is a comment only in MySQL
	, 'g');

	let forceEscape = false;

	/** Replace a string by a placeholder and a comment by whitespace
	* @param {string} literal
	* @return {string}
	*/
	function replaceLiteral(literal) {
		return (literal[0] == '\'' ? '0' : ' ');
	}

	/** Get list of strings for autocompletion
	* @param {string} state
	* @param {string} before
	* @param {string} after
	* @return {Object<string, number>} keys are words, values are offsets
	*/
	function autocomplete(state, before, after) {
		// the other states are comments, strings or another language, e.g. a JavaScript routine body
		if (jush.autocompleting.sql.indexOf(state) < 0) {
			return {};
		}
		before = before
			.replace(literals, replaceLiteral)
			.replace(/[^]*;/, '') // strip previous query
			.replace(/^\s+/, '')
		;
		after = after
			.replace(literals, replaceLiteral)
			.replace(/;[^]*/, '') // strip next query
		;
		const query = before + after;
		const allTables = Object.keys(tablesColumns);
		const usedTables = findTables(query); // tables used by the current query
		const uniqueColumns = {};
		for (const alias in usedTables) {
			for (const column of tablesColumns[usedTables[alias]]) {
				uniqueColumns[column] = 0;
			}
		}
		const columns = Object.keys(uniqueColumns);
		if (columns.length > 50) {
			columns.length = 0;
		}
		if (Object.keys(usedTables).length > 1) {
			for (const alias in usedTables) {
				columns.push(alias + '.');
			}
		}

		const preferred = {
			'\\b(FROM|INTO|^UPDATE|JOIN|^TRUNCATE) ': allTables, // all tables including the current ones (self-join)
			'\\b(^INSERT|USING) [^(]*\\(([^)]+, )?': columns, // offer columns right after '(' or after ','
			'\\b(?!(IN|VALUES)\\()[a-z_]\\w*\\(([^)]+, )?': columns, // function call; IN() and VALUES() contain values
			'(^UPDATE [^]+ SET| DUPLICATE KEY UPDATE| BY) ([^]+, )?': columns,
			' (WHERE|HAVING|AND|OR|ON|=) (\\(\\s*)*': columns, // the condition can be parenthesized
		};
		keywordsDefault['\\bSELECT( DISTINCT)? (?![^]* FROM )([^]+, )?'] = columns; // this is not in preferred because we prefer '*'

		const context = before.replace(escRe('[\\w`]+$'), ''); // in 'UPDATE tab.`co', context is 'UPDATE tab.'
		before = before.replace(escRe('[^]*[^\\w`]'), ''); // in 'UPDATE tab.`co', before is '`co'

		const thisColumns = []; // columns in the current table ('table.')
		const match = context.match(escRe('`?(\\w+)`?\\.$'));
		if (match) {
			let table = match[1];
			if (!tablesColumns[table]) {
				table = usedTables[table];
			}
			if (tablesColumns[table]) {
				thisColumns.push(...tablesColumns[table]);
				preferred['\\.'] = thisColumns;
			}
		}

		forceEscape = query.includes(esc[0]) && !/^\w/.test(before); // if there's any ` in the query, use ` everywhere unless the user starts typing letters
		allTables.forEach(addEsc);
		columns.forEach(addEsc);
		thisColumns.forEach(addEsc);

		const ac = {};
		for (const keywords of [preferred, keywordsDefault]) {
			for (const re in keywords) {
				if (context.match(escRe(re.replace(/ /g, '\\s+').replace(/\\w\+/g, '`?\\w+`?') + '$', 'i'))) {
					for (let keyword of keywords[re]) {
						if (keyword[0] == '?') {
							keyword = keyword.substring(1);
							if (query.match(new RegExp('\\s+' + keyword.replace(/ /g, '\\s+') + '\\s+', 'i'))) {
								continue;
							}
						}
						if (keyword.length > before.length && keyword.toUpperCase().startsWith(before.toUpperCase())) {
							const isCol = (keywords[re] == columns || keywords[re] == thisColumns);
							ac[keyword + (isCol ? '' : ' ')] = before.length;
						}
					}
				}
			}
		}

		return ac;
	}

	function addEsc(val, key, array) {
		if (forceEscape || !/^[a-z_]\w*\.?$/i.test(val)) {
			array[key] = esc[0] + val.replace(/\.?$/, esc[1] + '$&');
		}
	}

	/** Change odd ` to esc[0], even to esc[1] */
	function escRe(re, flags) {
		let i = 0;
		return new RegExp(re.replace(/`/g, () => (esc[0] == '[' ? '\\' : '') + esc[i++ % 2]), flags);
	}

	/** @return {Object<string, string>} key is alias, value is actual table */
	function findTables(query) {
		const re = escRe('\\b(FROM|JOIN|INTO|UPDATE)\\s+(\\w+|`.+?`)((\\s+AS)?\\s+((?!(LEFT|INNER|JOIN|ON|USING|WHERE|GROUP|HAVING|ORDER|LIMIT)\\b)\\w+|`.+?`))?', 'gi'); //! handle `abc``def`
		const result = {};
		let match;
		while ((match = re.exec(query))) {
			const table = match[2].replace(escRe('^`|`$', 'g'), '');
			const alias = (match[5] ? match[5].replace(escRe('^`|`$', 'g'), '') : table);
			if (tablesColumns[table]) {
				result[alias] = table;
			}
		}
		if (!Object.keys(result).length) {
			for (const table in tablesColumns) {
				result[table] = table;
			}
		}
		return result;
	}

	// we open the autocomplete on word character, space, '(', '.' and '`'; textarea also triggers it on Backspace and Ctrl+Space
	autocomplete.openBy = escRe('^[\\w`(. ]$'); //! ignore . in 1.23

	return autocomplete;
};
