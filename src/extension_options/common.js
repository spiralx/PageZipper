function saveChangeToList(siteUrl, callback, saveFlag) {
  var domain = getDomain(siteUrl);
  if (saveFlag === undefined) saveFlag = "domain";
  if (["deleted", "domain", "nohome"].indexOf(saveFlag) < 0) throw "Invalid save flag";

  //Update persistent storage
  var toGet = {};
  toGet["whitelist"] = {};
  getBrowserStorage().get(toGet, function(items) {
    let currList = items["whitelist"];
    currList[domain] = saveFlag;

    var toSet = {};
    toSet["whitelist"] = currList;
    getBrowserStorage().set(toSet, function() {
      if (callback) callback();
    });

  });
}

function getFromList(url, callback) {
  var domain = getDomain(url), toGet = {};
  toGet['whitelist'] = {};
  getBrowserStorage().get(toGet, function(items) {
    callback( items['whitelist'][domain] );
  });
}

// Use URI.js to correctly handle Second Level Domains such as .co.uk or .com.au
function getDomain(url) {
  const uri = new URI(url)
  return uri.domain()
}

function isActiveDomain(domainValue) {
  return domainValue == "domain" || domainValue == "nohome";
}

function is_homepage(url) {
  var a = document.createElement("a");
  a.href = url;
  return a.pathname == "/";
}

// Browser storage is complicated because it's used by both background page and
// options page, but is defined on background page
function getBrowserStorage() {
  return window['browserStorage'] || chrome.extension.getBackgroundPage().browserStorage;
}
