jush.tr.elastic = { json: /:(?= )/ }; // Adminer prints the queries as "<path>: <JSON>"

jush.build_links2('elastic', 'https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-$key', /(\b)/, /(\b)/g, {
	'https://www.elastic.co/docs/api/doc/elasticsearch/': /(GET|POST|PUT|DELETE|HEAD)/, // no page explains the methods, the reference prints them by every operation
	'search': /(_search)/,
	'count': /(_count)/,
	'index': /(_doc)/,
	'update': /(_update)/,
	'indices-put-mapping': /(_mapping)/,
	'indices-update-aliases': /(_aliases)/, // must be before _alias
	'indices-get-alias': /(_alias)/,
	'indices-stats': /(_stats)/,
	// the field types are documented outside the API reference
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/number': /(long|integer|short|byte|double|float|half_float|scaled_float)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/boolean': /(boolean)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/date': /(date)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/text': /(text)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/keyword': /(keyword)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/binary': /(binary)/,
});
