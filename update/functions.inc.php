<?php
// Common functions for the update scripts

// Get sorted names of the subdirectories of $path
function read_dirs($path) {
	$dirs = glob("$path/*", GLOB_ONLYDIR);
	if (!$dirs) {
		fwrite(STDERR, "No subdirectories in $path\n");
		exit(1);
	}
	$return = array_map('basename', $dirs);
	sort($return);
	return $return;
}

// Get the value of a front matter field
function front_matter($markdown, $field) {
	preg_match("~^$field: (.*)~m", $markdown, $match);
	return trim($match[1] ?? '');
}

// Get the values of a front matter field holding a YAML list
function front_matter_list($markdown, $field) {
	if (!preg_match("~^$field:\n((?:[ \t]*- .*\n)+)~m", $markdown, $match)) {
		return [];
	}
	preg_match_all('~^[ \t]*- (.*)$~m', $match[1], $matches);
	return array_map(function ($value) {
		return trim(trim($value), '"\'');
	}, $matches[1]);
}

// Read a file or exit with an error
function read_file($file) {
	$return = file_get_contents($file);
	if ($return === false) {
		fwrite(STDERR, "Can't read $file\n");
		exit(1);
	}
	return $return;
}

// Get the body of a "## $title" Markdown section, "" if there is no such section
function mdn_section($markdown, $title) {
	preg_match('~^## ' . preg_quote($title, '~') . '\n(.*?)(?=^## |\z)~msi', $markdown, $match);
	return ($match[1] ?? '');
}

// Escape a string to be used in a single-quoted JS string
function js_escape($s) {
	return str_replace(['\\', "'"], ['\\\\', "\\'"], $s);
}

// Store a tooltip in a jush.api block, skipping empty ones
function add_api(array &$block, $key, $tooltip) {
	if ($tooltip != '') {
		$block[$key] = $tooltip;
	}
}

// Turn statement names into regexp alternatives, a phrase before its own prefix (SELECT\s+INTO before SELECT, RESTORE-ASKING before RESTORE)
function phrases_regexp(array $names) {
	usort($names, function ($a, $b) {
		if (stripos($a, "$b ") === 0 || stripos($a, "$b-") === 0) {
			return -1;
		}
		if (stripos($b, "$a ") === 0 || stripos($b, "$a-") === 0) {
			return 1;
		}
		return strcmp($a, $b);
	});
	return str_replace(' ', '\\s+', implode('|', $names));
}

// Replace the |-separated list between $prefix and $suffix in $subject, reporting the diff
function set_list($subject, $prefix, $suffix, array $names, $label) {
	$start = strpos($subject, $prefix);
	if ($start === false) {
		fwrite(STDERR, "Can't find start of $label list\n");
		exit(1);
	}
	$start += strlen($prefix);
	$end = strpos($subject, $suffix, $start);
	if ($end === false) {
		fwrite(STDERR, "Can't find end of $label list\n");
		exit(1);
	}
	$old_names = explode('|', substr($subject, $start, $end - $start));
	report_diff($label, $old_names, $names);
	return substr_replace($subject, implode('|', $names), $start, $end - $start);
}

// Report added and removed names of a wholesale regenerated list
function report_diff($label, array $old, array $new) {
	if (array_diff($new, $old)) {
		fwrite(STDERR, "Added $label: " . implode(', ', array_diff($new, $old)) . "\n");
	}
	if (array_diff($old, $new)) {
		fwrite(STDERR, "Removed $label: " . implode(', ', array_diff($old, $new)) . "\n");
	}
}

// Replace all entries in a jush.api block between $prefix and $suffix
function set_block($subject, $prefix, $suffix, array $entries) {
	$start = strpos($subject, $prefix);
	if ($start === false) {
		fwrite(STDERR, "Can't find $prefix\n");
		exit(1);
	}
	$start += strlen($prefix);
	$end = strpos($subject, $suffix, $start);
	if ($end === false) {
		fwrite(STDERR, "Can't find end of $prefix block\n");
		exit(1);
	}
	$lines = '';
	foreach ($entries as $name => $tooltip) {
		$lines .= "\n\t'$name': '$tooltip',";
	}
	return substr_replace($subject, $lines, $start, $end - $start);
}

