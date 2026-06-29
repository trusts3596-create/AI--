"""
智慧旅游规划助手 (TravelBot) — Flask 后端
=========================================
RESTful API + AI 旅行规划引擎
"""

import os
import json
import logging
from datetime import datetime
from functools import lru_cache

from flask import Flask, request, jsonify, render_template, make_response
from flask_cors import CORS
from dotenv import load_dotenv

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
load_dotenv()

app = Flask(__name__)
# 增强CORS配置，确保移动端访问正常
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": False
    }
})
app.config["JSON_AS_ASCII"] = False  # 确保 JSON 返回中文不乱码
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "travelbot-dev-secret")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# AI 系统提示词 —— 资深旅行规划师
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """你是「智慧旅游规划助手 (TravelBot)」，一位资深且热情的专业旅行规划师。

## 🎯 核心职责
- 你只负责为用户规划旅游行程、推荐目的地、提供旅行建议。
- 如果用户提出与旅游无关的问题，请礼貌地拒绝并引导回旅行话题。

## 🧠 信息收集策略（意图识别与槽位填充）
在为用户规划行程前，你需要逐步收集以下关键信息（称为"槽位"）：
1. **目的地** — 想去哪里？
2. **天数** — 计划玩几天？
3. **预算** — 大概预算是多少？
4. **同行人** — 一个人、情侣、家庭（是否有老人/小孩）、朋友？

**收集规则：**
- 每次对话**最多追问 1-2 个问题**，避免让用户感到信息过载。
- 先从最关键的槽位开始问（目的地 → 天数 → 预算 → 同行人）。
- 用户已提供的信息不要重复追问。
- 如果用户的信息模糊（如"出国玩"），请友好地引导细化。

## 📋 行程输出规范
当收集到足够信息后，输出完整的行程规划。格式要求：
1. **使用 Markdown 格式**，结构清晰。
2. **分点列出每日安排**：上午、下午、晚上。
3. **包含交通建议** 🚇 / 🚌 / 🚗。
4. **包含美食推荐** 🍜 / 🍕 / 🥘。
5. **适当使用 Emoji** 增加亲和力和可读性。
6. **如有需要，附上实用贴士**（天气、着装、当地习俗等）。

## 🚫 安全与边界
- **严禁推荐**未开发的危险野景点、非法旅游项目或任何违反当地法律法规的活动。
- **拒绝回答**任何与旅游无关的问题（如政治、医疗、金融投资等），礼貌地告知"我是旅行规划助手，只为您提供旅行相关服务哦 🌍"。
- 如果用户询问的内容涉及安全风险，请明确提示并劝阻。

## 💬 语气风格
- 热情、友好、有耐心，像一位经验丰富的旅行达人朋友。
- 用"你"而不是"您"来拉近距离。
- 适当使用语气词和表情符号让对话更自然。
"""

# ---------------------------------------------------------------------------
# 对话历史存储（生产环境建议改用 Redis）
# ---------------------------------------------------------------------------
conversations: dict[str, list[dict]] = {}


def _get_or_create_history(session_id: str) -> list[dict]:
    """获取或创建会话历史。"""
    if session_id not in conversations:
        conversations[session_id] = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]
    return conversations[session_id]


def _trim_history(history: list[dict], max_turns: int = 20) -> list[dict]:
    """裁剪历史记录，保留 system prompt 和最近的 N 轮对话。"""
    system_msg = [msg for msg in history if msg["role"] == "system"]
    other_msgs = [msg for msg in history if msg["role"] != "system"]
    return system_msg + other_msgs[-max_turns * 2:]  # user + assistant = 1 turn


# ---------------------------------------------------------------------------
# 大模型调用适配层 — 对接 DeepSeek API
# ---------------------------------------------------------------------------
def _call_llm_api(messages: list[dict]) -> str:
    """
    调用 DeepSeek API 获取 AI 回复。
    使用 OpenAI 兼容接口，通过环境变量配置。
    """
    import requests

    api_url = os.getenv("LLM_API_URL", "https://api.deepseek.com/v1/chat/completions")
    api_key = os.getenv("LLM_API_KEY", "")
    model = os.getenv("LLM_MODEL", "deepseek-chat")

    if not api_key or api_key == "your_api_key_here":
        logger.warning("未配置 LLM_API_KEY，使用模拟回复")
        return _mock_fallback(next((m["content"] for m in reversed(messages) if m["role"] == "user"), ""))

    try:
        response = requests.post(
            url=api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 2048,
                "stream": False,
            },
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        reply = data["choices"][0]["message"]["content"]
        logger.info(f"DeepSeek API 调用成功，tokens: {data.get('usage', {})}")
        return reply
    except requests.exceptions.Timeout:
        logger.error("DeepSeek API 请求超时")
        return "抱歉，请求超时了，请稍后重试 🙇"
    except requests.exceptions.HTTPError as e:
        logger.error(f"DeepSeek API HTTP 错误: {e.response.status_code} {e.response.text}")
        return f"抱歉，服务暂时不可用（错误码: {e.response.status_code}），请稍后重试 🙇"
    except Exception as e:
        logger.exception(f"DeepSeek API 调用异常: {e}")
        return "抱歉，我暂时遇到了一些问题，请稍后重试 🙇"


