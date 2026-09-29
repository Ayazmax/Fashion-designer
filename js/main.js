(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;

  const loader = document.querySelector(".loader");
  const revealPage = () => {
    root.classList.add("is-ready");
    if (!loader) return;
    loader.setAttribute("aria-hidden", "true");
    window.setTimeout(() => loader.remove(), 1000);
  };

  if (reduced) {
    revealPage();
  } else {
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const pageReady = new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    const timeout = new Promise((resolve) => window.setTimeout(resolve, 2400));
    Promise.race([Promise.all([fontsReady, pageReady]), timeout]).then(() => {
      window.setTimeout(revealPage, 420);
    });
  }

  const progress = document.querySelector(".progress");
  const nav = document.querySelector(".nav");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;
    if (progress) progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    if (nav) nav.classList.toggle("is-solid", y > window.innerHeight * 0.62);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const toggle = document.querySelector(".nav-toggle");
  const setOpen = (open) => {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  };
  toggle?.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  const motionItems = document.querySelectorAll(".reveal, .reveal-img");
  if (reduced) {
    motionItems.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    motionItems.forEach((el, index) => {
      el.style.setProperty("--d", `${(index % 4) * 80}ms`);
      io.observe(el);
    });
  }

  if (!reduced) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.count || 0);
          const suffix = el.dataset.suffix || "";
          const start = performance.now();
          const duration = 1100;
          const tick = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.6 }
    );
    document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));
  }

  const filterButtons = [...document.querySelectorAll(".filter")];
  const lookButtons = [...document.querySelectorAll(".look")];

  const applyFilter = (cat) => {
    filterButtons.forEach((btn) => {
      const on = btn.dataset.filter === cat;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", String(on));
    });
    lookButtons.forEach((look) => {
      look.hidden = cat !== "all" && look.dataset.cat !== cat;
    });
    document.querySelector(".looks")?.classList.toggle("is-filtered", cat !== "all");
  };

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => applyFilter(btn.dataset.filter));
  });

  document.querySelectorAll(".season").forEach((card) => {
    card.addEventListener("click", () => {
      applyFilter("all");
      const id = (card.getAttribute("href") || "").slice(1);
      const el = document.getElementById(id);
      lookButtons.forEach((look) => look.classList.remove("is-picked"));
      if (!el) return;
      el.classList.add("is-picked");
      window.setTimeout(() => el.classList.remove("is-picked"), 1800);
    });
  });

  const dialog = document.querySelector(".lightbox");
  if (dialog) {
    const shot = dialog.querySelector(".lightbox-img");
    const title = dialog.querySelector(".lightbox-title");
    const meta = dialog.querySelector(".lightbox-meta");
    const copy = dialog.querySelector(".lightbox-copy");
    const count = dialog.querySelector(".lightbox-count");
    let index = 0;

    const visibleLooks = () => lookButtons.filter((el) => !el.hidden);

    const renderLook = (next) => {
      const items = visibleLooks();
      if (!items.length) return;
      index = (next + items.length) % items.length;
      const el = items[index];
      const img = el.querySelector("img");
      shot.src = img.currentSrc || img.src;
      shot.alt = img.alt;
      title.textContent = el.dataset.title || "";
      meta.textContent = el.dataset.meta || "";
      copy.textContent = el.dataset.copy || "";
      count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
    };

    const openLook = (el) => {
      const items = visibleLooks();
      renderLook(Math.max(0, items.indexOf(el)));
      if (!dialog.open) dialog.showModal();
      document.body.classList.add("modal-open");
    };

    lookButtons.forEach((el) => el.addEventListener("click", () => openLook(el)));
    dialog.querySelector(".lightbox-next")?.addEventListener("click", () => renderLook(index + 1));
    dialog.querySelector(".lightbox-prev")?.addEventListener("click", () => renderLook(index - 1));
    dialog.querySelector(".lightbox-close")?.addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => document.body.classList.remove("modal-open"));
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    window.addEventListener("keydown", (event) => {
      if (!dialog.open) {
        if (event.key === "Escape") setOpen(false);
        return;
      }
      if (event.key === "ArrowRight") renderLook(index + 1);
      if (event.key === "ArrowLeft") renderLook(index - 1);
    });
  } else {
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  if (fine && !reduced) {
    const ring = document.querySelector(".cursor");
    const dot = document.querySelector(".cursor-dot");
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let rx = x;
    let ry = y;

    window.addEventListener("pointermove", (event) => {
      root.classList.add("has-cursor", "is-moving");
      x = event.clientX;
      y = event.clientY;
      if (dot) dot.style.transform = `translate(${x}px, ${y}px)`;
      const hot = event.target.closest("a, button");
      const typing = event.target.closest("input, textarea, select, dialog");
      ring?.classList.toggle("is-hot", Boolean(hot) && !typing);
      if (ring) ring.style.opacity = typing ? "0" : "";
      if (dot) dot.style.opacity = typing ? "0" : "";
    }, { passive: true });

    const follow = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(follow);
    };
    follow();

    document.querySelectorAll("[data-magnetic]").forEach((node) => {
      node.addEventListener("pointermove", (event) => {
        const rect = node.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        node.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      node.addEventListener("pointerleave", () => {
        node.style.transform = "";
      });
    });

    document.querySelectorAll(".season").forEach((card) => {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transition = "none";
        card.style.transform = `perspective(900px) rotateX(${(-py * 4).toFixed(2)}deg) rotateY(${(px * 5).toFixed(2)}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transition = "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)";
        card.style.transform = "";
      });
    });
  }

  const form = document.querySelector(".booking");
  const thanks = document.querySelector(".thanks");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    form.hidden = true;
    if (thanks) thanks.hidden = false;
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
