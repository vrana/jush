# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

JUSH (JavaScript Syntax Highlighter) highlights the full stack of a PHP web app in the browser: HTML5, PHP, multiple SQL dialects (MySQL, MS SQL, Oracle, PostgreSQL, SQLite, ClickHouse, Firebird, SimpleDB), Redis commands, Elasticsearch queries, JavaScript, JSON, CSS3, HTTP headers, php.ini, and Apache config.
Its distinguishing features are highlighting arbitrarily mixed/embedded languages (PHP inside HTML attributes, SQL inside a PHP string, JS in `onclick=`, etc.) and linking recognized identifiers (functions, keywords) to their official documentation.
This repo is used as a Git submodule by Adminer (and other projects by the same author) for SQL/PHP highlighting.

## Commands

**Build:**
```bash
php compile.php
```
Concatenates `modules/jush.js` (core) plus every `modules/jush-*.js` (glob order) into the single root `jush.js`.
**`jush.js` is gitignored – it is a generated build artifact, not source.**
Always edit files under `modules/`, never `jush.js` directly.

**Tests:**
There is no CLI/Node test runner.
Open `tests.html` in a browser and check the `#result` div – a passing run shows no red `error:` markers (mismatches also log the actual output via `console.log`).
It loads the `modules/jush*.js` files directly plus `tests.js`, so no compilation step is needed – `php compile.php` only builds the distributed `jush.js`.

**Update scripts:**
The CLI scripts in `update/` regenerate the linked identifiers in `modules/jush-*.js` (and the tooltips in `jush-api.js` for PHP and JS) from official documentation sources.
Each takes a path to a local checkout of its source, e.g. `php update/js.php path/to/mdn-content`:
- `htm.php`, `css.php`, `js.php`, `http.php` – a checkout of https://github.com/mdn/content
- `js_doc.php` – a checkout of https://github.com/jsdoc/jsdoc.github.io
- `sqlite.php` – a checkout of https://sqlite.org/docsrc/
- `pgsql.php` – a checkout of the latest stable branch (`REL_*_STABLE`) of https://github.com/postgres/postgres
- `mssql.php` – a checkout of https://github.com/MicrosoftDocs/sql-docs; entry keys are the path of the page below `docs/` without `.md`, the address of `https://learn.microsoft.com/sql/$key`. It re-keys the entries by matching their phrases against the `title` and `f1_keywords` front matter, never rewriting a hand-crafted regexp like `((?:var)?binary)`; a key it can't derive is kept and reported, a full URL is left alone as hand-maintained. It then merges every entry whose key is `jush.slugs.mssql` of its phrase into one `$1` entry per template, splitting the merged entries back apart on the next run so that a moved page can leave its group. One template holds both the phrases linked anywhere and the ones linked only before `(`, the latter behind a shared lookahead in `(?:...)`, because a key can be written only once in the object literal. It finally orders the entries by `order_entries()` so that a short phrase doesn't swallow the beginning of a longer one in a later entry. It also reports the documented constructs which are not linked yet; that report is empty now, so a new one means the documentation grew – add the construct as an explicit `'<slug>': /(PHRASE)/` entry (functions take the `(?=\s*\(|$)` lookahead) and let the script merge it, or list its page in `$skip_pages` when it is no phrase to highlight
- `redis.php` – a checkout of the latest release branch of https://github.com/redis/redis; the command names come from `src/commands/*.json`, whose filenames are the redis.io doc slugs
- `sql.php` – two arguments: a cache directory for the MySQL online manual's index pages (fetched from dev.mysql.com on miss; bump `$mysql_version` in the script for a new release) and a checkout of https://github.com/mariadb-corporation/mariadb-docs; regenerates the marker-delimited regions plus the keywords, sqlset and sqlstatus lists in `modules/jush-sql.js`, keeping the hand-crafted entries and updating their `(?:...)` function groups in place
- `php.php` – a `php.api` file (URL in the script header; path optional, defaults to `./php.api`)

They edit the module files in place and report added/removed names on stderr – review that output and `git diff` before committing.

No package.json, Makefile, or lint config exists in this repo – don't invent lint/format commands.
`modules/*.js` are linted by ESLint from the parent Adminer repo (`conf/eslint.config.mjs`, run by `composer check`), which is why they contain `eslint-disable` comments; the root `jush.js`, `jush-api.js`, `tests.js`, `demo.js`, `jquery.jush.js` and `jush-help.js` are not linted.

## Architecture

**Core engine – `modules/jush.js`** (always compiled first):
- `jush.tr` – the central state-transition table: `jush.tr[state] = { subState: /regexp/, ... }`. A key prefixed `_N` (e.g. `_1`, `_2`) means "pop N levels of state"; any other key means "push into that child state".
- `jush.build_regexp` – lazily combines all regexps for a state into one alternation `RegExp`, tracking which sub-pattern index maps to which state (`jush.subpatterns`).
- `jush.highlight_states` – the recursive core. Walks text using the current state's combined regexp, pushing into or popping out of states as it matches, emitting `<span class="jush-STATE">...</span>` wrappers. Contains explicit handling for cross-language transitions (PHP-in-HTML-attribute, SQL-in-PHP-string, heredoc/nowdoc, PostgreSQL dollar-quoting, etc.).
- `jush.highlight` / `jush.highlight_html` / `jush.highlight_tag` – public entry points. `highlight_tag` finds `<code class="jush-LANG">` (or `class="language-LANG"`) elements and highlights them in place, batching via `setTimeout` when work exceeds `jush.timeout` (1000 ms).
- Keyword-to-doc-link system: `jush.links[state]` / `jush.links2[state]` (regexps matching recognized tokens) plus `jush.urls[state]` (doc URL templates) build clickable links; optional tooltip text comes from `jush.api[state][name]`, supplied by the separately-generated root file `jush-api.js` (not part of `modules/`, not touched by `compile.php`).
- MySQL/MariaDB share the `sql`, `sqlset` and `sqlstatus` states: entry keys there may be `'mysql-key maria-key'` pairs resolved in `keywords_links` by sniffing `mariadb` in the base URL (Adminer's `syntaxHighlighting()` swaps it at runtime). A missing maria key defaults to `mysqlKey.replace('.html', '/')` (the flat KB slug), `-` means "no link for that vendor", and MariaDB `$1` replacements keep underscores (KB slugs and anchors use them).

**Per-language modules – `modules/jush-<lang>.js`:**
Small, declarative files that each (a) extend `jush.tr` with new states/sub-states, (b) set `jush.urls.<state>` doc-link templates, and (c) set `jush.links`/`jush.links2` keyword regexps. See `modules/jush-css.js` for a concise example; `modules/jush-php.js` is the largest, enumerating the entire PHP function reference. Trivial modules like `jush-txt.js` are a single line.

`jush-textarea.js` and `jush-autocomplete-sql.js` are a different layer built on top of the core: a live, syntax-highlighted, editable `<textarea>` widget and SQL autocomplete, rather than a new language.

**Update scripts – `update/*.php`:**
Maintenance tooling, not part of the compiled `jush.js`. Shared helpers (`set_list`, `set_block`, `mdn_section`, …) live in `update/functions.inc.php`; each script parses its documentation source and rewrites the keyword lists between fixed markers in the module file.

## Conventions

- Dual-licensed Apache-2.0 / GPL-2.0-only.
- Commit style: `Area: Message` (e.g. `MySQL: Highlight inet4 and inet6 types`), matching the parent Adminer repo. Document user-visible changes in `changes.txt`.
