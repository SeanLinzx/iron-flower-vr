(function () {
  if (!window.AFRAME) return;

  var KEY_FORWARD = ["KeyW", "ArrowUp"];
  var KEY_BACK = ["KeyS", "ArrowDown"];
  var KEY_LEFT = ["KeyA", "ArrowLeft"];
  var KEY_RIGHT = ["KeyD", "ArrowRight"];
  var KEY_UP = ["KeyE", "PageUp"];
  var KEY_DOWN = ["KeyQ", "PageDown"];
  var BLOCKED_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

  AFRAME.registerComponent("desktop-fly-controls", {
    schema: {
      speed: { default: 2.4 },
      verticalSpeed: { default: 1.8 },
    },

    init: function () {
      this.keys = Object.create(null);
      this.move = new THREE.Vector3();
      this.forward = new THREE.Vector3();
      this.right = new THREE.Vector3();
      this.onKeyDown = this.onKeyDown.bind(this);
      this.onKeyUp = this.onKeyUp.bind(this);
      this.onBlur = this.onBlur.bind(this);
      window.addEventListener("keydown", this.onKeyDown);
      window.addEventListener("keyup", this.onKeyUp);
      window.addEventListener("blur", this.onBlur);
    },

    remove: function () {
      window.removeEventListener("keydown", this.onKeyDown);
      window.removeEventListener("keyup", this.onKeyUp);
      window.removeEventListener("blur", this.onBlur);
    },

    isTypingTarget: function () {
      var active = document.activeElement;
      if (!active) return false;
      var tag = active.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || active.isContentEditable;
    },

    isBlocked: function () {
      var scene = this.el.sceneEl;
      if (scene && scene.is && scene.is("vr-mode")) return true;
      if (window.IronFlowerVrModal && IronFlowerVrModal.isOpen()) return true;
      return false;
    },

    onKeyDown: function (event) {
      if (this.isTypingTarget() || this.isBlocked()) return;

      if (
        KEY_FORWARD.indexOf(event.code) !== -1 ||
        KEY_BACK.indexOf(event.code) !== -1 ||
        KEY_LEFT.indexOf(event.code) !== -1 ||
        KEY_RIGHT.indexOf(event.code) !== -1 ||
        KEY_UP.indexOf(event.code) !== -1 ||
        KEY_DOWN.indexOf(event.code) !== -1
      ) {
        this.keys[event.code] = true;
        if (BLOCKED_KEYS.indexOf(event.code) !== -1) {
          event.preventDefault();
        }
      }
    },

    onKeyUp: function (event) {
      this.keys[event.code] = false;
    },

    onBlur: function () {
      this.keys = Object.create(null);
    },

    keyActive: function (codes) {
      for (var i = 0; i < codes.length; i += 1) {
        if (this.keys[codes[i]]) return true;
      }
      return false;
    },

    resolveCamera: function () {
      var fromRig = this.el.querySelector("[camera]");
      if (fromRig) return fromRig;
      return (
        document.querySelector("#mainCamera") ||
        document.querySelector("#menuCamera") ||
        document.querySelector("#storyCamera")
      );
    },

    getCameraYaw: function () {
      var camera = this.resolveCamera();
      if (!camera) return this.el.object3D.rotation.y;

      var direction = new THREE.Vector3();
      camera.object3D.getWorldDirection(direction);
      return Math.atan2(-direction.x, -direction.z);
    },

    tick: function (time, delta) {
      if (this.isBlocked() || this.isTypingTarget()) return;

      var forward = this.keyActive(KEY_FORWARD) ? 1 : 0;
      var back = this.keyActive(KEY_BACK) ? 1 : 0;
      var left = this.keyActive(KEY_LEFT) ? 1 : 0;
      var right = this.keyActive(KEY_RIGHT) ? 1 : 0;
      var up = this.keyActive(KEY_UP) ? 1 : 0;
      var down = this.keyActive(KEY_DOWN) ? 1 : 0;

      if (!(forward || back || left || right || up || down)) return;

      var dt = Math.min(delta / 1000, 0.05);
      var yaw = this.getCameraYaw();
      var forwardAmount = forward - back;
      var rightAmount = left - right;
      var verticalAmount = up - down;

      this.forward.set(Math.sin(yaw), 0, Math.cos(yaw));
      this.right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      this.move.set(0, 0, 0);
      this.move.addScaledVector(this.forward, forwardAmount);
      this.move.addScaledVector(this.right, rightAmount);

      if (this.move.lengthSq() > 0) {
        this.move.normalize().multiplyScalar(this.data.speed * dt);
        this.el.object3D.position.add(this.move);
      }

      if (verticalAmount !== 0) {
        this.el.object3D.position.y += verticalAmount * this.data.verticalSpeed * dt;
      }
    },
  });
})();
