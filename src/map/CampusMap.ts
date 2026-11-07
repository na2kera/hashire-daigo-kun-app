// campusData から地面・建物・木・衝突体を生成する（DESIGN.md §5）。

import Phaser from "phaser";
import { FONT_FAMILY, MAP_COLS, MAP_HEIGHT, MAP_ROWS, MAP_WIDTH, TILE } from "../config";
import { TEX, buildingTexKey } from "../assets/keys";
import {
  FACILITIES,
  GROUND_AREAS,
  HEDGES,
  WALLS,
  allTrees,
  collisionRects,
  validateCampus,
  type GroundKind,
  type TilePoint,
  type TileRect,
} from "./campusData";

const GROUND_COLORS: Record<GroundKind | "path", number> = {
  path: 0xeadfc4,
  grass: 0x9fd36b,
  track: 0xd9773a,
  asphalt: 0xb4b4b4,
  avenue: 0xdccb9e,
  plaza: 0xd8c59a,
};

/** タイル座標 → そのタイルの中心（px） */
export function tileCenter(p: TilePoint): { x: number; y: number } {
  return { x: p.x * TILE + TILE / 2, y: p.y * TILE + TILE / 2 };
}

export class CampusMap {
  /** 建物・壁・木・植え込みの衝突体 */
  readonly colliders: Phaser.Physics.Arcade.StaticGroup;

  constructor(private readonly scene: Phaser.Scene) {
    this.colliders = scene.physics.add.staticGroup();
    this.createGround();
    this.createFacilities();
    this.createTreesAndHedges();
    this.createColliders();
    CampusMap.checkSpawns();
  }

  /** 地面は1枚のテクスチャにまとめて描く（初回のみ生成） */
  private createGround(): void {
    const scene = this.scene;
    if (!scene.textures.exists(TEX.ground)) {
      const g = scene.make.graphics({}, false);
      const fill = (r: TileRect, color: number): void => {
        g.fillStyle(color, 1);
        g.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
      };

      fill({ x: 0, y: 0, w: MAP_COLS, h: MAP_ROWS }, GROUND_COLORS.path);

      for (const area of GROUND_AREAS) {
        if (area.kind === "track") {
          // 400m トラック（オレンジ）＋内側の人工芝
          const r = area.rect;
          g.fillStyle(0x7fbf5a, 1);
          g.fillRect(r.x * TILE, r.y * TILE, r.w * TILE, r.h * TILE);
          g.fillStyle(GROUND_COLORS.track, 1);
          g.fillRoundedRect(r.x * TILE + 4, r.y * TILE + 4, r.w * TILE - 8, r.h * TILE - 8, 80);
          g.fillStyle(0x6fbf4a, 1);
          g.fillRoundedRect(r.x * TILE + 28, r.y * TILE + 28, r.w * TILE - 56, r.h * TILE - 56, 56);
        } else {
          fill(area.rect, GROUND_COLORS[area.kind]);
        }
        if (area.kind === "asphalt") {
          // 道路の中央線
          g.fillStyle(0xffffff, 0.8);
          const r = area.rect;
          for (let x = r.x * TILE; x < (r.x + r.w) * TILE; x += 16) {
            g.fillRect(x, (r.y + r.h / 2) * TILE - 1, 8, 2);
          }
        }
      }

      // 移動している感覚が出るよう、タイルの角に薄い点を打つ
      g.fillStyle(0x000000, 0.06);
      for (let y = 0; y < MAP_ROWS; y++) {
        for (let x = 0; x < MAP_COLS; x++) {
          g.fillRect(x * TILE, y * TILE, 1, 1);
        }
      }

      for (const wall of WALLS) {
        const r = wall.rect;
        if (wall.look === "road") {
          fill(r, 0x606066);
          g.fillStyle(0xf0f0f0, 0.9);
          for (let x = r.x * TILE; x < (r.x + r.w) * TILE; x += 24) {
            g.fillRect(x, (r.y + r.h / 2) * TILE - 1, 12, 2);
          }
        } else if (wall.look === "pillar") {
          fill(r, 0x4a4a4a);
        } else {
          // 敷地外：濃い緑の木立
          fill(r, 0x2f5a2c);
          g.fillStyle(0x3f7a3a, 1);
          for (let y = r.y; y < r.y + r.h; y++) {
            for (let x = r.x; x < r.x + r.w; x++) {
              g.fillCircle(x * TILE + 8, y * TILE + 8, 6);
            }
          }
        }
      }

      g.generateTexture(TEX.ground, MAP_WIDTH, MAP_HEIGHT);
      g.destroy();
    }
    scene.add.image(0, 0, TEX.ground).setOrigin(0, 0).setDepth(-100000);

    // 地面の文字
    const ground = GROUND_AREAS.find((a) => a.id === "keyaki_ground");
    if (ground) {
      const c = rectCenter(ground.rect);
      scene.add
        .text(c.x, c.y, "SEIKEI", { fontFamily: FONT_FAMILY, fontSize: "16px", fontStyle: "bold", color: "#ffffff" })
        .setOrigin(0.5)
        .setAlpha(0.8)
        .setDepth(-99999);
    }
    const gate = GROUND_AREAS.find((a) => a.id === "gate");
    if (gate) {
      const c = rectCenter(gate.rect);
      this.label(c.x, c.y + 14, "正門", -99998);
    }
  }

