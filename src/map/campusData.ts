// 成蹊大学 吉祥寺キャンパスのマップデータ（DESIGN.md §5.3 / §5.4）。
// 座標はすべてタイル単位。x: 西→東 0..59、y: 北→南 0..79。
// このファイルは Phaser に依存しない（データの検証スクリプトからも読めるようにするため）。

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TilePoint {
  x: number;
  y: number;
}

/** 施設（建物）。solid=false のものは通行可（アトリオ） */
export interface Facility {
  /** 公式構内図の番号。番号のない建物（体育館）は null */
  no: number | null;
  id: string;
  name: string;
  /** 足元の矩形（衝突判定） */
  rect: TileRect;
  /** プレースホルダーの壁の色 */
  color: number;
  /** 屋根の色 */
  roofColor: number;
  /** footprint より上にはみ出す見た目の高さ（px） */
  roofExtra: number;
  solid: boolean;
}

export type GroundKind = "grass" | "track" | "asphalt" | "avenue" | "plaza";

export interface GroundArea {
  id: string;
  name: string;
  kind: GroundKind;
  rect: TileRect;
}

/** 通行不可の領域（外周・敷地外・街道・門柱など） */
export interface WallArea {
  id: string;
  name: string;
  /** 見た目。outside=木で塗りつぶした敷地外、road=街道、pillar=門柱 */
  look: "outside" | "road" | "pillar";
  rect: TileRect;
}

export type TreeKind = "keyaki" | "sakura";

/** 木の列。from→to を step タイルおきに1本ずつ置く（縦か横の直線） */
export interface TreeLine {
  id: string;
  kind: TreeKind;
  from: TilePoint;
  to: TilePoint;
  step: number;
}

// ---------------------------------------------------------------------------
// 施設（§5.2 の21施設＋体育館）
// ---------------------------------------------------------------------------

