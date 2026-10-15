// Name, intro and footer links live in content/site.json, and the line under each page
// heading in content/ledes.json (both editable on the site when signed in).
// These are only the fallback if those files can't be loaded.
const SITE = {
  name: "Kaden Priebe",
  intro: "",
  links: [],
  ledes: {},
};

const NAV = [
  { href: "writing.html", label: "Writing", page: "writing" },
  { href: "reading.html", label: "Reading", page: "reading" },
  { href: "notes.html", label: "Drafts", page: "notes" },
  { href: "story.html", label: "My story", page: "about" },
];

const STATUS_LABELS = {
  reading: "Reading now",
  paused: "Started, coming back to it",
  finished: "Finished",
  skimmed: "Skimmed",
  dropped: "Started, probably won't finish",
  want: "Want to read",
};

const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function fmtDate(iso, opts = { year: "numeric", month: "short", day: "numeric" }) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d || 1).toLocaleDateString(undefined, opts);
}

const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

// In your own browser (token saved), content is read straight from the GitHub repo,
// so edits show up the moment you save. Visitors read the built site, which GitHub
// Pages updates about a minute after each change.
const REPO = "kadenpriebe/kadenpriebe.github.io";
const ownerToken = () => { try { return localStorage.getItem("gh_token") || ""; } catch { return ""; } };
// You're the owner in any browser where your GitHub token is saved. Only then do the
// edit buttons, the + button and owner.js's editing tools appear.
const OWNER = !!ownerToken();

// Right after you save, owner.js remembers what it wrote for a couple of minutes, so the
// page shows your change instantly even if GitHub is a second behind.
function freshCopy(path) {
  try {
    const e = JSON.parse(sessionStorage.getItem("owner_fresh") || "{}")[path];
    if (e && Date.now() - e.t < 120000) return e;
  } catch {}
  return null;
}

async function load(path, as = "json") {
  const token = ownerToken();
  const fresh = token && freshCopy(path);
  if (fresh) {
    if (fresh.text === null) throw new Error(`Couldn't load ${path} (404)`);
    return as === "json" ? JSON.parse(fresh.text) : fresh.text;
  }
  if (token && path.startsWith("content/")) {
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}?ref=main`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.raw+json" },
      });
      if (res.ok) return as === "json" ? res.json() : res.text();
    } catch {}
    // Anything goes wrong (offline, token revoked…): fall back to the built site below.
  }
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error(`Couldn't load ${path} (${res.status})`);
  return as === "json" ? res.json() : res.text();
}

function md(text) {
  return window.marked ? marked.parse(tangents(text)) : `<pre>${esc(text)}</pre>`;
}

// ((Text in double parentheses)) becomes a tangent: a small button readers tap to open it.
// Innermost first, so tangents can go inside tangents. Markdown still works inside.
function tangents(text) {
  // In ")))" the tangent closes on the last two, so a link or (aside) can end right before it.
  const inner = /\(\(((?:(?!\(\(|\)\)(?!\)))[^])*?)\)\)(?!\))/g;
  for (let prev; prev !== text; ) {
    prev = text;
    text = text.replace(inner, (all, body) => (!body.trim() || /\n\s*\n/.test(body) ? all :
      `<span class="tangent"><button type="button" class="tangent-toggle" aria-expanded="false">tangent</button><span class="tangent-body">${body.trim()}</span></span>`));
  }
  return text;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".tangent-toggle");
  if (!btn) return;
  const open = btn.parentElement.classList.toggle("open");
  btn.setAttribute("aria-expanded", open);
});

// Edit / Delete buttons, only rendered for the owner. owner.js handles the clicks.
const ownerCtl = (attrs, { del = true, label = "Edit" } = {}) =>
  OWNER
    ? `<div class="owner-ctl"><button type="button" data-act="edit" ${attrs}>${label}</button>${
        del ? `<button type="button" data-act="delete" ${attrs}>Delete</button>` : ""
      }</div>`
    : "";

// The line under a page's heading. Inline markdown works, e.g. [email me](mailto:…).
const lede = (page) => {
  const text = (SITE.ledes || {})[page] || "";
  const html = window.marked ? marked.parseInline(text) : esc(text);
  return `<div class="lede-wrap">${text ? `<p class="lede">${html}</p>` : ""}${ownerCtl(`data-kind="lede" data-lede="${page}"`, { del: false, label: text ? "Edit" : "Add a line under the heading" })}</div>`;
};

// Keeps each item's position in its file, so owner.js knows which entry you're editing.
const indexed = (arr) => arr.map((x, i) => ({ ...x, _i: i }));

