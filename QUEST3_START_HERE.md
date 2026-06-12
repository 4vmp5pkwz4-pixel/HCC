# QUEST3_START_HERE — getting into VR in 5 minutes

The #1 reason "the VR button does nothing": **WebXR only works in a secure
context.** Never open the app as a local file.

## Do NOT
- ❌ open `index.html` via `file://` or `content://` (Downloads, file managers)
- ❌ use plain `http://` on a LAN address (except `http://localhost` *on-device*)
- ❌ expect VR in the Quest's 2D "PWA-less" wrappers — use **Meta Quest Browser**

## DO — serve over HTTPS (any of these)
1. **GitHub Pages** — push the repo, enable Pages → `https://<user>.github.io/<repo>/`
2. **Netlify / Vercel / Cloudflare Pages** — drag-and-drop the folder
3. **Cloudflare Tunnel** from localhost:
   ```bash
   python3 -m http.server 8000
   cloudflared tunnel --url http://localhost:8000
   ```
   → opens a temporary `https://….trycloudflare.com` URL

## Then, on the Quest 3 (Meta Quest Browser)
1. Open your HTTPS URL.
2. Press **XR CHECK** in the header. Verify:
   - Secure context: **yes**
   - navigator.xr: **yes**
   - immersive-vr supported: **yes**
3. First sanity test: open `…/index.html?xrtest=1` and press **🥽 Enter VR** —
   you should stand on a grid next to a rotating gold cube with controller rays.
   *If THIS fails, the problem is serving/browser/permissions — not the app.*
4. Go back to the full app and press **🥽 Enter VR**.
5. If anything fails: the button shows `XR failed — open XR CHECK`; the panel
   shows the exact `requestSession` error (name/message/phase). Press
   **⬇ Export XR Diagnostics JSON** and attach it to a bug report.

## Button meaning
| Label | Meaning |
|---|---|
| `XR: checking…` | capability probe running |
| `XR: HTTPS required` | insecure context — fix serving first |
| `XR: unsupported browser` | no `navigator.xr` (e.g. iPhone Safari) |
| `XR: VR unsupported` | browser has WebXR but no immersive-vr |
| `🥽 Enter VR` / `◈ Enter MR` | ready — tap to enter |
| `XR failed — open XR CHECK` | session request failed; details inside |

## If `requestSession` fails with local-floor
Open XR CHECK and enable **Fallback reference space ('local')**, then retry —
some browser builds reject `local-floor` as a *required* feature.

## iPhone note
iOS Safari has **no WebXR** — the header will honestly say
`XR: unsupported browser`. Use **📱 Motion** instead: tap *Enable Motion
Control*, grant the sensor permission (iOS asks once, HTTPS required), then
pick a motion mode (Orbit / Inside Sphere Look / FBS3R Ladder Tilt / S³ Chi
Tilt / Fractal Flight).
