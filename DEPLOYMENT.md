# Deploying Mkurugenzi

The site runs on **MySQL / MariaDB**, which is the one database both **cPanel shared hosting**
and a plain **VPS** provide out of the box. SQLite was deliberately avoided because cPanel
cannot manage it, and Prisma was avoided because its query engine binary is unreliable on
shared hosting. We use `mysql2` in pure-JavaScript mode, which behaves identically everywhere.

- Storefront: `/`, `/shop`, `/product/[id]`, `/cart`, `/checkout`, …
- Admin dashboard: `/mkuruadmin` (sign in at `/mkuruadmin/login`)

Admin modules: Dashboard, Orders, Products (with image upload and per-size stock),
Promotions, Clients, Reports, Messages (the contact-form inbox), Account & staff, System.

## Before you go live

- [ ] Change the admin password from **Account & staff**. `db:setup` seeds
      `admin@mkurugenzi.co.ke` / `mkurugenzi-admin` and keeps it working until you do.
- [ ] Give each member of staff their own account instead of sharing one login.
- [ ] Set a real `SESSION_SECRET` (`openssl rand -hex 32`). Without it the app refuses to
      start in production rather than accepting unsigned cookies.
- [ ] `mkdir -p uploads && chmod -R 775 uploads` so product images can be uploaded.

## How orders work

Checkout on the storefront posts to `POST /api/orders`. The server re-reads every line from
the catalogue, so the price a shopper is charged is the price in the database — a tampered
payload cannot change it. Stock is then decremented per size inside a transaction, and only
if that succeeds is the order written, the client record created or updated, and the order
number (`MK-1001`, `MK-1002`, …) issued. Orders appear in the admin under **Orders**, tagged
`Online`; the team can also type in phone and in-person sales by hand.

Cancelling an order puts its units back on the shelf automatically. M-Pesa is currently
confirmed by hand: record the confirmation code in the order's **M-Pesa receipt** field.
Automatic STK push requires a live Safaricom Daraja account and is not wired up yet.

---

## 1. Environment variables

Copy `.env.example` to `.env.local` locally. On the server, set these as **environment
variables** in your host panel (never commit them — `.env*` is already git-ignored).

| Variable | Purpose |
| --- | --- |
| `DB_HOST` | `localhost` on cPanel, usually `127.0.0.1` on a VPS |
| `DB_PORT` | `3306` (default) |
| `DB_NAME` | Database name from the MySQL wizard |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `DB_SSL` | `true` only if your host requires TLS |
| `DB_POOL_LIMIT` | Optional, defaults to `5` connections |
| `SESSION_SECRET` | **Required in production.** At least 32 random characters |
| `ADMIN_EMAIL` | First admin account — only read by `db:setup` |
| `ADMIN_PASSWORD` | First admin password — only read by `db:setup` |

Generate a session secret with:

```bash
openssl rand -hex 32
```

> `SESSION_SECRET` is deliberately mandatory in production. If it is missing or too short the
> app throws instead of silently accepting unsigned cookies.

---

## 2. Create the database

### cPanel

1. **cPanel → MySQL Databases**.
2. Create a database, e.g. `mkurugenzi_store` (cPanel prefixes it with your username:
   `youruser_mkurugenzi_store`).
3. Create a user with a strong password and **add it to the database with ALL PRIVILEGES**.
4. Note the prefixed names — they are the values for `DB_NAME` and `DB_USER`.
5. PHPMyAdmin is optional; `npm run db:setup` creates the tables for you.

### VPS (Ubuntu/Debian)

```bash
sudo apt install -y mariadb-server
sudo mysql_secure_installation

sudo mysql <<'SQL'
CREATE DATABASE mkurugenzi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'mkurugenzi'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON mkurugenzi.* TO 'mkurugenzi'@'localhost';
FLUSH PRIVILEGES;
SQL
```

---

## 3. Create the tables and the admin user

With the environment variables in place:

```bash
npm run db:check     # verifies the connection and shows row counts
npm run db:setup     # creates tables, seeds the catalogue, creates the admin account
npm run db:setup -- --force   # wipes and re-seeds (destructive)
```

`db:setup` is idempotent for rows you already edited — it uses upserts, so re-running it
will not overwrite your live changes unless you pass `--force`.

### Without a database (local development only)

If `DB_HOST` is not set, the app falls back to a JSON store in `.data/` and `db:setup`
seeds that instead. The System screen shows which one is active. This fallback is for
convenience only — it never engages when database variables are present.

---

## 4. Deploy on cPanel

cPanel runs Node apps through **Setup Node.js App** (Node 20+ recommended; Next 15 requires
Node 18.18+).

