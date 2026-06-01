(function (global) {
  if (!global.AFRAME) return;

  function findClickableFromObject(object3D) {
    var current = object3D;
    while (current) {
      if (current.userData && current.userData.clickableEl) {
        return current.userData.clickableEl;
      }
      if (current.el && current.el.classList && current.el.classList.contains("clickable")) {
        return current.el;
      }
      current = current.parent;
    }
    return null;
  }

  function raycastHandTarget(hand, raycaster, meshCollector, far) {
    var meshes = meshCollector();
    if (!meshes.length || !hand) return null;
    far = far || 12;

    if (hand.components && hand.components.raycaster) {
      var handRay = hand.components.raycaster;
      if (typeof handRay.refreshObjects === "function") handRay.refreshObjects();
      if (handRay.intersectedEls && handRay.intersectedEls.length) {
        for (var i = 0; i < handRay.intersectedEls.length; i++) {
          var hitEl = handRay.intersectedEls[i];
          if (hitEl.classList && hitEl.classList.contains("clickable")) return hitEl;
        }
      }
      var handRc = handRay.raycaster;
      if (handRc && handRc.ray) {
        raycaster.ray.copy(handRc.ray);
        raycaster.far = far;
        var handHits = raycaster.intersectObjects(meshes, false);
        if (handHits.length) return findClickableFromObject(handHits[0].object);
      }
    }

    var origin = new THREE.Vector3();
    var direction = new THREE.Vector3(0, 0, -1);
    hand.object3D.updateMatrixWorld(true);
    hand.object3D.getWorldPosition(origin);
    direction.applyQuaternion(hand.object3D.getWorldQuaternion(new THREE.Quaternion()));
    raycaster.set(origin, direction.normalize());
    raycaster.far = far;
    var hits = raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    return findClickableFromObject(hits[0].object);
  }

  AFRAME.registerComponent("canvas-label", {
    schema: {
      text: { default: "" },
      width: { default: 2.4 },
      height: { default: 0.58 },
      background: { default: "rgba(18, 10, 4, 0.72)" },
      border: { default: "#ffbd42" },
      color: { default: "#fff4d2" },
      fontSize: { default: 40 },
      subFontSize: { default: 26 },
    },

    init: function () {
      this.drawLabel();
    },

    update: function () {
      this.drawLabel();
    },

    remove: function () {
      this.disposeMesh();
    },

    disposeMesh: function () {
      if (!this.mesh) return;
      this.el.object3D.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    },

    drawLabel: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      canvas.width = Math.round(720 * scale);
      canvas.height = Math.round(220 * scale);

      context.scale(scale, scale);
      this.roundRect(context, 0, 0, 720, 220, 28, this.data.background, this.data.border);

      var lines = (this.data.text || "").split("|");
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = this.data.color;
      context.font =
        "700 " + this.data.fontSize + "px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(lines[0] || "", 360, lines[1] ? 58 : 110, 640);

      if (lines[1]) {
        context.fillStyle = "#ffd37a";
        context.font =
          "400 " + this.data.subFontSize + "px Arial, PingFang SC, Microsoft YaHei, sans-serif";
        this.wrapText(context, lines[1], 360, 120, 620, 34, 3);
      }

      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.disposeMesh();

      var geometry = new THREE.PlaneGeometry(this.data.width, this.data.height);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.object3D.add(this.mesh);
    },

    wrapText: function (context, text, x, y, maxWidth, lineHeight, maxLines) {
      var tokens = text.match(/[\u4e00-\u9fff]|[^\s\u4e00-\u9fff]+/g) || [text];
      var lines = [];
      var line = "";

      tokens.forEach(function (token) {
        var separator = /[\u4e00-\u9fff]/.test(token) ? "" : " ";
        var testLine = line ? line + separator + token : token;

        if (context.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = token;
        } else {
          line = testLine;
        }
      });

      if (line) lines.push(line);

      lines.slice(0, maxLines).forEach(function (lineText, index) {
        var output = lineText;
        if (index === maxLines - 1 && lines.length > maxLines) {
          output = lineText.replace(/\s+$/, "") + "...";
        }
        context.fillText(output, x, y + index * lineHeight, maxWidth);
      });
    },

    roundRect: function (context, x, y, width, height, radius, fill, stroke) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
      context.fillStyle = fill;
      context.fill();
      if (stroke) {
        context.strokeStyle = stroke;
        context.lineWidth = 4;
        context.stroke();
      }
    },
  });

  AFRAME.registerComponent("canvas-button", {
    schema: {
      label: { default: "" },
      sublabel: { default: "" },
      labelEn: { default: "" },
      sublabelEn: { default: "" },
      href: { default: "" },
      width: { default: 2.8 },
      height: { default: 0.52 },
      background: { default: "rgba(255, 189, 66, 0.22)" },
      border: { default: "rgba(255, 224, 161, 0.72)" },
      color: { default: "#fff8ce" },
      variant: { default: "default" },
      index: { default: "" },
    },

    init: function () {
      this._hovered = false;
      this.onActivate = this.onActivate.bind(this);
      this.onHoverStart = this.onHoverStart.bind(this);
      this.onHoverEnd = this.onHoverEnd.bind(this);
      this.el.classList.add("clickable");
      this.el.addEventListener("click", this.onActivate);
      this.el.addEventListener("mouseenter", this.onHoverStart);
      this.el.addEventListener("mouseleave", this.onHoverEnd);
      this.drawButton();
    },

    update: function () {
      this.drawButton();
    },

    remove: function () {
      this.el.removeEventListener("click", this.onActivate);
      this.el.removeEventListener("mouseenter", this.onHoverStart);
      this.el.removeEventListener("mouseleave", this.onHoverEnd);
      this.disposeMesh();
    },

    onHoverStart: function () {
      if (this._hovered) return;
      this._hovered = true;
      this.el.object3D.scale.set(1.08, 1.08, 1.08);
      this.el.object3D.position.z = 0.028;
      this.setHoverRingVisible(true);
      this.drawButton();
    },

    onHoverEnd: function () {
      if (!this._hovered) return;
      this._hovered = false;
      this.el.object3D.scale.set(1, 1, 1);
      this.el.object3D.position.z = 0;
      this.setHoverRingVisible(false);
      this.drawButton();
    },

    setHoverRingVisible: function (visible) {
      if (!this.hoverRing) return;
      this.hoverRing.visible = visible;
    },

    ensureHoverRing: function () {
      if (this.hoverRing) {
        var w = this.data.width * 1.12;
        var h = this.data.height * 1.18;
        this.hoverRing.geometry.dispose();
        this.hoverRing.geometry = new THREE.PlaneGeometry(w, h);
        return;
      }
      var w = this.data.width * 1.12;
      var h = this.data.height * 1.18;
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 2;
      canvas.width = Math.round(320 * scale);
      canvas.height = Math.round(120 * scale);
      context.scale(scale, scale);
      context.strokeStyle = "rgba(255, 224, 161, 0.95)";
      context.lineWidth = 5;
      this.roundRect(context, 4, 4, 312, 112, 16);
      context.stroke();
      context.strokeStyle = "rgba(255, 189, 66, 0.35)";
      context.lineWidth = 10;
      this.roundRect(context, 4, 4, 312, 112, 16);
      context.stroke();
      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      var geometry = new THREE.PlaneGeometry(w, h);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.hoverRing = new THREE.Mesh(geometry, material);
      this.hoverRing.position.z = -0.006;
      this.hoverRing.visible = false;
      this.hoverRing.renderOrder = 10;
      this.el.object3D.add(this.hoverRing);
    },

    onActivate: function () {
      var href = (this.data.href || "").trim();
      if (!href) return;
      var now = performance.now();
      if (this._lastActivate && now - this._lastActivate < 320) return;
      this._lastActivate = now;
      if (global.IronFlowerStory && global.IronFlowerStory.prefersVrSession) {
        var url = new URL(href, window.location.href);
        if (global.IronFlowerStory.prefersVrSession()) {
          url.searchParams.set("vr", "1");
        }
        window.location.href = url.pathname + url.search;
        return;
      }
      window.location.href = href;
    },

    disposeMesh: function () {
      this.disposeButtonArt();
      if (this.hoverRing) {
        this.el.object3D.remove(this.hoverRing);
        this.hoverRing.geometry.dispose();
        if (this.hoverRing.material.map) this.hoverRing.material.map.dispose();
        this.hoverRing.material.dispose();
        this.hoverRing = null;
      }
    },

    disposeButtonArt: function () {
      if (this.mesh) {
        this.el.object3D.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (this.mesh.material.map) this.mesh.material.map.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
      }
      if (this.hitMesh) {
        this.el.object3D.remove(this.hitMesh);
        this.hitMesh.geometry.dispose();
        this.hitMesh.material.dispose();
        this.hitMesh = null;
      }
    },

    drawButton: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      var variant = this.data.variant || "default";
      var hovered = !!this._hovered;
      var canvasW = variant === "story" ? 1200 : 1140;
      var canvasH = variant === "story" ? 248 : variant === "level" ? 212 : 180;
      canvas.width = Math.round(canvasW * scale);
      canvas.height = Math.round(canvasH * scale);

      context.scale(scale, scale);

      var bg = this.data.background;
      var border = this.data.border;
      if (hovered) {
        bg = bg.replace(/[\d.]+\)$/, function (match) {
          var alpha = parseFloat(match.slice(0, -1));
          return Math.min(1, alpha + 0.18).toFixed(2) + ")";
        });
        border = "rgba(255, 224, 161, 0.98)";
      }

      context.fillStyle = bg;
      context.strokeStyle = border;
      context.lineWidth = hovered ? 4 : 3;
      this.roundRect(context, 8, 8, canvasW - 16, canvasH - 16, 14);
      context.fill();
      context.stroke();

      if (variant === "story") {
        this.drawStoryButton(context, canvasW, canvasH, hovered);
      } else if (variant === "level") {
        this.drawLevelButton(context, canvasW, canvasH, hovered);
      } else {
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = this.data.color;
        context.font = "800 42px Arial, PingFang SC, Microsoft YaHei, sans-serif";
        context.fillText(this.data.label || "", canvasW / 2, this.data.sublabel || this.data.labelEn ? 52 : 90, canvasW - 100);

        if (this.data.labelEn) {
          context.fillStyle = "rgba(216, 238, 248, 0.82)";
          context.font = "600 20px Arial, sans-serif";
          context.fillText(this.data.labelEn, canvasW / 2, 88, canvasW - 100);
        }

        if (this.data.sublabel) {
          context.fillStyle = "rgba(255, 232, 176, 0.88)";
          context.font = "400 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
          context.fillText(this.data.sublabel, canvasW / 2, this.data.labelEn ? 124 : 118, canvasW - 100);
        }
      }

      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.disposeButtonArt();

      var geometry = new THREE.PlaneGeometry(this.data.width, this.data.height);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.renderOrder = 12;
      this.el.object3D.add(this.mesh);

      var hitGeometry = new THREE.PlaneGeometry(this.data.width * 1.4, this.data.height * 1.44);
      var hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.001,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      this.hitMesh.position.z = 0.012;
      this.hitMesh.renderOrder = 14;
      this.hitMesh.userData.clickableEl = this.el;
      this.el.object3D.add(this.hitMesh);
      this.ensureHoverRing();
      if (this._hovered) {
        this.setHoverRingVisible(true);
        this.el.object3D.position.z = 0.028;
      }
    },

    drawStoryButton: function (context, canvasW, canvasH, hovered) {
      var textX = 34;
      var textMax = canvasW - 118;
      var titleY = 52;

      context.textAlign = "left";
      context.textBaseline = "middle";
      context.fillStyle = "#fff8ce";
      context.font = "800 36px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(this.data.label || "", textX, titleY, textMax);

      if (this.data.labelEn) {
        context.fillStyle = "#ffd37a";
        context.font = "700 22px Arial, sans-serif";
        context.fillText(this.data.labelEn, textX, titleY + 30, textMax);
      }

      var subY = this.data.labelEn ? 118 : 92;
      if (this.data.sublabel) {
        context.fillStyle = "rgba(255, 232, 176, 0.88)";
        context.font = "400 21px Arial, PingFang SC, Microsoft YaHei, sans-serif";
        this.wrapButtonText(context, this.data.sublabel, textX, subY, textMax, 26, 2);
      }

      if (this.data.sublabelEn) {
        context.fillStyle = "rgba(255, 224, 161, 0.72)";
        context.font = "400 18px Arial, sans-serif";
        var enY = subY + (this.data.sublabel ? 56 : 0);
        this.wrapButtonText(context, this.data.sublabelEn, textX, enY, textMax, 22, 2);
      }

      var arrowX = canvasW - 58;
      var arrowY = canvasH / 2;
      context.beginPath();
      context.arc(arrowX, arrowY, 22, 0, Math.PI * 2);
      context.fillStyle = hovered ? "rgba(255, 189, 66, 0.22)" : "rgba(255, 189, 66, 0.08)";
      context.fill();
      context.strokeStyle = hovered ? "rgba(255, 224, 161, 0.82)" : "rgba(255, 224, 161, 0.42)";
      context.lineWidth = 2;
      context.stroke();
      context.fillStyle = "#ffe0a1";
      context.font = "700 30px Arial, sans-serif";
      context.textAlign = "center";
      context.fillText("›", arrowX + 1, arrowY + 1);
    },

    drawLevelButton: function (context, canvasW, canvasH, hovered) {
      var index = String(this.data.index || "1");
      var circleX = 42;
      var circleY = canvasH / 2;

      context.beginPath();
      context.arc(circleX, circleY, 24, 0, Math.PI * 2);
      context.fillStyle = hovered ? "rgba(255, 189, 66, 0.28)" : "rgba(6, 4, 3, 0.72)";
      context.fill();
      context.strokeStyle = hovered ? "rgba(255, 224, 161, 0.95)" : "rgba(72, 214, 210, 0.54)";
      context.lineWidth = hovered ? 3 : 2;
      context.stroke();
      context.fillStyle = hovered ? "#ffe8a8" : "#48d6d2";
      context.font = "900 28px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(index, circleX, circleY + 1);

      var textX = 88;
      var textMax = canvasW - 108;
      context.textAlign = "left";
      context.fillStyle = "#fff8ce";
      context.font = "800 30px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(this.data.label || "", textX, circleY - 28, textMax);

      if (this.data.labelEn) {
        context.fillStyle = "#ffd37a";
        context.font = "600 17px Arial, sans-serif";
        context.fillText(this.data.labelEn, textX, circleY - 4, textMax);
      }

      if (this.data.sublabel) {
        context.fillStyle = "rgba(255, 232, 176, 0.86)";
        context.font = "400 19px Arial, PingFang SC, Microsoft YaHei, sans-serif";
        context.fillText(this.data.sublabel, textX, circleY + 24, textMax);
      }

      if (this.data.sublabelEn) {
        context.fillStyle = "rgba(255, 224, 161, 0.72)";
        context.font = "400 16px Arial, sans-serif";
        context.fillText(this.data.sublabelEn, textX, circleY + 48, textMax);
      }
    },

    wrapButtonText: function (context, text, x, y, maxWidth, lineHeight, maxLines) {
      var tokens = text.match(/[\u4e00-\u9fff]|[^\s\u4e00-\u9fff]+/g) || [text];
      var lines = [];
      var line = "";

      tokens.forEach(function (token) {
        var separator = /[\u4e00-\u9fff]/.test(token) ? "" : " ";
        var testLine = line ? line + separator + token : token;
        if (context.measureText(testLine).width > maxWidth && line) {
          lines.push(line);
          line = token;
        } else {
          line = testLine;
        }
      });
      if (line) lines.push(line);

      lines.slice(0, maxLines).forEach(function (lineText, index) {
        context.fillText(lineText, x, y + index * lineHeight, maxWidth);
      });
    },

    roundRect: function (context, x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    },
  });

  AFRAME.registerComponent("canvas-home-brand", {
    schema: {
      width: { default: 1.55 },
      height: { default: 1.85 },
    },

    init: function () {
      this.drawBrand();
    },

    update: function () {
      this.drawBrand();
    },

    remove: function () {
      this.disposeMesh();
    },

    disposeMesh: function () {
      if (!this.mesh) return;
      this.el.object3D.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    },

    drawBrand: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      canvas.width = Math.round(640 * scale);
      canvas.height = Math.round(760 * scale);
      context.scale(scale, scale);

      context.textAlign = "left";
      context.textBaseline = "top";
      context.fillStyle = "#ffbd42";
      context.font = "600 22px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("Tongguan Kiln Iron Flower VR Game", 0, 0, 620);

      context.save();
      context.fillStyle = "#fff2a8";
      context.font = "950 92px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.transform(1, 0, -0.14, 1, 0, 0);
      context.fillText("IRON SOUL", 0, 52, 620);
      context.restore();

      context.fillStyle = "#ffe8b0";
      context.font = "500 26px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("铜官窑 · 打铁花", 0, 176, 620);
      context.fillText("Tongguan Kiln · Iron Flower", 0, 212, 620);

      context.fillStyle = "#cfeef2";
      context.font = "400 18px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("设计前沿专题研究-组2", 0, 640, 620);
      context.fillText("Design Frontiers Research - Group 2", 0, 666, 620);
      context.fillStyle = "rgba(207, 238, 242, 0.88)";
      context.font = "400 17px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("郑瑞啸、文欣橦、张婷婷、万钰、林铮翔", 0, 700, 620);

      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.disposeMesh();
      var geometry = new THREE.PlaneGeometry(this.data.width, this.data.height);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.el.object3D.add(this.mesh);
    },
  });

  AFRAME.registerComponent("canvas-mode-panel", {
    schema: {
      width: { default: 1.72 },
      height: { default: 1.92 },
    },

    init: function () {
      this.drawPanel();
    },

    update: function () {
      this.drawPanel();
    },

    remove: function () {
      this.disposeMesh();
    },

    disposeMesh: function () {
      if (!this.mesh) return;
      this.el.object3D.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    },

    drawPanel: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      canvas.width = Math.round(860 * scale);
      canvas.height = Math.round(880 * scale);
      context.scale(scale, scale);

      context.fillStyle = "rgba(16, 9, 5, 0.72)";
      context.strokeStyle = "rgba(255, 189, 66, 0.34)";
      context.lineWidth = 3;
      this.roundRect(context, 0, 0, 860, 880, 18);
      context.fill();
      context.stroke();

      context.textAlign = "left";
      context.fillStyle = "#fff8ce";
      context.font = "700 32px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("选择体验模式", 28, 30);
      context.fillStyle = "#ffd37a";
      context.font = "600 20px Arial, sans-serif";
      context.fillText("Choose Experience", 28, 62);

      context.fillStyle = "#fff8ce";
      context.font = "700 32px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText("关卡模式", 28, 318);
      context.fillStyle = "#ffd37a";
      context.font = "600 20px Arial, sans-serif";
      context.fillText("Level Mode", 28, 350);

      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.disposeMesh();
      var geometry = new THREE.PlaneGeometry(this.data.width, this.data.height);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.renderOrder = 11;
      this.el.object3D.add(this.mesh);
    },

    roundRect: function (context, x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    },
  });

  AFRAME.registerComponent("story-texture-panel", {
    schema: {
      src: { type: "string", default: "" },
      width: { type: "number", default: 3.6 },
      fadeIn: { type: "boolean", default: true },
    },

    init: function () {
      this._texture = null;
      this._loadToken = 0;
      this._fadeFallback = null;
      this.refreshPanel = this.refreshPanel.bind(this);
      if (this.el.components.material) {
        this.el.removeAttribute("material");
      }
      this.el.addEventListener("loaded", this.refreshPanel);
      this.refreshPanel();
    },

    update: function (oldData) {
      if (!oldData) return;
      if (oldData.src === this.data.src && oldData.width === this.data.width) return;
      this.refreshPanel();
    },

    remove: function () {
      this.clearFadeFallback();
      if (this._texture) this._texture.dispose();
    },

    clearFadeFallback: function () {
      if (this._fadeFallback) {
        window.clearTimeout(this._fadeFallback);
        this._fadeFallback = null;
      }
    },

    isVrStoryView: function () {
      return document.body.classList.contains("vr-active");
    },

    initGpuTexture: function (texture) {
      var renderer = this.el.sceneEl && this.el.sceneEl.renderer;
      if (renderer && typeof renderer.initTexture === "function") {
        renderer.initTexture(texture);
      }
    },

    setPanelOpacity: function (opacity) {
      var mesh = this.el.getObject3D("mesh");
      if (!mesh || !mesh.material) return;
      mesh.material.transparent = opacity < 1;
      mesh.material.opacity = opacity;
      mesh.material.visible = opacity > 0.001;
      mesh.material.needsUpdate = true;
      mesh.visible = true;
    },

    resizePanelGeometry: function (mesh, panelWidth, panelHeight) {
      if (!mesh) return;
      if (mesh.geometry) mesh.geometry.dispose();
      mesh.geometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
    },

    commitPanelMaterial: function (mesh, texture, opacity) {
      if (!mesh) return;
      var oldMat = mesh.material;
      mesh.material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.FrontSide,
        transparent: opacity < 1,
        opacity: opacity,
        toneMapped: false,
      });
      mesh.material.needsUpdate = true;
      mesh.visible = true;
      if (oldMat) {
        if (oldMat.map && oldMat.map !== texture) {
          oldMat.map.dispose();
        }
        oldMat.dispose();
      }
      if (this.el.components.material) {
        this.el.removeAttribute("material");
      }
    },

    applyLoadedImage: function (image, url) {
      if (!image || !image.width) return false;
      this._loadToken += 1;
      var token = this._loadToken;

      var texture = new THREE.Texture(image);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      this._texture = texture;
      this.initGpuTexture(texture);

      this.applyTexture(texture, token);
      return true;
    },

    runPanelFadeIn: function (token) {
      var self = this;
      this.clearFadeFallback();
      var start = performance.now();
      function tick(now) {
        if (token !== self._loadToken) return;
        var t = Math.min(1, (now - start) / 520);
        var eased = 1 - Math.pow(1 - t, 3);
        self.setPanelOpacity(eased);
        if (t < 1) {
          requestAnimationFrame(tick);
        } else {
          self.setPanelOpacity(1);
          self.el.emit("story-panel-visible");
        }
      }
      requestAnimationFrame(tick);
      this._fadeFallback = window.setTimeout(function () {
        if (token !== self._loadToken) return;
        self.setPanelOpacity(1);
        self.el.emit("story-panel-visible");
      }, 720);
    },

    applyTexture: function (texture, token) {
      var self = this;
      if (token !== this._loadToken) return;

      var mesh = this.el.getObject3D("mesh");
      if (!mesh) {
        requestAnimationFrame(function () {
          self.applyTexture(texture, token);
        });
        return;
      }

      var image = texture.image;
      var aspect = image && image.width ? image.width / image.height : 16 / 9;
      var panelWidth = this.data.width;
      var panelHeight = panelWidth / aspect;
      this.resizePanelGeometry(mesh, panelWidth, panelHeight);
      this.el.emit("story-panel-sized", {
        width: panelWidth,
        height: panelHeight,
        aspect: aspect,
      });

      var useFade = !!this.data.fadeIn && !this.isVrStoryView();
      var startOpacity = useFade ? 0 : 1;
      this.commitPanelMaterial(mesh, texture, startOpacity);
      this.initGpuTexture(texture);

      if (useFade) {
        this.runPanelFadeIn(token);
      } else {
        this.setPanelOpacity(1);
        this.el.emit("story-panel-visible");
      }

      this.el.emit("story-panel-loaded", {
        width: panelWidth,
        height: panelHeight,
      });
    },

    refreshPanel: function () {
      var self = this;
      var url = (this.data.src || "").trim();
      if (!url) return;

      var mesh = this.el.getObject3D("mesh");
      if (!mesh) {
        requestAnimationFrame(this.refreshPanel);
        return;
      }

      this._loadToken += 1;
      var token = this._loadToken;

      if (this._texture) {
        this._texture.dispose();
        this._texture = null;
      }

      var loader = new THREE.TextureLoader();
      loader.load(
        url,
        function (texture) {
          if (token !== self._loadToken) {
            texture.dispose();
            return;
          }
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;
          self._texture = texture;
          self.initGpuTexture(texture);
          self.applyTexture(texture, token);
        },
        undefined,
        function (error) {
          if (token !== self._loadToken) return;
          console.warn("[story-texture-panel] load failed:", url, error);
          self.setPanelOpacity(1);
        }
      );
    },
  });

  AFRAME.registerComponent("story-continue-btn", {
    schema: {
      next: { type: "string", default: "" },
      label: { type: "string", default: "继续" },
    },

    init: function () {
      var self = this;
      this.onActivate = function () {
        if (!self._next) return;
        if (typeof global.__storyContinueHandler === "function") {
          global.__storyContinueHandler(self._next);
          return;
        }
        if (global.IronFlowerStory) {
          global.IronFlowerStory.navigateNext(self._next);
        }
      };
      this.el.classList.add("clickable");
      this.el.addEventListener("click", this.onActivate);
      this.drawButton();
    },

    update: function () {
      this._next = this.data.next;
      this.drawButton();
    },

    remove: function () {
      this.el.removeEventListener("click", this.onActivate);
      this.disposeMesh();
    },

    disposeMesh: function () {
      if (this.mesh) {
        this.el.object3D.remove(this.mesh);
        this.mesh.geometry.dispose();
        if (this.mesh.material.map) this.mesh.material.map.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
      }
      if (this.hitMesh) {
        this.el.object3D.remove(this.hitMesh);
        this.hitMesh.geometry.dispose();
        this.hitMesh.material.dispose();
        this.hitMesh = null;
      }
    },

    drawButton: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      canvas.width = Math.round(620 * scale);
      canvas.height = Math.round(150 * scale);

      context.scale(scale, scale);
      context.fillStyle = "rgba(42, 24, 8, 0.94)";
      context.strokeStyle = "rgba(255, 189, 66, 0.88)";
      context.lineWidth = 3;
      this.roundRect(context, 8, 8, 604, 134, 18);
      context.fill();
      context.stroke();

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#fff8ce";
      context.font = "800 44px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(this.data.label || "继续", 310, 75, 560);

      var texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;

      this.disposeMesh();

      var geometry = new THREE.PlaneGeometry(1.55, 0.38);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        toneMapped: false,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.el.object3D.add(this.mesh);

      if (this.hitMesh) {
        this.el.object3D.remove(this.hitMesh);
        this.hitMesh.geometry.dispose();
        this.hitMesh.material.dispose();
      }
      var hitGeometry = new THREE.PlaneGeometry(1.72, 0.48);
      var hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.01,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      this.hitMesh.position.z = 0.004;
      this.el.object3D.add(this.hitMesh);
    },

    roundRect: function (context, x, y, width, height, radius) {
      context.beginPath();
      context.moveTo(x + radius, y);
      context.lineTo(x + width - radius, y);
      context.quadraticCurveTo(x + width, y, x + width, y + radius);
      context.lineTo(x + width, y + height - radius);
      context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
      context.lineTo(x + radius, y + height);
      context.quadraticCurveTo(x, y + height, x, y + height - radius);
      context.lineTo(x, y + radius);
      context.quadraticCurveTo(x, y, x + radius, y);
      context.closePath();
    },
  });

  AFRAME.registerComponent("story-tap-zone", {
    init: function () {
      this.onTap = this.onTap.bind(this);
      this.onPanelSized = this.onPanelSized.bind(this);
      this.el.classList.add("clickable");
      this.el.addEventListener("click", this.onTap);
      this.el.addEventListener("story-panel-sized", this.onPanelSized);
      this.ensureHitMesh(3.05, 1.72);
    },

    remove: function () {
      this.el.removeEventListener("click", this.onTap);
      this.el.removeEventListener("story-panel-sized", this.onPanelSized);
      this.disposeHitMesh();
    },

    onPanelSized: function (event) {
      var detail = event && event.detail ? event.detail : {};
      this.ensureHitMesh(detail.width || 3.05, detail.height || 1.72);
    },

    disposeHitMesh: function () {
      if (!this.hitMesh) return;
      this.el.object3D.remove(this.hitMesh);
      this.hitMesh.geometry.dispose();
      this.hitMesh.material.dispose();
      this.hitMesh = null;
    },

    ensureHitMesh: function (width, height) {
      this.disposeHitMesh();
      var hitGeometry = new THREE.PlaneGeometry(width * 1.04, height * 1.04);
      var hitMaterial = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0.01,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false,
      });
      this.hitMesh = new THREE.Mesh(hitGeometry, hitMaterial);
      this.hitMesh.position.z = 0.006;
      this.hitMesh.renderOrder = 4;
      this.el.object3D.add(this.hitMesh);
    },

    onTap: function () {
      if (typeof global.__storyContinueHandler === "function") {
        global.__storyContinueHandler();
      }
    },
  });

  AFRAME.registerComponent("story-vr-advance", {
    schema: {
      debounceMs: { default: 320 },
    },

    init: function () {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.lastAt = 0;
      this.handEvents = [
        "triggerdown",
        "abuttondown",
        "bbuttondown",
        "xbuttondown",
        "ybuttondown",
        "selectstart",
        "squeeze",
      ];
      this.onAdvance = this.onAdvance.bind(this);
      this.onCanvasAdvance = this.onCanvasAdvance.bind(this);
      this.onEnterVr = this.onEnterVr.bind(this);
      this.onHandSelect = this.onHandSelect.bind(this);
      this.bindHands = this.bindHands.bind(this);
      this.bindSession = this.bindSession.bind(this);
      this.bindCanvas = this.bindCanvas.bind(this);

      this.el.addEventListener("enter-vr", this.onEnterVr);
      if (this.el.is("vr-mode")) this.onEnterVr();
      if (this.el.canvas) {
        this.bindCanvas();
      } else {
        this.el.addEventListener("render-target-loaded", this.bindCanvas);
      }
    },

    bindCanvas: function () {
      if (this._canvasBound || !this.el.canvas) return;
      this._canvasBound = true;
      this.el.canvas.addEventListener("click", this.onCanvasAdvance);
    },

    onCanvasAdvance: function (event) {
      if (!this.el.is("vr-mode")) return;
      if (event && event.target && event.target.closest && event.target.closest(".a-enter-vr-button")) return;
      this.triggerAdvance(this.raycastFromCamera());
    },

    onEnterVr: function () {
      var self = this;
      this.bindHands();
      this.bindSession();
      window.setTimeout(function () {
        self.bindHands();
        self.bindSession();
        self.refreshRaycasters();
        var storyFrame = document.querySelector("#storyFrame");
        if (storyFrame && storyFrame.components && storyFrame.components["vr-panel-face-user"]) {
          storyFrame.components["vr-panel-face-user"].syncPanel();
        }
      }, 240);
    },

    refreshRaycasters: function () {
      ["#leftHand", "#rightHand", "#storyCursor"].forEach(function (selector) {
        var el = document.querySelector(selector);
        if (!el || !el.components || !el.components.raycaster) return;
        if (typeof el.components.raycaster.refreshObjects === "function") {
          el.components.raycaster.refreshObjects();
        }
      });
    },

    bindHands: function () {
      var self = this;
      var hands = [
        this.el.querySelector("#leftHand") || document.querySelector("#leftHand"),
        this.el.querySelector("#rightHand") || document.querySelector("#rightHand"),
      ];

      hands.forEach(function (hand) {
        if (!hand || hand.__storyVrAdvanceBound) return;
        hand.__storyVrAdvanceBound = true;
        self.handEvents.forEach(function (eventName) {
          hand.addEventListener(eventName, function () {
            self.onHandSelect(hand);
          });
        });
      });
    },

    bindSession: function () {
      var self = this;
      var renderer = this.el.renderer;
      var xr = renderer && renderer.xr;
      var session = xr && xr.getSession ? xr.getSession() : null;
      if (!session || session.__storyVrAdvanceBound) return;

      session.__storyVrAdvanceBound = true;
      session.addEventListener("select", function () {
        var rightHand = document.querySelector("#rightHand");
        var leftHand = document.querySelector("#leftHand");
        if (rightHand) self.onHandSelect(rightHand);
        else if (leftHand) self.onHandSelect(leftHand);
        else self.onAdvance();
      });
    },

    getThreeCamera: function () {
      var cameraEl = this.el.camera || document.querySelector("[camera]");
      if (!cameraEl) return null;
      if (cameraEl.components && cameraEl.components.camera && cameraEl.components.camera.camera) {
        return cameraEl.components.camera.camera;
      }
      return cameraEl.getObject3D("camera") || cameraEl.object3D;
    },

    collectStoryMeshes: function () {
      var meshes = [];
      var storyFrame = document.querySelector("#storyFrame");
      if (!storyFrame || storyFrame.getAttribute("visible") === "false") return meshes;
      storyFrame.querySelectorAll(".clickable").forEach(function (el) {
        if (el.getAttribute("visible") === "false") return;
        el.object3D.updateMatrixWorld(true);
        el.object3D.traverse(function (node) {
          if (node.isMesh && node.geometry) meshes.push(node);
        });
      });
      return meshes;
    },

    findClickableElement: function (object3D) {
      var current = object3D;
      while (current) {
        if (current.el && current.el.classList && current.el.classList.contains("clickable")) {
          return current.el;
        }
        current = current.parent;
      }
      return null;
    },

    raycastFromHand: function (hand) {
      var self = this;
      return raycastHandTarget(hand, this.raycaster, function () {
        return self.collectStoryMeshes();
      }, 12);
    },

    raycastFromCamera: function () {
      var threeCamera = this.getThreeCamera();
      if (!threeCamera) return null;
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), threeCamera);
      this.raycaster.far = 12;
      var meshes = this.collectStoryMeshes();
      if (!meshes.length) return null;
      var hits = this.raycaster.intersectObjects(meshes, false);
      if (!hits.length) return null;
      return this.findClickableElement(hits[0].object);
    },

    tryRaycastClick: function (target) {
      if (!target) return false;
      target.emit("click");
      return true;
    },

    canAdvance: function () {
      if (!this.el.is("vr-mode")) return false;
      if (!document.body.classList.contains("is-ready")) return false;
      if (document.body.classList.contains("is-leaving")) return false;
      var now = performance.now();
      if (now - this.lastAt < this.data.debounceMs) return false;
      this.lastAt = now;
      return true;
    },

    onHandSelect: function (hand) {
      this.triggerAdvance(this.raycastFromHand(hand));
    },

    triggerAdvance: function (target) {
      if (!this.canAdvance()) return;
      if (this.tryRaycastClick(target)) return;
      if (typeof global.__storyContinueHandler === "function") {
        global.__storyContinueHandler();
      }
    },

    onAdvance: function () {
      this.triggerAdvance(null);
    },
  });

  AFRAME.registerComponent("home-vr-menu", {
    schema: {
      debounceMs: { default: 280 },
    },

    init: function () {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.lastAt = 0;
      this._hoverTarget = null;
      this._hoverHand = null;
      this.handEvents = [
        "triggerdown",
        "triggerup",
        "abuttondown",
        "bbuttondown",
        "xbuttondown",
        "ybuttondown",
        "selectstart",
        "selectend",
        "squeeze",
        "squeezestart",
      ];
      this.onHandSelect = this.onHandSelect.bind(this);
      this.onMouseSelect = this.onMouseSelect.bind(this);
      this.onEnterVr = this.onEnterVr.bind(this);
      this.onExitVr = this.onExitVr.bind(this);
      this.bindCanvas = this.bindCanvas.bind(this);
      this.bindHands = this.bindHands.bind(this);
      this.bindHandRaycasters = this.bindHandRaycasters.bind(this);
      this.bindSession = this.bindSession.bind(this);
      this.onHandIntersection = this.onHandIntersection.bind(this);
      this.onHandIntersectionCleared = this.onHandIntersectionCleared.bind(this);
      this.onSessionSelect = this.onSessionSelect.bind(this);

      this.el.addEventListener("enter-vr", this.onEnterVr);
      this.el.addEventListener("exit-vr", this.onExitVr);
      if (this.el.is("vr-mode")) this.onEnterVr();
      if (this.el.canvas) this.bindCanvas();
      else this.el.addEventListener("render-target-loaded", this.bindCanvas);

      var self = this;
      document.addEventListener("keydown", function (event) {
        if (!self.el.is("vr-mode")) return;
        if (event.code === "Space" || event.code === "Enter") {
          event.preventDefault();
          self.onCenterSelect();
        }
      });
    },

    bindCanvas: function () {
      if (this._canvasBound || !this.el.canvas) return;
      this._canvasBound = true;
      this.el.canvas.addEventListener("click", this.onMouseSelect);
    },

    onEnterVr: function () {
      var self = this;
      this.showMenuFrame();
      this.bindHands();
      this.bindHandRaycasters();
      this.bindSession();
      requestAnimationFrame(function () {
        self.showMenuFrame();
        self.refreshRaycasters();
      });
      window.setTimeout(function () {
        self.showMenuFrame();
        self.bindHands();
        self.bindHandRaycasters();
        self.bindSession();
        self.refreshRaycasters();
      }, 240);
      window.setTimeout(function () {
        self.showMenuFrame();
        self.refreshRaycasters();
      }, 520);
    },

    showMenuFrame: function () {
      if (!this.el.is("vr-mode")) return;
      var menuFrame = document.querySelector("#menuFrame");
      if (!menuFrame) return;
      menuFrame.setAttribute("visible", true);
      menuFrame.object3D.visible = true;
      menuFrame.object3D.traverse(function (node) {
        node.visible = true;
      });
      if (menuFrame.components && menuFrame.components["vr-panel-face-user"]) {
        menuFrame.components["vr-panel-face-user"].syncPanel();
      }
    },

    onExitVr: function () {
      this.setHoverTarget(null, null);
      var menuFrame = document.querySelector("#menuFrame");
      if (menuFrame) {
        menuFrame.setAttribute("visible", false);
        menuFrame.object3D.visible = false;
      }
      this.updateHandHoverVisual(null, null);
    },

    tick: function () {
      if (!this.el.is("vr-mode")) return;
      var menuFrame = document.querySelector("#menuFrame");
      if (menuFrame && menuFrame.object3D.visible === false) {
        this.showMenuFrame();
      }
      var rightHand = document.querySelector("#rightHand");
      var leftHand = document.querySelector("#leftHand");
      var target = this.raycastFromHand(rightHand);
      var hand = target ? rightHand : null;
      if (!target) {
        target = this.raycastFromHand(leftHand);
        hand = target ? leftHand : null;
      }
      this.setHoverTarget(target, hand);
    },

    raycastFromHand: function (hand) {
      var self = this;
      return raycastHandTarget(hand, this.raycaster, function () {
        return self.collectMenuMeshes();
      }, 12);
    },

    setHoverTarget: function (next, hand) {
      if (next === this._hoverTarget && hand === this._hoverHand) return;
      if (this._hoverTarget) this._hoverTarget.emit("mouseleave");
      this._hoverTarget = next;
      this._hoverHand = hand;
      if (this._hoverTarget) {
        this._hoverTarget.emit("mouseenter");
        if (hand) this.pulseHandHaptic(hand, 0.18, 18);
      }
      this.updateHandHoverVisual(next, hand);
    },

    updateHandHoverVisual: function (target, activeHand) {
      var rightHand = document.querySelector("#rightHand");
      var leftHand = document.querySelector("#leftHand");
      var hovering = !!target;
      [rightHand, leftHand].forEach(function (handEl) {
        if (!handEl) return;
        var isActive = hovering && handEl === activeHand;
        handEl.setAttribute("line", {
          color: isActive ? "#ffe08a" : handEl.id === "rightHand" ? "#ffb13d" : "#2bd4ff",
          opacity: isActive ? 1 : hovering ? 0.42 : handEl.id === "rightHand" ? 0.85 : 0.55,
        });
        var cursor = handEl.querySelector(".home-hand-cursor");
        if (cursor) {
          cursor.setAttribute("visible", isActive);
          cursor.setAttribute("material", "color: #ffd37a; shader: flat; opacity: " + (isActive ? "1" : "0.55"));
          cursor.setAttribute("scale", isActive ? "1.35 1.35 1.35" : "1 1 1");
        }
      });
    },

    bindHandRaycasters: function () {
      var self = this;
      ["#leftHand", "#rightHand"].forEach(function (selector) {
        var hand = document.querySelector(selector);
        if (!hand || hand.__homeRayBound) return;
        hand.__homeRayBound = true;
        hand.addEventListener("raycaster-intersection", self.onHandIntersection);
        hand.addEventListener("raycaster-intersection-cleared", self.onHandIntersectionCleared);
      });
    },

    onHandIntersection: function (event) {
      if (!this.el.is("vr-mode")) return;
      var els = event.detail && event.detail.els;
      if (!els || !els.length) return;
      for (var i = 0; i < els.length; i++) {
        if (els[i].classList && els[i].classList.contains("clickable")) {
          this.setHoverTarget(els[i], event.target);
          return;
        }
      }
    },

    onHandIntersectionCleared: function (event) {
      if (!this.el.is("vr-mode")) return;
      if (this._hoverHand && event.target !== this._hoverHand) return;
      var rightHand = document.querySelector("#rightHand");
      var leftHand = document.querySelector("#leftHand");
      var target = this.raycastFromHand(rightHand);
      var hand = target ? rightHand : null;
      if (!target) {
        target = this.raycastFromHand(leftHand);
        hand = target ? leftHand : null;
      }
      this.setHoverTarget(target, hand);
    },

    refreshRaycasters: function () {
      var selectors = ["#leftHand", "#rightHand", "#menuCursor"];
      selectors.forEach(function (selector) {
        var el = document.querySelector(selector);
        if (!el || !el.components || !el.components.raycaster) return;
        var raycaster = el.components.raycaster;
        if (typeof raycaster.refreshObjects === "function") {
          raycaster.refreshObjects();
        }
      });
    },

    bindHands: function () {
      var self = this;
      ["#leftHand", "#rightHand"].forEach(function (selector) {
        var hand = document.querySelector(selector);
        if (!hand || hand.__homeMenuBound) return;
        hand.__homeMenuBound = true;
        self.handEvents.forEach(function (eventName) {
          hand.addEventListener(eventName, function () {
            self.onHandSelect(hand);
          });
        });
      });
    },

    bindSession: function () {
      var self = this;
      var renderer = this.el.renderer;
      var session = renderer && renderer.xr && renderer.xr.getSession && renderer.xr.getSession();
      if (!session || session.__homeMenuSessionBound) return;
      session.__homeMenuSessionBound = true;
      session.addEventListener("select", function (event) {
        self.onSessionSelect(event);
      });
    },

    onSessionSelect: function (event) {
      var hand = this.findHandFromInputEvent(event);
      if (hand) {
        this.onHandSelect(hand);
        return;
      }
      var rightHand = document.querySelector("#rightHand");
      var leftHand = document.querySelector("#leftHand");
      if (this._hoverTarget) {
        this.onHandSelect(this._hoverHand || rightHand || leftHand);
        return;
      }
      if (rightHand) this.onHandSelect(rightHand);
      else if (leftHand) this.onHandSelect(leftHand);
    },

    findHandFromInputEvent: function (event) {
      if (!event || !event.inputSource || !event.inputSource.handedness) return null;
      var handedness = event.inputSource.handedness;
      if (handedness === "right") return document.querySelector("#rightHand");
      if (handedness === "left") return document.querySelector("#leftHand");
      return null;
    },

    pulseHandHaptic: function (hand, strength, duration) {
      if (!hand || !hand.object3D) return;
      var session = this.el.renderer && this.el.renderer.xr && this.el.renderer.xr.getSession();
      if (!session || !session.inputSources) return;
      var handPos = new THREE.Vector3();
      hand.object3D.getWorldPosition(handPos);
      session.inputSources.forEach(function (source) {
        if (!source.gamepad || !source.gamepad.hapticActuators || !source.gamepad.hapticActuators.length) return;
        source.gamepad.hapticActuators[0].pulse(strength || 0.35, duration || 28);
      });
    },

    getThreeCamera: function () {
      var cameraEl = this.el.camera || document.querySelector("[camera]");
      if (!cameraEl) return null;
      if (cameraEl.components && cameraEl.components.camera && cameraEl.components.camera.camera) {
        return cameraEl.components.camera.camera;
      }
      return cameraEl.getObject3D("camera") || cameraEl.object3D;
    },

    canSelect: function () {
      if (!this.el.is("vr-mode")) return false;
      var menuFrame = document.querySelector("#menuFrame");
      if (!menuFrame || menuFrame.object3D.visible === false) return false;
      var now = performance.now();
      if (now - this.lastAt < this.data.debounceMs) return false;
      this.lastAt = now;
      return true;
    },

    onMouseSelect: function (event) {
      if (!this.canSelect()) return;
      var threeCamera = this.getThreeCamera();
      if (!threeCamera || !this.el.canvas) return;
      var rect = this.el.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, threeCamera);
      this.raycaster.far = 14;
      this.activateHit();
    },

    onCenterSelect: function () {
      if (!this.canSelect()) return;
      var threeCamera = this.getThreeCamera();
      if (!threeCamera) return;
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), threeCamera);
      this.raycaster.far = 14;
      this.activateHit();
    },

    onHandSelect: function (hand) {
      if (!this.canSelect() || !hand) return;
      var target = this.raycastFromHand(hand);
      if (!target && this._hoverTarget && this._hoverHand === hand) {
        target = this._hoverTarget;
      }
      if (!target && this._hoverTarget) {
        target = this._hoverTarget;
      }
      if (target) {
        this.pulseHandHaptic(hand, 0.55, 42);
        target.emit("click");
        return;
      }
      hand.object3D.updateMatrixWorld(true);
      var origin = new THREE.Vector3();
      var direction = new THREE.Vector3(0, 0, -1);
      hand.object3D.getWorldPosition(origin);
      direction.applyQuaternion(hand.object3D.getWorldQuaternion(new THREE.Quaternion()));
      this.raycaster.set(origin, direction.normalize());
      this.raycaster.far = 14;
      this.activateHit();
    },

    collectMenuMeshes: function () {
      var meshes = [];
      var menuFrame = document.querySelector("#menuFrame");
      if (!menuFrame || menuFrame.object3D.visible === false) return meshes;
      menuFrame.querySelectorAll(".clickable").forEach(function (el) {
        if (el.getAttribute("visible") === "false") return;
        var buttonComp = el.components && el.components["canvas-button"];
        if (buttonComp && buttonComp.hitMesh) {
          buttonComp.hitMesh.updateMatrixWorld(true);
          meshes.push(buttonComp.hitMesh);
          return;
        }
        el.object3D.updateMatrixWorld(true);
        el.object3D.traverse(function (node) {
          if (node.isMesh && node.geometry) meshes.push(node);
        });
      });
      return meshes;
    },

    activateHit: function () {
      var meshes = this.collectMenuMeshes();
      if (!meshes.length) return;
      var hits = this.raycaster.intersectObjects(meshes, false);
      if (!hits.length) return;
      var target = this.findClickableElement(hits[0].object);
      if (target) {
        this.pulseHandHaptic(this._hoverHand, 0.55, 42);
        target.emit("click");
      }
    },

    findClickableElement: function (object3D) {
      return findClickableFromObject(object3D);
    },
  });

  AFRAME.registerComponent("vr-ui-interaction", {
    schema: {
      preferGaze: { default: false },
      refreshRaycastersOnEnter: { default: false },
    },

    init: function () {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.lastSelect = 0;
      this.handEvents = [
        "triggerdown",
        "gripdown",
        "abuttondown",
        "bbuttondown",
        "xbuttondown",
        "ybuttondown",
        "selectstart",
      ];
      this.bindInput = this.bindInput.bind(this);
      this.bindHandControls = this.bindHandControls.bind(this);
      this.bindXrSelect = this.bindXrSelect.bind(this);
      this.onEnterVr = this.onEnterVr.bind(this);

      if (this.el.canvas) {
        this.bindInput();
      } else {
        this.el.addEventListener("render-target-loaded", this.bindInput);
      }
    },

    bindInput: function () {
      var canvas = this.el.canvas;
      var self = this;

      canvas.addEventListener("click", this.selectFromMouse.bind(this));
      canvas.addEventListener("pointerdown", this.selectFromMouse.bind(this));

      document.addEventListener("keydown", function (event) {
        if (event.code === "Space" || event.code === "Enter") {
          self.selectFromCenter();
        }
      });

      this.bindHandControls();
      this.el.addEventListener("enter-vr", this.onEnterVr);
      if (this.el.is("vr-mode")) this.onEnterVr();
    },

    onEnterVr: function () {
      var self = this;
      this.bindHandControls();
      this.bindXrSelect();
      if (!this.data.refreshRaycastersOnEnter) return;
      requestAnimationFrame(function () {
        self.refreshHandRaycasters();
      });
      window.setTimeout(function () {
        self.bindHandControls();
        self.bindXrSelect();
        self.refreshHandRaycasters();
      }, 180);
    },

    refreshHandRaycasters: function () {
      var hands = [
        this.el.querySelector("#leftHand") || document.querySelector("#leftHand"),
        this.el.querySelector("#rightHand") || document.querySelector("#rightHand"),
        this.el.querySelector("#menuCursor") || document.querySelector("#menuCursor"),
      ];
      hands.forEach(function (hand) {
        if (!hand || !hand.components || !hand.components.raycaster) return;
        var raycaster = hand.components.raycaster;
        if (typeof raycaster.refreshObjects === "function") {
          raycaster.refreshObjects();
        }
      });
    },

    handUsesLaserRaycaster: function (hand) {
      if (!hand || !hand.components) return false;
      var raycaster = hand.components.raycaster;
      return !!(raycaster && raycaster.data.enabled);
    },

    bindHandControls: function () {
      var self = this;
      var hands = [
        this.el.querySelector("#leftHand") || document.querySelector("#leftHand"),
        this.el.querySelector("#rightHand") || document.querySelector("#rightHand"),
      ];

      hands.forEach(function (hand) {
        if (!hand || hand.__vrUiBound) return;
        if (self.handUsesLaserRaycaster(hand)) return;
        hand.__vrUiBound = true;
        self.handEvents.forEach(function (eventName) {
          hand.addEventListener(eventName, function () {
            self.selectFromHand(hand, true);
          });
        });
      });
    },

    handsUseLaserRaycaster: function () {
      var self = this;
      return [
        this.el.querySelector("#leftHand") || document.querySelector("#leftHand"),
        this.el.querySelector("#rightHand") || document.querySelector("#rightHand"),
      ].some(function (hand) {
        return self.handUsesLaserRaycaster(hand);
      });
    },

    bindXrSelect: function () {
      var self = this;
      var renderer = this.el.renderer;
      var xr = renderer && renderer.xr;
      var session = xr && xr.getSession ? xr.getSession() : null;
      if (!session || session.__vrUiSelectBound) return;

      session.__vrUiSelectBound = true;
      session.addEventListener("select", function () {
        if (self.handsUseLaserRaycaster()) return;
        var rightHand = self.el.querySelector("#rightHand") || document.querySelector("#rightHand");
        var leftHand = self.el.querySelector("#leftHand") || document.querySelector("#leftHand");
        if (!self.data.preferGaze && rightHand) {
          self.selectFromHand(rightHand, true);
          return;
        }
        if (!self.data.preferGaze && leftHand) {
          self.selectFromHand(leftHand, true);
          return;
        }
        self.selectFromCenter();
      });
    },

    getActiveCamera: function () {
      return this.el.camera || this.el.querySelector("[camera]");
    },

    getThreeCamera: function () {
      var cameraEl = this.getActiveCamera();
      if (!cameraEl) return null;
      if (cameraEl.components && cameraEl.components.camera && cameraEl.components.camera.camera) {
        return cameraEl.components.camera.camera;
      }
      return cameraEl.getObject3D("camera") || cameraEl.object3D;
    },

    selectFromMouse: function (event) {
      if (!this.canSelect()) return;
      var threeCamera = this.getThreeCamera();
      if (!threeCamera) return;
      var rect = this.el.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, threeCamera);
      this.activateFirstHit();
    },

    selectFromCenter: function () {
      if (!this.canSelect()) return;
      var threeCamera = this.getThreeCamera();
      if (!threeCamera) return;
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), threeCamera);
      this.activateFirstHit();
    },

    selectFromHand: function (hand, forceRay) {
      if (!this.canSelect()) return;
      if (this.data.preferGaze || !hand) {
        this.selectFromCenter();
        return;
      }
      if (!forceRay && this.handUsesLaserRaycaster(hand)) return;

      var origin = new THREE.Vector3();
      var direction = new THREE.Vector3(0, 0, -1);
      hand.object3D.getWorldPosition(origin);
      direction.applyQuaternion(hand.object3D.getWorldQuaternion(new THREE.Quaternion()));
      this.raycaster.set(origin, direction.normalize());
      this.activateFirstHit();
    },

    canSelect: function () {
      var now = performance.now();
      if (now - this.lastSelect < 220) return false;
      this.lastSelect = now;
      return true;
    },

    collectClickableMeshes: function () {
      var meshes = [];
      var self = this;
      Array.from(document.querySelectorAll(".clickable")).forEach(function (el) {
        if (!self.isWorldVisible(el)) return;
        el.object3D.updateMatrixWorld(true);
        el.object3D.traverse(function (node) {
          if (node.isMesh && node.geometry) meshes.push(node);
        });
      });
      return meshes;
    },

    activateFirstHit: function () {
      var hits = this.raycaster.intersectObjects(this.collectClickableMeshes(), false);
      if (!hits.length) return;

      var target = this.findClickableElement(hits[0].object);
      if (!target) return;
      target.emit("click");
    },

    isWorldVisible: function (el) {
      var current = el;
      while (current) {
        if (current.object3D && current.object3D.visible === false) return false;
        current = current.parentElement;
      }
      return true;
    },

    findClickableElement: function (object3D) {
      var current = object3D;
      while (current) {
        if (current.el && current.el.classList && current.el.classList.contains("clickable")) {
          return current.el;
        }
        current = current.parent;
      }
      return null;
    },
  });

  AFRAME.registerComponent("vr-panel-face-user", {
    schema: {
      offsetY: { default: 0 },
      offsetZ: { default: -2.15 },
      follow: { default: true },
      anchor: { type: "string", default: "" },
    },

    init: function () {
      this.syncPanel = this.syncPanel.bind(this);
      this.el.sceneEl.addEventListener("enter-vr", this.syncPanel);
      this.el.sceneEl.addEventListener("exit-vr", this.syncPanel);
      if (this.el.sceneEl.hasLoaded) {
        requestAnimationFrame(this.syncPanel);
      } else {
        this.el.sceneEl.addEventListener("loaded", function () {
          requestAnimationFrame(this.syncPanel);
        }.bind(this));
      }
    },

    tick: function () {
      if (!this.el.sceneEl.is("vr-mode") || !this.data.follow) return;
      this.syncPanel();
    },

    getAnchorCamera: function () {
      var anchor = (this.data.anchor || "").trim();
      if (anchor) {
        var anchorEl = this.el.sceneEl.querySelector(anchor);
        if (anchorEl) return anchorEl;
      }
      return this.el.sceneEl.camera || this.el.sceneEl.querySelector("[camera]");
    },

    syncPanel: function () {
      if (!this.el.sceneEl.is("vr-mode")) return;
      var camera = this.getAnchorCamera();
      if (!camera || !camera.object3D) return;

      var worldPos = new THREE.Vector3();
      var worldQuat = new THREE.Quaternion();
      var threeCam = null;
      if (camera.components && camera.components.camera && camera.components.camera.camera) {
        threeCam = camera.components.camera.camera;
      } else {
        threeCam = camera.getObject3D("camera");
      }

      if (threeCam) {
        threeCam.updateMatrixWorld(true);
        threeCam.getWorldPosition(worldPos);
        threeCam.getWorldQuaternion(worldQuat);
      } else {
        camera.object3D.updateMatrixWorld(true);
        camera.object3D.getWorldPosition(worldPos);
        camera.object3D.getWorldQuaternion(worldQuat);
      }

      var offset = new THREE.Vector3(0, this.data.offsetY, this.data.offsetZ);
      offset.applyQuaternion(worldQuat);
      worldPos.add(offset);

      if (this.el.parentEl && this.el.parentEl.object3D) {
        this.el.parentEl.object3D.updateMatrixWorld(true);
        this.el.parentEl.object3D.worldToLocal(worldPos);
        this.el.object3D.position.copy(worldPos);
        var parentQuat = new THREE.Quaternion();
        this.el.parentEl.object3D.getWorldQuaternion(parentQuat);
        this.el.object3D.quaternion.copy(worldQuat).premultiply(parentQuat.invert());
      } else {
        this.el.object3D.position.copy(worldPos);
        this.el.object3D.quaternion.copy(worldQuat);
      }

      if (this.el.getAttribute("visible") !== false && this.el.getAttribute("visible") !== "false") {
        this.el.object3D.visible = true;
      }
    },
  });

  var IronFlowerVrModal = {
    _layer: null,
    _scene: null,
    _state: null,
    _onAction: null,
    _bound: false,

    isVr: function () {
      var scene = this._scene || document.querySelector("a-scene");
      return !!(scene && scene.is && scene.is("vr-mode"));
    },

    isOpen: function () {
      return !!(this._state && this._state.visible);
    },

    getModalKey: function () {
      return this._state && this._state.modalKey ? this._state.modalKey : "";
    },

    getCamera: function (sceneEl) {
      sceneEl = sceneEl || this._scene || document.querySelector("a-scene");
      if (!sceneEl) return null;
      return sceneEl.querySelector("#mainCamera") || sceneEl.querySelector("#menuCamera") || sceneEl.querySelector("[camera]");
    },

    ensure: function (sceneEl) {
      sceneEl = sceneEl || this._scene || document.querySelector("a-scene");
      if (!sceneEl) return null;
      this._scene = sceneEl;

      var camera = this.getCamera(sceneEl);
      if (!camera) return null;

      if (this._layer && this._layer.parentElement === camera) {
        this.bindLayerHandlers(this._layer);
        return this._layer;
      }

      var layer = camera.querySelector("#vrModalLayer");
      if (!layer) {
        layer = document.createElement("a-entity");
        layer.id = "vrModalLayer";
        layer.setAttribute("visible", "false");
        layer.setAttribute("position", "0 -0.02 -1.72");

        var backdrop = document.createElement("a-plane");
        backdrop.id = "vrModalBackdrop";
        backdrop.className = "clickable vr-modal-backdrop";
        backdrop.setAttribute("width", "3.25");
        backdrop.setAttribute("height", "1.88");
        backdrop.setAttribute("color", "#120804");
        backdrop.setAttribute("material", "shader: flat; transparent: true; opacity: 0.94");
        backdrop.setAttribute("position", "0 0 -0.03");
        layer.appendChild(backdrop);

        var dim = document.createElement("a-plane");
        dim.setAttribute("width", "3.35");
        dim.setAttribute("height", "1.98");
        dim.setAttribute("color", "#000000");
        dim.setAttribute("material", "shader: flat; transparent: true; opacity: 0.35");
        dim.setAttribute("position", "0 0 -0.05");
        layer.appendChild(dim);

        var title = document.createElement("a-entity");
        title.id = "vrModalTitle";
        title.setAttribute("position", "0 0.54 0.01");
        title.setAttribute(
          "canvas-label",
          "text: ; width: 2.95; height: 0.38; background: rgba(0,0,0,0); border: rgba(0,0,0,0); fontSize: 32; color: #ffe7a8"
        );
        layer.appendChild(title);

        var text = document.createElement("a-entity");
        text.id = "vrModalText";
        text.setAttribute("position", "0 0.04 0.01");
        text.setAttribute(
          "canvas-label",
          "text: ; width: 2.95; height: 0.66; background: rgba(0,0,0,0); border: rgba(0,0,0,0); fontSize: 20; subFontSize: 18; color: #ffd39b"
        );
        layer.appendChild(text);

        var cancel = document.createElement("a-entity");
        cancel.id = "vrModalCancel";
        cancel.className = "clickable vr-modal-hit";
        cancel.setAttribute("position", "-0.62 -0.58 0.04");
        cancel.setAttribute(
          "canvas-button",
          "label: 取消; sublabel: ; href: ; width: 1.15; height: 0.5; background: rgba(255, 255, 255, 0.06); border: rgba(255, 224, 161, 0.42)"
        );
        layer.appendChild(cancel);

        var action = document.createElement("a-entity");
        action.id = "vrModalAction";
        action.className = "clickable vr-modal-hit";
        action.setAttribute("position", "0.62 -0.58 0.04");
        action.setAttribute(
          "canvas-button",
          "label: 确认; sublabel: ; href: ; width: 1.15; height: 0.5; background: rgba(255, 189, 66, 0.28); border: rgba(255, 224, 161, 0.72)"
        );
        layer.appendChild(action);

        camera.appendChild(layer);
      } else if (!layer.querySelector("#vrModalBackdrop")) {
        var existingBackdrop = document.createElement("a-plane");
        existingBackdrop.id = "vrModalBackdrop";
        existingBackdrop.className = "clickable vr-modal-backdrop";
        existingBackdrop.setAttribute("width", "3.25");
        existingBackdrop.setAttribute("height", "1.88");
        existingBackdrop.setAttribute("color", "#120804");
        existingBackdrop.setAttribute("material", "shader: flat; transparent: true; opacity: 0.94");
        existingBackdrop.setAttribute("position", "0 0 -0.03");
        layer.insertBefore(existingBackdrop, layer.firstChild);
      } else if (!layer.querySelector("#vrModalCancel")) {
        var legacyAction = layer.querySelector("#vrModalAction");
        if (legacyAction) legacyAction.setAttribute("position", "0.62 -0.58 0.04");

        var legacyCancel = document.createElement("a-entity");
        legacyCancel.id = "vrModalCancel";
        legacyCancel.className = "clickable vr-modal-hit";
        legacyCancel.setAttribute("position", "-0.62 -0.58 0.04");
        legacyCancel.setAttribute(
          "canvas-button",
          "label: 取消; sublabel: ; href: ; width: 1.15; height: 0.5; background: rgba(255, 255, 255, 0.06); border: rgba(255, 224, 161, 0.42)"
        );
        layer.appendChild(legacyCancel);
      }

      this.bindLayerHandlers(layer);
      this._layer = layer;
      return layer;
    },

    bindLayerHandlers: function (layer) {
      if (!layer) return;
      var self = this;
      var cancel = layer.querySelector("#vrModalCancel");
      var action = layer.querySelector("#vrModalAction");
      if (cancel && !cancel.__vrModalBound) {
        cancel.__vrModalBound = true;
        cancel.addEventListener("click", function () {
          if (!self.canTriggerModalAction()) return;
          self.triggerCancel();
        });
      }
      if (action && !action.__vrModalBound) {
        action.__vrModalBound = true;
        action.addEventListener("click", function () {
          if (!self.canTriggerModalAction()) return;
          self.triggerAction();
        });
      }
      var backdrop = layer.querySelector("#vrModalBackdrop");
      if (backdrop && !backdrop.__vrModalBound) {
        backdrop.__vrModalBound = true;
        backdrop.addEventListener("click", function (event) {
          event.stopPropagation();
        });
      }
    },

    canTriggerModalAction: function () {
      return !(this._inputCooldownUntil && performance.now() < this._inputCooldownUntil);
    },

    refreshHandRaycasters: function () {
      var hands = [
        document.querySelector("#leftHand"),
        document.querySelector("#rightHand"),
      ];
      hands.forEach(function (hand) {
        if (!hand || !hand.components || !hand.components.raycaster) return;
        var raycaster = hand.components.raycaster;
        if (typeof raycaster.refreshObjects === "function") {
          raycaster.refreshObjects();
        }
      });
    },

    render: function (opts) {
      var sceneEl = (opts && opts.sceneEl) || this._scene || document.querySelector("a-scene");
      var layer = this.ensure(sceneEl);
      if (!layer) return false;

      var titleEl = layer.querySelector("#vrModalTitle");
      var textEl = layer.querySelector("#vrModalText");
      var cancelEl = layer.querySelector("#vrModalCancel");
      var actionEl = layer.querySelector("#vrModalAction");
      var hasCancel = !!(opts.cancelLabel && opts.cancelLabel.trim());

      if (titleEl) {
        titleEl.setAttribute("canvas-label", {
          text: opts.title || "",
          width: 2.95,
          height: 0.38,
          background: "rgba(0,0,0,0)",
          border: "rgba(0,0,0,0)",
          fontSize: 32,
          color: "#ffe7a8",
        });
      }

      if (textEl) {
        var body = opts.text || "";
        if (opts.textDetail) body = body + "|" + opts.textDetail;
        textEl.setAttribute("canvas-label", {
          text: "|" + body,
          width: 2.95,
          height: hasCancel ? 0.92 : 0.82,
          background: "rgba(0,0,0,0)",
          border: "rgba(0,0,0,0)",
          fontSize: 20,
          subFontSize: 18,
          color: "#ffd39b",
        });
      }

      if (cancelEl) {
        cancelEl.setAttribute("visible", hasCancel);
        if (hasCancel) {
          cancelEl.setAttribute("canvas-button", {
            label: opts.cancelLabel,
            sublabel: "",
            href: "",
            width: hasCancel ? 1.15 : 2.35,
            height: 0.5,
            background: "rgba(255, 255, 255, 0.06)",
            border: "rgba(255, 224, 161, 0.42)",
          });
        }
      }

      if (actionEl) {
        actionEl.setAttribute("position", hasCancel ? "0.62 -0.58 0.04" : "0 -0.58 0.04");
        actionEl.setAttribute("canvas-button", {
          label: opts.buttonLabel || "确认",
          sublabel: opts.buttonSublabel || "",
          href: "",
          width: hasCancel ? 1.15 : 2.35,
          height: 0.5,
          background: "rgba(255, 189, 66, 0.28)",
          border: "rgba(255, 224, 161, 0.72)",
        });
      }

      layer.setAttribute("visible", "true");
      this._inputCooldownUntil = performance.now() + 360;
      this._onAction = typeof opts.onAction === "function" ? opts.onAction : null;
      this._onCancel = typeof opts.onCancel === "function" ? opts.onCancel : null;
      var self = this;
      requestAnimationFrame(function () {
        self.refreshHandRaycasters();
      });
      return true;
    },

    show: function (opts) {
      opts = opts || {};
      this._state = {
        visible: true,
        title: opts.title || "",
        text: opts.text || "",
        textDetail: opts.textDetail || "",
        buttonLabel: opts.buttonLabel || "确认",
        buttonSublabel: opts.buttonSublabel || "",
        cancelLabel: opts.cancelLabel || "",
        modalKey: opts.modalKey || "",
        onAction: opts.onAction || null,
        onCancel: opts.onCancel || null,
        onRestoreDesktop: opts.onRestoreDesktop || null,
        onHideDesktop: opts.onHideDesktop || null,
        sceneEl: opts.sceneEl || null,
      };
      this._onAction = this._state.onAction;
      this._onCancel = this._state.onCancel;
      if (this.isVr()) {
        var rendered = this.render(this._state);
        if (rendered) {
          if (typeof opts.onHideDesktop === "function") opts.onHideDesktop();
          return true;
        }
      }
      return false;
    },

    sync: function () {
      if (!this._state || !this._state.visible) return false;
      if (this.isVr()) {
        this.render(this._state);
        return true;
      }
      return false;
    },

    hide: function () {
      this._state = null;
      this._onAction = null;
      this._onCancel = null;
      if (this._layer) this._layer.setAttribute("visible", "false");
    },

    triggerAction: function () {
      if (!this.isOpen() || !this.canTriggerModalAction()) return;
      var action = this._onAction || (this._state && this._state.onAction);
      this.hide();
      if (typeof action === "function") action();
    },

    triggerCancel: function () {
      if (!this.isOpen() || !this.canTriggerModalAction()) return;
      var cancel = this._onCancel || (this._state && this._state.onCancel);
      this.hide();
      if (typeof cancel === "function") cancel();
    },

    bindScene: function (sceneEl) {
      sceneEl = sceneEl || document.querySelector("a-scene");
      if (!sceneEl || sceneEl.__vrModalSceneBound) return;
      sceneEl.__vrModalSceneBound = true;
      this._scene = sceneEl;

      var self = this;
      sceneEl.addEventListener("enter-vr", function () {
        document.body.classList.add("vr-active");
        if (self._state && self._state.visible) {
          self.render(self._state);
          if (typeof self._state.onHideDesktop === "function") self._state.onHideDesktop();
        }
      });
      sceneEl.addEventListener("exit-vr", function () {
        document.body.classList.remove("vr-active");
        if (self._layer) self._layer.setAttribute("visible", "false");
        if (self._state && self._state.visible) {
          var restore = self._state.onRestoreDesktop;
          if (typeof restore === "function") restore();
        }
      });

      if (!this._bound) {
        this._bound = true;
        document.addEventListener("keydown", function (event) {
          if (!self.isOpen() || !self.isVr()) return;
          if (event.code === "Space" || event.code === "Enter") {
            event.preventDefault();
            event.stopPropagation();
            self.triggerAction();
          } else if (event.code === "Escape" && self._state && self._state.cancelLabel) {
            event.preventDefault();
            event.stopPropagation();
            self.triggerCancel();
          }
        }, true);
      }
    },
  };

  global.IronFlowerVrModal = IronFlowerVrModal;
})(window);
