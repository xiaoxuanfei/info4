/**
 * 从 info4 缓存或 data/*.json 加载内置对比数据
 */
const DataLoader = (function () {
    const cache = {};

    function clearCache(name) {
        if (name) delete cache[name];
        else Object.keys(cache).forEach(k => delete cache[k]);
    }

    async function load(name) {
        if (cache[name]) return cache[name];

        if (typeof Info4Store !== 'undefined') {
            await Info4Store.ensureLoaded();
            const fromInfo4 = Info4Store.getBuiltinItems(name);
            if (fromInfo4.length) {
                cache[name] = fromInfo4;
                return cache[name];
            }
        }

        const json = await JsonStore.fetchJson(`${name}.json`);
        const list = json.data ?? json;
        cache[name] = Array.isArray(list) ? list : [];
        return cache[name];
    }

    async function loadByIds(name, ids) {
        const all = await load(name);
        return ids.map(id => all.find(item => item.id === id)).filter(Boolean);
    }

    async function loadListFields(name, fields) {
        const all = await load(name);
        return all.map(item => {
            const row = { id: item.id, name: item.name, brand: item.brand, category: item.category, price: item.price };
            fields.forEach(f => {
                if (item[f] !== undefined) row[f] = item[f];
            });
            return row;
        });
    }

    return { load, loadByIds, loadListFields, clearCache };
})();
