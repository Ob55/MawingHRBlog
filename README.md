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

## Automated weekly posts

The `automation/` folder drafts **one new article per week** and emails it for approval — nothing
goes live until a human clicks **Approve**. It does **not** use any AI service at runtime — the
articles are pre-written by hand in `automation/articles.js`, so it is free, deterministic and
offline-safe. Each run it:

1. picks the next unused article (deduped against the live `/api/posts` feed **and**
   `automation/published-log.json`, so topics never repeat),
2. fetches a relevant HD cover image from the free **Pexels** API,
3. POSTs it to `/api/draft`, which stages the post as a **hidden** draft (under `posts/pending/`,
   invisible to the public site) and returns signed Approve / Reject links,
4. **emails those links over SMTP** (via `automation/send-email.js`, zero-dependency) to the approver, and
5. records the title in `published-log.json`.

The post appears on the website **only** when the approver opens the **Approve & publish** link
(`/api/approve`). **Reject** (`/api/reject`) discards the draft and its image.

```
 weekly job ─► /api/draft (stage hidden draft) ─► SMTP email with Approve/Reject links
                                            │
                  approver clicks ──────────┤
                                            ├─► /api/approve ─► post goes LIVE
                                            └─► /api/reject  ─► draft discarded
```

Email is sent **from the script** (GitHub Action), not from Vercel — so the SMTP credentials live as
GitHub Actions secrets and **Vercel needs no email configuration**.

### One-time setup

1. **Get a free Pexels API key** (no app review needed):
   - Sign up at <https://www.pexels.com/>, then open <https://www.pexels.com/api/> and copy your key.
2. **Have your SMTP credentials ready** (Office 365 / Outlook in this setup). The sending mailbox must
   have **authenticated SMTP (SMTP AUTH) enabled** — Microsoft disables it by default on some tenants
   (Microsoft 365 admin → the mailbox → *Manage email apps* → enable *Authenticated SMTP*).
3. **Add the GitHub Actions secrets** (this is where the weekly job runs) — see the step-by-step below.
4. **Vercel:** just redeploy with the new `api/` files. Optionally add `APPROVE_SECRET` (any long
   random string) to sign the approve/reject links; otherwise it falls back to `GITHUB_TOKEN`.
   No email variables are needed on Vercel.
5. **For local test runs:** copy `.env.example` to `.env` and fill in `PEXELS_API_KEY` and the `MAIL_*`
   values.

#### Adding the GitHub Actions secrets

In the `Ob55/MawingHRBlog` repo on GitHub → **Settings** → **Secrets and variables** → **Actions** →
**New repository secret**, add each of these (name, then value):

| Secret name         | Value                                  |
| ------------------- | -------------------------------------- |
| `PEXELS_API_KEY`    | your Pexels key                        |
| `MAIL_HOST`         | `smtp.office365.com`                   |
| `MAIL_PORT`         | `587`                                  |
| `MAIL_USERNAME`     | `info@ignis-innovation.com`            |
| `MAIL_PASSWORD`     | your SMTP password                     |
| `MAIL_FROM_ADDRESS` | `info@ignis-innovation.com`            |
| `MAIL_FROM_NAME`    | `Mawingu HR Blog`                      |
| `APPROVAL_EMAIL_TO` | `brian55mwangi@gmail.com`              |

> The new `/api/draft`, `/api/approve` and `/api/reject` endpoints must be **deployed to Vercel**
> before the automation can run — they don't exist on the live site until you push and redeploy.

### Test it now

```
node automation/publish-weekly.js --dry-run   # picks an article + image, does NOT draft or email
node automation/publish-weekly.js             # drafts one post + emails the approval link now
```

Then check `brian55mwangi@gmail.com` for the approval email and click **Approve & publish**. The post
appears on the blog within ~30 seconds (confirm with `curl https://mawing-hr-blog.vercel.app/api/posts`).

### The weekly schedule

`.github/workflows/weekly-blog.yml` runs every **Monday at 08:00 UTC** (11:00 EAT). Once the files
are pushed and the `PEXELS_API_KEY` secret is set, it runs automatically. You can also trigger it any
time from the repo's **Actions** tab → *Weekly blog post* → **Run workflow**.

When the ~16-article bank runs low, the script logs a clear notice — just ask Claude to write more
articles into `automation/articles.js` in the same format.

---

## Repo layout

```
public/
  index.html      admin upload page (passcode-less; URL-only access)
  app.js          admin UI logic (Quill editor, upload, delete)
  styles.css
api/
  posts.js        GET  list posts
  upload.js       POST create a post + image (commits to GitHub) — used by the admin UI
  draft.js        POST stage a HIDDEN draft + email an approve/reject link
  approve.js      GET  publish a staged draft (opened from the email)
  reject.js       GET  discard a staged draft + image (opened from the email)
  delete.js       POST remove a post + image (deletes from GitHub)
  _github.js      shared GitHub Contents API helper
  _token.js       signs/verifies approve/reject links
posts/            <-- where live articles are written by /api/upload & /api/approve
  images/
  pending/        <-- hidden drafts awaiting approval (not shown on the site)
dev.js            local-only zero-dep dev server (in-memory storage)
vercel.json
automation/
  articles.js         pre-written article bank (the weekly content source)
  publish-weekly.js   picks next article + Pexels image, drafts via /api/draft
  send-email.js       zero-dep SMTP sender + approval-email template
  published-log.json  log of drafted/published titles (dedup record)
.github/workflows/
  weekly-blog.yml     weekly cron + manual "Run workflow" trigger
```

---

## Security note

There is no login on the admin page. Anyone with the deployed URL can publish or delete articles. The URL is not linked from anywhere public, but treat it like a shared secret: do not paste it into chats, screenshots, or commits.

If spam ever becomes a problem, the easiest mitigation is to:
1. Add an `ADMIN_PASSCODE` env var on Vercel.
2. Re-enable the passcode gate in `public/index.html` and `public/app.js` (the older version of the code is in git history).
