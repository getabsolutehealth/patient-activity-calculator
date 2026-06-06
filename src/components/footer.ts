/**
 * Footer — ink-graphite bezel band closing the page. All three offers (email,
 * podcast, course) get equal billing here, plus the privacy disclaimer and
 * copyright. Pure render.
 */

import { el } from "../dom";
import { MARKETING } from "../marketing";

import "./footer.css";

function link(href: string, label: string): HTMLElement {
  return el(
    "a",
    { href, class: "site-footer__link", target: "_blank", rel: "noopener noreferrer" },
    label,
  );
}

export function createFooter(): { el: HTMLElement } {
  const root = el(
    "footer",
    { class: "site-footer" },
    el(
      "div",
      { class: "container site-footer__inner" },
      el(
        "nav",
        { class: "site-footer__links", "aria-label": "The Cranial Doc" },
        link(MARKETING.email.url, MARKETING.email.label),
        link(MARKETING.podcast.url, MARKETING.podcast.label),
        link(MARKETING.course.url, MARKETING.course.label),
      ),
      el("p", { class: "site-footer__privacy" }, MARKETING.privacy.disclaimer),
      el("p", { class: "site-footer__copy" }, MARKETING.footer.copyright),
    ),
  );
  return { el: root };
}
