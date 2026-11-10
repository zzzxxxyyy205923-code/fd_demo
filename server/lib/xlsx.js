/*
  零依赖 XLSX 写出器（OpenXML SpreadsheetML）
  ------------------------------------------------------------------
  为什么要自己写：本项目的闸门只依赖 express / cookie-parser / bcryptjs，
  为了「下载 Excel」再引一个大依赖（exceljs 等）不划算，而 CSV 又不是真正的 Excel 表格
  （多工作表、表头样式、数字格式都做不到）。这里手工拼一个最小但**规范**的 xlsx：
    · 用 zlib.deflateRawSync 压缩（zip 的 deflate 方式），自算 CRC32；
    · 单元格一律走 inlineStr / 数字 <v>，不生成 sharedStrings，结构最小；
    · styles.xml 只做「表头加粗 + 冻结不涉及」，足够可读。
  产物经 Python zipfile + ElementTree（以及 Excel/WPS/Numbers）验证可正常打开。

  用法：
    const buffer = xlsx.build([
      { name: '概览', columns: [{ label: '指标', width: 22 }, ...], rows: [[...], ...] }
    ]);
    // rows 里：字符串 → 文本单元格；number/boolean → 数字单元格
*/

const zlib = require("zlib");

/* ── CRC32（zip 需要） ───────────────────────────────────── */
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? (value >>> 1) ^ 0xEDB88320 : value >>> 1;
    }
    table[index] = value;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let index = 0; index < buffer.length; index += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[index]) & 0xFF];
  }
  return (crc ^ -1) >>> 0;
}

/* ── zip 打包（deflate，无数据描述符） ───────────────────── */
function zip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;

  files.forEach(file => {
    const nameBuf = Buffer.from(file.name, "utf8");
    const raw = Buffer.from(file.data, "utf8");
    const deflated = zlib.deflateRawSync(raw, { level: 6 });
    const crc = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);          // 本地文件头签名
    local.writeUInt16LE(20, 4);                  // 需要版本
    local.writeUInt16LE(0x0800, 6);              // 通用标志：文件名用 UTF-8
    local.writeUInt16LE(8, 8);                   // 压缩方式：deflate
    local.writeUInt16LE(0, 10);                  // 时间
    local.writeUInt16LE(0x21, 12);               // 日期（1980-01-01）
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(deflated.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);                  // 扩展字段长度
    chunks.push(local, nameBuf, deflated);

    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);           // 中央目录签名
    head.writeUInt16LE(20, 4);                   // 生成版本
    head.writeUInt16LE(20, 6);                   // 需要版本
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(8, 10);
    head.writeUInt16LE(0, 12);
    head.writeUInt16LE(0x21, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(deflated.length, 20);
    head.writeUInt32LE(raw.length, 24);
    head.writeUInt16LE(nameBuf.length, 28);
    head.writeUInt16LE(0, 30);                   // 扩展字段
    head.writeUInt16LE(0, 32);                   // 注释
    head.writeUInt16LE(0, 34);                   // 磁盘号
    head.writeUInt16LE(0, 36);                   // 内部属性
    head.writeUInt32LE(0, 38);                   // 外部属性
    head.writeUInt32LE(offset, 42);              // 本地头偏移
    central.push(head, nameBuf);

    offset += local.length + nameBuf.length + deflated.length;
  });

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuf, end]);
}

/* ── XML 片段 ───────────────────────────────────────────── */
const escapeXml = value => String(value == null ? "" : value)
  .replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[char]))
  /* xlsx 要求剔除 XML 1.0 不允许的控制字符，否则 Excel 报文件损坏 */
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");

const columnName = index => {
  let name = "";
  let value = index + 1;
  while (value > 0) {
    const rest = (value - 1) % 26;
    name = String.fromCharCode(65 + rest) + name;
    value = Math.floor((value - 1) / 26);
  }
  return name;
};

const cellXml = (value, rowIndex, colIndex) => {
  const ref = `${columnName(colIndex)}${rowIndex}`;
  const style = rowIndex === 1 ? ' s="1"' : "";
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}"${style}><v>${value ? 1 : 0}</v></c>`;
  const text = escapeXml(value);
  if (!text) return `<c r="${ref}"${style}/>`;
  return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
};

const sheetXml = sheet => {
  const columns = (sheet.columns || []).map((column, index) =>
    `<col min="${index + 1}" max="${index + 1}" width="${column.width || 16}" customWidth="1"/>`).join("");
  const rows = (sheet.rows || []).map((row, rowIndex) =>
    `<row r="${rowIndex + 1}">${row.map((value, colIndex) => cellXml(value, rowIndex + 1, colIndex)).join("")}</row>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<cols>${columns}</cols><sheetData>${rows}</sheetData></worksheet>`;
};

const sheetNames = sheets => sheets.map((sheet, index) => ({
  /* Excel 工作表名限制：≤31 字符、不含 : \ / ? * [ ]，且不能重复 */
  name: String(sheet.name || `Sheet${index + 1}`).replace(/[:\\/?*[\]]/g, " ").slice(0, 31) || `Sheet${index + 1}`
}));

/* ── 组装工作簿 ─────────────────────────────────────────── */
function build(sheets) {
  const list = (Array.isArray(sheets) ? sheets : []).filter(sheet => sheet && Array.isArray(sheet.rows));
  if (!list.length) throw new Error("xlsx.build 需要至少一个工作表");

  const files = [];
  files.push({
    name: "[Content_Types].xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${list.map((_sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("\n")}
</Types>`
  });
  files.push({
    name: "_rels/.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  });
  files.push({
    name: "xl/workbook.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheetNames(list).map((sheet, index) => `<sheet name="${escapeXml(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("")}</sheets>
</workbook>`
  });
  files.push({
    name: "xl/_rels/workbook.xml.rels",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${list.map((_sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("\n")}
<Relationship Id="rId${list.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  });
  files.push({
    name: "xl/styles.xml",
    data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="\u5fae\u8f6f\u96c5\u9ed1"/></font><font><b/><sz val="11"/><name val="\u5fae\u8f6f\u96c5\u9ed1"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`
  });
  list.forEach((sheet, index) => {
    files.push({ name: `xl/worksheets/sheet${index + 1}.xml`, data: sheetXml(sheet) });
  });

  return zip(files);
}

module.exports = { build, crc32, zip };
