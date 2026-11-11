/* 按 content-schema.json 校验一条记录（结构、类型、选项、格式）。不合法时抛出带 status 400 的错误。 */
const fail = (status, message) => Object.assign(new Error(message), { status });
const BLOCKED_KEYS = ['__proto__', 'constructor', 'prototype'];
// assets/ 下的文件名常带空格（如「W. Mona.jpg」）：允许空格，不允许换行、双引号、反引号、尖括号与反斜线。
// 本科站的图片路径相对 undergrad/assets/img/（如 site/x.jpg），上传文件写作 ../uploads/<哈希>（从 /undergrad/ 回到站点根）。
// 单引号放行：现有导师照片文件名里有（如 d'échanges）
const SAFE = '[^\\r\\n<>"`\\\\]';
const IMAGE = new RegExp(`^(https?:\\/\\/[^\\s<>"'\`\\\\]+|\\/?assets\\/${SAFE}+|(\\.\\.\\/)?uploads\\/[a-f0-9]{24}\\.(jpg|png|gif|webp)|(?!\\.|\\/)(?!.*\\.\\.)${SAFE}+\\.(jpe?g|png|gif|webp|svg))$`, 'i');
const PDF = new RegExp(`^(https?:\\/\\/[^\\s<>"'\`\\\\]+|\\/?assets\\/${SAFE}+\\.pdf|(\\.\\.\\/)?uploads\\/[a-f0-9]{24}\\.pdf)$`, 'i');
const URL = /^https?:\/\/[^\s<>"'`\\]+$/i;

function validate(value, spec, field = '') {
  if (!spec) throw fail(400, `${field || '字段'} 不存在`);
  if (value === null && spec.nullable) return;
  if (spec.anyOf) {
    const errors = [];
    for (const option of spec.anyOf) {
      try { return validate(value, option, field); } catch (e) { errors.push(e); }
    }
    throw errors.find(e => !/类型不正确$/.test(e.message)) || fail(400, `${field} 类型不正确`);
  }
  if (spec.type === 'array') {
    if (!Array.isArray(value) || value.length > 1000) throw fail(400, `${field} 必须是列表（最多 1000 项）`);
    if (spec.tuple && value.length !== spec.tuple.length) throw fail(400, `${field} 每项需填写：${spec.tuple.join(' / ')}`);
    value.forEach(v => validate(v, spec.items, field));
    return;
  }
  if (spec.type === 'object') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw fail(400, `${field} 格式错误`);
    for (const [key, v] of Object.entries(value)) {
      if (BLOCKED_KEYS.includes(key)) throw fail(400, '无效字段');
      const child = (spec.properties && spec.properties[key]) || spec.additional;
      if (!child) throw fail(400, `${field ? `${field}.` : ''}${key} 未知字段`);
      validate(v, child, field ? `${field}.${key}` : key);
    }
    return;
  }
  if (typeof value !== spec.type || (spec.type === 'number' && !Number.isFinite(value))) throw fail(400, `${field} 类型不正确`);
  if (typeof value !== 'string') return;
  if (field === 'id' && value && /[\s\\<>"'`]/.test(value)) throw fail(400, 'id 不能包含空格、反斜线、引号或尖括号');
  if (value.length > 60000) throw fail(400, `${field} 内容过长`);
  // *Html 字段由页面原样插入：只允许 <b> 加粗与 <br> 换行
  const text = /Html$/.test(field) ? value.replace(/<\/?b>|<br\s*\/?>/gi, '') : value;
  if (/<\s*\/?[a-z!]/i.test(text)) throw fail(400, /Html$/.test(field) ? `${field} 只能使用 <b> 加粗与 <br> 换行` : `${field} 请填写纯文字，不要输入 HTML 标签`);
  if (spec.format === 'url' && value && !URL.test(value)) throw fail(400, `${field} 请填写完整的 http(s) 链接`);
  if (spec.format === 'pdf' && value && !PDF.test(value)) throw fail(400, `${field}：PDF 请上传，或使用 http(s) 链接 / assets/ 下的 .pdf 路径`);
  if (spec.format === 'image' && value && !IMAGE.test(value)) throw fail(400, `${field}：图片请上传，或使用 http(s) 链接 / assets/ 下的路径`);
  if (spec.options && value && !spec.options.includes(value)) throw fail(400, `${field} 选项无效`);
  if (spec.pattern && value && !new RegExp(spec.pattern).test(value)) throw fail(400, spec.patternHint || `${field} 格式不正确`);
}

module.exports = { validate, fail };
