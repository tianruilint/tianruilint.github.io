// 资源管理器 - 负责管理网站资源文件
class ResourceManager {
  constructor() {
    this.resourcesBasePath = './resources/';
    this.defaultProfileImage = this.resourcesBasePath + 'images/profile/default-avatar.jpg';
    this.defaultProjectImage = this.resourcesBasePath + 'images/projects/default-project.jpg';
  }

  // 获取项目图片路径，如果不存在则返回默认图片
  getProjectImagePath(imagePath) {
    if (!imagePath) {
      return this.defaultProjectImage;
    }
    
    // 如果已经是完整路径，直接返回
    if (imagePath.startsWith('./') || imagePath.startsWith('/') || imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // 否则拼接基础路径
    return this.resourcesBasePath + 'images/projects/' + imagePath;
  }

  // 获取个人资料图片路径
  getProfileImagePath(imageName) {
    if (!imageName) {
      return this.defaultProfileImage;
    }
    
    // 如果已经是完整路径，直接返回
    if (imageName.startsWith('./') || imageName.startsWith('/') || imageName.startsWith('http')) {
      return imageName;
    }
    
    // 否则拼接基础路径
    return this.resourcesBasePath + 'images/profile/' + imageName;
  }

  // 获取文档资源路径
  getDocumentPath(documentName) {
    if (!documentName) {
      return '';
    }
    
    // 如果已经是完整路径，直接返回
    if (documentName.startsWith('./') || documentName.startsWith('/') || documentName.startsWith('http')) {
      return documentName;
    }
    
    // 否则拼接基础路径
    return this.resourcesBasePath + 'documents/' + documentName;
  }

  // 检查资源是否存在
  async resourceExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`检查资源存在性失败: ${url}`, error);
      return false;
    }
  }

  // 预加载关键资源
  async preloadCriticalResources(projectsConfig) {
    const imagesToPreload = [];
    
    // 添加项目图片
    if (projectsConfig && projectsConfig.items) {
      projectsConfig.items.forEach(project => {
        if (project.image) {
          imagesToPreload.push(this.getProjectImagePath(project.image));
        }
      });
    }
    
    // 预加载图片
    imagesToPreload.forEach(imageSrc => {
      const img = new Image();
      img.src = imageSrc;
    });
  }
}

// 创建并导出资源管理器实例
const resourceManager = new ResourceManager();
export default resourceManager;
