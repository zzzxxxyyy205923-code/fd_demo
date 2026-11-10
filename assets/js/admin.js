/*
  后台管理台（账号与权限 / 导师列表）
  ------------------------------------------------------------------
  · 页面本身任何已登录账号都能打开（/admin.html 只要登录），数据范围由服务端决定：
    /api/accounts 返回 scope = 'all'（超级管理员，全部账号）、
    'position'（协作管理员，仅「地区教学主管/导师」职位账号 + 本人一条）或
    'self'（其余角色，**只有本人一条**）。页面按 scope 控制统计条、范围提示与「添加导师」整块。
  · 所有写操作都走后端二次校验；页面上的禁用/隐藏只是为了不给无效控件：
    - 协作管理员可新建 / 改资料 / 重置密码 / 删除目标职位账号，新建时职位下拉锁定为该职位；
    - 普通角色：只能改自己那条的资料（角色列锁定），且不能删号；
    - 改角色一律需要 manage_roles；
    - 账号库还会拦住「删除/降级最后一名管理员」「删除当前登录账号」。
  · 「添加导师」不需要填密码：服务端用**全站统一初始密码**（默认 888888）并在响应里回传一次，
    由导师本人登录后到本页「重置密码」自助改密（验当前密码，走 POST /api/auth/password）。
  · 下拉选项集中在 assets/js/admin-options.js（唯一维护点，按企业微信收集表替换即可）。
  · 只读降级：账号来自 AUTH_STAFF_JSON 环境变量时（运行期不可写），界面自动禁用全部写操作。
  · 页面最底部的「月 / 年活跃地图」面向所有角色（与权限、数据范围无关）：只读
    window.SFKActivity 里的本机使用轨迹做展示，两个视图共用同一个矩阵容器切换。
*/
(() => {
  const $ = selector => document.querySelector(selector);
  const toastNode = $('#admin-toast');
  const OPTIONS = window.SFK_ADMIN_OPTIONS || { regions: [], positions: [] };
  /* 与服务端 accounts.MIN_PASSWORD_LENGTH 对齐（统一初始密码 888888 即 6 位） */
  const MIN_PASSWORD_LENGTH = 6;

  const state = {
    roles: [], permissions: [], accounts: [], currentUserId: '', readOnly: false,
    /* 数据范围由服务端下发：'all' 全部 / 'position' 仅指定职位 + 本人 / 'self' 仅本人 */
    scope: 'self', scopedPosition: '',
    canManage: false, canManageRoles: false, canCreate: false, isAdmin: false
  };

  const escapeHtml = value => String(value == null ? '' : value)
    .replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  const toast = (message, isError) => {
    toastNode.textContent = message || '';
    toastNode.classList.toggle('is-error', !!isError);
    clearTimeout(toast.timer);
    if (message) toast.timer = setTimeout(() => { toastNode.textContent = ''; }, 4200);
  };

  const api = async (method, path, body) => {
    const response = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  };

  /* 下拉选项：保留空白项 + 当前值（历史数据里可能出现选项表之外的取值，不能丢） */
  const optionsFor = (list, current) => {
    const values = [...new Set([...(list || []), ...(current ? [current] : [])])];
    return ['<option value=""></option>']
      .concat(values.map(value => `<option value="${escapeHtml(value)}"${value === current ? ' selected' : ''}>${escapeHtml(value)}</option>`))
      .join('');
  };

  const renderRoleOptions = (selected, includeBlank) => {
    const blank = includeBlank ? '<option value=""></option>' : '';
    return blank + state.roles
      .map(role => `<option value="${escapeHtml(role.id)}"${role.id === selected ? ' selected' : ''}>${escapeHtml(role.label)}</option>`)
      .join('');
  };

  /* 新增账号的默认角色（服务端 DEFAULT_ROLE = visitor；取不到时退回第一个角色） */
  const DEFAULT_ROLE_ID = 'visitor';
  const defaultRoleId = () => (state.roles.some(role => role.id === DEFAULT_ROLE_ID) ? DEFAULT_ROLE_ID : (state.roles[0] || {}).id || '');

  /* 「添加导师」行选中的角色 → 同步该格的「生效权限」，与列表行展示同一口径 */
  function syncCreateRolePerms() {
    const select = $('#admin-create-role');
    const role = state.roles.find(item => item.id === select.value) || null;
    $('#admin-create-perms').textContent = role ? (role.permissions || []).join(' · ') : '';
  }

  /* data-label 与表头同文：≤760px 换成堆叠排布时，用它显示每格的列名 */
  function renderAccount(account, index) {
    const isSelf = account.id === state.currentUserId;
    const disabled = state.readOnly ? ' disabled' : '';
    /* 角色列：只有具备 manage_roles 的账号能改（服务端同样会拦），普通角色看到的是锁定态 */
    const roleDisabled = state.readOnly || !state.canManageRoles ? ' disabled' : '';
    return `<tr data-id="${escapeHtml(account.id)}">
      <td class="admin-idx" data-label="№">${String(index + 1).padStart(2, '0')}</td>
      <td data-label="地区"><select data-field="region"${disabled}>${optionsFor(OPTIONS.regions, account.region)}</select></td>
      <td data-label="姓名"><input type="text" data-field="name" value="${escapeHtml(account.name)}" maxlength="40"${disabled}></td>
      <td class="admin-login" data-label="公司邮箱（登录名）">${escapeHtml(account.email || account.username)}${isSelf ? '<span class="admin-self">当前账号</span>' : ''}</td>
      <td data-label="职位"><select data-field="position"${disabled}>${optionsFor(OPTIONS.positions, account.position)}</select></td>
      <td data-label="角色"><select data-field="role"${roleDisabled}>${renderRoleOptions(account.role, false)}</select></td>
      <td class="admin-perms" data-label="生效权限">${escapeHtml((account.permissions || []).join(' · '))}</td>
      <td data-label="操作">
        <div class="admin-actions">
          <button class="admin-btn" type="button" data-act="save"${disabled}>保存</button>
          <button class="admin-btn" type="button" data-act="passwd"${disabled}>重置密码</button>
          ${state.canManage
            ? `<button class="admin-btn admin-btn--danger" type="button" data-act="remove"${disabled || isSelf ? ' disabled' : ''}>删除</button>`
            : ''}
        </div>
      </td>
    </tr>`;
  }

  /* 长列表折叠：导师列表 / 账号明细默认只显示前 N 条，点击「展开全部」查看完整内容，
     减少长列表带来的过度下滑；两个列表的展开状态各自独立记忆，重渲染后依然保持。 */
  const TUTOR_PREVIEW = 20;
  const USAGE_PREVIEW = 20;
  let tutorExpanded = false;
  let usageExpanded = false;

  /* 列表底部「展开全部 / 收起」折叠控件：复用 .usage-user__toggle 视觉（箭头旋转 + aria-expanded 指示状态）。 */
  const listMoreRow = (kind, total, preview) => {
    const expanded = kind === 'tutor' ? tutorExpanded : usageExpanded;
    const label = expanded
      ? `收起（共 ${total} 条）`
      : `展开全部 ${total} 条（已显示前 ${preview} 条）`;
    return `<tr class="list-more-row"><td colspan="8">`
      + `<button type="button" class="usage-user__toggle list-showmore" data-list-kind="${kind}" aria-expanded="${expanded}">`
      + `<span class="usage-user__arrow" aria-hidden="true">▸</span>${escapeHtml(label)}</button></td></tr>`;
  };

  /* ── 导师筛选：地区 / 姓名 / 职位 / 角色，可组合使用 ──
     下拉选项 = 配置选项 ∪ 列表中实际出现的取值（历史数据不丢，如旧地区仍可筛）；
     重建选项时保留当前选中值，避免重渲染把筛选条件清空。 */
  const filterSelectOptions = (values, allLabel, current) => `<option value="">${escapeHtml(allLabel)}</option>`
    + values.filter(Boolean).map(value =>
      `<option value="${escapeHtml(value)}"${value === current ? ' selected' : ''}>${escapeHtml(value)}</option>`).join('');

  const tutorFilterValues = field => {
    const present = state.accounts.map(item => item[field]).filter(Boolean);
    const base = field === 'region' ? OPTIONS.regions : field === 'position' ? OPTIONS.positions : [];
    return [...new Set([...(base || []), ...present])];
  };

  function tutorFiltered() {
    const region = $('#tutor-filter-region').value;
    const name = ($('#tutor-filter-name').value || '').trim().toLowerCase();
    const position = $('#tutor-filter-position').value;
    const role = $('#tutor-filter-role').value;
    return state.accounts.filter(account =>
      (!region || account.region === region)
      && (!name || String(account.name || '').toLowerCase().includes(name))
      && (!position || account.position === position)
      && (!role || account.role === role));
  }

  function render() {
    const tbody = $('#admin-accounts');
    const total = state.accounts.length;
    const matched = tutorFiltered();
    const shown = (!tutorExpanded && matched.length > TUTOR_PREVIEW) ? matched.slice(0, TUTOR_PREVIEW) : matched;
    tbody.innerHTML = !total
      ? '<tr><td colspan="8" class="admin-empty">暂无账号</td></tr>'
      : (matched.length
        ? shown.map(renderAccount).join('')
        : '<tr><td colspan="8" class="admin-empty">没有匹配的导师，请调整筛选条件后重试</td></tr>');
    if (matched.length > TUTOR_PREVIEW) tbody.insertAdjacentHTML('beforeend', listMoreRow('tutor', matched.length, TUTOR_PREVIEW));

    /* 筛选栏：选项随数据刷新（保留当前选中值），计数实时反映筛选结果 */
    const regionSelect = $('#tutor-filter-region');
    const positionSelect = $('#tutor-filter-position');
    const roleSelect = $('#tutor-filter-role');
    regionSelect.innerHTML = filterSelectOptions(tutorFilterValues('region'), '全部地区', regionSelect.value);
    positionSelect.innerHTML = filterSelectOptions(tutorFilterValues('position'), '全部职位', positionSelect.value);
    const roleCurrent = roleSelect.value;
    const extraRoles = [...new Set(state.accounts
      .map(item => item.role)
      .filter(role => role && !state.roles.some(item => item.id === role)))];
    roleSelect.innerHTML = '<option value="">全部角色</option>'
      + state.roles.map(role => `<option value="${escapeHtml(role.id)}"${role.id === roleCurrent ? ' selected' : ''}>${escapeHtml(role.label)}</option>`).join('')
      + extraRoles.map(role => `<option value="${escapeHtml(role)}"${role === roleCurrent ? ' selected' : ''}>${escapeHtml(role)}</option>`).join('');
    const filtering = Boolean(regionSelect.value || ($('#tutor-filter-name').value || '').trim()
      || positionSelect.value || roleSelect.value);
    $('#tutor-filter-count').textContent = filtering
      ? `匹配 ${matched.length} / ${total} 位导师`
      : `共 ${total} 位导师`;

    /* 折叠标签上的数量徽章 = 当前已录入导师条数（随数据范围变化：普通角色只看到本人一条） */
    $('#admin-list-count').textContent = `${total} 位`;
    $('#admin-stat-accounts').textContent = String(state.accounts.length);
    $('#admin-stat-admins').textContent = String(state.accounts.filter(item => item.role === 'admin').length);
    $('#admin-stat-source').textContent = state.readOnly
      ? 'env（只读）'
      : (state.source === 'cloud' ? '云存储' : 'accounts.json');

    /* 角色与权限矩阵只有管理员用得上：非管理员连 DOM 都不渲染（整块也已 hidden） */
    $('#admin-roles').innerHTML = state.isAdmin
      ? state.roles.map(role =>
        `<tr><td class="admin-login">${escapeHtml(role.label)}<br><span class="admin-perms">${escapeHtml(role.id)}</span></td>
           <td>${escapeHtml(role.desc)}</td>
           <td class="admin-perms">${escapeHtml((role.permissions || []).join(' · '))}</td></tr>`).join('')
      : '';

    $('#admin-permissions').innerHTML = state.isAdmin
      ? state.permissions.map(item => `<li><code>${escapeHtml(item.id)}</code>${escapeHtml(item.label)}</li>`).join('')
      : '';

    $('#admin-create-region').innerHTML = optionsFor(OPTIONS.regions, '');
    /* 协作管理员只能新建目标职位账号：职位下拉锁定为服务端下发的唯一取值（不禁用，保证随表单提交） */
    const scoped = state.scope === 'position' && state.scopedPosition;
    $('#admin-create-position').innerHTML = scoped
      ? `<option value="${escapeHtml(state.scopedPosition)}" selected>${escapeHtml(state.scopedPosition)}</option>`
      : optionsFor(OPTIONS.positions, '');

    /* 「添加导师」行的「角色」与列表行完全同一套下拉：同选项、同样式、同交互（改选后「生效权限」跟着变） */
    $('#admin-create-role').innerHTML = renderRoleOptions(defaultRoleId(), false);
    syncCreateRolePerms();
    ['#admin-create-region', '#admin-create-position', '#admin-create-submit']
      .forEach(selector => { $(selector).disabled = state.readOnly; });
    /* 调整角色需要 manage_roles：协作管理员没有该权限，禁用后 FormData 不带 role，服务端走默认角色 */
    $('#admin-create-role').disabled = state.readOnly || !state.canManageRoles;
    $('#admin-readonly').hidden = !state.readOnly;

    applyBlockVisibility();
  }

  /* ── 「导师列表」折叠 / 展开 ───────────────────────
     数量徽章由 render() 按账号条数更新；这里只负责开合状态（初始展开）。 */
  const listToggle = $('#admin-list-toggle');
  const listBody = $('#admin-list-body');
  if (listToggle && listBody) {
    listToggle.addEventListener('click', () => {
      const expanded = listToggle.getAttribute('aria-expanded') !== 'false';
      listToggle.setAttribute('aria-expanded', String(!expanded));
      listBody.hidden = expanded;
    });
  }

  /* 「账号使用明细」折叠 / 展开：与「导师列表」同名按钮完全一致的样式、交互与切换逻辑，
     一键折叠或展开该区域下的全部条目（初始展开）。 */
  const usageAccountsToggle = $('#usage-accounts-toggle');
  const usageAccountsBody = $('#usage-accounts-body');
  if (usageAccountsToggle && usageAccountsBody) {
    usageAccountsToggle.addEventListener('click', () => {
      const expanded = usageAccountsToggle.getAttribute('aria-expanded') !== 'false';
      usageAccountsToggle.setAttribute('aria-expanded', String(!expanded));
      usageAccountsBody.hidden = expanded;
    });
  }

  /* ── 分块可见性 ──────────────────────────
     超级管理员：全部区块；
     协作管理员：导师列表 + 活跃地图 + 添加导师（可新建目标职位账号）；
     其余角色：只保留导师列表与活跃地图。服务端另有按范围的兜底校验。 */
  function applyBlockVisibility() {
    const visible = {
      'admin-list-block': true,                 /* 导师信息：所有角色可见 */
      'active-map-block': true,                 /* 活跃地图：所有角色可见 */
      'admin-create-block': state.canCreate,    /* 添加导师：超级管理员 / 协作管理员 */
      'admin-roles-block': state.isAdmin,       /* 角色与权限：仅超级管理员 */
      'usage-overview-block': state.isAdmin,    /* 网站使用概览：仅超级管理员（另有服务端 403 兜底） */
      'audit-block': state.isAdmin             /* 操作日志：仅超级管理员（另有服务端 403 兜底） */
    };
    Object.keys(visible).forEach(id => {
      const node = document.getElementById(id);
      if (node) node.hidden = !visible[id];
    });
    /* 统计条统计的是全站数据，只有能看到全部账号的超级管理员才显示 */
    $('#admin-stats').hidden = !state.isAdmin;
    /* 范围提示：按服务端下发的 scope 给出对应文案 */
    const hint = $('#admin-scope-hint');
    hint.hidden = state.scope === 'all';
    if (state.scope === 'position') {
      hint.innerHTML = `当前角色仅可管理<strong>「${escapeHtml(state.scopedPosition)}」</strong>职位的账号：可查看、修改资料、重置密码、删除，以及新建该职位账号；其余导师信息不显示。`;
    } else if (state.scope === 'self') {
      hint.innerHTML = '当前角色仅可查看与修改<strong>本人</strong>的账号信息，其余导师信息不显示；如需管理他人账号，请联系管理员调整角色。';
    }
  }

  async function load() {
    const [accountsResult, rolesResult] = await Promise.all([api('GET', 'api/accounts'), api('GET', 'api/roles')]);
    if (accountsResult.status === 401) return;                       /* api() 已跳登录页 */
    if (accountsResult.status === 403 || rolesResult.status === 403) {
      toast('当前账号没有后台管理权限，正在返回站点首页…', true);
      setTimeout(() => window.location.replace('/'), 1600);
      return;
    }
    if (!accountsResult.ok) return toast(accountsResult.data.error || '导师列表加载失败', true);
    state.accounts = accountsResult.data.accounts || [];
    state.currentUserId = accountsResult.data.currentUserId || '';
    state.readOnly = !!accountsResult.data.readOnly;
    state.source = accountsResult.data.source || '';
    state.scope = accountsResult.data.scope || 'self';
    state.scopedPosition = accountsResult.data.scopedPosition || '';
    /* 页面按「自己有哪些权限」决定可编辑范围（服务端会同样校验，这里只为不给无效控件） */
    const mine = (accountsResult.data.currentUser && accountsResult.data.currentUser.permissions) || [];
    state.canManage = state.scope !== 'self';
    state.canManageRoles = mine.includes('manage_roles');
    state.canCreate = mine.includes('manage_accounts') || mine.includes('manage_scoped_accounts');
    /* 「网站使用概览」只给超级管理员（role === 'admin'）：协作管理员虽能管部分账号也看不到。
       非管理员这里连请求都不发（服务端另有 403 兜底）；区块显隐统一交给 applyBlockVisibility()。 */
    state.isAdmin = ((accountsResult.data.currentUser || {}).role === 'admin');
    if (state.isAdmin) { loadUsage(); loadAudit(); }
    state.roles = (rolesResult.data && rolesResult.data.roles) || [];
    state.permissions = (rolesResult.data && rolesResult.data.permissions) || [];
    render();

    const me = state.accounts.find(item => item.id === state.currentUserId);
    $('#admin-account').textContent = me ? `${me.name} · ${me.roleLabel}` : (window.SFKAuth && window.SFKAuth.user ? window.SFKAuth.user.name : '—');
  }

  /* ── 行内操作（事件委托，容器重渲染后依然有效） ── */
  $('#admin-accounts').addEventListener('click', async event => {
    const button = event.target.closest('button[data-act]');
    if (!button) return;
    const row = button.closest('tr');
    const id = row.getAttribute('data-id');
    const account = state.accounts.find(item => item.id === id);
    if (!account) return;
    const action = button.getAttribute('data-act');

    if (action === 'save') {
      const payload = {};
      /* role 只在具备 manage_roles 时才提交：普通角色改自己的资料可以，但给自己改角色一律不许 */
      const fields = ['name', 'region', 'position'];
      if (state.canManageRoles) fields.push('role');
      fields.forEach(field => {
        const node = row.querySelector(`[data-field="${field}"]`);
        if (!node) return;
        const value = node.value.trim();
        if (value !== String(account[field] || '')) payload[field] = value;
      });
      if (!Object.keys(payload).length) return toast('没有需要保存的改动');
      button.disabled = true;
      const result = await api('PATCH', `api/accounts/${encodeURIComponent(id)}`, payload);
      button.disabled = false;
      if (!result.ok) return toast(result.data.error || '保存失败', true);
      toast(`已保存 ${id} 的改动`);
      return load();
    }

    if (action === 'passwd') {
      /* 自己的密码 = 自助修改（必须验当前密码）；别人的密码 = 管理员代重置（manage_accounts）。 */
      if (id === state.currentUserId) {
        const current = window.prompt('请输入当前密码（初始密码请向管理员确认）：');
        if (current == null) return undefined;
        const next = window.prompt(`请设置新密码（至少 ${MIN_PASSWORD_LENGTH} 位）：`);
        if (next == null) return undefined;
        if (next.length < MIN_PASSWORD_LENGTH) return toast(`密码至少 ${MIN_PASSWORD_LENGTH} 位`, true);
        const result = await api('POST', 'api/auth/password', { currentPassword: current, newPassword: next });
        if (!result.ok) return toast(result.data.error || '修改失败', true);
        toast('密码已更新：其它设备上的旧会话已失效，请用新密码重新登录');
        return undefined;
      }
      const password = window.prompt(`为 ${id} 设置新密码（至少 ${MIN_PASSWORD_LENGTH} 位）：`);
      if (password == null) return undefined;
      if (password.length < MIN_PASSWORD_LENGTH) return toast(`密码至少 ${MIN_PASSWORD_LENGTH} 位`, true);
      const result = await api('PATCH', `api/accounts/${encodeURIComponent(id)}`, { password });
      if (!result.ok) return toast(result.data.error || '重置失败', true);
      toast(`已重置 ${id} 的密码（bcrypt 哈希存储）`);
      return undefined;
    }

    if (action === 'remove') {
      if (!window.confirm(`确定删除账号 ${id}？该账号将立即失去访问权限。`)) return undefined;
      const result = await api('DELETE', `api/accounts/${encodeURIComponent(id)}`);
      if (!result.ok) return toast(result.data.error || '删除失败', true);
      toast(`已删除账号 ${id}`);
      return load();
    }
    return undefined;
  });

  /* 导师列表：底部「展开全部 / 收起」折叠控件（事件委托，重渲染后依然有效） */
  $('#admin-accounts').addEventListener('click', event => {
    if (!event.target.closest('.list-showmore')) return;
    tutorExpanded = !tutorExpanded;
    render();
  });

  /* 导师筛选：任一维度变化即实时刷新列表（选择 change / 姓名 input）；「清除」重置全部条件 */
  ['#tutor-filter-region', '#tutor-filter-position', '#tutor-filter-role']
    .forEach(selector => { $(selector).addEventListener('change', render); });
  $('#tutor-filter-name').addEventListener('input', render);
  $('#tutor-filter-clear').addEventListener('click', () => {
    $('#tutor-filter-region').value = '';
    $('#tutor-filter-name').value = '';
    $('#tutor-filter-position').value = '';
    $('#tutor-filter-role').value = '';
    render();
  });

  /* 「角色」下拉改选 → 同步该行的「生效权限」（与列表行同一口径） */
  $('#admin-create-role').addEventListener('change', syncCreateRolePerms);

  /* ── 添加导师 ── */
  $('#admin-create').addEventListener('submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const email = String(data.email || '').trim();
    const submit = $('#admin-create-submit');
    submit.disabled = true;
    /* 公司邮箱即登录名；密码由服务端自动生成并在响应里回传一次 */
    const payload = {
      username: email,
      name: data.name,
      email,
      region: data.region,
      position: data.position
    };
    /* 角色：只有选了非默认角色才提交 —— 改角色需要 manage_roles 权限（与列表行「改角色会被 403」同一语义），
       这样默认路径对「科系教研导师」这类只有 manage_accounts 的账号依旧可用。 */
    if (data.role && data.role !== defaultRoleId()) payload.role = data.role;
    const result = await api('POST', 'api/accounts', payload);
    submit.disabled = false;
    if (!result.ok) {
      toast(result.data.error || '添加失败', true);
      return;
    }
    const account = result.data.account;
    const box = $('#admin-create-result');
    box.hidden = false;
    box.innerHTML = `已添加导师 <strong>${escapeHtml(account.name)}</strong>（登录名 ${escapeHtml(account.username)}，角色 ${escapeHtml(account.roleLabel)}）`
      + (result.data.initialPassword
        ? `｜初始密码：<code>${escapeHtml(result.data.initialPassword)}</code> <em>全站统一初始密码，请提醒本人登录后到「重置密码」改成自己的密码</em>`
        : '');
    toast(`已添加导师 ${account.name}`);
    form.reset();
    return load();
  });

  /* 登出（顶栏「退出登录」/ 底部「登出」）与顶部网格背景剪裁由 admin-shell.js 统一处理（所有后台页共用）。 */

  /* ── 月 / 年活跃地图（全站口径，所有角色可见）──────────────────
     数据来源：GET api/activity —— 服务端以账号库全部已录入用户为数据集合，
     汇总全站使用埋点后按自然月 / 自然年聚合，只返回聚合数字。
       · 月视图：每格 = 当前自然月的一天，值 = 当天活跃用户数（去重）/ 全站用户总数；
       · 年视图：每格 = 当前自然年的一个月，值 = 当月活跃用户数（去重）+ 活跃天数。
     每个格子用一条横向进度条表达活跃度，填充宽度对应「半份」映射到 0–100% 的比例，
     用进度长短表达活跃度；不再读取 window.SFKActivity（本机 localStorage）。 */
  const MAP_MODES = { MONTH: 'month', YEAR: 'year' };
  const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];   /* 周一开头 */
  let mapMode = MAP_MODES.MONTH;
  let activityData = { totalUsers: 0, activeUsers: 0, inactiveUsers: 0, days: {}, months: {}, years: {}, loaded: false };

  const pad2 = value => String(value).padStart(2, '0');
  const dayKeyOf = date => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  /* ── 活跃度 → 进度条比例（单一事实来源）──────────────────────────
     活跃率 r = 活跃用户数 ÷ 全站已录入用户数（0–1，分母含从未活跃用户）。
     每格 20 个半份单位；半份数 h = round(r × 20)，clamp 到 0–20。
     活跃度等级 L_h 即「第 h 个半份」，每级相差 5% 活跃率：L0 = 0% = 0%，L1 = 5%，…，L20 = 100%（全员活跃）。
     进度条填充宽度 = h ÷ 20 × 100%，方向左 → 右，边界 0%（空轨道）~ 100%（满格）；
     保留 21 档分辨率，与「半份」映射完全一致，仅将分段填充改为连续进度条。 */
  const SEGMENT_COUNT = 10;                   /* 仅用于语义说明，进度条不再依赖分段数 */
  const HALF_UNITS = SEGMENT_COUNT * 2;      /* 20 个半份，即进度条 100% 对应的单位数 */
  const halfUnitsOf = (activeUsers, totalUsers) => {
    if (!activeUsers || !totalUsers) return 0;
    return Math.max(0, Math.min(HALF_UNITS, Math.round((activeUsers / totalUsers) * HALF_UNITS)));
  };
  const trackHtml = halfUnits => {
    const ratio = Math.max(0, Math.min(1, halfUnits / HALF_UNITS));   /* 0–1，对应 0%–100% */
    const pct = (ratio * 100).toFixed(2);
    return `<span class="active-cell__track" aria-hidden="true">`
      + `<span class="active-cell__fill" style="width:${pct}%"></span></span>`;
  };
  const cellShell = (classes, label, inner) => `<span class="active-cell${classes}"`
    + ` role="gridcell" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">`
    + trackHtml(halfUnitsOf(inner.users, inner.total))
    + `<span class="active-cell__label">${inner.text}</span></span>`;

  function renderMonthMap(data, now) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = dayKeyOf(now);
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;   /* 0 = 周一 */
    const total = data.totalUsers || 0;
    const days = data.days || {};
    const monthKey = `${year}-${pad2(month + 1)}`;
    const monthStat = (data.months || {})[monthKey] || { users: 0, activeDays: 0, events: 0 };

    const counts = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      counts.push((days[dayKeyOf(new Date(year, month, day))] || {}).users || 0);
    }
    const activeDays = counts.filter(count => count > 0).length;

    const cells = [];
    for (let blank = 0; blank < firstWeekday; blank += 1) cells.push('<span class="active-cell is-void"></span>');
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = dayKeyOf(new Date(year, month, day));
      const entry = days[key] || {};
      const users = entry.users || 0;
      const isToday = key === todayKey;
      const isFuture = key > todayKey;
      const halfUnits = isFuture ? 0 : halfUnitsOf(users, total);
      const label = `${month + 1}月${day}日 · ${isFuture ? '未到'
        : `活跃 ${users}/${total} 人（${entry.rate || 0}%）· 进度 ${halfUnits * 5}%（L${halfUnits}）· ${entry.events || 0} 次使用`}`;
      const classes = `${isToday ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`;
      cells.push(cellShell(classes, label, { users: isFuture ? 0 : users, total, text: String(day) }));
    }
    return {
      html: cells.join(''),
      weekdays: true,
      summary: `全站 <strong>${total}</strong> 人（未活跃 ${data.inactiveUsers || 0} 人）· 本月活跃 <strong>${activeDays}</strong> 天`
        + ` · 本月活跃用户 <strong>${monthStat.users}</strong> 人 · 今日活跃 <strong>${(days[todayKey] || {}).users || 0}</strong> 人`
    };
  }

  function renderYearMap(data, now) {
    const year = now.getFullYear();
    const total = data.totalUsers || 0;
    const thisMonth = `${year}-${pad2(now.getMonth() + 1)}`;
    const stats = [];
    for (let month = 0; month < 12; month += 1) {
      const key = `${year}-${pad2(month + 1)}`;
      stats.push({ key, ...((data.months || {})[key] || { users: 0, activeDays: 0, events: 0 }) });
    }
    const cells = stats.map((item, index) => {
      const isFuture = item.key > thisMonth;
      const halfUnits = isFuture ? 0 : halfUnitsOf(item.users, total);
      const label = `${year} 年 ${index + 1} 月 · 活跃用户 ${item.users}/${total} 人`
        + ` · 活跃 ${item.activeDays} 天 · 进度 ${halfUnits * 5}%（L${halfUnits}）· ${item.events} 次使用`;
      const classes = ` active-cell--month${item.key === thisMonth ? ' is-today' : ''}${isFuture ? ' is-future' : ''}`;
      const text = `<span class="active-cell__num">${index + 1}月</span>`
        + `<span class="active-cell__meta">${item.users ? `${item.users} 人 / ${item.activeDays} 天` : '—'}</span>`;
      return cellShell(classes, label, { users: isFuture ? 0 : item.users, total, text });
    });
    /* 年视图严格按自然年：活跃天数与活跃用户数都取服务端按年聚合的结果，
       不混入其它年份的用户（全时段 activeUsers 只用于说明整体覆盖情况）。 */
    const yearStat = (data.years || {})[String(year)] || { users: 0, activeDays: 0, events: 0 };
    const covered = stats.filter(item => item.activeDays > 0).length;
    return {
      html: cells.join(''),
      weekdays: false,
      summary: `全站 <strong>${total}</strong> 人（未活跃 ${data.inactiveUsers || 0} 人）· ${year} 年活跃 <strong>${yearStat.activeDays}</strong> 天`
        + ` · 覆盖 <strong>${covered}</strong> 个月 · 该年活跃用户 <strong>${yearStat.users}</strong> 人`
    };
  }

  function renderActiveMap() {
    const data = activityData;
    const now = new Date();
    const isYear = mapMode === MAP_MODES.YEAR;
    const view = isYear ? renderYearMap(data, now) : renderMonthMap(data, now);

    $('#active-map-title').textContent = isYear ? '年活跃地图' : '月活跃地图';
    $('#active-map-summary').innerHTML = data.loaded ? view.summary : '活跃数据加载中…';
    $('#active-map-grid').className = `active-map__grid${isYear ? ' active-map__grid--year' : ''}`;
    $('#active-map-grid').setAttribute('aria-label',
      isYear ? `${now.getFullYear()} 年每月全站活跃用户数` : `${now.getMonth() + 1} 月每日全站活跃用户数`);
    $('#active-map-grid').innerHTML = view.html;

    const weekdayHead = $('#active-map-weekdays');
    weekdayHead.hidden = !view.weekdays;
    if (view.weekdays && !weekdayHead.childElementCount) {
      weekdayHead.innerHTML = WEEKDAYS
        .map(day => `<span class="active-map__wd" aria-hidden="true">${day}</span>`).join('');
    }
    /* 把统计口径写在界面上，避免被误读成「本机记录」或「只统计活跃过的人」 */
    $('#active-map-caption').textContent = data.loaded
      ? `统计口径：以全站已录入用户 ${data.totalUsers} 人为数据集合（含从未活跃的 ${data.inactiveUsers} 人），`
        + '按自然月 / 自然年聚合活跃用户数；每格用一条横向进度条表达活跃度，'
        + '进度 = 活跃用户数 ÷ 全站用户数 × 100%（按 5% 取整，共 21 档 L0–L20），0%–100% 对应空轨道到满格。'
        + '数据来源为服务端全站使用埋点（登录进站、板块浏览、导师 / 课程访问），不再依赖本机浏览器记录。'
      : '活跃数据加载中…';
    /* 图例：0 / 25% / 50% / 75% / 100% 五个示例，直观展示进度条与活跃度等级的对应关系 */
    const legend = $('#active-map-legend-scale');
    if (legend && !legend.childElementCount) {
      legend.innerHTML = [0, 5, 10, 15, 20]
        .map(half => `<span class="active-cell" title="进度 ${half * 5}%（L${half}，活跃率 ${half * 5}%）">`
          + `${trackHtml(half)}</span>`)
        .join('');
    }
    document.querySelectorAll('[data-map-mode]').forEach(button => {
      const isActive = button.getAttribute('data-map-mode') === mapMode;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  }

  /* 从服务端取全站聚合数据：所有登录角色都可读（接口只返回聚合数字）。
     切换月 / 年视图不重复请求 —— 服务端一次返回全部自然日与自然月的聚合结果。 */
  async function loadActivity() {
    const result = await api('GET', 'api/activity');
    if (!result.ok) {
      $('#active-map-summary').textContent = result.data.error || '活跃数据加载失败';
      return;
    }
    activityData = {
      totalUsers: 0, activeUsers: 0, inactiveUsers: 0, days: {}, months: {}, years: {},
      ...result.data, loaded: true
    };
    renderActiveMap();
  }

  /* 切换视图后保证「矩阵 + 下方标签」整体落在视口里 —— 用户点完就能看到全部区块，
     不需要再滚动。已经完整可见时一动不动（避免无谓跳动）。
     注意：只在用户点击后调用，首次渲染不调用 —— 否则打开页面会被拽到页底。 */
  function keepActiveMapInView() {
    const block = document.getElementById('active-map-block');
    if (!block) return;
    const margin = 12;
    const viewport = window.innerHeight || 0;
    const rect = block.getBoundingClientRect();
    /* 顶边也要留白：max-height 场景下即便小块也被 sticky 顶栏压住时会重排一次 */
    if (rect.top >= margin && rect.bottom <= viewport - margin) return;
    window.scrollTo({ top: Math.max(0, Math.round(rect.top + window.scrollY - margin)), behavior: 'instant' });
  }

  document.querySelectorAll('[data-map-mode]').forEach(button => {
    button.addEventListener('click', () => {
      mapMode = button.getAttribute('data-map-mode') === MAP_MODES.YEAR ? MAP_MODES.YEAR : MAP_MODES.MONTH;
      renderActiveMap();                       /* 同一个矩阵容器内直接切换，不跳页、不刷新 */
      keepActiveMapInView();                   /* 切完即完整可见（同步完成，无加载步骤） */
    });
  });
  renderActiveMap();                            /* 先用空数据画骨架，避免异步请求期间空白 */
  loadActivity();                              /* 服务端全站聚合数据回来后重绘 */

  /* ── 网站使用概览（**仅管理员角色** role === 'admin'）────────────
     服务端 GET api/usage/overview 汇总埋点数据（板块浏览 / 停留时长 / 导师信息访问），
     这里把它画成横向条形图 + 账号明细表；「下载 Excel」指向服务端生成的 .xlsx。
     非管理员：整块 hidden 且**一个请求都不发**（服务端也会 403，双重保险）。 */
  const USAGE_ENDPOINT = 'api/usage/overview';
  let usageDays = 7;

  const formatDuration = ms => {
    const total = Math.max(0, Math.round((Number(ms) || 0) / 1000));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const seconds = total % 60;
    if (hours) return `${hours} 小时 ${minutes} 分`;
    if (minutes) return `${minutes} 分 ${seconds} 秒`;
    return `${seconds} 秒`;
  };
  const formatWhen = ts => {
    if (!ts) return '—';
    const date = new Date(ts);
    const pad = value => String(value).padStart(2, '0');
    return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  /* 横向条形图：宽度 = 该行数值 / 本组最大值（纯 CSS，无图表库） */
  function usageBars(rows, value, format) {
    if (!rows.length) return '<p class="usage-empty">暂无数据</p>';
    const max = Math.max.apply(null, rows.map(value).concat([1]));
    return rows.map(row => {
      const amount = value(row);
      const width = Math.max(2, Math.round((amount / max) * 100));
      return `<div class="usage-bar">
        <div class="usage-bar__head">
          <span class="usage-bar__label">${escapeHtml(row.label)}</span>
          <span class="usage-bar__value">${escapeHtml(format(row))}</span>
        </div>
        <div class="usage-bar__track"><div class="usage-bar__fill" style="width: ${width}%"></div></div>
      </div>`;
    }).join('');
  }

  let usageUsers = [];

  /* 课程信息排行：热度 = 课程海报访问次数 + 查看停留秒数（服务端算好）。
     每行展示具体课程信息（名称 / 所属 4 个课程目录之一 / 类别 / 海报缩略图）+ 访问与停留数据。 */
  function usageCourseRows(rows) {
    if (!rows.length) return '<p class="usage-empty">暂无课程海报访问记录</p>';
    /* 按所属课程目录汇总访问次数：能一眼看出 4 个课程目录各自的课程被关注度 */
    const byCatalog = new Map();
    rows.forEach(row => {
      const key = row.catalog || '未标注目录';
      const item = byCatalog.get(key) || { label: key, views: 0, courses: 0 };
      item.views += row.views;
      item.courses += 1;
      byCatalog.set(key, item);
    });
    const chips = `<div class="usage-catalogs"><span class="usage-catalogs__label">目录访问</span>`
      + [...byCatalog.values()].sort((a, b) => b.views - a.views)
        .map(item => `<span class="usage-catalog">${escapeHtml(item.label)}<strong>${item.views}</strong></span>`).join('')
      + '</div>';
    const max = Math.max.apply(null, rows.map(row => row.score).concat([1]));
    return `${chips}<div class="usage-course-list">${rows.slice(0, 10).map((row, index) => {
      const width = Math.max(2, Math.round((row.score / max) * 100));
      const poster = row.poster
        ? `<img class="usage-course__poster" src="${escapeHtml(row.poster)}" alt="" loading="lazy">`
        : '<span class="usage-course__poster usage-course__poster--void"></span>';
      const meta = [row.catalog || '未标注目录', row.category, row.level].filter(Boolean).join(' · ');
      return `<div class="usage-course">
        <span class="usage-course__rank">${String(index + 1).padStart(2, '0')}</span>
        ${poster}
        <div class="usage-course__main">
          <div class="usage-course__title">${escapeHtml(row.label)}</div>
          <div class="usage-course__meta">${escapeHtml(meta)}</div>
          <div class="usage-course__stats">${row.views} 次访问 · 停留 ${escapeHtml(formatDuration(row.dwellMs))} · ${row.viewers} 人 · 热度 ${row.score}</div>
          <div class="usage-course__track"><div class="usage-course__fill" style="width: ${width}%"></div></div>
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  /* 单账号「具体使用情况」详情：展开后展示该账号在各板块 / 导师维度的使用明细，
     数据来自服务端按用户聚合的 pages / mentors / courseViews。 */
  function usageUserDetail(row) {
    const pages = (row.pages && row.pages.length)
      ? row.pages.map(page => `${page.label}：${page.views} 次 · 停留 ${formatDuration(page.dwellMs)}`).join('；')
      : '—';
    const mentors = (row.mentors && row.mentors.length)
      ? row.mentors.map(mentor => `${mentor.label}（${mentor.views} 次）`).join('、')
      : '—';
    return `<div class="usage-user-detail__grid">
      <div class="usage-user-detail__item">
        <span class="usage-user-detail__k">访问过的板块</span>
        <span class="usage-user-detail__v">${escapeHtml(pages)}</span>
      </div>
      <div class="usage-user-detail__item">
        <span class="usage-user-detail__k">访问过的导师</span>
        <span class="usage-user-detail__v">${escapeHtml(mentors)}</span>
      </div>
      <div class="usage-user-detail__item">
        <span class="usage-user-detail__k">课程海报访问</span>
        <span class="usage-user-detail__v">${row.courseViews || 0} 次</span>
      </div>
    </div>`;
  }

  function usageUserRows(rows) {
    if (!rows.length) return '<tr><td colspan="10" class="admin-empty">没有匹配的账号</td></tr>';
    return rows.map((row, index) => {
      const mentorsSeen = row.mentors.length
        ? row.mentors.slice(0, 4).map(item => `${item.label}×${item.views}`).join(' · ')
          + (row.mentors.length > 4 ? ` 等 ${row.mentors.length} 位` : '')
        : '—';
      const detailId = `usage-user-detail-${index}`;
      /* 摘要行 = 该账号的「卡片」；其下方紧跟一个详情行（含可折叠标签控件），默认仅显示标签、内容折叠。 */
      const summary = `<tr class="usage-user${row.active ? '' : ' usage-idle'}" data-uid="${escapeHtml(row.uid)}">
        <td class="admin-login" data-label="账号">${escapeHtml(row.username)}</td>
        <td data-label="部门">${escapeHtml(row.department || '—')}</td>
        <td data-label="地区">${escapeHtml(row.region || '—')}</td>
        <td data-label="姓名">${escapeHtml(row.name || '—')}</td>
        <td data-label="职位">${escapeHtml(row.position || '—')}</td>
        <td data-label="角色">${escapeHtml(row.roleLabel || '—')}</td>
        <td data-label="访问次数">${row.views || '—'}</td>
        <td data-label="总停留">${row.active ? escapeHtml(formatDuration(row.dwellMs)) : '—'}</td>
        <td data-label="最后活跃">${formatWhen(row.lastTs)}</td>
        <td class="admin-perms" data-label="访问过的导师">${escapeHtml(mentorsSeen)}</td>
      </tr>`;
      const detail = `<tr class="usage-user-detail-row" data-uid="${escapeHtml(row.uid)}">
        <td colspan="8">
          <button type="button" class="usage-user__toggle" aria-expanded="false" aria-controls="${detailId}">
            <span class="usage-user__arrow" aria-hidden="true">▸</span>具体使用情况
          </button>
          <div class="usage-user__detail" id="${detailId}" hidden>${usageUserDetail(row)}</div>
        </td>
      </tr>`;
      return summary + detail;
    }).join('');
  }

  /* 按 地区 / 姓名 / 职位 / 角色 组合实时筛选：各维度可单独或叠加使用，任一变化即刷新列表与计数。 */
  function usageFiltered() {
    const region = $('#usage-filter-region').value;
    const name = ($('#usage-filter-name').value || '').trim().toLowerCase();
    const position = $('#usage-filter-position').value;
    const role = $('#usage-filter-role').value;
    return usageUsers.filter(row =>
      (!region || row.region === region)
      && (!name || String(row.name || '').toLowerCase().includes(name))
      && (!position || row.position === position)
      && (!role || row.role === role)
    );
  }

  /* 按当前数据刷新筛选下拉选项（保留已选中的值）：地区 / 职位取数据与后台下拉选项的并集，
     角色取数据中实际出现的角色（id → 中文标签）。 */
  function syncUsageFilters() {
    const fill = (sel, pairs, allLabel) => {
      const cur = sel.value;
      sel.innerHTML = `<option value="">${allLabel}</option>`
        + pairs.map(([v, t]) => `<option value="${escapeHtml(v)}"${v === cur ? ' selected' : ''}>${escapeHtml(t)}</option>`).join('');
    };
    const regions = [...new Set([...OPTIONS.regions, ...usageUsers.map(r => r.region).filter(Boolean)])];
    const positions = [...new Set([...OPTIONS.positions, ...usageUsers.map(r => r.position).filter(Boolean)])];
    const roleMap = new Map();
    usageUsers.forEach(r => { if (r.role) roleMap.set(r.role, r.roleLabel || r.role); });
    fill($('#usage-filter-region'), regions.map(r => [r, r]), '全部地区');
    fill($('#usage-filter-position'), positions.map(p => [p, p]), '全部职位');
    fill($('#usage-filter-role'), [...roleMap.entries()], '全部角色');
  }

  function applyUsageFilter() {
    const matched = usageFiltered();
    const total = matched.length;
    const shown = (!usageExpanded && total > USAGE_PREVIEW) ? matched.slice(0, USAGE_PREVIEW) : matched;
    $('#usage-users').innerHTML = usageUserRows(shown);
    if (total > USAGE_PREVIEW) $('#usage-users').insertAdjacentHTML('beforeend', listMoreRow('usage', total, USAGE_PREVIEW));
    const filtering = Boolean(
      $('#usage-filter-region').value || ($('#usage-filter-name').value || '').trim()
      || $('#usage-filter-position').value || $('#usage-filter-role').value
    );
    $('#usage-filter-count').textContent = filtering
      ? `匹配 ${matched.length} / ${usageUsers.length} 个账号`
      : `共 ${usageUsers.length} 个账号`;
  }

  function renderUsage(data) {
    const totals = data.totals || {};
    const pages = data.pages || [];
    usageUsers = data.users || [];
    const accountsCount = $('#usage-accounts-count');
    if (accountsCount) accountsCount.textContent = `${usageUsers.length} 条`;

    $('#usage-summary').textContent = `${data.days ? `近 ${data.days} 天` : '全部时间'}：`
      + `${totals.activeUsers || 0}/${totals.accounts || 0} 个账号有使用记录 · `
      + `${totals.views || 0} 次板块访问 · 累计停留 ${formatDuration(totals.dwellMs)} · `
      + `${totals.courseViews || 0} 次课程海报访问`;

    $('#usage-pages').innerHTML = usageBars(pages, row => row.views, row => `${row.views} 次 · ${row.viewers} 人`);
    $('#usage-dwell').innerHTML = usageBars(
      pages.slice().sort((a, b) => b.avgMs - a.avgMs), row => row.avgMs, row => formatDuration(row.avgMs));
    $('#usage-courses').innerHTML = usageCourseRows(data.courses || []);

    syncUsageFilters();
    applyUsageFilter();

    const note = $('#usage-note');
    note.hidden = false;
    note.textContent = '数据来源：登录后浏览过程中的自动埋点（板块页面浏览 / 停留时长 / 导师信息访问 / 课程海报访问），'
      + '落盘于 server/data/usage.jsonl；'
      + `本次生成于 ${new Date(data.generatedAt || Date.now()).toLocaleString('zh-CN', { hour12: false })}。`
      + '未登录状态与静态托管预览不产生数据。';
  }

  async function loadUsage() {
    const result = await api('GET', `${USAGE_ENDPOINT}?days=${usageDays}`);
    if (!result.ok) {
      $('#usage-summary').textContent = result.status === 403
        ? '仅「管理员」角色可见'
        : (result.data.error || '使用数据加载失败');
      return;
    }
    renderUsage(result.data);
  }

  document.querySelectorAll('[data-usage-range]').forEach(button => {
    button.addEventListener('click', () => {
      usageDays = Number(button.getAttribute('data-usage-range')) || 0;
      document.querySelectorAll('[data-usage-range]').forEach(item => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      $('#usage-export').setAttribute('href', `api/usage/export?days=${usageDays}`);
      loadUsage();
    });
  });

  /* 账号明细筛选：四维组合，选择或输入即实时过滤；清除按钮重置全部条件。切换统计时间范围后筛选条件保留。 */
  ['#usage-filter-region', '#usage-filter-position', '#usage-filter-role']
    .forEach(selector => { $(selector).addEventListener('change', applyUsageFilter); });
  $('#usage-filter-name').addEventListener('input', applyUsageFilter);
  $('#usage-filter-clear').addEventListener('click', () => {
    $('#usage-filter-region').value = '';
    $('#usage-filter-name').value = '';
    $('#usage-filter-position').value = '';
    $('#usage-filter-role').value = '';
    applyUsageFilter();
  });

  /* 账号明细：每个账号「具体使用情况」可折叠 —— 默认折叠，点击展开 / 收起，
     箭头与 aria-expanded 同步指示当前状态；事件委托挂在容器上，重渲染后依然有效。 */
  $('#usage-users').addEventListener('click', event => {
    const toggle = event.target.closest('.usage-user__toggle');
    if (!toggle) return;
    /* 列表级「展开全部 / 收起」：切换后重渲染（控件文案与箭头随之更新） */
    if (toggle.classList.contains('list-showmore')) {
      usageExpanded = !usageExpanded;
      applyUsageFilter();
      return;
    }
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    const body = document.getElementById(toggle.getAttribute('aria-controls'));
    if (body) body.hidden = expanded;
  });

  /* ── 操作日志（仅超级管理员）────────────────────────────────────
     GET api/audit 返回按时间范围 / 操作类型 / 操作人 / 关键词筛选后的分页数据。
     每行呈现：更改时间、操作者、更改对象、操作类型、逐字段前后对比、结果状态；
     关键更改（删除账号、角色 / 权限调整、重置密码）额外加醒目徽章与侧边色条。 */
  const AUDIT_PAGE_SIZE = 10;
  const auditFilters = { days: 7, action: '', actor: '', q: '', result: '', page: 1 };
  let auditTimer = 0;

  const auditTime = ts => {
    const date = new Date(ts);
    const pad = value => String(value).padStart(2, '0');
    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    };
  };

  const fillSelect = (node, options, allLabel, current) => {
    const html = `<option value="">${allLabel}</option>`
      + options.map(option => `<option value="${escapeHtml(option.id)}"${option.id === current ? ' selected' : ''}>`
        + `${escapeHtml(option.label)}${option.critical ? ' · 关键' : ''}</option>`).join('');
    if (node.innerHTML !== html) node.innerHTML = html;
    node.value = current;
  };

  function auditRowHtml(item) {
    const when = auditTime(item.ts);
    const critical = item.severity === 'critical';
    const changes = (item.changes || []).length
      ? item.changes.map(change => `<div class="audit-diff">
          <span class="audit-diff__label">${escapeHtml(change.label || change.field)}</span>
          <span class="audit-diff__before">${escapeHtml(change.before || '—')}</span>
          <span class="audit-diff__arrow" aria-hidden="true">→</span>
          <span class="audit-diff__after">${escapeHtml(change.after || '—')}</span>
        </div>`).join('')
      : `<span class="audit-diff__none">${item.reason ? escapeHtml(item.reason) : '无字段变更'}</span>`;
    const status = item.result === 'failed'
      ? '<span class="audit-status audit-status--failed">失败</span>'
      : '<span class="audit-status audit-status--success">成功</span>';
    const badge = critical ? '<span class="audit-critical">关键变更</span>' : '';
    const reason = item.result === 'failed' && item.reason
      ? `<span class="audit-reason">${escapeHtml(item.reason)}</span>` : '';
    return `<tr class="audit-row${critical ? ' is-critical' : ''}${item.result === 'failed' ? ' is-failed' : ''}">
      <td class="audit-when" data-label="更改时间">
        <span class="audit-when__date">${when.date}</span>
        <span class="audit-when__time">${when.time}</span>
      </td>
      <td data-label="操作者">
        <span class="audit-actor">${escapeHtml(item.actorName || item.actorId || '—')}</span>
        <span class="audit-sub">${escapeHtml(item.actorId || '')}</span>
      </td>
      <td data-label="更改对象">
        <span class="audit-target">${escapeHtml(item.targetName || item.targetId || '—')}</span>
        <span class="audit-sub">${escapeHtml(item.targetId || '')}</span>
      </td>
      <td data-label="操作类型">
        <span class="audit-action">${escapeHtml(item.actionLabel || item.action)}</span>${badge}
      </td>
      <td class="audit-changes" data-label="更改前后">${changes}</td>
      <td data-label="结果">${status}${reason}</td>
    </tr>`;
  }

  function renderAudit(data) {
    const items = data.items || [];
    const total = data.total || 0;
    $('#audit-rows').innerHTML = items.map(auditRowHtml).join('');
    $('.audit-table-wrap').hidden = !items.length;
    $('#audit-empty').hidden = items.length > 0;
    $('#audit-summary').textContent = `${data.days ? `近 ${data.days} 天` : '全部时间'} · 共 ${total} 条更改记录`;
    $('#audit-count').textContent = total
      ? `第 ${data.page} / ${data.pages} 页 · 显示 ${items.length} / ${total} 条`
      : '暂无记录';

    const pager = $('#audit-pages');
    if (data.pages <= 1) {
      pager.innerHTML = '';
    } else {
      const start = Math.max(1, Math.min(data.page - 2, data.pages - 4));
      const end = Math.min(data.pages, start + 4);
      const numbers = [];
      for (let index = start; index <= end; index += 1) numbers.push(index);
      const pagerButton = (page, label, disabled, active) => `<button class="admin-tab${active ? ' is-active' : ''}"`
        + ` type="button" data-audit-page="${page}"${disabled ? ' disabled' : ''}`
        + `${active ? ' aria-current="page"' : ''}>${label}</button>`;
      pager.innerHTML = pagerButton(data.page - 1, '上一页', data.page <= 1, false)
        + numbers.map(index => pagerButton(index, String(index), false, index === data.page)).join('')
        + pagerButton(data.page + 1, '下一页', data.page >= data.pages, false);
    }

    const facets = data.facets || { actions: [], actors: [] };
    fillSelect($('#audit-action'), facets.actions || [], '全部操作', auditFilters.action);
    fillSelect($('#audit-actor'),
      (facets.actors || []).map(actor => ({ id: actor.id, label: actor.name || actor.id })),
      '全部操作人', auditFilters.actor);
    $('#audit-note').textContent = '数据来源：服务端审计日志 server/data/audit.jsonl；账号与权限写操作（含被拒绝的操作）均自动留痕，密码仅记录占位、不保存明文。';
  }

  async function loadAudit() {
    if (!state.isAdmin) return;
    const params = new URLSearchParams({
      days: String(auditFilters.days), action: auditFilters.action, actor: auditFilters.actor,
      q: auditFilters.q, result: auditFilters.result,
      page: String(auditFilters.page), pageSize: String(AUDIT_PAGE_SIZE)
    });
    const result = await api('GET', `api/audit?${params.toString()}`);
    if (!result.ok) {
      $('#audit-summary').textContent = result.status === 403
        ? '仅「超级管理员」角色可见' : (result.data.error || '操作日志加载失败');
      return;
    }
    renderAudit(result.data);
  }

  function resetAudit() {
    Object.assign(auditFilters, { days: 7, action: '', actor: '', q: '', result: '', page: 1 });
    $('#audit-action').value = '';
    $('#audit-actor').value = '';
    $('#audit-q').value = '';
    document.querySelectorAll('[data-audit-days]').forEach(button => {
      const active = Number(button.getAttribute('data-audit-days')) === 7;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    loadAudit();
  }

  document.querySelectorAll('[data-audit-days]').forEach(button => {
    button.addEventListener('click', () => {
      auditFilters.days = Number(button.getAttribute('data-audit-days')) || 0;
      auditFilters.page = 1;
      document.querySelectorAll('[data-audit-days]').forEach(item => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      loadAudit();
    });
  });
  $('#audit-action').addEventListener('change', () => {
    auditFilters.action = $('#audit-action').value;
    auditFilters.page = 1;
    loadAudit();
  });
  $('#audit-actor').addEventListener('change', () => {
    auditFilters.actor = $('#audit-actor').value;
    auditFilters.page = 1;
    loadAudit();
  });
  $('#audit-q').addEventListener('input', () => {
    clearTimeout(auditTimer);
    auditTimer = setTimeout(() => {
      auditFilters.q = $('#audit-q').value.trim();
      auditFilters.page = 1;
      loadAudit();
    }, 280);
  });
  $('#audit-reset').addEventListener('click', resetAudit);
  $('#audit-empty-reset').addEventListener('click', resetAudit);
  $('#audit-pages').addEventListener('click', event => {
    const button = event.target.closest('button[data-audit-page]');
    if (!button || button.disabled) return;
    auditFilters.page = Number(button.getAttribute('data-audit-page'));
    loadAudit();
  });

  load().then(() => window.SFKAdminShell && window.SFKAdminShell.fitGridClip());
})();
