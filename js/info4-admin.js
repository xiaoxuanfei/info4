/**
 * info4 管理页：模块与条目完整增删改查
 */
(function () {
    const statsEl = document.getElementById('info4Stats');
    const statusEl = document.getElementById('info4Status');
    const moduleListEl = document.getElementById('moduleList');
    const moduleTitleEl = document.getElementById('moduleTitle');
    const moduleActionsEl = document.getElementById('moduleActions');
    const searchRowEl = document.getElementById('searchRow');
    const itemSearchEl = document.getElementById('itemSearch');
    const searchCountEl = document.getElementById('searchCount');
    const itemsPanelEl = document.getElementById('itemsPanel');
    const itemFormPanel = document.getElementById('itemFormPanel');
    const itemJsonPanel = document.getElementById('itemJsonPanel');
    const itemJsonInput = document.getElementById('itemJsonInput');
    const itemModalTitle = document.getElementById('itemModalTitle');
    const viewItemBody = document.getElementById('viewItemBody');
    const viewItemTitle = document.getElementById('viewItemTitle');
    const viewModuleBody = document.getElementById('viewModuleBody');
    const moduleModalTitle = document.getElementById('moduleModalTitle');

    let activeModule = null;
    let editingItemId = null;
    let editingModuleMode = 'add';
    let viewingItemId = null;
    let itemSearchKeyword = '';

    function setStatus(text, type = 'info') {
        statusEl.textContent = text;
        statusEl.className = `settings-status settings-status-${type}`;
    }

    function formatTime(ts) {
        if (!ts) return '未知';
        return new Date(ts).toLocaleString('zh-CN');
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function openModal(id) {
        const el = document.getElementById(id);
        el.classList.add('open');
        el.setAttribute('aria-hidden', 'false');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true');
    }

    document.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', () => closeModal(btn.dataset.close));
    });

    function renderStats() {
        const stats = Info4Store.getStats();
        if (!stats) {
            statsEl.innerHTML = '<p>info4 缓存为空，请点击「从 data/ 重新加载」</p>';
            return;
        }
        statsEl.innerHTML = `
            <span><strong>${stats.moduleCount}</strong> 个模块</span>
            <span><strong>${stats.itemCount}</strong> 条对比数据</span>
            <span><strong>${stats.fileCount}</strong> 个文件</span>
            <span>更新于 ${formatTime(stats.updatedAt)}</span>`;
    }

    function getItems(module) {
        if (!module) return [];
        if (module.type === 'builtin') {
            return Info4Store.getBuiltinItems(module.id);
        }
        const mod = Info4Store.getCustomModule(module.id);
        return mod?.config?.items || [];
    }

    function getFieldDefs(module) {
        if (module.type === 'custom') {
            const mod = Info4Store.getCustomModule(module.id);
            const fields = mod?.config?.fields || [];
            if (fields.length) return fields;
        }
        const items = getItems(module);
        const keys = new Set();
        items.forEach(item => Object.keys(item).forEach(k => keys.add(k)));
        const order = ['id', 'name', 'brand', 'category', 'price'];
        const rest = [...keys].filter(k => !order.includes(k));
        return [...order.filter(k => keys.has(k)), ...rest].map(k => ({ key: k, label: k }));
    }

    function filterItems(items, keyword) {
        if (!keyword.trim()) return items;
        const q = keyword.trim().toLowerCase();
        return items.filter(item =>
            Object.values(item).some(v =>
                v != null && String(v).toLowerCase().includes(q)
            )
        );
    }

    function renderModuleList() {
        const modules = Info4Store.listModules();
        const activeId = activeModule?.id;
        moduleListEl.innerHTML = modules.map(m => `
            <li class="info4-module-item ${m.id === activeId && m.type === activeModule?.type ? 'active' : ''}"
                data-id="${m.id}" data-type="${m.type}">
                <span class="info4-module-name">${escapeHtml(m.title)}</span>
                <span class="info4-module-meta">${m.type === 'builtin' ? '内置' : '自定义'} · ${m.itemCount} 条</span>
            </li>`).join('');
    }

    function renderItemsTable() {
        if (!activeModule) {
            moduleTitleEl.textContent = '选择模块';
            moduleActionsEl.hidden = true;
            searchRowEl.hidden = true;
            itemsPanelEl.innerHTML = '<p class="form-hint">从左侧选择模块，可<strong>查询、新增、编辑、删除</strong>条目</p>';
            return;
        }

        const allItems = getItems(activeModule);
        const items = filterItems(allItems, itemSearchKeyword);
        moduleTitleEl.textContent = `${activeModule.title}（${allItems.length} 条）`;
        moduleActionsEl.hidden = false;
        searchRowEl.hidden = false;

        const editModuleBtn = document.getElementById('editModuleBtn');
        const deleteModuleBtn = document.getElementById('deleteModuleBtn');
        if (editModuleBtn) editModuleBtn.hidden = activeModule.type === 'builtin';
        if (deleteModuleBtn) deleteModuleBtn.hidden = activeModule.type === 'builtin';

        searchCountEl.textContent = itemSearchKeyword
            ? `显示 ${items.length} / ${allItems.length} 条`
            : `共 ${allItems.length} 条`;

        if (!allItems.length) {
            itemsPanelEl.innerHTML = '<p class="form-hint">暂无条目，点击「+ 新增条目」添加</p>';
            return;
        }

        if (!items.length) {
            itemsPanelEl.innerHTML = '<p class="form-hint">没有匹配的条目，请调整搜索关键词</p>';
            return;
        }

        const keys = new Set(['id', 'name', 'brand']);
        items.forEach(item => Object.keys(item).forEach(k => keys.add(k)));
        const cols = ['id', 'name', 'brand', ...[...keys].filter(k => !['id', 'name', 'brand'].includes(k)).slice(0, 4)];

        const head = cols.map(c => `<th>${escapeHtml(c)}</th>`).join('') + '<th>操作</th>';
        const rows = items.map(item => {
            const cells = cols.map(c => {
                const v = item[c];
                const text = v === undefined || v === null ? '' : String(v);
                return `<td title="${escapeHtml(text)}">${escapeHtml(text.length > 24 ? text.slice(0, 24) + '…' : text)}</td>`;
            }).join('');
            return `<tr>
                ${cells}
                <td class="info4-actions">
                    <button type="button" class="btn-link" data-action="view" data-id="${item.id}">查看</button>
                    <button type="button" class="btn-link" data-action="edit" data-id="${item.id}">编辑</button>
                    <button type="button" class="btn-link btn-link-danger" data-action="delete" data-id="${item.id}">删除</button>
                </td>
            </tr>`;
        }).join('');

        itemsPanelEl.innerHTML = `
            <table class="info4-table">
                <thead><tr>${head}</tr></thead>
                <tbody>${rows}</tbody>
            </table>`;
    }

    function selectModule(id, type) {
        const modules = Info4Store.listModules();
        activeModule = modules.find(m => m.id === id && m.type === type);
        itemSearchKeyword = '';
        itemSearchEl.value = '';
        renderModuleList();
        renderItemsTable();
    }

    function renderDetailTable(item) {
        return `<table class="info4-detail-table">
            ${Object.entries(item).map(([k, v]) => `
                <tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v ?? '')}</td></tr>`).join('')}
        </table>`;
    }

    function viewItem(id) {
        if (!activeModule) return;
        const item = Info4Store.getItem(activeModule.id, activeModule.type, id);
        if (!item) return;
        viewingItemId = item.id;
        viewItemTitle.textContent = `查看条目 #${item.id}`;
        viewItemBody.innerHTML = renderDetailTable(item);
        openModal('viewItemModal');
    }

    function viewModule() {
        if (!activeModule) return;
        let html = `<p><strong>类型：</strong>${activeModule.type === 'builtin' ? '内置' : '自定义'}</p>
            <p><strong>ID：</strong>${escapeHtml(activeModule.id)}</p>
            <p><strong>文件：</strong>${escapeHtml(activeModule.file || '')}</p>`;
        if (activeModule.type === 'custom') {
            const mod = Info4Store.getCustomModule(activeModule.id);
            html += renderDetailTable({
                title: mod.title,
                category: mod.category,
                description: mod.description,
                icon: mod.icon,
                itemLabel: mod.config?.itemLabel,
                itemCount: (mod.config?.items || []).length,
                fieldCount: (mod.config?.fields || []).length,
            });
        }
        viewModuleBody.innerHTML = html;
        openModal('viewModuleModal');
    }

    function switchItemTab(tab) {
        document.querySelectorAll('.info4-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });
        itemFormPanel.hidden = tab !== 'form';
        itemJsonPanel.hidden = tab !== 'json';
    }

    function buildItemForm(item, isEdit) {
        const fields = getFieldDefs(activeModule);
        const html = fields.map(f => {
            if (f.key === 'id' && !isEdit) return '';
            const val = item[f.key] ?? '';
            const disabled = f.key === 'id' && isEdit ? 'readonly' : '';
            const type = typeof val === 'number' ? 'number' : 'text';
            return `
                <label class="form-label" for="field_${f.key}">${escapeHtml(f.label || f.key)}</label>
                <input type="${type}" id="field_${f.key}" name="${f.key}" class="form-input"
                    value="${escapeHtml(val)}" ${disabled} autocomplete="off">`;
        }).join('');
        itemFormPanel.innerHTML = html || '<p class="form-hint">无字段定义，请使用 JSON 模式</p>';
    }

    function readItemFromForm() {
        const fields = getFieldDefs(activeModule);
        const data = {};
        fields.forEach(f => {
            const el = document.getElementById(`field_${f.key}`);
            if (!el) return;
            if (f.key === 'id' && editingItemId != null) return;
            const raw = el.value.trim();
            if (raw === '') return;
            const num = Number(raw);
            data[f.key] = Number.isFinite(num) && raw !== '' && !/[a-zA-Z]/.test(raw) ? num : raw;
        });
        return data;
    }

    function openItemModal(mode, item) {
        editingItemId = mode === 'edit' ? item.id : null;
        itemModalTitle.textContent = mode === 'edit' ? `编辑条目 #${item.id}` : '新增条目';
        const base = mode === 'edit' ? { ...item } : { name: '', brand: '', price: 0 };
        buildItemForm(base, mode === 'edit');
        itemJsonInput.value = JSON.stringify(base, null, 2);
        switchItemTab('form');
        openModal('itemModal');
    }

    function saveItem() {
        if (!activeModule) return;
        const activeTab = document.querySelector('.info4-tab.active')?.dataset.tab || 'form';
        let data;
        try {
            data = activeTab === 'json'
                ? JSON.parse(itemJsonInput.value)
                : readItemFromForm();
        } catch {
            setStatus('JSON 格式错误', 'error');
            return;
        }

        try {
            if (activeModule.type === 'builtin') {
                if (editingItemId != null) {
                    Info4Store.updateBuiltinItem(activeModule.id, editingItemId, data);
                } else {
                    Info4Store.addBuiltinItem(activeModule.id, data);
                }
            } else {
                if (editingItemId != null) {
                    Info4Store.updateCustomItem(activeModule.id, editingItemId, data);
                } else {
                    Info4Store.addCustomItem(activeModule.id, data);
                }
            }
            closeModal('itemModal');
            renderStats();
            renderModuleList();
            renderItemsTable();
            setStatus(editingItemId != null ? '已更新条目' : '已新增条目', 'success');
        } catch (err) {
            setStatus('保存失败：' + err.message, 'error');
        }
    }

    function openModuleModal(mode) {
        editingModuleMode = mode;
        moduleModalTitle.textContent = mode === 'add' ? '新增模块' : '编辑模块';
        if (mode === 'add') {
            document.getElementById('moduleTitleInput').value = '';
            document.getElementById('moduleCategoryInput').value = 'life';
            document.getElementById('moduleItemLabelInput').value = '';
            document.getElementById('moduleDescInput').value = '';
            document.getElementById('moduleIconInput').value = '📋';
        } else if (activeModule?.type === 'custom') {
            const mod = Info4Store.getCustomModule(activeModule.id);
            document.getElementById('moduleTitleInput').value = mod.title.replace(/对比$/, '');
            document.getElementById('moduleCategoryInput').value = mod.category || 'life';
            document.getElementById('moduleItemLabelInput').value = mod.config?.itemLabel || '';
            document.getElementById('moduleDescInput').value = mod.description || '';
            document.getElementById('moduleIconInput').value = mod.icon || '📋';
        }
        openModal('moduleModal');
    }

    function saveModule() {
        const title = document.getElementById('moduleTitleInput').value.trim();
        const category = document.getElementById('moduleCategoryInput').value;
        const itemLabel = document.getElementById('moduleItemLabelInput').value.trim();
        const description = document.getElementById('moduleDescInput').value.trim();
        const icon = document.getElementById('moduleIconInput').value.trim() || '📋';

        try {
            if (editingModuleMode === 'add') {
                const mod = Info4Store.createCustomModule({
                    title, category, itemLabel, description, icon,
                });
                selectModule(mod.id, 'custom');
                setStatus('已新增模块', 'success');
            } else if (activeModule?.type === 'custom') {
                Info4Store.updateCustomModuleMeta(activeModule.id, {
                    title, category, description, icon,
                    itemLabel,
                });
                selectModule(activeModule.id, 'custom');
                setStatus('已更新模块', 'success');
            }
            closeModal('moduleModal');
            renderStats();
            renderModuleList();
            renderItemsTable();
        } catch (err) {
            setStatus('保存失败：' + err.message, 'error');
        }
    }

    function deleteModule() {
        if (!activeModule || activeModule.type !== 'custom') return;
        if (!confirm(`确定删除模块「${activeModule.title}」及其全部条目？`)) return;
        try {
            Info4Store.deleteCustomModule(activeModule.id);
            activeModule = null;
            renderStats();
            renderModuleList();
            renderItemsTable();
            setStatus('已删除模块', 'success');
        } catch (err) {
            setStatus('删除失败：' + err.message, 'error');
        }
    }

    moduleListEl.addEventListener('click', (e) => {
        const li = e.target.closest('.info4-module-item');
        if (!li) return;
        selectModule(li.dataset.id, li.dataset.type);
    });

    itemsPanelEl.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn || !activeModule) return;
        const id = btn.dataset.id;
        const action = btn.dataset.action;

        if (action === 'view') {
            viewItem(id);
        } else if (action === 'edit') {
            const item = Info4Store.getItem(activeModule.id, activeModule.type, id);
            if (item) openItemModal('edit', item);
        } else if (action === 'delete') {
            if (!confirm(`确定删除条目 #${id}？`)) return;
            try {
                if (activeModule.type === 'builtin') {
                    Info4Store.deleteBuiltinItem(activeModule.id, id);
                } else {
                    Info4Store.deleteCustomItem(activeModule.id, id);
                }
                renderStats();
                renderModuleList();
                renderItemsTable();
                setStatus('已删除条目', 'success');
            } catch (err) {
                setStatus('删除失败：' + err.message, 'error');
            }
        }
    });

    document.querySelectorAll('.info4-tab').forEach(tab => {
        tab.addEventListener('click', () => switchItemTab(tab.dataset.tab));
    });

    document.getElementById('addItemBtn').addEventListener('click', () => openItemModal('add', {}));
    document.getElementById('addModuleBtn').addEventListener('click', () => openModuleModal('add'));
    document.getElementById('viewModuleBtn').addEventListener('click', viewModule);
    document.getElementById('editModuleBtn').addEventListener('click', () => openModuleModal('edit'));
    document.getElementById('deleteModuleBtn').addEventListener('click', deleteModule);
    document.getElementById('saveItemBtn').addEventListener('click', saveItem);
    document.getElementById('saveModuleBtn').addEventListener('click', saveModule);

    document.getElementById('viewToEditBtn').addEventListener('click', () => {
        if (!activeModule || viewingItemId == null) return;
        closeModal('viewItemModal');
        const item = Info4Store.getItem(activeModule.id, activeModule.type, viewingItemId);
        if (item) openItemModal('edit', item);
    });

    itemSearchEl.addEventListener('input', (e) => {
        itemSearchKeyword = e.target.value;
        renderItemsTable();
    });

    document.getElementById('reloadFromDataBtn').addEventListener('click', async () => {
        if (!confirm('将从 data/info4.json 重新加载并覆盖本地缓存，修改将丢失。继续？')) return;
        setStatus('正在从 data/ 加载...', 'info');
        try {
            await Info4Store.initFromServer(true);
            activeModule = null;
            renderStats();
            renderModuleList();
            renderItemsTable();
            setStatus('已从 data/info4.json 重新加载', 'success');
        } catch (err) {
            setStatus('加载失败：' + err.message, 'error');
        }
    });

    document.getElementById('exportAllBtn').addEventListener('click', () => {
        try {
            Info4Store.exportToCode();
            setStatus('已下载 info4.json，请覆盖到 data/ 目录', 'success');
        } catch (err) {
            setStatus('导出失败：' + err.message, 'error');
        }
    });

    document.getElementById('exportBackupBtn').addEventListener('click', () => {
        try {
            Info4Store.exportBackup();
            setStatus('已下载 info4-backup.json', 'success');
        } catch (err) {
            setStatus('备份失败：' + err.message, 'error');
        }
    });

    document.getElementById('clearInfo4Btn').addEventListener('click', () => {
        if (!confirm('确定清除 info4 缓存？')) return;
        Info4Store.clearCache();
        activeModule = null;
        renderStats();
        renderModuleList();
        renderItemsTable();
        setStatus('已清除 info4，请重新加载', 'info');
    });

    async function init() {
        setStatus('正在初始化 info4...', 'info');
        await Info4Store.ensureLoaded();
        renderStats();
        renderModuleList();
        setStatus('info4 已就绪，支持增删改查', 'success');
    }

    init();
})();
