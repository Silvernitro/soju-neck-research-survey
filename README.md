# SOJU Neck Research Survey

An interactive visual-perception survey built with React, TypeScript, and Vite.

## Development

```bash
npm install
npm run dev
```

Use `npm run typecheck` to check TypeScript and `npm run build` to create a production bundle.

## Parent iframe integration

Set `VITE_PARENT_ORIGIN` to the embedding page's exact origin (for example,
`https://research.example.org`). Production builds require this value and use it as
the `postMessage` target origin. When it is unset during Vite development only, the
app accepts its immediate parent's origin and sends with the relaxed `"*"` target so
local host pages can use arbitrary ports. Do not rely on that fallback in production.

Run `npm run dev` and open `/iframe-host.html` for a small development host that logs
the survey's `ready`, `width-change`, and `value` protocol messages.
