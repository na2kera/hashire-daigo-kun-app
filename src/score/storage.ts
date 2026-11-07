// 端末ハイスコアの保存（localStorage）。DESIGN.md §7 / §12.8。
// プライベートモード等で localStorage が使えなくても例外を外に出さない。
// 保存に失敗してもセッション中はメモリ上の最高記録で NEW RECORD を判定する。

const HIGHSCORE_KEY = "hdk:highscore:v1";

/** セッション中の最高記録（localStorage が使えなくても保持される） */
let sessionBest = 0;

/** 有限の非負整数なら value、そうでなければ 0 */
function sanitize(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : 0;
}

function readStored(): number {
  try {
    const raw = window.localStorage.getItem(HIGHSCORE_KEY);
    if (raw === null || raw.trim() === "") return 0;
    return sanitize(Number(raw));
  } catch {
    return 0;
  }
}

/** 端末ハイスコア（保存値とセッション中の記録の大きい方）。なければ 0 */
export function loadHighScore(): number {
  sessionBest = Math.max(sessionBest, readStored());
  return sessionBest;
}

/** スコアを記録する。ハイスコアを更新したら true（保存に失敗しても判定は返す） */
export function recordScore(score: number): boolean {
  const value = sanitize(score);
  const best = loadHighScore();
  if (value <= best) return false;
  sessionBest = value;
  try {
    window.localStorage.setItem(HIGHSCORE_KEY, String(value));
  } catch {
    // 保存できなくても続行
  }
  return true;
}