export const FACILITIES: readonly Facility[] = [
  { no: 0, id: "honkan", name: "本館", rect: { x: 46, y: 40, w: 10, h: 6 }, color: 0xa0442c, roofColor: 0xf2ece0, roofExtra: 16, solid: true },
  { no: 1, id: "b1", name: "1号館", rect: { x: 48, y: 30, w: 6, h: 4 }, color: 0xd9c49a, roofColor: 0xb8a57c, roofExtra: 10, solid: true },
  { no: 2, id: "b2", name: "2号館", rect: { x: 46, y: 24, w: 6, h: 4 }, color: 0xc9a27e, roofColor: 0xa88466, roofExtra: 8, solid: true },
  { no: 3, id: "b3", name: "3号館", rect: { x: 33, y: 34, w: 6, h: 4 }, color: 0xb5664a, roofColor: 0x8e4d38, roofExtra: 10, solid: true },
  { no: 4, id: "b4", name: "4号館", rect: { x: 24, y: 40, w: 6, h: 5 }, color: 0xb98a6a, roofColor: 0x6d8f6a, roofExtra: 10, solid: true },
  { no: 5, id: "b5", name: "5号館", rect: { x: 24, y: 50, w: 6, h: 4 }, color: 0xd2b48c, roofColor: 0xae9474, roofExtra: 6, solid: true },
  { no: 6, id: "b6", name: "6号館", rect: { x: 34, y: 42, w: 6, h: 7 }, color: 0xe0d6c4, roofColor: 0xbdb3a0, roofExtra: 14, solid: true },
  { no: 7, id: "b7", name: "7号館", rect: { x: 24, y: 32, w: 6, h: 4 }, color: 0xcfb995, roofColor: 0xaa9878, roofExtra: 8, solid: true },
  { no: 8, id: "b8", name: "8号館", rect: { x: 33, y: 26, w: 6, h: 4 }, color: 0xae5a42, roofColor: 0x8a4634, roofExtra: 12, solid: true },
  { no: 9, id: "b9", name: "9号館", rect: { x: 24, y: 24, w: 6, h: 5 }, color: 0xa65440, roofColor: 0x844232, roofExtra: 10, solid: true },
  { no: 10, id: "b10", name: "10号館", rect: { x: 44, y: 13, w: 5, h: 8 }, color: 0x9a9a9e, roofColor: 0x76767c, roofExtra: 40, solid: true },
  { no: 11, id: "b11", name: "11号館", rect: { x: 32, y: 15, w: 9, h: 7 }, color: 0xf0eee8, roofColor: 0xb8774f, roofExtra: 16, solid: true },
  { no: 12, id: "b12", name: "12号館", rect: { x: 24, y: 16, w: 6, h: 5 }, color: 0xe6e2d8, roofColor: 0x8fb8cf, roofExtra: 14, solid: true },
  { no: 13, id: "w1", name: "西一号館", rect: { x: 20, y: 65, w: 8, h: 5 }, color: 0xa4523e, roofColor: 0xe8e0d0, roofExtra: 12, solid: true },
  { no: 14, id: "library", name: "情報図書館", rect: { x: 32, y: 54, w: 10, h: 6 }, color: 0x9fd4e8, roofColor: 0xffffff, roofExtra: 12, solid: true },
  { no: 15, id: "kaikan", name: "学生会館", rect: { x: 54, y: 26, w: 5, h: 6 }, color: 0xe8dcc8, roofColor: 0x3d7cc9, roofExtra: 8, solid: true },
  { no: 16, id: "truss", name: "トラスコンガーデン", rect: { x: 55, y: 34, w: 4, h: 5 }, color: 0x9c5a3c, roofColor: 0x5a5a5a, roofExtra: 10, solid: true },
  { no: 17, id: "health", name: "大学保健室", rect: { x: 14, y: 21, w: 4, h: 3 }, color: 0xe0d0b8, roofColor: 0xb09c80, roofExtra: 6, solid: true },
  { no: 18, id: "intl", name: "国際交流会館", rect: { x: 10, y: 65, w: 5, h: 4 }, color: 0xe4dccb, roofColor: 0xb6ab96, roofExtra: 8, solid: true },
  { no: 19, id: "atrio", name: "アトリオ", rect: { x: 39, y: 30, w: 8, h: 10 }, color: 0x8fcf6a, roofColor: 0x8fcf6a, roofExtra: 0, solid: false },
  { no: 20, id: "archives", name: "学園史料館", rect: { x: 54, y: 46, w: 5, h: 4 }, color: 0x9a5a40, roofColor: 0x6e3e2c, roofExtra: 12, solid: true },
  { no: null, id: "gym", name: "大学体育館", rect: { x: 25, y: 4, w: 8, h: 6 }, color: 0xd8d0c0, roofColor: 0x6a9ad0, roofExtra: 14, solid: true },
];

// ---------------------------------------------------------------------------
// 地面（通行可の特殊地形）。指定のない場所はベージュの通路
// ---------------------------------------------------------------------------

export const GROUND_AREAS: readonly GroundArea[] = [
  { id: "keyaki_ground", name: "けやきグラウンド", kind: "track", rect: { x: 2, y: 2, w: 20, h: 13 } },
  { id: "atrio_lawn", name: "アトリオ", kind: "grass", rect: { x: 39, y: 30, w: 8, h: 10 } },
  { id: "honkan_front", name: "本館前庭", kind: "grass", rect: { x: 44, y: 47, w: 10, h: 14 } },
  { id: "sando", name: "参道（欅）", kind: "plaza", rect: { x: 50, y: 48, w: 2, h: 18 } },
  { id: "keyaki_avenue", name: "欅並木", kind: "avenue", rect: { x: 20, y: 18, w: 3, h: 46 } },
  { id: "campus_road", name: "構内道路", kind: "asphalt", rect: { x: 0, y: 62, w: 60, h: 2 } },
  { id: "gate", name: "大学正門", kind: "plaza", rect: { x: 50, y: 66, w: 2, h: 1 } },
  // 建物の間に散らす芝
  { id: "lawn_n1", name: "芝", kind: "grass", rect: { x: 41, y: 23, w: 3, h: 6 } },
  { id: "lawn_w1", name: "芝", kind: "grass", rect: { x: 24, y: 46, w: 8, h: 3 } },
  { id: "lawn_s1", name: "芝", kind: "grass", rect: { x: 29, y: 66, w: 8, h: 6 } },
  { id: "lawn_ne", name: "芝", kind: "grass", rect: { x: 50, y: 2, w: 8, h: 8 } },
  { id: "lawn_e1", name: "芝", kind: "grass", rect: { x: 52, y: 14, w: 6, h: 9 } },
];

