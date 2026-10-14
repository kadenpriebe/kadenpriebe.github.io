// Writes straight to the GitHub repo using a personal access token that
// lives only in this browser (localStorage). Visitors can open this page
// but can't publish anything without the token.

(() => {
const REPO = "kadenpriebe/kadenpriebe.github.io";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}/contents/`;

const $ = (s) => document.querySelector(s);
const today = () => new Date().toLocaleDateString("en-CA");
const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const getToken = () => { try { return localStorage.getItem("gh_token") || ""; } catch { return ""; } };
const setToken = (t) => { try { t ? localStorage.setItem("gh_token", t) : localStorage.removeItem("gh_token"); } catch {} };

// ─── GitHub API ──────────────────────────────────────────────────────

const enc = (text) => {
  let bin = "";
  new TextEncoder().encode(text).forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

async function gh(path, opts = {}) {
  const res = await fetch(API + path.split("/").map(encodeURIComponent).join("/") + (opts.method ? "" : `?ref=${BRANCH}`), {
    ...opts,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/vnd.github+json",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (res.status === 404 && !opts.method) return null;
  if (res.status === 401) throw new Error("GitHub rejected your token. Remove it and paste a new one.");
  if (res.status === 403 || (res.status === 404 && opts.method))
    throw new Error("Your token doesn't have permission to edit this repo. Check it has Contents: Read and write.");
  if (res.status === 409 || res.status === 422)
    throw new Error("That file changed or already exists. Reload the page and try again.");
  if (!res.ok) throw new Error(`GitHub error ${res.status}`);
  return res.json();
}

async function readFile(path) {
  const f = await gh(path);
  return f ? { sha: f.sha, text: dec(f.content) } : null;
}

const writeFile = (path, text, message, sha) =>
  gh(path, { method: "PUT", body: JSON.stringify({ message, content: enc(text), branch: BRANCH, ...(sha ? { sha } : {}) }) });

const deleteFile = (path, sha, message) =>
  gh(path, { method: "DELETE", body: JSON.stringify({ message, sha, branch: BRANCH }) });

async function readJSON(path) {
  const f = await readFile(path);
  if (!f) throw new Error(`Couldn't find ${path} in the repo.`);
  return { sha: f.sha, data: JSON.parse(f.text) };
}

async function updateJSON(path, mutate, message) {
  const { sha, data } = await readJSON(path);
  const next = mutate(data) ?? data;
  await writeFile(path, JSON.stringify(next, null, 2) + "\n", message, sha);
}

// Notes and reading entries have no ids, so we find them by position and check
// that the entry is still what you opened before changing it.
const CHANGED = "This changed since you opened it. Go back to the list and reopen it.";
function changeItem(path, index, original, replacement, message) {
  return updateJSON(path, (list) => {
    if (JSON.stringify(list[index]) !== JSON.stringify(original)) throw new Error(CHANGED);
    if (replacement === null) list.splice(index, 1);
    else list[index] = replacement;
  }, message);
}

// ─── Form definitions ────────────────────────────────────────────────
// Each kind describes its fields and how to create / save / delete.

const field = (id, label, input) => `<label for="${id}">${label}</label>${input}`;
const input = (id, v = "", extra = "") => `<input id="${id}" value="${esc(v)}" autocomplete="off" ${extra}>`;
const area = (id, v = "", rows = 8, ph = "") => `<textarea id="${id}" rows="${rows}" placeholder="${esc(ph)}">${esc(v)}</textarea>`;
const dateField = (v) => field("date", "Date", input("date", v, 'type="date"'));

