/**
 * Header — ink-graphite bezel band. Wordmark + LOCAL ONLY pill on the left;
 * the primary funnel CTAs (Podcast, Join the list) on the right. Pure render.
 */

import { el } from "../dom";
import { MARKETING } from "../marketing";

import "./header.css";

export function createHeader(): { el: HTMLElement } {
  const brand = el(
    "div",
    { class: "site-header__brand" },
    el("span", { class: "site-header__wordmark" }, MARKETING.brand.wordmark),
    el(
      "span",
      { class: "site-header__pill", title: MARKETING.privacy.disclaimer },
      el("span", { class: "site-header__dot", "aria-hidden": "true" }),
      MARKETING.privacy.badge,
    ),
  );

  const nav = el(
    "nav",
    { class: "site-header__nav", "aria-label": "The Cranial Doc" },
    el(
      "a",
      {
        href: MARKETING.podcast.url,
        class: "site-header__link",
        target: "_blank",
        rel: "noopener noreferrer",
      },
      MARKETING.podcast.label,
    ),
    el(
      "a",
      {
        href: MARKETING.email.url,
        class: "site-header__cta",
        target: "_blank",
        rel: "noopener noreferrer",
      },
      `${MARKETING.email.label} →`,
    ),
  );

  const root = el(
    "header",
    { class: "site-header" },
    el("div", { class: "container site-header__inner" }, brand, nav),
  );
  return { el: root };
}
