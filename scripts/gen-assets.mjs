// Node 20 の組み込み機能だけで再現可能なドット絵を生成する。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync, inflateSync } from 'node:zlib';
import { strict as assert } from 'node:assert';
import { runInNewContext } from 'node:vm';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('src/map/campusData.ts', root), 'utf8');
// 型定義や導出関数を実行せず、既存の施設リテラルだけを読む。
const literal = source.match(/export const FACILITIES: readonly Facility\[\] = (\[[\s\S]*?\n\]);/);
assert(literal, '施設一覧が見つかりません');
const facilities = runInNewContext(literal[1], Object.create(null), { timeout: 1000 });
const config = readFileSync(new URL('src/config.ts', root), 'utf8');
for (const [key, value] of Object.entries({ TILE: 16, PLAYER_FRAME_WIDTH: 16, PLAYER_FRAME_HEIGHT: 24 })) {
  assert.match(config, new RegExp(`export const ${key} = ${value};`), `${key} の規約が変わっています`);
}
const out = new URL('public/sprites/', root);
mkdirSync(out, { recursive: true });

// 最小 PNG ライター：RGBA 8bit、filter=0、非インターレース。
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const result = Buffer.alloc(data.length + 12);
  result.writeUInt32BE(data.length, 0);
  name.copy(result, 4);
  data.copy(result, 8);
  result.writeUInt32BE(crc32(Buffer.concat([name, data])), data.length + 8);
  return result;
}
function png(canvas) {
  const { w, h, pixels } = canvas;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(w, 0); header.writeUInt32BE(h, 4);
  header[8] = 8; header[9] = 6;
  const rows = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) pixels.copy(rows, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
}
class Canvas {
  constructor(w, h) { this.w = w; this.h = h; this.pixels = Buffer.alloc(w * h * 4); }
  dot(x, y, color) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.pixels[i] = color >>> 16; this.pixels[i + 1] = color >>> 8 & 255;
    this.pixels[i + 2] = color & 255; this.pixels[i + 3] = 255;
  }
  rect(x, y, w, h, c) { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.dot(xx, yy, c); }
  line(x, y, xx, yy, c) {
    const n = Math.max(Math.abs(xx - x), Math.abs(yy - y));
    for (let i = 0; i <= n; i++) this.dot(x + (xx - x) * i / (n || 1), y + (yy - y) * i / (n || 1), c);
  }
  ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.ceil(cy - ry); y <= cy + ry; y++) for (let x = Math.ceil(cx - rx); x <= cx + rx; x++) {
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) this.dot(x, y, c);
    }
  }
  art(rows, palette, ox = 0, oy = 0, scale = 1) {
    rows.forEach((row, y) => [...row].forEach((p, x) => { if (p !== '.') this.rect(ox + x * scale, oy + y * scale, scale, scale, palette[p]); }));
  }
}
const dimensions = new Map([
  ['professor', [192, 24]], ['professor_idle_title', [32, 48]],
  ...['paper', 'textbook', 'fund'].map(k => [`item_${k}`, [8, 8]]),
  ['tree_keyaki', [16, 20]], ['tree_sakura', [16, 20]], ['hedge', [16, 16]],
  ...facilities.filter(f => f.solid).map(f => [`building_${f.id}`, [f.rect.w * 16, f.rect.h * 16 + f.roofExtra]]),
]);
const written = new Set();
function save(key, canvas) {
  assert.deepEqual([canvas.w, canvas.h], dimensions.get(key), `${key} の寸法不一致`);
  const bytes = png(canvas);
  assert.equal(bytes.readUInt32BE(16), dimensions.get(key)[0]);
  assert.equal(bytes.readUInt32BE(20), dimensions.get(key)[1]);
  // 圧縮後も画素がそのまま復元できることを確認する。
  const dataLength = bytes.readUInt32BE(33);
  const decoded = inflateSync(bytes.subarray(41, 41 + dataLength));
  for (let y = 0; y < canvas.h; y++) {
    assert.equal(decoded[y * (canvas.w * 4 + 1)], 0);
    assert.deepEqual(decoded.subarray(y * (canvas.w * 4 + 1) + 1, (y + 1) * (canvas.w * 4 + 1)), canvas.pixels.subarray(y * canvas.w * 4, (y + 1) * canvas.w * 4));
  }
  writeFileSync(new URL(`${key}.png`, out), bytes);
  written.add(key);
  console.log(`${key}.png ${canvas.w}×${canvas.h}`);
}

