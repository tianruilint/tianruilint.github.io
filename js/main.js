// 主脚本文件 - 负责网站的交互功能
import languageManager from './language-manager.js';
import configLoader from './config-loader.js';
import resourceManager from './resource-manager.js';

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 初始化网站
  initWebsite();
});

// 初始化网站
async function initWebsite() {
  // 等待配置加载完成
  configLoader.addLoadListener(() => {
    // 初始化主题
    initTheme();
    
    // 初始化语言切换
    initLanguageSwitch();
    
    // 初始化导航
    initNavigation();
    
    // 渲染各部分内容
    renderContent();
    
    // 初始化交互功能
    initInteractions();
    
    // 显示网站内容（移除加载状态）
    document.body.classList.remove('loading');
    document.body.classList.add('loaded');
  });
}

// 初始化主题
function initTheme() {
  // 获取主题切换按钮
  const themeSwitch = document.getElementById('theme-switch');
  if (!themeSwitch) return;
  
  // 从本地存储获取主题设置
  const savedTheme = localStorage.getItem('theme');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  // 设置初始主题
  let currentTheme = savedTheme;
  if (!currentTheme) {
    currentTheme = prefersDarkScheme ? 'dark' : 'light';
  }
  
  // 应用主题
  document.documentElement.setAttribute('data-theme', currentTheme);
  
  // 更新主题切换按钮文本
  updateThemeSwitchText(currentTheme);
  
  // 添加主题切换事件
  themeSwitch.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeSwitchText(newTheme);
  });
}

// 更新主题切换按钮文本
function updateThemeSwitchText(theme) {
  const themeSwitch = document.getElementById('theme-switch');
  if (!themeSwitch) return;
  
  themeSwitch.innerHTML = theme === 'dark' 
    ? '<i class="fas fa-sun"></i>' 
    : '<i class="fas fa-moon"></i>';
}

// 初始化语言切换
function initLanguageSwitch() {
  // 获取语言切换按钮
  const languageSwitch = document.getElementById('language-switch');
  if (!languageSwitch) return;
  
  // 设置初始语言文本
  updateLanguageSwitchText();
  
  // 添加语言切换事件
  languageSwitch.addEventListener('click', () => {
    languageManager.switchLanguage();
    updateLanguageSwitchText();
    initNavigation();
    renderContent(); // 重新渲染内容
  });
  
  // 添加语言变化监听器
  languageManager.addListener(() => {
    updateLanguageSwitchText();
  });
}

// 更新语言切换按钮文本
function updateLanguageSwitchText() {
  const languageSwitch = document.getElementById('language-switch');
  if (!languageSwitch) return;
  
  const currentLanguage = languageManager.getCurrentLanguage();
  const switchText = configLoader.getConfig('profile', 'ui.languageSwitch');
  
  languageSwitch.textContent = switchText;
}

// 初始化导航
function initNavigation() {
  // 获取导航链接
  const navLinks = document.querySelectorAll('.nav-links a');
  const mobileMenuLinks = document.querySelectorAll('#mobile-menu a'); // 同时选择移动菜单链接

  // 更新导航文本
  const updateLinkText = (link) => {
    const section = link.getAttribute('data-section');
    if (section) {
      // 使用 configLoader 获取当前语言的文本
      const text = configLoader.getConfig('profile', `navigation.${section}`);
      if (text) link.textContent = text;
    }
};
  
  navLinks.forEach(updateLinkText);
  mobileMenuLinks.forEach(updateLinkText);

  // 移动端菜单
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.hasClickListener) { // 简单标记避免重复绑定
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('active');
    });
    mobileMenuBtn.hasClickListener = true; // 标记已绑定

    // 点击菜单项后关闭菜单 (确保这个逻辑也在首次绑定时完成)
    mobileMenuLinks.forEach(link => {
      if (!link.hasCloseListener) {
          link.addEventListener('click', () => {
              mobileMenu.classList.remove('active');
          });
          link.hasCloseListener = true; // 标记已绑定
      }
    });
 }
  
  // 滚动监听
  if (!window.hasScrollListener) { // 简单标记避免重复绑定
    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
      const sections = document.querySelectorAll('section'); // 获取所有 section

      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100; // 调整偏移量
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          // 移除所有活动类
          navLinks.forEach(link => link.classList.remove('active'));
          mobileMenuLinks.forEach(link => link.classList.remove('active')); // 也处理移动菜单

          // 添加活动类到当前部分的链接
          const activeLinkSelector = `.nav-links a[href="#<span class="math-inline">\{sectionId\}"\], \#mobile\-menu a\[href\="\#</span>{sectionId}"]`;
          const activeLinks = document.querySelectorAll(activeLinkSelector);
          activeLinks.forEach(link => link.classList.add('active'));
        }
      });
    });
    window.hasScrollListener = true; // 标记已绑定
 }
}

