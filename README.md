# Mawingu HR — Blog admin

A static admin page (deployed to Vercel) that lets the Mawingu HR team publish and remove blog articles. The Mawingu HR Solutions main website fetches those articles from `/api/posts` and renders them on the public blog.

There is no database. Each article is stored as a JSON file inside this repository's `/posts/` folder, with its cover image inside `/posts/images/`. The Vercel serverless functions use the GitHub Contents API to read and write those files.

---

## How it fits together

```
        Admin (this repo on Vercel)                Main website (Express)
   ┌─────────────────────────────────┐         ┌─────────────────────────────┐
   │  /            upload form (UI)  │         │  /blog renders post cards   │
   │  /api/upload  commits new post  │         │                             │
   │  /api/posts   lists all posts   │  ◄──────│  fetch /api/posts           │
   │  /api/delete  removes a post    │         │                             │
   └────────────┬────────────────────┘         └─────────────────────────────┘
                │                                          
                │ GitHub Contents API                       
                ▼                                          
        ┌──────────────────────────────────┐
        │  /posts/<id>.json                │
        │  /posts/images/<id>.{jpg|png|…}  │
        └──────────────────────────────────┘
```

---

## One-time setup (after pushing this repo to GitHub)

### 1. Create a GitHub Personal Access Token

The Vercel serverless functions need permission to commit files to this repo.

1. Go to https://github.com/settings/personal-access-tokens
2. Click **Generate new token** → **Fine-grained token**
3. Settings:
   - **Token name:** `mawingu-hr-blog`
   - **Expiration:** 1 year (set a calendar reminder to rotate it)
   - **Repository access:** *Only selected repositories* → choose `Ob55/MawingHRBlog`
   - **Repository permissions:**
     - **Contents:** *Read and write*
     - (Leave everything else as default / no access)
4. Click **Generate token** and copy it. You will only see it once.

### 2. Deploy to Vercel

1. Go to https://vercel.com/new and import the `Ob55/MawingHRBlog` repository.
2. Framework preset: **Other** (Vercel will detect the `api/` folder automatically).
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name             | Value                              |
   | ---------------- | ---------------------------------- |
   | `GITHUB_TOKEN`   | the token you generated above      |
   | `GITHUB_OWNER`   | `Ob55`                             |
   | `GITHUB_REPO`    | `MawingHRBlog`                     |
   | `GITHUB_BRANCH`  | `main`                             |

4. Click **Deploy**. Once it finishes, Vercel gives you a URL like
   `https://mawing-hr-blog.vercel.app`.

### 3. Point the main Mawingu site at the live API

In the main `Mwebsite` project (Express), set the `BLOG_API_URL` environment variable to your Vercel deployment's posts endpoint:

```
BLOG_API_URL=https://mawing-hr-blog.vercel.app/api/posts
```

Restart the main site. The `/blog` page will now fetch published articles from Vercel.

---

## Local development

```
npm run dev
```

This starts a small zero-dependency Node server at <http://localhost:8090>. The admin UI works exactly as it will on Vercel, except posts are kept **in memory only** — they disappear when the server restarts. That's intentional so you can iterate without committing junk to GitHub.

To exercise the *real* GitHub-backed API locally, run `npx vercel dev` instead and set the same env vars in a `.env.local` file.

---

## Repo layout

```
public/
  index.html      admin upload page (passcode-less; URL-only access)
  app.js          admin UI logic (Quill editor, upload, delete)
  styles.css
api/
  posts.js        GET  list posts
  upload.js       POST create a post + image (commits to GitHub)
  delete.js       POST remove a post + image (deletes from GitHub)
  _github.js      shared GitHub Contents API helper
posts/            <-- where articles are written by /api/upload
  images/
dev.js            local-only zero-dep dev server (in-memory storage)
vercel.json
```

---

## Security note

There is no login on the admin page. Anyone with the deployed URL can publish or delete articles. The URL is not linked from anywhere public, but treat it like a shared secret: do not paste it into chats, screenshots, or commits.

If spam ever becomes a problem, the easiest mitigation is to:
1. Add an `ADMIN_PASSCODE` env var on Vercel.
2. Re-enable the passcode gate in `public/index.html` and `public/app.js` (the older version of the code is in git history).
