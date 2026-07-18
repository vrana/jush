jush.tr.sqlite = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, sql_var: /[:@$]/, sqlite_sqliteset: /(\b)(PRAGMA)(\s+)/i, num: jush.num };
jush.tr.sqlite_sqliteset = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, num: jush.num, _1: /;|$/ };
jush.tr.sqliteset = { _0: /$/ };
jush.tr.sqlitestatus = { _0: /$/ };

jush.urls.sqlite_sqliteset = 'https://www.sqlite.org/$key';
jush.build_links2('sqlite', 'https://www.sqlite.org/$key', /(\b)/, /(\b)/gi, {
	'lang_$1.html': /(ALTER\s+TABLE|ANALYZE|ATTACH|COPY|DELETE|DETACH|DROP\s+INDEX|DROP\s+TABLE|DROP\s+TRIGGER|DROP\s+VIEW|EXPLAIN|INSERT|CONFLICT|REINDEX|REPLACE|SELECT|UPDATE|TRANSACTION|VACUUM|WITH)/,
	'lang_createvtab.html': /(CREATE\s+VIRTUAL\s+TABLE)/,
	'lang_transaction.html': /(BEGIN|COMMIT|ROLLBACK)/,
	'lang_createindex.html': /(CREATE(?:\s+UNIQUE)?\s+INDEX)/,
	'lang_createtable.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TABLE)/,
	'lang_createtrigger.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TRIGGER)/,
	'lang_createview.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+VIEW)/,
	'stricttables.html': /(STRICT)/,
	'withoutrowid.html': /(WITHOUT\s+ROWID)/,
	'gencol.html': /(GENERATED|ALWAYS|STORED|VIRTUAL)/,
	'windowfunctions.html': /(OVER|PARTITION\s+BY|WINDOW|FILTER)/,
	'windowfunctions.html#$1': /(row_number|rank|dense_rank|ntile|lag|lead|first_value|last_value|nth_value|cume_dist|percent_rank)(?=\s*\(|$)/,
	'datatype3.html': /(INTEGER|TEXT|BLOB|REAL|NUMERIC)/,
	'': /(ABORT|ACTION|ADD|AFTER|ALL|AS|ASC|AUTOINCREMENT|BEFORE|BY|CASCADE|CHECK|COLUMN|CONSTRAINT|CROSS|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATABASE|DEFAULT|DEFERRABLE|DEFERRED|DESC|DISTINCT|DO|EACH|END|EXCEPT|EXCLUDED|EXCLUSIVE|FAIL|FALSE|FOR|FOREIGN|FROM|FULL|GROUP|HAVING|IF|IGNORE|IMMEDIATE|INDEXED|INITIALLY|INNER|INSTEAD|INTERSECT|INTO|IS|JOIN|KEY|LEFT|LIMIT|NATURAL|NO|NOT|NOTHING|NOTNULL|NULL|OF|OFFSET|ON|ORDER|OUTER|PLAN|PRAGMA|PRIMARY|QUERY|RAISE|RECURSIVE|REFERENCES|RELEASE|RENAME|RESTRICT|RETURNING|RIGHT|ROW|SAVEPOINT|SET|TEMPORARY|TO|TRUE|UNION|UNIQUE|USING|VALUES|WHERE)/,
	'lang_expr.html#$1': /(like|glob|regexp|match|escape|isnull|isnotnull|between|exists|case|when|then|else|cast|collate|in|and|or|not)/,
	'lang_corefunc.html#$1': /(abs|char|changes|coalesce|glob|ifnull|iif|instr|hex|last_insert_rowid|length|like|load_extension|lower|ltrim|nullif|printf|quote|random|randomblob|round|rtrim|soundex|sqlite_compileoption_get|sqlite_compileoption_used|sqlite_source_id|sqlite_version|substr|total_changes|trim|typeof|unicode|upper|zeroblob)(?=\s*\(|$)/,
	'lang_mathfunc.html#$1': /(acos|asin|atan|atan2|ceil|ceiling|cos|degrees|exp|floor|ln|log|log2|log10|mod|pi|pow|radians|sin|sqrt|tan|trunc)(?=\s*\(|$)/,
	'lang_datefunc.html#$1': /(date|time|datetime|julianday|strftime|unixepoch)(?=\s*\(|$)/,
	'lang_aggfunc.html#$1': /(avg|count|group_concat|max|min|sum|total)(?=\s*\(|$)/,
	'json1.html#$1': /(json|json_array|json_array_length|json_each|json_extract|json_group_array|json_group_object|json_insert|json_object|json_patch|json_quote|json_remove|json_replace|json_set|json_tree|json_type|json_valid)(?=\s*\(|$)/,
}); // collisions: min, max, end, like, glob, trunc
jush.urls.sqliteset = ['https://www.sqlite.org/pragma.html#$key',
	'pragma_$1'
];
jush.urls.sqlitestatus = ['https://www.sqlite.org/compile.html#$key',
	'$1'
];

jush.links.sqlite_sqliteset = { 'pragma.html': /.+/ };

jush.links2.sqliteset = /(\b)(application_id|auto_vacuum|automatic_index|busy_timeout|cache_size|case_sensitive_like|cell_size_check|checkpoint_fullfsync|collation_list|compile_options|database_list|default_cache_size|defer_foreign_keys|encoding|foreign_key_check|foreign_key_list|foreign_keys|freelist_count|fullfsync|function_list|ignore_check_constraints|incremental_vacuum|index_info|index_list|integrity_check|journal_mode|journal_size_limit|locking_mode|max_page_count|mmap_size|module_list|optimize|page_count|page_size|parser_trace|pragma_list|quick_check|read_uncommitted|recursive_triggers|reverse_unordered_selects|schema_version|secure_delete|shrink_memory|soft_heap_limit|stats|synchronous|table_info|table_xinfo|temp_store|temp_store_directory|threads|trusted_schema|user_version|vdbe_listing|vdbe_trace|wal_autocheckpoint|wal_checkpoint|writable_schema)(\b)/gi;
jush.links2.sqlitestatus = /()(.+)()/g;