def _mock_fallback(user_message: str) -> str:
    """API 未配置时的降级回复。"""
    return (
        "你好呀！👋 我是 **TravelBot** 🌍\n\n"
        "当前后端还未配置大模型 API Key，请先在 `.env` 文件中设置 `LLM_API_KEY`。\n\n"
        "配置好后重启服务即可享受 AI 旅行规划能力！✈️🗺️"
    )


# ---------------------------------------------------------------------------
# 路由
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# 设备类型检测
# ---------------------------------------------------------------------------
def detect_device_type(user_agent: str) -> str:
    """检测用户设备类型。"""
    if not user_agent:
        return "unknown"
    
    user_agent_lower = user_agent.lower()
    
    # 检测平板设备（要在手机之前检测）
    tablet_patterns = ['ipad', 'android 3.0', 'tablet', 'kindle']
    if any(pattern in user_agent_lower for pattern in tablet_patterns):
        return "tablet"
    
    # 检测手机设备
    mobile_patterns = [
        'mobile', 'android', 'iphone', 'ipod', 'blackberry',
        'opera mini', 'windows phone', 'iemobile'
    ]
    if any(pattern in user_agent_lower for pattern in mobile_patterns):
        return "mobile"
    
    # 检测桌面设备
    desktop_patterns = ['windows', 'macintosh', 'linux', 'x11']
    if any(pattern in user_agent_lower for pattern in desktop_patterns):
        return "desktop"
    
    return "unknown"


# ---------------------------------------------------------------------------
# Flask 路由
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """渲染主页面，附带设备类型信息。"""
    user_agent = request.headers.get("User-Agent", "")
    device_type = detect_device_type(user_agent)
    
    response = make_response(render_template("index.html", device_type=device_type))
    # 添加移动端缓存控制和响应头
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    # 添加移动端适配头
    response.headers['X-UA-Compatible'] = 'IE=edge,chrome=1'
    response.headers['X-Frame-Options'] = 'DENY'
    return response


@app.route("/chat", methods=["POST"])
def chat():
    """
    对话接口 (RESTful)
    ---
    POST /chat
    Body: {
        "message": "用户消息",
        "session_id": "可选，会话标识"
    }
    Returns: {
        "reply": "AI 回复内容",
        "session_id": "会话标识"
    }
    """
    data = request.get_json(silent=True)
    if not data or "message" not in data:
        return jsonify({"error": "请提供 message 字段"}), 400

    user_message = data["message"].strip()
    if not user_message:
        return jsonify({"error": "消息不能为空"}), 400

    # 会话管理
    session_id = data.get("session_id") or request.remote_addr or "default"
    history = _get_or_create_history(session_id)

    # 记录用户消息
    history.append({"role": "user", "content": user_message})
    history = _trim_history(history)

    # 调用 AI
    try:
        reply = _call_llm_api(history)
    except Exception as e:
        logger.exception("LLM 调用失败")
        reply = "抱歉，我暂时遇到了一些问题，请稍后重试 🙇"

    # 记录 AI 回复
    history.append({"role": "assistant", "content": reply})

    return jsonify({"reply": reply, "session_id": session_id})


@app.route("/reset", methods=["POST"])
def reset_conversation():
    """重置会话历史。"""
    session_id = request.get_json(silent=True).get("session_id") if request.get_json(silent=True) else None
    session_id = session_id or request.remote_addr or "default"
    conversations.pop(session_id, None)
    return jsonify({"message": "会话已重置", "session_id": session_id})


@app.route("/health")
def health():
    """健康检查。"""
    return jsonify({"status": "ok", "timestamp": datetime.now().isoformat()})


@app.route("/debug")
def debug():
    """移动端网络诊断页面。"""
    return render_template("debug.html")


# ---------------------------------------------------------------------------
# 启动入口
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_ENV") == "development"
    host = os.getenv("HOST", "0.0.0.0")  # 默认允许外部访问
    
    # 获取本地 IP 地址用于外部访问
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        logger.info(f"🚀 TravelBot 服务启动于 http://{local_ip}:{port}")
        logger.info(f"🚀 可通过 http://{socket.gethostname()}.local:{port} 访问 (如果支持 Bonjour)")
    except:
        logger.info(f"🚀 TravelBot 服务启动于 http://0.0.0.0:{port}")
    
    app.run(host=host, port=port, debug=debug)
