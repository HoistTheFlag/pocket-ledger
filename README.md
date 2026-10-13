# Pocket Ledger — free iPhone web app

Pocket Ledger is a Progressive Web App (PWA). It uses HTML, CSS, and JavaScript rather than Xcode. It has no paid Apple developer account, no seven-day code-signing expiration, and no backend. Purchases are saved **locally on the device/browser in which you use the app**.

## Features

- Add a purchase with an amount, category, date, and optional description.
- Edit or delete purchases; browse previous months.
- Monthly total, spending by category, and recent purchases.
- Select **multiple categories** for a combined total across 1, 3, or 12 months, or all time. Select the ending month.
- Rename, add, recolor, or delete unused categories.
- Export **JSON backups** of purchases and categories and restore a JSON backup.
- Export purchases to **CSV**, and import CSV files (including files exported by the earlier SwiftUI Pocket Ledger app).
- Works without internet after its files have been cached on the iPhone.

There are no analytics, trackers, bank-account connections, or external libraries. This app assumes US dollars.

---

## A. Host it for free with GitHub Pages (first time only)

You need a **free GitHub account** and a computer. You do **not** need Xcode or an Apple Developer membership.

### 1. Unzip the app

1. Download `PocketLedger-PWA.zip` to your Mac.
2. Double-click the ZIP file to extract it.
3. Open the extracted `PocketLedger-PWA` folder in Finder.
4. You should see these files **directly inside that folder**:

   - `index.html`
   - `styles.css`
   - `app.js`
   - `sw.js`
   - `manifest.webmanifest`
   - `icon-192.png`
   - `icon-512.png`
   - `apple-touch-icon.png`
   - `README.md`

**Keep those file names unchanged. Do not upload just the ZIP file.**

### 2. Create a repository on GitHub

1. Go to **https://github.com/** and sign in (or create a free account).
2. Click the **+** menu (top right) → **New repository**. You can also use https://github.com/new.
3. For **Repository name**, enter `pocket-ledger`.
4. Choose **Public**. This is required for GitHub Pages with GitHub Free. **Public means the app's code is visible, NOT your purchases**; purchases remain in your phone's browser storage.
5. Leave the optional **Add a README file** initialization off, since this project already contains one.
6. Click **Create repository**.

### 3. Upload the app files

1. On the new repository page, click **uploading an existing file** if shown. Otherwise choose **Add file → Upload files**.
2. In Finder, open the extracted `PocketLedger-PWA` folder, select **all nine files inside it** (`Command + A`), and drag them into GitHub's upload area. Alternatively, use GitHub's **choose your files** picker to select all nine files.
3. GitHub should show `index.html`, `sw.js`, `app.js`, and the other files at the **top level of the repository**. There should NOT be an extra `PocketLedger-PWA/` folder in the repository.
4. Scroll to the bottom and click **Commit changes**. Wait for the upload to finish.

**Never upload your personal CSV or JSON backup to the GitHub repository.**

### 4. Turn on GitHub Pages

1. Inside the `pocket-ledger` repository, click **Settings**.
2. On the left, find **Pages** (under **Code and automation**).
3. Under **Build and deployment**, choose **Source → Deploy from a branch**.
4. Select **Branch: `main`** and **Folder: `/(root)`**, then click **Save**.
5. Wait a few minutes. GitHub says publishing can sometimes take **up to 10 minutes**.
6. Return to **Settings → Pages** and find the **Visit site** link.

Your finished app's address will usually be:

`https://YOUR-GITHUB-USERNAME.github.io/pocket-ledger/`

Replace `YOUR-GITHUB-USERNAME` with your GitHub username. (If you chose a different repository name, use that instead of `pocket-ledger`.)

**Important:** Open the `.github.io` address, not `github.com/YOUR-GITHUB-USERNAME/pocket-ledger`; the latter only displays source code.

---

## B. Install it on your iPhone (first time only)

1. Connect your iPhone to the internet.
2. Open **Safari** on your iPhone. Navigate to your published `https://...github.io/pocket-ledger/` address.
3. Confirm you see the **Pocket Ledger** dashboard, not a GitHub file listing.
4. Tap the **Share** button. Depending on your iOS version and Safari layout, you may need to tap the **Page Menu** (near the address bar) and then **Share**.
5. Scroll down and tap **Add to Home Screen**.
6. If **Open as Web App** is shown, make sure it's **ON**.
7. Keep the name **Pocket Ledger** and tap **Add**.
8. Return to your Home Screen, tap the new Pocket Ledger icon, and let it fully open **once while online**. This gives the app a chance to cache its files for offline use.
9. You can now use this Home Screen app without opening Xcode, pairing a device, or re-signing it every seven days.

If **Add to Home Screen** isn't in the Share menu, scroll to the bottom of the Share actions, select **Edit Actions**, and add it.

### Check offline mode

After opening the installed app at least once while online, turn off both cellular data and Wi-Fi, then reopen Pocket Ledger from its Home Screen icon. Its interface and saved purchases should load. If not, turn the internet back on, open the app, and retry after it has loaded once online.

---

## C. Using Pocket Ledger

### Add a purchase

1. In the app, tap the round **+** button in the lower-right corner.
2. Enter **Amount** (example `12.50`), select a **Category**, select a **Date**, and optionally add a description.
3. Tap **Add purchase**. Your purchase immediately appears in the relevant month.

### Edit, delete, or view previous months

1. Tap **Purchases** in the bottom bar.
2. Use **‹ / ›** next to the month to move backward or forward; you can't move beyond the current month.
3. Tap an existing purchase to edit its amount/category/date/description, or choose **Delete**.

### Compare spending in several categories