const KINDS = {
  post: {
    fields: (v, editing) =>
      field("title", "Title", input("title", v.title)) +
      (editing ? dateField(v.date) : "") +
      field("body", "Write (markdown works)", area("body", v.body, 16, "Start writing…")),
    async create({ title, body }) {
      const slug = slugify(title);
      if (!slug) throw new Error("Give the post a title.");
      if (!body.trim()) throw new Error("Write something first.");
      const { data } = await readJSON("content/posts.json");
      if (data.some((p) => p.slug === slug)) throw new Error(`You already have a post called “${slug}”.`);
      await writeFile(`content/posts/${slug}.md`, body.trim() + "\n", `Post: ${title}`);
      await updateJSON("content/posts.json", (l) => void l.unshift({ slug, title, date: today() }), `Post: ${title}`);
      return `post.html?p=${slug}`;
    },
    async save(ref, { title, date, body }) {
      if (!title.trim()) throw new Error("Give the post a title.");
      const path = `content/posts/${ref.slug}.md`;
      const existing = await readFile(path);
      await writeFile(path, body.trim() + "\n", `Edit post: ${title}`, existing?.sha);
      await updateJSON("content/posts.json", (l) => {
        const p = l.find((x) => x.slug === ref.slug);
        if (!p) throw new Error(CHANGED);
        p.title = title.trim();
        p.date = date || p.date;
      }, `Edit post: ${title}`);
      return `post.html?p=${ref.slug}`;
    },
    async remove(ref) {
      await updateJSON("content/posts.json", (l) => l.filter((p) => p.slug !== ref.slug), `Delete post: ${ref.slug}`);
      const f = await readFile(`content/posts/${ref.slug}.md`);
      if (f) await deleteFile(`content/posts/${ref.slug}.md`, f.sha, `Delete post: ${ref.slug}`);
    },
  },

  note: {
    fields: (v, editing) => (editing ? dateField(v.date) : "") + field("text", "Note", area("text", v.text, 6, "What's on your mind?")),
    async create({ text }) {
      if (!text.trim()) throw new Error("Write something first.");
      await updateJSON("content/notes.json", (l) => void l.unshift({ date: today(), text: text.trim() }), "Note");
      return "notes.html";
    },
    async save(ref, { date, text }) {
      if (!text.trim()) throw new Error("A note can't be empty. Use Delete instead.");
      const next = { ...ref.original, date: date || ref.original.date, text: text.trim() };
      await changeItem("content/notes.json", ref.index, ref.original, next, "Edit note");
      ref.original = next;
      return "notes.html";
    },
    remove: (ref) => changeItem("content/notes.json", ref.index, ref.original, null, "Delete note"),
  },

  read: {
    fields: (v, editing) => {
      const sel = (s) => (v.status === s ? " selected" : "");
      return (
        field("title", "Title", input("title", v.title)) +
        field("author", "Author", input("author", v.author)) +
        `<div class="two">${field("status", "Status", `<select id="status"><option value="reading"${sel("reading")}>Reading now</option><option value="finished"${sel("finished")}>Finished</option><option value="want"${sel("want")}>Want to read</option></select>`)}
         ${field("type", "Type", input("type", v.type ?? "book"))}</div>` +
        (editing ? dateField(v.date) : "") +
        field("link", "Link (optional)", input("link", v.link, 'type="url" placeholder="https://"')) +
        field("note", "Your thoughts (optional)", area("note", v.note, 6))
      );
    },
    build(base, f) {
      if (!f.title.trim()) throw new Error("Give it a title.");
      const item = { ...base, title: f.title.trim(), author: f.author.trim(), type: f.type.trim() || "book", status: f.status };
      for (const k of ["link", "note"]) f[k].trim() ? (item[k] = f[k].trim()) : delete item[k];
      return item;
    },
    async create(f) {
      const item = this.build({ date: today() }, f);
      await updateJSON("content/reading.json", (l) => void l.unshift(item), `Reading: ${item.title}`);
      return "reading.html";
    },
    async save(ref, f) {
      const next = this.build({ ...ref.original, ...(f.date ? { date: f.date } : {}) }, f);
      await changeItem("content/reading.json", ref.index, ref.original, next, `Edit reading: ${next.title}`);
      ref.original = next;
      return "reading.html";
    },
    remove: (ref) => changeItem("content/reading.json", ref.index, ref.original, null, "Delete reading entry"),
  },

  about: {
    fields: (v) => field("body", "About page (markdown works)", area("body", v.body, 18)),
    async save(_, { body }) {
      const f = await readFile("content/about.md");
      await writeFile("content/about.md", body.trim() + "\n", "Edit About page", f?.sha);
      return "about.html";
    },
  },

  site: {
    fields: (v) =>
      field("name", "Your name (header and footer)", input("name", v.name)) +
      field("intro", "Homepage intro", area("intro", v.intro, 4)) +
      field("links", "Footer links, one per line as Label | URL", area("links", v.links, 4, "GitHub | https://github.com/you")),
    async save(_, { name, intro, links }) {
      if (!name.trim()) throw new Error("Your name can't be empty.");
      const parsed = links.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
        const i = l.indexOf("|");
        const label = l.slice(0, i).trim(), url = l.slice(i + 1).trim();
        if (i < 0 || !label || !url) throw new Error(`Each link needs the form “Label | https://…”. Check: ${l}`);
        return { label, url };
      });
      await updateJSON("content/site.json", () => ({ name: name.trim(), intro: intro.trim(), links: parsed }), "Edit site info");
      return "index.html";
    },
  },
};

