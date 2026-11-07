// テクスチャ・アニメーションのキー定数。
// Phase 2 で public/assets/ の PNG に差し替えるときは、BootScene の生成処理を
// load.image / load.spritesheet に置き換えるだけで済むよう、キーはここに集約する。

import type { ItemKind } from "../config";

export const TEX = {
  /** 教授の歩行スプライトシート（16×24 × 12フレーム） */
  professor: "professor",
  /** タイトル用の腕組みポーズ */
  professorTitle: "professor_idle_title",
  /** 欅（緑の木） */
  treeKeyaki: "tree_keyaki",
  /** 桜（ピンクの木） */
  treeSakura: "tree_sakura",
  /** 植え込み（1タイル） */
  hedge: "hedge",
  /** マップの地面（CampusMap が1枚の画像として生成） */
  ground: "campus_ground",
} as const;

/** アイテムのテクスチャキー */
export const ITEM_TEX: Record<ItemKind, string> = {
  paper: "item_paper",
  textbook: "item_textbook",
  fund: "item_fund",
};

/** 建物のテクスチャキー（施設 id ごと） */
export function buildingTexKey(id: string): string {
  return `building_${id}`;
}

/** 向き。スプライトシートの並び順もこの順（各3フレーム） */
export type Direction = "down" | "left" | "right" | "up";
export const DIRECTIONS: readonly Direction[] = ["down", "left", "right", "up"];

/** 1方向あたりの歩行フレーム数 */
export const WALK_FRAMES = 3;

/** 歩行アニメのキー */
export function walkAnimKey(dir: Direction): string {
  return `professor_walk_${dir}`;
}

/** 立ち止まり時に使うフレーム番号（各方向の先頭フレーム） */
export function idleFrame(dir: Direction): number {
  return DIRECTIONS.indexOf(dir) * WALK_FRAMES;
}
