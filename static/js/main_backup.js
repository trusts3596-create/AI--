/**
 * 智慧旅游规划助手 (TravelBot) — 前端交互逻辑
 * ============================================
 * 纯原生 JS，无任何外部依赖。
 */

(function () {
  "use strict";

  // ======================================================================
  // 设备检测和初始化
  // ======================================================================
  const deviceType = window.deviceType || 'desktop';
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  
  // ======================================================================
  // DOM 引用
  // ======================================================================
  const messagesEl = document.getElementById("messages");
  const inputBox = document.getElementById("inputBox");
  const sendBtn = document.getElementById("sendBtn");
  const resetBtn = document.getElementById("resetBtn");
  const menuBtn = document.getElementById("menuBtn");
  const sidebarClose = document.getElementById("sidebarClose");
  const sidebar = document.getElementById("sidebar");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const newChatBtn = document.getElementById("newChatBtn");

  // ======================================================================
  // 状态
  // ======================================================================
  let sessionId = generateSessionId();
  let isProcessing = false;
  
  // ======================================================================
  // 设备类型相关初始化
  // ======================================================================
  function initializeDeviceSpecificFeatures() {
    // 根据设备类型应用不同的样式和行为
    if (isMobile) {
      // 移动端优化
      document.body.classList.add('mobile-device');
      
      // 禁用双击缩放
      let lastTouchEnd = 0;
      document.addEventListener('touchend', function (event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, false);
      
      // 优化移动端滚动
      messagesEl.style.webkitOverflowScrolling = 'touch';
    } else if (isTablet) {
      // 平板优化
      document.body.classList.add('tablet-device');
    } else {
      // 桌面端优化
      document.body.classList.add('desktop-device');
    }
  }

  // ======================================================================
  // 工具函数
  // ======================================================================

  /** 生成简单会话 ID */
  function generateSessionId() {
    const stored = sessionStorage.getItem("travelbot_session_id");
    if (stored) return stored;
    const id = "session_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("travelbot_session_id", id);
    return id;
  }

  /** 打开侧边栏 */
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /** 关闭侧边栏 */
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  /** 切换侧边栏状态 */
  function toggleSidebar() {
    if (sidebar.classList.contains('open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  }

  /** 移动端检测 */
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /** 处理移动端键盘弹出 */
  function handleMobileKeyboard() {
    if (isMobile()) {
      const chatContainer = document.querySelector('.chat-container');
      inputBox.addEventListener('focus', () => {
        chatContainer.classList.add('keyboard-open');
      });
      inputBox.addEventListener('blur', () => {
        setTimeout(() => {
          chatContainer.classList.remove('keyboard-open');
        }, 200);
      });
    }
  }

  /** 处理移动端触摸事件 */
  function handleMobileTouchEvents() {
    if (isMobile()) {
      // 增长触摸反馈
      const touchableElements = document.querySelectorAll('.sidebar-chip, .send-btn, .menu-btn, .reset-btn');
      touchableElements.forEach(el => {
        el.addEventListener('touchstart', () => {
          el.style.opacity = '0.7';
          el.style.transform = 'scale(0.95)';
        });
        el.addEventListener('touchend', () => {
          el.style.opacity = '';
          el.style.transform = '';
        });
      });
    }
  }

  /** 处理移动端导航 */
  function handleMobileNavigation() {
    if (isMobile()) {
      // 移动端导航栏点击事件
      const navChat = document.getElementById('navChat');
      const navHistory = document.getElementById('navHistory');
      const navSettings = document.getElementById('navSettings');
      
      navChat.addEventListener('click', () => {
        // 设置聊天为活动状态
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navChat.classList.add('active');
        
        // 关闭侧边栏（如果打开）
        closeSidebar();
      });

      // 历史记录功能（示例）
      navHistory.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navHistory.classList.add('active');
        // 这里可以添加历史记录功能
        showMessage('TravelBot', '历史记录功能开发中...', 'ai');
      });

      // 设置功能（示例）
      navSettings.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navSettings.classList.add('active');
        // 这里可以添加设置功能
        showMessage('TravelBot', '设置功能开发中...', 'ai');
      });
    }
  }

  /** 将 Markdown 文本转为安全的 HTML */
  function renderMarkdown(text) {
    // 转义 HTML
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 代码块 (```)
    html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
      const langClass = lang ? ` class="language-${lang}"` : "";
      return `<pre><code${langClass}>${code.trim()}</code></pre>`;
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

    // 标题
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

    // 粗体 & 斜体
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // 删除线
    html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");

    // 分割线
    html = html.replace(/^---$/gm, "<hr>");

    // 引用
    html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

    // 无序列表
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");

    // 换行 → <br>（段落内）
    // 先把连续两个换行当作段落分隔
    const paragraphs = html.split(/\n\n+/);
    html = paragraphs
      .map((p) => {
        p = p.trim();
        if (!p) return "";
        // 已经是块级元素的不再包裹
        if (/^<(h[1-6]|ul|ol|pre|blockquote|hr)/.test(p)) return p;
        // 单个换行 → <br>
        p = p.replace(/\n/g, "<br>");
        return `<p>${p}</p>`;
      })
      .join("\n");

    return html;
  }

  /** 自动调整输入框高度 */
  function autoResizeTextarea() {
    inputBox.style.height = "auto";
    const maxHeight = 150;
    const scrollHeight = inputBox.scrollHeight;
    inputBox.style.height = Math.min(scrollHeight, maxHeight) + "px";
    if (scrollHeight > maxHeight) {
      inputBox.style.overflowY = "auto";
    } else {
      inputBox.style.overflowY = "hidden";
    }
  }

  /** 滚动到底部 */
  function scrollToBottom(smooth = true) {
    messagesEl.scrollTo({
      top: messagesEl.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    });
  }

  // ======================================================================
  // 消息渲染
  // ======================================================================

  /** 添加消息气泡 */
  function addMessage(role, content) {
    const div = document.createElement("div");
    div.className = `message ${role}`;

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

    // 移除欢迎消息（如果有）
    const welcome = messagesEl.querySelector(".welcome-message");
    if (welcome) welcome.remove();

    scrollToBottom();
    return div;
  }

  /** 显示欢迎消息 */
  function showWelcome() {
    // 避免重复
    if (messagesEl.querySelector(".welcome-message")) return;

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
        "💡 你也可以点击左上角的菜单，看看示例问题～"
    );

    div.appendChild(avatar);
    div.appendChild(bubble);
    messagesEl.appendChild(div);
  }

  /** 显示打字指示器 */
  function showTyping() {
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
  }

  /** 移除打字指示器 */
  function hideTyping() {
    const el = document.getElementById("typingIndicator");
    if (el) el.remove();
  }

  // ======================================================================
  // API 通信
  // ======================================================================

  /** 发送消息到后端 */
  async function sendMessage(message) {
    if (isProcessing) return;
    isProcessing = true;

    // 禁用输入
    inputBox.disabled = true;
    sendBtn.disabled = true;

    // 显示用户消息
    addMessage("user", message);

    // 显示打字指示器
    showTyping();

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // 更新 sessionId（服务端可能返回新的）
      if (data.session_id) {
        sessionId = data.session_id;
        sessionStorage.setItem("travelbot_session_id", sessionId);
      }

      // 移除打字指示器，显示 AI 回复
      hideTyping();
      addMessage("ai", data.reply);
    } catch (err) {
      console.error("发送消息失败:", err);
      hideTyping();
      addMessage("ai", "抱歉，我暂时遇到了一些问题，请稍后重试 🙇");
    } finally {
      isProcessing = false;
      inputBox.disabled = false;
      sendBtn.disabled = false;
      inputBox.focus();
    }
  }

  /** 重置对话 */
  async function resetConversation() {
    try {
      await fetch("/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch (err) {
      console.error("重置失败:", err);
    }

    // 清空消息列表
    messagesEl.innerHTML = "";
    sessionId = generateSessionId();
    showWelcome();
    inputBox.value = "";
    autoResizeTextarea();
    inputBox.focus();
  }

  // ======================================================================
  // 事件绑定
  // ======================================================================

  /** 处理发送 */
  function handleSend() {
    const message = inputBox.value.trim();
    if (!message || isProcessing) return;
    inputBox.value = "";
    autoResizeTextarea();
    sendMessage(message);
  }

  // 发送按钮点击
  sendBtn.addEventListener("click", handleSend);

  // Enter 发送，Shift+Enter 换行
  inputBox.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  // 自动调整输入框
  inputBox.addEventListener("input", autoResizeTextarea);

  // 重置
  resetBtn.addEventListener("click", resetConversation);

  // 新对话
  newChatBtn.addEventListener("click", () => {
    resetConversation();
    closeSidebar();
  });

  // 侧边栏切换
  menuBtn.addEventListener("click", openSidebar);
  sidebarClose.addEventListener("click", closeSidebar);
  sidebarOverlay.addEventListener("click", closeSidebar);

  function openSidebar() {
    sidebar.classList.add("open");
    sidebarOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar() {
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  // 侧边栏胶囊按钮点击
  document.querySelectorAll(".sidebar-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      // 移除其他按钮的 active 状态
      document.querySelectorAll(".sidebar-chip").forEach(c => c.classList.remove("active"));
      // 添加当前按钮的 active 状态
      chip.classList.add("active");
      
      const prompt = chip.dataset.prompt;
      if (prompt) {
        closeSidebar();
        inputBox.value = prompt;
        autoResizeTextarea();
        handleSend();
      }
    });
  });

  // 侧边栏推荐问题点击
  document.querySelectorAll(".suggestion-item").forEach((item) => {
    item.addEventListener("click", () => {
      const prompt = item.dataset.prompt;
      if (prompt) {
        closeSidebar();
        inputBox.value = prompt;
        autoResizeTextarea();
        handleSend();
      }
    });
  });

  // ======================================================================
  // 移动端支持
  // ======================================================================

  /** 移动端检测 */
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /** 处理移动端键盘弹出 */
  function handleMobileKeyboard() {
    if (isMobile()) {
      const chatContainer = document.querySelector('.chat-container');
      inputBox.addEventListener('focus', () => {
        chatContainer.classList.add('keyboard-open');
      });
      inputBox.addEventListener('blur', () => {
        setTimeout(() => {
          chatContainer.classList.remove('keyboard-open');
        }, 200);
      });
    }
  }

  /** 处理移动端触摸事件 */
  function handleMobileTouchEvents() {
    if (isMobile()) {
      // 增长触摸反馈
      const touchableElements = document.querySelectorAll('.sidebar-chip, .send-btn, .menu-btn, .reset-btn');
      touchableElements.forEach(el => {
        el.addEventListener('touchstart', () => {
          el.style.opacity = '0.7';
          el.style.transform = 'scale(0.95)';
        });
        el.addEventListener('touchend', () => {
          el.style.opacity = '';
          el.style.transform = '';
        });
      });
    }
  }

  /** 处理移动端导航 */
  function handleMobileNavigation() {
    if (isMobile()) {
      // 移动端导航栏点击事件
      const navChat = document.getElementById('navChat');
      const navHistory = document.getElementById('navHistory');
      const navSettings = document.getElementById('navSettings');
      
      navChat.addEventListener('click', () => {
        // 设置聊天为活动状态
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navChat.classList.add('active');
        
        // 关闭侧边栏（如果打开）
        closeSidebar();
      });

      // 历史记录功能（示例）
      navHistory.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navHistory.classList.add('active');
        // 这里可以添加历史记录功能
        showMessage('TravelBot', '历史记录功能开发中...', 'ai');
      });

      // 设置功能（示例）
      navSettings.addEventListener('click', () => {
        document.querySelectorAll('.mobile-nav-item').forEach(item => {
          item.classList.remove('active');
        });
        navSettings.classList.add('active');
        // 这里可以添加设置功能
        showMessage('TravelBot', '设置功能开发中...', 'ai');
      });
    }
  }

  /** 显示消息（用于导航栏消息显示） */
  function showMessage(sender, content, type = 'ai') {
    const div = document.createElement("div");
    div.className = `message ${type}`;

    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = type === "user" ? "你" : "🌍";

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = content;

    div.appendChild(avatar);
    div.appendChild(bubble);
    messagesEl.appendChild(div);

    scrollToBottom();
    return div;
  }

  // 移动端优化
  handleMobileKeyboard();
  handleMobileTouchEvents();
  handleMobileNavigation();

  // 检测是否为移动设备，如果为移动设备则自动打开菜单按钮
  if (isMobile()) {
    menuBtn.style.display = 'flex';
  } else {
    menuBtn.style.display = 'none';
  }

  // ======================================================================
  // 初始化
  // ======================================================================

  showWelcome();
  inputBox.focus();

  // 自动调整高度初始状态
  autoResizeTextarea();

  console.log("🌍 TravelBot 前端已加载");
})();
