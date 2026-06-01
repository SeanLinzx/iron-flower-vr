(function () {
  var COPY = {
    zh: { label: "返回首页", sublabel: "主菜单" },
    en: { label: "Home", sublabel: "Main menu" },
  };

  function resolveHomeHref() {
    if (window.IronFlowerEntry) return window.IronFlowerEntry.getHomeHref();
    return "./iron-web.html";
  }

  function navigateHome() {
    window.location.href = resolveHomeHref();
  }

  function applyLanguage(lang) {
    var pack = COPY[lang === "en" ? "en" : "zh"];
    var href = resolveHomeHref();
    var link = document.getElementById("homeNavLink");
    if (link) {
      link.textContent = pack.label;
      link.setAttribute("href", href);
      link.setAttribute("title", pack.sublabel);
      link.setAttribute("aria-label", pack.label + " · " + pack.sublabel);
    }

    var nav3d = document.getElementById("homeNav3d");
    if (nav3d) {
      var label = nav3d.querySelector("[data-home-nav-label]");
      var sublabel = nav3d.querySelector("[data-home-nav-sublabel]");
      if (label) label.setAttribute("value", pack.label);
      if (sublabel) sublabel.setAttribute("value", pack.sublabel);
      if (nav3d.hasAttribute("canvas-button")) {
        nav3d.setAttribute(
          "canvas-button",
          "label: " +
            pack.label +
            "; sublabel: " +
            pack.sublabel +
            "; href: " +
            href +
            "; width: 1.28; height: 0.4; background: rgba(6, 4, 3, 0.8); border: rgba(255, 189, 66, 0.55)"
        );
      }
    }
  }

  function bindVrHomeNav() {
    var nav3d = document.getElementById("homeNav3d");
    if (!nav3d) return;
    if (!nav3d.__homeNavClickBound) {
      nav3d.__homeNavClickBound = true;
      nav3d.addEventListener("click", function (event) {
        event.stopPropagation();
        navigateHome();
      });
    }

    var scene = document.querySelector("a-scene");
    if (!scene || scene.__homeNavVrBound) return;
    scene.__homeNavVrBound = true;
    var sync = function () {
      var inVr = scene.is && scene.is("vr-mode");
      nav3d.setAttribute("visible", inVr ? "true" : "false");
    };
    scene.addEventListener("enter-vr", sync);
    scene.addEventListener("exit-vr", sync);
    scene.addEventListener("loaded", sync);
    sync();
  }

  function ensureDesktopNav() {
    if (document.getElementById("homeNavLink")) return;

    var root = document.createElement("div");
    root.id = "homeNavRoot";
    root.className = "home-nav-root";

    var link = document.createElement("a");
    link.id = "homeNavLink";
    link.className = "home-nav-link";
    link.href = resolveHomeHref();
    link.textContent = COPY.zh.label;

    root.appendChild(link);
    document.body.insertBefore(root, document.body.firstChild);
  }

  function resolveInitialLanguage() {
    if (window.IronFlowerWebI18n) return window.IronFlowerWebI18n.getLang();
    return "zh";
  }

  function init() {
    ensureDesktopNav();
    applyLanguage(resolveInitialLanguage());
    bindVrHomeNav();
  }

  window.IronFlowerHomeNav = {
    applyLanguage: applyLanguage,
    homeHref: resolveHomeHref,
    navigateHome: navigateHome,
    bindVrHomeNav: bindVrHomeNav,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
