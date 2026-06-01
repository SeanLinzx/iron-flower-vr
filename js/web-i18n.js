(function (global) {
  var STORAGE_KEY = "ironflower-lang";

  var PACKS = {
    home: {
      zh: {
        title: "铜官窑打铁花｜Web 版 · 模式选择",
        langToggle: "English",
        kicker: "铜官窑打铁花 · Web",
        subtitle: "铜官窑 · 打铁花",
        credit: "设计前沿专题研究-组2",
        creditMembers: "郑瑞啸、文欣橦、张婷婷、万钰、林铮翔",
        entryBadge: "Web 浏览器版",
        chooseMode: "选择体验模式",
        modePanelAria: "模式选择",
        storyTitle: "故事模式",
        storyText:
          "先阅读故事图片，再依次进入素材、练习与表演场景；表演得分决定结局画面。",
        levelMode: "关卡模式",
        level1Title: "准备素材的场景",
        level1Text: "选择材料、入炉、控温融铁。",
        level2Title: "练习场景",
        level2Text: "完成四关节奏练习，获得表演资格。",
        level3Title: "表演材料准备",
        level3Text: "表演前选材料、拉风箱并取出铁水。",
        level4Title: "表演场景",
        level4Text: "进入正式表演，击打铁花并得到观众反馈。",
        footerLeaderboard: "得分排行榜（前 5 名）",
        footerLegacy: "查看旧版本",
        switchVr: "切换到 VR 版本 →",
      },
      en: {
        title: "Tongguan Kiln Iron Flower · Web · Mode Select",
        langToggle: "中文",
        kicker: "Tongguan Kiln Iron Flower · Web",
        subtitle: "Tongguan Kiln · Iron Flower",
        credit: "Design Frontiers Research — Group 2",
        creditMembers: "Zheng Ruixiao, Wen Xintong, Zhang Tingting, Wan Yu, Lin Zhengxiang",
        entryBadge: "Web Browser Edition",
        chooseMode: "Choose Experience",
        modePanelAria: "Mode selection",
        storyTitle: "Story Mode",
        storyText:
          "Read story images first, then materials, practice and performance; your score decides the ending.",
        levelMode: "Level Mode",
        level1Title: "Material Prep",
        level1Text: "Select materials, load furnace, melt iron.",
        level2Title: "Practice",
        level2Text: "Complete four rhythm levels to qualify for the show.",
        level3Title: "Show Material Prep",
        level3Text: "Select materials, pull bellows, extract molten iron.",
        level4Title: "Performance",
        level4Text: "Enter the formal show, strike iron flowers and get audience feedback.",
        footerLeaderboard: "Score Leaderboard (Top 5)",
        footerLegacy: "Legacy Version",
        switchVr: "Switch to VR Edition →",
      },
    },
    leaderboard: {
      zh: {
        title: "得分排行榜｜铜官窑打铁花",
        langToggle: "English",
        backHome: "← 返回首页",
        heading: "打铁花得分排行榜",
        intro:
          "故事模式与表演场景的最终表演得分，本机保留前 5 名。数据仅存在当前浏览器的本地存储中，换设备或清空浏览器数据后会重置。",
        tableAria: "前五名排行榜",
        thRank: "名次",
        thName: "称呼",
        thScore: "得分",
        thMode: "模式",
        thOrg: "单位",
        thTime: "时间",
        empty: "暂无记录，完成故事模式或表演场景并进入前 5 名即可上榜。",
        refresh: "刷新列表",
      },
      en: {
        title: "Score Leaderboard · Tongguan Kiln Iron Flower",
        langToggle: "中文",
        backHome: "← Home",
        heading: "Iron Flower Score Leaderboard",
        intro:
          "Top 5 final performance scores from Story Mode and Performance. Data is stored locally in this browser only and resets if you switch devices or clear browser data.",
        tableAria: "Top five leaderboard",
        thRank: "Rank",
        thName: "Name",
        thScore: "Score",
        thMode: "Mode",
        thOrg: "Organization",
        thTime: "Time",
        empty: "No entries yet. Finish Story Mode or Performance and rank in the top 5 to appear here.",
        refresh: "Refresh",
      },
    },
  };

  function getLang() {
    try {
      var lang = global.localStorage.getItem(STORAGE_KEY);
      return lang === "en" ? "en" : "zh";
    } catch (e) {
      return "zh";
    }
  }

  function setLang(lang) {
    try {
      global.localStorage.setItem(STORAGE_KEY, lang === "en" ? "en" : "zh");
    } catch (e) {}
  }

  function toggleLang() {
    setLang(getLang() === "zh" ? "en" : "zh");
    return getLang();
  }

  function applyPage(pageId) {
    var pack = PACKS[pageId];
    if (!pack) return getLang();

    var lang = getLang();
    var copy = pack[lang];
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    if (copy.title) document.title = copy.title;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (copy[key] === undefined) return;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") {
        el.placeholder = copy[key];
      } else {
        el.textContent = copy[key];
      }
    });

    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-aria");
      if (copy[key] !== undefined) el.setAttribute("aria-label", copy[key]);
    });

    var toggle = document.getElementById("langToggle");
    if (toggle) toggle.textContent = copy.langToggle;

    if (global.IronFlowerHomeNav) global.IronFlowerHomeNav.applyLanguage(lang);
    return lang;
  }

  function initPage(pageId) {
    applyPage(pageId);
    var toggle = document.getElementById("langToggle");
    if (!toggle || toggle.__i18nBound) return;
    toggle.__i18nBound = true;
    toggle.addEventListener("click", function () {
      toggleLang();
      applyPage(pageId);
      if (typeof global.dispatchEvent === "function") {
        global.dispatchEvent(
          new CustomEvent("ironflower:languagechange", { detail: { lang: getLang(), pageId: pageId } })
        );
      }
    });
  }

  global.IronFlowerWebI18n = {
    STORAGE_KEY: STORAGE_KEY,
    PACKS: PACKS,
    getLang: getLang,
    setLang: setLang,
    toggleLang: toggleLang,
    applyPage: applyPage,
    initPage: initPage,
  };
})(window);
