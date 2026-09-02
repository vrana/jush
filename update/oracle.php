<?php
// Updates the documentation pages linked in modules/jush-oracle.js
// from the table of contents of the Oracle SQL Language Reference
// (cached in the given directory, fetched from docs.oracle.com on miss)
// Entry keys are the file name of the page, the address of
// https://docs.oracle.com/en/database/oracle/oracle-database/$version/sqlrf/$key

require __DIR__ . '/functions.inc.php';

$version = '19'; // the long term support release; Adminer swaps it for the version of the server

// Pages documenting no phrase to highlight, kept out of the not linked report
$skip_pages = [];

if (!isset($argv[1])) {
	fwrite(STDERR, "Usage: php update/oracle.php path/to/cache-dir\n");
	exit(1);
}
$cache_dir = rtrim($argv[1], '/\\');
$jush_file = __DIR__ . '/../modules/jush-oracle.js';
$jush = read_file($jush_file);

// The $1 replacement jush.slugs.oracle derives from a matched phrase
function phrase_slug($phrase) {
	return strtoupper(preg_replace('~\s+~', '-', trim($phrase)));
}

// Get the table of contents from the cache directory, fetching it on miss
function toc_html($cache_dir, $version) {
	$file = "$cache_dir/sqlrf-$version-toc.htm";
	if (!file_exists($file)) {
		$url = "https://docs.oracle.com/en/database/oracle/oracle-database/$version/sqlrf/toc.htm";
		fwrite(STDERR, "Fetching $url\n");
		$html = file_get_contents($url);
		if ($html === false) {
			fwrite(STDERR, "Can't fetch $url\n");
			exit(1);
		}
		file_put_contents($file, $html);
	}
	return read_file($file);
}

// Get [name => [page]] of the constructs the table of contents lists
function read_index($html) {
	preg_match_all('~<a[^>]+href="([A-Za-z0-9_.-]+\.html)(?:#[^"]*)?"[^>]*>(.*?)</a>~s', $html, $matches, PREG_SET_ORDER);
	$return = [];
	foreach ($matches as $match) {
		$name = preg_replace('~\s+~', ' ', trim(html_entity_decode(strip_tags($match[2]))));
		if ($name != '') {
			$return[strtoupper($name)][] = $match[1];
		}
	}
	return array_map('array_unique', $return);
}

$index = read_index(toc_html($cache_dir, $version));
$all_pages = array_flip(array_merge(...array_values($index) ?: [[]])); // page => whether it still exists
if (!$index) {
	fwrite(STDERR, "No pages found in the table of contents\n");
	exit(1);
}

list($block, $start, $end) = find_block($jush, 'oracle');
$linked = []; // upper case name => true
$keys = []; // key => [phrases]
$items = []; // one per linked page: [key, regexp, phrases, suffix], suffix is null for a hand-crafted regexp
foreach (explode("\n", $block) as $line) {
	if (!preg_match("~^\t'([^']*)': /(.*)/,$~", $line, $match)) {
		continue;
	}
	list(, $key, $regexp) = $match;
	$alternation = entry_alternation($regexp);
	if (strpos($key, '$1') !== false && $alternation) {
		// split a merged entry back to one item per page so that a renamed page can leave the group
		foreach ($alternation as $suffix => $phrases) {
			foreach ($phrases as $phrase) {
				$phrase_regexp = '(' . str_replace(' ', '\\s+', $phrase) . ")$suffix";
				$items[] = [str_replace('$1', phrase_slug($phrase), $key), $phrase_regexp, [$phrase], $suffix];
			}
		}
		continue;
	}
	$alternation = (count($alternation ?: []) == 1 ? $alternation : null);
	$phrases = ($alternation ? reset($alternation) : entry_phrases($regexp));
	$items[] = [$key, $regexp, $phrases, ($alternation ? key($alternation) : null)];
}

