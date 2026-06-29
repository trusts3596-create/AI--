# 智慧旅游规划助手 (TravelBot) - Docker 部署文件
# =======================================

# 使用官方 Python 基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 复制 requirements 文件并安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . /app

# 暴露端口
EXPOSE 5000

# 设置环境变量
ENV FLASK_ENV=production
ENV PORT=5000

# 创建启动脚本
RUN echo '#!/bin/sh' > start.sh && \
    echo 'python app.py' >> start.sh && \
    chmod +x start.sh

# 启动应用
CMD ["./start.sh"]