// HUD（DESIGN.md §2 / §12.3）。残り時間は上部中央に大きく、スコアは上部右。
// PlayScene から launch され、Play 終了時に stop される。値は registry 経由で受け取る。
// 表示専用：interactive なオブジェクトは置かない（スティックは PlayScene が所有）。

import Phaser from "phaser";
import { GAME_SECONDS, SCENES, WARNING_SECONDS } from "../config";
import { REG, textStyle } from "./ui";

export class HudScene extends Phaser.Scene {
  private timeText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private rotateNotice!: Phaser.GameObjects.Text;
  private shownTime = -1;
  private shownScore = -1;
  private warning = false;

  constructor() {
    super(SCENES.hud);
  }

  create(): void {
    this.shownTime = -1;
    this.shownScore = -1;
    this.warning = false;
    const { width, height } = this.scale;

    // HUD は上辺基準で置く
    this.timeText = this.add
      .text(width / 2, 8, "", textStyle(26, "#ffffff", { fontStyle: "bold" }))
      .setOrigin(0.5, 0);
    this.add.text(width - 8, 6, "SCORE", textStyle(10, "#ffe08a")).setOrigin(1, 0);
    this.scoreText = this.add
      .text(width - 8, 18, "", textStyle(16, "#ffffff", { fontStyle: "bold" }))
      .setOrigin(1, 0);

    // 横向きになったときの案内（ゲームは止めない）
    this.rotateNotice = this.add
      .text(width / 2, height / 2, "縦にしてね", textStyle(20, "#ffffff", { backgroundColor: "#000000aa", padding: { x: 10, y: 8 } }))
      .setOrigin(0.5)
      .setVisible(false);
    this.updateRotateNotice();

    this.setTime(Number(this.registry.get(REG.timeLeft) ?? GAME_SECONDS));
    this.setScore(Number(this.registry.get(REG.score) ?? 0));

    this.registry.events.on(Phaser.Data.Events.CHANGE_DATA, this.onChange, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateRotateNotice, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.registry.events.off(Phaser.Data.Events.CHANGE_DATA, this.onChange, this);
      this.scale.off(Phaser.Scale.Events.RESIZE, this.updateRotateNotice, this);
    });
  }

  private updateRotateNotice(): void {
    this.rotateNotice.setVisible(window.innerWidth > window.innerHeight && "ontouchstart" in window);
  }

  private onChange(_parent: unknown, key: string, value: unknown): void {
    if (key === REG.timeLeft) this.setTime(Number(value));
    else if (key === REG.score) this.setScore(Number(value));
  }

  private setScore(score: number): void {
    if (score === this.shownScore) return;
    this.shownScore = score;
    this.scoreText.setText(String(score));
  }

  private setTime(seconds: number): void {
    if (seconds === this.shownTime) return;
    this.shownTime = seconds;
    this.timeText.setText(String(seconds));
    if (seconds <= WARNING_SECONDS && seconds > 0) {
      if (!this.warning) {
        this.warning = true;
        this.timeText.setColor("#ff4040");
      }
      // 赤く拡大し、1秒ごとに脈打たせる
      this.tweens.killTweensOf(this.timeText);
      this.timeText.setScale(1.7);
      this.tweens.add({ targets: this.timeText, scale: 1.4, duration: 250, ease: "Quad.easeOut" });
    }
  }
}
