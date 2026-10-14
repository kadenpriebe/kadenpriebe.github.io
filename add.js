#!/usr/bin/env node
// Quick way to add things to the site.
//
//   node add.js post "My post title"                  → makes content/posts/my-post-title.md
//   node add.js note "A rough thought"                → adds a draft to content/notes.json
//   node add.js read "Title" "Author" [status] [type] → adds to content/reading.json
//                    status: reading | finished | want   (default: reading)
//                    type:   book | article | ...        (default: book)

const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "content");
const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

const readJSON = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
const writeJSON = (f, data) => fs.writeFileSync(path.join(dir, f), JSON.stringify(data, null, 2) + "\n");

const [kind, ...args] = process.argv.slice(2);

if (kind === "post" && args[0]) {
  const title = args[0];
  const slug = title.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const file = path.join(dir, "posts", `${slug}.md`);
  if (fs.existsSync(file)) {
    console.error(`A post called "${slug}" already exists.`);
    process.exit(1);
  }
  fs.writeFileSync(file, "Start writing here.\n");
  const posts = readJSON("posts.json");
  posts.unshift({ slug, title, date: today });
  writeJSON("posts.json", posts);
  console.log(`New post → content/posts/${slug}.md`);
} else if (kind === "note" && args[0]) {
  const notes = readJSON("notes.json");
  notes.unshift({ date: today, text: args[0] });
  writeJSON("notes.json", notes);
  console.log("Draft added.");
} else if (kind === "read" && args[0]) {
  const [title, author, status = "reading", type = "book"] = args;
  const items = readJSON("reading.json");
  items.unshift({ title, author, type, status, date: today, note: "" });
  writeJSON("reading.json", items);
  console.log(`Added "${title}" to reading. Add your thoughts in the "note" field of content/reading.json.`);
} else {
  console.log(fs.readFileSync(__filename, "utf8").split("\n").slice(1, 9).join("\n").replace(/^\/\/ ?/gm, ""));
}
