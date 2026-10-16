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
  { href: "topics.html", label: "Topics", page: "topics" },
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

// Files you attach are saved to content/uploads/ in the repo. GitHub Pages takes about a
// minute to publish a new one, so in your own browser they load straight from the repo
// and show up the moment the upload finishes.
const RAW = `https://raw.githubusercontent.com/${REPO}/main/`;

function md(text) {
  const html = window.marked ? marked.parse(tangents(text)) : `<pre>${esc(text)}</pre>`;
  return OWNER ? html.replace(/src="content\/uploads\//g, `src="${RAW}content/uploads/`) : html;
}

// Same as the one in owner.js: "Why I'd Do It" → "why-id-do-it".
const slugOf = (t = "") =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
const ownerCtl = (attrs, { del = true, label = "Edit", extra = "" } = {}) =>
  OWNER
    ? `<div class="owner-ctl"><button type="button" data-act="edit" ${attrs}>${label}</button>${extra}${
        del ? `<button type="button" data-act="delete" ${attrs}>Delete</button>` : ""
      }</div>`
    : "";

// The line under a page's heading. Inline markdown works, e.g. [email me](mailto:…).
const lede = (page) => {
  const text = (SITE.ledes || {})[page] || "";
  const html = window.marked ? marked.parseInline(text) : esc(text);
  return `<div class="lede-wrap">${text ? `<p class="lede">${html}</p>` : ""}${ownerCtl(`data-kind="lede" data-lede="${page}"`, { del: false, label: text ? "Edit" : "Add a line under the heading" })}</div>`;
};

// Keeps each item's position in its file, so owner.js knows which entry you're editing,
// and gives each one an id for linking straight to it (e.g. notes.html#my-draft).
const indexed = (arr, ids = []) => arr.map((x, i) => ({ ...x, _i: i, _id: ids[i] }));

// Ids come from titles, worked out over the whole file so every page agrees on them.
function anchorIds(list, key, prefix = "") {
  const seen = {};
  return list.map((x) => {
    const id = prefix + (slugOf(key(x)) || "item");
    seen[id] = (seen[id] || 0) + 1;
    return seen[id] > 1 ? `${id}-${seen[id]}` : id;
  });
}
const draftIds = (notes) => anchorIds(notes, (n) => n.title || `draft-${n.date}`);
const readingIds = (list) => anchorIds(list, (b) => b.title);
const shapedIds = (list) => anchorIds(list, (b) => b.title, "shaped-");
const idAttr = (x) => (x._id ? ` id="${esc(x._id)}"` : "");

// Tags under an item. Each one opens the Topics page filtered to it.
const tagList = (tags = [], on = "") =>
  tags.length
    ? `<div class="tags">${tags.map((t) => `<a class="chip${t === on ? " on" : ""}" href="topics.html?tag=${encodeURIComponent(t)}" data-tag="${esc(t)}">${esc(t)}</a>`).join("")}</div>`
    : "";

// Everything on the site in one list: used by the Topics page and the link picker.
async function siteIndex() {
  const [posts, notes, reading, shaped] = await Promise.all(
    ["posts", "notes", "reading", "shaped"].map((f) => load(`content/${f}.json`).catch(() => []))
  );
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const dIds = draftIds(notes), rIds = readingIds(reading), sIds = shapedIds(shaped);
  return [
    ...posts.map((p) => ({ type: "Writing", title: p.title, date: p.date, tags: p.tags || [], href: `post.html?p=${encodeURIComponent(p.slug)}` })),
    ...notes.map((n, i) => ({ type: "Draft", title: n.title || firstLine(n.text), date: n.date, tags: n.tags || [], href: `notes.html#${dIds[i]}` })),
    ...reading.map((b, i) => ({ type: cap(b.type || "book"), title: b.title, date: b.date, tags: b.tags || [], href: `reading.html#${rIds[i]}` })),
    ...shaped.map((b, i) => ({ type: "Shaped me", title: b.title, date: "", tags: b.tags || [], href: `reading.html#${sIds[i]}` })),
  ].sort(byDateDesc);
}

// An untitled draft goes by its first line.
function firstLine(text = "") {
  const line = plainText(text.split("\n").find((l) => l.trim()) || "");
  return line.length > 80 ? line.slice(0, 80).replace(/\s+\S*$/, "") + "…" : line;
}

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

