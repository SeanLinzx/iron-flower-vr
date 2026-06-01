(function (global) {
  var VERSION = 1;
  var MAX_ENTRIES = 5;
  var STORAGE_KEY = "ironflower-leaderboard-v1";
  var PENDING_KEY = "ironflower-leaderboard-pending";

  var SOURCE_LABELS = {
    story: { zh: "故事模式", en: "Story Mode" },
    performance: { zh: "表演场景", en: "Performance" },
  };

  function nowIso() {
    return new Date().toISOString();
  }

  function makeId() {
    return "lb-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function normalizeProfile(profile) {
    profile = profile || {};
    return {
      displayName: String(profile.displayName || "").trim(),
      nickname: String(profile.nickname || "").trim(),
      organization: String(profile.organization || "").trim(),
      contact: String(profile.contact || "").trim(),
      note: String(profile.note || "").trim(),
    };
  }

  function normalizeEntry(raw, index) {
    var entry = raw || {};
    return {
      id: entry.id || makeId(),
      rank: typeof entry.rank === "number" ? entry.rank : index + 1,
      score: Math.max(0, Math.floor(Number(entry.score) || 0)),
      source: entry.source === "performance" ? "performance" : "story",
      sourceLabel:
        entry.sourceLabel ||
        (SOURCE_LABELS[entry.source === "performance" ? "performance" : "story"] || SOURCE_LABELS.story).zh,
      endingTier: entry.endingTier || "",
      grade: entry.grade || "",
      playedAt: entry.playedAt || entry.recordedAt || nowIso(),
      profile: normalizeProfile(entry.profile),
    };
  }

  function sortEntries(entries) {
    return entries
      .slice()
      .sort(function (a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.playedAt).localeCompare(String(b.playedAt));
      })
      .map(function (entry, index) {
        entry.rank = index + 1;
        return entry;
      });
  }

  function readStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[leaderboard] parse storage failed", err);
      return null;
    }
  }

  function writeStorage(data) {
    data.version = VERSION;
    data.maxEntries = MAX_ENTRIES;
    data.lastUpdated = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  }

  function emptyBoard() {
    return {
      version: VERSION,
      maxEntries: MAX_ENTRIES,
      lastUpdated: null,
      entries: [],
    };
  }

  var loadPromise = null;

  function loadLeaderboard(forceRefresh) {
    if (loadPromise && !forceRefresh) return loadPromise;

    loadPromise = new Promise(function (resolve) {
      var stored = readStorage();
      if (stored && Array.isArray(stored.entries)) {
        stored.entries = sortEntries(stored.entries.map(normalizeEntry)).slice(0, MAX_ENTRIES);
        resolve(stored);
        return;
      }
      resolve(emptyBoard());
    });

    return loadPromise;
  }

  function getMinQualifyingScore(entries) {
    entries = entries || [];
    if (entries.length < MAX_ENTRIES) return 0;
    return entries[entries.length - 1].score;
  }

  function qualifiesForLeaderboard(score, entries) {
    var value = Math.max(0, Math.floor(Number(score) || 0));
    if (!value) return false;
    entries = entries || [];
    if (entries.length < MAX_ENTRIES) return true;
    return value > getMinQualifyingScore(entries);
  }

  function setPendingSubmission(payload) {
    if (!payload || payload.score == null) return;
    var pending = {
      score: Math.max(0, Math.floor(Number(payload.score) || 0)),
      source: payload.source === "performance" ? "performance" : "story",
      endingTier: payload.endingTier || "",
      grade: payload.grade || "",
      createdAt: nowIso(),
    };
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }

  function getPendingSubmission() {
    try {
      var raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      return null;
    }
  }

  function clearPendingSubmission() {
    sessionStorage.removeItem(PENDING_KEY);
  }

  function hasPendingSubmission() {
    return !!getPendingSubmission();
  }

  function submitEntry(profile, options) {
    options = options || {};
    return loadLeaderboard().then(function (board) {
      var pending = options.pending !== false ? getPendingSubmission() : null;
      var score = Math.max(
        0,
        Math.floor(Number(options.score != null ? options.score : pending && pending.score) || 0)
      );
      if (!score) {
        return { ok: false, reason: "no-score", board: board };
      }

      var source =
        options.source || (pending && pending.source) || "performance";
      var profileNorm = normalizeProfile(profile);
      if (!profileNorm.displayName) {
        return { ok: false, reason: "missing-name", board: board };
      }

      if (!qualifiesForLeaderboard(score, board.entries) && !options.force) {
        return { ok: false, reason: "not-qualified", board: board };
      }

      var entry = normalizeEntry({
        id: makeId(),
        score: score,
        source: source,
        sourceLabel: (SOURCE_LABELS[source] || SOURCE_LABELS.story).zh,
        endingTier:
          options.endingTier ||
          (pending && pending.endingTier) ||
          (global.IronFlowerStory && global.IronFlowerStory.resolveEndingTier
            ? global.IronFlowerStory.resolveEndingTier(score)
            : ""),
        grade: options.grade || (pending && pending.grade) || "",
        playedAt: nowIso(),
        profile: profileNorm,
      });

      var merged = board.entries.slice();
      var replaceId = options.replaceId;
      if (replaceId) {
        merged = merged.filter(function (item) {
          return item.id !== replaceId;
        });
      }
      merged.push(entry);
      merged = sortEntries(merged).slice(0, MAX_ENTRIES);

      var saved = writeStorage({
        version: VERSION,
        maxEntries: MAX_ENTRIES,
        entries: merged,
      });

      clearPendingSubmission();
      return { ok: true, entry: entry, board: saved, qualified: true };
    });
  }

  global.IronFlowerLeaderboard = {
    VERSION: VERSION,
    MAX_ENTRIES: MAX_ENTRIES,
    STORAGE_KEY: STORAGE_KEY,
    SOURCE_LABELS: SOURCE_LABELS,
    load: loadLeaderboard,
    getEntries: function () {
      return loadLeaderboard().then(function (board) {
        return board.entries.slice();
      });
    },
    qualifies: qualifiesForLeaderboard,
    getMinQualifyingScore: getMinQualifyingScore,
    setPending: setPendingSubmission,
    getPending: getPendingSubmission,
    clearPending: clearPendingSubmission,
    hasPending: hasPendingSubmission,
    submit: submitEntry,
    normalizeProfile: normalizeProfile,
  };
})(window);
