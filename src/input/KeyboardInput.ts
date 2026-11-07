// PC 用のキーボード入力（矢印キー / WASD）。DESIGN.md §4。

import Phaser from "phaser";
import type { StickVector } from "./VirtualStick";

type DirKeys = {
  up: Phaser.Input.Keyboard.Key;
  down: Phaser.Input.Keyboard.Key;
  left: Phaser.Input.Keyboard.Key;
  right: Phaser.Input.Keyboard.Key;
};

export class KeyboardInput {
  private readonly arrows: DirKeys | null;
  private readonly wasd: DirKeys | null;
  private readonly out: StickVector = { x: 0, y: 0 };

  constructor(scene: Phaser.Scene) {
    const kb = scene.input.keyboard;
    if (!kb) {
      this.arrows = null;
      this.wasd = null;
      return;
    }
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.arrows = kb.addKeys({ up: KC.UP, down: KC.DOWN, left: KC.LEFT, right: KC.RIGHT }) as DirKeys;
    this.wasd = kb.addKeys({ up: KC.W, down: KC.S, left: KC.A, right: KC.D }) as DirKeys;
  }

  /** 入力方向（各成分 -1/0/1。正規化は Player 側で行う） */
  get vector(): StickVector {
    const a = this.arrows;
    const w = this.wasd;
    const down = (k: keyof DirKeys): boolean => Boolean(a?.[k].isDown || w?.[k].isDown);
    this.out.x = (down("right") ? 1 : 0) - (down("left") ? 1 : 0);
    this.out.y = (down("down") ? 1 : 0) - (down("up") ? 1 : 0);
    return this.out;
  }
}

/**
 * スティックとキーボードの入力を合成する。両方の和をとり、Player 側で正規化する。
 */
export function combineInputs(...vectors: StickVector[]): StickVector {
  let x = 0;
  let y = 0;
  for (const v of vectors) {
    x += v.x;
    y += v.y;
  }
  return { x, y };
}