// Get ['key' => 'regexp source'] of the entries in a build_links2 block
function block_entries($block) {
	preg_match_all("~^\t'([^']*)': /(.*)/,~m", $block, $matches, PREG_SET_ORDER);
	$return = [];
	foreach ($matches as $match) {
		$return[$match[1]] = $match[2];
	}
	return $return;
}

// Get the body of a build_links2 block with its start and end offsets
function find_block($jush, $key) {
	$start = strpos($jush, "jush.build_links2('$key'");
	$start = ($start === false ? false : strpos($jush, "{\n", $start));
	$end = ($start === false ? false : strpos($jush, "\n});", $start));
	if ($end === false) {
		fwrite(STDERR, "Can't find the build_links2('$key') block\n");
		exit(1);
	}
	$start += 2;
	return [substr($jush, $start, $end - $start), $start, $end];
}

// Expand (?:A|B) and (?:A|B)? groups of a phrase alternation into plain phrases (for diff reporting)
function expand_phrases($alternation) {
	$s = str_replace('\\s+', ' ', $alternation);
	if (preg_match('~^(.*?)\(\?:([^()]*)\)(\??)(.*)$~s', $s, $match)) {
		$return = [];
		$options = explode('|', $match[2]);
		if ($match[3]) {
			$options[] = '';
		}
		foreach ($options as $option) {
			foreach (expand_phrases($match[1] . $option . $match[4]) as $phrase) {
				$return[] = preg_replace('~\s+~', ' ', trim($phrase));
			}
		}
		return array_unique($return);
	}
	return explode('|', $s);
}

// Whether a phrase of the first list is a prefix of a phrase of the second one
function prefix_of(array $phrases, array $others) {
	foreach ($phrases as $phrase) {
		foreach ($others as $other) {
			if (stripos($other, "$phrase ") === 0) {
				return true;
			}
		}
	}
	return false;
}

// links2 is a single alternation matching the first alternative, not the longest one, so a phrase must
// not precede a longer phrase starting with it; phrases_regexp() sorts them inside one entry,
// this orders the entries so that it holds across them too
function order_entries(array $entries) { // [line, phrases]
	$return = [];
	while ($entries) {
		foreach ($entries as $i => $entry) {
			foreach ($entries as $j => $other) {
				if ($i != $j && prefix_of($entry[1], $other[1])) {
					continue 2; // a longer phrase is still waiting
				}
			}
			$return[] = $entry;
			unset($entries[$i]);
			continue 2;
		}
		fwrite(STDERR, "Entries shadow each other in a cycle: " . implode(', ', array_map(function ($entry) {
			return implode('|', $entry[1]);
		}, $entries)) . "\n");
		return array_merge($return, $entries);
	}
	return $return;
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
		if (substr($alternative, 0, 3) == '(?:') { // several alternatives sharing one lookahead
			$sub = capture_group($alternative);
			if (!$sub || !preg_match('~^\(\?[=!]~', $sub[1])) {
				return null;
			}
			list($alternative, $suffix) = $sub;
		} elseif (($pos = strpos($alternative, '(')) !== false) { // a single one binding it directly
			if (!preg_match('~^\(\?[=!]~', substr($alternative, $pos))) {
				return null;
			}
			$suffix = substr($alternative, $pos);
			$alternative = substr($alternative, 0, $pos);
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

// Get the '<prefix>$1<suffix>' template deriving the key of every phrase, null if there is none
// The script defines phrase_slug() to match the jush.slugs.<state> of its module
function key_template($key, array $phrases) {
	$templates = null;
	foreach ($phrases as $phrase) {
		$slug = phrase_slug($phrase);
		$found = [];
		// the slug is a whole part of the path, not a piece of a longer word
		if (preg_match_all('~(?:^|(?<=[/.-]))' . preg_quote($slug, '~') . '(?=$|[/.-])~', $key, $matches, PREG_OFFSET_CAPTURE)) {
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