// The Writing page passes an excerpt (so there's something to collapse); the homepage doesn't.
// A post's TL;DR, if it has one, is shown instead of the excerpt.
const postItem = (p, excerpt) => {
  const summary =
    excerpt === undefined ? "" :
    p.tldr ? `<p class="excerpt"><span class="tldr-tag">TL;DR</span> ${esc(plainText(p.tldr))}</p>` :
    excerpt ? `<p class="excerpt">${esc(excerpt)}</p>` : "";
  const tags = tagList(p.tags);
  return `
  <li class="row${summary || tags ? " foldable" : ""}">
    <div class="row-main">
      <a href="post.html?p=${encodeURIComponent(p.slug)}">${esc(p.title)}</a>
      ${summary}${tags}
    </div>
    <time>${fmtDate(p.date, { month: "short", day: "numeric" })}</time>
    ${summary || tags ? FOLD : ""}
  </li>`;
};

// The TL;DR box on drafts and posts. Markdown and tangents work inside it.
const tldrBox = (text) => (text ? `<div class="tldr"><span class="tldr-tag">TL;DR</span><div class="tldr-body">${md(text)}</div></div>` : "");

// Markdown as plain text, without tangents.
function plainText(text) {
  const div = document.createElement("div");
  div.innerHTML = md(text || "");
  div.querySelectorAll(".tangent").forEach((t) => t.remove());
  return div.textContent.replace(/\s+/g, " ").trim();
}

// First paragraph of a post as plain text, without tangents, cut to about 220 characters.
function excerptOf(text) {
  const div = document.createElement("div");
  div.innerHTML = md(text || "");
  div.querySelectorAll(".tangent").forEach((t) => t.remove());
  const first = [...div.querySelectorAll("p")].map((p) => p.textContent.trim()).find(Boolean) || "";
  return first.length > 220 ? first.slice(0, 220).replace(/\s+\S*$/, "") + "…" : first;
}