1. Tap **Compare** in the bottom bar.
2. Choose an ending month with the arrows.
3. Choose **1 month**, **3 months**, **12 months**, or **All time**.
4. Tap any combination of categories to include or exclude them. **Select all** and **Clear** are shortcuts.
5. The **Combined spending** number is the sum of **only the selected categories** within the chosen range. A monthly trend appears for the 3- or 12-month ranges.

### Create or edit categories

Open **Settings → + New category**. To change an existing category, select its **Edit** button. You cannot delete a category while purchases still use it; edit the purchases to another category first.

---

## D. Back up your purchases (strongly recommended)

**A PWA avoids Apple's seven-day expiration, but it is NOT a permanent cloud backup.** Data can be lost if the Home Screen app is removed, its website data is cleared, or iOS clears local storage.

1. Open the **installed** Pocket Ledger app.
2. Go to **Settings → Back up everything (JSON)**.
3. Depending on your iOS version, Pocket Ledger will open a Share sheet or start downloading the file.
4. In the Share sheet, choose **Save to Files**, preferably in **iCloud Drive**. If it downloads instead, find the file in **Files → Downloads** and move a copy into iCloud Drive or another backup location.
5. Confirm that the file exists and its name is similar to `PocketLedger-Backup-2026-10-13.json`.
6. Repeat after important changes (weekly or monthly is reasonable).

A **JSON backup** saves both category definitions and all purchases. A **CSV export** is useful in spreadsheets but does not preserve custom category colors/icons or original purchase IDs.

### Restore a backup

1. Open the installed app → **Settings → Restore from JSON backup**.
2. Select the previously saved `.json` file in Files.
3. Confirm the restore prompt. **The restore replaces all current purchases and categories**, so back up existing data first if you need it.

### Bring over purchases from the earlier SwiftUI iPhone app

1. In the previous Xcode-installed Pocket Ledger, go to **Settings → Export Purchases as CSV**.
2. Save the `.csv` file to **Files**.
3. In the **PWA**, go to **Settings → Import purchases (CSV)** and select that file.
4. Confirm the import. Existing purchases are kept, and any new category names are created automatically.
5. **Don't import the same CSV twice:** it will create duplicate purchases.

**Important iPhone detail:** Safari and the Home Screen-installed web app can use separate storage. Install Pocket Ledger first, then enter purchases **from the Home Screen icon**. Don't assume purchases you typed into Safari will automatically appear in the installed app. The same rule applies on different devices: there is **no automatic phone/Mac sync**.

---

## E. Update the app later

1. Keep your saved JSON backup.
2. Replace the hosted source files by uploading any updated app files to the **same repository** and committing the changes.
3. Wait for GitHub Pages to publish the changes, then close and reopen the Home Screen app online.
4. Your local purchases normally remain if you keep the same site address and do not clear the app's website data. Back up before updating anyway.

If you edit the offline assets, change the `CACHE_NAME` version string in `sw.js` (for example from `pocket-ledger-shell-v1` to `pocket-ledger-shell-v2`) so the new files can be refreshed in the offline cache.

---

## F. Optional: test it on your Mac before uploading

If Python 3 is available on your Mac:

```bash
cd /path/to/PocketLedger-PWA
python3 -m http.server 8000
```

Then visit **http://localhost:8000/** in a desktop browser. Stop the server with `Control + C`.

Do **not** open `index.html` by double-clicking it and assume that means the PWA is installed. The offline service worker requires an HTTPS site or `localhost`. GitHub Pages provides HTTPS automatically. This Mac preview is not a deployed iPhone app.

---

## G. Troubleshooting

**GitHub Pages shows 404:** Make sure the repository is public, Pages is deployed from **main / (root)**, `index.html` is directly in the repository root, and you're visiting your **username.github.io** address. Allow up to 10 minutes after publishing.

**I can't see the install option:** Open the GitHub Pages URL using **Safari**, not the GitHub app or a chat-app browser, then find **Add to Home Screen** in the Share actions.

**The icon opens a blank screen:** Check that `index.html`, `styles.css`, `app.js`, `sw.js`, and `manifest.webmanifest` were all uploaded at repository root. Reopen the hosted site online and try again. Browser developer console errors can help if it persists.

**My purchases appear missing:** Check whether you're in Safari rather than the Home Screen app, whether the installed app was removed/reinstalled, or whether you changed the website address. Restore your most recent JSON backup. This app never stores transactions in GitHub.

**Backups do not download:** On iPhone, try using the Share sheet's **Save to Files**, check **Files → Downloads**, or export in Safari. Verify the file exists before clearing or removing anything.

**I want bank-account sync:** That would require a more sophisticated authenticated backend; this first version is intentionally manual entry and device-local.

---

## Privacy and limitations

- **Hosting:** GitHub Pages serves the public app code over HTTPS. The GitHub repository and hosted code are public on a free account.
- **Storage:** Purchases stay inside this browser/PWA's `localStorage` on this device. This code does not transmit them to GitHub or another server. It is **not encrypted by Pocket Ledger** and not protected by an in-app password.
- **Offline:** Once loaded and cached, the application works offline. Hosting is required for the initial installation and for receiving updates.
- **Persistence:** The app has **no weekly signing expiration**, but local web data is not guaranteed to survive device resets, uninstallations, browser data clearing, or storage eviction. Keep JSON backups elsewhere.
- **Synchronization:** No automatic iCloud sync or cross-device synchronization. The same website in different browser contexts/devices may maintain different local data.
- **Currency:** USD only. Manual purchases only.

Official references: [GitHub Pages instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site), [Apple: turn a website into a web app](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios), [MDN: PWA secure hosting](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
