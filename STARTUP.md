# Starting InvenTree After Turning On Your PC

This is your everyday "how do I get it running again" guide. The one-time setup
is already done — you do **not** need to reinstall anything or create your login
again. Your data and your admin account are saved and will still be there.

Follow these steps in order every time you sit down to work.

---

## Step 1 — Start Docker

InvenTree runs inside "Docker". Open **Docker Desktop** from your Start menu and
wait until it says **"Engine running"** (the whale icon in the taskbar stops
animating). If Docker isn't running, nothing else will work.

## Step 2 — Open the project in VS Code

1. Open **Visual Studio Code**.
2. It usually reopens the InvenTree folder automatically. If not, use
   **File → Open Recent → InvenTree**.
3. VS Code will pop up a message in the bottom-right: **"Reopen in Container"**.
   Click it.
   - If you miss the popup: click the blue **`><`** icon in the very
     bottom-left corner, then choose **"Reopen in Container"**.
4. Wait 1–2 minutes while the container starts (the database and everything else
   start automatically). You'll know it's ready when the bottom-left corner
   shows **"Dev Container: InvenTree devcontainer"**.

## Step 3 — Open terminals and start the servers

You need **two** terminals running at the same time. Each one runs one server
and must stay open.

1. Open a terminal: press **Ctrl + `** (the key above Tab), or menu
   **Terminal → New Terminal**.
2. In this **first** terminal, type this and press Enter:
   ```bash
   invoke dev.server
   ```
   Wait until it stops scrolling and shows a line like
   `Starting development server at http://0.0.0.0:8000/`.
   **Leave this terminal alone** — do not close it or type in it again.

3. Open a **second** terminal: click the **`+`** icon on the right side of the
   terminal panel.
4. In this second terminal, type this and press Enter:
   ```bash
   invoke dev.frontend-server
   ```
   Wait until it shows a line like `Local:   http://localhost:5173/`.
   **Leave this terminal alone** too.

   > If it shows an error about "lingui compile" the first time, just run the
   > same command again — it's a harmless timing hiccup and works on the second try.

## Step 4 — Open InvenTree in your browser

Go to **http://localhost:5173** and log in with the admin username and password
you created during setup.

That's it — you're working. When you edit code, the page updates automatically.

---

## When you're finished for the day

1. Click on each terminal and press **Ctrl + C** to stop the servers.
2. Close VS Code.
3. (Optional) Quit Docker Desktop.

Nothing is lost — everything picks back up from Step 1 next time.

---

## Quick troubleshooting

- **"Reopen in Container" never appears / stuck:** Make sure Docker Desktop is
  fully running (Step 1), then close and reopen VS Code.
- **`invoke dev.server` drops back to a normal prompt instead of staying open:**
  That means it crashed. Copy whatever it printed and send it to Claude.
- **Browser page won't load at localhost:5173:** Check that *both* terminals are
  still running their servers and haven't shown errors.
- **The `invoke frontend` command errored on "lingui compile":** Run
  `invoke dev.frontend-server` again — it almost always works the second time.

---

## The commands, all in one place

```bash
invoke dev.server            # Terminal 1 — the backend (keep open)
invoke dev.frontend-server   # Terminal 2 — the website (keep open)
```

You only ever need these two to start working again.
