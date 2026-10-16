// Owner tools: the + button, the compose sheet, and editing posts / drafts / reading /
// About / homepage intro right on the page, with links, attachments and tags. Everything is saved to the GitHub repo
// with a personal access token that lives only in your browser (localStorage).
//
// Visitors never see any of it: without the token this file does nothing, except
// show the sign-in sheet if you open any page with #login on the end of the address.

(function ownerTools() {
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

  // A tab left open from before an update keeps running the old code, and old code can
  // save things the old way. Before any write, check this is still the code the site
  // serves; if it isn't, stop and ask for a reload (the form keeps what you typed).
  async function checkFresh() {
    const live = await fetch(`owner.js?check=${Date.now()}`, { cache: "no-store" }).then((r) => (r.ok ? r.text() : null)).catch(() => null);
    if (live && !live.includes(ownerTools.toString()))
      throw new Error("Your site was updated since this page loaded. Copy what you wrote, press Cmd+Shift+R, then save again.");
  }

  async function writeFile(path, text, message, sha) {
    await checkFresh();
    await gh(path, { method: "PUT", body: JSON.stringify({ message, content: enc(text), branch: BRANCH, ...(sha ? { sha } : {}) }) });
    remember(path, text);
  }

  async function deleteFile(path, sha, message) {
    await checkFresh();
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
  const tldrInput = (v) => label("TL;DR (optional)", area("tldr", v, 2, "The short version, in a sentence or two"));
  // Buttons under the writing box. They act on whichever box you were last typing in.
  const writeTools = (tangent = true, draw = false) => `<div class="write-tools">
    <button type="button" class="btn-ghost" data-act="link" title="Link the selected text (⌘K)">+ link</button>
    <button type="button" class="btn-ghost" data-act="attach" title="Add images, video, PDFs or any file">+ attach</button>
    ${tangent ? `<button type="button" class="btn-ghost" data-act="tangent" title="Wrap the selected text in a tangent (⌘⇧9)">+ tangent</button>` : ""}
    ${draw ? `<button type="button" class="btn-ghost" data-act="draw" title="Pick an area beside your text and draw in it">+ draw</button>` : ""}
    <input type="file" class="attach-input" multiple hidden>
    <span>${tangent ? "Type ((like this)) for a tangent. " : ""}You can paste or drop files in too.</span></div>`;

  // Tags are typed comma-separated; your existing tags appear underneath to tap.
  const tagsInput = (tags = []) =>
    label("Tags (comma-separated)", input("tags", tags.join(", "), 'class="tags-input" placeholder="philosophy, biotech"')) +
    `<div class="tag-suggest"></div>`;
  // Drafts and posts can have drawings beside the text (see "Drawing beside your writing").
  const sketchHost = (inner) => `<div class="sketch-host">${inner}<div class="sketch-layer"></div></div>`;
  const sketchField = (v) => `<textarea name="sketches" hidden>${esc(JSON.stringify(v.sketches || []))}</textarea>`;
  const parseSketches = (s) => { try { const l = JSON.parse(s || "[]"); return l.length ? l : null; } catch { return null; } };

  const parseTags = (s = "") => [...new Set(s.split(",").map((t) => t.trim().replace(/^#/, "").replace(/\s+/g, " ").toLowerCase()).filter(Boolean))];
  const setTags = (obj, s) => setOrDrop(obj, "tags", parseTags(s).length && parseTags(s));

  const KINDS = {
    post: {
      noun: "post",
      fields: (v, editing) =>
        input("title", v.title, 'class="title-input" placeholder="Title"') +
        tldrInput(v.tldr) +
        `<div class="two">${linkInput(v.link)}${editing ? dateInput(v.date) : ""}</div>` +
        tagsInput(v.tags) +
        sketchHost(area("body", v.body, 14, "Start writing… (markdown works)", "body-input write-target")) + writeTools(true, true) + sketchField(v),
      async create({ title, tldr, body, link, tags, sketches }) {
        const slug = slugify(title);
        if (!slug) throw new Error("Give the post a title.");
        if (!body.trim()) throw new Error("Write something first.");
        const posts = await readFile("content/posts.json");
        if (JSON.parse(posts.text).some((p) => p.slug === slug)) throw new Error(`You already have a post called “${title}”. Pick a different title.`);
        await writeFile(`content/posts/${slug}.md`, body.trim() + "\n", `Post: ${title}`);
        const entry = setTags(setOrDrop(setOrDrop({ slug, title: title.trim(), date: today() }, "tldr", tldr.trim()), "link", cleanLink(link)), tags);
        setOrDrop(entry, "sketches", parseSketches(sketches));
        await updateJSON("content/posts.json", (l) => void l.unshift(entry), `Post: ${title}`);
        return `post.html?p=${slug}`;
      },
      async save(ref, { title, tldr, date, link, tags, body, sketches }) {
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
          setOrDrop(p, "tldr", tldr.trim());
          setOrDrop(p, "link", cleanLink(link));
          setTags(p, tags);
          setOrDrop(p, "sketches", parseSketches(sketches));
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
        input("title", v.title, 'class="title-input" placeholder="Title (optional)"') +
        tldrInput(v.tldr) +
        sketchHost(area("text", v.text, 5, "What's on your mind?", "body-input write-target")) + writeTools(true, true) + sketchField(v) +
        `<div class="two">${linkInput(v.link)}${editing ? dateInput(v.date) : ""}</div>` +
        tagsInput(v.tags),
      // Title and TL;DR come first in the file so they read in order in notes.json.
      build(base, f) {
        if (!f.text.trim()) throw new Error("Write something first.");
        const { title, tldr, text, sketches, link, tags, ...rest } = base;
        const item = setOrDrop(setOrDrop(rest, "title", f.title.trim()), "tldr", f.tldr.trim());
        item.text = f.text.trim();
        setOrDrop(item, "sketches", parseSketches(f.sketches));
        return setTags(setOrDrop(item, "link", cleanLink(f.link)), f.tags);
      },
      async create(f) {
        const item = this.build({ id: Math.random().toString(36).slice(2, 8), date: today() }, f);
        await updateJSON("content/notes.json", (l) => void l.unshift(item), item.title ? `Draft: ${item.title}` : "Draft");
        return "notes.html";
      },
      async save(ref, f) {
        const next = this.build({ ...ref.original, date: f.date || ref.original.date }, f);
        await changeItem("content/notes.json", ref.index, ref.original, next, "Edit draft");
      },
      remove: (ref) => changeItem("content/notes.json", ref.index, ref.original, null, "Delete draft"),
      // Turn a draft into a post on Writing, then take it off Drafts.
      async publish(ref, f) {
        const notes = await readFile("content/notes.json");
        if (JSON.stringify(JSON.parse(notes.text)[ref.index]) !== JSON.stringify(ref.original)) throw new Error(CHANGED);
        const page = await KINDS.post.create(f);
        await changeItem("content/notes.json", ref.index, ref.original, null, `Published draft: ${f.title.trim()}`);
        return page;
      },
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
          tagsInput(v.tags) +
          label("Your thoughts (optional)", area("note", v.note, 4, "", "write-target")) + writeTools()
        );
      },
      build(base, f) {
        if (!f.title.trim()) throw new Error("Give it a title.");
        const item = { ...base, title: f.title.trim(), author: f.author.trim(), type: f.type.trim() || "book", status: f.status };
        setOrDrop(item, "link", cleanLink(f.link));
        setOrDrop(item, "note", f.note.trim());
        return setTags(item, f.tags);
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

    // "Books that shaped me" on the Reading page: past reads, no status or date.
    shaped: {
      noun: "book",
      fields: (v) =>
        input("title", v.title, 'class="title-input" placeholder="Title"') +
        `<div class="two">${label("Author", input("author", v.author))}${linkInput(v.link)}</div>` +
        tagsInput(v.tags) +
        label("How it impacted you (optional)", area("note", v.note, 4, "", "body-input write-target")) + writeTools(),
      build(base, f) {
        if (!f.title.trim()) throw new Error("Give it a title.");
        const item = { ...base, title: f.title.trim() };
        setOrDrop(item, "author", f.author.trim());
        setOrDrop(item, "link", cleanLink(f.link));
        setOrDrop(item, "note", f.note.trim());
        return setTags(item, f.tags);
      },
      async create(f) {
        const item = this.build({}, f);
        await updateJSON("content/shaped.json", (l) => void l.push(item), `Shaped me: ${item.title}`);
        return "reading.html";
      },
      async save(ref, f) {
        const next = this.build({}, f);
        await changeItem("content/shaped.json", ref.index, ref.original, next, `Edit shaped me: ${next.title}`);
      },
      remove: (ref) => changeItem("content/shaped.json", ref.index, ref.original, null, "Delete from books that shaped me"),
    },

    about: {
      fields: (v) => area("body", v.body, 14, "", "body-input write-target") + writeTools(),
      async save(_, { body }) {
        const f = await readFile("content/about.md");
        await writeFile("content/about.md", body.trim() + "\n", "Edit My story", f?.sha);
      },
    },

    // The line under the Writing / Reading / Drafts heading. These live in their own
    // file so saving the homepage intro (site.json) can never touch them.
    lede: {
      fields: (v) => label("Line under the heading", area("text", v.text, 3, "", "write-target")) + writeTools(false),
      async save({ page }, { text }) {
        await updateJSON("content/ledes.json", (cur) => ({ ...cur, [page]: text.trim() }), "Edit page intro");
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
          ...cur, // keep everything else in the file (e.g. the lines under page headings)
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
    if (kind === "note" || kind === "read" || kind === "shaped") {
      const index = +btn.dataset.i;
      const original = strip({ note: D.notes, read: D.reading, shaped: D.shaped }[kind][index]);
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
    initSketches(form);
    fillTagSuggest(form);
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
    stopSketching();
    el.remove();
    if (!$(".sheet")) document.body.classList.remove("sheet-open");
  }

  function compose(kind, values = {}, opts = {}) {
    const titles = { post: "New post", note: "New draft", read: "New reading", shaped: "A book that shaped you" };
    const el = sheet(`
      <form class="compose">
        <div class="sheet-bar">
          <button type="button" class="btn-ghost" data-act="cancel">Cancel</button>
          <span class="sheet-title">${opts.heading || titles[kind]}</span>
          <button type="submit" class="btn-primary">Publish</button>
        </div>
        <div class="sheet-body">${KINDS[kind].fields(values, false)}</div>
        <p class="form-msg" role="status"></p>
      </form>`);
    const form = $("form", el);
    formRefs.set(form, { kind, mode: opts.mode || "new", ref: opts.ref, sheet: el });
    growAll(form);
    initSketches(form);
    fillTagSuggest(form);
    form.querySelector("input, textarea").focus();
  }

  // Opens the new-post sheet filled in from a draft. Publishing it moves the draft to Writing.
  function publishDraft(btn) {
    const { ref, values } = currentValues("note", btn);
    const { title, tldr, link, tags, sketches, text: body } = values;
    compose("post", { title, tldr, link, tags, sketches, body }, { mode: "publish", ref, heading: "Publish to Writing" });
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
    if (sketchForms.has(form)) { finishSketch(form); pinSketches(form); }
    if (uploading.get(form)) return setMsg(form, "Wait for your files to finish uploading.", "err");
    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    setMsg(form, info.mode === "edit" ? "Saving…" : "Publishing…");
    try {
      if (info.mode === "publish") {
        location.href = await KINDS.note.publish(info.ref, collect(form));
      } else if (info.mode === "new") {
        const page = await KINDS[info.kind].create(collect(form));
        const here = document.body.dataset.page;
        const showsIt = { post: [], note: ["notes", "home", "topics"], read: ["reading", "home", "topics"], shaped: ["reading", "topics"] }[info.kind].includes(here);
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
    else if (act === "link") openLinkPanel(btn.closest("form"));
    else if (act === "attach") $(".attach-input", btn.closest("form")).click();
    else if (act === "draw") startPick(btn.closest("form"));
    else if (act === "tag") toggleTag(btn);
    else if (act === "new") compose(btn.dataset.kind);
    else if (act === "edit") openInline(btn);
    else if (act === "publish") publishDraft(btn);
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

  // Keep the text selection in the writing box when you press these buttons.
  document.addEventListener("mousedown", (e) => { if (e.target.closest('[data-act="tangent"], [data-act="link"], [data-act="attach"], [data-act="tag"]')) e.preventDefault(); });
  document.addEventListener("input", (e) => {
    if (e.target.matches("textarea.autogrow")) grow(e.target, true);
    if (e.target.closest?.(".sketch-host")) relayout(e.target.closest("form"));
    if (e.target.matches(".tags-input")) markTags(e.target.closest("form"));
  });
  document.addEventListener("keydown", (e) => {
    // Cmd/Ctrl+Enter saves, Esc cancels.
    const form = e.target.closest?.("form.inline-edit, form.compose");
    if (!form) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); form.requestSubmit(); }
    if (e.key === "Escape") $('[data-act="cancel"]', form)?.click();
    if (e.code === "Digit9" && e.shiftKey && (e.metaKey || e.ctrlKey) && $('[data-act="tangent"]', form)) { e.preventDefault(); addTangent(form); }
    if (e.key === "k" && (e.metaKey || e.ctrlKey) && $('[data-act="link"]', form)) { e.preventDefault(); openLinkPanel(form); }
  });

  // The writing box the tools act on: the one you last typed in, or the main one.
  const lastBox = new WeakMap();
  document.addEventListener("focusin", (e) => {
    const form = e.target.closest?.("form.inline-edit, form.compose");
    if (form && e.target.matches("textarea")) lastBox.set(form, e.target);
  });
  const writeTarget = (form) => {
    const last = lastBox.get(form);
    return last && form.contains(last) ? last : $(".write-target", form) || $("textarea", form);
  };

  // Types text at the cursor the way a keypress would, so Cmd+Z still works.
  function insertText(ta, text) {
    if (document.activeElement !== ta) ta.focus();
    if (!document.execCommand("insertText", false, text)) {
      ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
      ta.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }

  // Wrap the selection in ((…)), or drop an empty one at the cursor and put you inside it.
  function addTangent(form) {
    const ta = writeTarget(form);
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

  // ─── Links ─────────────────────────────────────────────────────────
  // A small box under the writing tools: paste any link, or search your own posts,
  // drafts, reading and pages. The selected text becomes the link; with nothing
  // selected, the title (or address) is put in and selected so you can type over it.

  const PAGES = [
    { type: "Page", title: "Home", href: "index.html" },
    ...NAV.map((n) => ({ type: "Page", title: n.label, href: n.href })),
  ];
  const looksLikeLink = (s) =>
    /^(https?:\/\/|mailto:|tel:|\/|#|[\w-]+\.html)/i.test(s) || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s) || /^[^\s]+\.[a-z]{2,}(\/\S*)?$/i.test(s);
  const toHref = (s) =>
    /^[^\s@:/]+@[^\s@]+\.[a-z]{2,}$/i.test(s) ? "mailto:" + s :
    /^(https?:|mailto:|tel:|\/|#|[\w-]+\.html)/i.test(s) ? s : "https://" + s;

  function openLinkPanel(form) {
    const old = $(".link-panel", form);
    if (old) { old.remove(); return; }
    const ta = writeTarget(form);
    if (!ta) return;
    const a = ta.selectionStart, b = ta.selectionEnd;
    const selected = ta.value.slice(a, b);
    const panel = document.createElement("div");
    panel.className = "link-panel";
    panel.innerHTML = `
      <input class="link-q" placeholder="Paste a link, or search your writing, drafts and reading" autocomplete="off" aria-label="Link to">
      <ul class="link-results" role="listbox"></ul>`;
    $(".write-tools", form).after(panel);
    const q = $(".link-q", panel);
    q.focus();

    let items = PAGES, shown = [], active = 0;
    const draw = () => {
      const v = q.value.trim();
      shown = v && looksLikeLink(v)
        ? [{ type: "Link", title: v, href: toHref(v), url: true }]
        : [...items].filter((it) => !v || it.title.toLowerCase().includes(v.toLowerCase())).slice(0, 8);
      active = Math.min(active, Math.max(shown.length - 1, 0));
      $(".link-results", panel).innerHTML = shown.map((it, i) => `
        <li><button type="button" data-i="${i}" class="${i === active ? "active" : ""}" role="option">
          <span class="kind">${esc(it.type)}</span>${esc(it.title)}</button></li>`).join("") ||
        `<li class="link-none">Nothing on your site matches. Paste a full link instead.</li>`;
    };
    const close = () => { panel.remove(); ta.focus(); };
    const pick = (it) => {
      if (!it) return;
      panel.remove();
      const text = (selected || it.title).replace(/([[\]])/g, "\\$1");
      const href = it.href.replace(/ /g, "%20").replace(/\(/g, "%28").replace(/\)/g, "%29");
      ta.focus();
      ta.setSelectionRange(a, b);
      insertText(ta, `[${text}](${href})`);
      if (!selected) ta.setSelectionRange(a + 1, a + 1 + text.length);
    };

    siteIndex().then((list) => { items = [...PAGES, ...list.filter((it) => it.title)]; draw(); }).catch(() => {});
    draw();
    q.addEventListener("input", () => { active = 0; draw(); });
    q.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        active = (active + (e.key === "ArrowDown" ? 1 : -1) + shown.length) % (shown.length || 1);
        draw();
      } else if (e.key === "Enter") { e.preventDefault(); e.stopPropagation(); pick(shown[active]); }
      else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    });
    panel.addEventListener("mousedown", (e) => { if (e.target.closest("button")) e.preventDefault(); });
    panel.addEventListener("click", (e) => { const btn = e.target.closest("button[data-i]"); if (btn) pick(shown[+btn.dataset.i]); });
  }

  // ─── Attachments ───────────────────────────────────────────────────
  // Files go to content/uploads/ in the repo, one commit each. Images, video and audio
  // show up in place; anything else becomes a link to the file.

  const MAX_UPLOAD = 25 * 1024 * 1024;
  const uploading = new WeakMap(); // form → how many files are still uploading

  const readBase64 = (file) => new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error(`Couldn't read ${file.name}.`));
    r.readAsDataURL(file);
  });

  async function uploadFile(file) {
    if (file.size > MAX_UPLOAD) throw new Error(`${file.name} is over 25 MB, too big to add here. Try a smaller copy.`);
    const dot = file.name.lastIndexOf(".");
    const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
    const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name).slice(0, 60) || "file";
    const path = `content/uploads/${base}-${Math.random().toString(36).slice(2, 7)}${ext ? "." + ext : ""}`;
    const content = await readBase64(file);
    await checkFresh();
    await gh(path, { method: "PUT", body: JSON.stringify({ message: `Upload ${file.name}`, content, branch: BRANCH }) });
    return path;
  }

  function attachmentText(file, path, before) {
    const name = file.name.replace(/[[\]]/g, "");
    const kind = (file.type || "").split("/")[0];
    const block = { image: `![${name}](${path})`, video: `<video src="${path}" controls></video>`, audio: `<audio src="${path}" controls></audio>` }[kind];
    if (!block) return `[${name}](${path})`;
    return (before && !before.endsWith("\n") ? "\n\n" : "") + block + "\n\n";
  }

  async function attachFiles(form, files, ta = writeTarget(form)) {
    if (!files.length || !ta) return;
    uploading.set(form, (uploading.get(form) || 0) + 1);
    try {
      for (const [i, file] of files.entries()) {
        setMsg(form, `Uploading ${file.name}${files.length > 1 ? ` (${i + 1} of ${files.length})` : ""}…`);
        const path = await uploadFile(file);
        if (!form.isConnected) return;
        ta.focus();
        ta.setSelectionRange(ta.selectionEnd, ta.selectionEnd); // add after any selected text, don't replace it
        insertText(ta, attachmentText(file, path, ta.value.slice(0, ta.selectionStart)));
      }
      setMsg(form, files.length > 1 ? `Added ${files.length} files.` : `Added ${files[0].name}.`);
    } catch (err) {
      setMsg(form, err.message, "err");
    } finally {
      uploading.set(form, uploading.get(form) - 1);
    }
  }

  document.addEventListener("change", (e) => {
    if (!e.target.matches(".attach-input")) return;
    const form = e.target.closest("form");
    attachFiles(form, [...e.target.files]);
    e.target.value = "";
  });

  const fileBox = (e) => e.target.closest?.("form.inline-edit textarea, form.compose textarea");
  document.addEventListener("paste", (e) => {
    const ta = fileBox(e);
    const files = [...(e.clipboardData?.files || [])];
    if (!ta || !files.length || e.clipboardData.getData("text/plain")) return;
    e.preventDefault();
    attachFiles(ta.closest("form"), files, ta);
  });
  document.addEventListener("dragover", (e) => {
    if (fileBox(e) && Array.from(e.dataTransfer?.types || []).includes("Files")) e.preventDefault();
  });
  document.addEventListener("drop", (e) => {
    const ta = fileBox(e);
    if (!ta || !e.dataTransfer?.files.length) return;
    e.preventDefault();
    ta.focus();
    attachFiles(ta.closest("form"), [...e.dataTransfer.files], ta);
  });

  // ─── Drawing beside your writing ───────────────────────────────────
  // "+ draw" on a draft or post: drag out an area (the margin beside your text works best),
  // then draw in it with a pen, straight lines, arrows or typed labels. Click a drawing to
  // change or delete it. Each one is pinned to the line of text it starts next to, so it
  // moves with that line as you write, and site.js puts it beside the same line on the page.

  const sketchForms = new WeakMap(); // form → { host, ta, field, list, editing, … }
  let stopActive = null; // ends whatever drawing mode is on

  function initSketches(form) {
    const host = $(".sketch-host", form);
    if (!host) return;
    const field = $('[name="sketches"]', form);
    sketchForms.set(form, { host, ta: $("textarea", host), field, list: parseSketches(field.value) || [] });
    layoutSketches(form);
  }

  // Measures where character k of the writing box sits, using an invisible copy of the box.
  function measurer(ta) {
    const cs = getComputedStyle(ta), m = document.createElement("div");
    for (const p of ["fontFamily", "fontSize", "fontWeight", "fontStyle", "lineHeight", "letterSpacing", "wordSpacing", "tabSize", "textIndent",
      "paddingTop", "paddingRight", "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth", "boxSizing"]) m.style[p] = cs[p];
    Object.assign(m.style, { position: "absolute", visibility: "hidden", pointerEvents: "none", left: "0", top: "0", width: ta.offsetWidth + "px",
      borderStyle: "solid", borderColor: "transparent", whiteSpace: "pre-wrap", overflowWrap: "break-word" });
    const before = document.createTextNode(""), mark = document.createElement("span");
    m.append(before, mark);
    ta.parentNode.append(m);
    return {
      top(k) { before.data = ta.value.slice(0, k); mark.textContent = ta.value[k] || "."; return ta.offsetTop + ta.clientTop + mark.offsetTop; },
      done: () => m.remove(),
    };
  }

  const leftOf = (s, W) => (s.xr != null ? W + s.xr : s.x || 0);
  // Drawings in the right margin are measured from the text's right edge, so they stay
  // beside it however wide the text is.
  function setLeft(s, left, W) {
    delete s.x; delete s.xr;
    if (left >= W - 20) s.xr = Math.round(left - W);
    else s.x = Math.round(left);
  }
  const nth = (text, part, n = 0) => {
    let at = -1;
    for (let k = 0; k <= n; k++) { const i = text.indexOf(part, at + 1); if (i < 0) break; at = i; }
    return at;
  };
  const count = (text, part) => { let c = 0; for (let i = text.indexOf(part); part && i >= 0; i = text.indexOf(part, i + 1)) c++; return c; };

  function layoutSketches(form) {
    const st = sketchForms.get(form);
    if (!st) return;
    const layer = $(".sketch-layer", st.host), W = st.ta.offsetWidth, m = measurer(st.ta);
    layer.innerHTML = "";
    for (const s of st.list) {
      const a = (s.anchors || []).find((a) => a.r && nth(st.ta.value, a.r, a.n) >= 0);
      if (a) s._top = m.top(nth(st.ta.value, a.r, a.n)) + a.dy;
      else s._top ??= s.y || 0; // its line was deleted: it stays put and is re-pinned when you save
      const style = `left:${leftOf(s, W)}px;top:${s._top}px;width:${s.w}px;height:${s.h}px`;
      if (s === st.editing) { st.editEl.style.cssText = style; continue; }
      const el = document.createElement("div");
      const left = leftOf(s, W);
      el.className = "sketch" + (left < W && left + s.w > 0 ? " over-text" : "");
      el.title = "Click to change this drawing";
      el.style.cssText = style;
      el.innerHTML = sketchSVG(s);
      el._sketch = s;
      el._form = form;
      layer.append(el);
    }
    m.done();
  }
  const relayout = (form) => {
    const st = sketchForms.get(form);
    if (st && !st.raf) st.raf = requestAnimationFrame(() => { st.raf = 0; layoutSketches(form); });
  };
  const relayoutAll = () => document.querySelectorAll("form .sketch-host").forEach((h) => relayout(h.closest("form")));
  addEventListener("resize", relayoutAll);
  document.fonts?.ready.then(relayoutAll);

  // Pins a drawing whose top is at y to the words at the start of the line beside it, and,
  // in case those don't survive onto the page (say they're inside a link), to the start of
  // that paragraph or list item too.
  const plainOf = (text) => {
    const d = document.createElement("div");
    d.innerHTML = window.marked ? marked.parseInline(text) : esc(text);
    return d.textContent.replace(/\s+/g, " ").trim();
  };
  function anchorsAt(st, y) {
    const text = st.ta.value;
    if (!text.trim()) return [];
    const m = measurer(st.ta);
    try {
      // The visual line at y: the last character at or above it, then back to its line's start.
      const lineStart = (k) => { const t = m.top(k); let a = 0, b = k; while (a < b) { const mid = (a + b) >> 1; m.top(mid) < t ? (a = mid + 1) : (b = mid); } return a; };
      let lo = 0, hi = text.length - 1;
      while (lo < hi) { const mid = (lo + hi + 1) >> 1; m.top(mid) <= y ? (lo = mid) : (hi = mid - 1); }
      let k = lineStart(lo);
      // On a blank line, use the next line with words (or the last one, below the end).
      while (k < text.length && /\s/.test(text[k])) k++;
      if (k >= text.length) { k = text.length - 1; while (k > 0 && /\s/.test(text[k])) k--; k = lineStart(k); while (/\s/.test(text[k])) k++; }
      const eol = (i) => { const e = text.indexOf("\n", i); return e < 0 ? text.length : e; };
      const make = (i) => {
        const r = text.slice(i, Math.min(eol(i), i + 40));
        let rest = text.slice(i, eol(i));
        if (!text.slice(text.lastIndexOf("\n", i - 1) + 1, i).trim()) rest = rest.replace(/^(?:(?:#{1,6}|>|[-*+]|\d+[.)])\s+)+/, "");
        const q = plainOf(rest.split("((")[0]).slice(0, 40).trim();
        return { r, q, n: count(text.slice(0, i), r), dy: Math.round(y - m.top(i)) };
      };
      let start = text.lastIndexOf("\n", k - 1) + 1;
      while (start < k && /\s/.test(text[start])) start++;
      return start === k ? [make(k)] : [make(k), make(start)];
    } finally { m.done(); }
  }

  // Before saving: re-pin every drawing to the text now beside it, and store them.
  function pinSketches(form) {
    const st = sketchForms.get(form);
    layoutSketches(form);
    for (const s of st.list) { s.anchors = anchorsAt(st, s._top); s.y = Math.round(s._top); }
    st.field.value = JSON.stringify(st.list.map(({ _top, ...s }) => s));
  }

  function sketchBar(html) {
    const bar = document.createElement("div");
    bar.className = "sketch-bar";
    bar.innerHTML = html;
    document.body.append(bar);
    return bar;
  }
  const stopSketching = () => stopActive?.();
  document.addEventListener("site:rendered", stopSketching);

  // Step 1: drag out the area to draw in.
  function startPick(form) {
    const st = sketchForms.get(form);
    if (!st) return;
    stopSketching();
    document.activeElement?.blur(); // so a stray Enter doesn't press "+ draw" again
    const { host } = st, hb = host.getBoundingClientRect(), vw = document.documentElement.clientWidth;
    const L = Math.min(0, 8 - hb.left), R = Math.max(hb.width, vw - 8 - hb.left), T = -12;
    const zone = document.createElement("div");
    zone.className = "draw-zone";
    zone.style.cssText = `left:${L}px;width:${R - L}px;top:${T}px;height:${host.offsetHeight + 172}px`;
    const box = document.createElement("div");
    box.className = "draw-box";
    box.hidden = true;
    zone.append(box);
    host.append(zone);
    const bar = sketchBar(`<span class="hint">Drag out an area beside your text to draw in</span><button type="button" data-tool="cancel">Cancel</button>`);

    const stop = () => { zone.remove(); bar.remove(); stopActive = null; removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onDown, true); };
    const onKey = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); stop(); } };
    const onDown = (e) => { if (!zone.contains(e.target) && !bar.contains(e.target)) stop(); };
    addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    bar.addEventListener("click", (e) => { if (e.target.closest('[data-tool="cancel"]')) stop(); });
    stopActive = stop;

    let start = null;
    const at = (e) => { const r = zone.getBoundingClientRect(); return [Math.max(0, Math.min(r.width, e.clientX - r.left)), Math.max(0, Math.min(r.height, e.clientY - r.top))]; };
    const rect = (e) => {
      const [x, y] = at(e), [x0, y0] = start;
      return { left: Math.min(x, x0), top: Math.min(y, y0), w: Math.abs(x - x0), h: Math.abs(y - y0) };
    };
    zone.addEventListener("pointerdown", (e) => { e.preventDefault(); zone.setPointerCapture(e.pointerId); start = at(e); });
    zone.addEventListener("pointermove", (e) => {
      if (!start) return;
      const r = rect(e);
      box.hidden = false;
      box.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.w}px;height:${r.h}px`;
    });
    zone.addEventListener("pointercancel", () => { start = null; box.hidden = true; });
    zone.addEventListener("pointerup", (e) => {
      if (!start) return;
      let { left, top, w, h } = rect(e);
      if (w < 30 || h < 30) { // a tap: a medium-sized area there
        w = Math.min(240, zone.offsetWidth); h = 200;
        left = Math.min(start[0], zone.offsetWidth - w); top = start[1];
      }
      stop();
      const s = { w: Math.round(w), h: Math.round(h), items: [] };
      setLeft(s, left + L, st.ta.offsetWidth);
      s._top = Math.round(top + T);
      st.list.push(s);
      editSketch(form, s);
    });
  }

  // Step 2: draw in it.
  function editSketch(form, s) {
    const st = sketchForms.get(form);
    stopSketching();
    st.editing = s;
    const el = document.createElement("div");
    el.className = "sketch editing";
    st.editEl = el;
    st.host.append(el);
    layoutSketches(form); // places this one and takes its still copy away
    let tool = "pen", color = "", cur = null;
    const draw = () => {
      const html = sketchSVG(cur ? { ...s, items: [...s.items, cur] } : s);
      const svg = el.querySelector("svg");
      svg ? (svg.outerHTML = html) : el.insertAdjacentHTML("afterbegin", html);
    };
    draw();
    const bar = sketchBar(`
      ${[["pen", "Pen"], ["line", "Line"], ["arrow", "Arrow"], ["text", "Text"]].map(([t, l]) => `<button type="button" data-tool="${t}"${t === tool ? ' class="on"' : ""}>${l}</button>`).join("")}
      <span class="sep"></span>
      <button type="button" class="swatch on" data-ink="" title="Ink" aria-label="Ink color"></button>
      <button type="button" class="swatch a" data-ink="a" title="Accent" aria-label="Accent color"></button>
      <span class="sep"></span>
      <button type="button" data-tool="undo" title="Undo (⌘Z)">Undo</button>
      <button type="button" data-tool="delete">Delete</button>
      <button type="button" data-tool="done" class="done">Done</button>`);
    const undo = () => { s.items.pop(); draw(); };

    const pt = (e) => {
      const r = el.getBoundingClientRect();
      return [Math.round(Math.max(0, Math.min(s.w, e.clientX - r.left))), Math.round(Math.max(0, Math.min(s.h, e.clientY - r.top)))];
    };
    el.addEventListener("pointerdown", (e) => {
      if (e.target.closest(".sketch-text")) return;
      e.preventDefault();
      const [x, y] = pt(e);
      if (tool === "text") return typeAt(x, y);
      el.setPointerCapture(e.pointerId);
      cur = { [tool]: tool === "pen" ? [x, y] : [x, y, x, y], ...(color ? { c: color } : {}) };
      draw();
    });
    el.addEventListener("pointermove", (e) => {
      if (!cur) return;
      for (const ev of e.getCoalescedEvents?.() || [e]) {
        const [x, y] = pt(ev);
        if (cur.pen) { const p = cur.pen; if (Math.hypot(x - p[p.length - 2], y - p[p.length - 1]) >= 2) p.push(x, y); }
        else { const p = cur.line || cur.arrow; p[2] = x; p[3] = y; }
      }
      draw();
    });
    const end = () => {
      if (!cur) return;
      const key = cur.pen ? "pen" : cur.line ? "line" : "arrow", p = cur[key];
      if (key === "pen" || Math.hypot(p[2] - p[0], p[3] - p[1]) >= 4) s.items.push({ ...cur, [key]: p.join(" ") });
      cur = null;
      draw();
    };
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);

    function typeAt(x, y) {
      const box = document.createElement("input");
      box.className = "sketch-text" + (color ? " ink-a" : "");
      box.style.cssText = `left:${x}px;top:${y - 13}px`;
      box.placeholder = "Type, then Enter";
      el.append(box);
      box.focus();
      let closed = false;
      const close = (keep) => {
        if (closed) return;
        closed = true;
        const t = box.value.trim();
        box.remove();
        if (keep && t) { s.items.push({ text: t, at: `${x} ${Math.min(s.h, y + 6)}`, ...(color ? { c: color } : {}) }); draw(); }
      };
      box.addEventListener("keydown", (e) => {
        e.stopPropagation();
        if (e.key === "Enter") { e.preventDefault(); close(true); }
        if (e.key === "Escape") { e.preventDefault(); close(false); }
      });
      box.addEventListener("blur", () => close(true));
    }

    bar.addEventListener("mousedown", (e) => e.preventDefault()); // keep a label you're typing open
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      el.querySelector(".sketch-text")?.blur();
      if (b.dataset.ink !== undefined) {
        color = b.dataset.ink;
        bar.querySelectorAll("[data-ink]").forEach((x) => x.classList.toggle("on", x === b));
        return;
      }
      const t = b.dataset.tool;
      if (t === "undo") undo();
      else if (t === "delete") finishSketch(form, true);
      else if (t === "done") finishSketch(form);
      else {
        tool = t;
        bar.querySelectorAll("[data-tool]").forEach((x) => x.classList.toggle("on", x === b));
        el.classList.toggle("tool-text", t === "text");
      }
    });
    const onKey = (e) => {
      if (e.target.closest?.(".sketch-text")) return;
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finishSketch(form); }
      else if (e.key === "z" && (e.metaKey || e.ctrlKey) && !e.shiftKey) { e.preventDefault(); e.stopPropagation(); undo(); }
    };
    // Clicking anywhere else (your text, Save) finishes the drawing first.
    const onDown = (e) => { if (!el.contains(e.target) && !bar.contains(e.target)) finishSketch(form); };
    addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onDown, true);
    st.bar = bar;
    st.cleanup = () => { removeEventListener("keydown", onKey, true); document.removeEventListener("pointerdown", onDown, true); };
    stopActive = () => finishSketch(form);
  }

  function finishSketch(form, remove = false) {
    const st = sketchForms.get(form);
    const s = st?.editing;
    if (!s) return;
    st.editEl.querySelector(".sketch-text")?.blur();
    st.editing = null;
    st.editEl.remove();
    st.bar.remove();
    st.cleanup();
    stopActive = null;
    if (remove || !s.items.length) st.list.splice(st.list.indexOf(s), 1);
    if (document.contains(st.host)) pinSketches(form);
  }

  // Click a drawing in the editor to change it.
  // (If another drawing was open, finishing it has just redrawn these, so go by what was hit.)
  document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest?.(".sketch");
    if (!el?._sketch) return;
    e.preventDefault();
    editSketch(el._form, el._sketch);
  });

  // ─── Tags ──────────────────────────────────────────────────────────

  async function fillTagSuggest(form) {
    const box = $(".tag-suggest", form);
    if (!box) return;
    const counts = {};
    (await siteIndex().catch(() => [])).forEach((it) => it.tags.forEach((t) => (counts[t] = (counts[t] || 0) + 1)));
    const tags = Object.keys(counts).sort((a, b) => counts[b] - counts[a] || a.localeCompare(b));
    box.innerHTML = tags.map((t) => `<button type="button" class="chip" data-act="tag" data-tag="${esc(t)}">${esc(t)}</button>`).join("");
    markTags(form);
  }

  function markTags(form) {
    const field = $(".tags-input", form);
    if (!field) return;
    const have = parseTags(field.value);
    form.querySelectorAll(".tag-suggest .chip").forEach((c) => c.classList.toggle("on", have.includes(c.dataset.tag)));
  }

  function toggleTag(btn) {
    const form = btn.closest("form");
    const field = $(".tags-input", form);
    const have = parseTags(field.value);
    const t = btn.dataset.tag;
    field.value = (have.includes(t) ? have.filter((x) => x !== t) : [...have, t]).join(", ");
    markTags(form);
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