foreach ($items as $i => list($key, $regexp, $phrases, $suffix)) {
	if (preg_match('~^https?:~', $key)) { // a hand-maintained address, e.g. a desupported function
		foreach ($phrases as $phrase) {
			$linked[strtoupper(preg_replace('~\s+~', ' ', trim($phrase)))] = true;
		}
		continue;
	}
	$pages = null;
	foreach ($phrases as $phrase) {
		$name = strtoupper(preg_replace('~\s+~', ' ', trim($phrase)));
		$linked[$name] = true;
		$found = $index[$name] ?? [];
		// the page documenting all the phrases of the entry, not just some of them
		$pages = ($pages === null || !$found ? ($found ?: $pages) : array_intersect($pages, $found));
	}
	$pages = array_values($pages ?: []);
	$phrases_text = implode(', ', $phrases);
	if (count($pages) > 1) {
		// one name can document several constructs (TO_CHAR of a number and of a date),
		// the choice between them is hand-made once
		if (!in_array($key, $pages)) {
			fwrite(STDERR, "Ambiguous: $phrases_text -> " . implode(', ', $pages) . "\n");
		}
	} elseif (!$pages) {
		// the phrase is no heading of its own, e.g. TO_CHAR is titled "TO_CHAR (character)";
		// only a key naming a page which is gone needs attention
		if (!isset($all_pages[$key])) {
			fwrite(STDERR, "Missing page: $key ($phrases_text)\n");
		}
	} elseif ($pages[0] != $key) {
		fwrite(STDERR, "Moved $key -> $pages[0]: $phrases_text\n");
		$key = $pages[0];
	}
	$items[$i][0] = $key;
}

$groups = []; // template or "=<index>" for a key which is no function of the phrase => [suffix => phrases]
foreach ($items as $i => list($key, $regexp, $phrases, $suffix)) {
	$template = ($suffix === null ? null : key_template($key, $phrases));
	// entries with the same key merge too, the object literal would keep only the last one
	$group = ($suffix === null ? "=$i" : ($template ?? $key));
	$groups[$group][(string) $suffix] = array_merge($groups[$group][(string) $suffix] ?? [], $phrases);
}

$lines = []; // [line, phrases] for order_entries()
foreach ($groups as $group => $by_suffix) {
	if ($group[0] == '=') { // no $1 describes the key, e.g. the page of several data types
		list($key, $regexp) = $items[substr($group, 1)];
		$lines[] = ["\t'$key': /$regexp/,\n", entry_phrases($regexp)];
		$keys[$key][] = implode(', ', reset($by_suffix));
		continue;
	}
	$alternatives = [];
	foreach ($by_suffix as $suffix => $phrases) {
		$alternation = phrases_regexp($phrases);
		$alternatives[] = ($suffix == '' || count($by_suffix) < 2 ? $alternation
			: (count($phrases) > 1 ? "(?:$alternation)" : $alternation) . $suffix);
	}
	$suffix = (count($by_suffix) < 2 ? key($by_suffix) : '');
	$phrases = array_merge(...array_values($by_suffix));
	$lines[] = ["\t'$group': /(" . implode('|', $alternatives) . ")$suffix/,\n", $phrases];
	$keys[$group][] = implode(', ', $phrases);
}

// a duplicate key is not just redundant, the later entry of the object literal drops the earlier one
foreach ($keys as $key => $entries) {
	if (count($entries) > 1) {
		fwrite(STDERR, "Duplicate key $key, merge the entries: " . implode(' + ', $entries) . "\n");
	}
}

// an earlier entry would swallow the beginning of a longer phrase of a later one
$new_block = implode('', array_column(order_entries($lines), 0));
$jush = substr_replace($jush, rtrim($new_block, "\n"), $start, $end - $start);

$url = "https://docs.oracle.com/en/database/oracle/oracle-database/$version/sqlrf/\$key";
$jush = set_list($jush, "jush.build_links2('oracle', '", "'", [$url], 'URL');

file_put_contents($jush_file, $jush);

// Report the pages which could be linked but are not
foreach ($index as $name => $pages) {
	// a construct is titled by its name alone, the other entries are sections and overviews
	if (!isset($linked[$name]) && count($pages) == 1 && !in_array($pages[0], $skip_pages)
		&& $pages[0] == phrase_slug($name) . '.html'
	) {
		fwrite(STDERR, "Not linked: $name ($pages[0])\n");
	}
}
