// 配置加载器 - 负责加载和管理网站配置
class ConfigLoader {
  constructor(languageManager) {
    this.languageManager = languageManager;
    this.isLoaded = false;
    this.listeners = [];
    
    // 初始化时加载所有配置
    this.init();
  }

  // 初始化加载
  async init() {
    try {
      // 加载所有语言配置
      const success = await this.languageManager.loadAllTranslations();
      
      if (success) {
        this.isLoaded = true;
        this.notifyListeners();
      } else {
        console.error('配置加载失败');
      }
    } catch (error) {
      console.error('初始化配置加载器失败:', error);
    }
  }

  // 检查配置是否已加载
  isConfigLoaded() {
    return this.isLoaded;
  }

  // 获取配置内容
  getConfig(section, key = null) {
    if (!this.isLoaded) {
      console.warn('尝试在配置加载完成前获取配置');
      return key ? '' : {};
    }
    
    return this.languageManager.getTranslation(section, key);
  }

  // 添加配置加载完成监听器
  addLoadListener(callback) {
    this.listeners.push(callback);
    
    // 如果配置已加载，立即调用回调
    if (this.isLoaded) {
      callback();
    }
  }

  // 移除配置加载完成监听器
  removeLoadListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // 通知所有监听器
  notifyListeners() {
    this.listeners.forEach(callback => callback());
  }
}

// 导入语言管理器
import languageManager from './language-manager.js';

// 创建并导出配置加载器实例
const configLoader = new ConfigLoader(languageManager);
export default configLoader;
