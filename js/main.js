// 主要JavaScript功能

// DOM元素加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 设置当前年份
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // 导航菜单高亮
  highlightNavigation();
  
  // 移动端菜单切换
  setupMobileMenu();
  
  // 主题切换
  setupThemeToggle();
  
  // 语言切换
  setupLanguageToggle();
  
  // 经历标签页切换
  setupTabs();
  
  // 项目筛选
  setupProjectFilters();
  
  // 联系表单处理
  setupContactForm();
  
  // 滚动监听
  setupScrollListener();
});

// 导航菜单高亮
function highlightNavigation() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('#nav ul li a');
  
  window.addEventListener('scroll', function() {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
        current = section.getAttribute('id');
      }
    });
    
    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

// 移动端菜单切换
function setupMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const nav = document.getElementById('nav');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
      
      // 切换图标
      const icon = this.querySelector('i');
      if (icon.classList.contains('fa-bars')) {
        icon.classList.remove('fa-bars');
        icon.classList.add('fa-times');
      } else {
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      }
    });
    
    // 点击导航链接后关闭菜单
    const navLinks = document.querySelectorAll('#nav ul li a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
        const icon = mobileMenuToggle.querySelector('i');
        icon.classList.remove('fa-times');
        icon.classList.add('fa-bars');
      });
    });
  }
}

// 主题切换
function setupThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // 检查本地存储中的主题设置
  const currentTheme = localStorage.getItem('theme');
  if (currentTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
    updateThemeIcon(true);
  } else if (currentTheme === 'light') {
    document.body.setAttribute('data-theme', 'light');
    updateThemeIcon(false);
  } else {
    // 如果没有存储的主题，则使用系统偏好
    if (prefersDarkScheme.matches) {
      document.body.setAttribute('data-theme', 'dark');
      updateThemeIcon(true);
    }
  }
  
  // 主题切换按钮点击事件
  if (themeToggle) {
    themeToggle.addEventListener('click', function() {
      let theme;
      if (document.body.getAttribute('data-theme') === 'dark') {
        document.body.removeAttribute('data-theme');
        theme = 'light';
        updateThemeIcon(false);
      } else {
        document.body.setAttribute('data-theme', 'dark');
        theme = 'dark';
        updateThemeIcon(true);
      }
      localStorage.setItem('theme', theme);
    });
  }
  
  // 更新主题图标
  function updateThemeIcon(isDark) {
    const icon = themeToggle.querySelector('i');
    if (isDark) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    }
  }
}

// 语言切换
function setupLanguageToggle() {
  const languageToggle = document.getElementById('language-toggle');
  
  // 检查本地存储中的语言设置
  const currentLang = localStorage.getItem('language') || 'zh';
  
  // 语言切换按钮点击事件
  if (languageToggle) {
    languageToggle.addEventListener('click', function() {
      const currentLang = localStorage.getItem('language') || 'zh';
      const newLang = currentLang === 'zh' ? 'en' : 'zh';
      localStorage.setItem('language', newLang);
      
      // 在实际应用中，这里会切换页面上的文本
      // 简化版本中，我们只切换按钮文本
      const langText = languageToggle.querySelector('span');
      if (newLang === 'en') {
        langText.textContent = 'EN / 中';
      } else {
        langText.textContent = '中 / EN';
      }
      
      // 在实际应用中，这里会重新加载页面或更新所有文本
      // alert('语言已切换为: ' + (newLang === 'zh' ? '中文' : 'English'));
    });
  }
}

// 经历标签页切换
function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // 移除所有按钮的active类
      tabBtns.forEach(btn => btn.classList.remove('active'));
      
      // 添加当前按钮的active类
      this.classList.add('active');
      
      // 获取目标内容
      const target = this.getAttribute('data-target');
      
      // 隐藏所有内容
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach(content => content.classList.remove('active'));
      
      // 显示目标内容
      document.getElementById(target).classList.add('active');
    });
  });
}

// 项目筛选
function setupProjectFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');
  
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // 移除所有按钮的active类
      filterBtns.forEach(btn => btn.classList.remove('active'));
      
      // 添加当前按钮的active类
      this.classList.add('active');
      
      // 获取筛选类别
      const filter = this.getAttribute('data-filter');
      
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

// 联系表单处理
function setupContactForm() {
  const contactForm = document.getElementById('contact-form');
  
  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // 获取表单数据
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const message = document.getElementById('message').value;
      
      // 在实际应用中，这里会发送表单数据到服务器
      // 简化版本中，我们只显示一个提示
      alert(`感谢您的留言，${name}！\n我们会尽快回复您。`);
      
      // 重置表单
      contactForm.reset();
    });
  }
}

// 滚动监听
function setupScrollListener() {
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}
