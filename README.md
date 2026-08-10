# Bebegalan Card

Versi online dari **Bebegalan** (a.k.a. "Begal Kartu"), permainan kartu remi
khas Jawa Barat yang mirip [Go Fish](https://cardgames.io/gofish/) tapi
dengan aturan yang lebih ketat soal apa yang harus kamu ungkapkan ke lawan.

Status: **under development**. Dibangun bertahap per-milestone.

## Aturan Bebegalan

- Pemain: **2-6 orang**, satu dek kartu remi standar (52 kartu, tanpa joker).
- Pembagian kartu awal: 7 kartu/pemain untuk 2 pemain, 5 kartu/pemain untuk
  3-6 pemain (konvensi Go Fish standar). Sisanya jadi tumpukan **cangkulan**.
- Saat giliran, alur bertanya **dua tahap** (bukan langsung angka+kembang
  sekaligus seperti asumsi awal):
  1. **Tanya angka** — sebutkan salah satu angka yang kamu pegang (mis.
     "As") ke satu lawan. Lawan cuma mengungkap **apakah dia punya angka
     itu atau tidak** — kembangnya belum ditanyakan sama sekali di tahap
     ini.
  2. Kalau lawan **tidak punya angkanya sama sekali**, kembang tidak pernah
     ditanyakan — penanya langsung **cangkul** (ambil 1 kartu dari
     tumpukan cangkulan), giliran pindah ke pemain berikutnya.
  3. Kalau lawan **punya**, penanya baru menebak **kembang spesifiknya**
     (mis. "Sekop"):
     - Tebakan benar (hit): lawan wajib memberi **1 kartu itu saja** (bukan
       semua kartu senilai itu seperti Go Fish). Penanya **tetap pegang
       giliran** dan boleh bertanya lagi (ke lawan yang sama atau lawan
       lain).
     - Tebakan meleset (miss): penanya cangkul, giliran pindah ke pemain
       berikutnya — sama seperti kasus angka tidak ada di atas.
  - Kembang pakai istilah lokal: **tempe** (diamond), **keriting** (clubs),
    **hati** (hearts), **sekop** (spades).
  - Pemain hanya boleh bertanya untuk angka yang dia punya minimal 1 di
    tangan.
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
    useSoloTable.ts              # alur giliran (tanya-angka lalu tebak-kembang, 2 tahap) + animasi kartu
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
ulang. **Solo Player memang sengaja tidak lewat backend** — lawan main
cuma bot lokal, jadi tidak ada yang perlu disinkronkan lewat server; itu
berlaku selamanya, bukan cuma sementara sampai M3 selesai.

Engine-nya memisahkan cek-angka (`checkRank`) dari tebak-kembang
(`guessSuit`) sebagai dua fungsi terpisah, persis alur dua tahap di atas —
kalau angkanya saja sudah tidak ada, `guessSuit` tidak pernah dipanggil.

Bot punya 3 level kesulitan (tipe `BotDifficulty` di `src/game/types.ts`):
**Sepele**, **Lumayan**, dan satu level tersulit yang di dokumen ini kita
sebut **"mode licik"** (nama tombolnya sendiri di UI beda, cek langsung
kodenya kalau perlu persisnya). Level lebih tinggi mengingat tebakan yang
sudah pernah meleset dan memprioritaskan angka yang paling dekat jadi
buku. Khusus di **mode licik**, ada 10% kesempatan menu tebak-kembang juga
menawarkan kembang yang sudah kamu pegang sendiri (buat mancing/bluff),
walau lawan mustahil betulan pegang kartu yang sama persis.

Aset 52 kartu ada di `src/assets/cards/` (lihat `CREDITS.md` di
folder itu untuk lisensinya).

### Gaya bahasa UI

Nama komponen/route tetap bahasa Inggris/teknis (`solo-player`,
`multiplayer`, `SoloPlayerView.vue`, dst) supaya konsisten buat
development, tapi **teks yang tampil ke pemain** sengaja pakai gaya santai
"tongkrongan" (mis. tombol menu "Begal Online" / "Begal Sendiri" /
"Pengaturan Begal", bukan istilah formal seperti "Multiplayer"/"Settings")
sesuai identitas **Begal Kartu**. Kalau nambah teks baru yang tampil ke
user, ikuti gaya ini.

## Arsitektur target (rencana, belum diimplementasikan)

Kalau/ketika backend digarap (mulai M3 di roadmap), rencananya migrasi ke
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
