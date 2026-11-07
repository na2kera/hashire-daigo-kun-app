// テクスチャとアニメの準備（DESIGN.md §2 / §8）。
// Phase 1 はプレースホルダーを Graphics → generateTexture で生成する。
// Phase 2 で PNG に差し替えるときは preload() で load.spritesheet / load.image を使い、
// generate* の呼び出しを消すだけで済むよう、キーは assets/keys.ts に集約している。

import Phaser from "phaser";
import { ITEM_DEFS, ITEM_KINDS, PLAYER_FRAME_HEIGHT, PLAYER_FRAME_WIDTH, SCENES, TILE } from "../config";
import { DIRECTIONS, ITEM_TEX, TEX, WALK_FRAMES, buildingTexKey, walkAnimKey, type Direction } from "../assets/keys";
import { FACILITIES, type Facility } from "../map/campusData";

const C = {
  skin: 0xf2c9a0,
  hair: 0x1a1a1a,
  suit: 0x1f2a5a,
  suitDark: 0x161d40,
  shirt: 0xffffff,
  tie: 0x8b1a2b,
  shoe: 0x111111,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    this.generateProfessor();
    this.generateProfessorTitle();
    this.generateItems();
    this.generateTrees();
    this.generateBuildings();
    this.createAnimations();
    this.scene.start(SCENES.title);
  }

  private gfx(): Phaser.GameObjects.Graphics {
    return this.make.graphics({}, false);
  }

  // -------------------------------------------------------------------------
  // 教授：16×24 × (4方向 × 3フレーム)。並びは down, left, right, up
  // -------------------------------------------------------------------------

  private generateProfessor(): void {
    const g = this.gfx();
    const fw = PLAYER_FRAME_WIDTH;
    const fh = PLAYER_FRAME_HEIGHT;
    DIRECTIONS.forEach((dir, d) => {
      for (let step = 0; step < WALK_FRAMES; step++) {
        drawProfessorFrame(g, (d * WALK_FRAMES + step) * fw, 0, dir, step);
      }
    });
    const total = DIRECTIONS.length * WALK_FRAMES;
    g.generateTexture(TEX.professor, fw * total, fh);
    g.destroy();

    // 1枚のテクスチャをフレームに分割する（PNG の spritesheet と同じフレーム番号になる）
    const tex = this.textures.get(TEX.professor);
    for (let i = 0; i < total; i++) {
      tex.add(i, 0, i * fw, 0, fw, fh);
    }
  }

  /** タイトル用の腕組みポーズ（32×48。16×24 を2倍で描く） */
  private generateProfessorTitle(): void {
    const g = this.gfx();
    const s = 2;
    const r = (x: number, y: number, w: number, h: number, color: number): void => {
      g.fillStyle(color, 1);
      g.fillRect(x * s, y * s, w * s, h * s);
    };
    // 頭
    r(5, 2, 6, 6, C.skin);
    r(5, 1, 6, 2, C.hair);
    r(4, 2, 1, 3, C.hair);
    r(11, 2, 1, 3, C.hair);
    r(6, 5, 1, 1, C.hair); // 目
    r(9, 5, 1, 1, C.hair);
    r(7, 7, 2, 1, 0xc0806a); // 口（への字）
    // 体
    r(4, 8, 8, 9, C.suit);
    r(7, 8, 2, 2, C.shirt);
    r(7, 9, 2, 3, C.tie);
    // 腕組み（胸の前で水平に）
    r(3, 11, 10, 3, C.suitDark);
    r(4, 12, 2, 1, C.skin);
    r(10, 12, 2, 1, C.skin);
    // 脚
    r(5, 17, 2, 6, C.suitDark);
    r(9, 17, 2, 6, C.suitDark);
    r(4, 23, 3, 1, C.shoe);
    r(9, 23, 3, 1, C.shoe);
    g.generateTexture(TEX.professorTitle, 16 * s, 24 * s);
    g.destroy();
  }

  // -------------------------------------------------------------------------
  // アイテム：8×8 の色違い
  // -------------------------------------------------------------------------

  private generateItems(): void {
    for (const kind of ITEM_KINDS) {
      const g = this.gfx();
      const color = ITEM_DEFS[kind].color;
      g.fillStyle(0x000000, 0.6);
      g.fillRect(0, 0, 8, 8);
      g.fillStyle(color, 1);
      g.fillRect(1, 1, 6, 6);
      if (kind === "paper") {
        g.fillStyle(0x8899aa, 1);
        g.fillRect(2, 3, 4, 1);
        g.fillRect(2, 5, 4, 1);
      } else if (kind === "textbook") {
        g.fillStyle(0x5a3a1a, 1);
        g.fillRect(1, 1, 1, 6); // 背表紙
        g.fillStyle(0xf0e0c0, 1);
        g.fillRect(3, 3, 3, 1);
      } else {
        g.fillStyle(0xb08a10, 1);
        g.fillRect(2, 2, 4, 1); // 封筒のフタ
        g.fillRect(3, 3, 2, 1);
        g.fillStyle(0xffffff, 1);
        g.fillRect(3, 5, 2, 1);
      }
      g.generateTexture(ITEM_TEX[kind], 8, 8);
      g.destroy();
    }
  }

  // -------------------------------------------------------------------------
  // 木・植え込み
  // -------------------------------------------------------------------------

  private generateTrees(): void {
    const tree = (key: string, crown: number, crownDark: number): void => {
      const g = this.gfx();
      g.fillStyle(0x6b4a2b, 1);
      g.fillRect(7, 13, 2, 7);
      g.fillStyle(crownDark, 1);
      g.fillCircle(8, 8, 7);
      g.fillStyle(crown, 1);
      g.fillCircle(7, 7, 5);
      g.generateTexture(key, TILE, 20);
      g.destroy();
    };
    tree(TEX.treeKeyaki, 0x4f9a3c, 0x2f6e2a);
    tree(TEX.treeSakura, 0xf6b6c8, 0xe08aa6);

    const g = this.gfx();
    g.fillStyle(0x2f6e2a, 1);
    g.fillRoundedRect(0, 2, TILE, TILE - 2, 4);
    g.fillStyle(0x4f9a3c, 1);
    g.fillRoundedRect(2, 3, TILE - 4, TILE - 7, 3);
    g.generateTexture(TEX.hedge, TILE, TILE);
    g.destroy();
  }

  // -------------------------------------------------------------------------
  // 建物：色付き矩形。番号は CampusMap が Text で重ねる
  // -------------------------------------------------------------------------

  private generateBuildings(): void {
    for (const f of FACILITIES) {
      if (!f.solid) continue;
      const g = this.gfx();
      const w = f.rect.w * TILE;
      const h = f.rect.h * TILE + f.roofExtra;
      drawBuilding(g, f, w, h);
      g.generateTexture(buildingTexKey(f.id), w, h);
      g.destroy();
    }
  }

  private createAnimations(): void {
    for (const dir of DIRECTIONS) {
      const key = walkAnimKey(dir);
      if (this.anims.exists(key)) continue;
      const first = DIRECTIONS.indexOf(dir) * WALK_FRAMES;
      this.anims.create({
        key,
        // 1→0→2→0 の順で足を交互に出す
        frames: [1, 0, 2, 0].map((i) => ({ key: TEX.professor, frame: first + i })),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}

/** 教授の1フレーム（16×24）を (ox, oy) に描く。step: 0=直立, 1=左足前, 2=右足前 */
function drawProfessorFrame(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  dir: Direction,
  step: number,
): void {
  const r = (x: number, y: number, w: number, h: number, color: number): void => {
    g.fillStyle(color, 1);
    g.fillRect(ox + x, oy + y, w, h);
  };
  const side = dir === "left" || dir === "right";
  // 横向きは左向きを描いて、右向きは x を反転する
  const fx = (x: number, w: number): number => (dir === "right" ? 16 - x - w : x);
  const rs = (x: number, y: number, w: number, h: number, color: number): void => r(fx(x, w), y, w, h, color);

  // 脚（歩行で上下に1pxずらす）
  const lift = (n: number): number => (step === n ? 1 : 0);
  if (side) {
    rs(6, 17, 2, 5 - lift(1), C.suitDark);
    rs(8, 17, 2, 5 - lift(2), C.suitDark);
    rs(5, 22 - lift(1), 3, 1, C.shoe);
    rs(8, 22 - lift(2), 3, 1, C.shoe);
  } else {
    r(5, 17, 2, 5 - lift(1), C.suitDark);
    r(9, 17, 2, 5 - lift(2), C.suitDark);
    r(5, 22 - lift(1), 2, 1, C.shoe);
    r(9, 22 - lift(2), 2, 1, C.shoe);
  }

  // 胴体
  if (side) {
    rs(5, 8, 6, 9, C.suit);
    rs(5, 8, 1, 2, C.shirt); // 襟（進行方向側）
    rs(5, 10, 1, 3, C.tie);
    // 腕（歩行で前後に振る）
    const swing = step === 1 ? -1 : step === 2 ? 1 : 0;
    rs(7 + swing, 9, 2, 6, C.suitDark);
    rs(7 + swing, 15, 2, 1, C.skin);
  } else {
    r(4, 8, 8, 9, C.suit);
    if (dir === "down") {
      r(7, 8, 2, 2, C.shirt);
      r(7, 9, 2, 4, C.tie);
    }
    const swingL = step === 1 ? 1 : 0;
    const swingR = step === 2 ? 1 : 0;
    r(3, 9 + swingL, 1, 6, C.suitDark);
    r(12, 9 + swingR, 1, 6, C.suitDark);
    r(3, 15 + swingL, 1, 1, C.skin);
    r(12, 15 + swingR, 1, 1, C.skin);
  }

  // 頭
  r(5, 2, 6, 6, C.skin);
  if (dir === "down") {
    r(5, 1, 6, 2, C.hair);
    r(4, 2, 1, 3, C.hair);
    r(11, 2, 1, 3, C.hair);
    r(6, 5, 1, 1, C.hair); // 目
    r(9, 5, 1, 1, C.hair);
  } else if (dir === "up") {
    r(4, 1, 8, 6, C.hair); // 後頭部
  } else {
    rs(5, 1, 7, 2, C.hair);
    rs(9, 2, 3, 4, C.hair); // 後頭部側
    rs(6, 5, 1, 1, C.hair); // 目（進行方向側）
  }
}

/** 建物のプレースホルダー。上側が屋根、下側が正面の壁（窓つき） */
function drawBuilding(g: Phaser.GameObjects.Graphics, f: Facility, w: number, h: number): void {
  const wallH = Math.min(h - 8, 12 + f.roofExtra);
  const roofH = h - wallH;

  // 屋根
  g.fillStyle(f.roofColor, 1);
  g.fillRect(0, 0, w, roofH);
  g.lineStyle(1, 0x000000, 0.35);
  g.strokeRect(0.5, 0.5, w - 1, roofH - 1);

  // 壁
  g.fillStyle(f.color, 1);
  g.fillRect(0, roofH, w, wallH);
  g.lineStyle(1, 0x000000, 0.45);
  g.strokeRect(0.5, roofH + 0.5, w - 1, wallH - 1);

  // 窓（格子）
  const winColor = f.id === "library" ? 0xd8f2ff : 0x355a7a;
  g.fillStyle(winColor, 1);
  for (let y = roofH + 3; y + 3 <= h - 3; y += 5) {
    for (let x = 3; x + 3 <= w - 3; x += 5) {
      g.fillRect(x, y, 3, 3);
    }
  }

  // ランドマークごとの特徴（最小限）
  switch (f.id) {
    case "honkan": {
      // 白い水平帯・中央の3連アーチ・屋上の旗竿
      g.fillStyle(0xf2ece0, 1);
      g.fillRect(0, roofH + 6, w, 2);
      g.fillStyle(0x2a1a14, 1);
      const cx = w / 2;
      for (let i = -1; i <= 1; i++) {
        g.fillRect(cx + i * 7 - 2, h - 9, 5, 9);
        g.fillCircle(cx + i * 7 + 0.5, h - 9, 2.5);
      }
      g.fillStyle(0x555555, 1);
      g.fillRect(cx, 2, 1, 14);
      g.fillStyle(0xd04040, 1);
      g.fillRect(cx + 1, 2, 5, 3);
      break;
    }
    case "b4": {
      // 円形の屋根
      g.fillStyle(0x4f7a50, 1);
      g.fillEllipse(w / 2, roofH / 2, w - 6, roofH - 4);
      break;
    }
    case "kaikan": {
      // 青い半円アーチ窓
      g.fillStyle(0x3d7cc9, 1);
      for (let x = 6; x < w - 4; x += 10) {
        g.fillCircle(x, h - 4, 4);
      }
      break;
    }
    case "truss": {
      // 三角トラス屋根
      g.lineStyle(1, 0xcccccc, 1);
      for (let x = 0; x < w; x += 10) {
        g.lineBetween(x, roofH, x + 5, 2);
        g.lineBetween(x + 5, 2, x + 10, roofH);
      }
      break;
    }
    case "library": {
      // 湾曲ガラスの中の白い球体、両翼はレンガ
      g.fillStyle(0xa0442c, 1);
      g.fillRect(0, roofH, 16, wallH);
      g.fillRect(w - 16, roofH, 16, wallH);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(w / 2, roofH + wallH / 2, Math.min(9, wallH / 2 - 1));
      break;
    }
    case "archives": {
      // 三角屋根
      g.fillStyle(0x5a3020, 1);
      g.fillTriangle(0, roofH, w / 2, 2, w, roofH);
      break;
    }
    case "b11": {
      // 外から見える大階段
      g.fillStyle(0xcfcac0, 1);
      for (let i = 0; i < 5; i++) g.fillRect(4 + i * 3, h - 4 - i * 3, 10, 2);
      break;
    }
    default:
      break;
  }
}
