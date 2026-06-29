@echo off
REM 智慧旅游规划助手 (TravelBot) - Windows 打包脚本
REM =======================================

echo 🚀 开始打包 TravelBot 项目...

REM 检查 Python 环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到 Python，请先安装 Python 3.8+
    exit /b 1
)

REM 创建虚拟环境
echo 📦 创建虚拟环境...
python -m venv venv

REM 激活虚拟环境并安装依赖
echo 📦 安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt

REM 检查 .env 文件
if not exist ".env" (
    echo ⚠️  未找到 .env 文件，将使用 .env.example 作为模板
    if exist ".env.example" (
        copy .env.example .env
        echo ✅ 已创建 .env 文件，请记得配置 LLM_API_KEY 等环境变量
    ) else (
        echo ❌ 未找到 .env.example 文件
        exit /b 1
    )
)

REM 创建打包目录
echo 📦 创建打包目录...
if not exist "dist" mkdir dist

REM 复制项目文件
echo 📦 复制项目文件...
xcopy /E /I /Y app.py static templates .env venv dist\

REM 创建启动脚本
echo 📦 创建启动脚本...
echo @echo off > dist\start.bat
echo call venv\Scripts\activate.bat >> dist\start.bat
echo python app.py >> dist\start.bat

REM 创建 README 文件
echo 📦 创建 README 文件...
echo # 智慧旅游规划助手 (TravelBot) > dist\README.md
echo. >> dist\README.md
echo 一个基于 Flask 和 AI 的智能旅游规划助手，使用 Material Design 3 设计风格。 >> dist\README.md
echo. >> dist\README.md
echo ## 功能特性 >> dist\README.md
echo - 🌍 智能旅行规划 >> dist\README.md
echo - 📱 响应式设计 >> dist\README.md
echo - 🎨 Material Design 3 界面 >> dist\README.md
echo - 🤖 DeepSeek AI 集成 >> dist\README.md
echo - 💬 实时对话交互 >> dist\README.md
echo. >> dist\README.md
echo ## 快速开始 >> dist\README.md
echo. >> dist\README.md
echo ### Windows >> dist\README.md
echo. >> dist\README.md
echo ```batch >> dist\README.md
echo call dist\start.bat >> dist\README.md
echo ``` >> dist\README.md
echo. >> dist\README.md
echo ## 环境配置 >> dist\README.md
echo. >> dist\README.md
echo 在运行前，请确保 .env 文件中配置了以下变量： >> dist\README.md
echo. >> dist\README.md
echo ```env >> dist\README.md
echo LLM_API_KEY=你的 DeepSeek API Key >> dist\README.md
echo LLM_API_URL=https://api.deepseek.com/v1/chat/completions >> dist\README.md
echo LLM_MODEL=deepseek-chat >> dist\README.md
echo ``` >> dist\README.md
echo. >> dist\README.md
echo ## 技术栈 >> dist\README.md
echo. >> dist\README.md
echo - Python 3.8+ >> dist\README.md
echo - Flask 3.0.3 >> dist\README.md
echo - DeepSeek API >> dist\README.md
echo - Material Design 3 >> dist\README.md
echo - HTML/CSS/JavaScript >> dist\README.md
echo. >> dist\README.md
echo ## 许可证 >> dist\README.md
echo. >> dist\README.md
echo MIT License >> dist\README.md

echo ✅ 打包完成！
echo.
echo 📁 打包文件位于: dist\ 目录
echo 🚀 启动命令: call dist\start.bat