// ---------------------------------------------------------------------------
// 通行不可の領域
// ---------------------------------------------------------------------------

export const WALLS: readonly WallArea[] = [
  // 外周（x=0, x=59, y=0, y=79）
  { id: "edge_n", name: "外周", look: "outside", rect: { x: 0, y: 0, w: 60, h: 1 } },
  { id: "edge_s", name: "外周", look: "outside", rect: { x: 0, y: 79, w: 60, h: 1 } },
  { id: "edge_w", name: "外周", look: "outside", rect: { x: 0, y: 0, w: 1, h: 80 } },
  { id: "edge_e", name: "外周", look: "outside", rect: { x: 59, y: 0, w: 1, h: 80 } },
  // 中学・高校の領域（§5.1「入れない」）。木で塗りつぶす
  { id: "school_area", name: "敷地外（中高）", look: "outside", rect: { x: 1, y: 19, w: 12, h: 43 } },
  // 五日市街道とその南。y≥74 は全て敷地外（到達不能な通路を残さない）
  { id: "itsukaichi", name: "五日市街道（敷地外）", look: "road", rect: { x: 0, y: 74, w: 60, h: 6 } },
  // 大学正門の門柱
  { id: "gate_pillar_w", name: "正門の門柱", look: "pillar", rect: { x: 49, y: 66, w: 1, h: 1 } },
  { id: "gate_pillar_e", name: "正門の門柱", look: "pillar", rect: { x: 52, y: 66, w: 1, h: 1 } },
];

/** 植え込み（障害物）。1タイルずつ並べる */
export const HEDGES: readonly TileRect[] = [
  { x: 44, y: 60, w: 5, h: 1 },
  { x: 53, y: 60, w: 5, h: 1 },
  { x: 24, y: 57, w: 6, h: 1 },
  { x: 41, y: 12, w: 1, h: 4 },
];

/**
 * 木の列。木1本ずつが障害物（1タイル）。
 * 1タイルおき（step=2）に置くので、木と木の間をすり抜けて横断できる。
 */
export const TREE_LINES: readonly TreeLine[] = [
  // 欅並木：x=20 と x=22 の列に木、x=21 が道（y 18..63）。構内道路（y62-63）は塞がないよう y60 まで
  { id: "keyaki_w", kind: "keyaki", from: { x: 20, y: 18 }, to: { x: 20, y: 60 }, step: 2 },
  { id: "keyaki_e", kind: "keyaki", from: { x: 22, y: 18 }, to: { x: 22, y: 60 }, step: 2 },
  // 桜並木（トラック南西側）
  { id: "sakura", kind: "sakura", from: { x: 2, y: 16 }, to: { x: 20, y: 16 }, step: 2 },
  // 参道の両脇の欅（正門→本館）
  { id: "sando_w", kind: "keyaki", from: { x: 49, y: 48 }, to: { x: 49, y: 58 }, step: 2 },
  { id: "sando_e", kind: "keyaki", from: { x: 52, y: 48 }, to: { x: 52, y: 58 }, step: 2 },
];

// ---------------------------------------------------------------------------
// スタート地点・スポーン候補（§5.4）。すべて通行可能タイルの座標（中心に置く）
// ---------------------------------------------------------------------------

/** スタート地点：正門のすぐ北 */
export const START_TILE: TilePoint = { x: 51, y: 64 };

