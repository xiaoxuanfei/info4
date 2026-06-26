/**
 * 对比页条目增删改查（写入 info4 缓存）
 */
const CompareItemCrud = (function () {
    let modalMounted = false;

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function ensureModal() {
        if (modalMounted) return;
        modalMounted = true;
        const wrap = document.createElement('div');
        wrap.innerHTML = `
            <div class="modal-overlay" id="compareItemModal" aria-hidden="true">
                <div class="modal-dialog modal-dialog-wide" role="dialog">
                    <div class="modal-header">
                        <h2 id="compareItemModalTitle">编辑条目</h2>
                        <button type="button" class="modal-close" data-compare-crud-close aria-label="关闭">×</button>
                    </div>
                    <div class="modal-body">
                        <div id="compareItemViewPanel" class="info4-detail-table-wrap" hidden></div>
                        <div id="compareItemFormPanel"></div>
                    </div>
                    <div class="modal-footer" id="compareItemModalFooter">
                        <button type="button" class="btn btn-outline" data-compare-crud-close>取消</button>
                        <button type="button" class="btn btn-primary" id="compareItemSaveBtn">保存</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(wrap.firstElementChild);

        const modalEl = document.getElementById('compareItemModal');
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) closeModal();
        });

        document.querySelectorAll('[data-compare-crud-close]').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
    }

    function openModal() {
        ensureModal();
        const el = document.getElementById('compareItemModal');
        el.classList.add('open');
        el.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function closeModal() {
        const el = document.getElementById('compareItemModal');
        if (!el) return;
        el.classList.remove('open');
        el.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    function fieldDefsFromFields(fields, extra = ['id', 'name']) {
        const keys = new Set(extra);
        fields.forEach(f => keys.add(f.key));
        return [...keys].map(key => {
            const f = fields.find(x => x.key === key);
            return { key, label: f?.label || key };
        });
    }

    async function persistSave(moduleType, moduleId, data, editingId) {
        await Info4Store.ensureLoaded();
        if (moduleType === 'builtin') {
            if (editingId != null) return Info4Store.updateBuiltinItem(moduleId, editingId, data);
            return Info4Store.addBuiltinItem(moduleId, data);
        }
        if (editingId != null) return Info4Store.updateCustomItem(moduleId, editingId, data);
        return Info4Store.addCustomItem(moduleId, data);
    }

    async function persistDelete(moduleType, moduleId, id) {
        await Info4Store.ensureLoaded();
        if (moduleType === 'builtin') {
            Info4Store.deleteBuiltinItem(moduleId, id);
        } else {
            Info4Store.deleteCustomItem(moduleId, id);
        }
    }

    function buildForm(fieldDefs, item, isEdit) {
        return fieldDefs.map(f => {
            if (f.key === 'id' && !isEdit) return '';
            const val = item[f.key] ?? '';
            const readonly = f.key === 'id' && isEdit ? 'readonly' : '';
            return `
                <label class="form-label" for="crud_${f.key}">${escapeHtml(f.label || f.key)}</label>
                <input type="text" id="crud_${f.key}" name="${f.key}" class="form-input"
                    value="${escapeHtml(val)}" ${readonly} autocomplete="off">`;
        }).join('');
    }

    function readForm(fieldDefs, isEdit) {
        const data = {};
        fieldDefs.forEach(f => {
            if (f.key === 'id' && !isEdit) return;
            const el = document.getElementById(`crud_${f.key}`);
            if (!el) return;
            const raw = el.value.trim();
            if (raw === '') return;
            const num = Number(raw);
            data[f.key] = Number.isFinite(num) && raw !== '' && !/[a-zA-Z]/.test(raw) ? num : raw;
        });
        return data;
    }

    function renderViewTable(item) {
        return `<table class="info4-detail-table">
            ${Object.entries(item).map(([k, v]) =>
                `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v ?? '')}</td></tr>`
            ).join('')}
        </table>`;
    }

    function openEditor(ctx, mode, item) {
        ensureModal();
        const titleEl = document.getElementById('compareItemModalTitle');
        const viewPanel = document.getElementById('compareItemViewPanel');
        const formPanel = document.getElementById('compareItemFormPanel');
        const footer = document.getElementById('compareItemModalFooter');
        const saveBtn = document.getElementById('compareItemSaveBtn');

        ctx.editingId = mode === 'edit' ? item.id : null;

        if (mode === 'view') {
            titleEl.textContent = `查看 · ${item.name || item.id}`;
            viewPanel.hidden = false;
            formPanel.hidden = true;
            viewPanel.innerHTML = renderViewTable(item);
            footer.hidden = true;
        } else {
            titleEl.textContent = mode === 'edit' ? `编辑 · ${item.name || item.id}` : '新增条目';
            viewPanel.hidden = true;
            formPanel.hidden = false;
            footer.hidden = false;
            formPanel.innerHTML = buildForm(ctx.fieldDefs, item, mode === 'edit');
            saveBtn.onclick = async () => {
                try {
                    const data = readForm(ctx.fieldDefs, mode === 'edit');
                    await persistSave(ctx.moduleType, ctx.moduleId, data, ctx.editingId);
                    await ctx.reload();
                    closeModal();
                } catch (err) {
                    alert('保存失败：' + err.message);
                }
            };
        }
        openModal();
    }

    function listItemActionsHtml(id) {
        return `
            <div class="item-crud-actions">
                <button type="button" class="item-crud-btn" data-crud-action="view" data-id="${id}" title="查看">👁</button>
                <button type="button" class="item-crud-btn" data-crud-action="edit" data-id="${id}" title="编辑">✎</button>
                <button type="button" class="item-crud-btn item-crud-btn-danger" data-crud-action="delete" data-id="${id}" title="删除">×</button>
            </div>`;
    }

    function findItem(items, id) {
        const sid = String(id);
        return items.find(i => String(i.id) === sid) || null;
    }

    function matchId(set, id) {
        const sid = String(id);
        if (set.has(id)) return true;
        for (const v of set) {
            if (String(v) === sid) return true;
        }
        return false;
    }

    function deleteFromSet(set, id) {
        const sid = String(id);
        for (const v of set) {
            if (String(v) === sid) set.delete(v);
        }
    }

    function mountAddButton(headerEl, onAdd) {
        if (!headerEl || headerEl.querySelector('.item-crud-add-btn')) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline btn-sm item-crud-add-btn';
        btn.textContent = '+ 新增';
        btn.addEventListener('click', onAdd);
        const actions = headerEl.querySelector('.select-panel-actions');
        if (actions) actions.prepend(btn);
        else headerEl.appendChild(btn);
    }

    function bindListPanel(ctx) {
        const { itemListEl, selectPanelHeader } = ctx;

        mountAddButton(selectPanelHeader, () => {
            const sample = {};
            ctx.fieldDefs.forEach(f => {
                if (f.key !== 'id') sample[f.key] = '';
            });
            openEditor(ctx, 'add', sample);
        });

        itemListEl.addEventListener('click', async (e) => {
            const crudBtn = e.target.closest('.item-crud-btn');
            if (!crudBtn) return;
            e.preventDefault();
            e.stopPropagation();

            const id = crudBtn.dataset.id;
            const action = crudBtn.dataset.crudAction;
            const items = ctx.getItems();
            const item = findItem(items, id);
            if (!item) return;

            if (action === 'view') openEditor(ctx, 'view', item);
            else if (action === 'edit') openEditor(ctx, 'edit', { ...item });
            else if (action === 'delete') {
                if (!confirm(`确定删除「${item.name || id}」？`)) return;
                try {
                    await persistDelete(ctx.moduleType, ctx.moduleId, id);
                    if (ctx.selectedIds) deleteFromSet(ctx.selectedIds, id);
                    await ctx.reload();
                } catch (err) {
                    alert('删除失败：' + err.message);
                }
            }
        });
    }

    function bindCompareContainer(container, ctx, items) {
        if (!container || !ctx) return;

        const addBtn = container.querySelector('#compareAddItemBtn');
        if (addBtn) {
            addBtn.onclick = () => {
                const sample = {};
                ctx.fieldDefs.forEach(f => {
                    if (f.key !== 'id') sample[f.key] = '';
                });
                openEditor(ctx, 'add', sample);
            };
        }

        container.querySelectorAll('.compare-crud-btn').forEach(btn => {
            btn.onclick = async () => {
                const id = btn.dataset.id;
                const action = btn.dataset.action;
                const item = findItem(items, id) || findItem(ctx.getItems(), id);
                if (!item && action !== 'delete') return;

                if (action === 'view') openEditor(ctx, 'view', item);
                else if (action === 'edit') openEditor(ctx, 'edit', { ...item });
                else if (action === 'delete') {
                    if (!confirm(`确定删除「${item?.name || id}」？`)) return;
                    try {
                        await persistDelete(ctx.moduleType, ctx.moduleId, id);
                        if (ctx.selectedIds) deleteFromSet(ctx.selectedIds, id);
                        await ctx.reload();
                    } catch (err) {
                        alert('删除失败：' + err.message);
                    }
                }
            };
        });
    }

  /**
   * @param {object} options
   */
    function create(options) {
        const ctx = {
            moduleType: options.moduleType,
            moduleId: options.moduleId,
            fieldDefs: options.fieldDefs,
            getItems: options.getItems,
            setItems: options.setItems,
            selectedIds: options.selectedIds || null,
            itemListEl: options.itemListEl,
            selectPanelHeader: options.selectPanelHeader,
            editingId: null,
            reload: async () => {
                await Info4Store.ensureLoaded();
                if (options.moduleType === 'builtin') {
                    options.setItems(Info4Store.getBuiltinItems(options.moduleId));
                } else {
                    const mod = Info4Store.getCustomModule(options.moduleId);
                    options.setItems(mod?.config?.items || []);
                    if (options.onModuleSync) options.onModuleSync(mod);
                }
                if (typeof DataLoader !== 'undefined' && DataLoader.clearCache) {
                    DataLoader.clearCache(
                        options.moduleType === 'builtin' ? options.moduleId : undefined
                    );
                }
                if (options.onListRefresh) options.onListRefresh();
                if (options.onCompareRefresh) options.onCompareRefresh();
            },
        };

        bindListPanel(ctx);

        return {
            ctx,
            listItemActionsHtml,
            wrapListItem: (item, selected, innerHtml) => `
                <li class="${selected ? 'selected' : ''}" data-id="${item.id}">
                    <input type="checkbox" ${selected ? 'checked' : ''}>
                    <div class="item-info">${innerHtml}</div>
                    ${listItemActionsHtml(item.id)}
                </li>`,
            isSelected: (set, id) => matchId(set, id),
            bindCompareContainer: (container, items) => bindCompareContainer(container, ctx, items),
        };
    }

    return {
        create,
        fieldDefsFromFields,
        listItemActionsHtml,
    };
})();