// 渲染内容
function renderContent() {
  // 渲染个人资料
  renderProfile();
  
  // 渲染技能
  renderSkills();
  
  // 渲染经历
  renderExperience();
  
  // 渲染项目
  renderProjects();
  
  // 渲染联系信息
  renderContact();

  // 新增页脚信息
  renderFooter();
}

// 渲染个人资料
function renderProfile() {
  // 获取个人资料配置
  const profile = configLoader.getConfig('profile');

  // 更新标题
  document.title = profile.name;

  // 更新徽标 (Logo)
  const logoElements = document.querySelectorAll('.logo');
  logoElements.forEach(el => {
    el.textContent = profile.name;
  });
  
  // 更新英雄部分
  const heroTitle = document.querySelector('.hero h1');
  const heroSubtitle = document.querySelector('.hero p'); // 选择 Hero 副标题
  const resumeBtn = document.querySelector('.hero-buttons .resume-btn');
  const contactBtn = document.getElementById('hero-contact-btn'); // <<< (假设你给联系我按钮添加了 ID)

  if (heroTitle) heroTitle.textContent = profile.name;
  if (heroSubtitle) heroSubtitle.textContent = profile.title; // <<< 更新 Hero 副标题
  if (resumeBtn) {
    resumeBtn.textContent = profile.resume.buttonText;
    resumeBtn.href = profile.resume.downloadLink; // 确保链接也可能需要更新？（如果不同语言简历不同）
  }
  
  // 更新 "联系我" 按钮
  if (contactBtn && profile.ui.contactMeButton) { // <<< 更新 联系我 按钮
     contactBtn.textContent = profile.ui.contactMeButton;
  }
  
  // 更新关于部分
  const aboutSectionTitle = document.querySelector('#about h2'); // <<< 选择 About 标题
  const aboutIntro = document.querySelector('#about .about-text p:first-child');
  const aboutDesc = document.querySelector('#about .about-text p:last-child');

  if (aboutSectionTitle && profile.navigation.about) { // <<< 更新 About 标题
      aboutSectionTitle.textContent = profile.navigation.about;
  }
  if (aboutIntro) aboutIntro.textContent = profile.about.introduction;
  if (aboutDesc) aboutDesc.textContent = profile.about.description;
  
}

// 渲染技能
function renderSkills() {
  // 获取技能配置
  const skills = configLoader.getConfig('skills');
  
  // 获取技能容器
  const skillsContainer = document.querySelector('.skills');
  if (!skillsContainer || !skills.length) return;
  
  // 清空容器
  skillsContainer.innerHTML = '';
  
  // 添加技能项
  skills.forEach(skill => {
    const skillItem = document.createElement('div');
    skillItem.className = 'skill-item';
    
    skillItem.innerHTML = `
      <div class="skill-info">
        <span>${skill.name}</span>
        <span>${skill.percentage}%</span>
      </div>
      <div class="skill-bar">
        <div class="skill-progress" style="width: ${skill.percentage}%"></div>
      </div>
      <p class="skill-description">${skill.description}</p>
    `;
    
    skillsContainer.appendChild(skillItem);
  });
}

