// リザルト（DESIGN.md §2）。スコア・内訳・NEW RECORD・「もう一度」「タイトルへ」。

import Phaser from "phaser";
import { ITEM_DEFS, ITEM_KINDS, SCENES, type GameResult } from "../config";
import { ITEM_TEX } from "../assets/keys";
import { loadHighScore, recordScore } from "../score/storage";
import { submitScore } from "../score/submit";
import { addButton, textStyle } from "./ui";

export class ResultScene extends Phaser.Scene {
  private result!: GameResult;
  private leaving = false;

  constructor() {
    super(SCENES.result);
  }

  init(data: GameResult): void {
    this.result = data;
    this.leaving = false;
  }

  create(): void {
    const { width, height } = this.scale;
    const cx = width / 2;
    const { score, counts } = this.result;
    this.cameras.main.setBackgroundColor("#1b1b2f");

    const isNewRecord = recordScore(score);
    void submitScore(this.result).catch(() => undefined);

    this.add.text(cx, 34, "リザルト", textStyle(20, "#ffe08a", { fontStyle: "bold" })).setOrigin(0.5);
    this.add.text(cx, 84, `${score}`, textStyle(44, "#ffffff", { fontStyle: "bold" })).setOrigin(0.5);
    this.add.text(cx, 116, "点", textStyle(14)).setOrigin(0.5);

    if (isNewRecord) {
      const rec = this.add.text(cx, 140, "NEW RECORD!", textStyle(18, "#ff6060", { fontStyle: "bold" })).setOrigin(0.5);
      this.tweens.add({ targets: rec, scale: 1.15, duration: 400, yoyo: true, repeat: -1 });
    } else {
      this.add.text(cx, 140, `ハイスコア ${loadHighScore()}`, textStyle(12, "#b8b8d0")).setOrigin(0.5);
    }

    ITEM_KINDS.forEach((kind, i) => {
      const def = ITEM_DEFS[kind];
      const y = 182 + i * 28;
      this.add.image(40, y, ITEM_TEX[kind]).setScale(2);
      this.add.text(54, y, def.name, textStyle(12, "#ffffff", { align: "left" })).setOrigin(0, 0.5);
      this.add
        .text(width - 30, y, `${counts[kind]}個 ×${def.points}`, textStyle(12, "#ffe08a"))
        .setOrigin(1, 0.5);
    });

    addButton(this, cx, height - 105, "もう一度", () => this.go(SCENES.play));
    addButton(this, cx, height - 55, "タイトルへ", () => this.go(SCENES.title));

    this.input.keyboard?.once("keydown-ENTER", () => this.go(SCENES.play));
  }

  /** 画面遷移は一度だけ（ボタンとキーが同時に押されても二重に start しない） */
  private go(scene: string): void {
    if (this.leaving) return;
    this.leaving = true;
    this.scene.start(scene);
  }
}
