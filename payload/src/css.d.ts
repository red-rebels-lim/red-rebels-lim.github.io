// Allow side-effect CSS imports in the Next.js app (next-env.d.ts is gitignored
// and TS 6 no longer tolerates untyped side-effect imports during `next build`).
declare module '*.css'
// @payloadcms/next exports ./css without type declarations
declare module '@payloadcms/next/css'
