/**
 * 本地 JSON 读写：HTTP 加载 + localStorage 缓存 + 下载导出
 */
const JsonStore = (function () {
    const DATA_DIR = 'data/';
    const LS_PREFIX = 'breakinfo_json_';

    async function fetchJson(filename) {
        const res = await fetch(`${DATA_DIR}${filename}`);
        if (!res.ok) {
            throw new Error(`无法加载 ${DATA_DIR}${filename} (${res.status})`);
        }
        return res.json();
    }

    function getLocal(key) {
        try {
            const raw = localStorage.getItem(LS_PREFIX + key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function setLocal(key, value) {
        localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    }

    function clearLocal(key) {
        localStorage.removeItem(LS_PREFIX + key);
    }

    function download(filename, data, pretty = true) {
        const text = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
        const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    /** 写入 JSON：保存到 localStorage 并触发下载 */
    async function writeJson(filename, data, localKey) {
        setLocal(localKey || filename, data);
        download(filename, data);
        return 'download';
    }

    async function saveAndExport(filename, data, localKey) {
        return writeJson(filename, data, localKey);
    }

    return {
        DATA_DIR,
        fetchJson,
        getLocal,
        setLocal,
        clearLocal,
        download,
        writeJson,
        saveAndExport,
    };
})();
