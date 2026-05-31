(function () {
  var HOME_PATH = "./iron.html";
  var COPY = {
    zh: { label: "返回首页", sublabel: "主菜单" },
    en: { label: "Home", sublabel: "Main menu" },
  };

  function resolveHomeHref() {
    return HOME_PATH;
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
      nav3d.setAttribute(
        "canvas-button",
        "label: " +
          pack.label +
          "; sublabel: " +
          pack.sublabel +
          "; href: " +
          HOME_PATH +
          "; width: 1.28; height: 0.4; background: rgba(6, 4, 3, 0.8); border: rgba(255, 189, 66, 0.55)"
      );
    }
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

  function init() {
    ensureDesktopNav();
    applyLanguage("zh");
  }

  window.IronFlowerHomeNav = {
    applyLanguage: applyLanguage,
    homeHref: resolveHomeHref,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
