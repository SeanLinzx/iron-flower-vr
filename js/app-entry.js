(function (global) {
  var STORAGE_KEY = "ironflower-entry";
  var LEGACY_VR_KEY = "ironflower-prefer-vr";
  var HOME_WEB = "./iron-web.html";
  var HOME_VR = "./iron-vr.html";

  function getEntry() {
    var entry = global.sessionStorage.getItem(STORAGE_KEY);
    if (entry === "vr" || entry === "web") return entry;
    if (global.sessionStorage.getItem(LEGACY_VR_KEY) === "1") {
      global.sessionStorage.setItem(STORAGE_KEY, "vr");
      global.sessionStorage.removeItem(LEGACY_VR_KEY);
      return "vr";
    }
    return "web";
  }

  function setEntry(mode) {
    global.sessionStorage.setItem(STORAGE_KEY, mode === "vr" ? "vr" : "web");
    global.sessionStorage.removeItem(LEGACY_VR_KEY);
  }

  function getHomeHref() {
    return getEntry() === "vr" ? HOME_VR : HOME_WEB;
  }

  function getSwitchHref() {
    return getEntry() === "vr" ? HOME_WEB : HOME_VR;
  }

  function prefersVrSession() {
    return getEntry() === "vr";
  }

  function appendVrFlag(params) {
    if (prefersVrSession()) params.set("vr", "1");
  }

  function shouldAutoEnterVr(searchParams) {
    searchParams = searchParams || new URLSearchParams(global.location.search);
    return searchParams.get("vr") === "1" || prefersVrSession();
  }

  function tryAutoEnterVr(scene, options) {
    options = options || {};
    if (!shouldAutoEnterVr(options.searchParams)) return;
    if (!scene || !scene.enterVR) return;
    var delay = typeof options.delay === "number" ? options.delay : 420;
    global.setTimeout(function () {
      scene.enterVR().catch(function () {});
    }, delay);
  }

  global.IronFlowerEntry = {
    HOME_WEB: HOME_WEB,
    HOME_VR: HOME_VR,
    getEntry: getEntry,
    setEntry: setEntry,
    getHomeHref: getHomeHref,
    getSwitchHref: getSwitchHref,
    prefersVrSession: prefersVrSession,
    shouldAutoEnterVr: shouldAutoEnterVr,
    tryAutoEnterVr: tryAutoEnterVr,
    appendVrFlag: appendVrFlag,
    markWeb: function () {
      setEntry("web");
    },
    markVr: function () {
      setEntry("vr");
    },
  };
})(window);
