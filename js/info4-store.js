/**
 * info4 统一数据：localStorage + data/info4.json 单文件
 */
const Info4Store = (function () {
    const LS_KEY = 'info4';
    const DATA_FILE = 'info4.json';
    const VERSION = 2;

    const BUILTIN_IDS = ['phones', 'beverages', 'snoring', 'browsers'];

    const BUILTIN_MODULES = [
        { id: 'phones', title: '手机对比', category: 'app' },
        { id: 'beverages', title: '饮料对比', category: 'life' },
        { id: 'snoring', title: '止鼾方案', category: 'method' },
        { id: 'browsers', title: 'iOS 浏览器对比', category: 'app' },
    ];

    let loadPromise = null;

    function emptyData() {
        return {
            version: VERSION,
            updatedAt: 0,
            builtin: {
                phones: [],
                beverages: [],
                snoring: [],
                browsers: [],
            },
            customModules: [],
        };
    }

    function normalizeData(raw) {
        const base = emptyData();
        if (!raw || typeof raw !== 'object') return base;

        if (raw.files) {
            const migrated = emptyData();
            BUILTIN_IDS.forEach(id => {
                const file = `${id}.json`;
                const j = raw.files[file];
                if (j) migrated.builtin[id] = extractList(j);
            });
            const cm = raw.files['custom_modules.json'];
            if (cm) migrated.customModules = extractList(cm);
            return migrated;
        }

        if (raw.builtin || raw.customModules) {
            const d = emptyData();
            BUILTIN_IDS.forEach(id => {
                if (Array.isArray(raw.builtin?.[id])) d.builtin[id] = raw.builtin[id];
            });
            if (Array.isArray(raw.customModules)) d.customModules = raw.customModules;
            return d;
        }

        return base;
    }

    function loadData() {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            const normalized = normalizeData(parsed);
            if (parsed.files && !parsed.builtin) {
                saveData(normalized);
            }
            return normalized;
        } catch {
            return null;
        }
    }

    function saveData(data) {
        const next = normalizeData(data);
        next.version = VERSION;
        next.updatedAt = Date.now();
        localStorage.setItem(LS_KEY, JSON.stringify(next));
        invalidateCaches();
        return next;
    }

    function invalidateCaches() {
        if (typeof DataLoader !== 'undefined' && DataLoader.clearCache) {
            DataLoader.clearCache();
        }
    }

    function extractList(json) {
        if (!json) return [];
        if (Array.isArray(json)) return json;
        const list = json.data ?? json;
        return Array.isArray(list) ? list : [];
    }

    async function fetchFromServer() {
        return JsonStore.fetchJson(DATA_FILE);
    }

    function hasAnyData(data) {
        if (!data) return false;
        const hasBuiltin = BUILTIN_IDS.some(id => (data.builtin?.[id]?.length || 0) > 0);
        return hasBuiltin || (data.customModules?.length || 0) > 0;
    }

    async function initFromServer(force = false) {
        const cached = loadData();
        if (!force && cached && hasAnyData(cached)) return cached;

        try {
            const server = await fetchFromServer();
            const data = normalizeData(server);
            return saveData(data);
        } catch (err) {
            console.warn('加载 data/info4.json 失败:', err.message);
            if (loadData()) return loadData();
            return saveData(emptyData());
        }
    }

    function ensureLoaded() {
        const cached = loadData();
        if (cached && hasAnyData(cached)) return Promise.resolve(cached);
        if (!loadPromise) {
            loadPromise = initFromServer(true).finally(() => { loadPromise = null; });
        }
        return loadPromise;
    }

    function getData() {
        return loadData();
    }

    function normalizeId(id) {
        const n = Number(id);
        return Number.isFinite(n) ? n : id;
    }

    function getBuiltinItems(moduleId) {
        const data = loadData();
        if (!data?.builtin?.[moduleId]) return [];
        return data.builtin[moduleId];
    }

    function setBuiltinItems(moduleId, items) {
        const data = loadData() || emptyData();
        if (!BUILTIN_IDS.includes(moduleId)) throw new Error('未知内置模块');
        data.builtin[moduleId] = items;
        saveData(data);
    }

    function addBuiltinItem(moduleId, item) {
        const items = getBuiltinItems(moduleId);
        const numericIds = items.map(i => Number(i.id)).filter(Number.isFinite);
        const maxId = numericIds.length ? Math.max(...numericIds) : 0;
        const newItem = { ...item };
        if (newItem.id == null || newItem.id === '') newItem.id = maxId + 1;
        else newItem.id = normalizeId(newItem.id);
        if (items.some(i => i.id === newItem.id)) throw new Error('ID 已存在');
        items.push(newItem);
        setBuiltinItems(moduleId, items);
        return newItem;
    }

    function updateBuiltinItem(moduleId, id, patch) {
        const items = getBuiltinItems(moduleId);
        const normId = normalizeId(id);
        const idx = items.findIndex(i => i.id === normId || i.id === id);
        if (idx < 0) throw new Error('条目不存在');
        items[idx] = { ...items[idx], ...patch, id: items[idx].id };
        setBuiltinItems(moduleId, items);
        return items[idx];
    }

    function deleteBuiltinItem(moduleId, id) {
        const items = getBuiltinItems(moduleId);
        const normId = normalizeId(id);
        const next = items.filter(i => i.id !== normId && i.id !== id);
        if (next.length === items.length) throw new Error('条目不存在');
        setBuiltinItems(moduleId, next);
    }

    function getBuiltinItem(moduleId, id) {
        const normId = normalizeId(id);
        return getBuiltinItems(moduleId).find(i => i.id === normId || i.id === id) || null;
    }

    function getCustomModules() {
        const data = loadData();
        return data?.customModules || [];
    }

    function setCustomModules(modules) {
        const data = loadData() || emptyData();
        data.customModules = Array.isArray(modules) ? modules : [];
        saveData(data);
        syncCustomModulesLocal(modules);
    }

    function syncCustomModulesLocal(modules) {
        try {
            localStorage.setItem('breakinfo_custom_modules', JSON.stringify(modules));
            JsonStore.setLocal('custom_modules', modules);
        } catch { /* ignore */ }
    }

    function getCustomModule(id) {
        return getCustomModules().find(m => m.id === id) || null;
    }

    function saveCustomModule(module) {
        const all = getCustomModules().filter(m => m.id !== module.id);
        all.push(module);
        setCustomModules(all);
        return module;
    }

    function deleteCustomModule(id) {
        const before = getCustomModules().length;
        const next = getCustomModules().filter(m => m.id !== id);
        if (next.length === before) throw new Error('模块不存在');
        setCustomModules(next);
    }

    function getCustomItem(moduleId, id) {
        const normId = normalizeId(id);
        const mod = getCustomModule(moduleId);
        return (mod?.config?.items || []).find(i => i.id === normId || i.id === id) || null;
    }

    function getItem(moduleId, type, id) {
        return type === 'builtin' ? getBuiltinItem(moduleId, id) : getCustomItem(moduleId, id);
    }

    function makeModuleId() {
        return `custom-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    }

    function createCustomModule({ title, category, itemLabel, description, icon }) {
        const trimmed = (title || '').trim();
        if (!trimmed) throw new Error('请填写模块名称');
        const id = makeModuleId();
        const label = (itemLabel || trimmed).replace(/对比$/, '');
        const moduleTitle = trimmed.endsWith('对比') ? trimmed : `${trimmed}对比`;
        const module = {
            id,
            custom: true,
            title: moduleTitle,
            category: category || 'life',
            href: `compare.html?id=${id}`,
            icon: icon || '📋',
            iconClass: 'custom',
            description: description || `对比${label}的相关参数`,
            keywords: [label, moduleTitle, category || 'life'],
            createdAt: Date.now(),
            source: 'info4',
            config: {
                itemLabel: label,
                unitLabel: '款',
                fields: [
                    { key: 'name', label: '名称' },
                    { key: 'brand', label: '品牌' },
                    { key: 'price', label: '价格', format: 'currency' },
                    { key: 'category', label: '类型' },
                ],
                numericCompare: { price: 'min' },
                sortConfig: {
                    defaultRules: [{ key: 'price', order: 'asc' }],
                    formula: null,
                },
                items: [],
            },
        };
        saveCustomModule(module);
        return module;
    }

    function updateCustomModuleMeta(id, patch) {
        const mod = getCustomModule(id);
        if (!mod) throw new Error('模块不存在');
        const { title, category, description, icon, itemLabel } = patch;
        const next = { ...mod };
        if (title) next.title = title.endsWith('对比') ? title : `${title}对比`;
        if (category) next.category = category;
        if (description !== undefined) next.description = description;
        if (icon) next.icon = icon;
        if (itemLabel) next.config = { ...next.config, itemLabel };
        saveCustomModule(next);
        return next;
    }

    function getCustomModuleItems(moduleId) {
        return getCustomModule(moduleId)?.config?.items || [];
    }

    function addCustomItem(moduleId, item) {
        const mod = getCustomModule(moduleId);
        if (!mod) throw new Error('模块不存在');
        if (!mod.config) mod.config = {};
        const items = mod.config.items || [];
        const numericIds = items.map(i => Number(i.id)).filter(Number.isFinite);
        const maxId = numericIds.length ? Math.max(...numericIds) : 0;
        const newItem = { ...item };
        if (newItem.id == null || newItem.id === '') newItem.id = maxId + 1;
        else newItem.id = normalizeId(newItem.id);
        if (items.some(i => i.id === newItem.id)) throw new Error('ID 已存在');
        items.push(newItem);
        mod.config.items = items;
        saveCustomModule(mod);
        return newItem;
    }

    function updateCustomItem(moduleId, id, patch) {
        const mod = getCustomModule(moduleId);
        if (!mod?.config) throw new Error('模块不存在');
        const items = mod.config.items || [];
        const normId = normalizeId(id);
        const idx = items.findIndex(i => i.id === normId || i.id === id);
        if (idx < 0) throw new Error('条目不存在');
        items[idx] = { ...items[idx], ...patch, id: items[idx].id };
        mod.config.items = items;
        saveCustomModule(mod);
        return items[idx];
    }

    function deleteCustomItem(moduleId, id) {
        const mod = getCustomModule(moduleId);
        if (!mod?.config) throw new Error('模块不存在');
        const normId = normalizeId(id);
        const items = mod.config.items || [];
        const next = items.filter(i => i.id !== normId && i.id !== id);
        if (next.length === items.length) throw new Error('条目不存在');
        mod.config.items = next;
        saveCustomModule(mod);
    }

    function listModules() {
        const builtIn = BUILTIN_MODULES.map(m => ({
            id: m.id,
            title: m.title,
            type: 'builtin',
            file: DATA_FILE,
            category: m.category,
            itemCount: getBuiltinItems(m.id).length,
        }));
        const custom = getCustomModules().map(m => ({
            id: m.id,
            title: m.title || m.id,
            type: 'custom',
            file: DATA_FILE,
            category: m.category,
            itemCount: (m.config?.items || []).length,
        }));
        return [...builtIn, ...custom];
    }

    function exportToCode() {
        const data = loadData();
        if (!data) throw new Error('info4 缓存为空');
        JsonStore.download(DATA_FILE, data);
        return DATA_FILE;
    }

    function exportBackup() {
        const data = loadData();
        if (!data) throw new Error('info4 缓存为空');
        JsonStore.download('info4-backup.json', data);
    }

    function clearCache() {
        localStorage.removeItem(LS_KEY);
        invalidateCaches();
    }

    function getStats() {
        const data = loadData();
        if (!data) return null;
        const modules = listModules();
        return {
            updatedAt: data.updatedAt,
            fileCount: 1,
            moduleCount: modules.length,
            itemCount: modules.reduce((s, m) => s + m.itemCount, 0),
        };
    }

    return {
        LS_KEY,
        DATA_FILE,
        BUILTIN_MODULES,
        ensureLoaded,
        initFromServer,
        getData,
        getBuiltinItems,
        setBuiltinItems,
        addBuiltinItem,
        updateBuiltinItem,
        deleteBuiltinItem,
        getBuiltinItem,
        getCustomModules,
        setCustomModules,
        getCustomModule,
        saveCustomModule,
        deleteCustomModule,
        getCustomItem,
        getItem,
        createCustomModule,
        updateCustomModuleMeta,
        getCustomModuleItems,
        addCustomItem,
        updateCustomItem,
        deleteCustomItem,
        listModules,
        exportToCode,
        exportBackup,
        clearCache,
        getStats,
        invalidateCaches,
        // 兼容旧调用
        exportAllToCode() { return exportToCode() ? 1 : 0; },
        exportFile() { return exportToCode(); },
    };
})();
