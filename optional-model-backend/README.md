# TRACEWORK D3.1 — Optional live form-image generation

The GitHub Pages website **cannot safely contain your OpenAI API key**. Deploy `worker.js` as a separate Cloudflare Worker, then add these settings in the Cloudflare **Worker** dashboard:

* Secret `OPENAI_API_KEY`: your OpenAI API key (never type it into TRACEWORK's browser form or commit it to GitHub).
* Secret `TRACEWORK_ACCESS_TOKEN`: a long independent random access token for your use of this Worker.
* Plain configuration `ALLOWED_ORIGIN`: `https://aliuuah23.github.io` (the public GitHub Pages origin).
* Optional plain configuration `IMAGE_MODEL`: `gpt-image-1.5` (use an available supported image model).
* Recommended: apply per-route account-level rate/cost limiting. The Worker optionally supports a configured Cloudflare rate-limit binding `TRACEWORK_RATE_LIMIT` and will reject excess requests. Access tokens protect the endpoint only while secret, so do not share them.

Deploy the Worker, then in TRACEWORK open **Architectural Propositions → Connect image model** and enter its **HTTPS** URL ending in `/generate` and your *Worker access token*, NOT your OpenAI API key. TRACEWORK stores these settings in browser **session storage**, not project JSON. Generated results are explicitly initiated and may incur API charges.

**State:** The site ZIP wires the front end and bundles the Worker, but neither the Worker nor model API is automatically activated. The website remains fully functional for procedural images and all existing maps without the Worker.

**Provenance:** Live AI images are marked as speculative and model-generated, not participant-authored material, verified construction drawings, or a record of an original design decision. Review before sharing participants' text with an external service.
