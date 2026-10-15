// Owner tools: the + button, the compose sheet, and editing posts / drafts / reading /
// About / homepage intro right on the page. Everything is saved to the GitHub repo
// with a personal access token that lives only in your browser (localStorage).
//
// Visitors never see any of it: without the token this file does nothing, except
// show the sign-in sheet if you open any page with #login on the end of the address.

(() => {
  const REPO = "kadenpriebe/kadenpriebe.github.io";
  const BRANCH = "main";
  const API = `https://api.github.com/repos/${REPO}/contents/`;

  const $ = (s, root = document) => root.querySelector(s);
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const today = () => new Date().toLocaleDateString("en-CA");
  const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const cleanLink = (s = "") => { s = s.trim(); return s && !/^(https?:|mailto:)/i.test(s) ? "https://" + s : s; };
  const setOrDrop = (obj, key, val) => { val ? (obj[key] = val) : delete obj[key]; return obj; };
  const strip = ({ _i, ...rest }) => rest;

  const getToken = () => { try { return localStorage.getItem("gh_token") || ""; } catch { return ""; } };
  const setToken = (t) => { try { t ? localStorage.setItem("gh_token", t) : localStorage.removeItem("gh_token"); } catch {} };

  // ─── GitHub API ────────────────────────────────────────────────────

  const enc = (text) => {
    let bin = "";
    new TextEncoder().encode(text).forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin);
  };
  const dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

  async function gh(path, opts = {}) {
    const res = await fetch(API + path.split("/").map(encodeURIComponent).join("/") + (opts.method ? "" : `?ref=${BRANCH}`), {
      cache: "no-store",
      ...opts,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        Accept: "application/vnd.github+json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
    });
    if (res.status === 404 && !opts.method) return null;
    if (res.status === 401) throw new Error("GitHub rejected your token. Sign out (bottom of the page) and sign in with a new one.");
    if (res.status === 403 || (res.status === 404 && opts.method))
      throw new Error("Your token doesn't have permission to edit this repo. Check it has Contents: Read and write.");
    if (res.status === 409 || res.status === 422) throw new Error("That changed somewhere else in the meantime. Reload the page and try again.");
    if (!res.ok) throw new Error(`GitHub error ${res.status}`);
    return res.json();
  }

  // Remember what we just wrote so site.js shows it instantly (see freshCopy in site.js).
  function remember(path, text) {
    try {
      const m = JSON.parse(sessionStorage.getItem("owner_fresh") || "{}");
      m[path] = { text, t: Date.now() };
      sessionStorage.setItem("owner_fresh", JSON.stringify(m));
    } catch {}
  }

  async function readFile(path) {
    const f = await gh(path);
    return f ? { sha: f.sha, text: dec(f.content) } : null;
  }

  async function writeFile(path, text, message, sha) {
    await gh(path, { method: "PUT", body: JSON.stringify({ message, content: enc(text), branch: BRANCH, ...(sha ? { sha } : {}) }) });
    remember(path, text);
  }

  async function deleteFile(path, sha, message) {
    await gh(path, { method: "DELETE", body: JSON.stringify({ message, sha, branch: BRANCH }) });
    remember(path, null);
  }

  async function updateJSON(path, mutate, message) {
    const f = await readFile(path);
    if (!f) throw new Error(`Couldn't find ${path} in the repo.`);
    const data = JSON.parse(f.text);
    const next = mutate(data) ?? data;
    await writeFile(path, JSON.stringify(next, null, 2) + "\n", message, f.sha);
  }

  // Drafts and reading entries have no ids, so we find them by position and check
  // the entry is still what you opened before changing it.
  const CHANGED = "This changed somewhere else since you opened it. Reload the page and try again.";
  const changeItem = (path, index, original, replacement, message) =>
    updateJSON(path, (list) => {
      if (JSON.stringify(list[index]) !== JSON.stringify(original)) throw new Error(CHANGED);
      if (replacement === null) list.splice(index, 1);
      else list[index] = replacement;
    }, message);

  // ─── What each kind of thing looks like and how it's saved ─────────

  const label = (text, inner) => `<label><span>${text}</span>${inner}</label>`;
  const input = (name, v = "", extra = "") => `<input name="${name}" value="${esc(v)}" autocomplete="off" ${extra}>`;
  const area = (name, v = "", rows = 6, ph = "", cls = "") =>
    `<textarea name="${name}" rows="${rows}" class="autogrow ${cls}" placeholder="${esc(ph)}">${esc(v)}</textarea>`;
  const linkInput = (v) => label("Link (optional)", input("link", v, 'placeholder="https://" inputmode="url"'));
  const dateInput = (v) => label("Date", input("date", v, 'type="date"'));
  const tangentTool = `<div class="write-tools">
    <button type="button" class="btn-ghost" data-act="tangent" title="Wrap the selected text in a tangent (⌘⇧9)">+ tangent</button>
    <span>or type ((like this)). Readers tap to open it.</span></div>`;

  const KINDS = {
    post: {
      noun: "post",
      fields: (v, editing) =>
        input("title", v.title, 'class="title-input" placeholder="Title"') +
        `<div class="two">${linkInput(v.link)}${editing ? dateInput(v.date) : ""}</div>` +
        area("body", v.body, 14, "Start writing… (markdown works)", "body-input") + tangentTool,
      async create({ title, body, link }) {
        const slug = slugify(title);
        if (!slug) throw new Error("Give the post a title.");
        if (!body.trim()) throw new Error("Write something first.");
        const posts = await readFile("content/posts.json");
        if (JSON.parse(posts.text).some((p) => p.slug === slug)) throw new Error(`You already have a post called “${title}”. Pick a different title.`);
        await writeFile(`content/posts/${slug}.md`, body.trim() + "\n", `Post: ${title}`);
        await updateJSON("content/posts.json", (l) => void l.unshift(setOrDrop({ slug, title: title.trim(), date: today() }, "link", cleanLink(link))), `Post: ${title}`);
        return `post.html?p=${slug}`;
      },
      async save(ref, { title, date, link, body }) {
        if (!title.trim()) throw new Error("Give the post a title.");
        if (!body.trim()) throw new Error("A post can't be empty. Use Delete instead.");
        const path = `content/posts/${ref.slug}.md`;
        const existing = await readFile(path);
        await writeFile(path, body.trim() + "\n", `Edit post: ${title}`, existing?.sha);
        await updateJSON("content/posts.json", (l) => {
          const p = l.find((x) => x.slug === ref.slug);
          if (!p) throw new Error(CHANGED);
          p.title = title.trim();
          p.date = date || p.date;
          setOrDrop(p, "link", cleanLink(link));
        }, `Edit post: ${title}`);
      },
      async remove(ref) {
        await updateJSON("content/posts.json", (l) => l.filter((p) => p.slug !== ref.slug), `Delete post: ${ref.slug}`);
        const f = await readFile(`content/posts/${ref.slug}.md`);
        if (f) await deleteFile(`content/posts/${ref.slug}.md`, f.sha, `Delete post: ${ref.slug}`);
        return "writing.html";
      },
    },

    note: {
      noun: "draft",
      fields: (v, editing) =>
        area("text", v.text, 5, "What's on your mind?", "body-input") + tangentTool +
        `<div class="two">${linkInput(v.link)}${editing ? dateInput(v.date) : ""}</div>`,
      async create({ text, link }) {
        if (!text.trim()) throw new Error("Write something first.");
        await updateJSON("content/notes.json", (l) => void l.unshift(setOrDrop({ date: today(), text: text.trim() }, "link", cleanLink(link))), "Draft");
        return "notes.html";
      },
      async save(ref, { date, text, link }) {
        if (!text.trim()) throw new Error("A draft can't be empty. Use Delete instead.");
        const next = setOrDrop({ ...ref.original, date: date || ref.original.date, text: text.trim() }, "link", cleanLink(link));
        await changeItem("content/notes.json", ref.index, ref.original, next, "Edit draft");
      },
      remove: (ref) => changeItem("content/notes.json", ref.index, ref.original, null, "Delete draft"),
    },

    read: {
      noun: "reading entry",
      fields: (v, editing) => {
        const sel = (s) => ((v.status || "reading") === s ? " selected" : "");
        return (
          input("title", v.title, 'class="title-input" placeholder="Title"') +
          `<div class="two">${label("Author", input("author", v.author))}${label("Type", input("type", v.type ?? "book"))}</div>` +
          `<div class="two">${label("Status", `<select name="status">${Object.entries(STATUS_LABELS).map(([k, l]) => `<option value="${k}"${sel(k)}>${l}</option>`).join("")}</select>`)}${editing ? dateInput(v.date) : ""}</div>` +
          linkInput(v.link) +
          label("Your thoughts (optional)", area("note", v.note, 4))
        );
      },
      build(base, f) {
        if (!f.title.trim()) throw new Error("Give it a title.");
        const item = { ...base, title: f.title.trim(), author: f.author.trim(), type: f.type.trim() || "book", status: f.status };
        setOrDrop(item, "link", cleanLink(f.link));
        setOrDrop(item, "note", f.note.trim());
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
      },
      remove: (ref) => changeItem("content/reading.json", ref.index, ref.original, null, "Delete reading entry"),
    },

    about: {
      fields: (v) => area("body", v.body, 14, "", "body-input") + tangentTool,
      async save(_, { body }) {
        const f = await readFile("content/about.md");
        await writeFile("content/about.md", body.trim() + "\n", "Edit My story", f?.sha);
      },
    },

    // The line under the Writing / Reading / Drafts heading. Only that one line is
    // written, so nothing else in site.json can be put back to an older version.
    lede: {
      fields: (v) => label("Line under the heading. Links work like [email me](mailto:you@example.com)", area("text", v.text, 3)),
      async save({ page }, { text }) {
        await updateJSON("content/site.json", (cur) => {
          cur.ledes = { ...cur.ledes, [page]: text.trim() };
        }, "Edit page intro");
      },
    },

    site: {
      fields: (v) =>
        label("Your name", input("name", v.name)) +
        label("Homepage intro", area("intro", v.intro, 3)) +
        label("Footer links, one per line as Label | URL", area("links", v.links, 3, "GitHub | https://github.com/you")),
      // Only fields you changed are written, so a page opened before someone else's
      // edit doesn't put the old values back.
      async save({ original }, { name, intro, links }) {
        if (!name.trim()) throw new Error("Your name can't be empty.");
        const parsed = links.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => {
          const i = l.indexOf("|");
          const lbl = l.slice(0, i).trim(), url = l.slice(i + 1).trim();
          if (i < 0 || !lbl || !url) throw new Error(`Each link needs the form “Label | https://…”. Check: ${l}`);
          return { label: lbl, url: cleanLink(url) };
        });
        const changed = (v, was) => v.replace(/\r\n?/g, "\n") !== was;
        await updateJSON("content/site.json", (cur) => ({
          name: changed(name, original.name) ? name.trim() : cur.name,
          intro: changed(intro, original.intro) ? intro.trim() : cur.intro,
          links: changed(links, original.links) ? parsed : cur.links,
        }), "Edit name & intro");
      },
    },
  };

  // What's currently on the page, for filling in an edit form.
  function currentValues(kind, btn) {
    const D = window.SITE_DATA || {};
    if (kind === "post") return { ref: { slug: btn.dataset.slug }, values: { ...D.post, body: D.body } };
    if (kind === "note" || kind === "read") {
      const index = +btn.dataset.i;
      const original = strip((kind === "note" ? D.notes : D.reading)[index]);
      return { ref: { index, original }, values: original };
    }
    if (kind === "about") return { ref: {}, values: { body: D.about } };
    if (kind === "lede") return { ref: { page: btn.dataset.lede }, values: { text: (SITE.ledes || {})[btn.dataset.lede] || "" } };
    const values = { ...SITE, links: (SITE.links || []).map((l) => `${l.label} | ${l.url}`).join("\n") };
    return { ref: { original: values }, values };
  }

  // ─── Small UI helpers ──────────────────────────────────────────────

  const formRefs = new WeakMap(); // form element → { kind, ref, mode }
  const collect = (form) => Object.fromEntries(new FormData(form));
  const isDirty = (form) => form && [...form.querySelectorAll("input, textarea")].some((el) => el.value !== el.defaultValue);

  // Measure on a hidden copy: collapsing the real box to measure it would shorten the
  // page for a moment and make the browser scroll away from where you're typing.
  function grow(el, follow = false) {
    const m = el.cloneNode();
    m.removeAttribute("name");
    m.value = el.value;
    m.style.cssText = `position:absolute;visibility:hidden;height:auto;min-height:0;width:${el.offsetWidth}px`;
    el.after(m);
    const h = m.scrollHeight + 2 + "px";
    let caret = null;
    if (follow) { m.value = el.value.slice(0, el.selectionEnd); caret = m.scrollHeight; }
    m.remove();
    if (el.style.height !== h) el.style.height = h;
    if (caret !== null) keepInView(el, caret);
  }

  // Scroll just enough to keep the line you're typing on visible, like a doc editor.
  function keepInView(el, caretBottom) {
    const scroller = el.closest(".sheet") || document.scrollingElement;
    const bar = el.closest(".sheet")?.querySelector(".sheet-bar");
    const line = parseFloat(getComputedStyle(el).lineHeight) || 30;
    const y = el.getBoundingClientRect().top + caretBottom;
    const bottom = (window.visualViewport?.height ?? innerHeight) - 24;
    const top = (bar ? bar.getBoundingClientRect().bottom : 0) + 24;
    if (y > bottom) scroller.scrollTop += y - bottom;
    else if (y - line < top) scroller.scrollTop -= top - (y - line);
  }
  const growAll = (root) => root.querySelectorAll("textarea.autogrow").forEach(grow);

  function setMsg(form, text, cls = "") {
    const m = $(".form-msg", form);
    m.className = "form-msg " + cls;
    m.textContent = text;
  }

  const rerender = () => window.siteRender();

  // ─── Inline editing (right where the thing is on the page) ─────────

  function openInline(btn) {
    const open = $("form.inline-edit");
    if (open && isDirty(open) && !confirm("Discard the changes you're already making?")) return;
    if (open) { rerender().then(() => {
      const again = document.querySelector(`[data-act="edit"][data-kind="${btn.dataset.kind}"]${btn.dataset.i ? `[data-i="${btn.dataset.i}"]` : ""}`);
      if (again) openInline(again);
    }); return; }

    const kind = btn.dataset.kind;
    const { ref, values } = currentValues(kind, btn);
    // Replace the whole item (draft, book, post, About page, intro) with its form.
    const target =
      kind === "post" ? btn.closest("article") :
      kind === "about" ? $("main") :
      kind === "site" ? btn.closest(".hero") :
      kind === "lede" ? btn.closest(".lede-wrap") :
      btn.closest("li");
    const form = document.createElement("form");
    form.className = "inline-edit";
    form.innerHTML = `${KINDS[kind].fields(values, true)}
      <div class="actions">
        <button type="submit" class="btn-primary">Save</button>
        <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
        <span class="form-msg" role="status"></span>
      </div>`;
    formRefs.set(form, { kind, ref, mode: "edit" });
    if (kind === "about") { target.innerHTML = ""; target.append(form); }
    else target.replaceWith(form);
    growAll(form);
    (form.querySelector(".title-input, .body-input, input, textarea"))?.focus();
  }

  async function removeItem(btn) {
    const kind = btn.dataset.kind;
    if (!confirm(`Delete this ${KINDS[kind].noun} from your site?`)) return;
    btn.disabled = true;
    btn.textContent = "Deleting…";
    try {
      const { ref } = currentValues(kind, btn);
      const goTo = await KINDS[kind].remove(ref);
      if (goTo && document.body.dataset.page === "post") location.href = goTo;
      else await rerender();
    } catch (err) {
      alert(err.message);
      await rerender();
    }
  }

  // ─── The + button and the compose sheet ────────────────────────────

  const FAB_KIND = { writing: "post", post: "post", notes: "note", reading: "read" };

  function addFab() {
    if ($(".fab")) return;
    const fab = document.createElement("div");
    fab.className = "fab-wrap";
    fab.innerHTML = `
      <div class="fab-menu" hidden>
        <button type="button" data-new="post">New post</button>
        <button type="button" data-new="note">New draft</button>
        <button type="button" data-new="read">New reading</button>
      </div>
      <button type="button" class="fab" aria-label="Create something new" title="New">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      </button>`;
    document.body.append(fab);
    const menu = $(".fab-menu", fab);
    $(".fab", fab).addEventListener("click", () => {
      const kind = FAB_KIND[document.body.dataset.page];
      if (kind) compose(kind);
      else menu.hidden = !menu.hidden; // home / About: choose what to make
    });
    menu.addEventListener("click", (e) => {
      if (!e.target.dataset.new) return;
      menu.hidden = true;
      compose(e.target.dataset.new);
    });
    document.addEventListener("click", (e) => { if (!fab.contains(e.target)) menu.hidden = true; });
  }

  function sheet(inner) {
    const el = document.createElement("div");
    el.className = "sheet";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML = `<div class="sheet-inner">${inner}</div>`;
    document.body.append(el);
    document.body.classList.add("sheet-open");
    return el;
  }
  function closeSheet(el) {
    el.remove();
    if (!$(".sheet")) document.body.classList.remove("sheet-open");
  }

  function compose(kind) {
    const titles = { post: "New post", note: "New draft", read: "New reading" };
    const el = sheet(`
      <form class="compose">
        <div class="sheet-bar">
          <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
          <span class="sheet-title">${titles[kind]}</span>
          <button type="submit" class="btn-primary">Publish</button>
        </div>
        <div class="sheet-body">${KINDS[kind].fields({}, false)}</div>
        <p class="form-msg" role="status"></p>
      </form>`);
    const form = $("form", el);
    formRefs.set(form, { kind, mode: "new", sheet: el });
    growAll(form);
    form.querySelector("input, textarea").focus();
  }

  // ─── Sign in / out ─────────────────────────────────────────────────

  function showLogin() {
    if ($(".sheet.login")) return;
    const el = sheet(`
      <form class="login">
        <div class="sheet-bar">
          <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
          <span class="sheet-title">Sign in</span>
          <button type="submit" class="btn-primary">Save</button>
        </div>
        <div class="sheet-body">
          <p>Paste your GitHub token to edit your site from this browser. It's saved only in this browser.</p>
          <p class="meta">Need one? <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">Create a token</a> for the repo <code>${REPO}</code> with <b>Contents: Read and write</b>.</p>
          ${input("token", "", 'type="password" placeholder="github_pat_…"')}
        </div>
        <p class="form-msg" role="status"></p>
      </form>`);
    el.classList.add("login");
    $("input", el).focus();
  }

  async function signIn(form) {
    const t = collect(form).token.trim();
    if (!t) return setMsg(form, "Paste your token first.", "err");
    setMsg(form, "Checking…");
    const res = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { Authorization: `Bearer ${t}` } }).catch(() => null);
    const repo = res && res.ok ? await res.json() : null;
    if (!repo || (repo.permissions && !repo.permissions.push))
      return setMsg(form, "GitHub didn't accept that token. Check it's for kadenpriebe.github.io with Contents: Read and write.", "err");
    setToken(t);
    history.replaceState(null, "", location.pathname + location.search);
    location.reload();
  }

  // ─── Event wiring ──────────────────────────────────────────────────

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.classList.contains("login")) { e.preventDefault(); return signIn(form); }
    const info = formRefs.get(form);
    if (!info) return;
    e.preventDefault();
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setMsg(form, info.mode === "new" ? "Publishing…" : "Saving…");
    try {
      if (info.mode === "new") {
        const page = await KINDS[info.kind].create(collect(form));
        const here = document.body.dataset.page;
        const showsIt = { post: [], note: ["notes", "home"], read: ["reading", "home"] }[info.kind].includes(here);
        if (showsIt) { closeSheet(info.sheet); await rerender(); }
        else location.href = page;
      } else {
        await KINDS[info.kind].save(info.ref, collect(form));
        await rerender();
      }
    } catch (err) {
      setMsg(form, err.message, "err");
      btn.disabled = false;
    }
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === "tangent") addTangent(btn.closest("form"));
    else if (act === "edit") openInline(btn);
    else if (act === "delete") removeItem(btn);
    else if (act === "signout") {
      if (!confirm("Sign out of editing on this browser?")) return;
      setToken("");
      try { sessionStorage.removeItem("owner_fresh"); } catch {}
      location.reload();
    } else if (act === "cancel") {
      const form = btn.closest("form");
      const s = btn.closest(".sheet");
      if (isDirty(form) && !confirm("Discard what you've written?")) return;
      if (s) {
        closeSheet(s);
        if (s.classList.contains("login")) history.replaceState(null, "", location.pathname + location.search);
      } else rerender();
    }
  });

  document.addEventListener("mousedown", (e) => { if (e.target.closest('[data-act="tangent"]')) e.preventDefault(); });
  document.addEventListener("input", (e) => { if (e.target.matches("textarea.autogrow")) grow(e.target, true); });
  document.addEventListener("keydown", (e) => {
    // Cmd/Ctrl+Enter saves, Esc cancels.
    const form = e.target.closest?.("form.inline-edit, form.compose");
    if (!form) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); form.requestSubmit(); }
    if (e.key === "Escape") $('[data-act="cancel"]', form)?.click();
    if (e.code === "Digit9" && e.shiftKey && (e.metaKey || e.ctrlKey) && $(".body-input", form)) { e.preventDefault(); addTangent(form); }
  });

  // Wrap the selection in ((…)), or drop an empty one at the cursor and put you inside it.
  function addTangent(form) {
    const ta = $(".body-input", form);
    if (!ta) return;
    if (document.activeElement !== ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    const { selectionStart: a, selectionEnd: b } = ta;
    const sel = ta.value.slice(a, b);
    // execCommand keeps Cmd+Z working; setRangeText is the fallback.
    if (!document.execCommand("insertText", false, `((${sel}))`)) {
      ta.setRangeText(`((${sel}))`, a, b, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
    const caret = sel ? a + sel.length + 4 : a + 2;
    ta.setSelectionRange(caret, caret);
  }

  // ─── Start ─────────────────────────────────────────────────────────

  const checkLogin = () => { if (location.hash === "#login" && !getToken()) showLogin(); };
  addEventListener("hashchange", checkLogin);
  checkLogin();

  if (getToken()) {
    document.documentElement.classList.add("owner");
    addFab();
  }
})();
