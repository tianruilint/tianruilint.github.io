// 语言管理器 - 负责加载和切换语言内容
class LanguageManager {
  constructor() {
    this.currentLanguage = this.getInitialLanguage();
    this.translations = {
      zh: {},
      en: {}
    };
    this.listeners = [];
  }

  // 获取初始语言设置
  getInitialLanguage() {
    // 尝试从本地存储获取语言设置
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
      return savedLanguage;
    }
    
    // 尝试从浏览器语言设置获取
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('zh')) {
      return 'zh';
    }
    
    // 默认返回中文
    return 'zh';
  }

  // 加载所有语言配置文件
  async loadAllTranslations() {
    try {
      // 加载个人资料配置
      const zhProfile = await this.fetchJson('./content/zh/profile.json');
      const enProfile = await this.fetchJson('./content/en/profile.json');
      
      // 加载技能配置
      const zhSkills = await this.fetchJson('./content/zh/skills.json');
      const enSkills = await this.fetchJson('./content/en/skills.json');
      
      // 加载经历配置
      const zhExperience = await this.fetchJson('./content/zh/experience.json');
      const enExperience = await this.fetchJson('./content/en/experience.json');
      
      // 加载项目配置
      const zhProjects = await this.fetchJson('./content/zh/projects.json');
      const enProjects = await this.fetchJson('./content/en/projects.json');
      
      // 存储翻译内容
      this.translations.zh = {
        profile: zhProfile,
        skills: zhSkills,
        experience: zhExperience,
        projects: zhProjects
      };
      
      this.translations.en = {
        profile: enProfile,
        skills: enSkills,
        experience: enExperience,
        projects: enProjects
      };
      
      // 通知所有监听器语言数据已加载
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('加载语言配置文件失败:', error);
      return false;
    }
  }

  // 获取JSON文件
  async fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  }

  // 切换语言
  switchLanguage() {
    this.currentLanguage = this.currentLanguage === 'zh' ? 'en' : 'zh';
    localStorage.setItem('language', this.currentLanguage);
    this.notifyListeners();
  }

  // 获取当前语言
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // 获取翻译内容
  getTranslation(section, key = null) {
    const translations = this.translations[this.currentLanguage];
    
    if (!translations || !translations[section]) {
      console.warn(`Translation not found for section: ${section}`);
      return key ? '' : {};
    }
    
    if (key === null) {
      return translations[section];
    }
    
    // 处理嵌套键，如 "contact.email"
    if (key.includes('.')) {
      const keys = key.split('.');
      let value = translations[section];
      
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          console.warn(`Translation key not found: ${section}.${key}`);
          return '';
        }
      }
      
      return value;
    }
    
    if (translations[section][key] === undefined) {
      console.warn(`Translation key not found: ${section}.${key}`);
      return '';
    }
    
    return translations[section][key];
  }

  // 添加语言变化监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除语言变化监听器
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentLanguage));
  }
}

// 创建并导出语言管理器实例
const languageManager = new LanguageManager();
export default languageManager;
