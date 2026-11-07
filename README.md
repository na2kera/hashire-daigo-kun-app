# 走れだいごくん

成蹊大学の学園祭で QR コードを配布し、スマホのブラウザで遊ぶ 2D ドット絵ゲーム。
教授（だいごくん）がキャンパスを走り回り、60秒以内にアイテムを集めてスコアを競う。

- 公開 URL: https://hashire-daigo-kun-app.na2kera.workers.dev
- 仕様: [docs/DESIGN.md](docs/DESIGN.md)（決定事項・マップ配置・レビュー反映を集約）

## 技術スタック

Phaser 4.2.1 / TypeScript / Vite / Cloudflare Workers（静的アセット配信）。Node 20.19.0。
依存のバージョンは `package.json` で exact 固定。

## 開発

```sh
npm install
npm run dev          # http://localhost:5173（--host 付き。同じ Wi-Fi のスマホから http://<MacのIP>:5173 で実機確認）
npm run typecheck    # tsc --noEmit
npm run build        # dist/ を生成
npm run preview      # dist/ をローカル配信
```

- `?debug` を URL に付けると当たり判定の矩形が表示される
- PC では矢印キー / WASD、スマホでは画面のどこを触ってもバーチャルスティックが出る

## ドット絵素材

`public/sprites/*.png` はスクリプトで生成している（手描き素材ではない）。

```sh
npm run gen:assets   # scripts/gen-assets.mjs → public/sprites/
```

`src/scenes/BootScene.ts` が PNG を読み込み、読み込みや復号に失敗したキーだけ Graphics 描画のプレースホルダーで補う。
スプライトの規約（寸法・フレーム順）は DESIGN.md §8。

## デプロイ

```sh
npm run deploy       # build → wrangler deploy
npm run deploy:dry   # build → wrangler deploy --dry-run
```

`wrangler.jsonc` は `dist/` を静的アセットとして配信するだけの設定。
将来ランキング API（Workers + D1）を足すときは `main` を追加する。

## ディレクトリ

```
src/
  main.ts            Phaser.Game の生成（内部解像度 240×400〜520、Scale.FIT）
  config.ts          定数（秒数・速度・アイテム定義など）
  scenes/            Boot / Title / HowTo / Play / Hud / Result
  map/               キャンパスのマップデータと生成・検証
  entities/          教授・アイテム
  input/             バーチャルスティック・キーボード
  audio/sfx.ts       WebAudio 合成の効果音
  score/             端末ハイスコア（localStorage）とスコア送信の差し込み口
scripts/gen-assets.mjs  ドット絵 PNG の生成
public/sprites/         生成済み PNG
docs/                   設計ドキュメント・公式構内図
```
