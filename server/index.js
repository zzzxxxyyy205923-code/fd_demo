/*
  启动入口：npm start / node server/index.js

  本站沿用 art-humanities_demo 的 Express 访问闸门与账号权限模块，
  但不加载 content.init()：本站没有「后台编辑站点内容」模块，
  assets/data/*.json 始终是页面数据的唯一来源，不会被后台快照接管。
*/
const { createApp } = require("./app");
const accounts = require("./lib/accounts");

const port = Number(process.env.PORT || 8020);
const host = process.env.HOST || "127.0.0.1";

accounts.reload();

createApp().listen(port, host, () => {
  const shown = host === "0.0.0.0" ? "localhost" : host;
  console.log("");
  console.log(`SFK 时尚科系站点已启动：http://${shown}:${port}/`);
  console.log(`后台入口：http://${shown}:${port}/admin （需登录）`);
  console.log(`账号库：${accounts.STORE_FILE}（${accounts.list().length} 个账号）`);
  console.log("");
});
