// アイテム（レポート用紙・教科書・研究費の封筒）。DESIGN.md §1。

import Phaser from "phaser";
import { ITEM_DEFS, type ItemDef, type ItemKind } from "../config";
import { ITEM_TEX } from "../assets/keys";

export class Item extends Phaser.Physics.Arcade.Image {
  readonly def: ItemDef;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: ItemKind) {
    super(scene, x, y, ITEM_TEX[kind]);
    this.def = ITEM_DEFS[kind];
    scene.add.existing(this);
    // 静的ボディ（動かない）。overlap 判定だけに使う
    scene.physics.add.existing(this, true);
    this.depth = y;

    // ふわふわ上下させて目立たせる
    scene.tweens.add({
      targets: this,
      y: y - 2,
      duration: 500 + Math.random() * 200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  get kind(): ItemKind {
    return this.def.kind;
  }

  get points(): number {
    return this.def.points;
  }
}
