/**
 * 对比渲染工具（桌面表格 / 手机卡片自适应）
 */
const CompareUtils = {
    MOBILE_BREAKPOINT: 768,

    isMobileView() {
        return window.innerWidth <= this.MOBILE_BREAKPOINT;
    },

    calcHighlights(items, fields, numericCompare) {
        const bestMap = {};
        const worstMap = {};

        fields.forEach(field => {
            const rule = numericCompare[field.key];
            if (!rule) return;
            const values = items.map(item => parseFloat(item[field.key])).filter(v => !isNaN(v));
            if (values.length === 0) return;
            const best = rule === 'max' ? Math.max(...values) : Math.min(...values);
            const worst = rule === 'max' ? Math.min(...values) : Math.max(...values);
            if (best !== worst) {
                bestMap[field.key] = best;
                worstMap[field.key] = worst;
            }
        });

        return { bestMap, worstMap };
    },

    getFieldClass(field, raw, bestMap, worstMap) {
        const numVal = parseFloat(raw);
        if (isNaN(numVal) || bestMap[field.key] === undefined) return '';
        if (numVal === bestMap[field.key]) return 'highlight-best';
        if (numVal === worstMap[field.key]) return 'highlight-worst';
        return '';
    },

    renderTable(items, fields, numericCompare, nameKey = 'name', crudEnabled = false) {
        const { bestMap, worstMap } = this.calcHighlights(items, fields, numericCompare);

        const scrollHint = this.isMobileView() && items.length > 1
            ? '<p class="compare-table-scroll-hint">← 左右滑动查看全部对比项 →</p>'
            : '';

        let html = scrollHint + '<div class="compare-table-wrapper"><table class="compare-table">';
        html += '<tr><th>参数</th>';
        items.forEach(item => {
            const actions = crudEnabled ? `
                <div class="compare-crud-actions">
                    <button type="button" class="btn-link compare-crud-btn" data-action="view" data-id="${item.id}">查看</button>
                    <button type="button" class="btn-link compare-crud-btn" data-action="edit" data-id="${item.id}">编辑</button>
                    <button type="button" class="btn-link btn-link-danger compare-crud-btn" data-action="delete" data-id="${item.id}">删除</button>
                </div>` : '';
            html += `<td class="product-header">${item[nameKey]}${actions}</td>`;
        });
        html += '</tr>';

        fields.forEach(field => {
            html += `<tr><th>${field.label}</th>`;
            items.forEach(item => {
                const raw = item[field.key];
                const display = field.format ? field.format(raw) : (raw || '-');
                const cls = this.getFieldClass(field, raw, bestMap, worstMap);
                html += `<td class="${cls}">${display}</td>`;
            });
            html += '</tr>';
        });

        html += '</table></div>';
        return html;
    },

    renderCards(items, fields, numericCompare, nameKey = 'name', crudEnabled = false) {
        const { bestMap, worstMap } = this.calcHighlights(items, fields, numericCompare);

        let html = '<div class="compare-cards">';
        items.forEach(item => {
            const actions = crudEnabled ? `
                <div class="compare-crud-actions compare-crud-actions-card">
                    <button type="button" class="btn-link compare-crud-btn" data-action="view" data-id="${item.id}">查看</button>
                    <button type="button" class="btn-link compare-crud-btn" data-action="edit" data-id="${item.id}">编辑</button>
                    <button type="button" class="btn-link btn-link-danger compare-crud-btn" data-action="delete" data-id="${item.id}">删除</button>
                </div>` : '';
            html += `<div class="compare-card"><h3 class="compare-card-title">${item[nameKey]}</h3>${actions}<dl class="compare-card-list">`;
            fields.forEach(field => {
                const raw = item[field.key];
                const display = field.format ? field.format(raw) : (raw || '-');
                const cls = this.getFieldClass(field, raw, bestMap, worstMap);
                html += `<div class="compare-card-row ${cls}"><dt>${field.label}</dt><dd>${display}</dd></div>`;
            });
            html += '</dl></div>';
        });
        html += '</div>';
        return html;
    },

    render(items, fields, numericCompare, nameKey = 'name', crudEnabled = false, displayMode = 'auto') {
        const useTable = displayMode === 'table'
            || (displayMode === 'auto' && !this.isMobileView());
        if (useTable) {
            return this.renderTable(items, fields, numericCompare, nameKey, crudEnabled);
        }
        return this.renderCards(items, fields, numericCompare, nameKey, crudEnabled);
    },

    calcFormulaValue(item, formula, variables) {
        const safe = formula.replace(/[^0-9a-zA-Z_+\-*/().\s]/g, '');
        const vals = {};
        variables.forEach(v => {
            vals[v] = parseFloat(item[v]) || 0;
        });
        try {
            const keys = Object.keys(vals);
            const fn = new Function(...keys, `"use strict"; return (${safe});`);
            const result = fn(...keys.map(k => vals[k]));
            return Number.isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    },

    multiSort(items, rules, getValueForKey) {
        return [...items].sort((a, b) => {
            for (const rule of rules) {
                const va = getValueForKey(a, rule.key);
                const vb = getValueForKey(b, rule.key);
                if (va < vb) return rule.order === 'asc' ? -1 : 1;
                if (va > vb) return rule.order === 'asc' ? 1 : -1;
            }
            return 0;
        });
    },

    applyColumnLayout(items, layout) {
        return layout === 'rtl' ? [...items].reverse() : items;
    },
};

/**
 * 对比页移动端交互：Tab 切换 + 底部操作栏
 */
function initCompareMobileUI(options) {
    const { compareBtn, onCompare, onClear } = options;
    const mobileTabs = document.querySelector('.mobile-tabs');
    const mobileCompareBtn = document.getElementById('mobileCompareBtn');
    const mobileClearBtn = document.getElementById('mobileClearBtn');
    const mobileSelectedCount = document.getElementById('mobileSelectedCount');
    const selectPanel = document.querySelector('.select-panel');
    const comparePanel = document.querySelector('.compare-panel');

    function initMobileLayout() {
        if (!selectPanel || !comparePanel) return;
        if (CompareUtils.isMobileView()) {
            comparePanel.classList.add('hidden-mobile');
            selectPanel.classList.remove('hidden-mobile');
            document.querySelectorAll('.mobile-tab').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === 'select');
            });
        } else {
            comparePanel.classList.remove('hidden-mobile');
            selectPanel.classList.remove('hidden-mobile');
        }
    }

    initMobileLayout();
    window.addEventListener('resize', initMobileLayout);

    function switchTab(tab) {
        if (!CompareUtils.isMobileView()) return;
        document.querySelectorAll('.mobile-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        if (tab === 'select') {
            selectPanel.classList.remove('hidden-mobile');
            comparePanel.classList.add('hidden-mobile');
        } else {
            selectPanel.classList.add('hidden-mobile');
            comparePanel.classList.remove('hidden-mobile');
        }
    }

    if (mobileTabs) {
        mobileTabs.addEventListener('click', (e) => {
            const btn = e.target.closest('.mobile-tab');
            if (btn) switchTab(btn.dataset.tab);
        });
    }

    if (mobileCompareBtn) {
        mobileCompareBtn.addEventListener('click', async () => {
            await onCompare();
            switchTab('compare');
        });
    }

    if (mobileClearBtn) {
        mobileClearBtn.addEventListener('click', () => {
            onClear();
            switchTab('select');
        });
    }

    return {
        switchTab,
        updateMobileBar(count, minCompare) {
            if (mobileSelectedCount) mobileSelectedCount.textContent = count;
            if (mobileCompareBtn) {
                mobileCompareBtn.disabled = count < minCompare;
                mobileCompareBtn.textContent = count >= minCompare
                    ? `对比 ${count} 款`
                    : `至少选 ${minCompare} 款`;
            }
        },
    };
}

