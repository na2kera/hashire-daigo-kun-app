// メインゲーム（DESIGN.md §1 / §2 / §12.3〜§12.5）。
// カメラは教授を追従。HUD は HudScene を launch して別カメラで描く。
// スティックはこのシーンが所有する（HudScene は表示専用）。

import Phaser from "phaser";
import {
  GAME_SECONDS,
  ITEM_DEFS,
  ITEM_KINDS,
  MAP_HEIGHT,
  MAP_WIDTH,
  SCENES,
  TILE,
  WARNING_SECONDS,
  type GameResult,
  type ItemKind,
} from "../config";
import { CampusMap, tileCenter } from "../map/CampusMap";
import { FUND_SPAWNS, PAPER_SPAWNS, START_TILE, TEXTBOOK_SPAWNS, type TilePoint } from "../map/campusData";
import { Player } from "../entities/Player";
import { Item } from "../entities/Item";
import { VirtualStick } from "../input/VirtualStick";
import { KeyboardInput, combineInputs } from "../input/KeyboardInput";
import { playFinish, playPickup, playWarning } from "../audio/sfx";
import { REG, textStyle } from "./ui";

const SPAWNS: Record<ItemKind, readonly TilePoint[]> = {
  paper: PAPER_SPAWNS,
  textbook: TEXTBOOK_SPAWNS,
  fund: FUND_SPAWNS,
};

/** 「タイムアップ！」を見せてからリザルトへ移るまでの間 */
const FINISH_DELAY_MS = 900;

export class PlayScene extends Phaser.Scene {
  // シーンは使い回されるので、状態は init() / create() で毎回代入する（§12.5）
  private player!: Player;
  private stick!: VirtualStick;
  private keyboard!: KeyboardInput;
  private elapsedMs!: number;
  private score!: number;
  private counts!: Record<ItemKind, number>;
  private warned!: boolean;
  private ended!: boolean;

  constructor() {
    super(SCENES.play);
  }

  init(): void {
    this.elapsedMs = 0;
    this.score = 0;
    this.counts = { paper: 0, textbook: 0, fund: 0 };
    this.warned = false;
    this.ended = false;
  }

  create(): void {
    this.physics.resume();
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    if (new URLSearchParams(window.location.search).has("debug")) {
      this.physics.world.createDebugGraphic();
    }

    const map = new CampusMap(this);

    const start = tileCenter(START_TILE);
    // 原点が足元なので、足元の当たり判定がタイルの中に収まるよう少し上に置く
    this.player = new Player(this, start.x, (START_TILE.y + 1) * TILE - 3);
    this.physics.add.collider(this.player, map.colliders);

    const items = this.physics.add.staticGroup();
    for (const kind of ITEM_KINDS) {
      const count = ITEM_DEFS[kind].count;
      const candidates = SPAWNS[kind];
      if (candidates.length < count) {
        console.warn(`[play] ${kind} の候補が ${candidates.length} 箇所しかありません（必要 ${count}）`);
      }
      for (const p of pickRandom(candidates, count)) {
        const c = tileCenter(p);
        items.add(new Item(this, c.x, c.y, kind));
      }
    }
    this.physics.add.overlap(this.player, items, (_player, item) => {
      if (item instanceof Item) this.collect(item);
    });

    const cam = this.cameras.main;
    cam.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    cam.startFollow(this.player, true); // 第2引数 roundPixels（§12.1）
    cam.setBackgroundColor("#1b1b2f");

    // 解除（指を離す・blur・hidden・resize）と同時に止める。halt() は ended 後に呼ばれても無害
    this.stick = new VirtualStick(this, 1_000_000, () => this.player.halt());
    this.keyboard = new KeyboardInput(this);

    // 時計は物理演算（取得判定）より先に進める：締切を取得より優先する（§12.4）
    this.events.on(Phaser.Scenes.Events.PRE_UPDATE, this.tick, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onShutdown, this);

    this.registry.set(REG.score, 0);
    this.registry.set(REG.timeLeft, GAME_SECONDS);
    this.scene.launch(SCENES.hud);
  }

  /** PRE_UPDATE（物理の UPDATE より前）で残り時間を評価する */
  private tick(_time: number, delta: number): void {
    if (this.ended) return;
    // 物理と同じ delta をそのまま積算する（極端な delta は Phaser の TimeStep が平滑化する。§13）
    this.elapsedMs += delta;
    const remainingMs = Math.max(0, GAME_SECONDS * 1000 - this.elapsedMs);
    const timeLeft = Math.ceil(remainingMs / 1000);
    if (this.registry.get(REG.timeLeft) !== timeLeft) {
      this.registry.set(REG.timeLeft, timeLeft);
    }
    if (!this.warned && timeLeft <= WARNING_SECONDS) {
      this.warned = true;
      playWarning();
    }
    if (remainingMs <= 0) this.finish();
  }

  update(): void {
    if (this.ended) return;
    this.player.move(combineInputs(this.stick.vector, this.keyboard.vector));
  }

  private collect(item: Item): void {
    if (this.ended || !item.active) return;
    const points = item.points;
    this.score += points;
    this.counts[item.kind] += 1;
    this.registry.set(REG.score, this.score);
    playPickup(points);
    this.popup(item.x, item.y - 6, `+${points}`, points >= 10 ? "#ffe08a" : "#ffffff");
    this.tweens.killTweensOf(item);
    item.destroy();
  }

  /** 「+N」が上に浮いて消える */
  private popup(x: number, y: number, text: string, color: string): void {
    const t = this.add
      .text(x, y, text, textStyle(11, color, { fontStyle: "bold" }))
      .setOrigin(0.5, 1)
      .setDepth(999_999);
    this.tweens.add({
      targets: t,
      y: y - 18,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  /** 終了処理は一度だけ（§12.4） */
  private finish(): void {
    if (this.ended) return;
    // ① 終了フラグ
    this.ended = true;
    // ② 入力解除・速度ゼロ・物理停止
    this.stick.release();
    this.player.halt();
    this.physics.pause();
    this.registry.set(REG.timeLeft, 0);
    playFinish();

    // ④ 結果のスナップショット（③ 以後の取得は ended を見て無視される）
    const result: GameResult = {
      score: this.score,
      counts: { ...this.counts },
      playedAt: new Date().toISOString(),
    };

    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "タイムアップ！", textStyle(24, "#ffe08a", { fontStyle: "bold" }))
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(2_000_000);

    this.time.delayedCall(FINISH_DELAY_MS, () => {
      // ⑤ HUD を止めて ⑥ リザルトへ
      this.scene.stop(SCENES.hud);
      this.scene.start(SCENES.result, result);
    });
  }

  private onShutdown(): void {
    this.events.off(Phaser.Scenes.Events.PRE_UPDATE, this.tick, this);
    this.tweens.killAll();
    this.time.removeAllEvents();
    // スティックは自身の SHUTDOWN リスナーで破棄される
    if (this.scene.isActive(SCENES.hud) || this.scene.isPaused(SCENES.hud)) {
      this.scene.stop(SCENES.hud);
    }
  }
}

/** 候補から重複なしで n 個選ぶ */
function pickRandom<T>(list: readonly T[], n: number): T[] {
  const copy = [...list];
  Phaser.Utils.Array.Shuffle(copy);
  return copy.slice(0, Math.min(n, copy.length));
}
