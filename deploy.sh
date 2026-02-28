#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  AIGate 一键部署脚本
#  用法：./deploy.sh [命令]
#
#  命令：
#    up        首次部署 / 全量启动（默认）
#    update    更新应用（重新构建 + 迁移）
#    down      停止并移除所有容器
#    restart   重启应用容器
#    logs      查看应用日志
#    migrate   仅执行数据库迁移
#    status    查看服务状态
#    clean     停止并清除所有数据（危险！）
# ============================================================

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="aigate"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 检查依赖
check_dependencies() {
  if ! command -v docker &> /dev/null; then
    log_error "未安装 Docker，请先安装：https://docs.docker.com/get-docker/"
    exit 1
  fi

  if ! docker compose version &> /dev/null; then
    log_error "未安装 Docker Compose V2，请升级 Docker"
    exit 1
  fi

  log_ok "Docker 和 Docker Compose 已就绪"
}

# 检查 .env 文件
check_env() {
  if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在，将使用默认配置"
    log_info "你可以复制 .env.example 并修改："
    log_info "  cp .env.example .env"
  fi
}

# 首次部署 / 全量启动
cmd_up() {
  log_info "========== AIGate 一键部署 =========="
  check_dependencies
  check_env

  log_info "1/4 拉取基础镜像..."
  docker compose -p "$PROJECT_NAME" pull postgres redis 2>/dev/null || true

  log_info "2/4 构建应用镜像..."
  docker compose -p "$PROJECT_NAME" build

  log_info "3/4 启动基础设施（PostgreSQL + Redis）..."
  docker compose -p "$PROJECT_NAME" up -d postgres redis

  log_info "     等待数据库就绪..."
  docker compose -p "$PROJECT_NAME" up -d --wait postgres redis

  log_info "4/4 执行数据库迁移并启动应用..."
  docker compose -p "$PROJECT_NAME" up -d

  echo ""
  log_ok "========== 部署完成 =========="
  log_ok "应用地址：http://localhost:${APP_PORT:-3000}"
  log_info "查看日志：./deploy.sh logs"
  log_info "查看状态：./deploy.sh status"
}

# 更新应用
cmd_update() {
  log_info "========== 更新 AIGate =========="
  check_dependencies

  log_info "1/3 重新构建镜像..."
  docker compose -p "$PROJECT_NAME" build app migrate

  log_info "2/3 执行数据库迁移..."
  docker compose -p "$PROJECT_NAME" run --rm migrate

  log_info "3/3 重启应用..."
  docker compose -p "$PROJECT_NAME" up -d app

  echo ""
  log_ok "========== 更新完成 =========="
}

# 停止服务
cmd_down() {
  log_info "停止所有服务..."
  docker compose -p "$PROJECT_NAME" down
  log_ok "所有服务已停止"
}

# 重启应用
cmd_restart() {
  log_info "重启应用容器..."
  docker compose -p "$PROJECT_NAME" restart app
  log_ok "应用已重启"
}

# 查看日志
cmd_logs() {
  docker compose -p "$PROJECT_NAME" logs -f app
}

# 仅迁移
cmd_migrate() {
  log_info "执行数据库迁移..."
  docker compose -p "$PROJECT_NAME" run --rm migrate
  log_ok "迁移完成"
}

# 查看状态
cmd_status() {
  docker compose -p "$PROJECT_NAME" ps
}

# 清除所有数据
cmd_clean() {
  log_warn "⚠️  此操作将删除所有容器和数据卷（包括数据库数据）！"
  read -p "确认继续？(y/N) " confirm
  if [[ "$confirm" =~ ^[Yy]$ ]]; then
    docker compose -p "$PROJECT_NAME" down -v
    log_ok "所有容器和数据已清除"
  else
    log_info "已取消"
  fi
}

# 主入口
main() {
  cd "$(dirname "$0")"

  case "${1:-up}" in
    up)       cmd_up ;;
    update)   cmd_update ;;
    down)     cmd_down ;;
    restart)  cmd_restart ;;
    logs)     cmd_logs ;;
    migrate)  cmd_migrate ;;
    status)   cmd_status ;;
    clean)    cmd_clean ;;
    *)
      echo "用法: $0 {up|update|down|restart|logs|migrate|status|clean}"
      exit 1
      ;;
  esac
}

main "$@"
