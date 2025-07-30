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
  // 获取导航链接 - 修复选择器
  const navLinks = document.querySelectorAll('.nav-links .label');
  const mobileMenuLinks = document.querySelectorAll('#mobile-menu a');
  const radioInputs = document.querySelectorAll('.nav-links input[type="radio"]');

  // 更新导航文本
  const updateLinkText = (link) => {
    const section = link.getAttribute('data-section');
    if (section) {
      // 使用 configLoader 获取当前语言的文本
      const text = configLoader.getConfig('profile', `navigation.${section}`);
      if (text) {
        const span = link.querySelector('span');
        if (span) {
          span.textContent = text;
        } else {
          link.textContent = text;
        }
      }
    }
  };
  
  navLinks.forEach(updateLinkText);
  mobileMenuLinks.forEach(updateLinkText);

  // 添加导航点击事件
  navLinks.forEach((link, index) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.getAttribute('data-section');
      if (section) {
        // 选中对应的radio按钮
        const radioInput = document.getElementById(`rd-${index + 1}`);
        if (radioInput) {
          radioInput.checked = true;
        }
        
        // 滚动到对应部分
        const targetSection = document.getElementById(section);
        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 移动端菜单
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuBtn && mobileMenu && !mobileMenuBtn.hasClickListener) {
    console.log("Attaching listener to mobile menu button."); // 添加日志，确认监听器是否附加
    mobileMenuBtn.addEventListener('click', (event) => {
       // 可选：阻止冒泡，以防万一按钮在某个也监听点击的容器内
       event.stopPropagation();
       console.log("Mobile menu button clicked!"); // 添加日志，确认点击是否触发
       mobileMenu.classList.toggle('active');
       console.log("Mobile menu class toggled:", mobileMenu.classList.contains('active')); // 查看状态
    });
    mobileMenuBtn.hasClickListener = true; // 标记已绑定
  }
  
  // 滚动监听
  if (!window.hasScrollListener) { // 简单标记避免重复绑定
    window.addEventListener('scroll', () => {
      const scrollPosition = window.scrollY;
      const sections = document.querySelectorAll('section'); // 获取所有 section

      sections.forEach((section, index) => {
        const sectionTop = section.offsetTop - 100; // 调整偏移量
        const sectionBottom = sectionTop + section.offsetHeight;
        const sectionId = section.getAttribute('id');

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          // 选中对应的radio按钮
          const radioInput = document.getElementById(`rd-${index + 1}`);
          if (radioInput) {
            radioInput.checked = true;
          }
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

  // 渲染页脚
  renderFooter();
}

// 渲染个人资料
function renderProfile() {
  // 获取个人资料配置
  const profile = configLoader.getConfig('profile');
  if (!profile) return;

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
  const resumeBtn = document.getElementById('resume-download-btn'); // 使用 ID 选择
  const contactBtn = document.getElementById('hero-contact-btn');

  if (heroTitle) heroTitle.textContent = profile.name;
  if (heroSubtitle) heroSubtitle.textContent = profile.title;
  if (resumeBtn && profile.resume) {
    resumeBtn.textContent = profile.resume.buttonText;
    // 更新 data-resume-link 属性，而不是 href
    const resumeLink = profile.resume.downloadLink;
    if (resumeLink) {
       resumeBtn.setAttribute('data-resume-link', resumeLink);
    } else {
       console.warn("Resume download link is missing in profile config.");
       resumeBtn.style.display = 'none'; // 如果没有链接，隐藏按钮
    }
} else if(resumeBtn) {
     resumeBtn.style.display = 'none'; // 如果配置中没有 resume 部分，也隐藏按钮
}

  
  // 更新 "联系我" 按钮
  if (contactBtn && profile.ui.contactMeButton) { // <<< 更新 联系我 按钮
     contactBtn.textContent = profile.ui.contactMeButton;
  }
  
  const profileImageElement = document.getElementById('profile-pic');
  if (profileImageElement) {
    // 从配置获取图片文件名 (例如 "avatar.jpg")
    const imageName = profile.image;
    // 使用 resourceManager 获取完整的、安全的图片路径
    const imagePath = resourceManager.getProfileImagePath(imageName);

    profileImageElement.src = imagePath; // 设置图片源
    profileImageElement.alt = `${profile.name || 'User'}'s profile picture`; // 设置 alt 文本
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
  
  // 更新版权信息
  const copyright = document.querySelector('.copyright');
  if (copyright) {
    const year = new Date().getFullYear();
    // 确保 profile.ui.copyright 存在
    const copyrightText = profile.ui.copyright || "All Rights Reserved";
    copyright.textContent = `© ${year} ${profile.name}. ${copyrightText}`;
  }
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
  // --- 保留更新标题、联系信息和社交链接的代码 ---
  const contactSectionTitle = document.querySelector('#contact h2');
  const profile = configLoader.getConfig('profile');
  if (contactSectionTitle && profile && profile.navigation && profile.navigation.contact) {
    contactSectionTitle.textContent = profile.navigation.contact;
  }

  if (profile && profile.contact) {
    // 修复联系信息选择器
    const emailElement = document.querySelector('.contact-email .contact-details p');
    const phoneElement = document.querySelector('.contact-phone .contact-details p');
    const locationElement = document.querySelector('.contact-location .contact-details p');
    
    // 更新联系信息标题
    const emailTitle = document.querySelector('.contact-email .contact-details h4');
    const phoneTitle = document.querySelector('.contact-phone .contact-details h4');
    const locationTitle = document.querySelector('.contact-location .contact-details h4');
    
    if (emailElement) emailElement.textContent = profile.contact.email;
    if (phoneElement) phoneElement.textContent = profile.contact.phone;
    if (locationElement) locationElement.textContent = profile.contact.location;
    
    // 更新联系信息标题文本
    if (emailTitle && profile.ui && profile.ui.contactLabels) {
      emailTitle.textContent = profile.ui.contactLabels.email || '邮箱';
    }
    if (phoneTitle && profile.ui && profile.ui.contactLabels) {
      phoneTitle.textContent = profile.ui.contactLabels.phone || '电话';
    }
    if (locationTitle && profile.ui && profile.ui.contactLabels) {
      locationTitle.textContent = profile.ui.contactLabels.location || '位置';
    }

    const socialLinks = document.querySelector('.social-links');
    if (socialLinks && profile.contact.social) {
      socialLinks.innerHTML = ''; // 清空以防重复添加
      Object.entries(profile.contact.social).forEach(([platform, url]) => {
        if (!url) return;
        const socialLink = document.createElement('a');
        socialLink.className = 'social-link';
        socialLink.href = url;
        socialLink.target = '_blank';
        let icon = '';
        switch (platform) {
          case 'github': icon = 'fab fa-github'; break;
          case 'linkedin': icon = 'fab fa-linkedin-in'; break;
          case 'twitter': icon = 'fab fa-twitter'; break;
          case 'weixin': icon = 'fab fa-weixin'; break; // 修正了可能的拼写错误
          default: icon = 'fas fa-link';
        }
        socialLink.innerHTML = `<i class="${icon}"></i>`;
        socialLinks.appendChild(socialLink);
      });
    }
  }

  const formContainer = document.querySelector('.contact-form');
  if (!formContainer) {
    console.error('Contact form container (.contact-form) not found.');
    return;
  }

  const currentLanguage = languageManager.getCurrentLanguage();

  // 定义 Google 表单的 iframe HTML (建议在 CSS 中控制 width/height 以实现响应式)
  // 为了简单起见，暂时保留 width/height，但添加 style="width: 100%; max-width: 640px;"
  const iframeZh = '<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSd7U-72-ULCtF9LBjJuRT_zTTEyOlMmM_ZdaLZAB9HU4gb_SQ/viewform?embedded=true" style="width: 100%; max-width: 640px; height: 684px; display: block; margin: 0 auto;" frameborder="0" marginheight="0" marginwidth="0">正在加载…</iframe>';
  const iframeEn = '<iframe src="https://docs.google.com/forms/d/e/1FAIpQLScPmBtl5Lgo3BmtD2JAaFi2xy3BGBd4SeGS5J8lHqfD5Qa9Hw/viewform?embedded=true" style="width: 100%; max-width: 640px; height: 684px; display: block; margin: 0 auto;" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>';

  // 根据当前语言设置 iframe
  if (currentLanguage === 'zh') {
    formContainer.innerHTML = iframeZh;
  } else { // 默认为英文
    formContainer.innerHTML = iframeEn;
  }
}

function renderFooter() {
  const profile = configLoader.getConfig('profile');
  // 检查 profile 和 navigation 数据是否存在
  if (!profile || !profile.navigation) {
      console.warn('Footer rendering skipped: Profile or navigation data missing.');
      return;
  }

  // 1. 更新页脚 Logo (使用 profile.name)
  const footerLogo = document.querySelector('.footer-logo');
  if (footerLogo && profile.name) {
    footerLogo.textContent = profile.name;
  }

  // 2. 更新页脚导航链接
  const footerLinks = document.querySelectorAll('.footer-links a');
  footerLinks.forEach(link => {
    // 从 href 获取片段标识符 (例如, 从 "#about" 获取 "about")
    const sectionKey = link.getAttribute('href')?.substring(1);
    if (sectionKey && profile.navigation[sectionKey]) {
      // 从 profile.navigation 中获取对应语言的文本
      link.textContent = profile.navigation[sectionKey];
    } else {
        console.warn(`Footer link text not found for section: ${sectionKey}`);
    }
  });

  // 3. 更新版权信息 (这部分已由 renderProfile 处理，这里是可选的重复确保)
  // 如果 renderProfile 确保执行，则可以省略这部分以避免重复代码
  const copyrightElement = document.querySelector('.copyright');
  if (copyrightElement && profile.name && profile.ui && profile.ui.copyright) {
    const year = new Date().getFullYear();
    // 注意：确保 profile.ui.copyright 在你的 JSON 文件中定义了
    const copyrightText = profile.ui.copyright || "All Rights Reserved"; // 提供一个默认值
    copyrightElement.textContent = `© ${year} ${profile.name}. ${copyrightText}`;
  }
}
// 初始化交互功能
function initInteractions() {
  // 添加导航跳转功能
  const navLabels = document.querySelectorAll('.nav-links .label');
  navLabels.forEach(label => {
    label.addEventListener('click', (e) => {
      e.preventDefault();
      const section = label.getAttribute('data-section');
      if (section) {
        const targetElement = document.getElementById(section);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

  // 保留平滑滚动逻辑
  const scrollLinks = document.querySelectorAll(
    '#mobile-menu a[href^="#"]:not([href="#"])'  // 移动菜单 (排除 href="#")
    + ', .footer-links a[href^="#"]:not([href="#"])' // 页脚链接 (排除 href="#")
    + ', .hero-buttons a[href^="#contact"]'       // Hero 联系按钮
    // 你可以根据需要添加其他特定区域的链接选择器
  );

  scrollLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

    // 密码保护简历下载逻辑
    const resumeDownloadBtn = document.getElementById('resume-download-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordInput = document.getElementById('password-input');
    const passwordSubmitBtn = document.getElementById('password-submit');
    const passwordCloseBtn = document.getElementById('password-close-btn');
    const passwordErrorMsg = document.getElementById('password-error');
    const modalTitle = document.getElementById('modal-title');
    const modalPrompt = document.getElementById('modal-prompt');
  
    let actualResumeLink = ''; // 存储真实的简历链接
  
    if (resumeDownloadBtn && passwordModal && passwordInput && passwordSubmitBtn && passwordCloseBtn && passwordErrorMsg) {
      // 获取真实的简历链接并存储
      actualResumeLink = resumeDownloadBtn.getAttribute('data-resume-link');
      if(!actualResumeLink){
        console.error("Resume download link not found in data-resume-link attribute.");
        // 可以选择禁用按钮
        // resumeDownloadBtn.style.display = 'none';
        // return; // 如果没有链接，后续逻辑无意义
      }
  
  
      // 打开弹窗
      resumeDownloadBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 阻止默认的 href="#" 跳转
  
        // 获取当前语言的文本并更新弹窗
        modalTitle.textContent = configLoader.getConfig('profile', 'ui.passwordModal.title') || '需要密码';
        modalPrompt.textContent = configLoader.getConfig('profile', 'ui.passwordModal.prompt') || '请输入密码以下载简历:';
        passwordInput.placeholder = configLoader.getConfig('profile', 'ui.passwordModal.placeholder') || '输入密码';
        passwordSubmitBtn.textContent = configLoader.getConfig('profile', 'ui.passwordModal.submitButton') || '确认';
        passwordErrorMsg.textContent = ''; // 清空之前的错误信息
        passwordInput.value = ''; // 清空输入框
  
        passwordModal.classList.add('show');
        document.body.classList.add('modal-open'); // 防止背景滚动
        passwordInput.focus(); // 自动聚焦输入框
      });
  
      // 关闭弹窗 (通过关闭按钮)
      passwordCloseBtn.addEventListener('click', () => {
        passwordModal.classList.remove('show');
        document.body.classList.remove('modal-open');
      });
  
      // 关闭弹窗 (通过点击背景)
      passwordModal.addEventListener('click', (e) => {
        // 检查点击的是否是 modal 背景本身
        if (e.target === passwordModal) {
          passwordModal.classList.remove('show');
          document.body.classList.remove('modal-open');
        }
      });
  
      // 处理密码提交
      const handlePasswordSubmit = () => {
        const enteredPassword = passwordInput.value;
        const correctPassword = '8888'; // 你设置的固定密码
  
        if (enteredPassword === correctPassword) {
          // 密码正确
          passwordModal.classList.remove('show');
          document.body.classList.remove('modal-open');
          passwordErrorMsg.textContent = ''; // 清空错误信息
  
          // --- 执行下载 ---
           if (actualResumeLink) {
               // 尝试使用创建链接的方式强制下载
               const link = document.createElement('a');
               link.href = resourceManager.getDocumentPath(actualResumeLink); // 使用 resourceManager 获取完整路径
               // 从路径中提取文件名作为建议的文件名
               const filename = actualResumeLink.substring(actualResumeLink.lastIndexOf('/') + 1);
               link.download = filename || 'resume'; // 设置下载的文件名
               document.body.appendChild(link);
               link.click();
               document.body.removeChild(link); // 清理 DOM
           } else {
               console.error("Cannot download: Resume link is missing.");
               // 可以显示一个错误给用户
               passwordErrorMsg.textContent = '下载链接丢失，无法下载。'; // 或者使用翻译
               passwordModal.classList.add('show'); // 重新显示弹窗以示错误
               document.body.classList.add('modal-open');
           }
  
        } else {
          // 密码错误
          passwordErrorMsg.textContent = configLoader.getConfig('profile', 'ui.passwordModal.errorMessage') || '密码错误，请重试。';
          passwordInput.focus(); // 让用户重新输入
          passwordInput.value = ''; // 清空错误的密码
        }
      };
  
      // 点击提交按钮
      passwordSubmitBtn.addEventListener('click', handlePasswordSubmit);
  
      // 在输入框中按 Enter 键提交
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault(); // 阻止默认的回车行为（比如触发表单提交）
          handlePasswordSubmit();
        }
      });
    } else {
      console.warn('Password modal elements not found. Resume download password protection disabled.');
    }

  scrollLinks.forEach(link => {
    // 防止重复添加监听器 (如果 initInteractions 可能被多次调用)
    if (link.hasSmoothScrollListener) {
      return;
    }

    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');

      // 确保 targetId 不是 null 且确实是 # 开头 (虽然选择器已处理)
      if (!targetId || !targetId.startsWith('#') || targetId === '#') {
        return;
      }

      // 阻止链接的默认跳转行为
      e.preventDefault();
      // *** 阻止事件向上冒泡 ***
      e.stopPropagation();

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        const headerOffset = 70; // 与你的 CSS 中固定的 header 高度或偏移量一致
        const elementPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });

        // 如果点击的是移动菜单中的链接，则关闭菜单
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && mobileMenu.contains(link) && mobileMenu.classList.contains('active')) {
          mobileMenu.classList.remove('active');
        }
      } else {
        console.warn(`Smooth scroll target element not found for selector: ${targetId}`);
      }
    });

    link.hasSmoothScrollListener = true; // 标记已添加监听器
  });

  // 其他交互逻辑... (确保旧的表单提交逻辑已移除)
}
  


