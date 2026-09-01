<?php
// Updates the documentation paths linked in modules/jush-mssql.js
// from a checkout of https://github.com/MicrosoftDocs/sql-docs
// Entry keys are the path of the page below docs/ without the .md extension,
// the address of https://learn.microsoft.com/sql/$key

require __DIR__ . '/functions.inc.php';

// Directories below docs/ holding the linked pages, the first match wins
$doc_dirs = ['t-sql', 'relational-databases/system-functions'];

// Directories below them holding no documentation page
$skip_dirs = ['includes', 'media', 'codesnippet'];

// Directories the not linked report goes through
$report_dirs = ['t-sql/statements', 't-sql/data-types', 't-sql/functions'];

if (!isset($argv[1])) {
	fwrite(STDERR, "Usage: php update/mssql.php path/to/sql-docs\n");
	exit(1);
}
$docs = rtrim($argv[1], '/\\') . '/docs';
$jush_file = __DIR__ . '/../modules/jush-mssql.js';
$jush = read_file($jush_file);

// Get the names of the constructs documented by a page title
function title_names($title) {
	$title = trim($title, '"\'');
	$title = preg_replace('~\s*\((?:Transact-SQL|SQL Server|Database Engine|Azure[^)]*)\)$~i', '', $title);
	$title = preg_replace('~\s+(?:Clause|Statement|Data Type|Function)$~i', '', $title);
	// a page documents several constructs only if each of them is a single word ("char and varchar"),
	// otherwise the conjunction is a part of a sentence ("Date and time types")
	$names = preg_split('~,\s*(?:and\s+)?|\s+and\s+|\s+\|\s+~i', $title);
	foreach ($names as $name) {
		if (strpos(trim($name), ' ') !== false) {
			$names = [$title];
			break;
		}
	}
	// the page of the UPDATE() trigger function is titled "UPDATE()" to tell it from the UPDATE statement
	return preg_replace('~\(\)$~', '', $names);
}

// Normalize a construct name for the lookup - the titles are inconsistently capitalized
function normalize_name($name) {
	return strtoupper(preg_replace('~\s+~', ' ', trim($name)));
}

// Get [name => [slug]] indexes of the page titles and of their f1_keywords
// plus [name => title name] holding the original capitalization
function read_index($docs, array $doc_dirs, array $skip_dirs) {
	$titles = [];
	$f1 = [];
	$raw = [];
	foreach ($doc_dirs as $dir) {
		$iterator = new RecursiveIteratorIterator(new RecursiveCallbackFilterIterator(
			new RecursiveDirectoryIterator("$docs/$dir", FilesystemIterator::SKIP_DOTS),
			function ($file) use ($skip_dirs) {
				return !$file->isDir() || !in_array($file->getFilename(), $skip_dirs);
			}
		));
		foreach ($iterator as $file) {
			if ($file->getExtension() != 'md') {
				continue;
			}
			$markdown = read_file($file->getPathname());
			$slug = substr(str_replace('\\', '/', $file->getPathname()), strlen("$docs/"), -3);
			foreach (title_names(front_matter($markdown, 'title')) as $name) {
				$titles[normalize_name($name)][] = $slug;
				$raw[normalize_name($name)] = trim($name);
			}
			foreach (front_matter_list($markdown, 'f1_keywords') as $name) {
				// the _TSQL entries are duplicates, the ones with a bracket or a comma are helpviewer noise
				if (!preg_match('~_TSQL$|[][,]~', $name)) {
					$f1[normalize_name($name)][] = $slug;
				}
			}
		}
	}
	return [$titles, $f1, $raw];
}

// Get the phrases an entry regexp matches
function entry_phrases($regexp) {
	$regexp = preg_replace('~\(\?[=!].*~s', '', $regexp); // the (?=\s*\(|$) lookahead of the functions
	return expand_phrases(preg_replace('~^\((.*)\)$~s', '$1', $regexp)); // the capturing group of the entry
}

// Get [the body of the group opening $regexp, the rest], null if it doesn't open with a group
function capture_group($regexp) {
	if ($regexp == '' || $regexp[0] != '(') {
		return null;
	}
	$depth = 0;
	for ($i = 0; $i < strlen($regexp); $i++) {
		$c = $regexp[$i];
		if ($c == '\\') {
			$i++;
		} elseif ($c == '(') {
			$depth++;
		} elseif ($c == ')' && !--$depth) {
			$body = substr($regexp, 1, $i - 1);
			return [preg_replace('~^\?:~', '', $body), substr($regexp, $i + 1)];
		}
	}
	return null;
}