1. Upload the project (git, or a ZIP extracted in `public_html/mkurugenzi`).
2. cPanel → **Setup Node.js App** → create an app, choose Node 20, set
   Application root to the project folder and **Application URL** to your domain.
3. Click **Run NPM Install**.
4. Add the environment variables from section 1.
5. Click **Run NPM Build**.
6. Restart the application.
7. Run `npm run db:setup` once from the **Terminal** (cPanel provides one) or SSH:

   ```bash
   cd ~/public_html/mkurugenzi
   npm run db:setup
   ```

> **Run `db:setup` again on every deploy that adds a column.** It is safe to re-run: new
> columns (`products.size_stock`, `deliveries.source/county/email/phone/notes/mpesa_receipt`)
> are added only when missing, and existing rows are left alone unless you pass `--force`.
> `CREATE TABLE IF NOT EXISTS` will not add a column to a table that already exists, which
> is why the script carries its own migration step.

### Upgrading an existing install

1. Upload the new files.
2. `npm install && npm run build`
3. `npm run db:setup` — adds any new columns, keeps your data.
4. Restart the Node app.

Skipping step 3 leaves the app querying a column the database does not have, and order
placement will fail until you run it.

### cPanel notes

- Make sure `.env.local` is **not** in your uploaded files; use the panel's environment
  variable fields instead.
- `node_modules`, `.next` and `.data` do not need to be uploaded — the panel installs and
  builds them.
- If your host runs the app behind Passenger behind a proxy, `trust` the forwarded
  headers so login rate limiting sees the real IP (`x-forwarded-for` is already read).

### Uploaded product images

Product images chosen in the admin are written to `uploads/` in the project root and served
by the app from `/uploads/<file>`. Create that folder and make it **writable** by the app
user before you start using the uploader:

```bash
mkdir -p uploads && chmod -R 775 uploads
```

Notes:

- Uploads are capped at **8 MB** and limited to JPEG, PNG, WebP, AVIF and GIF.
- They live outside `public/` on purpose: `next start` only serves the files that were in
  `public/` when the server booted, so an upload would otherwise 404 until the next restart.
- Back up the `uploads/` folder together with the database — it holds your product photos.

---

## 5. Deploy on a VPS

The most reliable option is a process manager plus Nginx.

```bash
# Build
npm ci
npm run build

# Run
npm run db:setup            # first time only
npm start                   # or use a process manager
```

With **PM2**:

```bash
npm i -g pm2
pm2 start npm --name mkurugenzi -- start
pm2 save
pm2 startup
```

### Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then terminate TLS with Certbot:

```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 6. Admin security

- Passwords are hashed with Node's built-in **scrypt** — no native module, so no build
  step is needed on cPanel.
- Sessions are stateless HMAC-signed cookies (`mk_admin_session`, httpOnly, SameSite=Lax,
  Secure in production), so there is no session table to keep in sync across multiple
  Passenger workers.
- The login endpoint rate-limits to **8 attempts per IP per 10 minutes**.
- The public contact form posts to `/api/contact`, which is rate-limited to **5 messages per
  IP per 10 minutes**, capped at 4,000 characters per field and filtered through a hidden
  honeypot field.
- `/mkuruadmin` is marked `noindex`, is excluded from `robots.txt`, and is **not linked
  from anywhere in the public site**. Type the path in by hand — it is deliberately not in
  the navbar, the mobile drawer or the footer.

**Before going live:** change the seeded `ADMIN_EMAIL` / `ADMIN_PASSWORD` to something
strong, and set a unique `SESSION_SECRET` per environment.

> Hiding the URL is not access control. Anyone who guesses `/mkuruadmin` still reaches the
> login page; the scrypt password, the 12-hour signed session cookie and the per-IP login
> throttle are what actually keep people out. `robots.txt` only asks well-behaved crawlers
> to stay away — it stops nothing determined.

---

## 7. How the pieces fit together

```
app/(site)/          storefront — public pages, own root layout
app/(admin)/         admin dashboard — own root layout, no site chrome
app/api/admin/       API routes (all require a valid session cookie)
app/api/contact/     public contact-form endpoint (rate limited + honeypot)
app/uploads/         serves images uploaded from the admin product editor
uploads/             the uploaded image files themselves
lib/types.ts         domain types shared by UI, API and database
lib/seed.ts          seed catalogue used by db:setup
lib/server/db.ts     MySQL pool + development fallback
lib/server/repo.ts   all reads/writes, one signature for both drivers
lib/server/auth.ts   scrypt hashing + signed cookies
scripts/setup-db.ts  creates schema, seeds data, creates the admin user
```

The UI never talks to the database directly — it calls `/api/admin/*`, which authenticates,
then delegates to the repository. That keeps the same code path working whether the data
lives in MySQL or, during development, in a local file.
