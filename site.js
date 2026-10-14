// Name, intro and footer links live in content/site.json (editable from /write.html).
// These are only the fallback if that file can't be loaded.
const SITE = {
  name: "Kaden Priebe",
  intro: "",
  links: [],
};

const NAV = [
  { href: "writing.html", label: "Writing", page: "writing" },
  { href: "reading.html", label: "Reading", page: "reading" },
  { href: "notes.html", label: "Notes", page: "notes" },
  { href: "about.html", label: "About", page: "about" },
];

const STATUS_LABELS = { reading: "Reading now", finished: "Finished", want: "Want to read" };

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function fmtDate(iso, opts = { year: "numeric", month: "short", day: "numeric" }) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString(undefined, opts);
}

const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

async function load(path, as = "json") {
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
  return as === "json" ? res.json() : res.text();
}

function md(text) {
  return window.marked ? marked.parse(text) : `<pre>${esc(text)}</pre>`;
}

// "Write" only appears in browsers that have the GitHub token saved (see write.js),
// i.e. just on your devices. Visitors never see it.
const isOwner = () => { try { return !!localStorage.getItem("gh_token"); } catch { return false; } };

function renderChrome(page) {
  const nav = [...NAV, ...(isOwner() || page === "write" ? [{ href: "write.html", label: "Write", page: "write" }] : [])].map(
    (n) => `<a href="${n.href}"${n.page === page ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("");
  document.querySelector("header").innerHTML = `
    <a class="site-name" href="index.html">${esc(SITE.name)}</a>
    <div class="header-right">
      <nav>${nav}</nav>
      <button class="theme-toggle" type="button"></button>
    </div>`;
  setupThemeToggle(document.querySelector(".theme-toggle"));
  const links = SITE.links.map((l) => `<a href="${esc(l.url)}">${esc(l.label)}</a>`).join(" · ");
  document.querySelector("footer").innerHTML = `
    <span>© ${new Date().getFullYear()} ${esc(SITE.name)}</span>
    <span>${links}</span>`;
}

// ─── Light / dark toggle ─────────────────────────────────────────────
// The saved choice is applied early by a tiny script in each page's <head>
// so there's no flash of the wrong colors on load.

const ICONS = {
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
};

const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const currentTheme = () => document.documentElement.dataset.theme || (systemDark.matches ? "dark" : "light");

function setupThemeToggle(btn) {
  const paint = () => {
    const dark = currentTheme() === "dark";
    btn.innerHTML = dark ? ICONS.sun : ICONS.moon;
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    btn.title = btn.getAttribute("aria-label");
  };
  btn.addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
    paint();
  });
  systemDark.addEventListener("change", paint);
  paint();
}

// ─── List item templates ─────────────────────────────────────────────

const postItem = (p) => `
  <li class="row">
    <a href="post.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
    <time>${fmtDate(p.date, { month: "short", day: "numeric" })}</time>
  </li>`;

// Optional outside link on a post or note. Only http(s) and mailto links are rendered.
function extLink(url) {
  if (!/^(https?:|mailto:)/i.test(url || "")) return "";
  let label = url;
  try { label = new URL(url).hostname.replace(/^www\./, "") || url; } catch {}
  return `<a class="ext" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
}

const bookItem = (b) => `
  <li class="book">
    <div class="book-head">
      <span class="book-title">${b.link ? `<a href="${esc(b.link)}">${esc(b.title)}</a>` : esc(b.title)}</span>
      ${b.status ? `<span class="tag tag-${esc(b.status)}">${STATUS_LABELS[b.status] || esc(b.status)}</span>` : ""}
    </div>
    <div class="meta">${[b.author, b.type, b.date && fmtDate(b.date, { year: "numeric", month: "short" })]
      .filter(Boolean).map(esc).join(" · ")}</div>
    ${b.note ? `<div class="note-body">${md(b.note)}</div>` : ""}
  </li>`;

const noteItem = (n) => `
  <li class="note">
    <time>${fmtDate(n.date)}</time>
    <div class="note-body">${md(n.text)}</div>
    ${extLink(n.link)}
  </li>`;

// ─── Pages ───────────────────────────────────────────────────────────

const pages = {
  async home(main) {
    const [posts, reading, notes] = await Promise.all([
      load("content/posts.json"),
      load("content/reading.json"),
      load("content/notes.json"),
    ]);
    posts.sort(byDateDesc);
    reading.sort(byDateDesc);
    notes.sort(byDateDesc);
    const current = reading.filter((b) => b.status === "reading");
    const recent = (current.length ? current : reading).slice(0, 3);

    main.innerHTML = `
      <section class="hero">
        <h1>${esc(SITE.name)}</h1>
        <p class="lede">${esc(SITE.intro)}</p>
      </section>

      <section>
        <h2><a href="writing.html">Latest writing</a></h2>
        ${posts.length ? `<ul class="rows">${posts.slice(0, 5).map(postItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
      </section>

      <section>
        <h2><a href="reading.html">${current.length ? "Currently reading" : "Recently read"}</a></h2>
        ${recent.length ? `<ul class="books">${recent.map(bookItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
      </section>

      <section>
        <h2><a href="notes.html">Lately</a></h2>
        ${notes.length ? `<ul class="notes">${notes.slice(0, 3).map(noteItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
      </section>`;
  },

  async writing(main) {
    const posts = (await load("content/posts.json")).sort(byDateDesc);
    const years = {};
    for (const p of posts) (years[p.date.slice(0, 4)] ||= []).push(p);
    main.innerHTML = `
      <h1>Writing</h1>
      ${Object.keys(years).sort().reverse().map((y) => `
        <section>
          <h2>${y}</h2>
          <ul class="rows">${years[y].map(postItem).join("")}</ul>
        </section>`).join("") || `<p class="empty">Nothing yet.</p>`}`;
  },

  async post(main) {
    const slug = new URLSearchParams(location.search).get("p");
    const posts = await load("content/posts.json");
    const post = posts.find((p) => p.slug === slug);
    if (!post) {
      main.innerHTML = `<h1>Not found</h1><p>No post called “${esc(slug)}”. <a href="writing.html">See all writing →</a></p>`;
      return;
    }
    const body = await load(`content/posts/${encodeURIComponent(slug)}.md`, "text");
    document.title = `${post.title} — ${SITE.name}`;
    main.innerHTML = `
      <article>
        <header class="post-head">
          <h1>${esc(post.title)}</h1>
          <time>${fmtDate(post.date, { year: "numeric", month: "long", day: "numeric" })}</time>
          ${extLink(post.link)}
        </header>
        <div class="prose">${md(body)}</div>
      </article>
      <p class="back"><a href="writing.html">← All writing</a></p>`;
  },

  async reading(main) {
    const items = (await load("content/reading.json")).sort(byDateDesc);
    const filters = ["all", "reading", "finished", "want"];
    const draw = (f) => {
      const shown = f === "all" ? items : items.filter((b) => b.status === f);
      main.querySelector(".books").innerHTML = shown.map(bookItem).join("") || `<p class="empty">Nothing here yet.</p>`;
      main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === f));
    };
    main.innerHTML = `
      <h1>Reading</h1>
      <p class="lede">Books, articles, and other things I've read — with what I thought of them.</p>
      <div class="filters">${filters.map((f) => `<button data-f="${f}">${f === "all" ? "All" : STATUS_LABELS[f]}</button>`).join("")}</div>
      <ul class="books"></ul>`;
    main.querySelector(".filters").addEventListener("click", (e) => e.target.dataset.f && draw(e.target.dataset.f));
    draw("all");
  },

  async notes(main) {
    const notes = (await load("content/notes.json")).sort(byDateDesc);
    main.innerHTML = `
      <h1>Notes</h1>
      <p class="lede">Short thoughts, quotes, half-ideas. Less polished than the writing.</p>
      ${notes.length ? `<ul class="notes">${notes.map(noteItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}`;
  },

  async write() {}, // filled in by write.js

  async about(main) {
    const body = await load("content/about.md", "text");
    main.innerHTML = `<article class="prose">${md(body)}</article>`;
  },
};

// ─── Boot ────────────────────────────────────────────────────────────

(async () => {
  const page = document.body.dataset.page;
  try { Object.assign(SITE, await load("content/site.json")); } catch {}
  renderChrome(page);
  const main = document.querySelector("main");
  try {
    await pages[page](main);
  } catch (err) {
    const fileHint =
      location.protocol === "file:"
        ? `<p>It looks like you opened the file directly. Browsers block that, so start a local server instead:</p>
           <pre>cd ~/kadenpriebe.github.io && python3 -m http.server 8000</pre>
           <p>then visit <a href="http://localhost:8000">localhost:8000</a>.</p>`
        : `<p>${esc(err.message)}</p>`;
    main.innerHTML = `<h1>Something went wrong</h1>${fileHint}`;
    console.error(err);
  }
})();
