(function () {
  if (!window.AFRAME) return;

  AFRAME.registerComponent("pico-thumbstick-move", {
    schema: {
      speed: { default: 1.8 },
      turnSpeed: { default: 90 },
      verticalSpeed: { default: 1.2 },
      deadzone: { default: 0.18 },
    },

    init: function () {
      this.move = new THREE.Vector3();
      this.forward = new THREE.Vector3();
      this.right = new THREE.Vector3();
      this.camera = this.resolveCamera();
      this.eventInput = {
        leftX: 0,
        leftY: 0,
        rightX: 0,
        rightY: 0,
        time: 0,
      };
      this.attachAxisEvents();
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

    tick: function (time, delta) {
      if (window.IronFlowerVrModal && IronFlowerVrModal.isOpen()) return;

      var gamepadInput = this.readGamepadAxes();
      if (!gamepadInput) return;

      var dt = Math.min(delta / 1000, 0.05);
      var moveX = this.applyDeadzone(gamepadInput.moveX);
      var moveY = this.applyDeadzone(gamepadInput.moveY);
      var turnX = this.applyDeadzone(gamepadInput.turnX);
      var moveVertical = this.applyDeadzone(gamepadInput.moveVertical || 0);

      if (Math.abs(moveX) > 0 || Math.abs(moveY) > 0) {
        this.moveRig(moveX, moveY, dt);
      }

      if (Math.abs(moveVertical) > 0) {
        this.el.object3D.position.y += moveVertical * this.data.verticalSpeed * dt;
      }

      if (Math.abs(turnX) > 0) {
        this.el.object3D.rotation.y -= THREE.MathUtils.degToRad(turnX * this.data.turnSpeed * dt);
      }
    },

    readGamepadAxes: function () {
      return this.readWebXRAxes() || this.readNavigatorAxes() || this.readRecentAxisEvent();
    },

    readWebXRAxes: function () {
      var renderer = this.el.sceneEl && this.el.sceneEl.renderer;
      var xr = renderer && renderer.xr;
      var session = xr && xr.getSession ? xr.getSession() : null;
      if (!session || !session.inputSources) return null;

      var leftMove = null;
      var rightMove = null;
      var fallbackMove = null;
      var leftVertical = 0;
      var rightVertical = 0;

      Array.from(session.inputSources).forEach(
        function (source) {
          if (!source || !source.gamepad || !source.gamepad.axes) return;

          var pair = this.findPrimaryAxisPair(source.gamepad.axes);
          if (!pair) return;
          var verticalPair = this.findSecondaryAxisPair(source.gamepad.axes);

          if (source.handedness === "left") {
            leftMove = pair;
            if (verticalPair) leftVertical = -verticalPair.y;
          } else if (source.handedness === "right") {
            rightMove = pair;
            if (verticalPair) rightVertical = -verticalPair.y;
          }

          if (!fallbackMove || pair.strength > fallbackMove.strength) {
            fallbackMove = pair;
            fallbackMove.vertical = verticalPair ? -verticalPair.y : 0;
          }
        }.bind(this)
      );

      if (!leftMove && !rightMove && !fallbackMove) return null;

      var move = leftMove || fallbackMove || rightMove;
      var turnX = leftMove && rightMove ? rightMove.x : 0;
      var moveVertical = 0;
      if (leftMove && rightMove) {
        moveVertical = -rightMove.y;
      } else if (rightMove) {
        moveVertical = rightVertical;
      } else if (leftMove) {
        moveVertical = leftVertical;
      } else if (fallbackMove && fallbackMove.vertical) {
        moveVertical = fallbackMove.vertical;
      }

      return {
        moveX: move.x,
        moveY: move.y,
        turnX: turnX,
        moveVertical: moveVertical,
      };
    },

    readNavigatorAxes: function () {
      var pads = navigator.getGamepads ? navigator.getGamepads() : [];
      var leftMove = null;
      var rightMove = null;
      var fallbackMove = null;
      var leftVertical = 0;
      var rightVertical = 0;

      for (var i = 0; i < pads.length; i += 1) {
        var pad = pads[i];
        if (!pad || !pad.axes || pad.axes.length < 2) continue;

        var pair = this.findPrimaryAxisPair(pad.axes);
        if (!pair) continue;
        var verticalPair = this.findSecondaryAxisPair(pad.axes);

        var id = (pad.id || "").toLowerCase();
        if (id.indexOf("left") !== -1) {
          leftMove = pair;
          if (verticalPair) leftVertical = -verticalPair.y;
        } else if (id.indexOf("right") !== -1) {
          rightMove = pair;
          if (verticalPair) rightVertical = -verticalPair.y;
        }

        if (!fallbackMove || pair.strength > fallbackMove.strength) {
          fallbackMove = pair;
          fallbackMove.vertical = verticalPair ? -verticalPair.y : 0;
        }
      }

      if (!leftMove && !rightMove && !fallbackMove) return null;

      var move = leftMove || fallbackMove || rightMove;
      var turnX = leftMove && rightMove ? rightMove.x : 0;
      var moveVertical = 0;
      if (leftMove && rightMove) {
        moveVertical = -rightMove.y;
      } else if (rightMove) {
        moveVertical = rightVertical;
      } else if (leftMove) {
        moveVertical = leftVertical;
      } else if (fallbackMove && fallbackMove.vertical) {
        moveVertical = fallbackMove.vertical;
      }

      return {
        moveX: move.x,
        moveY: move.y,
        turnX: turnX,
        moveVertical: moveVertical,
      };
    },

    readRecentAxisEvent: function () {
      if (performance.now() - this.eventInput.time > 350) return null;

      var inp = this.eventInput;
      var leftStrength = Math.sqrt(inp.leftX * inp.leftX + inp.leftY * inp.leftY);
      var rightStrength = Math.sqrt(inp.rightX * inp.rightX + inp.rightY * inp.rightY);

      if (leftStrength <= this.data.deadzone && rightStrength <= this.data.deadzone) return null;

      var hasLeft = leftStrength > this.data.deadzone;
      var hasRight = rightStrength > this.data.deadzone;
      var move = hasLeft ? { x: inp.leftX, y: inp.leftY } : { x: inp.rightX, y: inp.rightY };

      return {
        moveX: move.x,
        moveY: move.y,
        turnX: hasLeft && hasRight ? inp.rightX : 0,
        moveVertical: hasLeft && hasRight ? -inp.rightY : 0,
      };
    },

    attachAxisEvents: function () {
      var leftHand = document.querySelector("#leftHand");
      var rightHand = document.querySelector("#rightHand");
      var events = ["axismove", "thumbstickmoved", "trackpadmoved"];

      if (leftHand) {
        events.forEach(
          function (eventName) {
            leftHand.addEventListener(
              eventName,
              function (event) {
                var pair = this.axisPairFromEvent(event);
                if (!pair) return;
                this.eventInput.leftX = pair.x;
                this.eventInput.leftY = pair.y;
                this.eventInput.time = performance.now();
              }.bind(this)
            );
          }.bind(this)
        );
      }

      if (rightHand) {
        events.forEach(
          function (eventName) {
            rightHand.addEventListener(
              eventName,
              function (event) {
                var pair = this.axisPairFromEvent(event);
                if (!pair) return;
                this.eventInput.rightX = pair.x;
                this.eventInput.rightY = pair.y;
                this.eventInput.time = performance.now();
              }.bind(this)
            );
          }.bind(this)
        );
      }
    },

    axisPairFromEvent: function (event) {
      var detail = event.detail || {};

      if (typeof detail.x === "number" && typeof detail.y === "number") {
        return { x: detail.x, y: detail.y, strength: Math.sqrt(detail.x * detail.x + detail.y * detail.y) };
      }

      if (detail.axis && detail.axis.length >= 2) {
        return this.findPrimaryAxisPair(detail.axis);
      }

      if (detail.axes && detail.axes.length >= 2) {
        return this.findPrimaryAxisPair(detail.axes);
      }

      return null;
    },

    findSecondaryAxisPair: function (axes) {
      if (!axes || axes.length < 4) return null;

      var x = axes[2] || 0;
      var y = axes[3] || 0;
      var strength = Math.sqrt(x * x + y * y);
      if (strength <= this.data.deadzone) return null;

      return { x: x, y: y, strength: strength };
    },

    findPrimaryAxisPair: function (axes) {
      if (!axes || axes.length < 2) return null;

      var candidates = [];

      if (axes.length >= 4) {
        candidates.push({ x: axes[2] || 0, y: axes[3] || 0, priority: 2 });
      }

      candidates.push({ x: axes[0] || 0, y: axes[1] || 0, priority: 1 });

      for (var i = 0; i < axes.length - 1; i += 2) {
        candidates.push({ x: axes[i] || 0, y: axes[i + 1] || 0, priority: 0 });
      }

      var best = null;
      candidates.forEach(
        function (candidate) {
          var strength = Math.sqrt(candidate.x * candidate.x + candidate.y * candidate.y);
          candidate.strength = strength;

          if (strength <= this.data.deadzone) return;
          if (!best || candidate.priority > best.priority || strength > best.strength + 0.12) {
            best = candidate;
          }
        }.bind(this)
      );

      return best;
    },

    applyDeadzone: function (value) {
      if (Math.abs(value) < this.data.deadzone) return 0;
      var sign = value < 0 ? -1 : 1;
      return sign * ((Math.abs(value) - this.data.deadzone) / (1 - this.data.deadzone));
    },

    moveRig: function (moveX, moveY, dt) {
      var yaw = this.getCameraYaw();
      var distance = this.data.speed * dt;
      var forwardAmount = -moveY;
      var rightAmount = -moveX;

      this.forward.set(Math.sin(yaw), 0, Math.cos(yaw));
      this.right.set(Math.cos(yaw), 0, -Math.sin(yaw));
      this.move.copy(this.forward).multiplyScalar(forwardAmount);
      this.move.addScaledVector(this.right, rightAmount);

      if (this.move.lengthSq() > 1) this.move.normalize();
      this.move.multiplyScalar(distance);
      this.el.object3D.position.add(this.move);
    },

    getCameraYaw: function () {
      if (!this.camera) this.camera = this.resolveCamera();
      if (!this.camera) return this.el.object3D.rotation.y;

      var direction = new THREE.Vector3();
      this.camera.object3D.getWorldDirection(direction);
      return Math.atan2(-direction.x, -direction.z);
    },
  });
})();
