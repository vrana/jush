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
	if (!preg_match("~^$field:\n((?:\s+- .*\n)+)~m", $markdown, $match)) {
		return [];
	}
	preg_match_all('~^\s+- (.*)$~m', $match[1], $matches);
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
		if (strpos($a, "$b ") === 0 || strpos($a, "$b-") === 0) {
			return -1;
		}
		if (strpos($b, "$a ") === 0 || strpos($b, "$a-") === 0) {
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
			if (strpos($other, "$phrase ") === 0) {
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
