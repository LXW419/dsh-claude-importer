# dsh-claude-importer · Claude Code 会话导入器

> 一个 **DeepSeek Harness (DSH)** 的 Cordis 动态插件：在 DSH 网页界面中自动识别本机 Claude Code 工程与会话，将历史会话一键导入到左侧工作区，并可在原工作区上下文里继续对话。

## ✨ 功能清单

| 功能 | 说明 |
| --- | --- |
| 🚀 自动识别 | 打开面板自动探测本机 `~/.claude/projects` 目录（从 workspaceRoot 向上爬最多 8 层），并自动扫描全部工程与会话 |
| 📁 工程分组 | 按 Claude Code 会话的 `cwd` 识别工程，侧边栏按真实路径分组展示 |
| 🕐 会话排序 | 每个工程内会话按最后活动时间**降序**（最新在前），并显示 `YYYY-MM-DD HH:mm` 时间 |
| 💬 漫画气泡预览 | 点击会话记录，从该行旁引出**漫画式对话气泡**（带尖头指向），消息按「我 / Claude / 工具 / 摘要」角色分色、左右分列，每条消息带时间戳 |
| 📥 导入到工作区 | 选中会话后一键导入：按 `cwd` 创建/复用工作区，历史消息逐条写入真实 DSH 会话，自动打开，可直接继续对话 |
| 🌗 深色模式 | 自动跟随系统深浅色主题 |
| ⚡ 性能 | 会话解析结果缓存（LRU 60 条），反复查看秒开；合拢工程自动收起气泡 |

---

## 📦 安装步骤

### 前置要求

- 本机已安装并使用过 **Claude Code**（存在 `~/.claude/projects/<工程>/<会话>.jsonl`）
- 一个可用的 **DeepSeek Harness** Web 会话

### 方式 A：在 DSH 会话中动态加载（推荐）

1. 打开 DSH Web 界面，进入任意会话。
2. 让当前 Agent 执行动态 Cordis 插件定义（`cordis_define`），填入：

   - `plugin`：`{ "kind": "new", "idPrefix": "ccim" }`
   - `name`：`Claude Code 会话导入器`
   - `code.host`：粘贴 [`src/host.js`](src/host.js) 的内容
   - `code.client`：粘贴 [`src/client.js`](src/client.js) 的内容

3. 批准后插件即运行，会话头部会出现 **「Claude 会话」** 按钮。

> ⚠️ 动态插件定义前请先让 Agent 查询当前运行时的 Inspect 目录（`cordis_inspect_list` / `cordis_inspect_query`），确认 `fs`、`sandboxPolicy`、`workspaceRegistry`、`sessions` 等服务签名与本仓库代码一致（不同 DSH 版本可能有细微差异）。

### 方式 B：作为 Agent Preset / 静态插件固化

动态插件在进程重启后不保留。如需随 DSH 常驻，可将本插件迁移为静态 Cordis 插件行或 Agent Preset：把 `src/host.js` 与 `src/client.js` 的代码放入部署的插件行（host/client 两部分），并在 `cordis.yml` 中挂载。具体写法请参考你的 DSH 部署文档中「编辑 Cordis 组合」的相关章节。

---

## 🎯 使用说明

1. 打开一个 DSH 会话 → 点击会话头部（标题旁）的 **「Claude 会话」** 按钮。
2. 面板打开后**自动探测并扫描**本机 Claude Code 工程与全部会话（无需手动点击）。
3. 点击工程标题展开 → 会话按时间降序排列。
4. 点击某条会话记录 → 旁边弹出**漫画气泡**显示完整对话（再次点击该记录或合拢工程即可收起）。
5. 选中会话后点击底部绿色 **「导入到工作区」**：
   - 左侧侧边栏自动出现（或复用）对应 `cwd` 的工作区；
   - 历史消息以「我 / Claude」角色写入该工作区下的新会话；
   - 自动打开新会话，直接在上方输入框继续对话。

### 手动指定目录

若自动探测失败（Claude Code 目录不在常见位置），可在面板顶部输入框中手动填写 `projects` 目录路径（例如 `~/.claude/projects` 的绝对路径），点击 **「重新扫描」**。

---

## 🧩 技术说明

- **Host**：`fs`（读取 JSONL、流式读头部）、`sandboxPolicy.workspaceRoot`（目录爬升探测）、`workspaceRegistry`（工作区创建/复用）、`agents`（通过 `agents.create` 创建 agent+会话，模型选择可用）、`sessions`（flush 持久化）、`sessionTitle`（标题设置）。
- **Client**：`conversation.session.header.actions`（入口按钮）、`shell.overlay`（面板）、气泡浮层（实测高度 + 位置自适应 + CSS 尖头）。
- **Claude Code JSONL 格式**：每行一个 JSON，含 `type: user/assistant/summary`、`message.content`（字符串或 blocks）、`ai-title`、`cwd`、`timestamp` 等字段；解析时跳过 `tool_result`、`thinking` 等噪音块，保留用户/助手文本、工具调用摘要与上下文摘要。
- **会话 >24MB**：拒绝读取（防止卡死），超大会话暂不支持导入。

## 🔒 权限与隐私

- 插件只**读取** `~/.claude/projects` 下的会话文件；写入仅发生在「导入到工作区」时（创建 DSH 工作区/会话，属 DSH 内部持久化），**不会修改或回写 Claude Code 的任何文件**。
- 数据均在本地处理，不上传任何内容。

## ⚠️ 已知限制

- **会话标题**：导入后侧边栏暂时显示「新会话」，**发送一条消息后**标题才会正确显示（来自 Claude 会话的原始标题）。
- **会话持久性**：导入后若**不发言**直接切换会话，该会话可能从列表消失；**发送一条消息后**会话才会持久保留。这是 DSH 动态插件沙箱（调用 fiber 生命周期）的机制限制。
- **会话 >24MB**：拒绝读取（防止卡死），超大会话暂不支持导入。

## 📄 License

[MIT](LICENSE)
