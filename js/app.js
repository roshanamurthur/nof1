/* ============================================
   NOF1 LAB — Scroll-Driven App
   ============================================ */

(function () {
  "use strict";

  // --- Config ---
  const FRAME_COUNT = 38;
  const FRAME_PATH = (i) => `frames/frame_${String(i).padStart(4, "0")}.jpg`;

  // --- DOM ---
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const heroVial = document.querySelector(".hero-vial");
  const heroSection = document.getElementById("hero");

  // --- State ---
  const frames = new Array(FRAME_COUNT);
  let currentFrame = -1;
  let loaded = 0;

  // --- Register GSAP ---
  gsap.registerPlugin(ScrollTrigger);

  // --- Lenis ---
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  // --- Canvas sizing ---
  function resizeCanvas() {
    const rect = heroVial.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (currentFrame >= 0) drawFrame(currentFrame);
  }
  window.addEventListener("resize", resizeCanvas);

  // --- Draw frame to visible canvas ---
  function drawFrame(index) {
    const img = frames[index];
    if (!img) return;

    const cw = canvas.width / (window.devicePixelRatio || 1);
    const ch = canvas.height / (window.devicePixelRatio || 1);

    ctx.clearRect(0, 0, cw, ch);

    // Contain mode — fit the vial inside the canvas
    const scale = Math.min(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    const dx = (cw - dw) / 2;
    const dy = (ch - dh) / 2;

    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // --- Load + process frames ---
  function loadFrames() {
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.src = FRAME_PATH(i);
      img.onload = () => {
        frames[i - 1] = img;
        loaded++;
        const pct = Math.round((loaded / FRAME_COUNT) * 100);
        loaderBar.style.width = pct + "%";
        loaderPercent.textContent = pct + "%";

        if (loaded >= 10 && currentFrame === -1) {
          currentFrame = 0;
          resizeCanvas();
          drawFrame(0);
        }

        if (loaded === FRAME_COUNT) {
          onAllLoaded();
        }
      };
      img.onerror = () => {
        loaded++;
        if (loaded === FRAME_COUNT) onAllLoaded();
      };
    }
  }

  function onAllLoaded() {
    resizeCanvas();
    drawFrame(0);
    loader.classList.add("hidden");
    setTimeout(initAll, 300);
  }

  // --- Init everything ---
  function initAll() {
    animateHero();
    initVialScroll();
    initMarquee();
    initSectionAnimations();
    initCounters();
    initChartBars();
  }

  // --- Hero entrance ---
  function animateHero() {
    const label = heroSection.querySelector(".hero-label");
    const words = heroSection.querySelectorAll(".word");
    const tagline = heroSection.querySelector(".hero-tagline");
    const actions = heroSection.querySelector(".hero-actions");
    const scrollInd = heroSection.querySelector(".scroll-indicator");

    const tl = gsap.timeline({ delay: 0.15 });

    tl.to(heroVial, { opacity: 1, duration: 0.8, ease: "power2.out" })
      .to(label, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, "-=0.5")
      .to(words, { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power3.out" }, "-=0.3")
      .to(tagline, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }, "-=0.2")
      .to(actions, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, "-=0.3")
      .to(scrollInd, { opacity: 1, duration: 0.5, ease: "power2.out" }, "-=0.3");
  }

  // --- Vial scroll: play frames as user scrolls through hero (fully reversible) ---
  function initVialScroll() {
    ScrollTrigger.create({
      trigger: heroSection,
      start: "top top",
      end: "bottom top",
      scrub: 0.5,
      onUpdate: (self) => {
        // Map scroll progress to frame index — scrub maps 1:1, reversible
        const progress = Math.min(self.progress * 1.8, 1);
        const index = Math.min(Math.floor(progress * (FRAME_COUNT - 1)), FRAME_COUNT - 1);
        if (index !== currentFrame) {
          currentFrame = index;
          requestAnimationFrame(() => drawFrame(currentFrame));
        }
      },
    });
  }

  // --- Marquee ---
  function initMarquee() {
    const text = document.querySelector(".marquee-text");
    gsap.to(text, {
      xPercent: -30,
      ease: "none",
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
      },
    });
  }

  // --- Section scroll animations ---
  function initSectionAnimations() {
    const sections = document.querySelectorAll("[data-animation]");

    sections.forEach((section) => {
      const type = section.dataset.animation;
      const targets = section.querySelectorAll(
        ".section-label, .section-heading, .section-body, .section-text, .section-visual, " +
        ".cta-heading, .cta-body, .btn-primary, .cta-note, .stat, " +
        ".protocol-phase, .log-row, .chart-bar-group"
      );

      // Pick only direct animatable children to avoid double-animating
      const animTargets = targets.length > 0 ? targets : [section];

      const fromVars = { opacity: 0, duration: 0.9, stagger: 0.1, ease: "power3.out" };

      switch (type) {
        case "slide-left":
          Object.assign(fromVars, { x: -60 });
          break;
        case "slide-right":
          Object.assign(fromVars, { x: 60 });
          break;
        case "fade-up":
          Object.assign(fromVars, { y: 50 });
          break;
        case "scale-up":
          Object.assign(fromVars, { scale: 0.9, y: 30 });
          break;
        case "stagger-up":
          Object.assign(fromVars, { y: 40, stagger: 0.12 });
          break;
        case "clip-reveal":
          Object.assign(fromVars, { y: 40, duration: 1.1, ease: "power4.out" });
          break;
      }

      gsap.from(animTargets, {
        ...fromVars,
        scrollTrigger: {
          trigger: section,
          start: "top 80%",
          end: "top 40%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }

  // --- Counter animations ---
  function initCounters() {
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const decimals = parseInt(el.dataset.decimals || "0");
      const obj = { val: 0 };

      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: "power1.out",
        scrollTrigger: {
          trigger: el.closest(".stats-section"),
          start: "top 75%",
          toggleActions: "play none none reverse",
        },
        onUpdate: () => {
          el.textContent = obj.val.toFixed(decimals);
        },
      });
    });
  }

  // --- Chart bar animations ---
  function initChartBars() {
    document.querySelectorAll(".chart-bar").forEach((bar) => {
      const h = parseInt(bar.dataset.height || "50");
      gsap.to(bar, {
        height: h + "%",
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bar.closest(".chart-preview"),
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }

  // --- Go ---
  loadFrames();
})();