/** レポート用紙（1点）の候補：通路上 */
export const PAPER_SPAWNS: readonly TilePoint[] = [
  // 北側
  { x: 23, y: 2 }, { x: 30, y: 11 }, { x: 36, y: 3 }, { x: 40, y: 8 },
  { x: 48, y: 4 }, { x: 54, y: 10 }, { x: 57, y: 6 }, { x: 23, y: 12 },
  // けやきグラウンド
  { x: 5, y: 5 }, { x: 11, y: 8 }, { x: 17, y: 5 }, { x: 12, y: 12 },
  // 桜並木・保健室まわり
  { x: 6, y: 18 }, { x: 14, y: 18 },
  { x: 13, y: 26 }, { x: 16, y: 30 }, { x: 18, y: 36 }, { x: 13, y: 44 }, { x: 17, y: 50 }, { x: 14, y: 58 },
  // 欅並木の中
  { x: 21, y: 22 }, { x: 21, y: 33 }, { x: 21, y: 45 }, { x: 21, y: 55 },
  // 並木と建物の間
  { x: 23, y: 30 }, { x: 23, y: 38 }, { x: 23, y: 48 },
  // x=31 の通り
  { x: 31, y: 18 }, { x: 31, y: 26 }, { x: 31, y: 33 }, { x: 31, y: 40 }, { x: 31, y: 50 },
  // 10号館・11号館まわり
  { x: 42, y: 17 }, { x: 42, y: 21 }, { x: 50, y: 15 }, { x: 55, y: 20 }, { x: 52, y: 22 },
  // 8号館・2号館・1号館まわり
  { x: 40, y: 27 }, { x: 44, y: 25 }, { x: 53, y: 25 }, { x: 47, y: 29 }, { x: 45, y: 35 },
  // 3号館・6号館まわり
  { x: 40, y: 44 }, { x: 32, y: 46 }, { x: 42, y: 50 }, { x: 30, y: 58 },
  // 本館まわり
  { x: 44, y: 42 }, { x: 57, y: 42 }, { x: 46, y: 52 }, { x: 55, y: 56 }, { x: 47, y: 58 }, { x: 56, y: 52 },
  // 構内道路
  { x: 5, y: 62 }, { x: 15, y: 63 }, { x: 30, y: 62 }, { x: 45, y: 63 }, { x: 57, y: 62 },
  // 道路の南（飛び地）
  { x: 3, y: 66 }, { x: 8, y: 71 }, { x: 17, y: 67 }, { x: 30, y: 64 }, { x: 35, y: 72 },
  { x: 42, y: 66 }, { x: 47, y: 70 }, { x: 56, y: 68 }, { x: 53, y: 72 },
  // 情報図書館の南
  { x: 34, y: 61 },
];

/** 研究費の封筒（10点）の候補：遠い場所 */
export const FUND_SPAWNS: readonly TilePoint[] = [
  { x: 3, y: 3 }, // けやきグラウンドの奥
  { x: 28, y: 2 }, // 体育館の裏
  { x: 46, y: 11 }, // 10号館の北
  { x: 57, y: 44 }, // 史料館の裏
  { x: 25, y: 72 }, // 西一号館の裏
  { x: 12, y: 72 }, // 国際交流会館の裏
  { x: 57, y: 2 }, // 北東の隅
  { x: 13, y: 60 }, // 西の端
];

/**
 * 教科書（3点）の候補：建物20棟＋体育館の入口付近（footprint の南辺のすぐ外、中央）。
 * アトリオ（19）は建物ではないので置かない（DESIGN.md §12.6）。
 * 南辺が通路に面していない建物ができたら、ここで個別に上書きする。
 */
export const TEXTBOOK_SPAWNS: readonly TilePoint[] = FACILITIES.filter((f) => f.solid).map((f) => ({
  x: f.rect.x + Math.floor(f.rect.w / 2),
  y: f.rect.y + f.rect.h,
}));

// ---------------------------------------------------------------------------
// データから導出するヘルパー（Phaser 非依存）
// ---------------------------------------------------------------------------

/** 木の列を1本ずつの座標に展開する */
export function expandTreeLine(line: TreeLine): TilePoint[] {
  const points: TilePoint[] = [];
  const dx = Math.sign(line.to.x - line.from.x);
  const dy = Math.sign(line.to.y - line.from.y);
  const len = Math.max(Math.abs(line.to.x - line.from.x), Math.abs(line.to.y - line.from.y));
  for (let i = 0; i <= len; i += line.step) {
    points.push({ x: line.from.x + dx * i, y: line.from.y + dy * i });
  }
  return points;
}