const ink = 0x28333c, cream = 0xf4eedb, glass = 0x54869d;
const person = { H: 0x171d27, h: 0x35404b, S: 0xf0c49a, s: 0xcb9477, E: 0x202731, W: 0xf7f4e7, T: 0x862c40, J: 0x283e65, j: 0x172943, L: 0x486086, B: 0x141d2a };
const headFront = ['..HHHHHH..', '.HhhhhHHH.', '.HSSSSSSH.', '.HSSSSSSH.', '..SESSES..', '..SSssSS..', '...SssS...'];
function professor(c, ox, direction, step, scale = 1, crossed = false) {
  const side = direction === 'left' || direction === 'right';
  const r = (x, y, w, h, color) => c.rect(ox + (direction === 'right' ? 16 - x - w : x) * scale, y * scale, w * scale, h * scale, color);
  const lift = n => step === n ? 1 : 0;
  r(5, 16, 6, 6, person.j);
  r(7, 18, 2, 5, person.B);
  r(5, 22 - lift(1), 2, 1 + lift(1), person.B);
  r(9, 22 - lift(2), 3, 1, person.B);
  if (step) r(step === 1 ? 5 : 9, 21, 2, 2, person.L);
  r(side ? 5 : 4, 8, side ? 6 : 8, 9, person.J);
  if (direction === 'down') { r(6, 8, 4, 2, person.W); r(7, 9, 2, 5, person.T); r(5, 10, 1, 5, person.L); r(10, 10, 1, 5, person.j); }
  if (side) { r(5, 8, 1, 3, person.W); r(5, 10, 1, 3, person.T); }
  const swing = step === 1 ? -1 : step === 2 ? 1 : 0;
  if (side) { r(7 + swing, 10, 2, 6, person.j); r(7 + swing, 16, 2, 1, person.S); }
  else { r(3, 9 + lift(1), 2, 6, person.j); r(11, 9 + lift(2), 2, 6, person.j); r(3, 15 + lift(1), 2, 1, person.S); r(11, 15 + lift(2), 2, 1, person.S); }
  if (crossed) {
    r(3, 11, 2, 4, person.L); r(11, 11, 2, 4, person.j);
    r(4, 13, 8, 2, person.j); r(5, 12, 5, 1, person.L);
    r(9, 12, 2, 1, person.S); r(4, 14, 2, 1, person.S);
  }
  if (direction === 'down') c.art(headFront, person, ox + 3 * scale, scale, scale);
  else if (direction === 'up') {
    r(4, 1, 8, 6, person.H); r(5, 2, 5, 2, person.h); r(5, 7, 6, 1, person.H);
  } else {
    r(5, 2, 7, 5, person.S); r(4, 5, 2, 1, person.S); r(5, 1, 7, 2, person.H);
    r(9, 2, 3, 5, person.H); r(6, 2, 4, 1, person.h); r(5, 4, 1, 1, person.E); r(6, 7, 4, 1, person.s);
  }
}
const sheet = new Canvas(192, 24);
['down', 'left', 'right', 'up'].forEach((dir, d) => { for (let step = 0; step < 3; step++) professor(sheet, (d * 3 + step) * 16, dir, step); });
save('professor', sheet);
const title = new Canvas(32, 48); professor(title, 0, 'down', 0, 2, true); save('professor_idle_title', title);
const items = {
  paper: ['.OOOOOO.', '.OWWWWWO', '.OWWWGWO', '.OWGGGWO', '.OWWWWWO', '.OWGGGWO', '.OWWWWWO', '.OOOOOOO'],
  textbook: ['.OOOOOO.', 'OBTTTTTO', 'OBTCCCTO', 'OBTTTTTO', 'OBTTTTTO', 'OBCCCCCO', 'OCCCCCCO', '.OOOOOO.'],
  fund: ['........', 'OOOOOOOO', 'OYYYYYYO', 'ODYYYYDO', 'OYDYYDYO', 'OYYDDYYO', 'OYYYYYYO', 'OOOOOOOO'],
};
for (const [kind, rows] of Object.entries(items)) {
  assert(rows.every(row => row.length === 8));
  const c = new Canvas(8, 8); c.art(rows, { O: ink, W: 0xfff9e9, G: 0x72899a, B: 0x583929, T: 0x9a6039, C: 0xe6cda2, Y: 0xf4cd60, D: 0xb48135 }); save(`item_${kind}`, c);
}
for (const sakura of [false, true]) {
  const c = new Canvas(16, 20);
  c.ellipse(8, 18, 5, 1, 0x3c5738); c.rect(7, 10, 3, 9, 0x57402e); c.rect(8, 12, 1, 6, 0x9a7045);
  c.line(7, 14, 4, 10, 0x57402e); c.line(9, 13, 12, 9, 0x57402e);
  const shades = sakura ? [0xa35e81, 0xd77da0, 0xefadc4, 0xffd2d8] : [0x254f3b, 0x39734a, 0x58964f, 0x85b95e];
  c.ellipse(8, 9, 7, 7, shades[0]);
  c.ellipse(5, 7, 4, 4, shades[1]); c.ellipse(10, 6, 5, 5, shades[1]); c.ellipse(8, 4, 4, 3, shades[2]);
  c.ellipse(4, 9, 3, 3, shades[2]); c.ellipse(11, 9, 3, 3, shades[2]);
  for (const [x, y] of [[5,3],[8,2],[3,7],[10,5],[7,10],[12,8]]) { c.rect(x, y, 2, 1, shades[3]); }
  save(sakura ? 'tree_sakura' : 'tree_keyaki', c);
}
const hedge = new Canvas(16, 16);
hedge.rect(1, 4, 14, 11, 0x294f38); hedge.rect(0, 5, 16, 8, 0x294f38); hedge.rect(1, 3, 14, 8, 0x4b8349);
for (let y = 4; y < 12; y += 3) for (let x = 2 + y % 2; x < 14; x += 4) hedge.rect(x, y, 2, 1, 0x79aa59);
save('hedge', hedge);

