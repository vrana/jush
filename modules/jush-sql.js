jush.tr.sql = { one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_sqlset: /(\s*)(SET)(\s+|$)(?!NAMES\b|CHARACTER\b|PASSWORD\b|(?:GLOBAL\s+|SESSION\s+)?TRANSACTION\b|@[^@]|NEW\.|OLD\.)/i, sql_code: /()/ };
jush.tr.sql_code = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_var: /\B@/, num: jush.num, _1: /;|\b(THEN|ELSE|LOOP|REPEAT|DO)\b/i };
jush.tr.sql_sqlset = { one: /-- |#|--(?=\n|$)/, com: /\/\*/, sqlset_val: /=/, _1: /;|$/ };
jush.tr.sqlset_val = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com: /\/\*/, _1: /,/, _2: /;|$/, num: jush.num }; //! comma can be inside function call
jush.tr.sqlset = { _0: /$/ }; //! jump from SHOW VARIABLES LIKE ''
jush.tr.sqlstatus = { _0: /$/ }; //! jump from SHOW STATUS LIKE ''
jush.tr.com_code = { _1: /()/ };

jush.urls.sql_sqlset = 'https://dev.mysql.com/doc/mysql/en/$key';
jush.urls.sql = ['https://dev.mysql.com/doc/mysql/en/$key',
	'alter-event.html', 'alter-table.html', 'alter-view.html', 'analyze-table.html', 'create-event.html', 'create-function.html', 'create-procedure.html', 'create-index.html', 'create-table.html', 'create-trigger.html', 'create-view.html', 'drop-index.html', 'drop-table.html', 'begin-end.html', 'optimize-table.html', 'repair-table.html', 'set-transaction.html', 'show-columns.html', 'show-engines.html', 'show-index.html', 'show-processlist.html', 'show-status.html', 'show-tables.html', 'show-variables.html',
	'$1.html', '$1-statement.html', 'if-statement.html', 'repeat-statement.html', 'truncate-table.html', 'commit.html', 'savepoints.html', 'lock-tables.html', 'charset-connection.html', 'insert-on-duplicate.html', 'fulltext-search.html', 'example-auto-increment.html',
	'comparison-operators.html#operator_$1', 'comparison-operators.html#function_$1', 'any-in-some-subqueries.html', 'all-subqueries.html', 'exists-and-not-exists-subqueries.html', 'group-by-modifiers.html', 'string-functions.html#operator_$1', 'string-comparison-functions.html#operator_$1', 'regexp.html#operator_$1', 'regexp.html#operator_regexp', 'logical-operators.html#operator_$1', 'control-flow-functions.html#operator_$1', 'arithmetic-functions.html#operator_$1', 'cast-functions.html#operator_$1', 'date-and-time-functions.html#function_$1', 'date-and-time-functions.html#function_date-add',
	'', // keywords without link
	'numeric-type-syntax.html', 'date-and-time-type-syntax.html', 'string-type-syntax.html', 'mysql-spatial-datatypes.html',
	'mathematical-functions.html#function_$1', 'information-functions.html#function_$1',
	'$1-storage-engine.html', 'merge-storage-engine.html',
	'partitioning-range.html', 'partitioning-list.html', 'partitioning-columns.html', 'partitioning-hash.html', 'partitioning-linear-hash.html', 'partitioning-key.html',
	'comparison-operators.html#function_$1', 'control-flow-functions.html#function_$1', 'string-functions.html#function_$1', 'string-comparison-functions.html#function_$1', 'mathematical-functions.html#function_$1', 'date-and-time-functions.html#function_$1', 'cast-functions.html#function_$1', 'xml-functions.html#function_$1', 'bit-functions.html#function_$1', 'encryption-functions.html#function_$1', 'information-functions.html#function_$1', 'miscellaneous-functions.html#function_$1', 'group-by-functions.html#function_$1',
	'functions-to-convert-geometries-between-formats.html#function_asbinary',
	'functions-to-convert-geometries-between-formats.html#function_astext',
	'functions-for-testing-spatial-relations-between-geometric-objects.html#function_$1',
	'functions-that-create-new-geometries-from-existing-ones.html#function_$1',
	'geometry-property-functions.html#function_$1',
	'gis-wkt-functions.html#function_st-$1',
	'row-subqueries.html',
	'fulltext-search.html#function_match'
];
jush.urls.sqlset = ['https://dev.mysql.com/doc/mysql/en/$key',
	'innodb-parameters.html#sysvar_$1',
	'mysql-cluster-program-options-mysqld.html#option_mysqld_$1', 'mysql-cluster-replication-conflict-resolution.html#option_mysqld_$1', 'mysql-cluster-replication-schema.html', 'mysql-cluster-replication-starting.html', 'mysql-cluster-system-variables.html#sysvar_$1',
	'replication-options-binary-log.html#option_mysqld_$1', 'replication-options-binary-log.html#sysvar_$1', 'replication-options-master.html#sysvar_$1', 'replication-options-slave.html#option_mysqld_log-slave-updates', 'replication-options-slave.html#option_mysqld_$1', 'replication-options-slave.html#sysvar_$1', 'replication-options.html#option_mysqld_$1',
	'server-options.html#option_mysqld_big-tables', 'server-options.html#option_mysqld_$1',
	'server-system-variables.html#sysvar_$1', // previously server-session-variables
	'server-system-variables.html#sysvar_low_priority_updates', 'server-system-variables.html#sysvar_max_join_size', 'server-system-variables.html#sysvar_$1',
	'ssl-options.html#option_general_$1'
];
jush.urls.sqlstatus = ['https://dev.mysql.com/doc/mysql/en/$key',
	'server-status-variables.html#statvar_Com_xxx',
	'server-status-variables.html#statvar_$1'
];

