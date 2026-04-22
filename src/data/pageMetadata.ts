export const SITE_URL = "https://ankitesharora.com";

export const DEFAULT_PAGE_DESCRIPTION =
  "Portfolio of Ankitesh Arora, a senior software engineer focused on frontend architecture, web performance, and production-grade product engineering.";

export const pageMetadata = {
  home: {
    title: "Ankitesh Arora | Senior Software Engineer",
    path: "/",
    description:
      "Portfolio of Ankitesh Arora featuring frontend engineering experience, selected work history, technical strengths, and contact links.",
  },
  blog: {
    title: "Blog | Ankitesh Arora",
    path: "/blog",
    description:
      "Upcoming writing from Ankitesh Arora on frontend engineering, system design, scaling web apps, and technical experiments.",
  },
  resume: {
    title: "Resume | Ankitesh Arora",
    path: "/resume",
    description:
      "Preview and download Ankitesh Arora's resume covering senior frontend engineering experience, product work, and technical leadership.",
  },
  bot: {
    title: "Bot Interface | Ankitesh Arora",
    path: "/bot",
    description:
      "Experimental bot interface for Ankitesh Arora's portfolio, presented as a terminal-style interactive page.",
  },
  notFound: {
    title: "404 | Ankitesh Arora",
    path: "/404",
    description:
      "Page not found on Ankitesh Arora's portfolio. Return to the homepage, resume, or blog.",
  },
} as const;
