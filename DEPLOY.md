# Deploying to cPanel with GitHub

Short answer to "can cPanel run Next.js in production from GitHub": **yes.** cPanel's
*Git™ Version Control* clones and pulls the repo, and *Setup Node.js App* runs it with
`next start`. This guide is the exact sequence, in order, with the three gotchas that
otherwise cost an afternoon.

---

## 0. What must be true before you start

| Requirement | Why |
| --- | --- |
| cPanel with **Setup Node.js App** | Runs the Node process. On some hosts it is called *Application Manager*. |
| **Node 20 or 22** | `package.json` declares `engines.node >= 20`. Next 15 refuses to boot on Node 16. |
| **MySQL/MariaDB** | The app refuses to fall back to a file store in production. |
| A **GitHub repository** | The source of truth cPanel pulls from. |
| **SSH or Terminal access** | For `db:setup`, `preflight` and `chmod`. |

> If your host only offers Node 16, stop and upgrade the host plan. No amount of
> configuration will make Next 15 run on it.

---

## 1. Push the code to GitHub (from your machine)

The repository is already initialised locally with a clean `.gitignore`. Create the
remote **private** — this is a live storefront, not a public demo.

```bash
cd ~/Desktop/mkurugenzi-website
git remote add origin https://github.com/<you>/mkurugenzi-website.git
git push -u origin main
```

Use a GitHub **personal access token** as the password, not your account password.

**Make the repo private.** There is no secret in the repository — `.env*` is ignored —
but a private repo is still the right default for a commercial site.

### Why `.gitignore` matters here

Three things are deliberately excluded, and cPanel depends on that:

- **`.next/`** — not committed. cPanel builds it itself (step 4). Committing a build
  made on Windows produces chunks that 404 on Linux.
- **`uploads/`** — not committed. Product images uploaded through the admin live on the
  server only. This is what you want: a `git pull` never overwrites them.
- **`.data/`** — not committed. The dev file store. Production uses MySQL.

`node_modules/` is also ignored, so cPanel installs from `package-lock.json` on its own
Linux machine rather than trusting Windows binaries.

---

## 2. cPanel → Git™ Version Control

1. **cPanel → Git™ Version Control.**
2. **Clone/Add** → paste `https://github.com/<you>/mkurugenzi-website.git`.
   cPanel asks for a username and password. For a private repo use your GitHub username
   and a **personal access token** with `repo` scope.
3. **Repository Path** — set to `mkurugenzi` (created under your home directory).
4. Click **Clone**.

### Gotcha 1 — the SSH alternative is cleaner

If SSH keys are enabled on your account, use the **SSH URL** instead
(`git@github.com:<you>/mkurugenzi-website.git`). A personal access token left in
cPanel's database is a credential sitting in plain text; an SSH key is not.

---

## 3. cPanel → Setup Node.js App

1. **cPanel → Setup Node.js App → Create Application.**

| Field | Value |
| --- | --- |
| Node.js version | **20.x** (or 22.x if offered) |
| Application mode | Production |
| Application root | `mkurugenzi` (the folder you just cloned) |
| Application URL | your domain, e.g. `mkurugenzi.co.ke` |
| Application startup file | leave blank — the app uses `npm start` |

2. Click **Create**, then **Run NPM Install**. This resolves `package-lock.json` on the
   server's own Linux, which is why committing `node_modules` is never the answer.

3. Open **Environment variables** and add:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | `openssl rand -hex 32` — see below |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_NAME` | `youruser_mkurugenzi_store` |
| `DB_USER` | `youruser_mkurugenzi` |
| `DB_PASSWORD` | the strong password from the MySQL wizard |
| `ADMIN_EMAIL` | your real admin address |
| `ADMIN_PASSWORD` | **a new strong password, not the default** |
| `ADMIN_NAME` | your name |

> cPanel sometimes shows `NODE_ENV` as read-only. That is fine — the app sets it.

Generate the session secret over SSH:

```bash
openssl rand -hex 32
```

---

## 4. Build, then create the database

In **cPanel → Terminal** (or SSH):

```bash
cd ~/mkurugenzi

