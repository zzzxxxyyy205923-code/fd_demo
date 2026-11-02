#!/bin/bash
# ═══════════════════════════════════════════════════════════
# SFK 时尚科系 · 本地预览启动器
# 用法：在 Finder 中双击本文件，或终端执行 ./tools/preview.command [端口]
# 作用：在项目根目录启动静态服务，并用默认浏览器打开预览地址
# ═══════════════════════════════════════════════════════════

cd "$(dirname "$0")/.." || exit 1

PORT="${1:-8931}"
URL="http://localhost:${PORT}/index.html"

if lsof -ti "tcp:${PORT}" >/dev/null 2>&1; then
  echo "端口 ${PORT} 已被占用，直接使用现有服务：${URL}"
else
  echo "启动静态服务：${PWD}（端口 ${PORT}）"
  python3 -m http.server "${PORT}" >/dev/null 2>&1 &
  SERVER_PID=$!
  trap 'kill ${SERVER_PID} 2>/dev/null' EXIT
  sleep 1
fi

echo "预览地址：${URL}"
echo "关闭本终端窗口即可停止服务。"
open "${URL}"

# 保持进程存活，服务随窗口关闭而停止
wait ${SERVER_PID:-0} 2>/dev/null || sleep infinity
