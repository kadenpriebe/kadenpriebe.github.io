# my-site

A personal site for writing, reading notes, and short thoughts. Plain HTML/CSS/JS with no build step.

## See it locally

```sh
cd ~/my-site
python3 -m http.server 8000
```

Then open http://localhost:8000. Refresh the page after you edit anything.

## Adding stuff

| To add…               | Do this                                                              |
| --------------------- | -------------------------------------------------------------------- |
| A blog post           | `node add.js post "Title"`, then write in the `.md` file it creates |
| A short note/thought  | `node add.js note "your thought"`                                    |
| A book/article        | `node add.js read "Title" "Author" finished`                        |
| Change the About page | Edit `content/about.md`                                              |
| Change name/intro     | Edit the `SITE` block at the top of `site.js`                        |
| Change colors/fonts   | Edit the variables at the top of `style.css`                         |

You can also edit the JSON files in `content/` directly. Posts, notes, and reading notes all support **markdown**.

Reading `status` can be `reading`, `finished`, or `want`.

## Publishing

The site is live at https://kadenpriebe.github.io/my-site/ (GitHub Pages, from the `main` branch).

After adding or editing anything, publish it with:

```sh
git add -A && git commit -m "new post" && git push
```

It updates online in about a minute.