jush.links.sql_sqlset = { 'set-statement.html': /.+/ };

jush.links2.sql = /(\b)(ALTER(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT|(ALTER(?:\s+ONLINE|\s+OFFLINE)?(?:\s+IGNORE)?\s+TABLE)|(ALTER(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)|(ANALYZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+FUNCTION)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+PROCEDURE)|(CREATE(?:\s+ONLINE|\s+OFFLINE)?(?:\s+UNIQUE|\s+FULLTEXT|\s+SPATIAL)?\s+INDEX)|(CREATE(?:\s+TEMPORARY)?\s+TABLE)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+TRIGGER)|(CREATE(?:\s+OR\s+REPLACE)?(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)|(DROP(?:\s+ONLINE|\s+OFFLINE)?\s+INDEX)|(DROP(?:\s+TEMPORARY)?\s+TABLE)|(END)|(OPTIMIZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(REPAIR(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(SET(?:\s+GLOBAL|\s+SESSION)?\s+TRANSACTION\s+ISOLATION\s+LEVEL)|(SHOW(?:\s+FULL)?\s+COLUMNS)|(SHOW(?:\s+STORAGE)?\s+ENGINES)|(SHOW\s+(?:INDEX|INDEXES|KEYS))|(SHOW(?:\s+FULL)?\s+PROCESSLIST)|(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+STATUS)|(SHOW(?:\s+FULL)?\s+TABLES)|(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+VARIABLES)|(ALTER\s+(?:DATABASE|SCHEMA)|ALTER\s+LOGFILE\s+GROUP|ALTER\s+SERVER|ALTER\s+TABLESPACE|BACKUP\s+TABLE|CACHE\s+INDEX|CALL|CHANGE\s+MASTER\s+TO|CHECK\s+TABLE|CHECKSUM\s+TABLE|CREATE\s+(?:DATABASE|SCHEMA)|CREATE\s+LOGFILE\s+GROUP|CREATE\s+SERVER|CREATE\s+TABLESPACE|CREATE\s+USER|DELETE|DESCRIBE|DO|DROP\s+(?:DATABASE|SCHEMA)|DROP\s+EVENT|DROP\s+FUNCTION|DROP\s+PROCEDURE|DROP\s+LOGFILE\s+GROUP|DROP\s+SERVER|DROP\s+TABLESPACE|DROP\s+TRIGGER|DROP\s+USER|DROP\s+VIEW|EXPLAIN|FLUSH|GRANT|HANDLER|HELP|INSERT|INSTALL\s+PLUGIN|JOIN|KILL|LOAD\s+DATA\s+FROM\s+MASTER|LOAD\s+DATA|LOAD\s+INDEX|LOAD\s+XML|PURGE\s+MASTER\s+LOGS|RENAME\s+(?:DATABASE|SCHEMA)|RENAME\s+TABLE|RENAME\s+USER|REPLACE|RESET\s+MASTER|RESET\s+SLAVE|RESIGNAL|RESTORE\s+TABLE|REVOKE|SELECT|SET\s+PASSWORD|SHOW\s+AUTHORS|SHOW\s+BINARY\s+LOGS|SHOW\s+BINLOG\s+EVENTS|SHOW\s+CHARACTER\s+SET|SHOW\s+COLLATION|SHOW\s+CONTRIBUTORS|SHOW\s+CREATE\s+(?:DATABASE|SCHEMA)|SHOW\s+CREATE\s+TABLE|SHOW\s+CREATE\s+VIEW|SHOW\s+(?:DATABASE|SCHEMA)S|SHOW\s+ENGINE|SHOW\s+ERRORS|SHOW\s+GRANTS|SHOW\s+MASTER\s+STATUS|SHOW\s+OPEN\s+TABLES|SHOW\s+PLUGINS|SHOW\s+PRIVILEGES|SHOW\s+SCHEDULER\s+STATUS|SHOW\s+SLAVE\s+HOSTS|SHOW\s+SLAVE\s+STATUS|SHOW\s+TABLE\s+STATUS|SHOW\s+TRIGGERS|SHOW\s+WARNINGS|SHOW|SIGNAL|START\s+SLAVE|STOP\s+SLAVE|UNINSTALL\s+PLUGIN|UNION|UPDATE|USE)|(LOOP|LEAVE|ITERATE|WHILE)|(IF|ELSEIF)|(REPEAT|UNTIL)|(TRUNCATE(?:\s+TABLE)?)|(START\s+TRANSACTION|BEGIN|COMMIT|ROLLBACK)|(SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)|((?:UN)?LOCK\s+TABLES?)|(SET\s+NAMES|SET\s+CHARACTER\s+SET)|(ON\s+DUPLICATE\s+KEY\s+UPDATE)|(IN\s+BOOLEAN\s+MODE|IN\s+NATURAL\s+LANGUAGE\s+MODE|WITH\s+QUERY\s+EXPANSION)|(AUTO_INCREMENT)|(IS|IS\s+NULL)|(BETWEEN|NOT\s+BETWEEN|IN|NOT\s+IN)|(ANY|SOME)|(ALL)|(EXISTS|NOT\s+EXISTS)|(WITH\s+ROLLUP)|(SOUNDS\s+LIKE)|(LIKE|NOT\s+LIKE)|(NOT\s+REGEXP|REGEXP)|(RLIKE)|(NOT|AND|OR|XOR)|(CASE)|(DIV)|(BINARY)|(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|LOCALTIME|LOCALTIMESTAMP|UTC_DATE|UTC_TIME|UTC_TIMESTAMP)|(INTERVAL)|(ACCESSIBLE|ADD|ALTER|ANALYZE|AS|ASC|ASENSITIVE|BEFORE|BOTH|BY|CASCADE|CHANGE|CHARACTER|CHECK|CLOSE|COLLATE|COLUMN|CONDITION|CONSTRAINT|CONTINUE|CONVERT|CREATE|CROSS|CURSOR|DATABASE|DATABASES|DAY_HOUR|DAY_MICROSECOND|DAY_MINUTE|DAY_SECOND|DECLARE|DEFAULT|DELAYED|DESC|DETERMINISTIC|DISTINCT|DISTINCTROW|DROP|DUAL|EACH|ELSE|ENCLOSED|ESCAPED|EXIT|FALSE|FETCH|FLOAT4|FLOAT8|FOR|FORCE|FOREIGN|FROM|FULLTEXT|GROUP|HAVING|HIGH_PRIORITY|HOUR_MICROSECOND|HOUR_MINUTE|HOUR_SECOND|IGNORE|INDEX|INFILE|INNER|INOUT|INSENSITIVE|INT1|INT2|INT3|INT4|INT8|INTO|KEY|KEYS|LEADING|LEFT|LIMIT|LINEAR|LINES|LOAD|LOCK|LONG|LOW_PRIORITY|MASTER_SSL_VERIFY_SERVER_CERT|MATCH|MIDDLEINT|MINUTE_MICROSECOND|MINUTE_SECOND|MODIFIES|NATURAL|NO_WRITE_TO_BINLOG|NULL|OFFSET|ON|OPEN|OPTIMIZE|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|PRECISION|PRIMARY|PROCEDURE|PURGE|RANGE|READ|READS|READ_WRITE|REFERENCES|RELEASE|RENAME|REQUIRE|RESTRICT|RETURN|RIGHT|SCHEMA|SCHEMAS|SECOND_MICROSECOND|SENSITIVE|SEPARATOR|SPATIAL|SPECIFIC|SQL|SQLEXCEPTION|SQLSTATE|SQLWARNING|SQL_BIG_RESULT|SQL_CALC_FOUND_ROWS|SQL_SMALL_RESULT|SSL|STARTING|STRAIGHT_JOIN|TABLE|TERMINATED|THEN|TO|TRAILING|TRIGGER|TRUE|UNDO|UNIQUE|UNLOCK|UNSIGNED|USAGE|USING|VALUES|VARCHARACTER|VARYING|WHEN|WHERE|WITH|WRITE|XOR|YEAR_MONTH|ZEROFILL))\b(?!\()|\b(bit|tinyint|bool|boolean|smallint|mediumint|int|integer|bigint|float|double\s+precision|double|real|decimal|dec|numeric|fixed|(date|datetime|timestamp|time|year)|(char|varchar|binary|varbinary|tinyblob|tinytext|blob|text|mediumblob|mediumtext|longblob|longtext|enum|set)|(geometry|point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)|(mod)|(CURRENT_USER)|(InnoDB|MyISAM|MEMORY|CSV|ARCHIVE|BLACKHOLE|MERGE|FEDERATED)|(MRG_MyISAM)|(PARTITION\s+BY\s+RANGE)|(PARTITION\s+BY\s+LIST)|(PARTITION\s+BY\s+COLUMNS)|(PARTITION\s+BY\s+HASH)|(PARTITION\s+BY\s+LINEAR\s+HASH)|(PARTITION\s+BY(?:\s+LINEAR)?\s+KEY))\b|\b(coalesce|greatest|isnull|interval|least|(if|ifnull|nullif)|(ascii|bin|bit_length|char|char_length|character_length|concat|concat_ws|conv|elt|export_set|field|find_in_set|format|hex|insert|instr|lcase|left|length|load_file|locate|lower|lpad|ltrim|make_set|mid|oct|octet_length|ord|position|quote|repeat|replace|reverse|right|rpad|rtrim|soundex|sounds_like|space|substr|substring|substring_index|trim|ucase|unhex|upper)|(strcmp)|(abs|acos|asin|atan|atan2|ceil|ceiling|cos|cot|crc32|degrees|exp|floor|ln|log|log2|log10|pi|pow|power|radians|rand|round|sign|sin|sqrt|tan|truncate)|(adddate|addtime|convert_tz|curdate|curtime|date|datediff|date_add|date_format|date_sub|day|dayname|dayofmonth|dayofweek|dayofyear|extract|from_days|from_unixtime|get_format|hour|last_day|makedate|maketime|microsecond|minute|month|monthname|now|period_add|period_diff|quarter|second|sec_to_time|str_to_date|subdate|subtime|sysdate|time|timediff|timestamp|timestampadd|timestampdiff|time_format|time_to_sec|to_days|to_seconds|unix_timestamp|week|weekday|weekofyear|year|yearweek)|(cast|convert)|(extractvalue|updatexml)|(bit_count)|(aes_encrypt|aes_decrypt|compress|decode|encode|des_decrypt|des_encrypt|encrypt|md5|old_password|password|sha|sha1|uncompress|uncompressed_length)|(benchmark|charset|coercibility|collation|connection_id|database|found_rows|last_insert_id|row_count|schema|session_user|system_user|user|version)|(default|get_lock|inet_aton|inet_ntoa|is_free_lock|is_used_lock|master_pos_wait|name_const|release_lock|sleep|uuid|uuid_short|values)|(avg|bit_and|bit_or|bit_xor|count|count_distinct|group_concat|min|max|std|stddev|stddev_pop|stddev_samp|sum|var_pop|var_samp|variance)|(asbinary|aswkb)|(astext|aswkt)|(mbrcontains|mbrdisjoint|mbrequal|mbrintersects|mbroverlaps|mbrtouches|mbrwithin|contains|crosses|disjoint|equals|intersects|overlaps|touches|within)|(buffer|convexhull|difference|intersection|symdifference)|(dimension|envelope|geometrytype|srid|boundary|isempty|issimple|x|y|endpoint|glength|numpoints|pointn|startpoint|isring|isclosed|area|exteriorring|interiorringn|numinteriorrings|centroid|geometryn|numgeometries)|(geomcollfromtext|geomfromtext|linefromtext|mlinefromtext|mpointfromtext|mpolyfromtext|pointfromtext|polyfromtext|bdmpolyfromtext|bdpolyfromtext|geomcollfromwkb|geomfromwkb|linefromwkb|mlinefromwkb|mpointfromwkb|mpolyfromwkb|pointfromwkb|polyfromwkb|bdmpolyfromwkb|bdpolyfromwkb|geometrycollection|linestring|multilinestring|multipoint|multipolygon|point|polygon)|(row)|(match|against))(\s*\(|$)/gi; // collisions: char, set, union(), allow parenthesis - IN, ANY, ALL, SOME, NOT, AND, OR, XOR
jush.links2.sqlset = /(\b)(ignore_builtin_innodb|innodb_adaptive_hash_index|innodb_additional_mem_pool_size|innodb_autoextend_increment|innodb_autoinc_lock_mode|innodb_buffer_pool_awe_mem_mb|innodb_buffer_pool_size|innodb_commit_concurrency|innodb_concurrency_tickets|innodb_data_file_path|innodb_data_home_dir|innodb_doublewrite|innodb_fast_shutdown|innodb_file_io_threads|innodb_file_per_table|innodb_flush_log_at_trx_commit|innodb_flush_method|innodb_force_recovery|innodb_checksums|innodb_lock_wait_timeout|innodb_locks_unsafe_for_binlog|innodb_log_arch_dir|innodb_log_archive|innodb_log_buffer_size|innodb_log_file_size|innodb_log_files_in_group|innodb_log_group_home_dir|innodb_max_dirty_pages_pct|innodb_max_purge_lag|innodb_mirrored_log_groups|innodb_open_files|innodb_rollback_on_timeout|innodb_stats_on_metadata|innodb_support_xa|innodb_sync_spin_loops|innodb_table_locks|innodb_thread_concurrency|innodb_thread_sleep_delay|innodb_use_legacy_cardinality_algorithm|(ndb[-_]batch[-_]size)|(ndb[-_]log[-_]update[-_]as[-_]write|ndb_log_updated_only)|(ndb_log_orig)|(slave[-_]allow[-_]batching)|(have_ndbcluster|multi_range_count|ndb_autoincrement_prefetch_sz|ndb_cache_check_time|ndb_extra_logging|ndb_force_send|ndb_use_copying_alter_table|ndb_use_exact_count|ndb_wait_connected)|(log[-_]bin[-_]trust[-_]function[-_]creators|log[-_]bin)|(binlog_cache_size|max_binlog_cache_size|max_binlog_size|sync_binlog)|(auto_increment_increment|auto_increment_offset)|(ndb_log_empty_epochs)|(log[-_]slave[-_]updates|report[-_]host|report[-_]password|report[-_]port|report[-_]user|slave[-_]net[-_]timeout|slave[-_]skip[-_]errors)|(init_slave|rpl_recovery_rank|slave_compressed_protocol|slave_exec_mode|slave_transaction_retries|sql_slave_skip_counter)|(master[-_]bind|slave[-_]load[-_]tmpdir|server[-_]id)|(sql_big_tables)|(basedir|big[-_]tables|binlog[-_]format|collation[-_]server|datadir|debug|delay[-_]key[-_]write|engine[-_]condition[-_]pushdown|event[-_]scheduler|general[-_]log|character[-_]set[-_]filesystem|character[-_]set[-_]server|character[-_]sets[-_]dir|init[-_]file|language|large[-_]pages|log[-_]error|log[-_]output|log[-_]queries[-_]not[-_]using[-_]indexes|log[-_]slow[-_]queries|log[-_]warnings|log|low[-_]priority[-_]updates|memlock|min[-_]examined[-_]row[-_]limit|old[-_]passwords|open[-_]files[-_]limit|pid[-_]file|port|safe[-_]show[-_]database|secure[-_]auth|secure[-_]file[-_]priv|skip[-_]external[-_]locking|skip[-_]networking|skip[-_]show[-_]database|slow[-_]query[-_]log|socket|sql[-_]mode|tmpdir|version)|(autocommit|error_count|foreign_key_checks|identity|insert_id|last_insert_id|profiling|profiling_history_size|rand_seed1|rand_seed2|sql_auto_is_null|sql_big_selects|sql_buffer_result|sql_log_bin|sql_log_off|sql_log_update|sql_notes|sql_quote_show_create|sql_safe_updates|sql_warnings|timestamp|unique_checks|warning_count)|(sql_low_priority_updates)|(sql_max_join_size)|(automatic_sp_privileges|back_log|bulk_insert_buffer_size|collation_connection|collation_database|completion_type|concurrent_insert|connect_timeout|date_format|datetime_format|default_week_format|delayed_insert_limit|delayed_insert_timeout|delayed_queue_size|div_precision_increment|expire_logs_days|flush|flush_time|ft_boolean_syntax|ft_max_word_len|ft_min_word_len|ft_query_expansion_limit|ft_stopword_file|general_log_file|group_concat_max_len|have_archive|have_blackhole_engine|have_compress|have_crypt|have_csv|have_dynamic_loading|have_example_engine|have_federated_engine|have_geometry|have_innodb|have_isam|have_merge_engine|have_openssl|have_partitioning|have_query_cache|have_raid|have_row_based_replication|have_rtree_keys|have_ssl|have_symlink|hostname|character_set_client|character_set_connection|character_set_database|character_set_results|character_set_system|init_connect|interactive_timeout|join_buffer_size|keep_files_on_create|key_buffer_size|key_cache_age_threshold|key_cache_block_size|key_cache_division_limit|large_page_size|lc_time_names|license|local_infile|locked_in_memory|log_bin|long_query_time|lower_case_file_system|lower_case_table_names|max_allowed_packet|max_connect_errors|max_connections|max_delayed_threads|max_error_count|max_heap_table_size|max_insert_delayed_threads|max_join_size|max_length_for_sort_data|max_prepared_stmt_count|max_relay_log_size|max_seeks_for_key|max_sort_length|max_sp_recursion_depth|max_tmp_tables|max_user_connections|max_write_lock_count|myisam_data_pointer_size|myisam_max_sort_file_size|myisam_recover_options|myisam_repair_threads|myisam_sort_buffer_size|myisam_stats_method|myisam_use_mmap|named_pipe|net_buffer_length|net_read_timeout|net_retry_count|net_write_timeout|new|old|optimizer_prune_level|optimizer_search_depth|optimizer_switch|plugin_dir|preload_buffer_size|prepared_stmt_count|protocol_version|pseudo_thread_id|query_alloc_block_size|query_cache_limit|query_cache_min_res_unit|query_cache_size|query_cache_type|query_cache_wlock_invalidate|query_prealloc_size|range_alloc_block_size|read_buffer_size|read_only|read_rnd_buffer_size|relay_log_purge|relay_log_space_limit|shared_memory|shared_memory_base_name|slow_launch_time|slow_query_log_file|sort_buffer_size|sql_select_limit|storage_engine|sync_frm|system_time_zone|table_cache|table_definition_cache|table_lock_wait_timeout|table_open_cache|table_type|thread_cache_size|thread_concurrency|thread_handling|thread_stack|time_format|time_zone|timed_mutexes|tmp_table_size|transaction_alloc_block_size|transaction_prealloc_size|tx_isolation|updatable_views_with_limit|version_comment|version_compile_machine|version_compile_os|wait_timeout)|(ssl[-_]ca|ssl[-_]capath|ssl[-_]cert|ssl[-_]cipher|ssl[-_]key))((?!-)\b)/gi;
jush.links2.sqlstatus = /()(Com_.+|(.+))()/gi;
