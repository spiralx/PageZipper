/*------------------------- Load the FF Extension ----------------------*/

/* Get the local copies of all our important variables
 * Required because in FF extension 'window' points to the browser dom window - is global across all tabs
 * window.content is the tab scope */
function pgzp() {
	return window.content.currPgzp;
}


/*------------------------- Events ----------------------*/
function _pgzpInitExtension() {
	window.content.currPgzp = new PageZipper();
	pgzp().win = window.content
	pgzp().doc = pgzp().win.document;
	//need to set the context for jquery, otherwise jquery's finder will start at the FF/XUL root instead of the document root, and get lost
	//use pgzp().jq(pgzp().doc).find(elem) not pgzp().jq(elem)

	pgzp().loader_type = "ffextension";
	pgzp().media_path = "chrome://pagezipper/skin/";
	pgzp().loadPageZipper();
	//Manage tabs
	gBrowser.tabContainer.addEventListener("TabSelect", _pgzpOnTabChange, false);
	window.content._pgzpTab = gBrowser.selectedTab;
}

function _pgzpInitAutorun() {
	window.content.currPgzp = new PageZipper();
	pgzp().win = window.content
	pgzp().doc = pgzp().win.document;
	pgzp().loader_type = "autorun";
	pgzp().loadPageZipper();
	pgzp().pages.push({url: pgzp().win.location.href});
}

function _pgzpToggleExtension() {
	if (!window.content['currPgzp']) _pgzpInitExtension();

	if (pgzp().is_running) {
		pgzp().stopPageZipper();
		_pgzpSetButtonStatus(false);
	} else {
		pgzp().runPageZipper();
		_pgzpSetButtonStatus(true);
	}
}

//Fired on every tab change
function _pgzpOnTabChange() {
	//Firebug.Console.log("detected tab change");
	if (window.content._pgzpTab && window.content._pgzpTab.selected) {
		_pgzpSetButtonStatus(pgzp().is_running);
		if (!pgzp().is_running) pgzp().runPageZipper();
	} else {
		_pgzpSetButtonStatus(false);
		if (pgzp().is_running) pgzp().stopPageZipper();
	}
}


/*------------------------- Autorun ----------------------*/
function _pgzpAutorun() {
	var scoreThreshold = 5000;
	var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	//Firebug.Console.log("@autorun: option: " + prefManager.getBoolPref("extensions.pagezipper.autorun") + " pgzp loaded: " + window.content['currPgzp']);
	//check preferences and make sure pgzp has not already scored this page
	if (prefManager.getBoolPref("extensions.pagezipper.autorun") && !window.content['currPgzp']) {
		//check the score to see if this page has any 'next' pages
		_pgzpInitAutorun();
		var nextLink = pgzp().getNextLink(pgzp().doc.body);
		if (nextLink) Firebug.Console.log("Next url text: " + nextLink.text + " url: " + nextLink.url + " score: " + nextLink.finalScore);
		if (nextLink && nextLink.finalScore > scoreThreshold) {
			//there are next pages - start pagezipper
			_pgzpInitExtension();
			_pgzpToggleExtension();
		}
	}
}


/*------------------------- Configure FF ----------------------*/
//Runs only once ever! - The first time pgzp is loaded after being installed
function _pgzpOnFirstRun() {
	_pgzpInstallFFButton("nav-bar", "pagezipper-button", "urlbar-container");
	// _pgzpInstallFFButton("addon-bar", "pagezipper-button", "addonbar-closebutton");
}


/*------------------------- PageZipper FF Extension Utils ----------------------*/
function _pgzpSetButtonStatus(active) {
	var pgzpButton = document.getElementById("pagezipper-button")
	pgzpButton.style.listStyleImage = "url('chrome://pagezipper/skin/zipper_24" + (active ? '_green' : '') + ".png')";
}


/*------------------------- FF Extension Utils ----------------------*/

/**
 * Installs the toolbar button with the given ID into the given
 * toolbar, if it is not already present in the document.
 *
 * @param {string} toolbarId The ID of the toolbar to install to.
 * @param {string} id The ID of the button to install.
 */
function _pgzpInstallFFButton(toolbarId, id, beforeId) {
    if (!document.getElementById(id)) {
        var toolbar = document.getElementById(toolbarId);
        var before = toolbar.firstChild;
        if (beforeId) {  
            var elem = document.getElementById(beforeId);
            if (elem && elem.parentNode == toolbar) before = elem;  
        }

        toolbar.insertItem(id, before);
        toolbar.setAttribute("currentset", toolbar.currentSet);
        document.persist(toolbar.id, "currentset");

        if (toolbarId == "addon-bar")
            toolbar.collapsed = false;
    }
}

function _pgzpIsFirstRun() {  
	var prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
	var hasBeenRun = "extensions.pagezipper.hasBeenRun";  
	if (!prefManager.getBoolPref(hasBeenRun)) {  
		prefManager.setBoolPref(hasBeenRun, true);
		return true;  
	}
	false;
}

function _pgzpOnBrowserLoad(aEvent) {
	if (_pgzpIsFirstRun()) _pgzpOnFirstRun();
	
	//initialize page listener
	var appcontent = document.getElementById("appcontent");   // browser  
	if(appcontent) appcontent.addEventListener("DOMContentLoaded", _pgzpOnPageLoad, true);  
}

function _pgzpOnPageLoad(aEvent) {
	// add event listener for page unload
	aEvent.originalTarget.defaultView.addEventListener("unload", _pgzpOnPageUnload, true);  
	
	_pgzpAutorun();	
}

function _pgzpOnPageUnload(aEvent) {
	if (pgzp()) {
		pgzp().stopPageZipper();
		_pgzpSetButtonStatus(false);
	}
}

//Load on browser init
window.addEventListener("load", _pgzpOnBrowserLoad, false);