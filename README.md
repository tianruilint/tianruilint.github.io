# 个人网站使用说明

欢迎使用您的新个人网站！这个网站专为易于维护和更新而设计，无需编程知识即可定制内容。

## 快速开始

1. 解压此压缩包到您的计算机
2. 按照 `github-pages-deployment-guide.md` 中的说明部署到GitHub Pages
3. 使用 `maintenance-guide.md` 中的指南更新网站内容

## 文件结构说明

- `index.html` - 网站主页面
- `css/` - 包含所有样式文件
- `js/` - 包含所有JavaScript脚本
- `content/` - **重要！** 这里存放所有可编辑的内容配置
  - `zh/` - 中文内容配置
  - `en/` - 英文内容配置
- `resources/` - 存放图片、文档等资源
  - `images/` - 图片资源
  - `documents/` - 文档资源（如简历）
- `docs/` - 文档和指南

## 如何修改网站内容

所有网站内容都存储在 `content` 文件夹中的JSON文件里。要更新内容，只需编辑相应的JSON文件：

1. 个人资料: `content/zh/profile.json` 和 `content/en/profile.json`
2. 技能列表: `content/zh/skills.json` 和 `content/en/skills.json`
3. 经历: `content/zh/experience.json` 和 `content/en/experience.json`
4. 项目: `content/zh/projects.json` 和 `content/en/projects.json`

## 如何添加图片

1. 将项目图片放入 `resources/images/projects/` 文件夹
2. 将个人照片放入 `resources/images/profile/` 文件夹
3. 在配置文件中引用图片路径，例如：`"image": "./resources/images/projects/project1.jpg"`

## 详细文档

- `maintenance-guide.md` - 详细的网站维护指南
- `github-pages-deployment-guide.md` - GitHub Pages部署指南

## 特性

- ✅ 响应式设计 - 在所有设备上完美显示
- ✅ 中英文切换 - 支持多语言
- ✅ 深色/浅色主题 - 自动适应系统设置
- ✅ 内容配置系统 - 轻松更新内容
- ✅ 项目筛选功能 - 按类别展示项目
- ✅ 完全可自定义 - 根据需要调整样式和功能

## 需要帮助？

如果您在使用过程中遇到任何问题，请参考详细文档或联系网站开发者获取支持。