/** 全ての木の位置 */
export function allTrees(): { kind: TreeKind; at: TilePoint }[] {
  return TREE_LINES.flatMap((line) => expandTreeLine(line).map((at) => ({ kind: line.kind, at })));
}

/** 衝突矩形（タイル単位）の一覧。建物 footprint・壁・植え込み・木 */
export function collisionRects(): TileRect[] {
  const rects: TileRect[] = [];
  for (const f of FACILITIES) if (f.solid) rects.push(f.rect);
  for (const w of WALLS) rects.push(w.rect);
  for (const h of HEDGES) rects.push(h);
  for (const t of allTrees()) rects.push({ x: t.at.x, y: t.at.y, w: 1, h: 1 });
  return rects;
}

/** タイルごとの通行不可フラグ（cols×rows、1=通行不可） */
export function blockedGrid(cols: number, rows: number): Uint8Array {
  const grid = new Uint8Array(cols * rows);
  for (const r of collisionRects()) {
    for (let y = Math.max(0, r.y); y < Math.min(rows, r.y + r.h); y++) {
      for (let x = Math.max(0, r.x); x < Math.min(cols, r.x + r.w); x++) {
        grid[y * cols + x] = 1;
      }
    }
  }
  return grid;
}

/** start から上下左右に BFS して到達できるタイル（1=到達可） */
function reachableGrid(grid: Uint8Array, cols: number, rows: number, start: TilePoint): Uint8Array {
  const seen = new Uint8Array(cols * rows);
  const inMap = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < cols && y < rows;
  if (!inMap(start.x, start.y) || grid[start.y * cols + start.x]) return seen;
  const queue: number[] = [start.y * cols + start.x];
  seen[start.y * cols + start.x] = 1;
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head] as number;
    const x = i % cols;
    const y = (i - x) / cols;
    const next: [number, number][] = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
    for (const [nx, ny] of next) {
      if (!inMap(nx, ny)) continue;
      const j = ny * cols + nx;
      if (grid[j] || seen[j]) continue;
      seen[j] = 1;
      queue.push(j);
    }
  }
  return seen;
}

/**
 * マップとスポーン候補のデバッグチェック（DESIGN.md §5.4 / §12.6）。問題の説明文の配列を返す。
 * ①候補が衝突矩形と重ならない・マップ内 ②候補が全種類で一意
 * ③開始地点からの BFS で全候補に到達可能 ④到達不能な通行可タイルが 0
 */
export function validateCampus(cols: number, rows: number): string[] {
  const problems: string[] = [];
  const grid = blockedGrid(cols, rows);
  const reach = reachableGrid(grid, cols, rows, START_TILE);
  const groups: [string, readonly TilePoint[]][] = [
    ["start", [START_TILE]],
    ["paper", PAPER_SPAWNS],
    ["textbook", TEXTBOOK_SPAWNS],
    ["fund", FUND_SPAWNS],
  ];
  const used = new Map<string, string>();
  for (const [group, points] of groups) {
    for (const p of points) {
      const where = `${group} (${p.x}, ${p.y})`;
      if (p.x < 0 || p.y < 0 || p.x >= cols || p.y >= rows) {
        problems.push(`マップ外の候補: ${where}`);
        continue;
      }
      const i = p.y * cols + p.x;
      if (grid[i]) problems.push(`通行不可の場所にある候補: ${where}`);
      else if (!reach[i]) problems.push(`開始地点から到達できない候補: ${where}`);
      const key = `${p.x},${p.y}`;
      const prev = used.get(key);
      if (prev !== undefined) problems.push(`候補タイルの重複: ${where} と ${prev}`);
      else used.set(key, group);
    }
  }
  let unreachable = 0;
  for (let i = 0; i < grid.length; i++) {
    if (!grid[i] && !reach[i]) unreachable++;
  }
  if (unreachable > 0) problems.push(`開始地点から到達できない通行可タイルが ${unreachable} 個あります`);
  return problems;
}
