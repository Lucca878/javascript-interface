// Match specRunner.html behavior: keep init.js from auto-running app.init() during specs.
window.SKIP_APP_INIT = true;

// Prevent accidental navigation from anchor tags during automated runs.
document.addEventListener(
	"click",
	function (event) {
		const anchor = event.target && event.target.closest ? event.target.closest("a[href]") : null;
		if (anchor) {
			event.preventDefault();
		}
	},
	true
);

// Karma's jasmine adapter treats beforeunload as a hard error. Clear it to avoid false positives.
window.onbeforeunload = null;