# The database itself is created in cPanel → MySQL Databases first.
# Then create the tables and the admin account:
npm run db:setup
```

`db:setup` is idempotent and also acts as the migration step: it adds any new columns to
tables that already exist. Run it on **every** deploy that ships a schema change.

---

## 5. Prepare the uploads folder

```bash
mkdir -p uploads
chmod -R 775 uploads
```

The app writes product images to `uploads/` in the project root and serves them from
`/uploads/<file>`. If this folder is missing or not writable, image upload fails with a
clear error in the admin — but doing it now saves the round trip.

### Gotcha 2 — cPanel does not build for you automatically

`Setup Node.js App` has a **Run NPM Build** button. You must press it after every pull.
A `git pull` replaces the source; it does not rebuild `.next`. Skipping this step is the
single most common cause of *every JS and CSS file returning 404* on cPanel.

---

## 6. Verify before you point the domain at it

```bash
npm run preflight
```

It only reads. It checks the Node version, database configuration, that
`SESSION_SECRET` is present and is not the example value, that the admin password is no
longer the installer default, that `uploads/` is writable, and that the schema has the
columns the code expects. It exits non-zero if anything must be fixed.

Expected output when you are ready:

```
  [PASS] Node version       v20.x
  [PASS] Database configured mkurugenzi_user@localhost/mkurugenzi_store
  [PASS] SESSION_SECRET     64 characters, not the example value
  [PASS] Admin password     No longer the installer default
  [PASS] uploads folder     Present and writable
  [PASS] Schema             `products` has all expected columns
  [PASS] Schema             `deliveries` has all expected columns
```

---

## 7. Start the app

Back in **Setup Node.js App**, click **Restart**. Then open your domain and confirm:

- the homepage renders,
- `/mkuruadmin` redirects to the login page,
- you can sign in at `/mkuruadmin/login`,
- a product page loads its images.

---

## The update loop (every deploy after the first)

```bash
# on your machine
git add -A && git commit -m "..." && git push
```

Then on cPanel:

1. **Git™ Version Control → Manage → Pull/Update**
2. **Setup Node.js App → Run NPM Install** *(only if `package.json` changed)*
3. **Setup Node.js App → Run NPM Build**  ← *always*
4. **SSH:** `cd ~/mkurugenzi && npm run db:setup` *(only if the schema changed)*
5. **Setup Node.js App → Restart**

### Gotcha 3 — the pulls are one-directional

cPanel can **pull** from GitHub; it cannot push. Your machine remains the only place you
commit from. Editing files through cPanel's File Manager works, but those edits are lost
on the next pull — and never reach GitHub.

---

## If something goes wrong

**Every JS/CSS file returns 404, page is unstyled.**
`.next` is stale or was never built. Press **Run NPM Build**, then **Restart**.

**`SESSION_SECRET must be set to a random string of at least 32 characters.`**
The environment variable is missing or too short. This is the app refusing to accept
unsigned cookies — the failure is deliberate.

**`Database is not configured...`**
`DB_HOST` / `DB_USER` / `DB_NAME` are missing from the environment variables, or the
cPanel database name is the *prefixed* one (`youruser_mkurugenzi_store`, not
`mkurugenzi_store`).

**`Column 'size_stock' not found` or similar.**
`npm run db:setup` has not been run since the column was added.

**Build runs out of memory.**
Shared hosting often caps Node at 512 MB. Add `NODE_OPTIONS=--max-old-space-size=2048`
to the environment variables.

**`npm run db:setup` refuses to run.**
It detected `NODE_ENV=production` with a default or weak `ADMIN_PASSWORD`. That is the
guard working as intended — set a real password.

---

## Known advisory

`npm audit` reports two PostCSS advisories inside Next.js's own bundled dependency. PostCSS
is a **build-time** tool: it is not part of the running server, and neither advisory is
reachable by a visitor. The only fix is upgrading to Next 16, which is a breaking change
and should be done deliberately with testing, not as part of a deploy.
