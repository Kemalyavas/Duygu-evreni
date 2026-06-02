# Duygu Evreni

3D, anonymous emotion-sharing platform. People turn feelings into stars that orbit
ten themed "emotion planets"; you read others' stars anonymously and can start
anonymous 1:1 conversations.

**Live:** [www.duyguevreni.com](https://www.duyguevreni.com)

## Highlights

- Single-canvas Three.js universe with InstancedMesh star rendering (scales to thousands of orbiting stars)
- Two-layer content moderation: fast local Turkish keyword/pattern filter + Google Gemini for context
- Realtime anonymous messaging (requests, accept/reject, blocking, nicknames, notifications)
- Server-rendered, SEO-focused emotion content pages + Turkish/English i18n

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Three.js** + React Three Fiber + Drei + postprocessing
- **Supabase** (Postgres, Auth, Realtime, RLS)
- **Zustand**, **Tailwind CSS 4**, **Framer Motion**

## Develop

```bash
npm install
cp .env.local.example .env.local   # then fill in Supabase + Gemini keys
npm run dev        # http://localhost:3000
npm run build
npm run test:run   # Vitest
npm run lint
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture, the data model, and the moderation/safety design.
