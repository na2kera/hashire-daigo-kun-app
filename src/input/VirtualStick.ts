// フローティング・バーチャルスティック（DESIGN.md §4 / §12.3）。
// PlayScene が所有する。画面のどこを触ってもそこが中心になる。
// 採用した指の pointer.id を保持し、その指だけで更新・解除する。2本目以降は無視し、
// 先の指を離しても押下中の2本目へは移譲しない（次の新しい押下から採用）。
// 描画は scrollFactor 0 の Graphics なので、カメラがスクロールしても画面に固定される。
// 半径・デッドゾーンは内部座標（ゲーム座標）単位。

import Phaser from "phaser";
import { STICK_DEAD_ZONE, STICK_MAX_RADIUS } from "../config";

export interface StickVector {
  x: number;
  y: number;
}

export class VirtualStick {
  private readonly scene: Phaser.Scene;
  private readonly gfx: Phaser.GameObjects.Graphics;
  /** 追跡中の指の id。null なら未操作 */
  private pointerId: number | null = null;
  private baseX = 0;
  private baseY = 0;
  private knobX = 0;
  private knobY = 0;
  private readonly out: StickVector = { x: 0, y: 0 };
  private destroyed = false;

  constructor(scene: Phaser.Scene, depth: number) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setScrollFactor(0).setDepth(depth).setVisible(false);

    const input = scene.input;
    input.on(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    input.on(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    input.on(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    input.on(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    // 指が離れたことを取りこぼしうる状況では、強制的に解除する
    scene.game.events.on(Phaser.Core.Events.BLUR, this.release, this);
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.release, this);
    document.addEventListener("visibilitychange", this.onVisibility);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  /**
   * 入力方向。デッドゾーン内なら (0,0)、それ以外は長さ1の単位ベクトル
   * （倒し具合は無視して常に最高速。DESIGN.md §4）
   */
  get vector(): StickVector {
    return this.out;
  }

  /** 操作を解除してベクトルをゼロにする */
  release(): void {
    this.pointerId = null;
    this.out.x = 0;
    this.out.y = 0;
    if (!this.destroyed) this.gfx.clear().setVisible(false);
  }

  private readonly onVisibility = (): void => {
    if (document.visibilityState === "hidden") this.release();
  };

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId !== null) return; // 2本目以降は無視
    this.pointerId = pointer.id;
    this.baseX = pointer.x;
    this.baseY = pointer.y;
    this.knobX = pointer.x;
    this.knobY = pointer.y;
    this.out.x = 0;
    this.out.y = 0;
    this.draw();
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (this.pointerId === null || pointer.id !== this.pointerId) return;
    const dx = pointer.x - this.baseX;
    const dy = pointer.y - this.baseY;
    const dist = Math.hypot(dx, dy);
    if (dist < STICK_DEAD_ZONE) {
      this.out.x = 0;
      this.out.y = 0;
    } else {
      this.out.x = dx / dist;
      this.out.y = dy / dist;
    }
    const r = Math.min(dist, STICK_MAX_RADIUS);
    this.knobX = dist > 0 ? this.baseX + (dx / dist) * r : this.baseX;
    this.knobY = dist > 0 ? this.baseY + (dy / dist) * r : this.baseY;
    this.draw();
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.pointerId) return;
    this.release();
  }

  private draw(): void {
    const g = this.gfx;
    g.clear().setVisible(true);
    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(this.baseX, this.baseY, STICK_MAX_RADIUS);
    g.lineStyle(2, 0xffffff, 0.5);
    g.strokeCircle(this.baseX, this.baseY, STICK_MAX_RADIUS);
    g.fillStyle(0xffffff, 0.55);
    g.fillCircle(this.knobX, this.knobY, 12);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.release();
    this.destroyed = true;
    const input = this.scene.input;
    input.off(Phaser.Input.Events.POINTER_DOWN, this.onDown, this);
    input.off(Phaser.Input.Events.POINTER_MOVE, this.onMove, this);
    input.off(Phaser.Input.Events.POINTER_UP, this.onUp, this);
    input.off(Phaser.Input.Events.POINTER_UP_OUTSIDE, this.onUp, this);
    this.scene.game.events.off(Phaser.Core.Events.BLUR, this.release, this);
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.release, this);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
