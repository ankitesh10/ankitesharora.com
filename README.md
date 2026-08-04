# ankitesharora.com

Source for [ankitesharora.com](https://ankitesharora.com) — Ankitesh Arora's personal portfolio site. Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), featuring a terminal-style AI "bot" interface powered by [xterm.js](https://xtermjs.org) and the [Vercel AI SDK](https://sdk.vercel.ai).

## ✨ Features

- Fast, static-first portfolio built on Astro
- Tailwind CSS v4 for styling
- Interactive terminal UI (`/bot`) that streams responses from an AI backend via xterm.js
- Resume, blog, and archive pages

## 📁 Project structure

```text
/
├── public/                  # Static assets (favicon, resume PDF, robots.txt, etc.)
├── src/
│   ├── components/          # Reusable Astro components
│   ├── data/                # Page metadata (titles, descriptions, paths)
│   ├── layouts/              # Shared page layout(s)
│   ├── lib/bot/              # Terminal session, streaming, and prompt logic for the bot interface
│   ├── pages/                # File-based routes (index, blog, resume, bot, 404)
│   └── styles/                # Global styles
├── astro.config.mjs
└── package.json
```

## 🚀 Getting started

**Requirements:** Node.js `>=22.12.0` and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:4321`.

### Environment variables

The bot interface (`/bot`) talks to an external API. Create a `.env` file in the project root:

```sh
PUBLIC_API_URL=http://localhost:PORT
```

Without a reachable `PUBLIC_API_URL`, the rest of the site works normally but the terminal page won't be able to connect.

## 🧞 Commands

| Command         | Action                                       |
| :--------------- | :-------------------------------------------- |
| `pnpm install`   | Install dependencies                          |
| `pnpm dev`       | Start local dev server at `localhost:4321`    |
| `pnpm build`     | Build production site to `./dist/`            |
| `pnpm preview`   | Preview the production build locally          |
| `pnpm astro ...` | Run Astro CLI commands (e.g. `astro check`)   |

## 🛠️ Tech stack

- [Astro](https://astro.build) — static site generation & routing
- [Tailwind CSS v4](https://tailwindcss.com) — styling
- [xterm.js](https://xtermjs.org) — terminal emulator for the bot interface
- [Vercel AI SDK](https://sdk.vercel.ai) — streaming message types/utilities
- [Prettier](https://prettier.io) (with the Astro plugin) — formatting

## 🤝 Contributing

This is a personal portfolio, so large feature contributions aren't expected — but bug reports, typo fixes, and accessibility/performance improvements are welcome via issues and pull requests.

1. Fork the repo and create a branch from `main`
2. Run `pnpm dev` and verify your change
3. Run `pnpm astro check` and format with Prettier before opening a PR
4. Open a PR describing the change and why it's needed

## 📄 License

Source code is licensed under [MIT](./LICENSE). Personal content (writing, resume, images, and branding) is not licensed for reuse — please don't republish it as your own.
