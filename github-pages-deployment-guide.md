# GitHub Pages 部署指南

本指南将帮助您将个人网站部署到 GitHub Pages，并提供详细的维护说明。

## 目录

1. [部署到 GitHub Pages](#1-部署到-github-pages)
2. [自定义域名设置](#2-自定义域名设置)
3. [常见问题排查](#3-常见问题排查)
4. [更新网站内容](#4-更新网站内容)

## 1. 部署到 GitHub Pages

### 创建 GitHub 仓库

1. 登录您的 GitHub 账户
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 仓库名称必须为：`您的用户名.github.io`（例如：`johndoe.github.io`）
4. 选择 "Public" 可见性
5. 点击 "Create repository"

### 上传网站文件

**方法一：通过 GitHub 网页界面上传**

适合不熟悉 Git 命令的用户：

1. 进入您刚创建的仓库
2. 点击 "Add file" > "Upload files"
3. 将本压缩包中的所有文件拖拽到上传区域
4. 点击 "Commit changes"

**方法二：通过 Git 命令行上传**

适合熟悉 Git 的用户：

```bash
# 克隆仓库
git clone https://github.com/您的用户名/您的用户名.github.io.git

# 进入仓库目录
cd 您的用户名.github.io

# 复制网站文件到仓库目录
# (将本压缩包解压后的所有文件复制到这个目录)

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial website deployment"

# 推送到 GitHub
git push origin main
```

### 启用 GitHub Pages

1. 进入您的仓库
2. 点击 "Settings" 标签
3. 在左侧菜单中点击 "Pages"
4. 在 "Source" 部分，选择 "main" 分支和 "/ (root)" 文件夹
5. 点击 "Save"
6. 等待几分钟，您的网站将在 `https://您的用户名.github.io` 上线

## 2. 自定义域名设置

如果您想使用自己的域名而不是 `您的用户名.github.io`：

1. 在您的域名注册商处添加以下 DNS 记录：
   - 如果使用 apex 域名（如 `example.com`）：
     - A 记录：指向 `185.199.108.153`
     - A 记录：指向 `185.199.109.153`
     - A 记录：指向 `185.199.110.153`
     - A 记录：指向 `185.199.111.153`
   - 如果使用子域名（如 `www.example.com`）：
     - CNAME 记录：指向 `您的用户名.github.io`

2. 在您的仓库中：
   - 创建名为 `CNAME` 的文件（无扩展名）
   - 文件内容为您的域名（例如：`example.com`）
   - 提交并推送此文件

3. 在仓库的 "Settings" > "Pages" 中：
   - 在 "Custom domain" 字段中输入您的域名
   - 勾选 "Enforce HTTPS"（如果可用）
   - 点击 "Save"

## 3. 常见问题排查

### CSS 样式未加载

**问题**：网站显示但没有样式，类似纯文本页面。

**解决方案**：
1. 确保所有文件路径正确，特别是 CSS 文件的引用
2. 检查 HTML 文件中的 `<base href="./"/>` 标签是否存在
3. 确保所有资源文件都已上传到正确的目录结构中
4. 清除浏览器缓存或使用隐私模式查看网站

### 图片不显示

**问题**：网站结构正常但图片不显示。

**解决方案**：
1. 确保图片文件已上传到 `resources/images/` 目录下的相应子文件夹
2. 检查图片文件名是否与配置中的完全匹配（区分大小写）
3. 确保图片路径使用相对路径（以 `./` 开头）

### JavaScript 功能不工作

**问题**：网站加载但交互功能（如语言切换、主题切换）不工作。

**解决方案**：
1. 打开浏览器开发者工具（F12）查看控制台错误
2. 确保所有 JavaScript 文件都已上传
3. 检查 HTML 文件中的 `<script>` 标签是否正确引用了 JavaScript 文件
4. 确保 JavaScript 文件中的模块导入路径正确

## 4. 更新网站内容

部署后，您可以通过以下方式更新网站内容：

1. 克隆仓库到本地（如果尚未克隆）
2. 修改相应的配置文件（位于 `content` 文件夹中）
3. 添加或更新资源文件（位于 `resources` 文件夹中）
4. 提交并推送更改到 GitHub
5. GitHub Pages 将自动更新您的网站

详细的内容更新指南请参阅 `docs/maintenance-guide.md` 文件。

---

如果您遇到任何问题或需要进一步的帮助，请参考 GitHub Pages 官方文档：https://docs.github.com/cn/pages
