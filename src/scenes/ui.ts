// シーン共通の UI ヘルパー。

import Phaser from "phaser";
import { FONT_FAMILY, MIN_FONT_SIZE } from "../config";

export function textStyle(
  size: number,
  color = "#ffffff",
  extra: Phaser.Types.GameObjects.Text.TextStyle = {},
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${Math.max(size, MIN_FONT_SIZE)}px`,
    color,
    stroke: "#1b1b2f",
    strokeThickness: Math.max(2, Math.round(size / 6)),
    align: "center",
    ...extra,
  };
}

/** タップできるボタン（Text に背景をつけたもの） */
export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onTap: () => void,
): Phaser.GameObjects.Text {
  const btn = scene.add
    .text(x, y, label, {
      fontFamily: FONT_FAMILY,
      fontSize: "16px",
      fontStyle: "bold",
      color: "#ffffff",
      backgroundColor: "#8b1a2b",
      padding: { x: 12, y: 6 },
      align: "center",
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => btn.setAlpha(0.7));
  btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => btn.setAlpha(1));
  btn.on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
    btn.setAlpha(1);
    onTap();
  });
  return btn;
}

/** 登録表のキー（PlayScene → HudScene の受け渡し） */
export const REG = {
  score: "hud.score",
  timeLeft: "hud.timeLeft",
} as const;