// Split an alternation at the top level | characters
function split_alternation($alternation) {
	$return = [];
	$depth = 0;
	$last = 0;
	for ($i = 0; $i < strlen($alternation); $i++) {
		$c = $alternation[$i];
		if ($c == '\\') {
			$i++;
		} elseif ($c == '(') {
			$depth++;
		} elseif ($c == ')') {
			$depth--;
		} elseif ($c == '|' && !$depth) {
			$return[] = substr($alternation, $last, $i - $last);
			$last = $i + 1;
		}
	}
	$return[] = substr($alternation, $last);
	return $return;
}

// Get [suffix => phrases] of an entry matching nothing but plain phrases, each optionally behind
// a lookahead; null for the hand-crafted ones like ((?:var)?binary) which no $1 can describe
function entry_alternation($regexp) {
	$group = capture_group($regexp);
	if (!$group || ($group[1] != '' && !preg_match('~^\(\?[=!]~', $group[1]))) {
		return null;
	}
	$return = [];
	foreach (split_alternation($group[0]) as $alternative) {
		$suffix = $group[1];
		if (substr($alternative, 0, 3) == '(?:') { // the alternatives sharing one lookahead
			$sub = capture_group($alternative);
			if (!$sub || !preg_match('~^\(\?[=!]~', $sub[1])) {
				return null;
			}
			list($alternative, $suffix) = $sub;
		}
		foreach (split_alternation($alternative) as $phrase) {
			$phrase = str_replace('\\s+', ' ', $phrase);
			if (!preg_match('~^[A-Za-z_][\w ]*$~', $phrase)) {
				return null;
			}
			$return[$suffix][] = $phrase;
		}
	}
	return $return;
}

// The $1 replacement jush.slugs.mssql derives from a matched phrase
function phrase_slug($phrase) {
	return strtolower(preg_replace('~[\s_]+~', '-', trim($phrase)));
}

// Get the '<prefix>$1<suffix>' template deriving the key of every phrase, null if there is none
function key_template($key, array $phrases) {
	$templates = null;
	foreach ($phrases as $phrase) {
		$slug = phrase_slug($phrase);
		$found = [];
		// the slug is a whole part of the path, not a piece of a longer word
		if (preg_match_all('~(?:^|(?<=[/-]))' . preg_quote($slug, '~') . '(?=$|[/-])~', $key, $matches, PREG_OFFSET_CAPTURE)) {
			foreach ($matches[0] as $match) {
				$found[] = substr_replace($key, '$1', $match[1], strlen($slug));
			}
		}
		$templates = ($templates === null ? $found : array_intersect($templates, $found));
		if (!$templates) {
			return null;
		}
	}
	return (count($templates) == 1 ? reset($templates) : null);
}

list($titles, $f1, $raw) = read_index($docs, $doc_dirs, $skip_dirs);
if (!$titles) {
	fwrite(STDERR, "No pages found in $docs\n");
	exit(1);
}

list($block, $start, $end) = find_block($jush, 'mssql');
$linked = []; // normalized name => true
$keys = []; // key => [phrases]
$items = []; // one per linked page: [key, regexp, phrases, suffix], suffix is null for a hand-crafted regexp
foreach (explode("\n", $block) as $line) {
	if (!preg_match("~^\t'([^']*)': /(.*)/,$~", $line, $match)) {
		continue; // the block holds nothing but entries, the grouping comment is regenerated
	}
	list(, $key, $regexp) = $match;
	$key = preg_replace('~^https://learn\.microsoft\.com/sql/~', '', $key); // the entries added before this script
	$alternation = entry_alternation($regexp);
	if (strpos($key, '$1') !== false && $alternation) {
		// split a merged entry back to one item per page so that a moved page can leave the group
		foreach ($alternation as $suffix => $phrases) {
			foreach ($phrases as $phrase) {
				$phrase_regexp = '(' . str_replace(' ', '\\s+', $phrase) . ")$suffix";
				$items[] = [str_replace('$1', phrase_slug($phrase), $key), $phrase_regexp, [$phrase], $suffix];
			}
		}
		continue;
	}
	// a hand-written entry mixing lookaheads has no single suffix to merge by
	$alternation = (count($alternation ?: []) == 1 ? $alternation : null);
	$phrases = ($alternation ? reset($alternation) : entry_phrases($regexp));
	$items[] = [$key, $regexp, $phrases, ($alternation ? key($alternation) : null)];
}