  private createFacilities(): void {
    const scene = this.scene;
    for (const f of FACILITIES) {
      const r = f.rect;
      const bottom = (r.y + r.h) * TILE;
      const cx = (r.x + r.w / 2) * TILE;
      if (f.solid) {
        // 足元（footprint）の下辺に原点を置き、屋根は上にはみ出す
        scene.add.image(cx, bottom, buildingTexKey(f.id)).setOrigin(0.5, 1).setDepth(bottom);
        const num = f.no === null ? "体" : String(f.no);
        this.label(cx, (r.y + r.h / 2) * TILE - f.roofExtra / 2, num, bottom + 0.5, true);
      } else {
        // アトリオ：芝生の中庭。番号だけ置く
        this.label(cx, (r.y + r.h / 2) * TILE, String(f.no), -99998, true);
      }
    }
  }

  private createTreesAndHedges(): void {
    const scene = this.scene;
    for (const t of allTrees()) {
      const x = t.at.x * TILE + TILE / 2;
      const bottom = (t.at.y + 1) * TILE;
      scene.add
        .image(x, bottom, t.kind === "sakura" ? TEX.treeSakura : TEX.treeKeyaki)
        .setOrigin(0.5, 1)
        .setDepth(bottom);
    }
    for (const h of HEDGES) {
      for (let y = h.y; y < h.y + h.h; y++) {
        for (let x = h.x; x < h.x + h.w; x++) {
          scene.add
            .image(x * TILE, (y + 1) * TILE, TEX.hedge)
            .setOrigin(0, 1)
            .setDepth((y + 1) * TILE);
        }
      }
    }
  }

  private createColliders(): void {
    for (const r of collisionRects()) {
      const zone = this.scene.add.zone(
        (r.x + r.w / 2) * TILE,
        (r.y + r.h / 2) * TILE,
        r.w * TILE,
        r.h * TILE,
      );
      this.scene.physics.add.existing(zone, true);
      this.colliders.add(zone);
    }
  }

  private label(x: number, y: number, text: string, depth: number, badge = false): void {
    this.scene.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: "10px",
        fontStyle: "bold",
        color: "#ffffff",
        backgroundColor: badge ? "#1d2f6f" : undefined,
        padding: badge ? { x: 2, y: 1 } : undefined,
        stroke: badge ? undefined : "#000000",
        strokeThickness: badge ? 0 : 2,
      })
      .setOrigin(0.5)
      .setDepth(depth);
  }

  private static spawnsChecked = false;

  /**
   * マップとスポーン候補のデバッグチェック（DESIGN.md §5.4 / §12.6）。起動後1回だけ。
   * 問題があっても console.warn するだけでゲームは止めない。
   */
  static checkSpawns(): void {
    if (CampusMap.spawnsChecked) return;
    CampusMap.spawnsChecked = true;
    for (const problem of validateCampus(MAP_COLS, MAP_ROWS)) {
      console.warn(`[campus] ${problem}`);
    }
  }
}

function rectCenter(r: TileRect): { x: number; y: number } {
  return { x: (r.x + r.w / 2) * TILE, y: (r.y + r.h / 2) * TILE };
}
