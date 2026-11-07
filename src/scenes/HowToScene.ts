// 遊び方（DESIGN.md §2）。1画面で説明し、タップで開始。

import Phaser from "phaser";
import { GAME_SECONDS, ITEM_DEFS, ITEM_KINDS, SCENES } from "../config";
import { ITEM_TEX } from "../assets/keys";
import { textStyle } from "./ui";

/** 前の画面のタップが連続で入らないよう、少し待ってから入力を受け付ける */
const INPUT_DELAY_MS = 300;

export class HowToScene extends Phaser.Scene {
  constructor() {
    super(SCENES.howTo);
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.cameras.main.setBackgroundColor("#1b1b2f");

    this.add.text(cx, 40, "あそびかた", textStyle(22, "#ffe08a", { fontStyle: "bold" })).setOrigin(0.5);
    this.add.text(cx, 90, "指でなぞって走る", textStyle(15)).setOrigin(0.5);
    this.add.text(cx, 110, "（PCは矢印キー / WASD）", textStyle(10, "#b8b8d0")).setOrigin(0.5);
    this.add.text(cx, 145, `${GAME_SECONDS}秒でアイテムを集めろ！`, textStyle(15)).setOrigin(0.5);

    ITEM_KINDS.forEach((kind, i) => {
      const def = ITEM_DEFS[kind];
      const y = 200 + i * 36;
      this.add.image(52, y, ITEM_TEX[kind]).setScale(3);
      this.add.text(72, y, def.name, textStyle(13, "#ffffff", { align: "left" })).setOrigin(0, 0.5);
      this.add.text(width - 34, y, `${def.points}点`, textStyle(15, "#ffe08a", { fontStyle: "bold" })).setOrigin(1, 0.5);
    });

    const start = this.add.text(cx, height - 55, "タップしてはじめる", textStyle(16)).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 550, yoyo: true, repeat: -1 });

    this.time.delayedCall(INPUT_DELAY_MS, () => {
      const go = (): void => {
        this.scene.start(SCENES.play);
      };
      this.input.once(Phaser.Input.Events.POINTER_DOWN, go);
      this.input.keyboard?.once("keydown-SPACE", go);
      this.input.keyboard?.once("keydown-ENTER", go);
    });
  }
}
