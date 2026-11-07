// 効果音（WebAudio で合成。音声ファイルは使わない）。DESIGN.md §6。
// どの関数も例外を外に出さない。音が鳴らなくてもゲームは続行できる。

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;

function getCtor(): AudioContextCtor | null {
  const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

/**
 * ユーザー操作（pointerdown / keydown）の中で呼ぶ。AudioContext を生成し resume する。
 * iOS Safari はユーザー操作中でないと音が出ないため。何度呼んでも安全。
 */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = getCtor();
      if (!Ctor) return;
      ctx = new Ctor();
    }
    // iOS の通話割込み後などは "interrupted" になる（型定義に無いので文字列で比較）。
    // running / closed 以外ならすべて resume を試みる
    const state: string = ctx.state;
    if (state !== "running" && state !== "closed") {
      ctx.resume().catch(() => undefined);
    }
  } catch {
    // 音が使えない環境では黙って無音にする
  }
}

let installed = false;

/**
 * 全シーン共通で音の解禁を試みるリスナーを登録する（DESIGN.md §12.2）。起動時に1回呼ぶ。
 * WebKit では touch の pointerdown がユーザーアクティベーションにならないため、
 * pointerdown と pointerup（＋touchend / keydown）の両方で unlockAudio() を呼ぶ。
 * window の capture 段で受けるので、どのシーンが表示されていても必ず呼ばれる。
 * タブが再表示されたときも resume を試みる。
 */
export function installAudioUnlock(): void {
  if (installed) return;
  installed = true;
  for (const type of ["pointerdown", "pointerup", "touchend", "keydown"] as const) {
    window.addEventListener(type, unlockAudio, { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && ctx) unlockAudio();
  });
}

function ready(): AudioContext | null {
  if (!ctx || ctx.state !== "running") return null;
  return ctx;
}

interface ToneStep {
  /** 開始周波数（Hz） */
  from: number;
  /** 終了周波数（Hz） */
  to: number;
  /** 開始までの遅れ（秒） */
  delay: number;
  /** 長さ（秒） */
  duration: number;
  type: OscillatorType;
  volume: number;
}

function playTones(steps: ToneStep[]): void {
  try {
    const ac = ready();
    if (!ac) return;
    const now = ac.currentTime;
    for (const s of steps) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const start = now + s.delay;
      const end = start + s.duration;
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.from, start);
      osc.frequency.exponentialRampToValueAtTime(s.to, end);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(s.volume, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  } catch {
    // 無視
  }
}

/** 取得音：短い上昇音。点数が高いほど高く・長く */
export function playPickup(points: number): void {
  const level = Math.min(points, 10);
  const base = 520 + level * 60;
  const duration = 0.06 + level * 0.012;
  const steps: ToneStep[] = [
    { from: base, to: base * 1.6, delay: 0, duration, type: "square", volume: 0.08 },
  ];
  if (points >= 10) {
    steps.push({ from: base * 1.5, to: base * 2.2, delay: duration, duration: duration * 1.2, type: "square", volume: 0.08 });
  }
  playTones(steps);
}

/** 残り10秒の警告音（1回） */
export function playWarning(): void {
  playTones([
    { from: 880, to: 880, delay: 0, duration: 0.12, type: "triangle", volume: 0.15 },
    { from: 880, to: 880, delay: 0.18, duration: 0.12, type: "triangle", volume: 0.15 },
  ]);
}

/** 終了音：下降音 */
export function playFinish(): void {
  playTones([
    { from: 784, to: 392, delay: 0, duration: 0.25, type: "square", volume: 0.1 },
    { from: 523, to: 196, delay: 0.25, duration: 0.45, type: "square", volume: 0.1 },
  ]);
}
