(function ($) {
	
	// include jush.js here
	
	$.jush = jush;
	
	/** Highlights element content
	* @param [string]
	* @return jQuery
	* @this jQuery
	*/
	$.fn.jush = function (language) {
		if (!language) {
			var match = /(^|\s)(?:jush-|language-)(\S+)/.exec(this.attr('class'));
			language = (match ? match[2] : 'htm');
		}
		return this.html(jush.highlight(language, this.text()));
	}
	
})(jQuery);
