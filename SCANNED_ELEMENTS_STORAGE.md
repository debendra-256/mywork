# Scanned Elements Storage Guide (ImgMojo)

This document details exactly where and how scanned images and template elements are stored, synchronized, and made permanently available to **all users** across ImgMojo (in both the **Create Poster / Template Studio** and the **Element Scanner**).

---

## 1. Where Scanned Images & Elements Are Saved

All scanned elements are saved in two persistent server locations within the repository, plus client-side local caching:

| Asset | Exact Path on Disk | Public URL / Access | Description |
|---|---|---|---|
| **Image Files** | `public/ScannedElement/` | `/ScannedElement/<id>.<ext>` | High-resolution WebP/PNG cutouts and element graphics. Bundled with every build into `dist/ScannedElement/` and served via CDN. |
| **Element Registry** | `data/scanned-elements.json` | Server API: `/api/scanned-elements` | Central JSON database containing element IDs, names, assigned tags (`Birthday`, `NamePlate`, `Text`, `Festival`, etc.), aspect ratios, and editable slot coordinates. |
| **Server Handler** | `api/scanned-elements.js` | `GET`, `POST`, `DELETE /api/scanned-elements` | Serverless/Vite API endpoint that reads/writes elements and automatically decodes uploaded base64 data URLs into real files inside `public/ScannedElement/`. |
| **Browser Cache** | Browser `localStorage` | Key: `promptseen.poster.elements.v1` | Offline client cache that merges safely with server elements so elements load instantly with 0ms delay. |

---

## 2. File Structure

```text
ImgMojo/mywork/
├── api/
│   └── scanned-elements.js         # API endpoint for server read/write/delete
├── data/
│   └── scanned-elements.json       # Permanent shared database of scanned elements
├── public/
│   ├── ScannedElement/             # All uploaded element cutouts/graphics
│   │   ├── .gitkeep
│   │   └── el_mwd32wmn_t1wqn.webp  # Example: 03 Birthday Headline
│   └── templates/
│       └── tricolour-card.png      # Built-in Tricolour Name Plate
└── src/
    └── tools/
        └── poster/
            ├── elements.js         # Client sync logic, tag definitions & non-destructive merging
            └── ElementScanner.jsx  # Element Scanner UI tool
```

---

## 3. How Scanned Elements Are Stored for All Users

1. **Upload & Crop**:
   - An image is loaded into the **Element Scanner** (`/scanner`) or the Template Studio's **Scanned & Assets** panel.
   - Background is removed, tolerance adjusted, and editable text/image slots are configured.
2. **Saving to Server**:
   - When **"Save Element for All Users"** is clicked, the app sends a `POST` request to `/api/scanned-elements`.
   - The server decodes the base64 image and writes it directly to disk:
     `public/ScannedElement/<element_id>.webp`
   - The server appends the element metadata to `data/scanned-elements.json`.
3. **Serving to All Users**:
   - When any user opens the **Create Poster** editor, the editor calls `fetchServerElements()`.
   - The elements are fetched from `/api/scanned-elements` and displayed under the **"Scanned & Assets"** tab in the inspector with tag filtering (`Birthday`, `NamePlate`, `Text`, `Festival`, `Badge`, `Political`, `Other`).
   - Clicking or dragging any scanned element drops it onto the poster canvas as an interactive layer.

---

## 4. How to Ensure Elements Are Never Lost Across Deployments

Because Vercel serverless functions have ephemeral local filesystems during runtime, any element added locally or via scanner should be committed to Git:

```bash
git add public/ScannedElement/ data/scanned-elements.json
git commit -m "Add new scanned element for all users"
git push
```

Once pushed to `origin/master`, Vercel builds `public/ScannedElement/` directly into the public CDN and bundles `data/scanned-elements.json`, making the elements permanent for all visitors worldwide.

---

## 5. Adding Elements Manually

You can also add elements manually at any time without using the scanner:
1. Drop the cutout image into `public/ScannedElement/<filename>.webp` (or `.png`).
2. Add an entry into `data/scanned-elements.json`:
```json
{
  "id": "el_unique_id",
  "name": "My Custom Element",
  "tag": "Festival",
  "src": "/ScannedElement/<filename>.webp",
  "aspect": 2.5,
  "width": 500,
  "height": 200,
  "slots": [],
  "createdAt": 1794460000000
}
```
3. Run `npm run build` and commit the files.
