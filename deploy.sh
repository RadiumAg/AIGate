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
#    config    交互式配置环境变量
#    clean     停止并清除所有数据（危险！）
# ============================================================

COMPOSE_FILE="docker-compose.yml"
PROJECT_NAME="aigate"
ENV_FILE=".env"

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

# 读取 .env 中的值
get_env_value() {
  local key=$1
  local default_value=${2:-""}
  
  if [ -f "$ENV_FILE" ]; then
    local value=$(grep "^${key}=" "$ENV_FILE" 2>/dev/null | cut -d'=' -f2- | sed 's/^["'\''"]//;s/["'\''"]$//')
    echo "${value:-$default_value}"
  else
    echo "$default_value"
  fi
}

# 设置 .env 中的值
set_env_value() {
  local key=$1
  local value=$2
  
  if [ -f "$ENV_FILE" ]; then
    # 如果 key 存在则替换，否则追加
    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      sed -i.bak "s|^${key}=.*|${key}=\"${value}\"|" "$ENV_FILE" && rm -f "${ENV_FILE}.bak"
    else
      echo "${key}=\"${value}\"" >> "$ENV_FILE"
    fi
  else
    echo "${key}=\"${value}\"" > "$ENV_FILE"
  fi
}

# 交互式配置
cmd_config() {
  log_info "========== AIGate 交互式配置 =========="
  echo ""
  
  # 读取当前值
  local current_admin_email=$(get_env_value "ADMIN_EMAIL" "admin@aigate.com")
  local current_admin_password=$(get_env_value "ADMIN_PASSWORD" "admin123")
  local current_db_url=$(get_env_value "DATABASE_URL" "postgresql://postgres:12345678@postgres:5432/aigate")
  local current_redis_url=$(get_env_value "REDIS_URL" "redis://redis:6379")
  
  echo "当前配置："
  echo "  ADMIN_EMAIL: $current_admin_email"
  echo "  ADMIN_PASSWORD: ********"
  echo "  DATABASE_URL: $current_db_url"
  echo "  REDIS_URL: $current_redis_url"
  echo ""
  
  # 管理员邮箱
  read -p "请输入管理员邮箱 [$current_admin_email]: " input_admin_email
  local admin_email=${input_admin_email:-$current_admin_email}
  
  # 管理员密码
  read -s -p "请输入管理员密码 [保持原密码请直接回车]: " input_admin_password
  echo ""
  local admin_password=${input_admin_password:-$current_admin_password}
  
  # 数据库连接
  echo ""
  log_info "数据库配置："
  read -p "请输入数据库 URL [$current_db_url]: " input_db_url
  local db_url=${input_db_url:-$current_db_url}
  
  # Redis 连接
  read -p "请输入 Redis URL [$current_redis_url]: " input_redis_url
  local redis_url=${input_redis_url:-$current_redis_url}
  
  # 确认
  echo ""
  log_info "配置预览："
  echo "  ADMIN_EMAIL: $admin_email"
  echo "  ADMIN_PASSWORD: ********"
  echo "  NEXT_PUBLIC_ADMIN_EMAIL: $admin_email"
  echo "  NEXT_PUBLIC_ADMIN_PASSWORD: ********"
  echo "  DATABASE_URL: $db_url"
  echo "  REDIS_URL: $redis_url"
  echo ""
  
  read -p "确认保存？(Y/n) " confirm
  if [[ ! "$confirm" =~ ^[Nn]$ ]]; then
    # 保存配置
    set_env_value "ADMIN_EMAIL" "$admin_email"
    set_env_value "ADMIN_PASSWORD" "$admin_password"
    set_env_value "NEXT_PUBLIC_ADMIN_EMAIL" "$admin_email"
    set_env_value "NEXT_PUBLIC_ADMIN_PASSWORD" "$admin_password"
    set_env_value "DATABASE_URL" "$db_url"
    set_env_value "REDIS_URL" "$redis_url"
    
    # 其他必要配置
    if ! grep -q "^NEXTAUTH_SECRET=" "$ENV_FILE" 2>/dev/null; then
      set_env_value "NEXTAUTH_SECRET" "$(openssl rand -base64 32 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)"
    fi
    if ! grep -q "^NEXTAUTH_URL=" "$ENV_FILE" 2>/dev/null; then
      set_env_value "NEXTAUTH_URL" "http://localhost:3000"
    fi
    if ! grep -q "^ADMIN_NAME=" "$ENV_FILE" 2>/dev/null; then
      set_env_value "ADMIN_NAME" "系统管理员"
    fi
    
    log_ok "配置已保存到 $ENV_FILE"
  else
    log_info "已取消"
  fi
}

# 检查 .env 文件
check_env() {
  if [ ! -f "$ENV_FILE" ]; then
    log_warn ".env 文件不存在"
    read -p "是否现在创建配置？(Y/n) " create_config
    if [[ ! "$create_config" =~ ^[Nn]$ ]]; then
      cmd_config
    else
      log_info "将使用默认配置"
    fi
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

# 帮助信息
show_help() {
  echo "AIGate 部署脚本"
  echo ""
  echo "用法: $0 {up|update|down|restart|logs|migrate|status|config|clean}"
  echo ""
  echo "命令:"
  echo "  up       首次部署 / 全量启动（默认）"
  echo "  update   更新应用（重新构建 + 迁移）"
  echo "  down     停止并移除所有容器"
  echo "  restart  重启应用容器"
  echo "  logs     查看应用日志"
  echo "  migrate  仅执行数据库迁移"
  echo "  status   查看服务状态"
  echo "  config   交互式配置环境变量"
  echo "  clean    停止并清除所有数据（危险！）"
  echo ""
  echo "示例:"
  echo "  $0              # 首次部署"
  echo "  $0 config       # 配置环境变量"
  echo "  $0 update       # 更新应用"
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
    config)   cmd_config ;;
    clean)    cmd_clean ;;
    help|-h|--help) show_help ;;
    *)
      show_help
      exit 1
      ;;
  esac
}

main "$@"
