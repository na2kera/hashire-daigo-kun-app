// 教授（だいごくん）。8方向移動、斜めは正規化、当たり判定は足元（DESIGN.md §1 / §3）。

import Phaser from "phaser";
import {
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_FRAME_HEIGHT,
  PLAYER_FRAME_WIDTH,
  PLAYER_SPEED,
} from "../config";
import { TEX, idleFrame, walkAnimKey, type Direction } from "../assets/keys";
import type { StickVector } from "../input/VirtualStick";

export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Direction = "up";

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TEX.professor, idleFrame("up"));
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // 原点は足元中央
    this.setOrigin(0.5, 1);
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT);
    body.setOffset(
      (PLAYER_FRAME_WIDTH - PLAYER_BODY_WIDTH) / 2,
      PLAYER_FRAME_HEIGHT - PLAYER_BODY_HEIGHT,
    );
    body.setCollideWorldBounds(true);
  }

  /** 入力ベクトル（合成済み、未正規化）から速度とアニメを決める */
  move(input: StickVector): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let { x, y } = input;
    const len = Math.hypot(x, y);
    if (len < 0.001) {
      body.setVelocity(0, 0);
      this.anims.stop();
      this.setFrame(idleFrame(this.facing));
      this.depth = this.y;
      return;
    }
    // 斜めでも速度が増えないよう正規化
    x /= len;
    y /= len;
    body.setVelocity(x * PLAYER_SPEED, y * PLAYER_SPEED);

    // 4方向アニメ。斜めは横成分優先（DESIGN.md §1）
    const dir: Direction =
      Math.abs(x) >= Math.abs(y) - 0.001 ? (x < 0 ? "left" : "right") : y < 0 ? "up" : "down";
    this.facing = dir;
    this.anims.play(walkAnimKey(dir), true);
    this.depth = this.y;
  }

  /** 速度ゼロにして立ち止まりフレームにする */
  halt(): void {
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    this.anims.stop();
    this.setFrame(idleFrame(this.facing));
  }
}