// ─── UI state ────────────────────────────────────────────────────────

let tab = "post"; // post | note | read | edit
let editing = null; // { kind, ref, values } while a form for an existing item is open
let lists = null; // cached content for the Edit list

function setStatus(html = "", cls = "") {
  const el = $("#flash");
  el.className = cls;
  el.innerHTML = html;
}
const fail = (err) => setStatus(esc(err.message), "err");

const ok = (page, what = "Published!") =>
  setStatus(`${what} GitHub takes about a minute to update the site: <a href="${page}">view it</a>. Still seeing the old version? Hard-refresh with Cmd+Shift+R.`, "ok");

function drawTabs() {
  const labels = { post: "New post", note: "New note", read: "New reading", edit: "Edit existing" };
  $("#tabs").innerHTML = Object.entries(labels)
    .map(([k, l]) => `<button data-k="${k}" aria-pressed="${k === tab}">${l}</button>`)
    .join("");
}

function drawForm() {
  const kind = editing ? editing.kind : tab;
  const values = editing ? editing.values : {};
  const heading = editing ? { post: "Edit post", note: "Edit note", read: "Edit reading entry", about: "Edit About page", site: "Edit site info" }[kind] : "";
  const canDelete = editing && KINDS[kind].remove;
  $("#content").innerHTML = `
    ${editing ? `<p><button type="button" class="link" id="back">← Back to the list</button></p><h2 class="form-h">${heading}</h2>` : ""}
    <form id="form" autocomplete="off">
      <div id="fields">${KINDS[kind].fields(values, !!editing)}</div>
      <div class="actions">
        <button id="publish" type="submit">${editing ? "Save changes" : "Publish"}</button>
        ${canDelete ? `<button id="delete" type="button" class="danger">Delete</button>` : ""}
      </div>
    </form>`;
  $("#publish").disabled = !getToken();
}

async function loadLists() {
  const [posts, reading, notes] = await Promise.all(
    ["posts", "reading", "notes"].map((n) => readJSON(`content/${n}.json`).then((r) => r.data))
  );
  lists = { posts, reading, notes };
}

function drawList() {
  if (!getToken()) {
    $("#content").innerHTML = `<p class="empty">Paste your GitHub token below first, then this list will load.</p>`;
    return;
  }
  if (!lists) {
    $("#content").innerHTML = `<p class="empty">Loading…</p>`;
    loadLists().then(drawList, (e) => { $("#content").innerHTML = ""; fail(e); });
    return;
  }
  const item = (attrs, label, meta) => `<li class="row"><a href="#" ${attrs}>${esc(label)}</a><time>${esc(meta)}</time></li>`;
  const byDate = (a, b) => (b[1].date || "").localeCompare(a[1].date || "");
  const indexed = (arr) => arr.map((x, i) => [i, x]).sort(byDate);
  const snippet = (t) => (t.length > 70 ? t.slice(0, 70).trimEnd() + "…" : t);
  $("#content").innerHTML = `
    <h2>Pages</h2>
    <ul class="rows">
      ${item('data-edit="about"', "About page", "")}
      ${item('data-edit="site"', "Name, homepage intro & footer links", "")}
    </ul>
    <h2>Posts</h2>
    <ul class="rows">${indexed(lists.posts).map(([i, p]) => item(`data-edit="post" data-i="${i}"`, p.title, p.date)).join("") || `<li class="empty">None yet.</li>`}</ul>
    <h2>Reading</h2>
    <ul class="rows">${indexed(lists.reading).map(([i, b]) => item(`data-edit="read" data-i="${i}"`, b.title, b.date)).join("") || `<li class="empty">None yet.</li>`}</ul>
    <h2>Notes</h2>
    <ul class="rows">${indexed(lists.notes).map(([i, n]) => item(`data-edit="note" data-i="${i}"`, snippet(n.text), n.date)).join("") || `<li class="empty">None yet.</li>`}</ul>`;
}

