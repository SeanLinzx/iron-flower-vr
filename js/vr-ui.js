(function (global) {
  if (!global.AFRAME) return;

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
      href: { default: "" },
      width: { default: 2.8 },
      height: { default: 0.52 },
      background: { default: "rgba(255, 189, 66, 0.22)" },
      border: { default: "rgba(255, 224, 161, 0.72)" },
      color: { default: "#fff8ce" },
    },

    init: function () {
      this.onActivate = this.onActivate.bind(this);
      this.el.classList.add("clickable");
      this.el.addEventListener("click", this.onActivate);
      this.drawButton();
    },

    update: function () {
      this.drawButton();
    },

    remove: function () {
      this.el.removeEventListener("click", this.onActivate);
      this.disposeMesh();
    },

    onActivate: function () {
      var href = (this.data.href || "").trim();
      if (!href) return;
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
      if (!this.mesh) return;
      this.el.object3D.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    },

    drawButton: function () {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");
      var scale = 3;
      canvas.width = Math.round(860 * scale);
      canvas.height = Math.round(180 * scale);

      context.scale(scale, scale);
      context.fillStyle = this.data.background;
      context.strokeStyle = this.data.border;
      context.lineWidth = 3;
      this.roundRect(context, 8, 8, 844, 164, 18);
      context.fill();
      context.stroke();

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = this.data.color;
      context.font = "800 42px Arial, PingFang SC, Microsoft YaHei, sans-serif";
      context.fillText(this.data.label || "", 430, this.data.sublabel ? 62 : 90, 760);

      if (this.data.sublabel) {
        context.fillStyle = "rgba(255, 232, 176, 0.88)";
        context.font = "400 24px Arial, PingFang SC, Microsoft YaHei, sans-serif";
        context.fillText(this.data.sublabel, 430, 118, 760);
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
        toneMapped: false,
      });

      this.mesh = new THREE.Mesh(geometry, material);
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
      this.refreshPanel = this.refreshPanel.bind(this);
      this.el.addEventListener("loaded", this.refreshPanel);
      this.refreshPanel();
    },

    update: function (oldData) {
      if (oldData && oldData.src === this.data.src && oldData.width === this.data.width) return;
      this.refreshPanel();
    },

    remove: function () {
      if (this._texture) this._texture.dispose();
    },

    setPanelOpacity: function (opacity) {
      var mesh = this.el.getObject3D("mesh");
      if (!mesh || !mesh.material) return;
      mesh.material.transparent = opacity < 1;
      mesh.material.opacity = opacity;
      mesh.material.needsUpdate = true;
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

      if (this._texture) {
        this._texture.dispose();
        this._texture = null;
      }

      if (this.data.fadeIn) this.setPanelOpacity(0);

      var loader = new THREE.TextureLoader();
      loader.load(
        url,
        function (texture) {
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = false;
          texture.needsUpdate = true;
          self._texture = texture;

          var image = texture.image;
          var aspect = image && image.width ? image.width / image.height : 16 / 9;
          var panelWidth = self.data.width;
          var panelHeight = panelWidth / aspect;
          self.el.setAttribute("geometry", {
            primitive: "plane",
            width: panelWidth,
            height: panelHeight,
          });
          self.el.emit("story-panel-sized", {
            width: panelWidth,
            height: panelHeight,
            aspect: aspect,
          });

          mesh.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.FrontSide,
            transparent: self.data.fadeIn,
            opacity: self.data.fadeIn ? 0 : 1,
            toneMapped: false,
          });
          mesh.material.needsUpdate = true;

          if (self.data.fadeIn) {
            var start = performance.now();
            function tick(now) {
              var t = Math.min(1, (now - start) / 520);
              var eased = 1 - Math.pow(1 - t, 3);
              self.setPanelOpacity(eased);
              if (t < 1) requestAnimationFrame(tick);
            }
            requestAnimationFrame(tick);
          }

          self.el.emit("story-panel-loaded", {
            width: panelWidth,
            height: panelHeight,
          });
        },
        undefined,
        function (error) {
          console.warn("[story-texture-panel] load failed:", url, error);
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
      if (!this.mesh) return;
      this.el.object3D.remove(this.mesh);
      this.mesh.geometry.dispose();
      if (this.mesh.material.map) this.mesh.material.map.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
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

  AFRAME.registerComponent("vr-ui-interaction", {
    schema: {
      preferGaze: { default: false },
    },

    init: function () {
      this.raycaster = new THREE.Raycaster();
      this.mouse = new THREE.Vector2();
      this.lastSelect = 0;
      this.bindInput = this.bindInput.bind(this);

      if (this.el.canvas) {
        this.bindInput();
      } else {
        this.el.addEventListener("render-target-loaded", this.bindInput);
      }
    },

    bindInput: function () {
      var canvas = this.el.canvas;
      var rightHand = document.querySelector("#rightHand");
      var leftHand = document.querySelector("#leftHand");

      canvas.addEventListener("click", this.selectFromMouse.bind(this));
      canvas.addEventListener("pointerdown", this.selectFromMouse.bind(this));

      document.addEventListener(
        "keydown",
        function (event) {
          if (event.code === "Space" || event.code === "Enter") {
            this.selectFromCenter();
          }
        }.bind(this)
      );

      [rightHand, leftHand].forEach(
        function (hand) {
          if (!hand) return;
          ["triggerdown", "selectstart"].forEach(
            function (eventName) {
              hand.addEventListener(eventName, this.selectFromHand.bind(this, hand));
            }.bind(this)
          );
        }.bind(this)
      );
    },

    selectFromMouse: function (event) {
      if (!this.canSelect()) return;
      var rect = this.el.canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.el.camera);
      this.activateFirstHit();
    },

    selectFromCenter: function () {
      if (!this.canSelect()) return;
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.el.camera);
      this.activateFirstHit();
    },

    selectFromHand: function (hand) {
      if (!this.canSelect()) return;
      if (this.data.preferGaze || !hand) {
        this.selectFromCenter();
        return;
      }

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

    activateFirstHit: function () {
      var objects = Array.from(document.querySelectorAll(".clickable"))
        .filter(this.isWorldVisible)
        .map(function (el) {
          return el.object3D;
        });
      var hits = this.raycaster.intersectObjects(objects, true);
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
      if (!this.el.sceneEl.is("vr-mode")) return;
      this.syncPanel();
    },

    syncPanel: function () {
      if (!this.el.sceneEl.is("vr-mode")) return;
      var camera = this.el.sceneEl.camera || document.querySelector("[camera]");
      if (!camera) return;

      var camObj = camera.object3D;
      var worldPos = new THREE.Vector3();
      var worldQuat = new THREE.Quaternion();
      camObj.getWorldPosition(worldPos);
      camObj.getWorldQuaternion(worldQuat);

      var offset = new THREE.Vector3(0, this.data.offsetY, this.data.offsetZ);
      offset.applyQuaternion(worldQuat);
      worldPos.add(offset);

      if (this.el.parentEl && this.el.parentEl.object3D) {
        this.el.parentEl.object3D.worldToLocal(worldPos);
        this.el.object3D.position.copy(worldPos);
        var parentQuat = new THREE.Quaternion();
        this.el.parentEl.object3D.getWorldQuaternion(parentQuat);
        this.el.object3D.quaternion.copy(worldQuat).premultiply(parentQuat.invert());
      } else {
        this.el.object3D.position.copy(worldPos);
        this.el.object3D.quaternion.copy(worldQuat);
      }
    },
  });
})(window);
