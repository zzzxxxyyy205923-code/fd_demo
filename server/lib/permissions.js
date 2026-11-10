/*
  角色与权限（RBAC）—— 权限系统的单一事实来源
  ------------------------------------------------------------------
  扩展方式（不需要改任何闸门代码）：
    · 加权限：往 PERMISSIONS 里加一条；
    · 加角色：往 ROLES 里加一条，并把需要的权限名挂上去；
    · 给某个人单独开权限：账号记录里的 permissions 数组会在角色权限之上做并集。
  闸门与页面只认「权限名」（如 manage_accounts），不认角色名，
  因此调整角色划分时业务代码一行都不用动。

  内容类权限的粒度（2026-11-09 按「全部内容 / 部分内容」重新规定）：
    view_site     站点全部内容
    view_public   公开介绍类内容（主页 / 科系介绍 / 案例展示）
    view_sales    前端产品售卖相关资料（课程产品 / 院校库 …）
    view_renewal  后端产品续费相关资料（在读服务 / 续费与资源 …）
  注意：当前闸门对站点内容仍是「登录即可浏览」（见 server/app.js 的 requireContentAccess），
        这些内容权限作为角色定义与「角色与权限」矩阵的声明依据，尚未逐页/逐数据文件强制
        （2026-11-09 确认：本次只更新角色定义，不改动内容闸门）。

  账号管理范围（2026-11-09 起）：
    manage_accounts        → 全部账号（超级管理员）
    manage_scoped_accounts → 仅「地区教学主管/导师」职位的账号 + 本人一条（协作管理员）
    其余角色               → 仅本人一条
*/
const ROLES = {
  admin: {
    label: "超级管理员",
    desc: "站点全部内容的访问权 + 后台账号与角色管理",
    permissions: ["view_site", "manage_accounts", "manage_roles"]
  },
  research_mentor: {
    label: "协作管理员",
    desc: "站点全部内容的访问权 + 仅对「职位」为「地区教学主管/导师」的后台账号拥有管理权限（查看、改资料、重置密码、删除，及新建该职位账号）",
    permissions: ["view_site", "manage_scoped_accounts"]
  },
  academic_mentor: {
    label: "学术导师",
    desc: "站点全部内容的访问权，无后台账号管理权限",
    permissions: ["view_site"]
  },
  consultant: {
    label: "顾问导师",
    desc: "站点部分内容的访问权，无后台账号管理权限",
    permissions: ["view_public", "view_sales"]
  },
  academic_affairs: {
    label: "教务导师",
    desc: "站点部分内容的访问权，无后台账号管理权限",
    permissions: ["view_public", "view_renewal"]
  },
  market_mentor: {
    label: "市场导师",
    desc: "站点部分内容的访问权，无后台账号管理权限",
    permissions: ["view_public", "view_sales"]
  },
  visitor: {
    label: "资料访客",
    desc: "站点部分内容（主页、课程产品）的访问权，无后台账号管理权限",
    permissions: ["view_public", "view_sales"]
  }
};

const PERMISSIONS = {
  view_site: "浏览站点全部内容",
  view_public: "浏览公开介绍类内容（科系介绍 / 案例展示）",
  view_sales: "浏览前端产品售卖资料（课程产品 / 院校库 …）",
  view_renewal: "浏览后端产品续费资料（在读服务 / 续费与资源 …）",
  manage_accounts: "管理导师账号：新建、修改资料、重置密码、删除",
  manage_roles: "调整账号角色与附加权限",
  manage_scoped_accounts: "仅管理「地区教学主管/导师」职位的账号（查看、改资料、重置密码、删除，及新建该职位账号）"
};

const DEFAULT_ROLE = "visitor";      /* 新建账号的默认角色 = 最小权限 */
const ADMIN_ROLE = "admin";
/* 协作管理员可管理的目标职位：服务端范围过滤 / 写校验与前端职位下拉锁定共用此常量 */
const SCOPED_POSITION = "地区教学主管/导师";

const isRole = role => Object.prototype.hasOwnProperty.call(ROLES, role);
const isPermission = permission => Object.prototype.hasOwnProperty.call(PERMISSIONS, permission);
const roleOf = user => (user && isRole(user.role) ? user.role : DEFAULT_ROLE);
const roleLabel = user => ROLES[roleOf(user)].label;

/* 角色权限 ∪ 账号附加权限（去重，且只接受已知权限名） */
const effectivePermissions = user => {
  const extra = user && Array.isArray(user.permissions) ? user.permissions.filter(isPermission) : [];
  return [...new Set([...ROLES[roleOf(user)].permissions, ...extra])];
};

const hasPermission = (user, permission) => !!user && effectivePermissions(user).includes(permission);
const hasAnyPermission = user => effectivePermissions(user).length > 0;

/* 账号管理范围：闸门按范围而不是按角色名判断，新增角色时无需改业务代码。
   'all' 全部账号 / 'position' 仅 SCOPED_POSITION 职位账号 + 本人 / 'self' 仅本人。 */
const accountScope = user => {
  if (hasPermission(user, "manage_accounts")) return "all";
  if (hasPermission(user, "manage_scoped_accounts")) return "position";
  return "self";
};
const isScopedAccount = user => !!user && String(user.position || "").trim() === SCOPED_POSITION;

const rolesForClient = () => Object.entries(ROLES)
  .map(([id, role]) => ({ id, label: role.label, desc: role.desc, permissions: role.permissions }));
const permissionsForClient = () => Object.entries(PERMISSIONS)
  .map(([id, label]) => ({ id, label }));

module.exports = {
  ROLES,
  PERMISSIONS,
  DEFAULT_ROLE,
  ADMIN_ROLE,
  isRole,
  isPermission,
  roleOf,
  roleLabel,
  effectivePermissions,
  hasPermission,
  hasAnyPermission,
  accountScope,
  isScopedAccount,
  SCOPED_POSITION,
  rolesForClient,
  permissionsForClient
};