/**
 * 全选 / 回车对比
 */
function toggleSelectAllFiltered(filtered, selectedIds) {
    const ids = filtered.map(item => item.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));

    if (allSelected) {
        selectedIds.clear();
    } else {
        ids.forEach(id => selectedIds.add(id));
    }
}

function updateSelectAllBtn(selectAllBtn, filtered, selectedIds) {
    if (!selectAllBtn) return;
    const ids = filtered.map(item => item.id);
    const allSelected = ids.length > 0 && ids.every(id => selectedIds.has(id));
    selectAllBtn.textContent = allSelected ? '取消全选' : '全选';
    selectAllBtn.disabled = filtered.length === 0;
}

function initSelectAllAndEnter(options) {
    const {
        selectAllBtn,
        searchInput,
        itemList,
        compareBtn,
        mobileCompareBtn,
        selectPanel,
        selectedIds,
        minCompare,
        getFiltered,
        onCompare,
        onSelectionChange,
    } = options;

    function isEnterKey(e) {
        return e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter';
    }

    function getActiveCompareButton() {
        if (CompareUtils.isMobileView() && mobileCompareBtn) {
            return mobileCompareBtn;
        }
        return compareBtn;
    }

    function canCompare() {
        const btn = getActiveCompareButton();
        return selectedIds.size >= minCompare && btn && !btn.disabled;
    }

    function runCompare(e) {
        if (!canCompare()) return false;
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        const btn = getActiveCompareButton();
        if (btn) {
            btn.click();
        } else {
            onCompare();
        }
        return true;
    }

    function shouldSkipEnterCompare(el) {
        if (!el) return false;
        if (el.id === 'valueFormula') return true;
        if (el.tagName === 'TEXTAREA') return true;
        if (el.tagName === 'SELECT') return true;
        if (el.closest && el.closest('.sort-bar')) return true;
        return false;
    }

    function tryCompareOnEnter(e) {
        if (!isEnterKey(e) || e.isComposing) return;
        if (shouldSkipEnterCompare(e.target)) return;

        const el = e.target;

        if (el.tagName === 'INPUT' && el.type === 'checkbox') {
            runCompare(e);
            return;
        }

        if (el.tagName === 'BUTTON') {
            return;
        }

        runCompare(e);
    }

    function isTextInput(el) {
        if (!el || el.tagName !== 'INPUT') return false;
        const type = (el.type || 'text').toLowerCase();
        return type === 'text' || type === 'search' || type === 'number';
    }

    function trySelectAllOnCtrlA(e) {
        if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 'a') return;

        const el = e.target;
        if (isTextInput(el) || el.tagName === 'TEXTAREA') return;
        if (el.id === 'valueFormula') return;
        if (el.isContentEditable) return;

        const filtered = getFiltered();
        if (filtered.length === 0) return;

        e.preventDefault();
        toggleSelectAllFiltered(filtered, selectedIds);
        onSelectionChange();
        if (searchInput) searchInput.focus();
    }

    function handleKeyboardShortcuts(e) {
        trySelectAllOnCtrlA(e);
        tryCompareOnEnter(e);
    }

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            toggleSelectAllFiltered(getFiltered(), selectedIds);
            onSelectionChange();
            if (searchInput) searchInput.focus();
        });
    }

    if (itemList) {
        itemList.addEventListener('click', () => {
            setTimeout(() => {
                if (searchInput) searchInput.focus();
            }, 0);
        });
    }

    if (selectPanel) {
        selectPanel.tabIndex = -1;
    }

    window.addEventListener('keydown', handleKeyboardShortcuts, true);
}

