# Presentation runbook

Everything you need to have the site running, in the order you need it. Frontend and
backend start together with **one command** — there is no separate database to spin up
locally, because without database credentials the app uses a file store in `.data/`.

---

## Start it (one command)

```bash
cd ~/Desktop/mkurugenzi-website
npm run demo
```

That command does three things, in order:

1. re-seeds the demo data so every admin screen has something real in it,
2. prints the two login credentials,
3. starts the app on **http://localhost:3437**.

**Wait for this line before showing anything:**

```
✓ Ready in 3s
```

First start takes about 20–30 seconds while Next.js compiles. Every page after that is
instant.

### The URLs you need

| What | Where |
| --- | --- |
| Storefront | http://localhost:3437 |
| Admin login | http://localhost:3437/mkuruadmin/login |
| Admin dashboard | http://localhost:3437/mkuruadmin |
| Reports | http://localhost:3437/mkuruadmin/reports |
| Orders | http://localhost:3437/mkuruadmin/deliveries |
| Products | http://localhost:3437/mkuruadmin/products |

### The logins

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@mkurugenzi.co.ke` | `mkurugenzi-admin` |
| Staff | `staff@mkurugenzi.co.ke` | `quiet-river-88` |

Use the **Admin** account for the presentation. Sign in as **Staff** if you want to
demonstrate that a staff login genuinely cannot reach staff management — it returns
"Only an admin can change roles" instead of quietly failing.

---

## Restart mid-presentation

If something goes wrong, you do not need to diagnose it. Stop and start again:

```bash
# stop
# Ctrl+C in the terminal running npm run demo

# if that terminal is gone, force it:
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3437 -State Listen | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }"

# start again
npm run demo
```

`npm run demo` re-seeds first, so you always get clean, presentable data — even if
someone typed junk into the admin during a previous run.

**If you are very short on time:** `npm run demo` alone is the whole recovery. It is
safe to run as often as you like.

---

## A 6-minute demo that lands

This is the path that shows the most in the least time.

**1. Storefront, 30 seconds** — `localhost:3437`
Home page. Mention it is a real Next.js app with its own admin.

**2. A product page, 60 seconds** — click any product
Point at the **size buttons**. Some are struck through and disabled — that is live
per-size stock, not decoration. Say *"we cannot sell a size we have run out of, and the
customer sees that before they add to bag."*

**3. The cart, 20 seconds** — add something, open the bag
The primary button is **Proceed to Checkout**, not a chat window. Delivery fee and
free-delivery threshold are read from the store settings, not hardcoded.

**4. Checkout, 90 seconds** — fill the form and place the order
This is the strongest moment in the demo. The order is written to the database, stock
comes off the shelf, the customer's record is created, and a real reference like
`MK-2052` is issued. Mention that the server re-prices every line from the catalogue, so
nobody can edit the price in the browser.

**5. Admin Orders, 60 seconds** — the order you just placed is at the top
Badged **Online**, with the customer's name, phone, county and address. Show the status
pipeline — click **Move to Confirmed**. Then click **Cancel** on it and say *"cancelling
returns the stock to the shelf automatically, so we can re-sell it."*

**6. Reports, 60 seconds** — `/mkuruadmin/reports`
Revenue with a **+90% period-on-period** comparison, the daily revenue chart, best
sellers, and the slow-movers list at the bottom. This is the screen that answers "what
should we restock?".

If you have 60 seconds instead of 6 minutes, do steps 4, 5 and 6 only.

---

## Things worth saying if they come up

- **Where is the data?** MySQL in production, a file store locally. Same code both ways,
  so a demo on a laptop and the live site behave identically.
- **What stops someone buying a size we don't have?** Stock is decremented inside a
  database transaction with the row locked. Two people clicking "buy" on the last
  jacket cannot both succeed.
- **What if someone edits the price in the browser?** Nothing. The server reads the price
  from the catalogue and ignores whatever the browser sent.
- **Who can log in?** Every member of staff has their own account, with roles. There is
  no shared password. Removing someone revokes access without touching their history.
- **How do we take payment?** M-Pesa, PayPal, card and cash on delivery. The team
  confirms the M-Pesa code against the order. *Automatic M-Pesa push needs a live
  Safaricom account and is not wired up yet — say so rather than implying it works.*
- **How do we deploy?** GitHub to cPanel. cPanel pulls the code, builds it and runs it.
  The full runbook is in [DEPLOY.md](DEPLOY.md).

---

## If the demo goes wrong

| Symptom | Cause | Fix |
| --- | --- | --- |
| Page is blank or unstyled, browser console full of 404s for `.css`/`.js` | A `npm run build` was run while the dev server was up, so `.next` holds production output | `npm run demo` again — it clears and restarts |
| `EADDRINUSE` / port already in use | An old server is still running | The force-stop command above, then `npm run demo` |
| Admin redirects straight back to login | Session expired after 12 hours | Open `/mkuruadmin/login` and sign in again |
| Reports shows "No orders in the previous period" | Seed dates drifted | `npm run demo:reset` |
| **Blank white screen on every page** | **The PageLoader intro is stuck** | **Hard-refresh: Ctrl+Shift+R** |
| Slide deck opened on top of the browser | — | Move the browser to the second screen, or press F11 for full screen |

The last one is a preview-tool artefact, not a site bug: in an automated headless
browser `requestAnimationFrame` never fires, so the intro overlay's exit animation never
completes and it stays on screen. In a normal browser it clears after about four seconds.
If a projector ever seems stuck on the black "ENTER SITE" screen, wait four seconds, then
hard-refresh.

---

## Before you go live (not for the demo — for the real thing)

The demo runs on a file store with a known password. The live site must not. On the
server, after deploying, run:

```bash
npm run preflight
```

It checks the database, the session secret, the admin password, the uploads folder and
the database schema, and refuses to pass while any of them are unsafe. Right now it will
correctly fail on the default password and the missing secret. Full deployment steps are
in [DEPLOY.md](DEPLOY.md).

**Never show this password on a projector**, and never open `/mkuruadmin` on the
public-facing screen during a presentation.
