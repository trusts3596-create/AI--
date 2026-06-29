/**
 * 智慧旅游规划助手 (TravelBot) — 前端交互逻辑
 * ============================================
 * 纯原生 JS，无任何外部依赖 — PC 专用版
 */

(function () {
  "use strict";

  // ======================================================================
  // DOM 引用
  // ======================================================================
  const messagesEl = document.getElementById("messages");
  const inputBox = document.getElementById("inputBox");
  const sendBtn = document.getElementById("sendBtn");
  const resetBtn = document.getElementById("resetBtn");
  const sidebar = document.getElementById("sidebar");
  const newChatBtn = document.getElementById("newChatBtn");
  
  // 移动端相关元素
  const menuBtn = document.getElementById("menuBtn");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  // ======================================================================
  // 状态
  // ======================================================================
  let sessionId = "";
  let isProcessing = false;

  // ======================================================================
  // 工具函数
  // ======================================================================

  function generateSessionId() {
    const stored = sessionStorage.getItem("travelbot_session_id");
    if (stored) return stored;
    const id = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("travelbot_session_id", id);
    return id;
  }

  function renderMarkdown(text) {
    if (!text) return '';
    
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 代码块
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, function(_, lang, code) {
      const langClass = lang ? ' class="language-' + lang + '"' : "";
      return '<pre><code' + langClass + '>' + code.trim() + '</code></pre>';
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 标题
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 粗体 & 斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 删除线
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // 分割线
    html = html.replace(/^---$/gm, '<hr>');

    // 引用
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // 无序列表
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

    // 段落处理
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs.map(function(p) {
      p = p.trim();
      if (!p) return "";
      if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(p)) return p;
      p = p.replace(/\n/g, "<br>");
      return '<p>' + p + '</p>';
    }).join("\n");

    return html;
  }

  function autoResizeTextarea() {
    if (!inputBox) return;
    inputBox.style.height = "auto";
    const maxHeight = 150;
    const scrollHeight = inputBox.scrollHeight;
    inputBox.style.height = Math.min(scrollHeight, maxHeight) + "px";
    inputBox.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
  }

  function scrollToBottom(smooth) {
    if (!messagesEl) return;
    messagesEl.scrollTo({
      top: messagesEl.scrollHeight,
      behavior: (smooth !== false) ? "smooth" : "instant"
    });
  }

  // ======================================================================
  // 消息渲染
  // ======================================================================

  function addMessage(role, content) {
    if (!messagesEl) return null;
    
    const div = document.createElement("div");
    div.className = "message " + role;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = role === "user" ? "你" : "🌍";

    const bubble = document.createElement("div");
    bubble.className = "bubble";

    if (role === "user") {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = renderMarkdown(content);
    }

    div.appendChild(avatar);
    div.appendChild(bubble);
    messagesEl.appendChild(div);

    const welcome = messagesEl.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    scrollToBottom();
    return div;
  }

  function showWelcome() {
    if (!messagesEl || messagesEl.querySelector(".welcome-message")) return;
    
    const div = document.createElement("div");
    div.className = "message ai welcome-message";

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🌍";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.innerHTML = renderMarkdown(
      "你好呀！👋 我是 **TravelBot**，你的专属旅行规划助手 🌍\n\n" +
      "我可以帮你定制旅行路线、推荐目的地、提供出行建议。\n\n" +
      "**告诉我你想去哪里，我来帮你规划！** ✈️🗺️\n\n" +
      "💡 你也可以试试侧边栏的示例问题～"
    );

    div.appendChild(avatar);
    div.appendChild(bubble);
    messagesEl.appendChild(div);
  }

  function showTyping() {
    if (!messagesEl) return null;
    
    const div = document.createElement("div");
    div.className = "typing-indicator";
    div.id = "typingIndicator";

    const dots = document.createElement("div");
    dots.className = "typing-dots";
    dots.innerHTML = "<span></span><span></span><span></span>";

    const text = document.createElement("span");
    text.className = "typing-text";
    text.textContent = "TravelBot 正在思考...";

    div.appendChild(dots);
    div.appendChild(text);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function hideTyping() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
  }

  function showMessage(role, content) {
    hideTyping();
    isProcessing = false;
    return addMessage(role, content);
  }

  // ======================================================================
  // 事件处理
  // ======================================================================

  function sendMessage() {
    if (!inputBox || isProcessing) return;
    
    const message = inputBox.value.trim();
    if (!message) return;

    showMessage("user", message);
    inputBox.value = "";
    autoResizeTextarea();
    isProcessing = true;
    showTyping();

    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: message, session_id: sessionId }),
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(data) {
      hideTyping();
      showMessage("ai", data.reply);
    })
    .catch(function(error) {
      console.error("请求失败:", error);
      hideTyping();
      showMessage("ai", "抱歉，服务暂时不可用。请稍后再试或检查网络连接。");
    })
    .finally(function() {
      isProcessing = false;
    });
  }

  function resetChat() {
    if (!messagesEl) return;
    messagesEl.innerHTML = "";
    sessionId = generateSessionId();
    showWelcome();
  }

  // ======================================================================
  // 初始化
  // ======================================================================

  document.addEventListener("DOMContentLoaded", function() {
    sessionId = generateSessionId();
    showWelcome();

    if (sendBtn) sendBtn.addEventListener("click", sendMessage);
    if (resetBtn) resetBtn.addEventListener("click", resetChat);
    if (newChatBtn) newChatBtn.addEventListener("click", resetChat);

    if (inputBox) {
      inputBox.addEventListener("input", autoResizeTextarea);
      inputBox.addEventListener("keydown", function(e) {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // 侧边栏快捷标签点击发送
    document.querySelectorAll('.sidebar-chip, .suggestion-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var prompt = el.getAttribute('data-prompt');
        if (prompt && inputBox) {
          inputBox.value = prompt;
          sendMessage();
        }
        // 移动端点击后关闭侧边栏
        closeSidebar();
      });
    });

    // 移动端侧边栏切换
    function openSidebar() {
      if (sidebar) sidebar.classList.add('active');
      if (sidebarOverlay) sidebarOverlay.classList.add('active');
    }

    function closeSidebar() {
      if (sidebar) sidebar.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (menuBtn) menuBtn.addEventListener('click', openSidebar);
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    var sidebarClose = document.getElementById('sidebarClose');
    if (sidebarClose) sidebarClose.addEventListener('click', closeSidebar);
  });

  // 导出
  if (typeof window !== 'undefined') {
    window.TravelBot = { 
      sendMessage: sendMessage, 
      resetChat: resetChat 
    };
  }
})();