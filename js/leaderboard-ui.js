(function (global) {
  var overlayEl = null;

  function ensureOverlay() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement("div");
    overlayEl.id = "ironflowerLeaderboardOverlay";
    overlayEl.className = "leaderboard-overlay";
    overlayEl.setAttribute("role", "dialog");
    overlayEl.setAttribute("aria-modal", "true");
    overlayEl.innerHTML =
      '<div class="leaderboard-card">' +
      '  <h2 id="lbOverlayTitle">荣登排行榜</h2>' +
      '  <p class="lb-sub" id="lbOverlaySub"></p>' +
      '  <form class="leaderboard-form" id="lbOverlayForm">' +
      '    <label for="lbDisplayName">称呼 / 姓名 <span class="req">*</span></label>' +
      '    <input id="lbDisplayName" name="displayName" maxlength="32" required autocomplete="name" />' +
      '    <label for="lbNickname">昵称（选填）</label>' +
      '    <input id="lbNickname" name="nickname" maxlength="24" autocomplete="nickname" />' +
      '    <label for="lbOrganization">学校 / 单位（选填）</label>' +
      '    <input id="lbOrganization" name="organization" maxlength="48" />' +
      '    <label for="lbContact">联系方式（选填）</label>' +
      '    <input id="lbContact" name="contact" maxlength="48" autocomplete="tel" />' +
      '    <label for="lbNote">留言（选填）</label>' +
      '    <textarea id="lbNote" name="note" maxlength="120"></textarea>' +
      '    <div class="leaderboard-actions">' +
      '      <button type="submit" class="primary" id="lbSubmitBtn">提交上榜</button>' +
      '      <button type="button" class="ghost" id="lbSkipBtn">稍后再说</button>' +
      '      <button type="button" class="ghost" id="lbViewBtn">查看排行榜</button>' +
      '    </div>' +
      '    <p class="leaderboard-msg" id="lbOverlayMsg" aria-live="polite"></p>' +
      "  </form>" +
      "</div>";

    document.body.appendChild(overlayEl);

    overlayEl.querySelector("#lbSkipBtn").addEventListener("click", function () {
      closeOverlay();
    });

    overlayEl.querySelector("#lbViewBtn").addEventListener("click", function () {
      window.location.href = "./leaderboard.html";
    });

    overlayEl.querySelector("#lbOverlayForm").addEventListener("submit", function (event) {
      event.preventDefault();
      if (!global.IronFlowerLeaderboard) return;

      var msg = overlayEl.querySelector("#lbOverlayMsg");
      msg.className = "leaderboard-msg";
      msg.textContent = "提交中…";

      var profile = {
        displayName: overlayEl.querySelector("#lbDisplayName").value,
        nickname: overlayEl.querySelector("#lbNickname").value,
        organization: overlayEl.querySelector("#lbOrganization").value,
        contact: overlayEl.querySelector("#lbContact").value,
        note: overlayEl.querySelector("#lbNote").value,
      };

      global.IronFlowerLeaderboard.submit(profile).then(function (result) {
        if (result.ok) {
          msg.className = "leaderboard-msg is-ok";
          msg.textContent = "已写入本机排行榜！";
          window.setTimeout(closeOverlay, 1400);
          return;
        }
        msg.className = "leaderboard-msg is-error";
        if (result.reason === "missing-name") msg.textContent = "请填写称呼或姓名。";
        else if (result.reason === "not-qualified") msg.textContent = "得分未进入前 5 名，无法上榜。";
        else msg.textContent = "提交失败，请重试。";
      });
    });

    return overlayEl;
  }

  function closeOverlay() {
    if (!overlayEl) return;
    overlayEl.classList.remove("is-open");
  }

  function openOverlay(options) {
    options = options || {};
    if (!global.IronFlowerLeaderboard) return Promise.resolve(false);

    return global.IronFlowerLeaderboard.load().then(function (board) {
      var pending = global.IronFlowerLeaderboard.getPending();
      var score = Math.floor(
        Number(options.score != null ? options.score : pending && pending.score) || 0
      );
      if (!score) return false;

      if (!global.IronFlowerLeaderboard.qualifies(score, board.entries) && !options.force) {
        global.IronFlowerLeaderboard.clearPending();
        return false;
      }

      if (!pending && options.score != null) {
        global.IronFlowerLeaderboard.setPending({
          score: score,
          source: options.source || "performance",
          endingTier: options.endingTier || "",
          grade: options.grade || "",
        });
        pending = global.IronFlowerLeaderboard.getPending();
      }

      var source = (pending && pending.source) || options.source || "performance";
      var sourceLabel =
        source === "performance"
          ? global.IronFlowerLeaderboard.SOURCE_LABELS.performance.zh
          : global.IronFlowerLeaderboard.SOURCE_LABELS.story.zh;

      var minScore = global.IronFlowerLeaderboard.getMinQualifyingScore(board.entries);
      var el = ensureOverlay();
      el.querySelector("#lbOverlayTitle").textContent = "恭喜！得分进入前 5 名";
      el.querySelector("#lbOverlaySub").textContent =
        sourceLabel +
        " · 本次得分 " +
        score +
        (board.entries.length >= global.IronFlowerLeaderboard.MAX_ENTRIES
          ? "（需超过第 5 名 " + minScore + " 分）"
          : "") +
        "。填写以下信息即可荣登排行榜。";
      el.querySelector("#lbOverlayMsg").textContent = "";
      el.querySelector("#lbOverlayMsg").className = "leaderboard-msg";
      el.querySelector("#lbOverlayForm").reset();
      el.classList.add("is-open");
      window.setTimeout(function () {
        var nameInput = el.querySelector("#lbDisplayName");
        if (nameInput) nameInput.focus();
      }, 80);
      return true;
    });
  }

  function tryOpenPendingOverlay() {
    if (!global.IronFlowerLeaderboard || !global.IronFlowerLeaderboard.hasPending()) {
      return Promise.resolve(false);
    }
    return openOverlay();
  }

  global.IronFlowerLeaderboardUi = {
    open: openOverlay,
    close: closeOverlay,
    tryOpenPending: tryOpenPendingOverlay,
  };
})(window);
