// ゲーム全体の定数。数値の調整はここだけで完結させる。

/**
 * 内部解像度（縦持ち）。幅は 240 固定、高さは起動時に親要素の縦横比から
 * 400〜520 の範囲で決める（DESIGN.md §12.1）。Scale.FIT で画面に合わせて拡大する。
 * シーンは高さを直書きせず this.scale.width / this.scale.height を使うこと。
 */
export const GAME_WIDTH = 240;
export const GAME_HEIGHT_MIN = 400;
export const GAME_HEIGHT_MAX = 520;

/** 親要素（padding を除いた内容領域）のサイズから内部解像度の高さを決める */
export function computeGameHeight(parentWidth: number, parentHeight: number): number {
  if (!(parentWidth > 0) || !(parentHeight > 0)) return GAME_HEIGHT_MIN;
  const h = Math.round((GAME_WIDTH * parentHeight) / parentWidth);
  return Math.min(GAME_HEIGHT_MAX, Math.max(GAME_HEIGHT_MIN, h));
}

/** タイル1枚のピクセル数 */
export const TILE = 16;

/** マップのタイル数（60×80 = 960×1280px） */
export const MAP_COLS = 60;
export const MAP_ROWS = 80;
export const MAP_WIDTH = MAP_COLS * TILE;
export const MAP_HEIGHT = MAP_ROWS * TILE;

/** 1プレイの秒数 */
export const GAME_SECONDS = 60;

/** 残り何秒からタイマーを強調するか */
export const WARNING_SECONDS = 10;

/** 教授の移動速度（px/s）。6タイル/s */
export const PLAYER_SPEED = 96;

/** 教授のスプライトと当たり判定（足元） */
export const PLAYER_FRAME_WIDTH = 16;
export const PLAYER_FRAME_HEIGHT = 24;
export const PLAYER_BODY_WIDTH = 12;
export const PLAYER_BODY_HEIGHT = 10;

/** バーチャルスティック */
export const STICK_DEAD_ZONE = 8;
export const STICK_MAX_RADIUS = 40;

/** アイテムの種類 */
export type ItemKind = "paper" | "textbook" | "fund";

export interface ItemDef {
  kind: ItemKind;
  /** 表示名 */
  name: string;
  /** 1個あたりの点数 */
  points: number;
  /** 1プレイで配置する個数 */
  count: number;
  /** プレースホルダーの色 */
  color: number;
}

/** アイテム定義（DESIGN.md §1）。名前・点数・個数はここで変更できる */
export const ITEM_DEFS: Record<ItemKind, ItemDef> = {
  paper: { kind: "paper", name: "レポート用紙", points: 1, count: 30, color: 0xffffff },
  textbook: { kind: "textbook", name: "教科書", points: 3, count: 10, color: 0x8b5a2b },
  fund: { kind: "fund", name: "研究費の封筒", points: 10, count: 3, color: 0xffcc33 },
};

/** 表示順 */
export const ITEM_KINDS: readonly ItemKind[] = ["paper", "textbook", "fund"];

/** 画面で使うフォント */
export const FONT_FAMILY = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif';

/** 文字の最小サイズ（内部座標の px）。DESIGN.md §12.9 */
export const MIN_FONT_SIZE = 10;

/** シーンキー */
export const SCENES = {
  boot: "Boot",
  title: "Title",
  howTo: "HowTo",
  play: "Play",
  hud: "Hud",
  result: "Result",
} as const;

/** 1プレイの結果。ResultScene と submitScore() に渡す */
export interface GameResult {
  score: number;
  counts: Record<ItemKind, number>;
  /** 終了時刻（ISO 8601） */
  playedAt: string;
}
