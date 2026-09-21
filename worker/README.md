# Site chat Worker

The chat widget on the site talks to this Worker. The Worker holds the
OpenRouter key and decides what is answerable; the browser holds neither.

```
browser                Cloudflare Worker                  OpenRouter
  │  POST /chat          │                                   │
  │  {question,history}  │ 1 origin allow-list               │
  ├─────────────────────>│ 2 rate limit per IP               │
                         │ 3 length / shape                  │
                         │ 4 injection + private-info regex  │
                         │ 5 BM25 gate over data/kb.json  ───┼── below threshold:
                         │                                   │   quip, no call, no cost
                         │ 6 context-only prompt ───────────>│
                         │ 7 NO_ANSWER / leak check <────────┤
  <──────────────────────┤                                   │
  {answer, grounded, sources}
```

## Deploy

```sh
cd worker
npm install
npx wrangler login
npx wrangler secret put OPENROUTER_API_KEY    # paste the key at the prompt
npx wrangler deploy
```

Deploy prints a URL like `https://kaushik-site-chat.<subdomain>.workers.dev`.
Put that URL plus `/chat` into `ENDPOINT` at the top of `assets/js/chat.js`.
Until you do, the widget disables itself and logs a warning — it never ships
a half-configured chat box to visitors.

Check it: `curl https://kaushik-site-chat.<subdomain>.workers.dev/health`

## The key

It is set as a Wrangler secret, which is encrypted at rest and never appears
in `wrangler.toml`, in git, or in any response. Nothing in this repo contains
it. For local `wrangler dev`, put it in `worker/.dev.vars` (already gitignored):

```
OPENROUTER_API_KEY=sk-or-v1-...
```

Set a spend limit on the key at https://openrouter.ai/keys. The rate limiter
bounds abuse, but a spend cap is the only bound that cannot be argued with.

## Editing what the bot knows

Everything it can say lives in `../data/kb.json`. Add a chunk, push to GitHub
Pages, done — the Worker refetches within 10 minutes and needs no redeploy.
`deflections` are the quips for off-topic questions; `refusals` are the fixed
replies for injection attempts and for things the site does not publish.

## Tuning the gate

```sh
node tune.mjs 1.5 0.4     # <MIN_SCORE> <MIN_COVERAGE>
```

Prints every question in its two lists with the retrieval score it earned, so
a threshold change is a measurement rather than a guess. Current setting
(1.5 / 0.4) passes 20/20 real questions and stops 10/12 off-topic ones before
the model; the other 2 are caught by the model's `NO_ANSWER` instruction.

Add your own questions to the lists in `tune.mjs` as real visitors surprise you.

## Tests

```sh
node test.mjs      # guards + knowledge-base integrity, offline, no key needed
```

## Vars

| Var | Meaning |
| --- | --- |
| `KB_URL` | Where the knowledge base is fetched from |
| `ALLOWED_ORIGINS` | Comma-separated; anything else gets 403 |
| `MODEL` | OpenRouter model slug |
| `MIN_SCORE` / `MIN_COVERAGE` | The retrieval gate |
| `RATE_LIMIT` / `RATE_WINDOW_S` | Requests per IP per window |

Rate limiting is per Worker isolate, so the real ceiling is a multiple of
`RATE_LIMIT` across Cloudflare's edge. That is deliberate: the goal is to stop
one bored visitor burning credits, not to enforce an exact quota.
