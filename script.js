(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const avatar = document.querySelector(".avatar");
  const art = avatar.querySelector(".avatar-art");
  const bubble = avatar.querySelector(".avatar-bubble");

  /* Speech bubble */
  let bubbleTimer;
  function say(text, ms = 3800) {
    bubble.textContent = text;
    bubble.classList.add("is-visible");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => bubble.classList.remove("is-visible"), ms);
  }

  /* Scroll reveal */
  const revealTargets = document.querySelectorAll(
    ".project, .experience-row, .about-panel, .contact-panel"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));

  /* Current section: nav highlight, avatar mood and message */
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const moods = {
    home: "happy", work: "thinking", experience: "happy",
    community: "happy", about: "happy", contact: "excited",
  };
  const sectionLines = {
    home: "Hi, I'm Gloria! Click me to say hi.",
    work: "Take a look at what I've built.",
    experience: "This is where I've been learning by doing.",
    community: "I love helping young people learn to code.",
    about: "A little more about me.",
    contact: "Let's work together!",
  };
  let currentSection = null;

  function setSection(id) {
    if (id === currentSection) return;
    currentSection = id;
    navLinks.forEach((a) => {
      if (a.getAttribute("href") === "#" + id) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    avatar.dataset.mood = moods[id] || "happy";
    if (avatar.open) say(sectionLines[id] || "");
  }

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setSection(entry.target.id);
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  document.querySelectorAll("main section[id]").forEach((s) => sectionObserver.observe(s));

  /* Click: wave, hop, cycle through lines */
  /* Floating code while she types */
    const codeLayer = art.querySelector(".avatar-code");
    const glyphs = ["</>", "{}", "=>", ";", "01", "()", "[]", "&&", "//", "def", "</"];
    const colors = ["#b84681", "#8c6fd8", "#4aa3c7", "#d774a4"];
    const pick = (list) => list[Math.floor(Math.random() * list.length)];

    function spawnCode() {
    if (codeLayer.children.length > 14) return;
    const bit = document.createElement("span");
    bit.className = "code-bit";
    bit.textContent = pick(glyphs);
    bit.style.setProperty("--x", -40 + Math.random() * 140 + "%");
    bit.style.setProperty("--dx", Math.random() * 60 - 30 + "px");
    bit.style.setProperty("--c", pick(colors));
    bit.addEventListener("animationend", () => bit.remove());
    codeLayer.append(bit);
    }

    function codeLoop() {
    if (!reduceMotion && !document.hidden && avatar.open) spawnCode();
    setTimeout(codeLoop, art.classList.contains("is-typing") ? 160 : 950);
    }
    codeLoop();

    /* Click: she types faster and says a line */
    const clickLines = [
    "Hi! I'm Gloria.",
    "I'm open to a Winter 2027 co-op!",
    "I speak English and French.",
    "My résumé is in the contact section.",
    "Thanks for stopping by!",
    ];
    let clickIndex = 0;
    let burstTimer;

    art.addEventListener("click", () => {
    art.classList.add("is-typing");
    clearTimeout(burstTimer);
    burstTimer = setTimeout(() => art.classList.remove("is-typing"), 2600);
    say(clickLines[clickIndex]);
    clickIndex = (clickIndex + 1) % clickLines.length;
    });

  /* Eyes follow the cursor (mouse only) */
  if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    let ticking = false;
    window.addEventListener("pointermove", (e) => {
      if (ticking || !avatar.open) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = art.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2);
        const dy = (e.clientY - (r.top + r.height * 0.28)) / (window.innerHeight / 2);
        const clamp = (n) => Math.max(-1, Math.min(1, n));
        art.style.setProperty("--lx", clamp(dx) * 3 + "px");
        art.style.setProperty("--ly", clamp(dy) * 2 + "px");
        ticking = false;
      });
    });
  }
})();



/* Theme toggle: pink by default, silver (dark) optional, remembered */
(() => {
  const root = document.documentElement;
  const btn = document.querySelector(".theme-toggle");
  if (!btn) return;

  let dark = root.dataset.theme === "silver";

  function apply() {
    if (dark) root.dataset.theme = "silver";
    else delete root.dataset.theme;
    btn.setAttribute("aria-checked", String(dark));
  }
  apply();

  btn.addEventListener("click", () => {
    dark = !dark;
    apply();
    try { localStorage.setItem("theme", dark ? "silver" : "pink"); } catch (e) {}
  });
})();

/* Project reveal: hover with a mouse, tap on touch screens */
(() => {
  document.querySelectorAll(".project-preview").forEach((preview) => {
    const wheel = preview.querySelector(".tools-wheel");
    if (!wheel) return;

    [...wheel.children].forEach((li, i) => {
      li.style.setProperty("--i", i);
      li.style.setProperty("--n", wheel.children.length);
    });

    preview.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") preview.classList.add("is-open");
    });
    preview.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "mouse") preview.classList.remove("is-open");
    });
    preview.addEventListener("click", (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") preview.classList.toggle("is-open");
    });
  });
})();