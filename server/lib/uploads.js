/* 后台上传的文件：图片（导师照片 / 封面 / 海报）与课程 PDF。
   · 文件名 = 内容哈希，同一文件重复上传不会产生新文件；
   · 本地目录：CONTENT_UPLOAD_DIR（默认 server/data/uploads，随站点数据纳入 git）；
   · 配置了 CloudBase 时同时写入 <CLOUD_PREFIX>uploads/，本地没有（重启 / 新实例）就从云端取回再缓存；
   · 只接受 JPG / PNG / WebP / GIF / PDF，按文件头识别真实类型，不信任请求头；
   · 大小上限分开：图片 UPLOAD_MAX_MB（默认 5），PDF PDF_UPLOAD_MAX_MB（默认 50，现有最大的课程 PDF 约 36 MB）。 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloud = require('./account-cloud');

const DIR = process.env.CONTENT_UPLOAD_DIR || path.join(__dirname, '../data/uploads');
const mb = (value, fallback) => Math.round((Number(value) || fallback) * 1024 * 1024);
const MAX_BYTES = mb(process.env.UPLOAD_MAX_MB, 5);
const PDF_MAX_BYTES = mb(process.env.PDF_UPLOAD_MAX_MB, 50);
const TYPES = {
  mp4: { mime: 'video/mp4', max: PDF_MAX_BYTES * 4, test: b => b.subarray(4,8).toString('latin1') === 'ftyp' },
  webm: { mime: 'video/webm', max: PDF_MAX_BYTES * 4, test: b => b.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])) },
  jpg: { mime: 'image/jpeg', max: MAX_BYTES, test: b => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  png: { mime: 'image/png', max: MAX_BYTES, test: b => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  gif: { mime: 'image/gif', max: MAX_BYTES, test: b => /^GIF8[79]a/.test(b.subarray(0, 6).toString('latin1')) },
  webp: { mime: 'image/webp', max: MAX_BYTES, test: b => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  pdf: { mime: 'application/pdf', max: PDF_MAX_BYTES, test: b => b.subarray(0, 5).toString('latin1') === '%PDF-' }
};
const NAME = /^[a-f0-9]{24}\.(jpg|png|gif|webp|pdf|mp4|webm)$/;
const fail = (status, message) => Object.assign(new Error(message), { status });
const cloudPath = name => `${cloud.PREFIX}uploads/${name}`;
const megabytes = bytes => `${Math.round(bytes / 1024 / 1024 * 10) / 10} MB`;

/* 请求声明的类型 → 该类型的大小上限（请求体读取前就按它限流） */
const limitFor = mime => (Object.values(TYPES).find(t => t.mime === mime) || {}).max || 0;

async function save(buffer, declared) {
  if (!Buffer.isBuffer(buffer) || !buffer.length) throw fail(400, '没有收到文件');
  const ext = Object.keys(TYPES).find(key => TYPES[key].test(buffer));
  if (!ext) throw fail(415, '仅支持 JPG / PNG / WebP / GIF 图片、PDF、MP4 或 WebM 视频');
  const type = TYPES[ext];
  // 声明为图片却是 PDF（或反之）一律拒绝：两类字段的格式校验不同
  if (declared && declared !== type.mime) throw fail(415, '文件内容与所选类型不符');
  if (buffer.length > type.max) throw fail(413, `${ext === 'pdf' ? 'PDF' : '图片'}超过 ${megabytes(type.max)} 上限，请压缩后再上传`);
  const name = `${crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24)}.${ext}`;
  const file = path.join(DIR, name);
  if (!fs.existsSync(file)) {
    if (cloud.enabled()) await cloud.pushFile(cloudPath(name), buffer);
    fs.mkdirSync(DIR, { recursive: true });
    fs.writeFileSync(file, buffer);
  }
  return { url: `uploads/${name}`, bytes: buffer.length };
}

/* 返回本地文件路径；本地缺失时尝试从云端取回。不存在返回 null。 */
async function locate(name) {
  if (!NAME.test(name)) return null;
  const file = path.join(DIR, name);
  if (fs.existsSync(file)) return file;
  if (!cloud.enabled()) return null;
  const buffer = await cloud.pullFile(cloudPath(name));
  if (!buffer) return null;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(file, buffer);
  return file;
}

module.exports = { save, locate, limitFor, MAX_BYTES, PDF_MAX_BYTES, MIMES: Object.values(TYPES).map(t => t.mime) };
