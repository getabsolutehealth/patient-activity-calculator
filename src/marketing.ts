/**
 * Marketing config — single source of truth for every funnel URL and copy
 * fragment the page renders. Edit here and redeploy; no other file touches
 * these strings.
 *
 * Funnel posture (office-hours 2026-06-06): calibrated top-of-funnel. The tool's
 * audience (any chiro tracking retention) is ADJACENT to the Foundations buyer,
 * so EMAIL + PODCAST are the primary CTAs and the course gets one soft touch.
 * Email capture is a link-out to thecranialdoc.com (already a capture page) —
 * never an on-page form — so the "nothing leaves your browser" promise stays
 * literally true.
 *
 * TODO before deploy: confirm the canonical podcast + training URLs (TODOS.md).
 */

export const MARKETING = {
  brand: {
    wordmark: "THE CRANIAL DOC",
    toolName: "Patient Activity Calculator",
  },
  email: {
    label: "Join the list",
    // Homepage IS the capture page (form above the fold). Link-out, no on-page form.
    url: "https://thecranialdoc.com",
  },
  podcast: {
    label: "Podcast",
    title: "The Cranial Doc Podcast",
    description: "Clinical cases, practice systems, and the business of doing this work.",
    url: "https://thecranialdoc.com/podcast",
  },
  course: {
    // Soft touch — one line in the hero, one link in the footer. Not pushed.
    label: "Foundations course",
    line: "Built by a practice that runs this every day.",
    url: "https://thecranialdoc.com/training",
  },
  hero: {
    eyebrow: "PRACTICE ANALYTICS",
    title: "Patient Activity Calculator",
    subtitle:
      "Upload two monthly adjustment exports to see active patients, inactives, churn, new conversions, and net momentum — with one-click CSV downloads.",
  },
  privacy: {
    badge: "LOCAL ONLY",
    disclaimer:
      "Processing happens entirely in your browser. No patient data is uploaded, transmitted, or stored. You're responsible for files you download to your device. Not legal or HIPAA advice.",
  },
  footer: {
    copyright: "© 2026 THE CRANIAL DOC · THECRANIALDOC.COM",
  },
} as const;

export type Marketing = typeof MARKETING;
