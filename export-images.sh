#!/bin/bash

set -e

IMAGES_DIR="./docker-images"
mkdir -p "$IMAGES_DIR"

echo "开始构建并导出 Docker 镜像..."

# 1. 构建所有服务
echo "1/3 构建 Docker 镜像..."
docker compose build

# 2. 导出应用镜像
echo "2/3 导出应用镜像..."
echo "  - 导出 aigate-app..."
docker compose -p aigate build app
app_image_id="aigate-app:latest"
docker save "$app_image_id" -o "$IMAGES_DIR/aigate-app.tar"

# 3. 导出基础镜像
echo "3/3 导出基础镜像..."
base_images=(
  "node:20-alpine"
  "postgres:15-alpine"
  "redis:7-alpine"
)

for image in "${base_images[@]}"; do
  echo "  - 导出 $image..."
  filename="${image//[:\/]/_}.tar"
  docker save "$image" -o "$IMAGES_DIR/$filename"
done

echo ""
echo "✓ 所有镜像已导出到 $IMAGES_DIR"
ls -lh "$IMAGES_DIR"

echo ""
echo "使用说明："
echo "  # 加载镜像"
echo "  docker load -i docker-images/aigate-app.tar"
echo "  docker load -i docker-images/node_20-alpine.tar"
echo "  docker load -i docker-images/postgres_15-alpine.tar"
echo "  docker load -i docker-images/redis_7-alpine.tar"
echo ""
echo "  # 启动服务"
echo "  docker compose up -d"
