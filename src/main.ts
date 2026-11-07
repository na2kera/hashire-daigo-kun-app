// エントリポイント。Phaser.Game を生成する（DESIGN.md §3 / §12.1）。

import Phaser from "phaser";
import { GAME_WIDTH, computeGameHeight } from "./config";
import { installAudioUnlock } from "./audio/sfx";
import { BootScene } from "./scenes/BootScene";
import { TitleScene } from "./scenes/TitleScene";
import { HowToScene } from "./scenes/HowToScene";
import { PlayScene } from "./scenes/PlayScene";
import { HudScene } from "./scenes/HudScene";
import { ResultScene } from "./scenes/ResultScene";

// どの画面でも、ユーザー操作のたびに AudioContext の resume を試みる（iOS Safari 対策）
installAudioUnlock();

/** #game の内容領域（safe-area の padding を除く）のサイズ */
function parentContentSize(parent: HTMLElement): { width: number; height: number } {
  const style = window.getComputedStyle(parent);
  const px = (v: string): number => Number.parseFloat(v) || 0;
  return {
    width: parent.clientWidth - px(style.paddingLeft) - px(style.paddingRight),
    height: parent.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
  };
}

const parent = document.getElementById("game");
const size = parent ? parentContentSize(parent) : { width: window.innerWidth, height: window.innerHeight };
// 横向きで起動した場合は縦横比が意味をなさないので最小の高さにする
const gameHeight = size.height >= size.width ? computeGameHeight(size.width, size.height) : computeGameHeight(1, 0);

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: gameHeight,
  backgroundColor: "#1b1b2f",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  // 効果音は src/audio/sfx.ts の WebAudio で鳴らすので Phaser のサウンドは使わない
  audio: { noAudio: true },
  // シーンの並び順 = 描画順。HudScene は PlayScene の上に描かれる
  scene: [BootScene, TitleScene, HowToScene, PlayScene, HudScene, ResultScene],
});

if (import.meta.env.DEV) {
  // 開発時の動作確認用
  (window as unknown as { __game?: Phaser.Game }).__game = game;
}
