// タイトル画面（DESIGN.md §2）。
// 音の解禁（AudioContext の resume）は sfx.installAudioUnlock() が全画面共通で行う。

import Phaser from "phaser";
import { SCENES } from "../config";
import { TEX } from "../assets/keys";
import { loadHighScore } from "../score/storage";
import { textStyle } from "./ui";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super(SCENES.title);
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    this.cameras.main.setBackgroundColor("#2a6e3f");

    // 上部は上辺基準、下部の要素は下辺基準で置く（高さは 400〜520 で可変）
    this.add.text(cx, 70, "走れ", textStyle(28, "#ffe08a", { fontStyle: "bold" })).setOrigin(0.5);
    this.add.text(cx, 110, "だいごくん", textStyle(36, "#ffffff", { fontStyle: "bold" })).setOrigin(0.5);
    this.add.text(cx, 145, "〜 成蹊キャンパス60秒ラン 〜", textStyle(11, "#d8f0d8")).setOrigin(0.5);

    this.add.image(cx, (145 + height - 100) / 2 + 10, TEX.professorTitle).setScale(2);

    const best = loadHighScore();
    if (best > 0) {
      this.add.text(cx, height - 100, `ハイスコア ${best}`, textStyle(14, "#ffe08a")).setOrigin(0.5);
    }

    const start = this.add.text(cx, height - 60, "タップしてスタート", textStyle(16)).setOrigin(0.5);
    this.tweens.add({ targets: start, alpha: 0.15, duration: 550, yoyo: true, repeat: -1 });

    const go = (): void => {
      this.scene.start(SCENES.howTo);
    };
    this.input.once(Phaser.Input.Events.POINTER_DOWN, go);
    this.input.keyboard?.once("keydown-SPACE", go);
    this.input.keyboard?.once("keydown-ENTER", go);
  }
}
