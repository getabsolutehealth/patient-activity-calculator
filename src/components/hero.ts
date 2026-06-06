/**
 * Hero — tool-focused. Eyebrow + title + subtitle, plus ONE soft course line
 * (the calibrated single course touch). The tool is the star; no promo card.
 */

import { el } from "../dom";
import { MARKETING } from "../marketing";

import "./hero.css";

export function createHero(): { el: HTMLElement } {
  const root = el(
    "section",
    { class: "hero", "aria-labelledby": "hero-title" },
    el(
      "div",
      { class: "container hero__inner" },
      el("p", { class: "eyebrow" }, MARKETING.hero.eyebrow),
      el("h1", { class: "hero__title", id: "hero-title" }, MARKETING.hero.title),
      el("p", { class: "hero__subtitle" }, MARKETING.hero.subtitle),
      el(
        "p",
        { class: "hero__course" },
        `${MARKETING.course.line} `,
        el(
          "a",
          {
            href: MARKETING.course.url,
            target: "_blank",
            rel: "noopener noreferrer",
            class: "hero__course-link",
          },
          `${MARKETING.course.label} →`,
        ),
      ),
    ),
  );
  return { el: root };
}