// 渲染经历
function renderExperience() {
  const experienceSectionTitle = document.querySelector('#experience h2'); // <<< 选择 Experience 标题
  const profile = configLoader.getConfig('profile'); // 需要 profile 来获取导航文本
  if (experienceSectionTitle && profile.navigation.experience) { // <<< 更新 Experience 标题
     experienceSectionTitle.textContent = profile.navigation.experience;
  }

  // 获取经历配置
  const experience = configLoader.getConfig('experience');
  if (!experience || !experience.categories) return;
  
  // 获取经历容器
  const experienceTabs = document.querySelector('.experience-tabs');
  const experienceContents = document.querySelector('.experience-contents');
  
  if (!experienceTabs || !experienceContents) return;
  
  // 清空容器
  experienceTabs.innerHTML = '';
  experienceContents.innerHTML = '';
  
  // 添加标签和内容
  Object.entries(experience.categories).forEach(([key, value], index) => {
    // 创建标签
    const tab = document.createElement('div');
    tab.className = `experience-tab ${index === 0 ? 'active' : ''}`;
    tab.setAttribute('data-tab', key);
    tab.textContent = value;
    experienceTabs.appendChild(tab);
    
    // 创建内容
    const content = document.createElement('div');
    content.className = `experience-content ${index === 0 ? 'active' : ''}`;
    content.setAttribute('data-content', key);
    
    // 添加经历项
    if (experience.items && experience.items[key]) {
      experience.items[key].forEach(item => {
        const experienceItem = document.createElement('div');
        experienceItem.className = 'experience-item';
        
        experienceItem.innerHTML = `
          <div class="experience-header">
            <div class="experience-title">${item.title}</div>
            <div class="experience-period">${item.period}</div>
          </div>
          <div class="experience-organization">${item.organization}</div>
          <p class="experience-description">${item.description}</p>
        `;
        
        content.appendChild(experienceItem);
      });
    }
    
    experienceContents.appendChild(content);
  });
  
  // 添加标签点击事件
  const tabs = document.querySelectorAll('.experience-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 移除所有活动类
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.experience-content').forEach(c => c.classList.remove('active'));
      
      // 添加活动类到当前标签和内容
      tab.classList.add('active');
      const tabName = tab.getAttribute('data-tab');
      document.querySelector(`.experience-content[data-content="${tabName}"]`).classList.add('active');
    });
  });
}

// 渲染项目
function renderProjects() {
  const projectsSectionTitle = document.querySelector('#projects h2'); // <<< 选择 Projects 标题
  const profile = configLoader.getConfig('profile'); // 需要 profile 来获取导航文本
  if (projectsSectionTitle && profile.navigation.projects) { // <<< 更新 Projects 标题
     projectsSectionTitle.textContent = profile.navigation.projects;
  }

  function renderFooter() {
    const profile = configLoader.getConfig('profile');
    if (!profile) return; // 如果配置未加载则退出
  
    // 1. 更新 Footer Logo
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) { // 安全检查
      footerLogo.textContent = profile.name;
    }
  
    // 2. 更新 Footer Links
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('#')) {
        const section = href.substring(1);
        // 安全检查：确保 navigation 和 section 键存在
        if (profile.navigation && profile.navigation[section]) {
          link.textContent = profile.navigation[section];
        }
      }
    });
  
    // 3. 更新 Footer Social Links
    const footerSocialContainer = document.querySelector('.footer-social');
    // 安全检查：确保 contact 和 social 存在
    if (footerSocialContainer && profile.contact && profile.contact.social) {
      footerSocialContainer.innerHTML = '';
  
      Object.entries(profile.contact.social).forEach(([platform, url]) => {
        if (!url) return;
  
        const socialLink = document.createElement('a');
        socialLink.className = 'social-link footer-social-link';
        socialLink.href = url;
        socialLink.target = '_blank';
        socialLink.setAttribute('aria-label', platform);
  
        let icon = '';
        switch (platform.toLowerCase()) {
          case 'github': icon = 'fab fa-github'; break;
          case 'linkedin': icon = 'fab fa-linkedin-in'; break;
          case 'twitter': icon = 'fab fa-twitter'; break;
          case 'weixin': icon = 'fab fa-weixin'; break;
          default: icon = 'fas fa-link';
        }
  
        socialLink.innerHTML = `<i class="${icon}"></i>`;
        footerSocialContainer.appendChild(socialLink);
      });
    }
  
    // 4. 更新 Copyright
    const copyrightElement = document.querySelector('.copyright');
    // 安全检查：确保 ui 和 copyright 键存在
    if (copyrightElement && profile.ui && profile.ui.copyright) {
      const year = new Date().getFullYear();
      copyrightElement.textContent = `© ${year} ${profile.name}. ${profile.ui.copyright}`;
    }
  }

  // 获取项目配置
  const projects = configLoader.getConfig('projects');
  if (!projects || !projects.categories || !projects.items) return;
  
  // 获取项目容器
  const projectsFilter = document.querySelector('.projects-filter');
  const projectsGrid = document.querySelector('.projects-grid');
  
  if (!projectsFilter || !projectsGrid) return;
  
  // 清空容器
  projectsFilter.innerHTML = '';
  projectsGrid.innerHTML = '';
  
  // 添加筛选按钮
  Object.entries(projects.categories).forEach(([key, value], index) => {
    const filterBtn = document.createElement('button');
    filterBtn.className = `filter-btn ${index === 0 ? 'active' : ''}`;
    filterBtn.setAttribute('data-filter', key);
    filterBtn.textContent = value;
    projectsFilter.appendChild(filterBtn);
  });
  
  // 添加项目卡片
  projects.items.forEach(project => {
    const projectCard = document.createElement('div');
    projectCard.className = 'project-card';
    projectCard.setAttribute('data-category', project.category);
    
    // 获取项目图片路径
    const imagePath = resourceManager.getProjectImagePath(project.image);
    
    projectCard.innerHTML = `
      <div class="project-image">
        <img src="${imagePath}" alt="${project.title}">
      </div>
      <div class="project-info">
        <h3 class="project-title">${project.title}</h3>
        <p class="project-description">${project.description}</p>
        <div class="project-tags">
          ${project.tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
        </div>
        <div class="project-links">
          ${project.links.github ? `<a href="${project.links.github}" target="_blank"><i class="fab fa-github"></i> GitHub</a>` : ''}
          ${project.links.demo ? `<a href="${project.links.demo}" target="_blank"><i class="fas fa-external-link-alt"></i> Demo</a>` : ''}
        </div>
      </div>
    `;
    
    projectsGrid.appendChild(projectCard);
  });
  
  // 添加筛选功能
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 移除所有活动类
      filterBtns.forEach(b => b.classList.remove('active'));
      
      // 添加活动类到当前按钮
      btn.classList.add('active');
      
      // 获取筛选类别
      const filter = btn.getAttribute('data-filter');
      
      // 筛选项目
      projectCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

