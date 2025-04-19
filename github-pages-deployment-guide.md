# GitHub Pages 部署指南

本文档提供了如何将个人主页网站部署到 GitHub Pages 的详细步骤。按照以下指南操作，可以确保您的网站在 GitHub Pages 上正确显示，避免样式失效等问题。

## 目录

1. [创建 GitHub 仓库](#1-创建-github-仓库)
2. [上传网站文件](#2-上传网站文件)
3. [配置 GitHub Pages](#3-配置-github-pages)
4. [测试网站](#4-测试网站)
5. [常见问题排查](#5-常见问题排查)
6. [自定义域名设置（可选）](#6-自定义域名设置可选)

## 1. 创建 GitHub 仓库

1. 登录您的 GitHub 账户。如果没有账户，请先在 [GitHub](https://github.com) 注册。
2. 点击右上角的 "+" 图标，选择 "New repository"。
3. 仓库名称设置为 `username.github.io`，其中 `username` 是您的 GitHub 用户名。
   - 例如，如果您的用户名是 "johndoe"，则仓库名称应为 `johndoe.github.io`
   - **注意**：必须严格按照这个格式命名，才能使用 GitHub Pages 的用户站点功能
4. 仓库设置为 "Public"（公开）。
5. 点击 "Create repository" 创建仓库。

## 2. 上传网站文件

### 方法一：使用 GitHub 网页界面上传（适合初学者）

1. 进入您刚创建的仓库页面。
2. 点击 "Add file" 按钮，选择 "Upload files"。
3. 将本项目中的所有文件拖拽到上传区域，包括：
   - `index.html` 文件
   - `css` 文件夹及其内容
   - `js` 文件夹及其内容
   - `images` 文件夹及其内容（如有）
4. 在页面底部添加提交信息，例如 "Initial website upload"。
5. 点击 "Commit changes" 按钮提交文件。

### 方法二：使用 Git 命令行（适合有经验的用户）

1. 在本地计算机上安装 [Git](https://git-scm.com/downloads)。
2. 打开命令行终端（Windows 上的 Git Bash 或 macOS/Linux 上的终端）。
3. 导航到您的网站文件所在的文件夹。
4. 执行以下命令：

```bash
# 初始化 Git 仓库
git init

# 添加远程仓库
git remote add origin https://github.com/username/username.github.io.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial website upload"

# 推送到 GitHub
git push -u origin main
```

注意：将上述命令中的 `username` 替换为您的 GitHub 用户名。如果您的默认分支是 `master` 而不是 `main`，请相应调整最后一条命令。

## 3. 配置 GitHub Pages

1. 在您的仓库页面，点击 "Settings" 选项卡。
2. 在左侧菜单中，点击 "Pages"。
3. 在 "Source" 部分，确保选择了 "Deploy from a branch"。
4. 在 "Branch" 下拉菜单中，选择 "main"（或 "master"），然后点击 "Save"。
5. 等待几分钟，GitHub 会自动构建和部署您的网站。
6. 部署完成后，您会在页面顶部看到一条消息，显示您的网站 URL（通常是 `https://username.github.io`）。

## 4. 测试网站

1. 访问 `https://username.github.io`（将 `username` 替换为您的 GitHub 用户名）。
2. 检查网站是否正确加载，包括：
   - 所有样式是否正确应用
   - 所有图片是否显示
   - 所有交互功能是否正常工作
3. 在不同设备和浏览器上测试网站，确保响应式设计正常工作。

## 5. 常见问题排查

如果您的网站在 GitHub Pages 上显示不正确，请检查以下几点：

### CSS 样式未加载

1. 确认 HTML 文件中的 CSS 引用路径是相对路径，例如：
   ```html
   <link rel="stylesheet" href="./css/normalize.css">
   <link rel="stylesheet" href="./css/style.css">
   ```

2. 确认 HTML 文件中包含 `<base>` 标签：
   ```html
   <base href="./">
   ```

3. 检查 CSS 文件是否成功上传到正确的位置（应在 `css` 文件夹中）。

### JavaScript 功能不工作

1. 确认 HTML 文件中的 JavaScript 引用路径是相对路径，例如：
   ```html
   <script src="./js/main.js"></script>
   ```

2. 打开浏览器的开发者工具（F12），查看控制台是否有错误信息。

### 图片不显示

1. 确认图片引用使用相对路径，例如：
   ```html
   <img src="./images/profile.jpg" alt="Profile">
   ```

2. 检查图片文件是否成功上传到正确的位置。

## 6. 自定义域名设置（可选）

如果您想使用自己的域名而不是 `username.github.io`，请按照以下步骤操作：

1. 在您的域名注册商处，添加以下 DNS 记录：
   - 如果使用 apex 域（如 `example.com`）：
     - 添加 A 记录，指向 GitHub Pages 的 IP 地址：
       - 185.199.108.153
       - 185.199.109.153
       - 185.199.110.153
       - 185.199.111.153
   - 如果使用子域（如 `www.example.com`）：
     - 添加 CNAME 记录，指向 `username.github.io`

2. 在您的仓库中：
   - 创建一个名为 `CNAME` 的文件（无扩展名）
   - 在文件中输入您的域名（例如 `example.com` 或 `www.example.com`）
   - 提交并推送此文件

3. 在仓库的 "Settings" > "Pages" 页面：
   - 在 "Custom domain" 部分，输入您的域名
   - 勾选 "Enforce HTTPS"（如果可用）
   - 点击 "Save"

4. 等待 DNS 更改生效，这可能需要 24-48 小时。

## 结语

按照上述步骤操作，您的个人主页网站应该能够在 GitHub Pages 上正确显示。如果您仍然遇到问题，请查阅 [GitHub Pages 官方文档](https://docs.github.com/en/pages) 或在 GitHub 社区寻求帮助。

祝您的网站部署顺利！