// 屋根と南側の壁を真上から見下ろす。投影による横ずれは加えない。
function building(f) {
  const w = f.rect.w * 16, h = f.rect.h * 16 + f.roofExtra;
  const c = new Canvas(w, h), wallH = Math.min(h - 8, 12 + f.roofExtra), roofH = h - wallH;
  const r = (...args) => c.rect(...args);
  r(0, 0, w, h, ink); r(1, 1, w - 2, roofH - 1, f.roofColor);
  r(1, roofH, w - 2, wallH - 1, f.color);
  r(2, 2, w - 4, 2, cream); r(2, 3, 2, roofH - 5, cream);
  r(w - 4, 4, 2, roofH - 5, 0x6d6a61); r(2, roofH - 3, w - 4, 3, 0x6d6a61);
  // 屋根の継ぎ目・設備・採光窓。乱数を使わず棟ごとに位置を固定する。
  const variant = f.no ?? 21;
  for (let y = 10; y < roofH - 6; y += 12) c.line(6, y, w - 7, y, 0x827c70);
  for (let x = 10; x < w - 16; x += 24 + variant % 3 * 4) {
    r(x, 9, 12, 7, 0x686c69); r(x, 8, 11, 5, 0xd7d4c3); r(x + 2, 9, 6, 2, 0x9bafa9);
  }
  const windows = (x0 = 5, x1 = w - 5, spacing = 8 + variant % 3, ww = 4, y0 = roofH + 4) => {
    for (let y = y0; y < h - 7; y += 7) for (let x = x0; x + ww < x1; x += spacing) {
      r(x - 1, y - 1, ww + 2, 5, cream); r(x, y, ww, 3, glass); r(x, y, 1, 2, 0x9fc7cf);
    }
  };
  const bricks = (x0 = 1, x1 = w - 1) => {
    for (let y = roofH + 2; y < h - 2; y += 4) for (let x = x0 + (y % 8 ? 3 : 0); x < x1 - 4; x += 8) c.line(x, y, x + 4, y, 0xc38e73);
  };
  if (['honkan', 'b3', 'b8', 'b9', 'w1', 'archives', 'truss'].includes(f.id)) bricks();
  windows();
  r(w / 2 - 4, h - 9, 8, 8, ink); r(w / 2 - 3, h - 8, 6, 6, glass); r(w / 2, h - 8, 1, 6, cream);
  r(2, h - 3, w - 4, 2, 0x8c806d);
  const arch = (x, y, width, height, color) => {
    c.ellipse(x + width / 2, y + width / 2, width / 2, width / 2, cream);
    r(x, y + width / 2, width + 1, height - width / 2, cream);
    c.ellipse(x + width / 2, y + width / 2, width / 2 - 2, width / 2 - 2, color);
    r(x + 2, y + width / 2, width - 3, height - width / 2, color);
  };
  switch (f.id) {
    case 'honkan':
      r(1, roofH + 7, w - 2, 2, cream); r(1, h - 16, w - 2, 2, cream);
      r(w / 2 - 19, roofH - 4, 38, 4, cream);
      for (let i = -1; i <= 1; i++) arch(w / 2 + i * 12 - 4, h - 14, 8, 13, 0x332c2b);
      r(w / 2, 2, 1, 19, ink); r(w / 2 + 1, 2, 10, 6, 0xfff5e7); c.ellipse(w / 2 + 6, 4, 2, 2, 0xa9393c);
      break;
    case 'library': {
      const left = 28, right = w - 29;
      r(1, roofH, 26, wallH - 1, 0x9c5746); r(w - 27, roofH, 26, wallH - 1, 0x9c5746); bricks(1, 26); bricks(w - 26, w - 1);
      c.ellipse(w / 2, roofH - 2, (w - 54) / 2, roofH - 7, 0x426f88);
      c.ellipse(w / 2, roofH - 3, (w - 60) / 2, roofH - 11, 0xace0e8);
      r(left, roofH - 3, right - left, wallH, 0x87c6da);
      c.ellipse(w / 2, roofH + 3, 13, 13, 0xc6d7d4); c.ellipse(w / 2 - 2, roofH + 1, 11, 11, 0xfffdf0); c.ellipse(w / 2 - 5, roofH - 3, 5, 4, 0xffffff);
      for (let x = left; x <= right; x += 10) c.line(x, roofH - 9 - Math.round(12 * Math.sin((x - left) / (right - left) * Math.PI)), x, h - 5, 0xe4f3ec);
      c.line(left, h - 10, right, h - 10, cream); break;
    }
    case 'b10':
      // 高層棟は正面を縦に伸ばし、屋根の面積を小さくする。
      r(5, 17, w - 10, h - 21, 0x929ba1); r(6, 18, 5, h - 23, 0xbfc4c1);
      for (let y = 23; y < h - 9; y += 8) for (let x = 16; x < w - 10; x += 8) {
        r(x - 1, y - 1, 6, 7, 0xd6d8cd); r(x, y, 4, 5, 0x416378); r(x, y, 1, 3, 0x8db1c0);
      }
      r(4, 14, w - 8, 4, 0xe0dfd3); r(w - 9, 18, 4, h - 22, 0x5b6671); break;
    case 'b11':
      r(1, roofH, w - 2, 3, 0xffffff); r(2, h - 16, w - 4, 2, cream);
      for (let i = 0; i < 9; i++) { r(12 + i * 3, h - 3 - i * 3, 23, 3, 0xaba99e); r(12 + i * 3, h - 3 - i * 3, 23, 1, 0xfff9e9); }
      c.line(10, h - 6, 36, h - 33, ink); break;
    case 'b4':
      c.ellipse(w / 2, roofH / 2, w / 2 - 5, roofH / 2 - 3, 0x355747);
      c.ellipse(w / 2 - 1, roofH / 2 - 2, w / 2 - 8, roofH / 2 - 6, 0x719178);
      c.ellipse(w / 2 - 2, roofH / 2 - 4, w / 2 - 15, roofH / 2 - 12, 0x91ae8c);
      c.line(10, roofH / 2, w - 11, roofH / 2, 0xc2c7a5); break;
    case 'kaikan':
      r(2, roofH, w - 4, wallH - 3, f.color);
      for (let x = 7; x < w - 10; x += 17) { arch(x, roofH + 3, 12, wallH - 6, 0x3476aa); c.line(x + 6, roofH + 6, x + 6, h - 5, 0x8cc3dd); } break;
    case 'truss':
      for (let x = 3; x < w - 3; x += 14) { c.line(x, roofH - 4, x + 7, 5, cream); c.line(x + 7, 5, Math.min(w - 3, x + 14), roofH - 4, cream); }
      for (let x = 5; x < w - 10; x += 14) { r(x, roofH + 3, 11, wallH - 7, cream); r(x + 1, roofH + 4, 9, wallH - 9, glass); c.line(x + 5, roofH + 4, x + 5, h - 5, cream); } break;
    case 'archives':
      for (let y = 2; y < roofH - 2; y++) { const inset = Math.round((roofH - y) / roofH * (w / 2 - 2)); r(inset, y, w - 2 * inset, 1, y % 6 === 0 ? 0x754d3c : 0x9a6a4e); }
      c.line(2, roofH - 2, w / 2, 2, cream); c.line(w / 2, 2, w - 3, roofH - 2, cream); break;
    case 'b12':
      c.ellipse(w - 23, roofH - 2, 20, 24, 0x527d93); c.ellipse(w - 24, roofH - 4, 17, 21, 0xb3dde1);
      r(w - 43, roofH - 3, 39, wallH, 0x8abacb);
      for (let x = w - 40; x < w - 4; x += 7) c.line(x, roofH - 15, x, h - 6, cream);
      for (let y = roofH + 3; y < h - 3; y += 7) c.line(w - 42, y, w - 5, y, cream); break;
    case 'gym':
      for (let y = 3; y < roofH - 2; y++) {
        const inset = Math.round(13 * (1 - Math.sin((y - 3) / (roofH - 5) * Math.PI)));
        r(3 + inset, y, w - 6 - inset * 2, 1, y < roofH / 2 ? 0x9fc5d8 : 0x6794b3);
      }
      for (let x = 23; x < w - 15; x += 17) c.line(x, 8, x, roofH - 5, 0xd1e4e2);
      c.line(16, roofH - 5, w - 17, roofH - 5, 0x42667f); break;
    case 'b5': r(4, h - 13, w - 8, 2, cream); break;
    case 'b6': for (let x = 7; x < w - 4; x += 17) r(x, roofH + 1, 2, wallH - 4, cream); break;
    case 'b7': r(8, roofH - 15, w - 16, 7, 0x6897a4); c.line(8, roofH - 12, w - 9, roofH - 12, cream); break;
    case 'b8': r(2, roofH + 8, w - 4, 2, cream); break;
    case 'b9': for (let x = 4; x < w - 4; x += 16) r(x, roofH, 2, wallH - 3, 0xd1a087); break;
    case 'w1': r(10, 5, w - 20, 10, cream); r(13, 7, w - 26, 6, glass); break;
    case 'health': r(w / 2 - 2, roofH - 14, 4, 10, cream); r(w / 2 - 5, roofH - 11, 10, 4, cream); break;
    case 'intl': r(7, 6, 22, 13, cream); r(9, 8, 18, 9, 0x9fa9a0); break;
    case 'b1': r(5, roofH + 7, w - 10, 2, cream); break;
    case 'b2': r(w - 16, 7, 8, 15, 0xdfd0ac); break;
  }
  return c;
}
for (const f of facilities) if (f.solid) save(`building_${f.id}`, building(f));
assert.equal(written.size, dimensions.size, '生成漏れがあります');
assert(!written.has('building_atrio'), 'アトリオは地面として扱います');
console.log(`寸法・PNG復元検証成功：${written.size}枚`);
