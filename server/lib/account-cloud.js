/*
  本站后台账号库的云端同步入口 —— 刻意保持「本地单源」。

  源站 art-humanities_demo 会用 TCB_ENV / TCB_STORAGE_BUCKET / CLOUDBASE_APIKEY
  把账号库切到 CloudBase 云存储。本站只复用它的账号与权限实现，不接入云账号：
  避免本机/部署环境里残留的 CloudBase 凭据把本站账号库逻辑覆盖掉。

  server/lib/accounts.js 仍按原实现调用 enabled() / push() / pull()，
  因此这里保留完全一致的接口，恒为「未启用」。
*/
const CLOUD_PATH = "private/staff-accounts.json";

const enabled = () => false;
const pull = async () => null;
const push = async () => {};

module.exports = { enabled, pull, push, CLOUD_PATH, fileID: () => CLOUD_PATH };
