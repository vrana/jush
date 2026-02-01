jush.tr.igdb = { quo: /"/ };

jush.urls.igdb = ['https://api-docs.igdb.com/#$key',
	'endpoints', '$1', 'filters', 'sorting', 'search-1', 'pagination', 'multi-query'
];

jush.links2.igdb = /(\b)(endpoint|(fields|exclude)|(where)|(sort)|(search)|(limit|offset)|(query))(\b)/gi;