foreach ($items as $i => list($key, $regexp, $phrases, $suffix)) {
	if (preg_match('~^https?:~', $key)) { // a hand-maintained address outside /sql/, e.g. a removed feature
		foreach ($phrases as $phrase) {
			$linked[normalize_name($phrase)] = true;
		}
		continue;
	}
	$slugs = null;
	foreach ($phrases as $phrase) {
		$name = normalize_name($phrase);
		$linked[$name] = true;
		// the titles are authoritative, f1_keywords also hold the single words of a phrase
		$found = array_unique($titles[$name] ?? $f1[$name] ?? []);
		// the page documenting all the phrases of the entry, not just some of them:
		// NCHAR alone is both a data type and a function, nvarchar only the data type
		$slugs = ($slugs === null || !$found ? ($found ?: $slugs) : array_intersect($slugs, $found));
	}
	$slugs = array_values($slugs ?: []);
	$phrases_text = implode(', ', $phrases);
	if (count($slugs) > 1) {
		// the same name can document two constructs (the NCHAR function and the nchar data type),
		// the choice between them is hand-made once
		if (!in_array($key, $slugs)) {
			fwrite(STDERR, "Ambiguous: $phrases_text -> " . implode(', ', $slugs) . "\n");
		}
	} elseif (!$slugs) {
		if (!file_exists("$docs/$key.md")) {
			fwrite(STDERR, "Missing page: $key ($phrases_text)\n");
		}
	} elseif ($slugs[0] != $key) {
		fwrite(STDERR, "Moved $key -> $slugs[0]: $phrases_text\n");
		$key = $slugs[0];
	}
	$items[$i][0] = $key;
}

// Group the entries whose key is the same mechanical function of the matched phrase, keeping the
// order: the data types precede the functions, so char( links to the type, not to the CHAR() function
$groups = []; // template or "=<index>" for a key which is no function of the phrase => [suffix => phrases]
foreach ($items as $i => list($key, $regexp, $phrases, $suffix)) {
	$template = ($suffix === null ? null : key_template($key, $phrases));
	$group = ($template === null ? "=$i" : $template);
	// one directory documents both statements and functions, so the same template comes with and
	// without the call lookahead; the entry has to hold both, its key can be written only once
	$suffix = (string) $suffix;
	$groups[$group][$suffix] = array_merge($groups[$group][$suffix] ?? [], $phrases);
}

$new_block = '';
foreach ($groups as $group => $by_suffix) {
	if ($group[0] == '=') { // no $1 describes the key, e.g. the page of several data types
		list($key, $regexp) = $items[substr($group, 1)];
		$new_block .= "\t'$key': /$regexp/,\n";
		$keys[$key][] = implode(', ', reset($by_suffix));
		continue;
	}
	$alternatives = [];
	foreach ($by_suffix as $suffix => $phrases) {
		$alternation = phrases_regexp($phrases);
		// a lookahead applies to the alternatives it follows, so they need a group of their own
		$alternatives[] = ($suffix == '' || count($by_suffix) < 2 ? $alternation : "(?:$alternation)$suffix");
	}
	$suffix = (count($by_suffix) < 2 ? key($by_suffix) : '');
	$new_block .= "\t'$group': /(" . implode('|', $alternatives) . ")$suffix/,\n";
	$keys[$group][] = implode(', ', array_merge(...array_values($by_suffix)));
}

// a duplicate key is not just redundant, the later entry of the object literal drops the earlier one
foreach ($keys as $key => $entries) {
	if (count($entries) > 1) {
		fwrite(STDERR, "Duplicate key $key, merge the entries: " . implode(' + ', $entries) . "\n");
	}
}
$jush = substr_replace($jush, rtrim($new_block, "\n"), $start, $end - $start);

$jush = set_list($jush, "jush.build_links2('mssql', '", "'", ['https://learn.microsoft.com/sql/$key'], 'URL');

file_put_contents($jush_file, $jush);

// Report the pages which could be linked but are not
foreach ($titles as $name => $slugs) {
	if (isset($linked[$name]) || count($slugs) > 1) {
		continue;
	}
	// a construct is titled by its name, either a single identifier ("datetime2") or all caps
	// ("BULK INSERT"); the overview pages are titled by a sentence ("Date and time types")
	if (in_array(dirname($slugs[0]), $report_dirs) && preg_match('~^[A-Z_][A-Z0-9_ ]*$~', $name)
		&& (strpos($raw[$name], ' ') === false || $raw[$name] == $name)
	) {
		fwrite(STDERR, "Not linked: {$raw[$name]} ($slugs[0])\n");
	}
}
