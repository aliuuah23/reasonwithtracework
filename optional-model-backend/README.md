# Optional TRACEWORK model backend

GitHub Pages cannot securely store an API key or run a model service. Deploy `worker.js` to a separate Cloudflare Worker to enable text-to-new-image generation. This service incurs model costs and is **not** automatically activated by uploading the main ZIP.

Set Worker secrets `OPENAI_API_KEY` and `TRACEWORK_ACCESS_TOKEN` through the Worker platform; set variable `ALLOWED_ORIGIN` to the exact GitHub Pages origin (`https://aliuuah23.github.io`). Never commit keys to GitHub. Keep the Worker private, rate-limit requests or add Cloudflare Access, and monitor billing. The single-user token is entered in TRACEWORK per browser session and is not stored in project JSON.

Enter `https://YOUR-WORKER.workers.dev/generate` and your token in the Design Studies model settings. The backend generates new images from the full project reasoning prompt. Until connected, TRACEWORK retains its offline procedural illustrations and exports but does **not** claim model-level original image generation.
