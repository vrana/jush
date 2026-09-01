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

list($titles, $f1, $raw) = read_index($docs, $doc_dirs, $skip_dirs);
if (!$titles) {
	fwrite(STDERR, "No pages found in $docs\n");
	exit(1);
}

list($block, $start, $end) = find_block($jush, 'mssql');
$linked = []; // normalized name => true
$keys = []; // key => [phrases]
$new_block = '';
foreach (explode("\n", $block) as $line) {
	if (!preg_match("~^\t'([^']*)': /(.*)/,$~", $line, $match)) {
		$new_block .= "$line\n";
		continue;
	}
	list(, $key, $regexp) = $match;
	$key = preg_replace('~^https://learn\.microsoft\.com/sql/~', '', $key); // the entries added before this script
	$phrases = entry_phrases($regexp);
	if (preg_match('~^https?:~', $key)) { // a hand-maintained address outside /sql/, e.g. a removed feature
		foreach ($phrases as $phrase) {
			$linked[normalize_name($phrase)] = true;
		}
		$new_block .= "$line\n";
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
	$keys[$key][] = $phrases_text;
	$new_block .= "\t'$key': /$regexp/,\n";
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
