// ランキング送信の差し込み口。DESIGN.md §7。
import type { GameResult } from "../config";

/**
 * スコアをサーバーへ送る。
 * 今は何もしない。後で Workers + D1 に POST する（例：POST /api/scores）。
 * 呼び出し側は失敗してもゲームが止まらないよう await しなくてよい。
 */
export async function submitScore(_result: GameResult): Promise<void> {
  // no-op
}
