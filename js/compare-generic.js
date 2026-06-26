/**
 * 通用对比页：从 info4 缓存加载自定义模块
 */
(function () {
    const MIN_COMPARE = 2;
    const params = new URLSearchParams(location.search);
    const moduleId = params.get('id');

    const pageHeader = document.getElementById('pageHeader');
    const selectPanelTitle = document.getElementById('selectPanelTitle');
    const itemList = document.getElementById('itemList');
    const searchInput = document.getElementById('searchInput');
    const selectedCount = document.getElementById('selectedCount');
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const compareBody = document.getElementById('compareBody');
    const compareTitle = document.getElementById('compareTitle');

    if (!moduleId) {
        pageHeader.innerHTML = `<h1>缺少对比模块 ID</h1><p><a href="index.html">返回首页</a></p>`;
        return;
    }

    let module = null;
    let allItems = [];
    let selectedIds = new Set();
    let lastCompared = null;
    let compareView = null;
    let mobileUI = null;
    let itemCrud = null;
    let itemLabel = '项目';
    let unitLabel = '款';
    let runtimeFields = [];

    async function loadModule() {
        await Info4Store.ensureLoaded();

        try {
            module = await CustomModules.fetchModule(moduleId);
        } catch {
            module = CustomModules.getById(moduleId);
        }

        if (!module) {
            pageHeader.innerHTML = `
                <h1>未找到对比模块</h1>
                <p>请检查 data/info4.json 或重新创建。<a href="index.html">返回首页</a></p>`;
            document.querySelector('.compare-layout').style.display = 'none';
            document.querySelector('.mobile-tabs')?.style && (document.querySelector('.mobile-tabs').style.display = 'none');
            return;
        }

        allItems = module.config?.items || [];
        initPage();
        renderItemList();
        compareBody.innerHTML = getEmptyStateHtml();
    }

    function initPage() {
        const cfg = module.config;
        itemLabel = cfg.itemLabel || '项目';
        unitLabel = cfg.unitLabel || '款';
        runtimeFields = CustomModules.resolveRuntimeFields(cfg.fields);
        const numericCompare = cfg.numericCompare || {};
        const formulaCfg = cfg.sortConfig.formula;

        const SORT_CONFIG = {
            fieldOptions: buildSortFieldOptions(runtimeFields, numericCompare, [
                { key: 'rating', label: '综合评分' },
                { key: 'value', label: '性价比（公式）' },
            ]),
            defaultRules: cfg.sortConfig.defaultRules || [{ key: 'price', order: 'asc' }],
            defaultLayout: 'ltr',
            formula: formulaCfg,
            getRating: (item) => {
                const rating = parseFloat(item.rating);
                if (Number.isFinite(rating)) return rating * 10;
                const eff = parseFloat(item.effectiveness);
                if (Number.isFinite(eff)) return eff;
                return 50;
            },
        };

        const cat = getCategoryById(module.category);
        document.title = `${module.title} - BreakInfo`;
        pageHeader.innerHTML = `
            <a href="index.html?cat=${module.category}" class="page-category-badge">${cat?.icon || ''} ${cat?.name || ''}</a>
            <h1>${module.icon} ${module.title}</h1>
            <p>${module.description}</p>
            <p class="custom-module-meta">
                数据来源：info4 缓存 · data/info4.json
                · <button type="button" class="link-btn" id="deleteModuleBtn">删除此对比项</button>
            </p>`;

        selectPanelTitle.textContent = `选择${itemLabel}`;

        itemCrud = CompareItemCrud.create({
            moduleType: 'custom',
            moduleId: module.id,
            fieldDefs: CompareItemCrud.fieldDefsFromFields(cfg.fields || []),
            itemListEl: itemList,
            selectPanelHeader: document.querySelector('.select-panel-header'),
            selectedIds,
            getItems: () => allItems,
            setItems: (items) => { allItems = items; },
            onModuleSync: (mod) => {
                if (mod) module = mod;
            },
            onListRefresh: () => renderItemList(searchInput.value),
            onCompareRefresh: () => {
                if (lastCompared?.length) doCompare();
            },
        });

        compareView = initCompareResultView({
            container: compareBody,
            fields: runtimeFields,
            numericCompare,
            sortConfig: SORT_CONFIG,
            itemCrud,
        });

        mobileUI = initCompareMobileUI({
            compareBtn,
            onCompare: () => doCompare(),
            onClear: clearSelection,
        });

        document.getElementById('deleteModuleBtn').addEventListener('click', async () => {
            if (!confirm(`确定删除「${module.title}」？`)) return;
            await CustomModules.deleteModule(module.id);
            location.href = 'index.html';
        });

        itemList.addEventListener('click', (e) => {
            if (e.target.closest('.item-crud-btn')) return;
            const li = e.target.closest('li');
            if (!li || !li.dataset.id) return;
            const id = li.dataset.id;
            const numId = Number(id);
            const useId = Number.isFinite(numId) && String(numId) === id ? numId : id;

            if (itemCrud.isSelected(selectedIds, useId)) {
                selectedIds.forEach(v => {
                    if (String(v) === String(useId)) selectedIds.delete(v);
                });
            } else {
                selectedIds.add(useId);
            }
            renderItemList(searchInput.value);
        });

        searchInput.addEventListener('input', (e) => renderItemList(e.target.value));
        clearBtn.addEventListener('click', clearSelection);
        compareBtn.addEventListener('click', triggerCompare);

        initSelectAllAndEnter({
            selectAllBtn,
            searchInput,
            itemList,
            compareBtn,
            mobileCompareBtn: document.getElementById('mobileCompareBtn'),
            selectPanel: document.querySelector('.select-panel'),
            selectedIds,
            minCompare: MIN_COMPARE,
            getFiltered,
            onCompare: triggerCompare,
            onSelectionChange: () => renderItemList(searchInput.value),
        });

        window.addEventListener('resize', () => {
            if (lastCompared) compareView.render(lastCompared);
        });
    }

    function getEmptyStateHtml() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${module.icon}</div>
                <h3>选择${itemLabel}进行对比</h3>
                <p>从列表选择至少 ${MIN_COMPARE} ${unitLabel}；左侧与对比结果均支持增删改查</p>
            </div>`;
    }

    function getFiltered(filter = searchInput.value) {
        const keyword = filter.toLowerCase();
        return allItems.filter(item => {
            const haystack = [item.name, item.brand, item.category].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }

    function renderItemList(filter = '') {
        const filtered = getFiltered(filter);
        itemList.innerHTML = filtered.map(item => {
            const selected = itemCrud.isSelected(selectedIds, item.id);
            const priceText = item.price != null ? ` · ¥${parseFloat(item.price).toFixed(2)}` : '';
            const inner = `
                <div class="item-name">${item.name || item.id}</div>
                <div class="item-meta">${item.brand || ''}${item.brand && item.category ? ' · ' : ''}${item.category || ''}${priceText}</div>`;
            return itemCrud.wrapListItem(item, selected, inner);
        }).join('');
        updateUI();
    }

    function updateUI() {
        const filtered = getFiltered();
        selectedCount.textContent = selectedIds.size;
        compareBtn.disabled = selectedIds.size < MIN_COMPARE;
        compareBtn.textContent = selectedIds.size >= MIN_COMPARE
            ? `对比 ${selectedIds.size} ${unitLabel}${itemLabel}`
            : `至少选择 ${MIN_COMPARE} ${unitLabel}`;
        updateSelectAllBtn(selectAllBtn, filtered, selectedIds);
        mobileUI?.updateMobileBar(selectedIds.size, MIN_COMPARE);
    }

    function clearSelection() {
        selectedIds.clear();
        lastCompared = null;
        compareView?.reset();
        renderItemList(searchInput.value);
        compareBody.innerHTML = getEmptyStateHtml();
        compareTitle.textContent = '对比结果';
    }

    function doCompare() {
        if (selectedIds.size < MIN_COMPARE) return;
        compareTitle.textContent = `对比结果 (${selectedIds.size} ${unitLabel})`;
        const ids = Array.from(selectedIds);
        const items = allItems.filter(i => ids.some(id => String(id) === String(i.id)));
        lastCompared = items;
        compareView.render(items);
    }

    async function triggerCompare() {
        doCompare();
        if (CompareUtils.isMobileView()) mobileUI.switchTab('compare');
    }

    loadModule();
})();
