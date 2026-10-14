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

## Putting it online (free)

**GitHub Pages:** create a repo, push this folder, then go to Settings → Pages and pick the `main` branch.

**Netlify Drop:** drag this folder onto https://app.netlify.com/drop.
