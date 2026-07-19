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
	fwrite(STDERR, "Added $label: " . implode(', ', array_diff($names, $old_names)) . "\n");
	fwrite(STDERR, "Removed $label: " . implode(', ', array_diff($old_names, $names)) . "\n");
	return substr_replace($subject, implode('|', $names), $start, $end - $start);
}