/**
 * 从对比字段构建可排序字段列表
 */
function buildSortFieldOptions(fields, numericCompare, presets) {
    const numeric = fields
        .filter(f => numericCompare[f.key])
        .map(f => ({ key: f.key, label: f.label }));
    return [...numeric, ...(presets || [
        { key: 'rating', label: '综合评分' },
        { key: 'value', label: '性价比（公式）' },
    ])];
}

/**
 * 对比结果视图：多级自定义排序 + 性价比公式
 */
function initCompareResultView(options) {
    const {
        container,
        fields,
        numericCompare,
        sortConfig,
        nameKey = 'name',
        itemCrud = null,
    } = options;

    const MAX_RULES = 5;
    const fieldOptions = sortConfig.fieldOptions || [];
    const fieldLabelMap = Object.fromEntries(fieldOptions.map(f => [f.key, f.label]));

    let rawItems = [];
    let sortRules = JSON.parse(JSON.stringify(sortConfig.defaultRules || [{ key: 'price', order: 'asc' }]));
    let columnLayout = sortConfig.defaultLayout || 'ltr';
    let displayMode = sortConfig.defaultDisplayMode || 'table';
    let formula = sortConfig.formula.default;
    let formulaError = '';

    function getValueForKey(item, key) {
        if (key === 'rating' && sortConfig.getRating) {
            return sortConfig.getRating(item);
        }
        if (key === 'value') {
            return CompareUtils.calcFormulaValue(item, formula, sortConfig.formula.variables);
        }
        const num = parseFloat(item[key]);
        return Number.isFinite(num) ? num : 0;
    }

    function getSortedItems(items) {
        const sorted = CompareUtils.multiSort(items, sortRules, getValueForKey);
        return CompareUtils.applyColumnLayout(sorted, columnLayout);
    }

    function usesValueFormula() {
        return sortRules.some(r => r.key === 'value');
    }

    function buildFieldOptionsHtml(selectedKey) {
        return fieldOptions.map(f =>
            `<option value="${f.key}" ${f.key === selectedKey ? 'selected' : ''}>${f.label}</option>`
        ).join('');
    }

    function buildSortRulesHtml() {
        return sortRules.map((rule, i) => `
            <div class="sort-rule-row" data-index="${i}">
                <span class="sort-rule-priority">${i + 1}</span>
                <select class="sort-select sort-field-select" data-index="${i}">${buildFieldOptionsHtml(rule.key)}</select>
                <select class="sort-select sort-order-select" data-index="${i}">
                    <option value="asc" ${rule.order === 'asc' ? 'selected' : ''}>升序（小→大）</option>
                    <option value="desc" ${rule.order === 'desc' ? 'selected' : ''}>降序（大→小）</option>
                </select>
                ${sortRules.length > 1 ? `<button type="button" class="sort-rule-remove" data-index="${i}" title="删除">×</button>` : ''}
            </div>
        `).join('');
    }

    function buildSortBarHtml() {
        const formulaBlock = usesValueFormula() ? `
            <div class="sort-formula-row">
                <label class="sort-label" for="valueFormula">性价比公式</label>
                <input type="text" id="valueFormula" class="sort-formula-input"
                    value="${formula.replace(/"/g, '&quot;')}" spellcheck="false">
                <button type="button" class="btn-select-all" id="resetFormulaBtn">恢复默认</button>
            </div>
            <p class="sort-formula-hint">${sortConfig.formula.hint}</p>
            ${formulaError ? `<p class="sort-formula-error">${formulaError}</p>` : ''}
        ` : '';

        const preview = rawItems.length > 0 ? (() => {
            const sorted = getSortedItems(rawItems);
            const ruleDesc = sortRules.map((r, i) =>
                `${i + 1}.${fieldLabelMap[r.key] || r.key}${r.order === 'asc' ? '↑' : '↓'}`
            ).join(' → ');
            const names = sorted.map(item => item[nameKey]).join(' · ');
            return `<p class="sort-preview"><strong>排序：</strong>${ruleDesc}<br><strong>列顺序：</strong>${names}</p>`;
        })() : '';

        return `
            <div class="sort-bar">
                <div class="sort-rules-header">
                    <span class="sort-label">排序条件（按优先级从上到下，相同则看下一条件）</span>
                    ${sortRules.length < MAX_RULES ? '<button type="button" class="btn-select-all" id="addSortRuleBtn">+ 添加条件</button>' : ''}
                </div>
                <div class="sort-rules-list" id="sortRulesList">${buildSortRulesHtml()}</div>
                <div class="sort-controls">
                    <div class="sort-control">
                        <label class="sort-label" for="displayModeSelect">展示方式</label>
                        <select id="displayModeSelect" class="sort-select">
                            <option value="table" ${displayMode === 'table' ? 'selected' : ''}>横向表格（全部并列）</option>
                            <option value="cards" ${displayMode === 'cards' ? 'selected' : ''}>纵向卡片</option>
                        </select>
                    </div>
                    <div class="sort-control">
                        <label class="sort-label" for="columnLayoutSelect">列显示方向</label>
                        <select id="columnLayoutSelect" class="sort-select">
                            <option value="ltr" ${columnLayout === 'ltr' ? 'selected' : ''}>从左到右</option>
                            <option value="rtl" ${columnLayout === 'rtl' ? 'selected' : ''}>从右到左</option>
                        </select>
                    </div>
                    <button type="button" class="btn-select-all" id="applySortBtn">应用排序</button>
                    <button type="button" class="btn-select-all" id="resetSortBtn">恢复默认</button>
                </div>
                ${formulaBlock}
                ${preview}
            </div>
        `;
    }

    function bindSortEvents() {
        const addBtn = container.querySelector('#addSortRuleBtn');
        const applyBtn = container.querySelector('#applySortBtn');
        const resetBtn = container.querySelector('#resetSortBtn');
        const layoutSelect = container.querySelector('#columnLayoutSelect');
        const displayModeSelect = container.querySelector('#displayModeSelect');
        const formulaInput = container.querySelector('#valueFormula');
        const resetFormulaBtn = container.querySelector('#resetFormulaBtn');
        const rulesList = container.querySelector('#sortRulesList');

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                if (sortRules.length >= MAX_RULES) return;
                sortRules.push({ key: fieldOptions[0].key, order: 'asc' });
                render(rawItems);
            });
        }

        if (rulesList) {
            rulesList.addEventListener('change', (e) => {
                const idx = parseInt(e.target.dataset.index);
                if (isNaN(idx)) return;
                if (e.target.classList.contains('sort-field-select')) {
                    sortRules[idx].key = e.target.value;
                    render(rawItems);
                } else if (e.target.classList.contains('sort-order-select')) {
                    sortRules[idx].order = e.target.value;
                    render(rawItems);
                }
            });

            rulesList.addEventListener('click', (e) => {
                if (e.target.classList.contains('sort-rule-remove')) {
                    const idx = parseInt(e.target.dataset.index);
                    if (sortRules.length > 1 && !isNaN(idx)) {
                        sortRules.splice(idx, 1);
                        render(rawItems);
                    }
                }
            });
        }

        if (layoutSelect) {
            layoutSelect.addEventListener('change', () => {
                columnLayout = layoutSelect.value;
                render(rawItems);
            });
        }

        if (displayModeSelect) {
            displayModeSelect.addEventListener('change', () => {
                displayMode = displayModeSelect.value;
                render(rawItems);
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => validateAndRender());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                sortRules = JSON.parse(JSON.stringify(sortConfig.defaultRules || [{ key: 'price', order: 'asc' }]));
                columnLayout = sortConfig.defaultLayout || 'ltr';
                displayMode = sortConfig.defaultDisplayMode || 'table';
                formula = sortConfig.formula.default;
                formulaError = '';
                render(rawItems);
            });
        }

        if (formulaInput) {
            formulaInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    formula = formulaInput.value.trim();
                    validateAndRender();
                }
            });
            formulaInput.addEventListener('change', () => {
                formula = formulaInput.value.trim();
                validateAndRender();
            });
        }

        if (resetFormulaBtn) {
            resetFormulaBtn.addEventListener('click', () => {
                formula = sortConfig.formula.default;
                formulaError = '';
                render(rawItems);
            });
        }
    }

    function validateAndRender() {
        if (usesValueFormula() && rawItems.length > 0) {
            try {
                CompareUtils.calcFormulaValue(rawItems[0], formula, sortConfig.formula.variables);
                formulaError = '';
            } catch {
                formulaError = '公式无效，请检查变量与运算符';
            }
        } else {
            formulaError = '';
        }
        render(rawItems);
    }

    function render(items) {
        if (!items || items.length === 0) return;
        rawItems = items;
        const sorted = getSortedItems(items);
        const crudBar = itemCrud ? `
            <div class="compare-crud-toolbar">
                <button type="button" class="btn btn-outline btn-sm" id="compareAddItemBtn">+ 新增条目</button>
                <span class="form-hint">对比结果支持查看、编辑、删除；变更写入 info4 缓存</span>
            </div>` : '';
        container.innerHTML = buildSortBarHtml() + crudBar
            + CompareUtils.render(sorted, fields, numericCompare, nameKey, !!itemCrud, displayMode);
        bindSortEvents();
        if (itemCrud) itemCrud.bindCompareContainer(container, sorted);
    }

    function reset() {
        sortRules = JSON.parse(JSON.stringify(sortConfig.defaultRules || [{ key: 'price', order: 'asc' }]));
        columnLayout = sortConfig.defaultLayout || 'ltr';
        displayMode = sortConfig.defaultDisplayMode || 'table';
        formula = sortConfig.formula.default;
        formulaError = '';
        rawItems = [];
    }

    return { render, reset };
}
