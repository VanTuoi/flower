(() => {
  "use strict";

  const ENABLE_PERSONALIZATION = false;
  const ENABLE_FLOWER_EFFECTS = true;

  const root = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const hasGsap = typeof window.gsap !== "undefined";

  if (hasGsap) root.classList.add("gsap-ready");

  const elements = {
    intro: document.querySelector("#intro"),
    mainContent: document.querySelector("#mainContent"),
    toolbar: document.querySelector(".toolbar"),
    openGift: document.querySelector("#openGift"),
    soundToggle: document.querySelector("#soundToggle"),
    backgroundMusic: document.querySelector("#backgroundMusic"),
    personalizeButton: document.querySelector("#personalizeButton"),
    personalizeDialog: document.querySelector("#personalizeDialog"),
    dialogClose: document.querySelector("#dialogClose"),
    personalizeForm: document.querySelector("#personalizeForm"),
    recipientInput: document.querySelector("#recipientInput"),
    senderInput: document.querySelector("#senderInput"),
    toast: document.querySelector("#toast"),
    canvas: document.querySelector("#petalCanvas"),
  };

  const defaults = {
    recipient: "bạn",
    sender: "Một người luôn trân trọng bạn",
  };

  const state = {
    soundEnabled: true,
    recipient: defaults.recipient,
    sender: defaults.sender,
    toastTimer: 0,
    bloomTimeline: null,
  };

  function cleanText(value, fallback) {
    const result = String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim();
    return result.slice(0, 36) || fallback;
  }

  function readPersonalization() {
    const params = new URLSearchParams(window.location.search);
    state.recipient = cleanText(params.get("to"), defaults.recipient);
    state.sender = cleanText(params.get("from"), defaults.sender);
    applyPersonalization();
  }

  function applyPersonalization() {
    const personalizedSender = state.sender === defaults.sender && state.recipient !== defaults.recipient
      ? `Một người luôn trân trọng ${state.recipient}`
      : state.sender;

    document.querySelectorAll("[data-recipient]").forEach((node) => {
      node.textContent = state.recipient;
    });
    document.querySelectorAll("[data-recipient-cap]").forEach((node) => {
      node.textContent = state.recipient.charAt(0).toLocaleUpperCase("vi-VN") + state.recipient.slice(1);
    });
    document.querySelectorAll("[data-sender]").forEach((node) => {
      node.textContent = personalizedSender;
    });
    elements.recipientInput.value = state.recipient === defaults.recipient ? "" : state.recipient;
    elements.senderInput.value = state.sender === defaults.sender ? "" : state.sender;
    document.title = `20/10 — Một khu vườn dành tặng ${state.recipient}`;
  }

  function persistPersonalization() {
    const url = new URL(window.location.href);

    if (state.recipient === defaults.recipient) url.searchParams.delete("to");
    else url.searchParams.set("to", state.recipient);

    if (state.sender === defaults.sender) url.searchParams.delete("from");
    else url.searchParams.set("from", state.sender);

    try {
      window.history.replaceState({}, "", url);
    } catch {
      // file:// previews can reject history changes in a few older browsers.
    }
  }

  function showToast(message) {
    window.clearTimeout(state.toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("is-visible");
    state.toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove("is-visible");
    }, 2400);
  }

  function playBackgroundMusic() {
    if (!state.soundEnabled || !elements.backgroundMusic) return;
    elements.backgroundMusic.volume = 0.3;
    const playback = elements.backgroundMusic.play();
    playback?.catch(() => {
      // Trình duyệt có thể chặn âm thanh nếu thao tác không bắt nguồn từ người dùng.
    });
  }

  function setSound(enabled) {
    state.soundEnabled = enabled;
    body.classList.toggle("sound-muted", !enabled);
    elements.soundToggle.setAttribute("aria-pressed", String(enabled));
    elements.soundToggle.setAttribute("aria-label", enabled ? "Tắt âm thanh" : "Bật âm thanh");
    if (enabled) playBackgroundMusic();
    else elements.backgroundMusic?.pause();
  }

  function setFinalBouquetState() {
    if (!hasGsap) return;
    window.gsap.set(".stems path", { strokeDashoffset: 0 });
    window.gsap.set(".leaves path, .flower, .ribbon", { opacity: 1, scale: 1 });
    window.gsap.set(".sparkles circle", { opacity: 0.7, scale: 1 });
  }

  function animateBouquet(replay = false) {
    if (!hasGsap || prefersReducedMotion.matches) {
      setFinalBouquetState();
      return;
    }

    const gsap = window.gsap;
    const mobile = window.innerWidth < 640 || window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (state.bloomTimeline) state.bloomTimeline.kill();
    gsap.killTweensOf(".flower, .flower__petals, .sparkles circle, .leaves path, .stems path, .ribbon");

    const timeline = gsap.timeline({ defaults: { overwrite: "auto" } });
    state.bloomTimeline = timeline;

    timeline
      .set(".stems path", { strokeDashoffset: 700 })
      .set(".leaves path", { opacity: 0, scale: 0, rotation: -12, transformOrigin: "50% 100%" })
      .set(".flower", { opacity: 0, scale: mobile ? 1 : 0, transformOrigin: "50% 50%" })
      .set(".ribbon", { opacity: 0, scale: 0.65, transformOrigin: "50% 50%" })
      .set(".sparkles circle", { opacity: 0, scale: 0, transformOrigin: "50% 50%" })
      .to(".stems path", {
        strokeDashoffset: 0,
        duration: 1.45,
        ease: "power3.out",
        stagger: 0.055,
      }, 0)
      .to(".leaves path", {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.68,
        ease: "back.out(1.8)",
        stagger: 0.075,
      }, 0.48)
      .to(".flower", {
        opacity: 1,
        scale: 1,
        duration: 0.95,
        ease: "back.out(1.7)",
        stagger: { each: 0.13, from: "center" },
      }, 0.73)
      .to(".ribbon", {
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.8)",
      }, 1.12)
      .to(".sparkles circle", {
        opacity: 0.9,
        scale: 1,
        duration: 0.45,
        ease: "back.out(2)",
        stagger: 0.09,
      }, 1.22);

    if (!replay) {
      timeline.fromTo(
        ".hero__copy > *",
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.08 },
        0.15,
      );
    }

    timeline.call(() => {
      if (!mobile) {
        gsap.to(".flower", {
          rotation: (index) => (index % 2 ? 1.7 : -1.5),
          duration: (index) => 3.6 + index * 0.28,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          transformOrigin: "50% 100%",
        });
        gsap.to(".flower__petals", {
          scale: 1.018,
          duration: 2.6,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          transformOrigin: "50% 50%",
        });
        gsap.to(".sparkles circle", {
          opacity: 0.12,
          scale: 0.45,
          duration: 1.15,
          ease: "sine.inOut",
          stagger: 0.18,
          repeat: -1,
          yoyo: true,
        });
      }
    });
  }

  class PetalField {
    constructor(canvas) {
      this.canvas = canvas;
      this.context = canvas.getContext("2d", { alpha: true });
      this.petals = [];
      this.width = 0;
      this.height = 0;
      this.dpr = 1;
      this.running = false;
      this.frame = 0;
      this.lastTime = 0;
      this.palette = ["#f2a1ae", "#ffd0ba", "#f7e4bd", "#d67e98"];
      this.resize = this.resize.bind(this);
      this.tick = this.tick.bind(this);
      this.resize();
      window.addEventListener("resize", this.resize, { passive: true });
    }

    resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.dpr = Math.min(window.devicePixelRatio || 1, this.width < 640 ? 1.25 : 1.75);
      this.canvas.width = Math.round(this.width * this.dpr);
      this.canvas.height = Math.round(this.height * this.dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.context.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }

    createPetal(x = Math.random() * this.width, y = -30, burst = false) {
      const size = burst ? 4 + Math.random() * 5 : 3.5 + Math.random() * 4.5;
      const direction = burst ? Math.random() * Math.PI * 2 : Math.PI / 2;
      const force = burst ? 1.3 + Math.random() * 2.7 : 0;
      return {
        x,
        baseX: x,
        y,
        size,
        vx: burst ? Math.cos(direction) * force : 0,
        vy: burst ? Math.sin(direction) * force - 0.8 : 0.34 + Math.random() * 0.34,
        angle: (Math.random() - 0.5) * 0.7,
        baseAngle: (Math.random() - 0.5) * 0.45,
        spin: (Math.random() - 0.5) * (burst ? 0.075 : 0.012),
        phase: Math.random() * Math.PI * 2,
        flutterSpeed: 0.022 + Math.random() * 0.018,
        amplitude: 9 + Math.random() * 18,
        wind: -0.035 + Math.random() * 0.09,
        flip: Math.random() * Math.PI * 2,
        opacity: 0.4 + Math.random() * 0.35,
        color: this.palette[Math.floor(Math.random() * this.palette.length)],
        burst,
        life: burst ? 130 + Math.random() * 65 : Infinity,
      };
    }

    start() {
      if (prefersReducedMotion.matches || this.running) return;
      const count = this.width < 640 ? 8 : 16;
      this.petals = Array.from({ length: count }, () => this.createPetal(Math.random() * this.width, Math.random() * this.height));
      this.running = true;
      this.lastTime = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.frame);
      this.context.clearRect(0, 0, this.width, this.height);
    }

    burst(x, y, amount = 24) {
      if (prefersReducedMotion.matches) return;
      for (let index = 0; index < amount; index += 1) {
        this.petals.push(this.createPetal(x, y, true));
      }
      if (!this.running) this.start();
    }

    drawPetal(petal) {
      const ctx = this.context;
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate(petal.angle);
      const flipScale = Math.cos(petal.flip);
      ctx.scale(Math.sign(flipScale || 1) * (0.22 + Math.abs(flipScale) * 0.78), 1);
      ctx.globalAlpha = Math.max(0, petal.opacity * Math.min(1, petal.life / 40));
      ctx.fillStyle = petal.color;
      ctx.beginPath();
      ctx.moveTo(0, -petal.size * 1.55);
      ctx.bezierCurveTo(petal.size * 1.05, -petal.size * 0.8, petal.size * 0.95, petal.size * 0.65, 0, petal.size * 1.4);
      ctx.bezierCurveTo(-petal.size * 0.72, petal.size * 0.58, -petal.size * 1.18, -petal.size * 0.48, 0, -petal.size * 1.55);
      ctx.fill();
      ctx.globalAlpha *= 0.28;
      ctx.strokeStyle = "#fff7ea";
      ctx.lineWidth = 0.45;
      ctx.beginPath();
      ctx.moveTo(0, -petal.size * 1.2);
      ctx.quadraticCurveTo(petal.size * 0.12, 0, 0, petal.size * 1.05);
      ctx.stroke();
      ctx.restore();
    }

    tick(time) {
      if (!this.running) return;
      const frameInterval = this.width < 640 ? 1000 / 30 : 1000 / 50;
      if (time - this.lastTime < frameInterval) {
        this.frame = requestAnimationFrame(this.tick);
        return;
      }
      const delta = Math.min((time - this.lastTime) / 16.67, 2);
      this.lastTime = time;
      this.context.clearRect(0, 0, this.width, this.height);

      this.petals.forEach((petal) => {
        if (petal.burst) {
          petal.x += petal.vx * delta;
          petal.y += petal.vy * delta;
          petal.vy += 0.025 * delta;
          petal.vx *= 0.988;
          petal.angle += petal.spin * delta;
          petal.flip += petal.flutterSpeed * 4 * delta;
          petal.life -= delta;
        } else {
          petal.phase += petal.flutterSpeed * delta;
          petal.baseX += petal.wind * delta;
          petal.x = petal.baseX + Math.sin(petal.phase) * petal.amplitude;
          petal.y += petal.vy * (0.82 + Math.abs(Math.cos(petal.phase)) * 0.18) * delta;
          petal.angle = petal.baseAngle + Math.sin(petal.phase * 0.72) * 0.42;
          petal.flip = petal.phase * 1.45;

          if (petal.y > this.height + 30 || petal.x < -60 || petal.x > this.width + 60) {
            Object.assign(petal, this.createPetal(Math.random() * this.width, -30));
          }
        }

        this.drawPetal(petal);
      });

      this.petals = this.petals.filter((petal) => petal.life > 0);
      const maximumPetals = this.width < 640 ? 28 : 44;
      if (this.petals.length > maximumPetals) this.petals.splice(0, this.petals.length - maximumPetals);
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  const petalField = new PetalField(elements.canvas);

  function openGift() {
    if (body.classList.contains("gift-open")) return;
    body.classList.add("gift-open");
    elements.intro.setAttribute("aria-hidden", "true");
    elements.mainContent.inert = false;
    elements.toolbar.inert = false;
    playBackgroundMusic();
    if (ENABLE_FLOWER_EFFECTS) {
      animateBouquet();
      petalField.start();
      petalField.burst(window.innerWidth / 2, window.innerHeight * 0.62, window.innerWidth < 640 ? 14 : 26);
    }
    if (navigator.vibrate) navigator.vibrate([18, 35, 12]);
    window.setTimeout(() => {
      elements.mainContent.tabIndex = -1;
      elements.mainContent.focus({ preventScroll: true });
    }, prefersReducedMotion.matches ? 0 : 780);
  }

  function setupRevealObserver() {
    const targets = document.querySelectorAll(".reveal-on-scroll");
    if (!("IntersectionObserver" in window) || prefersReducedMotion.matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -5%" });

    targets.forEach((target) => observer.observe(target));
  }

  elements.openGift.addEventListener("click", openGift);
  elements.soundToggle.addEventListener("click", () => setSound(!state.soundEnabled));
  if (ENABLE_PERSONALIZATION) {
    elements.personalizeButton.hidden = false;
    elements.personalizeDialog.hidden = false;

    elements.personalizeButton.addEventListener("click", () => {
      elements.recipientInput.value = state.recipient === defaults.recipient ? "" : state.recipient;
      elements.senderInput.value = state.sender === defaults.sender ? "" : state.sender;
      elements.personalizeDialog.showModal();
      window.setTimeout(() => elements.recipientInput.focus(), 80);
    });

    elements.personalizeDialog.addEventListener("click", (event) => {
      if (event.target === elements.personalizeDialog) elements.personalizeDialog.close("cancel");
    });

    elements.dialogClose.addEventListener("click", () => elements.personalizeDialog.close("cancel"));

    elements.personalizeForm.addEventListener("submit", (event) => {
      event.preventDefault();
      state.recipient = cleanText(elements.recipientInput.value, defaults.recipient);
      state.sender = cleanText(elements.senderInput.value, defaults.sender);
      applyPersonalization();
      persistPersonalization();
      elements.personalizeDialog.close("save");
      showToast(`Đã dành lời chúc cho ${state.recipient}`);
      petalField.burst(window.innerWidth / 2, window.innerHeight / 2, 18);
    });
  } else {
    elements.personalizeButton.hidden = true;
    elements.personalizeDialog.hidden = true;
  }

  document.addEventListener("pointerup", (event) => {
    if (!ENABLE_FLOWER_EFFECTS || !body.classList.contains("gift-open") || event.target.closest("button, a, input, dialog")) return;
    petalField.burst(event.clientX, event.clientY, window.innerWidth < 640 ? 4 : 8);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      petalField.stop();
      elements.backgroundMusic?.pause();
    } else if (body.classList.contains("gift-open")) {
      if (ENABLE_FLOWER_EFFECTS) petalField.start();
      playBackgroundMusic();
    }
  });

  prefersReducedMotion.addEventListener?.("change", (event) => {
    if (event.matches) {
      petalField.stop();
      setFinalBouquetState();
    } else if (ENABLE_FLOWER_EFFECTS && body.classList.contains("gift-open")) {
      petalField.start();
    }
  });

  readPersonalization();
  setupRevealObserver();
  if (!ENABLE_FLOWER_EFFECTS) {
    body.classList.add("flowers-disabled");
    document.querySelector(".garden").hidden = true;
    elements.canvas.hidden = true;
    elements.openGift.querySelector("span").textContent = "Chạm để mở lời chúc";
    document.querySelector(".intro__note").textContent = "Một lời chúc nhỏ đang chờ được mở.";
  }
  elements.mainContent.inert = true;
  elements.toolbar.inert = true;
})();
