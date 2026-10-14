// Writes straight to the GitHub repo using a personal access token that
// lives only in this browser (localStorage). Visitors can open this page
// but can't publish anything without the token.

const REPO = "kadenpriebe/kadenpriebe.github.io";
const BRANCH = "main";
const API = `https://api.github.com/repos/${REPO}/contents/`;

const $ = (s) => document.querySelector(s);
const today = () => new Date().toLocaleDateString("en-CA");
const slugify = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const getToken = () => { try { return localStorage.getItem("gh_token") || ""; } catch { return ""; } };
const setToken = (t) => { try { t ? localStorage.setItem("gh_token", t) : localStorage.removeItem("gh_token"); } catch {} };

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

async function updateList(path, mutate, message) {
  const f = await readFile(path);
  if (!f) throw new Error(`Couldn't find ${path} in the repo.`);
  const list = JSON.parse(f.text);
  mutate(list);
  await writeFile(path, JSON.stringify(list, null, 2) + "\n", message, f.sha);
}

// ─── Publish actions ─────────────────────────────────────────────────

const publishers = {
  async post({ title, body }) {
    const slug = slugify(title);
    if (!slug) throw new Error("Give the post a title.");
    if (!body.trim()) throw new Error("Write something first.");
    const existing = await readFile("content/posts.json");
    if (JSON.parse(existing.text).some((p) => p.slug === slug)) throw new Error(`You already have a post called “${slug}”.`);
    await writeFile(`content/posts/${slug}.md`, body.trim() + "\n", `Post: ${title}`);
    await updateList("content/posts.json", (l) => l.unshift({ slug, title, date: today() }), `Post: ${title}`);
    return `post.html?p=${slug}`;
  },
  async note({ text }) {
    if (!text.trim()) throw new Error("Write something first.");
    await updateList("content/notes.json", (l) => l.unshift({ date: today(), text: text.trim() }), "Note");
    return "notes.html";
  },
  async read({ title, author, status, type, link, note }) {
    if (!title.trim()) throw new Error("Give it a title.");
    const item = { title: title.trim(), author: author.trim(), type: type.trim() || "book", status, date: today() };
    if (link.trim()) item.link = link.trim();
    if (note.trim()) item.note = note.trim();
    await updateList("content/reading.json", (l) => l.unshift(item), `Reading: ${item.title}`);
    return "reading.html";
  },
};

// ─── UI ──────────────────────────────────────────────────────────────

const field = (id, label, input) => `<label for="${id}">${label}</label>${input}`;

const forms = {
  post: () =>
    field("title", "Title", `<input id="title" autocomplete="off">`) +
    field("body", "Write (markdown works)", `<textarea id="body" rows="16" placeholder="Start writing…"></textarea>`),
  note: () => field("text", "Note", `<textarea id="text" rows="6" placeholder="What's on your mind?"></textarea>`),
  read: () =>
    field("title", "Title", `<input id="title" autocomplete="off">`) +
    field("author", "Author", `<input id="author" autocomplete="off">`) +
    `<div class="two">${field("status", "Status", `<select id="status"><option value="reading">Reading now</option><option value="finished">Finished</option><option value="want">Want to read</option></select>`)}
     ${field("type", "Type", `<input id="type" value="book">`)}</div>` +
    field("link", "Link (optional)", `<input id="link" type="url" placeholder="https://">`) +
    field("note", "Your thoughts (optional)", `<textarea id="note" rows="6"></textarea>`),
};

let kind = "post";

function drawTabs() {
  document.querySelectorAll(".filters button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.k === kind));
  $("#fields").innerHTML = forms[kind]();
  $("#msg").textContent = "";
}

function drawToken() {
  const has = !!getToken();
  $("#token-box").innerHTML = has
    ? `<p class="meta">Signed in on this browser. <button type="button" class="link" id="forget">Remove token</button></p>`
    : `<p>To publish from the browser, paste a GitHub token once. It's saved only in this browser. <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create one</a> for the repo <code>${REPO}</code> with <b>Contents: Read and write</b>.</p>
       <div class="token-row"><input id="token" type="password" placeholder="github_pat_…" autocomplete="off"><button type="button" id="save-token">Save</button></div>`;
  $("#publish").disabled = !has;
  $("#forget")?.addEventListener("click", () => { setToken(""); drawToken(); });
  $("#save-token")?.addEventListener("click", () => {
    const t = $("#token").value.trim();
    if (!t) return;
    setToken(t);
    drawToken();
  });
}

function mount() {
  $("main").innerHTML = `
    <h1>Write</h1>
    <div class="filters" id="tabs">
      <button data-k="post">Post</button><button data-k="note">Note</button><button data-k="read">Reading</button>
    </div>
    <form id="form" autocomplete="off">
      <div id="fields"></div>
      <div class="actions"><button id="publish" type="submit">Publish</button><span id="msg" role="status"></span></div>
    </form>
    <div id="token-box"></div>`;
  $("#tabs").addEventListener("click", (e) => { if (e.target.dataset.k) { kind = e.target.dataset.k; drawTabs(); } });
  $("#form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries([...document.querySelectorAll("#fields [id]")].map((el) => [el.id, el.value]));
    const btn = $("#publish"), msg = $("#msg");
    btn.disabled = true;
    msg.className = "";
    msg.textContent = "Publishing…";
    try {
      const page = await publishers[kind](data);
      drawTabs();
      msg.className = "ok";
      msg.innerHTML = `Published! It'll be live in about a minute: <a href="${page}">view it</a>`;
    } catch (err) {
      msg.className = "err";
      msg.textContent = err.message;
    } finally {
      btn.disabled = !getToken();
    }
  });
  drawTabs();
  drawToken();
}

mount();
