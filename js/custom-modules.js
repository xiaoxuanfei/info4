/**
 * 自定义对比模块：本地模板与 info4 同步
 */
const CustomModules = (function () {
    const STORAGE_KEY = 'breakinfo_custom_modules';

    const ICON_MAP = [
        { test: /自行车|公路车|山地车|单车|骑行/, icon: '🚲' },
        { test: /汽车|轿车|SUV|MPV|新能源/, icon: '🚗' },
        { test: /摩托车|机车/, icon: '🏍️' },
        { test: /变速器|套件|飞轮|链条|刹车|配件|零件/, icon: '⚙️' },
        { test: /手机|数码|电脑|平板|耳机|音箱|音响/, icon: '📱' },
        { test: /耳机|耳麦|TWS|头戴/, icon: '🎧' },
        { test: /软件|浏览器|应用|App|工具/, icon: '💻' },
        { test: /饮料|食品|饮食/, icon: '🥤' },
        { test: /方法|方案|治疗|课程/, icon: '💡' },
    ];

    const TEMPLATES = {
        bicycle: {
            fields: [
                { key: 'brand', label: '品牌' },
                { key: 'category', label: '类型' },
                { key: 'price', label: '价格', format: 'currency' },
                { key: 'frame_material', label: '车架材质' },
                { key: 'weight', label: '重量', format: 'kg' },
                { key: 'speed', label: '速别', format: 'speed' },
                { key: 'wheel_size', label: '轮径', format: 'inch' },
                { key: 'origin', label: '产地' },
            ],
            numericCompare: { price: 'min', weight: 'min', speed: 'max' },
            formula: {
                default: '(speed * 50 + 10000 / weight) / price * 100',
                hint: '默认：速别与轻量综合/价格×100。变量: price, weight, speed',
                variables: ['price', 'weight', 'speed'],
            },
            defaultRules: [{ key: 'price', order: 'asc' }, { key: 'weight', order: 'asc' }],
            sampleBrands: ['Giant 捷安特', 'Trek 崔克', 'Merida 美利达', 'Specialized', 'Cannondale'],
            sampleNames: ['TCR Advanced', 'Domane SL', 'Scultura', 'Allez Sport', 'CAAD13'],
            sampleCategories: ['公路车', '山地车', 'Gravel', '城市通勤', '折叠车'],
            genExtra: (i) => ({
                frame_material: ['碳纤维', '铝合金', '钢架', '钛合金'][i % 4],
                weight: 7.5 + i * 0.8,
                speed: 18 + (i % 4) * 2,
                wheel_size: [26, 27.5, 28, 29][i % 4],
                origin: ['中国台湾', '美国', '日本', '德国', '中国'][i % 5],
            }),
        },
        automobile: {
            fields: [
                { key: 'brand', label: '品牌' },
                { key: 'category', label: '级别' },
                { key: 'price', label: '指导价', format: 'currency' },
                { key: 'engine', label: '动力' },
                { key: 'power', label: '马力', format: 'hp' },
                { key: 'fuel_consumption', label: '油耗', format: 'l100km' },
                { key: 'range', label: '续航', format: 'km' },
                { key: 'seats', label: '座位', format: 'seats' },
                { key: 'origin', label: '产地' },
            ],
            numericCompare: { price: 'min', power: 'max', fuel_consumption: 'min', range: 'max' },
            formula: {
                default: '(power + range / 10) / (price / 10000 + fuel_consumption)',
                hint: '默认：动力续航/价格油耗。变量: price, power, fuel_consumption, range',
                variables: ['price', 'power', 'fuel_consumption', 'range'],
            },
            defaultRules: [{ key: 'price', order: 'asc' }, { key: 'power', order: 'desc' }],
            sampleBrands: ['Toyota 丰田', 'Honda 本田', 'Tesla', 'BYD 比亚迪', 'BMW 宝马'],
            sampleNames: ['Camry', 'Accord', 'Model 3', '汉 EV', '3 Series'],
            sampleCategories: ['轿车', 'SUV', 'MPV', '纯电', '混动'],
            genExtra: (i) => ({
                engine: ['2.0L 自然吸气', '1.5T 涡轮', '纯电双电机', '1.8L 混动', '2.0T 四驱'][i % 5],
                power: 150 + i * 35,
                fuel_consumption: 4.5 + i * 0.6,
                range: 500 + i * 80,
                seats: [5, 5, 5, 7, 5][i % 5],
                origin: ['日本', '美国', '中国', '德国', '韩国'][i % 5],
            }),
        },
        component: {
            fields: [
                { key: 'brand', label: '品牌' },
                { key: 'category', label: '系列' },
                { key: 'price', label: '价格', format: 'currency' },
                { key: 'speed', label: '速别', format: 'speed' },
                { key: 'weight', label: '重量', format: 'g' },
                { key: 'compatibility', label: '兼容性' },
                { key: 'material', label: '材质' },
                { key: 'origin', label: '产地' },
            ],
            numericCompare: { price: 'min', speed: 'max', weight: 'min' },
            formula: {
                default: 'speed * 100 / (price + weight / 50)',
                hint: '默认：速别/价格重量。变量: price, speed, weight',
                variables: ['price', 'speed', 'weight'],
            },
            defaultRules: [{ key: 'speed', order: 'desc' }, { key: 'price', order: 'asc' }],
            sampleBrands: ['Shimano 禧玛诺', 'SRAM 速联', 'Campagnolo', 'Microshift', 'Sensah'],
            sampleNames: ['105 R7000', 'Rival AXS', 'Chorus', 'R9', 'SRX'],
            sampleCategories: ['公路', 'Gravel', '山地', '入门', '竞赛'],
            genExtra: (i) => ({
                speed: 9 + (i % 3) * 3,
                weight: 220 + i * 15,
                compatibility: ['11速公路', '12速公路', '10速山地', 'Gravel', '通用'][i % 5],
                material: ['铝合金', '碳纤维', '钢', '钛合金', '复合材料'][i % 5],
                origin: ['日本', '美国', '意大利', '中国台湾', '中国'][i % 5],
            }),
        },
        method: {
            fields: [
                { key: 'category', label: '类型' },
                { key: 'price', label: '费用', format: 'currency' },
                { key: 'duration', label: '周期', format: 'text' },
                { key: 'difficulty', label: '难度', format: 'score' },
                { key: 'effectiveness', label: '效果', format: 'percent' },
                { key: 'suitable_for', label: '适用人群' },
                { key: 'steps', label: '要点' },
            ],
            numericCompare: { price: 'min', difficulty: 'min', effectiveness: 'max' },
            formula: {
                default: 'effectiveness * 10 / (price + difficulty * 100)',
                hint: '默认：效果/费用难度。变量: price, difficulty, effectiveness',
                variables: ['price', 'difficulty', 'effectiveness'],
            },
            defaultRules: [{ key: 'effectiveness', order: 'desc' }, { key: 'price', order: 'asc' }],
            sampleBrands: ['入门方案', '进阶方案', '专业方案', '线上课程', '线下培训'],
            sampleNames: ['基础版', '标准版', '高级版', '旗舰版', '定制版'],
            sampleCategories: ['自学', '跟练', '一对一', '团体', '混合'],
            genExtra: (i) => ({
                duration: ['1周', '2-4周', '1-3月', '6月+', '长期'][i % 5],
                difficulty: 2 + (i % 4),
                effectiveness: 60 + i * 7,
                suitable_for: ['初学者', '有一定基础', '进阶用户', '专业人士', '通用'][i % 5],
                steps: ['步骤清晰', '需坚持练习', '配合工具', '需导师指导', '可碎片化学习'][i % 5],
            }),
        },
        product: {
            fields: [
                { key: 'brand', label: '品牌' },
                { key: 'category', label: '类别' },
                { key: 'price', label: '价格', format: 'currency' },
                { key: 'spec', label: '规格' },
                { key: 'weight', label: '重量', format: 'kg' },
                { key: 'rating', label: '评分', format: 'score' },
                { key: 'origin', label: '产地' },
            ],
            numericCompare: { price: 'min', weight: 'min', rating: 'max' },
            formula: {
                default: 'rating * 100 / price',
                hint: '默认：评分/价格。变量: price, weight, rating',
                variables: ['price', 'weight', 'rating'],
            },
            defaultRules: [{ key: 'rating', order: 'desc' }, { key: 'price', order: 'asc' }],
            sampleBrands: ['品牌 A', '品牌 B', '品牌 C', '品牌 D', '品牌 E'],
            sampleNames: ['标准款', '进阶款', '专业款', '旗舰款', '经济款'],
            sampleCategories: ['入门', '中端', '高端', '旗舰', '经典'],
            genExtra: (i) => ({
                spec: ['标准版', 'Pro 版', 'Max 版', 'Lite 版', 'Plus 版'][i % 5],
                weight: 1 + i * 0.3,
                rating: 7 + (i % 3),
                origin: ['中国', '日本', '德国', '美国', '韩国'][i % 5],
            }),
        },
    };

    const TEMPLATE_DETECT = [
        { id: 'component', test: /变速器|套件|飞轮|链条|刹车|曲柄|配件|零件|轮组|手变/ },
        { id: 'bicycle', test: /自行车|公路车|山地车|单车|骑行|BMX|折叠车/ },
        { id: 'automobile', test: /汽车|轿车|SUV|MPV|新能源|电动车(?!自行)|越野/ },
        { id: 'method', test: /方法|方案|治疗|课程|技巧|流程|教程/ },
        { id: 'product', test: /.*/ },
    ];

    function detectTemplateId(name) {
        const hit = TEMPLATE_DETECT.find(t => t.test.test(name));
        return hit ? hit.id : 'product';
    }

    function detectCategory(name, templateId) {
        if (/方法|方案|治疗|课程|技巧|流程|教程/.test(name) || templateId === 'method') return 'method';
        if (/软件|浏览器|应用|App|工具|手机|数码|电脑|耳机|音箱|音响|电子/.test(name)) return 'app';
        return 'life';
    }

    function detectIcon(name) {
        const hit = ICON_MAP.find(m => m.test.test(name));
        return hit ? hit.icon : '📦';
    }

    function makeModuleId() {
        return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    function itemLabelFromName(name) {
        const trimmed = name.trim();
        if (/对比$/.test(trimmed)) return trimmed.replace(/对比$/, '');
        return trimmed;
    }

    function generateSampleItems(template, count = 5) {
        const items = [];
        for (let i = 0; i < count; i++) {
            const brand = template.sampleBrands[i % template.sampleBrands.length];
            const baseName = template.sampleNames[i % template.sampleNames.length];
            items.push({
                id: i + 1,
                name: `${brand.split(' ')[0]} ${baseName}`,
                brand,
                category: template.sampleCategories[i % template.sampleCategories.length],
                price: Math.round((1999 + i * 1200 + Math.random() * 500) * 100) / 100,
                ...template.genExtra(i),
            });
        }
        return items;
    }

    function buildPreview(name, categoryOverride) {
        const label = itemLabelFromName(name);
        if (!label) return null;

        const templateId = detectTemplateId(label);
        const template = TEMPLATES[templateId];
        const category = categoryOverride || detectCategory(label, templateId);
        const icon = detectIcon(label);
        const title = label.endsWith('对比') ? label : `${label}对比`;
        const sampleItems = generateSampleItems(template, 5);

        return {
            templateId,
            title,
            itemLabel: label,
            category,
            icon,
            description: `对比${label}的品牌、价格、规格等核心参数，支持多级排序与性价比公式。`,
            keywords: [label, title, getCategoryName(category), ...label.split(/\s+/).filter(Boolean)],
            fields: template.fields,
            numericCompare: template.numericCompare,
            sortConfig: {
                defaultRules: template.defaultRules,
                formula: template.formula,
            },
            sampleCount: sampleItems.length,
            sampleItems,
        };
    }

    function loadAllSync() {
        if (typeof Info4Store !== 'undefined' && Info4Store.getCustomModules) {
            return Info4Store.getCustomModules();
        }
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    async function syncFromFile() {
        if (typeof Info4Store === 'undefined') {
            return loadAllSync().map(toCompareModule);
        }
        await Info4Store.ensureLoaded();
        const modules = Info4Store.getCustomModules();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
        return modules.map(toCompareModule);
    }

    async function persistAll(modules) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(modules));
        if (typeof Info4Store !== 'undefined') {
            Info4Store.setCustomModules(modules);
        }
    }

    async function fetchModule(id) {
        await syncFromFile();
        return getById(id);
    }

    async function fetchItems(moduleId, ids) {
        const mod = await fetchModule(moduleId);
        if (!mod) throw new Error('模块不存在');
        const items = mod.config?.items || [];
        return ids.map(id => items.find(i => i.id === id)).filter(Boolean);
    }

    async function saveModule(module) {
        const all = loadAllSync().filter(m => m.id !== module.id);
        all.push(module);
        await persistAll(all);
        return module;
    }

    async function deleteModule(id) {
        const before = loadAllSync();
        const all = before.filter(m => m.id !== id);
        if (all.length === before.length) {
            throw new Error('对比项不存在');
        }
        await persistAll(all);
    }

    async function createModule(name, categoryOverride) {
        return createModuleLocal(name, categoryOverride);
    }

    async function createModuleLocal(name, categoryOverride) {
        const preview = buildPreview(name, categoryOverride);
        if (!preview) return null;

        const template = TEMPLATES[preview.templateId];
        const id = makeModuleId();
        const items = generateSampleItems(template, preview.sampleCount);

        const module = {
            id,
            custom: true,
            title: preview.title,
            category: preview.category,
            href: `compare.html?id=${id}`,
            icon: preview.icon,
            iconClass: 'custom',
            description: preview.description,
            keywords: preview.keywords,
            createdAt: Date.now(),
            source: 'template',
            config: {
                itemLabel: preview.itemLabel,
                unitLabel: '款',
                fields: preview.fields,
                numericCompare: preview.numericCompare,
                sortConfig: preview.sortConfig,
                items,
            },
        };

        return saveModule(module);
    }

    function loadAll() {
        return loadAllSync();
    }

    async function saveAll(modules) {
        await persistAll(modules);
    }

    function getById(id) {
        return loadAllSync().find(m => m.id === id) || null;
    }

    function toCompareModule(custom) {
        return {
            id: custom.id,
            title: custom.title,
            category: custom.category,
            href: custom.href,
            icon: custom.icon,
            iconClass: custom.iconClass || 'custom',
            description: custom.description,
            keywords: custom.keywords,
            custom: true,
        };
    }

    function getAllCompareModules() {
        return loadAll().map(toCompareModule);
    }

    function applyFieldFormat(field, raw) {
        if (raw === undefined || raw === null || raw === '') return '-';
        const type = field.format || 'text';
        const v = raw;
        switch (type) {
            case 'currency': return '¥' + parseFloat(v).toFixed(2);
            case 'kg': return parseFloat(v).toFixed(1) + ' kg';
            case 'g': return parseFloat(v).toFixed(0) + ' g';
            case 'ml': return v + ' ml';
            case 'inch': return v + '"';
            case 'hp': return v + ' hp';
            case 'l100km': return parseFloat(v).toFixed(1) + ' L/100km';
            case 'km': return v + ' km';
            case 'speed': return v + ' 速';
            case 'seats': return v + ' 座';
            case 'percent': return v + '%';
            case 'score': return v + ' / 10';
            default:
                if (typeof v === 'boolean') return v ? '是' : '否';
                return String(v);
        }
    }

    function resolveRuntimeFields(storedFields) {
        return storedFields.map(f => ({
            key: f.key,
            label: f.label,
            format: v => applyFieldFormat(f, v),
        }));
    }

    return {
        buildPreview,
        createModule,
        fetchModule,
        fetchItems,
        syncFromFile,
        deleteModule,
        loadAll,
        getById,
        getAllCompareModules,
        resolveRuntimeFields,
        applyFieldFormat,
        createModuleLocal,
        saveAll,
    };
})();