// 渲染联系信息
function renderContact() {
  const contactSectionTitle = document.querySelector('#contact h2'); // <<< 选择 Contact 标题
  const profile = configLoader.getConfig('profile'); // 需要 profile 来获取导航文本
  if (contactSectionTitle && profile.navigation.contact) { // <<< 更新 Contact 标题
     contactSectionTitle.textContent = profile.navigation.contact;
  }
  // 获取个人资料配置
  if (!profile || !profile.contact) return;
  
  // 更新联系信息
  const emailElement = document.querySelector('.contact-email .contact-text');
  const phoneElement = document.querySelector('.contact-phone .contact-text');
  const locationElement = document.querySelector('.contact-location .contact-text');
  
  if (emailElement) emailElement.textContent = profile.contact.email;
  if (phoneElement) phoneElement.textContent = profile.contact.phone;
  if (locationElement) locationElement.textContent = profile.contact.location;
  
  // 更新社交链接
  const socialLinks = document.querySelector('.social-links');
  if (socialLinks && profile.contact.social) {
    socialLinks.innerHTML = '';
    
    // 添加社交链接
    Object.entries(profile.contact.social).forEach(([platform, url]) => {
      if (!url) return;
      
      const socialLink = document.createElement('a');
      socialLink.className = 'social-link';
      socialLink.href = url;
      socialLink.target = '_blank';
      
      // 根据平台设置图标
      let icon = '';
      switch (platform) {
        case 'github':
          icon = 'fab fa-github';
          break;
        case 'linkedin':
          icon = 'fab fa-linkedin-in';
          break;
        case 'twitter':
          icon = 'fab fa-twitter';
          break;
        case 'weixin':
          icon = 'fab fa-weixin';
          break;
        default:
          icon = 'fas fa-link';
      }
      
      socialLink.innerHTML = `<i class="${icon}"></i>`;
      socialLinks.appendChild(socialLink);
    });
  }
  
  // 更新联系表单
  const nameLabel = document.querySelector('label[for="name"]');
  const emailLabel = document.querySelector('label[for="email"]');
  const messageLabel = document.querySelector('label[for="message"]');
  const submitBtn = document.querySelector('.contact-form button[type="submit"]');
  
  if (nameLabel) nameLabel.textContent = profile.ui.formLabels.name;
  if (emailLabel) emailLabel.textContent = profile.ui.formLabels.email;
  if (messageLabel) messageLabel.textContent = profile.ui.formLabels.message;
  if (submitBtn) submitBtn.textContent = profile.ui.sendMessage;
}

// 初始化交互功能
function initInteractions() {
  // 平滑滚动
  const scrollLinks = document.querySelectorAll('a[href^="#"]');
  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const targetId = link.getAttribute('href');
      if (targetId === '#') return;
      
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 70,
          behavior: 'smooth'
        });
      }
    });
  });
  
  // 联系表单提交
  const contactForm = document.querySelector('.contact-form form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // 在实际应用中，这里应该发送表单数据到服务器
      // 这里只是模拟提交成功
      alert('表单提交成功！在实际应用中，这里会发送数据到服务器。');
      contactForm.reset();
    });
  }
}
