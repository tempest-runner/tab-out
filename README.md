# My Tab Out

这是基于 [zarazhangrui/tab-out](https://github.com/zarazhangrui/tab-out) 的个人 fork。它保留了 Tab Out 的标签页分组、跨窗口切换、重复标签检测和稍后阅读能力，并将新标签页重构为：

- 左侧约 38%：当前打开的标签页，可搜索、切换、关闭或稍后阅读。
- 右侧：网页搜索，以及门户及 AI 工具、学校、科研和其他四组常用入口。
- 新标签页加载或重新激活时自动聚焦页面搜索框，可直接键入并使用 Chrome 默认搜索引擎搜索。
- 重复新建标签页时，自动返回最近使用的“我的新标签页”，不保留重复页。
- 预置入口使用本地品牌图标；自定义入口保存在 `chrome.storage.local`。
- 不加载远程字体，也不通过在线 favicon 服务请求图标。

## 安装个人版本

1. 在 Chrome 打开 `chrome://extensions/`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择本仓库中的 `extension/` 文件夹。

更新代码后，在 `chrome://extensions/` 中点击 **My Tab Out** 卡片上的“重新加载”，然后新建标签页。

## 开发与版本管理

详细约定见 [`docs/VERSIONING.md`](docs/VERSIONING.md)。日常开发从 `main` 新建 `feat/*` 分支；验证后合并回 `main`，并为可安装版本创建语义化版本标签。

---

# Upstream: Tab Out

**Keep tabs on your tabs.**

Tab Out is a Chrome extension that replaces your new tab page with a dashboard of everything you have open. Tabs are grouped by domain, with homepages (Gmail, X, LinkedIn, etc.) pulled into their own group. Close tabs with a satisfying swoosh + confetti.

No server. No account. No external API calls. Just a Chrome extension.

---

## Install with a coding agent

Send your coding agent (Claude Code, Codex, etc.) this repo and say **"install this"**:

```
https://github.com/zarazhangrui/tab-out
```

The agent will walk you through it. Takes about 1 minute.

---

## Features

- **See all your tabs at a glance** on a clean grid, grouped by domain
- **Homepages group** pulls Gmail inbox, X home, YouTube, LinkedIn, GitHub homepages into one card
- **Close tabs with style** with swoosh sound + confetti burst
- **Duplicate detection** flags when you have the same page open twice, with one-click cleanup
- **Click any tab to jump to it** across windows, no new tab opened
- **Save for later** bookmark tabs to a checklist before closing them
- **Localhost grouping** shows port numbers next to each tab so you can tell your vibe coding projects apart
- **Expandable groups** show the first 8 tabs with a clickable "+N more"
- **100% local** your data never leaves your machine
- **Pure Chrome extension** no server, no Node.js, no npm, no setup beyond loading the extension

---

## Manual Setup

**1. Clone the repo**

```bash
git clone https://github.com/zarazhangrui/tab-out.git
```

**2. Load the Chrome extension**

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Navigate to the `extension/` folder inside the cloned repo and select it

**3. Open a new tab**

You'll see Tab Out.

---

## How it works

```
You open a new tab
  -> Tab Out shows your open tabs grouped by domain
  -> Homepages (Gmail, X, etc.) get their own group at the top
  -> Click any tab title to jump to it
  -> Close groups you're done with (swoosh + confetti)
  -> Save tabs for later before closing them
```

Everything runs inside the Chrome extension. No external server, no API calls, no data sent anywhere. Saved tabs are stored in `chrome.storage.local`.

---

## Tech stack

| What | How |
|------|-----|
| Extension | Chrome Manifest V3 |
| Storage | chrome.storage.local |
| Sound | Web Audio API (synthesized, no files) |
| Animations | CSS transitions + JS confetti particles |

---

## License

MIT

---

Built by [Zara](https://x.com/zarazhangrui)
