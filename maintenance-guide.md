# 个人网站维护指南

本文档提供了如何维护和更新您的个人网站的详细说明。这个网站设计为高度可维护，允许您轻松更新内容而无需修改代码。

## 目录

1. [内容更新](#1-内容更新)
   - [个人资料](#个人资料)
   - [技能](#技能)
   - [经历](#经历)
   - [项目](#项目)
2. [资源管理](#2-资源管理)
   - [添加图片](#添加图片)
   - [添加文档](#添加文档)
3. [多语言支持](#3-多语言支持)
4. [主题定制](#4-主题定制)
5. [部署与更新](#5-部署与更新)
6. [常见问题排查](#6-常见问题排查)

## 1. 内容更新

所有网站内容都存储在 `content` 文件夹中的 JSON 文件里，分为中文 (`zh`) 和英文 (`en`) 两个子文件夹。要更新内容，只需编辑相应的 JSON 文件。

### 个人资料

文件路径：`content/zh/profile.json` 和 `content/en/profile.json`

这些文件包含您的基本信息，如姓名、职位、简介、联系方式等。

示例修改：

```json
{
  "name": "张三", // 修改为您的姓名
  "title": "全栈开发者，UI设计师", // 修改为您的职位/标题
  "about": {
    "introduction": "我是一名热爱编程的开发者...", // 修改您的简短介绍
    "description": "作为一名全栈开发者，我擅长..." // 修改您的详细描述
  },
  "contact": {
    "email": "your.email@example.com", // 修改为您的邮箱
    "phone": "+86 123 4567 8901", // 修改为您的电话
    "location": "北京市，中国", // 修改为您的位置
    "social": {
      "github": "https://github.com/yourusername", // 修改为您的GitHub链接
      "linkedin": "https://linkedin.com/in/yourusername", // 修改为您的LinkedIn链接
      "twitter": "https://twitter.com/yourusername", // 修改为您的Twitter链接
      "weixin": "your_weixin_id" // 修改为您的微信ID
    }
  }
}
```

**重要提示**：确保同时更新中文和英文版本的文件，保持内容一致性。

### 技能

文件路径：`content/zh/skills.json` 和 `content/en/skills.json`

这些文件包含您的技能列表，每个技能包括名称、熟练度百分比和描述。

示例修改：

```json
[
  {
    "name": "JavaScript", // 技能名称
    "percentage": 90, // 熟练度百分比（0-100）
    "description": "精通现代JavaScript，包括ES6+特性..." // 技能描述
  },
  // 添加新技能
  {
    "name": "Python",
    "percentage": 85,
    "description": "熟练使用Python进行数据分析和后端开发"
  }
]
```

要添加新技能，只需在数组中添加新的对象。要删除技能，从数组中移除相应的对象。

### 经历

文件路径：`content/zh/experience.json` 和 `content/en/experience.json`

这些文件包含您的经历，分为不同类别（如校园经历、工作经历、学术经历）。

示例修改：

```json
{
  "categories": {
    "campus": "校园经历",
    "work": "工作经历",
    "academic": "学术经历"
    // 可以添加新类别
  },
  "items": {
    "work": [
      {
        "title": "高级前端开发工程师", // 职位名称
        "organization": "科技公司", // 公司/组织名称
        "period": "2022 - 至今", // 时间段
        "description": "负责开发和维护公司的核心产品..." // 工作描述
      },
      // 添加新工作经历
      {
        "title": "技术主管",
        "organization": "创新科技有限公司",
        "period": "2023 - 至今",
        "description": "领导开发团队，负责产品架构设计和技术决策..."
      }
    ]
  }
}
```

要添加新经历类别，在 `categories` 对象中添加新的键值对，然后在 `items` 对象中添加相应的数组。

### 项目

文件路径：`content/zh/projects.json` 和 `content/en/projects.json`

这些文件包含您的项目列表，每个项目包括标题、类别、描述、图片、标签和链接。

示例修改：

```json
{
  "categories": {
    "all": "全部",
    "web": "Web",
    "mobile": "移动端",
    "design": "设计"
    // 可以添加新类别
  },
  "items": [
    {
      "title": "响应式网站模板", // 项目名称
      "category": "web", // 项目类别（必须与上面的categories中的键匹配）
      "description": "一个现代化的响应式网站模板...", // 项目描述
      "image": "./resources/images/projects/responsive-template.jpg", // 项目图片路径
      "tags": ["HTML", "CSS", "JavaScript"], // 项目标签
      "links": {
        "github": "https://github.com/yourusername/project", // GitHub链接
        "demo": "https://yourusername.github.io/project" // 演示链接
      }
    },
    // 添加新项目
    {
      "title": "数据可视化仪表板",
      "category": "web",
      "description": "一个交互式数据可视化仪表板，展示实时数据分析结果...",
      "image": "./resources/images/projects/dashboard.jpg",
      "tags": ["React", "D3.js", "API"],
      "links": {
        "github": "https://github.com/yourusername/dashboard",
        "demo": "https://yourusername.github.io/dashboard"
      }
    }
  ]
}
```

要添加新项目，在 `items` 数组中添加新的对象。要添加新项目类别，在 `categories` 对象中添加新的键值对。

## 2. 资源管理

所有资源文件都存储在 `resources` 文件夹中，分为不同类型。

### 添加图片

项目图片路径：`resources/images/projects/`
个人照片路径：`resources/images/profile/`

要添加新图片：

1. 将图片文件放入相应的文件夹
2. 在配置文件中引用图片路径，例如：`"image": "./resources/images/projects/new-project.jpg"`

**图片优化建议**：
- 项目图片建议尺寸：800x600像素
- 使用JPG或WebP格式以获得更好的压缩比
- 优化图片大小，建议每张图片不超过200KB

### 添加文档

文档路径：`resources/documents/`

要添加新文档（如简历）：

1. 将文档文件放入文档文件夹
2. 在配置文件中引用文档路径，例如：`"downloadLink": "./resources/documents/resume.pdf"`

## 3. 多语言支持

网站支持中文和英文两种语言。要确保多语言支持正常工作，请确保：

1. `content/zh/` 和 `content/en/` 文件夹中的所有JSON文件都存在
2. 两种语言的配置文件结构完全相同
3. 所有文本内容都已翻译

**添加新语言**（高级）：

如果您需要添加新语言，需要：

1. 在 `content` 文件夹中创建新的语言文件夹（如 `content/fr/` 表示法语）
2. 复制所有JSON文件并翻译内容
3. 修改 `js/language-manager.js` 文件，添加新语言支持

## 4. 主题定制

网站支持亮色和暗色两种主题。要自定义主题颜色：

1. 打开 `css/style.css` 文件
2. 找到 `:root` 和 `[data-theme="dark"]` 部分
3. 修改颜色变量值

示例：

```css
:root {
  --accent-color: #007bff; /* 修改为您喜欢的主题色 */
}

[data-theme="dark"] {
  --accent-color: #4dabf7; /* 修改为您喜欢的暗色主题色 */
}
```

## 5. 部署与更新

### 初次部署

1. 将所有文件上传到您的GitHub仓库
2. 启用GitHub Pages（设置 -> Pages -> 选择分支 -> 保存）
3. 等待几分钟，您的网站将在 `https://yourusername.github.io` 上线

### 更新网站

1. 修改相应的配置文件或资源
2. 将更改提交到GitHub仓库
3. GitHub Pages将自动更新您的网站

**使用GitHub Desktop更新**（推荐给非开发者）：

1. 下载并安装 [GitHub Desktop](https://desktop.github.com/)
2. 克隆您的仓库到本地
3. 使用文本编辑器（如VS Code、Notepad++）修改配置文件
4. 在GitHub Desktop中提交更改并推送到GitHub

## 6. 常见问题排查

### 内容未更新

**问题**：修改了配置文件，但网站内容没有更新。

**解决方案**：
- 确保您修改了正确的文件
- 确保JSON格式正确（没有缺少逗号或括号）
- 确保已将更改推送到GitHub
- 清除浏览器缓存或使用隐私模式查看网站

### 图片不显示

**问题**：添加了新图片，但网站上不显示。

**解决方案**：
- 确保图片路径正确
- 确保图片已上传到正确的文件夹
- 检查图片文件名是否与配置中的完全匹配（区分大小写）

### JSON语法错误

**问题**：修改配置后网站无法加载。

**解决方案**：
- 使用 [JSON验证工具](https://jsonlint.com/) 检查您的JSON文件
- 常见错误包括：缺少逗号、多余的逗号、未闭合的引号或括号

### 多语言切换问题

**问题**：语言切换不正常或部分内容未翻译。

**解决方案**：
- 确保两种语言的配置文件结构完全相同
- 检查是否有缺失的翻译键
- 清除浏览器本地存储（localStorage）

## 结语

通过遵循本指南，您应该能够轻松维护和更新您的个人网站。如果您遇到任何未在此文档中涵盖的问题，请参考源代码或联系网站开发者获取支持。

祝您使用愉快！
