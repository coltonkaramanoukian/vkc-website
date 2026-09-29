"use client";

import { useEffect } from "react";

/**
 * The home page's scroll motion (run 5, brand/BRAND.md "Motion"). Everything
 * the page says is in the HTML and visible without this component: it only
 * adds `html.js-motion`, which arms the few hidden starting states in
 * globals.css, and then plays them. Nothing runs under
 * prefers-reduced-motion: reduce, and nothing runs if the libraries fail to
 * load. GSAP and Lenis are imported on demand, after first paint.
 */
export function HomeMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup = () => {};
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const root = document.documentElement;
      root.classList.add("js-motion");

      const lenis = new Lenis({ lerp: 0.1 });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      const ctx = gsap.context(() => {
        // What we fill: sideways while the section holds, from 900px. Created
        // first, so every trigger below it measures with the pin in place.
        const mm = gsap.matchMedia();
        mm.add("(min-width: 900px)", () => {
          const section = document.querySelector<HTMLElement>("#fill");
          const reel = document.querySelector<HTMLElement>("#fill .reel");
          if (!section || !reel) return;
          const distance = () => Math.max(0, reel.scrollWidth - window.innerWidth);
          gsap.to(reel, {
            x: () => -distance(),
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${distance()}`,
              pin: true,
              scrub: 1,
              invalidateOnRefresh: true,
            },
          });
        });

        // Hero: the title rises line by line, the picture settles.
        const hero = gsap.timeline({ defaults: { ease: "expo.out" } });
        hero
          .from(".cine-hero-media", { scale: 1.2, duration: 2.2, ease: "power2.out" }, 0)
          .from(".cine-title .row > span", { yPercent: 110, duration: 1.2, stagger: 0.1 }, 0.1)
          .from(".cine-hero .eyebrow, .cine-hero-foot > *", { y: 28, opacity: 0, duration: 1, stagger: 0.08 }, 0.45);
        gsap.to(".cine-hero-media", {
          yPercent: 16,
          ease: "none",
          scrollTrigger: { trigger: ".cine-hero", start: "top top", end: "bottom top", scrub: true },
        });

        // The statement fills word by word as it is read.
        gsap.utils.toArray<HTMLElement>(".statement").forEach((el) => {
          const words = el.querySelectorAll(".w");
          if (!words.length) return; // straight talk reuses the style without the word spans
          gsap.to(words, {
            color: "var(--vkc-ink)",
            stagger: 0.05,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true },
          });
        });

        // Section heads rise once.
        gsap.utils.toArray<HTMLElement>("[data-rise]").forEach((el) => {
          gsap.from(el.children, {
            y: 44,
            opacity: 0,
            duration: 1,
            stagger: 0.08,
            ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        // Service films open from a smaller frame (from 900px: on a phone the
        // inset would crop the copy while it opens).
        mm.add("(min-width: 900px)", () => gsap.utils.toArray<HTMLElement>(".film").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(8% 5% 8% 5% round 40px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 28px)",
              ease: "none",
              scrollTrigger: { trigger: el, start: "top 95%", end: "top 35%", scrub: true },
            },
          );
          gsap.fromTo(
            el.querySelector(".film-media"),
            { yPercent: -6 },
            { yPercent: 6, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
          );
        }));

        // Steps: the rail fills like a container to its line.
        gsap.to(".rail-steps .rail > i", {
          scaleY: 1,
          ease: "none",
          scrollTrigger: { trigger: ".rail-steps", start: "top 70%", end: "bottom 60%", scrub: true },
        });

        // Finale title rises.
        gsap.from(".finale-title", {
          yPercent: 25,
          opacity: 0,
          duration: 1.3,
          ease: "expo.out",
          scrollTrigger: { trigger: ".finale", start: "top 85%", once: true },
        });
      });

      ScrollTrigger.sort();
      ScrollTrigger.refresh();

      // Why: the picture beside the points follows the point being read.
      const pictures = document.querySelectorAll<HTMLElement>(".why-stick .why-pic");
      const observer = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = (entry.target as HTMLElement).dataset.index;
            pictures.forEach((picture) => picture.toggleAttribute("data-on", picture.dataset.index === index));
          }),
        { rootMargin: "-45% 0px -45% 0px" },
      );
      document.querySelectorAll(".why-point").forEach((point) => observer.observe(point));

      // In-page links scroll through Lenis so the two scroll engines never
      // fight. The skip link keeps its native jump: its job is to move focus
      // to <main> (focusable via tabIndex=-1 in page-shell.tsx, which is what
      // lets the browser's fragment navigation land focus there at all).
      // Everything else lands just under the header (the same
      // scroll-padding-top the CSS gives a native jump), takes about a
      // second however far it is, writes the hash so the URL and the back
      // button still mean something, and hands focus to the target when it
      // arrives.
      const headerOffset = () => (document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 64) + 16;
      const onAnchor = (event: MouseEvent) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
        const id = link?.getAttribute("href");
        if (!link || !id || id.length < 2 || link.classList.contains("skip-link")) return;
        const target = document.querySelector<HTMLElement>(id);
        if (!target) return;
        event.preventDefault();
        history.pushState(null, "", id);
        // The browser may have just scrolled on its own (focus moving to the
        // link, a click scrolling it into view); Lenis hears of that a frame
        // later and would measure from where it thinks the page is. Start from
        // where the page actually is, and aim at an absolute position.
        const y = window.scrollY;
        lenis.scrollTo(y, { immediate: true, force: true });
        lenis.scrollTo(target.getBoundingClientRect().top + y - headerOffset(), {
          duration: 1.1,
          onComplete: () => {
            if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
            target.focus({ preventScroll: true });
          },
        });
      };
      document.addEventListener("click", onAnchor);
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);

      cleanup = () => {
        window.removeEventListener("load", refresh);
        document.removeEventListener("click", onAnchor);
        observer.disconnect();
        ctx.revert();
        gsap.ticker.remove(raf);
        lenis.destroy();
        root.classList.remove("js-motion");
      };
    })().catch(() => {
      document.documentElement.classList.remove("js-motion");
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