async function openEditor(kind, i) {
  setStatus("Opening…");
  try {
    if (kind === "post") {
      const p = lists.posts[i];
      const f = await readFile(`content/posts/${p.slug}.md`);
      editing = { kind, ref: { slug: p.slug }, values: { ...p, body: f ? f.text : "" } };
    } else if (kind === "note" || kind === "read") {
      const original = lists[kind === "note" ? "notes" : "reading"][i];
      editing = { kind, ref: { index: +i, original }, values: original };
    } else if (kind === "about") {
      const f = await readFile("content/about.md");
      editing = { kind, ref: {}, values: { body: f ? f.text : "" } };
    } else {
      const { data } = await readJSON("content/site.json");
      editing = { kind, ref: {}, values: { ...data, links: (data.links || []).map((l) => `${l.label} | ${l.url}`).join("\n") } };
    }
    setStatus();
    drawForm();
  } catch (err) {
    fail(err);
  }
}

function drawToken() {
  const has = !!getToken();
  $("#token-box").innerHTML = has
    ? `<p class="meta">Signed in on this browser. <button type="button" class="link" id="forget">Remove token</button></p>`
    : `<p>To publish from the browser, paste a GitHub token once. It's saved only in this browser. <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create one</a> for the repo <code>${REPO}</code> with <b>Contents: Read and write</b>.</p>
       <div class="token-row"><input id="token" type="password" placeholder="github_pat_…" autocomplete="off"><button type="button" id="save-token">Save</button></div>`;
  if ($("#publish")) $("#publish").disabled = !has;
}

function render() {
  drawTabs();
  if (tab === "edit" && !editing) drawList();
  else drawForm();
}

function collect() {
  return Object.fromEntries([...document.querySelectorAll("#fields [id]")].map((el) => [el.id, el.value]));
}

async function submit() {
  const btn = $("#publish");
  btn.disabled = true;
  setStatus("Working…");
  try {
    const kind = editing ? editing.kind : tab;
    if (editing) {
      const page = await KINDS[kind].save(editing.ref, collect());
      lists = null;
      ok(page, "Saved!");
    } else {
      const page = await KINDS[kind].create(collect());
      lists = null;
      render();
      ok(page);
    }
  } catch (err) {
    if (err.message === CHANGED) lists = null; // reload the list next time so it isn't stale
    fail(err);
  } finally {
    if ($("#publish")) $("#publish").disabled = !getToken();
  }
}

async function remove() {
  if (!confirm("Delete this permanently from your site?")) return;
  setStatus("Deleting…");
  try {
    await KINDS[editing.kind].remove(editing.ref);
    editing = null;
    lists = null;
    render();
    setStatus("Deleted. The site will update in about a minute.", "ok");
  } catch (err) {
    fail(err);
  }
}

function mount() {
  $("main").innerHTML = `
    <h1>Write</h1>
    <div class="filters" id="tabs"></div>
    <div id="flash" role="status"></div>
    <div id="content"></div>
    <div id="token-box"></div>`;

  $("#tabs").addEventListener("click", (e) => {
    if (!e.target.dataset.k) return;
    tab = e.target.dataset.k;
    editing = null;
    setStatus();
    render();
  });

  $("#content").addEventListener("click", (e) => {
    if (e.target.id === "back") { editing = null; setStatus(); render(); }
    else if (e.target.id === "delete") remove();
    else if (e.target.dataset.edit) { e.preventDefault(); openEditor(e.target.dataset.edit, e.target.dataset.i); }
  });
  $("#content").addEventListener("submit", (e) => { e.preventDefault(); submit(); });

  $("#token-box").addEventListener("click", (e) => {
    if (e.target.id === "forget") { setToken(""); lists = null; drawToken(); render(); }
    if (e.target.id === "save-token") {
      const t = $("#token").value.trim();
      if (!t) return;
      setToken(t);
      drawToken();
      render();
    }
  });

  render();
  drawToken();
}

mount();
})();