function renderChrome(page) {
  const nav = NAV.map(
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
    <span>${links}${OWNER ? `${links ? " · " : ""}<button type="button" class="link" data-act="signout">Sign out</button>` : ""}</span>`;
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
  <li class="book" data-i="${b._i}">
    <div class="book-head">
      <span class="book-title">${b.link ? `<a href="${esc(b.link)}">${esc(b.title)}</a>` : esc(b.title)}</span>
      ${b.status ? `<span class="tag tag-${esc(b.status)}">${STATUS_LABELS[b.status] || esc(b.status)}</span>` : ""}
    </div>
    <div class="meta">${[b.author, b.type, b.date && fmtDate(b.date, { year: "numeric", month: "short" })]
      .filter(Boolean).map(esc).join(" · ")}</div>
    ${b.note ? `<div class="note-body">${md(b.note)}</div>` : ""}
    ${ownerCtl(`data-kind="read" data-i="${b._i}"`)}
  </li>`;

const noteItem = (n) => `
  <li class="note" data-i="${n._i}">
    <time>${fmtDate(n.date)}</time>
    <div class="note-body">${md(n.text)}</div>
    ${extLink(n.link)}
    ${ownerCtl(`data-kind="note" data-i="${n._i}"`)}
  </li>`;

// ─── Pages ───────────────────────────────────────────────────────────

const pages = {
  async home(main) {
    const [allPosts, allReading, allNotes] = await Promise.all([
      load("content/posts.json"),
      load("content/reading.json"),
      load("content/notes.json"),
    ]);
    window.SITE_DATA = { posts: allPosts, reading: allReading, notes: allNotes };
    const posts = [...allPosts].sort(byDateDesc);
    const reading = indexed(allReading).sort(byDateDesc);
    const notes = indexed(allNotes).sort(byDateDesc);
    const current = reading.filter((b) => b.status === "reading");
    const recent = (current.length ? current : reading).slice(0, 1);
    const more = (n, href, label) => (n > 1 ? `<a class="btn-ghost more" href="${href}">${label} →</a>` : "");

    main.innerHTML = `
      <section class="hero">
        <h1>${esc(SITE.name)}</h1>
        <p class="lede">${esc(SITE.intro)}</p>
        ${ownerCtl(`data-kind="site"`, { del: false, label: "Edit name & intro" })}
      </section>

      <section>
        <h2><a href="writing.html">Writing</a></h2>
        ${posts.length ? `<ul class="rows">${posts.slice(0, 1).map(postItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
        ${more(posts.length, "writing.html", `See all ${posts.length} posts`)}
      </section>

      <section>
        <h2><a href="reading.html">Reading</a></h2>
        ${recent.length ? `<ul class="books">${recent.map(bookItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
        ${more(reading.length, "reading.html", `See all ${reading.length} on the reading list`)}
      </section>

      <section>
        <h2><a href="notes.html">Drafts</a></h2>
        ${notes.length ? `<ul class="notes">${notes.slice(0, 1).map(noteItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
        ${more(notes.length, "notes.html", `See all ${notes.length} drafts`)}
      </section>`;
  },

  async writing(main) {
    const all = await load("content/posts.json");
    window.SITE_DATA = { posts: all };
    const posts = [...all].sort(byDateDesc);
    const years = {};
    for (const p of posts) (years[p.date.slice(0, 4)] ||= []).push(p);
    main.innerHTML = `
      <h1>Writing</h1>
      ${lede("writing")}
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
    window.SITE_DATA = { posts, post, body };
    document.title = `${post.title} — ${SITE.name}`;
    main.innerHTML = `
      <article>
        <header class="post-head">
          <h1>${esc(post.title)}</h1>
          <time>${fmtDate(post.date, { year: "numeric", month: "long", day: "numeric" })}</time>
          ${extLink(post.link)}
          ${ownerCtl(`data-kind="post" data-slug="${esc(post.slug)}"`)}
        </header>
        <div class="prose">${md(body)}</div>
      </article>
      <p class="back"><a href="writing.html">← All writing</a></p>`;
  },

  async reading(main) {
    const all = await load("content/reading.json");
    window.SITE_DATA = { reading: all };
    const items = indexed(all).sort(byDateDesc);
    // Only offer filters for statuses something actually has.
    const filters = ["all", ...Object.keys(STATUS_LABELS).filter((s) => items.some((b) => b.status === s))];
    const draw = (f) => {
      const shown = f === "all" ? items : items.filter((b) => b.status === f);
      main.querySelector(".books").innerHTML = shown.map(bookItem).join("") || `<p class="empty">Nothing here yet.</p>`;
      main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === f));
    };
    main.innerHTML = `
      <h1>Reading</h1>
      ${lede("reading")}
      <div class="filters">${filters.map((f) => `<button data-f="${f}">${f === "all" ? "All" : STATUS_LABELS[f]}</button>`).join("")}</div>
      <ul class="books"></ul>`;
    main.querySelector(".filters").addEventListener("click", (e) => e.target.dataset.f && draw(e.target.dataset.f));
    draw("all");
  },

  async notes(main) {
    const all = await load("content/notes.json");
    window.SITE_DATA = { notes: all };
    const notes = indexed(all).sort(byDateDesc);
    main.innerHTML = `
      <h1>Drafts</h1>
      ${lede("notes")}
      ${notes.length ? `<ul class="notes">${notes.map(noteItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}`;
  },

  async about(main) {
    const body = await load("content/about.md", "text");
    window.SITE_DATA = { about: body };
    main.innerHTML = `${ownerCtl(`data-kind="about"`, { del: false, label: "Edit page" })}<article class="prose">${md(body)}</article>`;
  },
};

// ─── Boot ────────────────────────────────────────────────────────────

// owner.js calls window.siteRender() after each save to redraw the page with your change.
window.siteRender = async () => {
  const page = document.body.dataset.page;
  const [site, ledes] = await Promise.all([load("content/site.json").catch(() => null), load("content/ledes.json").catch(() => null)]);
  if (site) Object.assign(SITE, site);
  if (ledes) SITE.ledes = ledes;
  renderChrome(page);
  const main = document.querySelector("main");
  try {
    await pages[page](main);
    document.dispatchEvent(new CustomEvent("site:rendered", { detail: { page } }));
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
};
window.siteRender();
