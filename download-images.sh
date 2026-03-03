#!/bin/bash

set -e

IMAGES_DIR="./docker-images"
mkdir -p "$IMAGES_DIR"

echo "开始下载 Docker 镜像到 $IMAGES_DIR"

# 镜像列表
images=(
  "node:20-alpine"
  "postgres:15-alpine" 
  "redis:7-alpine"
)

for image in "${images[@]}"; do
  echo "正在拉取镜像: $image"
  
  if docker pull "$image"; then
    echo "保存镜像到文件: $image"
    filename="${image//[:\/]/_}.tar"
    docker save "$image" -o "$IMAGES_DIR/$filename"
    echo "✓ 已保存: $IMAGES_DIR/$filename"
  else
    echo "✗ 拉取失败: $image"
  fi
  
  echo "---"
done

echo ""
echo "所有镜像已保存到 $IMAGES_DIR"
ls -lh "$IMAGES_DIR"