// Optional outside link on a post or note. Only http(s) and mailto links are rendered.
function extLink(url) {
  if (!/^(https?:|mailto:)/i.test(url || "")) return "";
  let label = url;
  try { label = new URL(url).hostname.replace(/^www\./, "") || url; } catch {}
  return `<a class="ext" href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
}

const bookItem = (b) => `
  <li class="book${b.note ? " foldable" : ""}" data-i="${b._i}"${idAttr(b)}>
    <div class="book-head">
      <span class="book-title">${b.link ? `<a href="${esc(b.link)}">${esc(b.title)}</a>` : esc(b.title)}</span>
      ${b.status ? `<span class="tag tag-${esc(b.status)}">${STATUS_LABELS[b.status] || esc(b.status)}</span>` : ""}
    </div>
    <div class="meta">${[b.author, b.type, b.date && fmtDate(b.date, { year: "numeric", month: "short" })]
      .filter(Boolean).map(esc).join(" · ")}</div>
    ${tagList(b.tags)}
    ${b.note ? `<div class="note-body">${md(b.note)}</div>${FOLD}` : ""}
    ${ownerCtl(`data-kind="read" data-i="${b._i}"`)}
  </li>`;

const shapedItem = (b) => `
  <li class="book${b.note ? " foldable" : ""}" data-i="${b._i}"${idAttr(b)}>
    <div class="book-head">
      <span class="book-title">${b.link ? `<a href="${esc(b.link)}">${esc(b.title)}</a>` : esc(b.title)}</span>
    </div>
    ${b.author ? `<div class="meta">${esc(b.author)}</div>` : ""}
    ${tagList(b.tags)}
    ${b.note ? `<div class="note-body">${md(b.note)}</div>${FOLD}` : ""}
    ${ownerCtl(`data-kind="shaped" data-i="${b._i}"`)}
  </li>`;

const noteItem = (n) => `
  <li class="note foldable${n.title ? " has-title" : ""}" data-i="${n._i}"${idAttr(n)}>
    <time>${fmtDate(n.date)}</time>${FOLD}
    ${n.title ? `<h3 class="note-title">${esc(n.title)}</h3>` : ""}
    ${tldrBox(n.tldr)}
    <div class="note-body">${md(n.text)}</div>
    ${extLink(n.link)}
    ${tagList(n.tags)}
    ${ownerCtl(`data-kind="note" data-i="${n._i}"`, {
      extra: `<button type="button" data-act="publish" data-kind="note" data-i="${n._i}">Publish to Writing</button>`,
    })}
  </li>`;

// ─── Collapse all (Writing, Reading, Drafts) ─────────────────────────
// Collapsed: drafts show their first line, reading entries hide your thoughts, posts show
// only titles. Tap one to open it. The choice is remembered per page in this browser.

const FOLD = `<button type="button" class="fold" aria-label="Expand" aria-expanded="false"></button>`;
const COLLAPSIBLE = ["writing", "reading", "notes"];
const collapseMem = {};
const isCollapsed = (page) => {
  try { const v = localStorage.getItem(`collapsed:${page}`); if (v !== null) return v === "1"; } catch {}
  return !!collapseMem[page];
};
const collapseBtn = () => `<button type="button" class="collapse-all" data-collapse></button>`;

function applyCollapse(main, page) {
  const on = COLLAPSIBLE.includes(page) && isCollapsed(page);
  main.classList.toggle("collapsed", on);
  main.querySelectorAll("[data-collapse]").forEach((b) => { b.textContent = on ? "Expand all" : "Collapse all"; });
  main.querySelectorAll(".foldable.open").forEach((li) => li.classList.remove("open"));
  main.querySelectorAll(".fold").forEach((b) => b.setAttribute("aria-expanded", "false"));
}

document.addEventListener("click", (e) => {
  const main = document.querySelector("main");
  const page = document.body.dataset.page;
  if (e.target.closest("[data-collapse]")) {
    const on = !isCollapsed(page);
    collapseMem[page] = on;
    try { localStorage.setItem(`collapsed:${page}`, on ? "1" : "0"); } catch {}
    applyCollapse(main, page);
    return;
  }
  if (!main.classList.contains("collapsed")) return;
  const li = e.target.closest(".foldable");
  if (!li || e.target.closest("a, form, button:not(.fold)")) return;
  const open = li.classList.toggle("open");
  li.querySelector(".fold")?.setAttribute("aria-expanded", open);
});

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
    const reading = indexed(allReading, readingIds(allReading)).sort(byDateDesc);
    const notes = indexed(allNotes, draftIds(allNotes)).sort(byDateDesc);
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
        ${posts.length ? `<ul class="rows">${posts.slice(0, 1).map((p) => postItem(p)).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}
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
    const bodies = await Promise.all(posts.map((p) => load(`content/posts/${p.slug}.md`, "text").catch(() => "")));
    const excerpts = Object.fromEntries(posts.map((p, i) => [p.slug, excerptOf(bodies[i])]));
    const years = {};
    for (const p of posts) (years[p.date.slice(0, 4)] ||= []).push(p);
    main.innerHTML = `
      <h1>Writing</h1>
      ${lede("writing")}
      ${posts.some((p) => p.tldr || excerpts[p.slug]) ? `<div class="page-tools">${collapseBtn()}</div>` : ""}
      ${Object.keys(years).sort().reverse().map((y) => `
        <section>
          <h2>${y}</h2>
          <ul class="rows">${years[y].map((p) => postItem(p, excerpts[p.slug])).join("")}</ul>
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
          ${tagList(post.tags)}
          ${ownerCtl(`data-kind="post" data-slug="${esc(post.slug)}"`)}
        </header>
        ${tldrBox(post.tldr)}
        <div class="prose">${md(body)}</div>
      </article>
      <p class="back"><a href="writing.html">← All writing</a></p>`;
  },

  async reading(main) {
    const [all, allShaped] = await Promise.all([load("content/reading.json"), load("content/shaped.json").catch(() => [])]);
    window.SITE_DATA = { reading: all, shaped: allShaped };
    const items = indexed(all, readingIds(all)).sort(byDateDesc);
    const shaped = indexed(allShaped, shapedIds(allShaped));
    // Only offer filters for statuses something actually has.
    const filters = ["all", ...Object.keys(STATUS_LABELS).filter((s) => items.some((b) => b.status === s))];
    const draw = (f) => {
      const shown = f === "all" ? items : items.filter((b) => b.status === f);
      main.querySelector(".books.main-list").innerHTML = shown.map(bookItem).join("") || `<p class="empty">Nothing here yet.</p>`;
      main.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.f === f));
    };
    main.innerHTML = `
      <h1>Reading</h1>
      ${lede("reading")}
      <div class="filters">${filters.map((f) => `<button data-f="${f}">${f === "all" ? "All" : STATUS_LABELS[f]}</button>`).join("")}${[...items, ...shaped].some((b) => b.note) ? collapseBtn() : ""}</div>
      <ul class="books main-list"></ul>
      ${shaped.length || OWNER ? `
      <section class="shaped">
        <h2>Books that shaped me</h2>
        ${lede("shaped")}
        ${shaped.length ? `<ul class="books">${shaped.map(shapedItem).join("")}</ul>` : ""}
        ${OWNER ? `<button type="button" class="collapse-all add-shaped" data-act="new" data-kind="shaped">+ Add a book</button>` : ""}
      </section>` : ""}`;
    main.querySelector(".filters").addEventListener("click", (e) => e.target.dataset.f && draw(e.target.dataset.f));
    draw("all");
  },

  async notes(main) {
    const all = await load("content/notes.json");
    window.SITE_DATA = { notes: all };
    const notes = indexed(all, draftIds(all)).sort(byDateDesc);
    main.innerHTML = `
      <h1>Drafts</h1>
      ${lede("notes")}
      ${notes.length ? `<div class="page-tools">${collapseBtn()}</div>` : ""}
      ${notes.length ? `<ul class="notes">${notes.map(noteItem).join("")}</ul>` : `<p class="empty">Nothing yet.</p>`}`;
  },

  // Everything you've written, drafted and read, filterable by tag and title.
  async topics(main) {
    const items = await siteIndex();
    const counts = {};
    for (const it of items) for (const t of it.tags) counts[t] = (counts[t] || 0) + 1;
    const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    let tag = new URLSearchParams(location.search).get("tag") || "";
    if (!counts[tag]) tag = "";
    const entries = (n) => `${n} ${n === 1 ? "entry" : "entries"}`;

    main.innerHTML = `
      <h1>Topics</h1>
      ${lede("topics")}
      <div class="topics">
        <aside class="tag-grid" aria-label="Tags"></aside>
        <div class="topics-list">
          <input class="topic-search" type="search" placeholder="Filter by title" aria-label="Filter by title" autocomplete="off">
          <div class="topic-summary"></div>
          <ul class="topic-rows"></ul>
        </div>
      </div>`;
    const search = main.querySelector(".topic-search");

    const draw = () => {
      const q = search.value.trim().toLowerCase();
      const shown = items.filter((it) => (!tag || it.tags.includes(tag)) && (!q || it.title.toLowerCase().includes(q)));
      main.querySelector(".tag-grid").innerHTML = tags.length
        ? tags.map((t, i) => `
          <button type="button" class="tile ${i < 2 ? "xl" : i < 8 ? "m" : "s"}${t === tag ? " on" : ""}" data-tag="${esc(t)}" aria-pressed="${t === tag}">
            <span class="tile-name">${esc(t)}</span><span class="tile-count">${entries(counts[t])}</span>
          </button>`).join("")
        : `<p class="empty">No tags yet.</p>`;
      const filtered = tag || q;
      main.querySelector(".topic-summary").innerHTML = `
        <span>${filtered ? `${shown.length} of ${entries(items.length)}${tag ? ` tagged <b>${esc(tag)}</b>` : ""}${q ? ` matching “${esc(search.value.trim())}”` : ""}` : entries(items.length)}</span>
        ${filtered ? `<button type="button" class="link" data-clear>Clear filter</button>` : ""}`;
      main.querySelector(".topic-rows").innerHTML = shown.map((it) => `
        <li class="topic-row">
          <time>${fmtDate(it.date)}</time>
          <span class="kind">${esc(it.type)}</span>
          <a class="topic-title" href="${esc(it.href)}">${esc(it.title)}</a>
          ${tagList(it.tags, tag)}
        </li>`).join("") || `<p class="empty">Nothing here yet.</p>`;
    };
    const setTag = (t) => {
      tag = t === tag ? "" : t;
      history.replaceState(null, "", tag ? `?tag=${encodeURIComponent(tag)}` : location.pathname);
      draw();
    };
    main.querySelector(".topics").addEventListener("click", (e) => {
      const t = e.target.closest("[data-tag]");
      if (t) { e.preventDefault(); return setTag(t.dataset.tag); }
      if (e.target.closest("[data-clear]")) { search.value = ""; setTag(tag); }
    });
    search.addEventListener("input", draw);
    draw();
  },

  async about(main) {
    const body = await load("content/about.md", "text");
    window.SITE_DATA = { about: body };
    main.innerHTML = `${ownerCtl(`data-kind="about"`, { del: false, label: "Edit page" })}<article class="prose">${md(body)}</article>`;
  },
};

// ─── Boot ────────────────────────────────────────────────────────────

// A link like notes.html#my-draft opens that draft and scrolls to it.
function showTarget() {
  const id = decodeURIComponent(location.hash.slice(1));
  const el = id && document.getElementById(id);
  if (!el || !document.querySelector("main").contains(el)) return;
  el.classList.add("open", "flash");
  el.querySelector(".fold")?.setAttribute("aria-expanded", "true");
  el.scrollIntoView({ block: "start" });
  setTimeout(() => el.classList.remove("flash"), 2000);
}
addEventListener("hashchange", showTarget);
let firstRender = true;

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
    applyCollapse(main, page);
    if (firstRender) showTarget();
    firstRender = false;
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
