#!/bin/bash

# 智慧旅游规划助手 (TravelBot) - 打包脚本
# =======================================

#!/bin/bash

# 智慧旅游规划助手 (TravelBot) - 打包脚本
# =======================================

echo 开始打包 TravelBot 项目...

# 检查 Python 环境
if ! command -v python3 &> /dev/null; then
    echo 未找到 Python3, 请先安装 Python 3.8+
    exit 1
fi

# 创建虚拟环境
echo 创建虚拟环境...
python3 -m venv venv

# 激活虚拟环境并安装依赖
echo 激活虚拟环境并安装依赖...
source venv/bin/activate

# 安装项目依赖
pip install -r requirements.txt

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo 未找到 .env 文件, 将使用 .env.example 作为模板
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo 已创建 .env 文件, 请记得配置 LLM_API_KEY 等环境变量
    else
        echo 未找到 .env.example 文件
        exit 1
    fi
fi

# 创建打包目录
echo 创建打包目录...
mkdir -p dist

# 复制项目文件
echo 复制项目文件...
cp -r app.py static templates .env venv dist/

# 创建启动脚本
echo 创建启动脚本...
cat > dist/start.sh << 'EOF'
#!/bin/bash

# TravelBot 启动脚本
echo 启动 TravelBot...

# 激活虚拟环境
source venv/bin/activate

# 启动 Flask 应用
python3 app.py

# 退出时停用虚拟环境
deactivate
EOF

# 设置权限
chmod +x dist/start.sh

# 创建 Windows 启动脚本
echo 创建 Windows 启动脚本...
cat > dist/start.bat << 'EOF'
@echo off
echo 启动 TravelBot...
call venv\Scripts\activate.bat
python app.py
EOF

# 创建 README 文件
echo 创建 README 文件...
cat > dist/README.md << 'EOF'
# 智慧旅游规划助手 (TravelBot)

一个基于 Flask 和 AI 的智能旅游规划助手, 使用 Material Design 3 设计风格。

## 功能特性

- 智能旅行规划
- 响应式设计
- Material Design 3 界面
- DeepSeek AI 集合
- 实时对话交互

## 快速开始

### Linux/Mac

```bash
./start.sh
```

### Windows

```batch
start.bat
```

## 环境配置

在运行前, 请确保 .env 文件中配置了以下变量：

```env
LLM_API_KEY=你的 DeepSeek API Key
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_MODEL=deepseek-chat
```

## 技术栈

- Python 3.8+
- Flask 3.0.3
- DeepSeek API
- Material Design 3
- HTML/CSS/JavaScript

## 许可证

MIT License
EOF'

echo 打包完成！
echo 
echo 打包文件位于: dist/ 目录
echo 启动命令:
echo   Linux/Mac: ./dist/start.sh
echo   Windows: ./dist/start.bat