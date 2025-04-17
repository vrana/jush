/** Get callback for autocompletition
* @param string escaped empty identifier, e.g. `` for MySQL or [] for MS SQL
* @param Object<string, Array<string>> keys are table names, values are lists of columns
* @return Function see autocomplete()
*/
jush.autocompleteSql = function (esc, tablesColumns) {
	/**
	* key: regular expression; ' ' will be expanded to '\\s+', '\\w' to esc[0]+'?\\w'+esc[1]+'?', '$' will be appended
	* value: list of autocomplete words; '?' means to not use the word if it's already in the current query
	*/
	const keywordsDefault = {
		'^': ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'EXPLAIN'],
		'^EXPLAIN ': ['SELECT'],
		'^INSERT ': ['IGNORE'],
		'^INSERT .+\\) ': ['?VALUES', 'ON DUPLICATE KEY UPDATE'],
		'^UPDATE \\w+ ': ['SET'],
		'^UPDATE \\w+ SET .+ ': ['?WHERE'],
		'^DELETE FROM \\w+ ': ['WHERE'],
		' JOIN \\w+ ': ['ON', 'USING'],
		'\\bSELECT ': ['*', 'DISTINCT'],
		'\\bSELECT .+ ': ['?FROM'],
		'\\bSELECT (?!.* (WHERE|GROUP BY|HAVING|ORDER BY|LIMIT) ).+ FROM .+ ': ['INNER JOIN', 'LEFT JOIN', '?WHERE'],
		'\\bSELECT (?!.* (HAVING|ORDER BY|LIMIT|OFFSET) ).+ FROM .+ ': ['?GROUP BY'],
		'\\bSELECT (?!.* (ORDER BY|LIMIT|OFFSET) ).+ FROM .+ ': ['?HAVING'],
		'\\bSELECT (?!.* (LIMIT|OFFSET) ).+ FROM .+ ': ['?ORDER BY'], // this matches prefixes without LIMIT|OFFSET and offers ORDER BY if it's not already used in prefix or suffix
		'\\bSELECT (?!.* (OFFSET) ).+ FROM .+ ': ['?LIMIT', '?OFFSET'],
		' ORDER BY (?!.* (LIMIT|OFFSET) ).+ ': ['DESC'],
	};
	
	/** Get list of strings for autocompletion
	* @param string
	* @param string
	* @param string
	* @return Object<string, number> keys are words, values are offsets
	*/
	function autocomplete(state, before, after) {
		if (/^(one|com|sql_apo|sqlite_apo)$/.test(state)) {
			return {};
		}
		before = before
			.replace(/\/\*.*?\*\/|\s--[^\n]*|'[^']+'/s, '') // strip comments and strings
			.replace(/.*;/s, '') // strip previous query
			.trimStart()
		;
		after = after.replace(/;.*/s, ''); // strip next query
		const query = before + after;
		const allTables = Object.keys(tablesColumns);
		const usedTables = findTables(query); // tables used by the current query
		const uniqueColumns = {};
		for (const table of usedTables) {
			for (const column of tablesColumns[table]) {
				uniqueColumns[column] = 0;
			}
		}
		const columns = Object.keys(uniqueColumns);
		if (columns.length > 50) {
			columns.length = 0;
		}
		if (usedTables.length > 1) {
			for (const table of usedTables) {
				columns.push(table + '.');
			}
		}
		
		const preferred = {
			'\\b(FROM|INTO|^UPDATE|JOIN) ': allTables, // all tables including the current ones (self-join)
			'\\b(^INSERT|USING) [^(]*\\(([^)]+, )?': columns, // offer columns right after '(' or after ','
			'(^UPDATE .+ SET| DUPLICATE KEY UPDATE| BY) (.+, )?': columns,
			' (WHERE|HAVING|AND|OR|ON|=) ': columns,
		};
		keywordsDefault['\\bSELECT( DISTINCT)? (?!.* FROM )(.+, )?'] = columns; // this is not in preferred because we prefer '*'
		
		const context = before.replace(escRe('[\\w`]+$'), ''); // in 'UPDATE tab.`co', context is 'UPDATE tab.'
		before = before.replace(escRe('.*[^\\w`]', 's'), ''); // in 'UPDATE tab.`co', before is '`co'
		
		const thisColumns = []; // columns in the current table ('table.')
		const match = context.match(escRe('`?(\\w+)`?\\.$'));
		if (match && tablesColumns[match[1]]) {
			thisColumns.push(...tablesColumns[match[1]]);
			preferred['\.'] = thisColumns;
		}

		if (query.includes(esc[0]) && !/^\w/.test(before)) { // if there's any ` in the query, use ` everywhere unless the user starts typing letters
			allTables.forEach(addEsc);
			columns.forEach(addEsc);
			thisColumns.forEach(addEsc);
		}
		
		const ac = {};
		for (const keywords of [preferred, keywordsDefault]) {
			for (const re in keywords) {
				if (context.match(escRe(re.replace(/ /g, '\\s+').replace(/\\w\+/g, '`?\\w+`?') + '$', 'is'))) {
					for (let keyword of keywords[re]) {
						if (keyword[0] == '?') {
							keyword = keyword.substring(1);
							if (query.match(new RegExp('\\s+' + keyword + '\\s+', 'i'))) {
								continue;
							}
						}
						if (keyword.length != before.length && keyword.substring(0, before.length).toUpperCase() == before.toUpperCase()) {
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
		array[key] = esc[0] + val.replace(/\.?$/, esc[1] + '$&');
	}

	/** Change first ` to esc[0], second to esc[1] */
	function escRe(re, flags) {
		return new RegExp(re
			.replace(/`/, (esc[0] == '[' ? '\\' : '') + esc[0])
			.replace(/`/, (esc[1] == ']' ? '\\' : '') + esc[1]), flags);
	}
	
	function findTables(query) { //! aliases
		const matches = query.matchAll(escRe('\\b(FROM|INTO|UPDATE|JOIN)\\s+(\\w+|`.+?`)', 'gi')); //! handle `abc``def`
		const result = [];
		for (const match of matches) {
			const table = match[2].replace(escRe('^`|`$', 'g'), '');
			if (tablesColumns[table]) {
				result.push(table);
			}
		}
		if (!result.length) {
			return Object.keys(tablesColumns);
		}
		return result;
	}

	// we open the autocomplete on word character, space, '(', '.' and '`'; textarea also triggers it on Backspace and Ctrl+Space
	autocomplete.openBy = escRe('^[\\w`(. ]$'); //! ignore . in 1.23

	return autocomplete;
};
