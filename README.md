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

> Aturan di atas adalah asumsi awal. Kalau ada detail yang meleset dari cara
> main aslinya, tinggal koreksi — logic-nya sudah dipusatkan di satu tempat
> (`src/game/`, lihat bagian Solo Player di bawah) supaya gampang
> disesuaikan.

## Stack saat ini

Ini kondisi nyata di branch ini (bukan rencana) — proyek masih **satu
package Vite biasa**, belum monorepo:

- **Frontend**: Vue 3.5 + Vite 8 + Vue Router 5 + Pinia 4, TypeScript,
  ESLint + oxlint + Prettier.
- **Backend**: belum ada.

Struktur frontend dipecah per fitur, bukan satu file besar:

```
src/
  layouts/GameShellLayout.vue   # shell menu: background dekoratif, animasi flip-card, toast
  views/
    home/HomeView.vue           # main menu
    settings/SettingsView.vue
    solo-player/
      SoloPlayerView.vue        # setup (difficulty, jumlah pemain) — masih di dalam flip-card
      SoloTableView.vue         # meja permainan sungguhan — full-screen, route /play/solo
    multiplayer/MultiplayerView.vue
  game/                         # engine Bebegalan, TypeScript murni (tanpa Vue) — lihat bagian Solo Player
  stores/
    settings.ts                 # Pinia: sound & animasi (persist ke localStorage)
    soloGame.ts                 # Pinia: state permainan Solo Player
  composables/
    useNotification.ts
    useSoloTable.ts              # alur giliran + animasi kartu utk SoloTableView
  components/
    PlayingCard.vue              # satu kartu (flip depan/belakang)
    FlyingCard.vue                # animasi kartu berpindah antar tangan/pile
  assets/cards/                  # 52 gambar wajah kartu (lihat CREDITS.md di folder itu)
  router/                        # routing per fitur (/settings, /solo-player, /multiplayer, /play/solo)
```

### Solo Player (sudah bisa dimainkan, 100% di browser)

Solo Player punya game engine Bebegalan yang sungguhan jalan di
`src/game/` (`types.ts`, `deck.ts`, `engine.ts`, `bot.ts`) — ditulis
sebagai TypeScript murni tanpa dependency Vue sama sekali, supaya bisa
dipindah utuh ke `packages/shared` nanti (lihat roadmap M4) tanpa ditulis
ulang. **Solo Offline memang sengaja tidak lewat backend** — lawan main
cuma bot lokal, jadi tidak ada yang perlu disinkronkan lewat server; itu
berlaku selamanya, bukan cuma sementara sampai M2 selesai.

Bot punya 3 level (`easy`/`normal`/`hard`) yang bedanya cara mereka
memilih apa yang ditanyakan — level lebih tinggi mengingat tebakan yang
sudah pernah meleset dan memprioritaskan angka yang paling dekat jadi
buku. Aset 52 kartu ada di `src/assets/cards/` (lihat `CREDITS.md` di
folder itu untuk lisensinya).

## Arsitektur target (rencana, belum diimplementasikan)

Kalau/ketika backend digarap (mulai M2 di roadmap), rencananya migrasi ke
monorepo pnpm workspaces:

```
apps/
  web/      Vue 3 + Vite (isi src/ yang sekarang pindah ke sini)
  server/   Node.js (NestJS) + Socket.IO — room, realtime gameplay, auth, leaderboard
packages/
  shared/   Logic aturan kartu (murni TypeScript, tanpa dependency framework)
            dipakai oleh server (source of truth/validasi) & web (prediksi UI)
```

Kenapa begini: `packages/shared` jadi satu-satunya tempat aturan permainan
didefinisikan, supaya client tidak bisa curang (server selalu re-validasi
pakai fungsi yang sama) dan supaya UI bisa preview state tanpa duplikasi
logic. Backend Node.js (bukan Laravel) dipilih supaya tipe & logic ini bisa
langsung dipakai bareng dengan frontend TypeScript, dan karena game ini
butuh realtime (Socket.IO) yang lebih native di ekosistem Node dibanding
harus menambah infra broadcasting terpisah.

## Roadmap / Milestone

- [x] **M0** — Scaffold Vue + UI main menu & 3 panel (Online/Solo/Settings),
      awalnya semua dalam 1 file (`HomeView.vue`)
- [x] **M1** — Refactor frontend jadi per-fitur (`home` / `settings` /
      `solo-player` / `multiplayer`) + routing, shared design-system CSS
- [x] **M2** — Solo Player bisa dimainkan end-to-end: game engine Bebegalan
      (`src/game/`), 52 aset kartu asli, animasi bagi/tanya/hit/miss, bot
      easy/normal/hard — 100% client-side, tanpa backend
- [ ] **M3** — Scaffold backend (NestJS + Socket.IO) — **khusus untuk
      Multiplayer/Online Room**, bukan Solo (Solo tetap client-side
      selamanya, lihat catatan di bagian Solo Player)
- [ ] **M4** — Pindahkan `src/game/` ke `packages/shared` saat monorepo
      dibentuk, dipakai backend sebagai source of truth validasi realtime
      (server re-validasi tiap `ask`, supaya client tidak bisa curang)
- [ ] **M5** — Multiplayer realtime penuh (room manager, event socket,
      reconnect handling)
- [ ] **M6** — Auth (register/login), leaderboard, deploy

## Menjalankan

```bash
npm install
npm run dev          # dev server (Vite)
npm run test:unit    # Vitest
npm run lint         # oxlint + eslint
npm run type-check   # vue-tsc
npm run build        # production build
```

## Author

- Naufal Nadhif Rabbani Iskandar
