#!/usr/bin/env node
/*
  账号与权限管理 CLI（本地账号文件模式可写；AUTH_STAFF_JSON 模式为只读，请改环境变量）

    npm run account:add    -- <账号> <密码> [--name 姓名] [--email 邮箱] [--role admin|visitor]
    npm run account:list
    npm run account:passwd -- <账号> <新密码>
    npm run account:role   -- <账号> <角色>          # 角色清单见 account:list --roles
    npm run account:remove -- <账号>
    npm run account:hash   -- <密码>                 # 生成 bcrypt 哈希，供 AUTH_STAFF_JSON 使用

  账号名可以直接用邮箱（如 zhangshaopeng1@xdf.cn）；密码只以 bcrypt 哈希落盘。
*/
const accounts = require("../lib/accounts");
const { ROLES, PERMISSIONS } = require("../lib/permissions");

/* CLI 不触发空库 bootstrap：用 add 建第一个账号即可，「空库」时不该顺手生成随机管理员 */
accounts.disableBootstrap();

const [command, ...rest] = process.argv.slice(2);

/* 解析位置参数与 --key value 形式的选项 */
const positional = [];
const options = {};
for (let i = 0; i < rest.length; i += 1) {
  const item = rest[i];
  if (item.startsWith("--")) {
    const key = item.slice(2);
    const next = rest[i + 1];
    if (next === undefined || next.startsWith("--")) options[key] = true;
    else { options[key] = next; i += 1; }
  } else {
    positional.push(item);
  }
}

function usage() {
  console.log([
    "用法：",
    "  npm run account:add    -- <账号> <密码> [--name 姓名] [--email 邮箱] [--role admin|visitor]",
    "  npm run account:list",
    "  npm run account:passwd -- <账号> <新密码>",
    "  npm run account:role   -- <账号> <角色>",
    "  npm run account:remove -- <账号>",
    "  npm run account:hash   -- <密码>",
    "",
    `角色：${Object.entries(ROLES).map(([id, role]) => `${id}（${role.label}）`).join("、")}`,
    `权限：${Object.entries(PERMISSIONS).map(([id]) => id).join("、")}`,
    "",
    `当前账号来源：${safeSource()}`
  ].join("\n"));
}

function safeSource() {
  try {
    if (accounts.source() === "env") return "AUTH_STAFF_JSON 环境变量（只读）";
    if (accounts.source() === "cloud") return "云存储 private/staff-accounts.json";
    return accounts.STORE_FILE;
  } catch (error) {
    return `未初始化（${error.message}）`;
  }
}

function run() {
  switch (command) {
    case "add": {
      const [username, password] = positional;
      if (!username) return usage();
      const user = accounts.create({
        username,
        password,
        name: options.name === true ? "" : options.name,
        email: options.email === true ? "" : options.email,
        department: options.department === true ? "" : options.department,
        region: options.region === true ? "" : options.region,
        position: options.position === true ? "" : options.position,
        majors: options.majors === true ? "" : options.majors,
        role: options.role === true ? undefined : options.role
      });
      console.log(`已新增账号：${user.username}（${user.name}）角色：${user.role}（${user.roleLabel}）`);
      if (user.initialPassword) console.log(`初始密码（全站统一，可用 AUTH_INITIAL_PASSWORD 覆盖）：${user.initialPassword}`);
      return undefined;
    }
    case "list": {
      const list = accounts.list();
      console.log(`账号来源：${safeSource()}`);
      if (!list.length) return console.log("（暂无账号）");
      console.log("序号  登录名                          姓名            角色      权限");
      list.forEach((user, index) => {
        console.log(`${String(index + 1).padStart(4)}  ${user.username.padEnd(30)} ${user.name.padEnd(14)} ${(user.roleLabel + "").padEnd(8)} ${user.permissions.join(",")}`);
      });
      console.log(`\n角色（${Object.keys(ROLES).length}）：${Object.entries(ROLES).map(([id, role]) => `${id}=${role.label}`).join("  ")}`);
      console.log(`权限（${Object.keys(PERMISSIONS).length}）：${Object.keys(PERMISSIONS).join("  ")}`);
      return undefined;
    }
    case "passwd": {
      const [username, password] = positional;
      if (!username || !password) return usage();
      accounts.setPassword(username, password);
      console.log(`已更新 ${username} 的密码（bcrypt 哈希存储）`);
      return undefined;
    }
    case "role": {
      const [username, role] = positional;
      if (!username || !role) return usage();
      const user = accounts.update(username, { role });
      console.log(`已把 ${user.username} 的角色改为 ${user.role}（${user.roleLabel}，权限：${user.permissions.join(",")}）`);
      return undefined;
    }
    case "remove": {
      const [username] = positional;
      if (!username) return usage();
      accounts.remove(username);
      console.log(`已删除账号：${username}`);
      return undefined;
    }
    case "hash": {
      const [password] = positional;
      if (!password) return usage();
      console.log(accounts.hashPassword(password));
      return undefined;
    }
    default:
      return usage();
  }
}

async function main() {
  try {
    run();
    await accounts.flush();
  } catch (error) {
    console.error(`错误：${error.message}`);
    process.exitCode = 1;
  }
}

main();
