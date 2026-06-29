# 智慧旅游规划助手 (TravelBot)

一个基于 Flask 和 AI 的智能旅游规划助手，使用 Material Design 3 设计风格。

## 🌟 功能特性

- 🌍 智能旅行规划 - 基于大语言模型的智能旅行建议
- 📱 移动端优化 - 完美适配手机、平板等移动设备
- 🎨 Material Design 3 界面 - 现代化、美观的用户界面
- 🤖 DeepSeek AI 集成 - 强大的 AI 旅行规划能力
- 💬 实时对话交互 - 流畅的对话体验
- 🎯 智能推荐 - 基于用户需求的个性化推荐
- 📱 响应式布局 - 自适应各种屏幕尺寸
- 🎮 触摸友好 - 优化的触摸交互体验

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd travelbot
```

### 2. 安装依赖

```bash
pip install -r requirements.txt
```

### 3. 配置环境变量

创建 `.env` 文件并添加以下内容：

```env
LLM_API_KEY=你的 DeepSeek API Key
LLM_API_URL=https://api.deepseek.com/v1/chat/completions
LLM_MODEL=deepseek-chat
```

### 4. 启动服务

```bash
python app.py
```

访问 http://127.0.0.1:5000 即可使用。

### 📱 移动端访问

在手机上使用时，请确保：
1. 手机和电脑连接到同一 WiFi 网络
2. 在手机浏览器中输入电脑的局域网 IP 地址
3. 例如：`http://192.168.43.8:5000`

详细的移动端使用指南请参考 [MOBILE.md](./MOBILE.md)

## 📦 打包部署

### Windows

```batch
package.bat
```

### Linux/Mac

```bash
chmod +x package.sh
./package.sh
```

### Docker 部署

```bash
docker build -t travelbot .
docker run -p 5000:5000 travelbot
```

## 🎨 UI 设计特点

- **Material Design 3** - 现代化的设计语言
- **侧边栏** - 纯白背景，胶囊按钮样式，Logo 加粗
- **聊天气泡** - AI 气泡带阴影效果，用户气泡使用品牌色
- **输入框** - 圆角设计，阴影效果，圆形发送按钮
- **顶部状态栏** - 放大的 Bot 名字，绿色呼吸灯效果
- **滚动条** - 自定义样式，变细、变淡
- **响应式** - 移动设备上侧边栏可折叠为汉堡菜单

## 🤖 AI 功能

- 智能旅行规划
- 目的地推荐
- 行程安排
- 预算管理
- 同行人适配
- 实时对话交互

## 🔧 技术栈

- **后端**: Python 3.9+, Flask 3.0.3
- **前端**: HTML5, CSS3, JavaScript (原生)
- **AI 集成**: DeepSeek API
- **设计**: Material Design 3
- **部署**: Flask-CORS, python-dotenv, requests

## 📝 开发说明

### 项目结构

```
travelbot/
├── app.py              # Flask 后端
├── requirements.txt    # 依赖列表
├── .env                # 环境配置
├── static/             # 静态资源
│   ├── css/
│   │   └── style.css   # MD3 样式
│   └── js/
│       └── main.js     # 前端逻辑
├── templates/
│   └── index.html      # 主页面
└── package.sh          # 打包脚本
```

### 开发命令

```bash
# 启动开发服务器
python app.py

# 运行测试
# （可添加测试脚本）

# 打包项目
./package.sh
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 联系

如有问题，请通过以下方式联系：
- 邮箱: your-email@example.com
- GitHub: your-username/travelbot