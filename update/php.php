<?php
// Updates the linked classes and functions in modules/jush-php.js and the tooltips in
// jush-api.js from a php.api file:
// https://github.com/moltenform/scite-files/blob/main/files/files/api_files/php.api
// Usage: php update/php.php [path/to/php.api]

$api_file = ($argv[1] ?? 'php.api');
$jush_file = __DIR__ . '/../modules/jush-php.js';
$jush_api_file = __DIR__ . '/../jush-api.js';

$api = file_get_contents($api_file);
if ($api === false) {
	fwrite(STDERR, "Can't read $api_file\n");
	exit(1);
}

$jush = file_get_contents($jush_file);
if ($jush === false) {
	fwrite(STDERR, "Can't read $jush_file\n");
	exit(1);
}

$jush_api = file_get_contents($jush_api_file);
if ($jush_api === false) {
	fwrite(STDERR, "Can't read $jush_api_file\n");
	exit(1);
}

function js_escape($s) {
	return str_replace(['\\', "'"], ['\\\\', "\\'"], $s);
}

// Join a signature ("(int $x): bool", "()" for a no-arg constructor) and a description
// into a JS-escaped tooltip.
function tooltip($signature, $description) {
	if ($signature == '' || $signature == '()') {
		return js_escape($description);
	}
	return js_escape($signature) . '\n' . js_escape($description); // '\n' is a literal backslash-n inside the JS string
}

// Store a tooltip in a jush.api block, skipping empty ones (e.g. DOMNamedNodeMap).
function add_api(array &$block, $key, $tooltip) {
	if ($tooltip != '') {
		$block[$key] = $tooltip;
	}
}

$class_names = []; // for the linked lists in jush-php.js (methods and magic methods are not linked)
$function_names = [];
$api_php_new = []; // key => tooltip for the jush-api.js blocks
$api_php_fun = [];
$api_php2 = [];

foreach (preg_split('~\r?\n~', $api) as $line) {
	$line = rtrim($line);
	if ($line == '') {
		continue;
	}
	list($decl, $description) = array_pad(explode("\t", $line, 2), 2, '');

	// static method: "Class::method(signature): return\tdescription"
	if (preg_match('~^([\w\\\\]+)::(\w+)(\(.*)$~', $decl, $match)) {
		if (substr($match[2], 0, 2) != '__') {
			add_api($api_php2, js_escape("$match[1]::$match[2]"), tooltip($match[3], $description));
		}
		continue;
	}

	// class or function: "name(signature)\tdescription"
	if (!preg_match('~^([\w\\\\]+)(\(.*)$~', $decl, $match)) {
		continue; // keyword, method, $variable or constant, not a class or function
	}
	$name = $match[1];
	$js_name = js_escape($name);
	if (strpos($description, '(new)') === 0) { // class, interface or exception
		$class_names[$js_name] = true;
		add_api($api_php_new, $js_name, tooltip($match[2], trim(substr($description, strlen('(new)')))));
	} elseif ($name == 'clone') { // language construct, linked as a keyword instead of a function
		add_api($api_php2, $js_name, tooltip($match[2], $description));
	} elseif (substr($name, 0, 2) != '__') { // function
		$function_names[$js_name] = true;
		add_api($api_php2, $js_name, tooltip($match[2], $description));
	} elseif ($name != '__halt_compiler') { // magic method
		add_api($api_php_fun, $js_name, tooltip($match[2], $description));
	}
}

function set_list($jush, $prefix, $suffix, array $names, $label) {
	$start = strpos($jush, $prefix);
	if ($start === false) {
		fwrite(STDERR, "Can't find start of $label list in jush-php.js\n");
		exit(1);
	}
	$start += strlen($prefix);
	$end = strpos($jush, $suffix, $start);
	if ($end === false) {
		fwrite(STDERR, "Can't find end of $label list in jush-php.js\n");
		exit(1);
	}
	$old_names = explode('|', substr($jush, $start, $end - $start));
	fwrite(STDERR, "Added $label: " . implode(', ', array_diff($names, $old_names)) . "\n");
	fwrite(STDERR, "Removed $label: " . implode(', ', array_diff($old_names, $names)) . "\n");
	return substr_replace($jush, implode('|', $names), $start, $end - $start);
}

$jush = set_list($jush, 'var php_class = /(', ')/;', array_keys($class_names), 'classes');
$jush = set_list($jush, "'function.\$1': /(return|(?:include|require)(?:_once)?|(?:", ')(?=\s*\(|$))/,', array_keys($function_names), 'functions');

file_put_contents($jush_file, $jush);

// Replace all entries in a jush.api.* block with freshly generated ones.
function set_block($jush_api, $prefix, array $entries) {
	$start = strpos($jush_api, $prefix);
	if ($start === false) {
		fwrite(STDERR, "Can't find $prefix in jush-api.js\n");
		exit(1);
	}
	$start += strlen($prefix);
	$end = strpos($jush_api, "\n});", $start);
	if ($end === false) {
		fwrite(STDERR, "Can't find end of $prefix block in jush-api.js\n");
		exit(1);
	}
	$lines = '';
	foreach ($entries as $name => $tooltip) {
		$lines .= "\n\t'$name': '$tooltip',";
	}
	return substr_replace($jush_api, $lines, $start, $end - $start);
}

$jush_api = set_block($jush_api, 'jush.api.php2 = jush.api.lowercase_keys({', $api_php2);
$jush_api = set_block($jush_api, 'jush.api.php_fun = jush.api.lowercase_keys({', $api_php_fun);
$jush_api = set_block($jush_api, 'jush.api.php_new = jush.api.lowercase_keys({', $api_php_new);

file_put_contents($jush_api_file, $jush_api);
