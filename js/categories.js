/**
 * 对比模块类目配置
 */
const COMPARE_CATEGORIES = [
    { id: 'all', name: '全部', icon: '📋', description: '所有对比类目' },
    { id: 'life', name: '生活类', icon: '🏠', description: '日常消费、饮食与生活选择' },
    { id: 'app', name: '应用类', icon: '📲', description: '数码产品、软件与应用工具' },
    { id: 'method', name: '方法类', icon: '💡', description: '治疗方案、方法与流程对比' },
];

const COMPARE_MODULES = [
    {
        id: 'phones',
        title: '手机对比',
        category: 'app',
        href: 'phones.html',
        icon: '📱',
        iconClass: 'phone',
        description: '对比屏幕、处理器、内存、电池、摄像头等核心参数，绿色高亮最优项，红色标注劣势项。',
        keywords: ['手机', '数码', 'iPhone', 'Android', '华为', '小米', '处理器', '屏幕', '应用类'],
    },
    {
        id: 'beverages',
        title: '饮料对比',
        category: 'life',
        href: 'beverages.html',
        icon: '🥤',
        iconClass: 'beverage',
        description: '对比热量、糖分、咖啡因、钠含量等营养成分，帮你做出更健康的饮品选择。',
        keywords: ['饮料', '可乐', '咖啡', '茶', '糖分', '热量', '生活类', '饮食', '健康'],
    },
    {
        id: 'snoring',
        title: '止鼾方案对比',
        category: 'method',
        href: 'snoring.html',
        icon: '😴',
        iconClass: 'snoring',
        description: '对比呼吸机(CPAP/BiPAP)、口腔矫治器、鼻贴等方案的使用方式、有效率与适用人群。',
        keywords: ['止鼾', '呼吸机', 'CPAP', '睡眠', '健康', '方法类', '治疗', '缓解'],
    },
    {
        id: 'browsers',
        title: 'iOS 浏览器对比',
        category: 'app',
        href: 'browsers.html',
        icon: '🌐',
        iconClass: 'browser',
        description: '对比 Safari、Chrome、Firefox、Brave 等浏览器的隐私保护、扩展支持、同步与特色功能。',
        keywords: ['浏览器', 'iOS', 'Safari', 'Chrome', '隐私', '应用类', '软件', 'WebKit'],
    },
];

function getCategoryById(id) {
    return COMPARE_CATEGORIES.find(c => c.id === id);
}

function getCategoryName(id) {
    const cat = getCategoryById(id);
    return cat ? cat.name : '';
}

function getAllModules() {
    const builtInIds = new Set(COMPARE_MODULES.map(m => m.id));
    const custom = CustomModules.getAllCompareModules().filter(m => !builtInIds.has(m.id));
    return [...COMPARE_MODULES, ...custom];
}
