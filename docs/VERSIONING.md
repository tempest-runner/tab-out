# Git 与版本管理

## 远端

- `origin`：`https://github.com/tempest-runner/tab-out.git`，个人 fork，允许推送。
- `upstream`：`https://github.com/zarazhangrui/tab-out.git`，原作者仓库，仅拉取；本地已禁用 push URL。

## 分支

- `main`：随时可在 Chrome 中加载的稳定版本。
- `feat/<name>`：新功能。
- `fix/<name>`：缺陷修复。
- `chore/<name>`：文档、依赖或维护工作。

不要直接在 `main` 上开发。典型流程：

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/example

# 修改并验证
git add <明确的文件路径>
git commit -m "feat: describe the change"
git push -u origin feat/example

git switch main
git merge --no-ff feat/example
git push origin main
```

## 版本号

扩展使用语义化版本：

- `PATCH`：兼容的缺陷修复，例如 `1.1.0 → 1.1.1`。
- `MINOR`：兼容的新功能，例如 `1.1.0 → 1.2.0`。
- `MAJOR`：不兼容的数据结构或交互变化，例如 `1.x → 2.0.0`。

发布时同步修改 `extension/manifest.json` 与 `CHANGELOG.md`，然后在 `main` 创建标签：

```bash
git tag -a v1.2.0 -m "My Tab Out v1.2.0"
git push origin v1.2.0
```

## 同步原作者更新

个人版与 upstream 的界面已经分叉，因此不要直接把 upstream 合并进稳定分支。使用独立分支审查冲突：

```bash
git fetch upstream
git switch main
git switch -c chore/sync-upstream-YYYYMMDD
git merge upstream/main

# 解决冲突并重新测试扩展后，再合并回 main
```

同步时优先保留 upstream 的标签页逻辑、权限修复和浏览器兼容性更新；个人布局、快捷入口与本地图标由本 fork 维护。

## 每次提交前的最低检查

```bash
node --test tests/background.test.js
node --check extension/app.js
node --check extension/background.js
jq empty extension/manifest.json
git diff --check
```

最后在 Chrome 的 `chrome://extensions/` 重新加载扩展，并人工检查：标签页切换、关闭、稍后阅读、快捷入口和编辑入口。
