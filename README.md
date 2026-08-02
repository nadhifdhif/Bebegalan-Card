# Bebegalan Card

Versi online dari **Bebegalan** (a.k.a. "Begal Kartu"), permainan kartu remi
khas Jawa Barat yang mirip [Go Fish](https://cardgames.io/gofish/) tapi
dengan aturan yang lebih ketat soal apa yang harus kamu ungkapkan ke lawan.

Status: **under development**. Dibangun bertahap per-milestone.

## Aturan Bebegalan

- Pemain: **2-6 orang**, satu dek kartu remi standar (52 kartu, tanpa joker).
- Pembagian kartu awal: 7 kartu/pemain untuk 2 pemain, 5 kartu/pemain untuk
  3-6 pemain (konvensi Go Fish standar). Sisanya jadi tumpukan **cangkulan**.
- Saat giliran, pemain harus menyebutkan **angka DAN kembang spesifik**
  (mis. "As Hati"), bukan cuma angka seperti Go Fish.
  - Kembang pakai istilah lokal: **tempe** (diamond), **keriting** (clubs),
    **hati** (hearts), **sekop** (spades).
  - Pemain hanya boleh bertanya untuk angka yang dia punya minimal 1 di
    tangan.
- **Tebakan benar (hit):** lawan wajib memberi **1 kartu itu saja** (bukan
  semua kartu senilai itu seperti Go Fish). Penanya **tetap pegang giliran**
  dan boleh bertanya lagi (ke lawan yang sama atau lawan lain).
- **Tebakan salah (miss):** penanya **cangkul** (ambil 1 kartu dari
  tumpukan cangkulan), lalu giliran pindah ke pemain berikutnya.
- **Set/buku:** satu angka otomatis jadi "buku" begitu seorang pemain
  memegang ke-4 kembang dari angka itu (tempe+keriting+hati+sekop).
- **Menang:** ketika seluruh 52 kartu sudah masuk ke buku seseorang, atau
  tumpukan cangkulan habis dan semua tangan pemain kosong. Pemenang adalah
  pemain dengan buku terbanyak.

> Aturan di atas adalah asumsi awal yang diimplementasikan di
> `packages/shared`. Kalau ada detail yang meleset dari cara main aslinya,
> tinggal koreksi - logikanya terpusat di satu tempat (`engine.ts`) jadi
> gampang disesuaikan.

## Arsitektur (rencana)

Monorepo pnpm workspaces:

```
apps/
  web/      Vue 3 + Vite (SPA) - UI, papan permainan, lobby
  server/   Node.js (Fastify) + Socket.IO - room, realtime gameplay, auth, leaderboard
packages/
  shared/   Logic aturan kartu (murni TypeScript, tanpa dependency framework)
            dipakai oleh server (source of truth/validasi) & web (prediksi UI)
```

Kenapa begini: `packages/shared` jadi satu-satunya tempat aturan permainan
didefinisikan, supaya client tidak bisa curang (server selalu re-validasi
pakai fungsi yang sama) dan supaya UI bisa preview state tanpa duplikasi
logic.

## Roadmap / Milestone

- [x] **M1** - Scaffold monorepo + game engine inti (`packages/shared`) + unit test
- [ ] **M2** - Backend: Fastify + Socket.IO, room manager, auth (register/login), leaderboard (SQLite)
- [ ] **M3** - Frontend: Vue 3 + Vite, lobby/room UI, papan kartu, koneksi realtime
- [ ] **M4** - Polish: undangan room, reconnect handling, deploy (VPS/PaaS)

## Menjalankan

Repo ini pakai [pnpm](https://pnpm.io) workspaces.

```bash
pnpm install
pnpm test     # menjalankan test semua package (saat ini: packages/shared)
```

## Struktur `packages/shared`

- `src/cards.ts` - primitif kartu (suit, rank, deck, shuffle deterministik/testable)
- `src/types.ts` - tipe `GameState`, `PlayerState`, `AskInput`, `PublicGameState`, `BebegalanError`
- `src/engine.ts` - `createGame`, `askCard`, `toPublicState` (state sepenuhnya immutable dari luar, hanya diubah lewat fungsi-fungsi ini)
- `tests/` - unit test (Vitest)

## Author
- Naufal Nadhif Rabbani Iskandar
