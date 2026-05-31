(function (global) {
  var STORY_FLOW_VERSION = "20260531-a15";
  var CG_BASE = "./assets/story/";

  var STEP_ALIASES = {
    "intro-1": "start-2",
    "intro-2": "bridge-a1-1",
    "mp-1": "bridge-a2-1",
    "mp-2": "bridge-a2-7",
    "pp-1": "bridge-a3-1",
    "pp-2": "bridge-a3-5",
  };

  var BRIDGE_BEFORE_SCENE = {
    "scene-practice.html": "bridge-a2-1",
  };

  var PRACTICE_LEVEL_BRIDGE = {
    1: "bridge-a2-8",
    2: "bridge-a2-9",
    3: "bridge-a2-10",
    4: "bridge-a3-1",
  };

  var ENDING_FIRST_STEP = {
    excellent: "ending-a1-1",
    good: "ending-a2-1",
    basic: "ending-a3-1",
  };

  function cg(imageName, next, opts) {
    opts = opts || {};
    return {
      image: CG_BASE + imageName,
      next: next,
      buttonZh: opts.buttonZh || "点击继续",
      buttonEn: opts.buttonEn || "Continue",
      captionZh: opts.captionZh || "",
      captionEn: opts.captionEn || "",
    };
  }

  function buildSequence(ids, images, lastNext, opts) {
    var steps = {};
    for (var i = 0; i < ids.length; i++) {
      var next = i < ids.length - 1 ? ids[i + 1] : lastNext;
      steps[ids[i]] = cg(images[i], next, opts);
    }
    return steps;
  }

  var STEPS = {};

  Object.assign(
    STEPS,
    buildSequence(
      ["start-2", "start-3", "start-4", "start-5", "start-6", "start-7", "start-8", "start-9"],
      [
        "开始A2.png",
        "开始A3.png",
        "开始A4.png",
        "开始A5.png",
        "开始A6.png",
        "开始A7.png",
        "开始A8.png",
        "开始A9.png",
      ],
      "bridge-a1-1"
    )
  );

  Object.assign(
    STEPS,
    buildSequence(
      ["bridge-a1-1", "bridge-a1-2", "bridge-a1-3", "bridge-a1-4"],
      ["转场A1-1.png", "转场A1-2.png", "转场A1-3.png", "转场A1-4.png"],
      "scene:scene-materials.html"
    )
  );

  STEPS["bridge-a1-5"] = cg("转场A1-5.png", "scene:scene-materials.html?phase=heating", {
    buttonZh: "开始拉风箱",
    buttonEn: "Start Bellows",
  });

  Object.assign(
    STEPS,
    buildSequence(
      [
        "bridge-a2-1",
        "bridge-a2-2",
        "bridge-a2-3",
        "bridge-a2-4",
        "bridge-a2-5",
        "bridge-a2-6",
        "bridge-a2-7",
      ],
      [
        "转场A2-1.png",
        "转场A2-2.png",
        "转场A2-3.png",
        "转场A2-4.png",
        "转场A2-5.png",
        "转场A2-6.png",
        "转场A2-7.png",
      ],
      "scene:scene-practice.html"
    )
  );

  STEPS["bridge-a2-8"] = cg("转场A2-8.png", "scene:scene-practice.html?level=2");
  STEPS["bridge-a2-9"] = cg("转场A2-9.png", "scene:scene-practice.html?level=3");
  STEPS["bridge-a2-10"] = cg("转场A2-10.png", "scene:scene-practice.html?level=4");

  Object.assign(
    STEPS,
    buildSequence(
      ["bridge-a3-1", "bridge-a3-2", "bridge-a3-3", "bridge-a3-4", "bridge-a3-5"],
      ["转场A3-1.png", "转场A3-2.png", "转场A3-3.png", "转场A3-4.png", "转场A3-5.png"],
      "scene:scene-performance.html"
    )
  );

  STEPS["ending-a1-1"] = cg("结局A1-1-1.png", "ending-a1-2");
  STEPS["ending-a1-2"] = cg("结局A1-1.png", "scene:iron.html", {
    buttonZh: "返回首页",
    buttonEn: "Back to Home",
  });
  STEPS["ending-a2-1"] = cg("结局A2-1-1.png", "ending-a2-2");
  STEPS["ending-a2-2"] = cg("结局A2-1.png", "scene:iron.html", {
    buttonZh: "返回首页",
    buttonEn: "Back to Home",
  });
  STEPS["ending-a3-1"] = cg("结局A3-1-1.png", "ending-a3-2");
  STEPS["ending-a3-2"] = cg("结局A3-1.png", "scene:iron.html", {
    buttonZh: "返回首页",
    buttonEn: "Back to Home",
  });

  function isStoryMode() {
    return new URLSearchParams(window.location.search).get("story") === "1";
  }

  function prefersVrSession() {
    if (window.sessionStorage.getItem("ironflower-prefer-vr") === "1") return true;
    var scene = document.querySelector("a-scene");
    return !!(scene && scene.is && scene.is("vr-mode"));
  }

  function appendVrFlag(params) {
    if (prefersVrSession()) params.set("vr", "1");
  }

  function storyImagePageUrl(stepId, extra) {
    var params = new URLSearchParams({ story: "1", step: stepId });
    appendVrFlag(params);
    if (extra) {
      Object.keys(extra).forEach(function (key) {
        params.set(key, extra[key]);
      });
    }
    return "./story-image.html?" + params.toString();
  }

  function sceneUrl(file, extraParams) {
    var params = new URLSearchParams({ story: "1" });
    appendVrFlag(params);
    if (extraParams) {
      Object.keys(extraParams).forEach(function (key) {
        params.set(key, extraParams[key]);
      });
    }
    return "./" + file + "?" + params.toString();
  }

  var ENDING_THRESHOLDS = {
    high: 1800,
    mid: 900,
  };

  var PERFORMANCE_SCORING = {
    durationMs: 30000,
    hitScores: {
      marvelous: 150,
      excellent: 100,
      good: 60,
    },
    missPenalty: 35,
    hitWindows: {
      marvelous: 0.11,
      excellent: 0.2,
      good: 0.34,
    },
    endingThresholds: ENDING_THRESHOLDS,
    maxReferenceScore: 2400,
  };

  function resolveHitScore(distance) {
    var d = Number(distance) || 999;
    if (d < PERFORMANCE_SCORING.hitWindows.marvelous) {
      return {
        points: PERFORMANCE_SCORING.hitScores.marvelous,
        label: "MARVELOUS!",
        color: "#ffcfff",
        tier: "marvelous",
      };
    }
    if (d < PERFORMANCE_SCORING.hitWindows.excellent) {
      return {
        points: PERFORMANCE_SCORING.hitScores.excellent,
        label: "EXCELLENT!",
        color: "#c7ffd2",
        tier: "excellent",
      };
    }
    return {
      points: PERFORMANCE_SCORING.hitScores.good,
      label: "GOOD",
      color: "#99ebff",
      tier: "good",
    };
  }

  function resolveEndingTier(score) {
    var value = Number(score) || 0;
    if (value >= ENDING_THRESHOLDS.high) return "excellent";
    if (value >= ENDING_THRESHOLDS.mid) return "good";
    return "basic";
  }

  function resolveEndingImage(score) {
    var tier = resolveEndingTier(score);
    if (tier === "excellent") return CG_BASE + "结局A1-1.png";
    if (tier === "good") return CG_BASE + "结局A2-1.png";
    return CG_BASE + "结局A3-1.png";
  }

  function endingCaption(score, lang) {
    var value = Number(score) || 0;
    var tier = resolveEndingTier(value);
    if (lang === "en") {
      if (tier === "excellent") return "Happy End · Score " + value;
      if (tier === "good") return "Normal End · Score " + value;
      return "Bad End · Score " + value;
    }
    if (tier === "excellent") return "完美结局 · 得分 " + value;
    if (tier === "good") return "普通结局 · 得分 " + value;
    return "坏结局 · 得分 " + value;
  }

  function resolveStepId(stepId) {
    return STEP_ALIASES[stepId] || stepId;
  }

  function getStep(stepId, score, lang) {
    var resolved = resolveStepId(stepId);
    if (resolved === "ending") {
      var tier = resolveEndingTier(score);
      var firstStep = ENDING_FIRST_STEP[tier];
      return STEPS[firstStep] || null;
    }
    return STEPS[resolved] || null;
  }

  function navigateNext(next) {
    if (!next) return;
    if (next.indexOf("scene:") === 0) {
      var target = next.slice(6);
      var queryIndex = target.indexOf("?");
      if (queryIndex >= 0) {
        var file = target.slice(0, queryIndex);
        var extra = new URLSearchParams(target.slice(queryIndex + 1));
        var extraObj = {};
        extra.forEach(function (value, key) {
          extraObj[key] = value;
        });
        window.location.href = sceneUrl(file, extraObj);
        return;
      }
      if (target === "iron.html") {
        window.location.href = "./iron.html";
        return;
      }
      window.location.href = sceneUrl(target);
      return;
    }
    window.location.href = storyImagePageUrl(next);
  }

  function goToSceneWithStoryBridge(targetFile, storyMode) {
    if (!storyMode) {
      window.location.href = "./" + targetFile + "?mode=level";
      return;
    }
    var bridge = BRIDGE_BEFORE_SCENE[targetFile];
    if (bridge) {
      window.location.href = storyImagePageUrl(bridge);
      return;
    }
    window.location.href = sceneUrl(targetFile);
  }

  function goToPracticeLevelBridge(level) {
    var step = PRACTICE_LEVEL_BRIDGE[level];
    if (!step) return;
    window.location.href = storyImagePageUrl(step);
  }

  function goToMaterialHeatingBridge() {
    window.location.href = storyImagePageUrl("bridge-a1-5");
  }

  function goToStoryEnding(score) {
    var tier = resolveEndingTier(score);
    var stepId = ENDING_FIRST_STEP[tier];
    window.location.href = storyImagePageUrl(stepId, { score: String(score) });
  }

  global.IronFlowerStory = {
    STORY_FLOW_VERSION: STORY_FLOW_VERSION,
    STEP_ALIASES: STEP_ALIASES,
    BRIDGE_BEFORE_SCENE: BRIDGE_BEFORE_SCENE,
    PRACTICE_LEVEL_BRIDGE: PRACTICE_LEVEL_BRIDGE,
    STEPS: STEPS,
    resolveStepId: resolveStepId,
    ENDING_THRESHOLDS: ENDING_THRESHOLDS,
    PERFORMANCE_SCORING: PERFORMANCE_SCORING,
    isStoryMode: isStoryMode,
    prefersVrSession: prefersVrSession,
    storyImagePageUrl: storyImagePageUrl,
    getStep: getStep,
    navigateNext: navigateNext,
    goToSceneWithStoryBridge: goToSceneWithStoryBridge,
    goToPracticeLevelBridge: goToPracticeLevelBridge,
    goToMaterialHeatingBridge: goToMaterialHeatingBridge,
    goToStoryEnding: goToStoryEnding,
    resolveEndingImage: resolveEndingImage,
    resolveEndingTier: resolveEndingTier,
    resolveHitScore: resolveHitScore,
  };
})(window);
