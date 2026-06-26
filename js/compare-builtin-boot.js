/**
 * 内置对比页通用启动（列表 + 对比结果增删改查）
 */
function bootCompareBuiltin(options) {
    const {
        dataFile,
        fields,
        numericCompare,
        sortConfig,
        minCompare = 2,
        emptyIcon = '📦',
        emptyTitle = '选择项目进行对比',
        emptyDesc = '从列表选择至少 2 项后开始对比',
        unitLabel = '款',
        itemLabel = '项',
    } = options;

    let allItems = [];
    let selectedIds = new Set();
    let lastCompared = null;
    let itemCrud = null;
    let compareView = null;

    const itemList = document.getElementById('itemList');
    const searchInput = document.getElementById('searchInput');
    const selectedCount = document.getElementById('selectedCount');
    const compareBtn = document.getElementById('compareBtn');
    const clearBtn = document.getElementById('clearBtn');
    const selectAllBtn = document.getElementById('selectAllBtn');
    const compareBody = document.getElementById('compareBody');
    const compareTitle = document.getElementById('compareTitle');

    itemCrud = CompareItemCrud.create({
        moduleType: 'builtin',
        moduleId: dataFile,
        fieldDefs: CompareItemCrud.fieldDefsFromFields(fields),
        itemListEl: itemList,
        selectPanelHeader: document.querySelector('.select-panel-header'),
        selectedIds,
        getItems: () => allItems,
        setItems: (items) => { allItems = items; },
        onListRefresh: () => renderItemList(searchInput.value),
        onCompareRefresh: () => {
            if (lastCompared?.length) doCompare();
        },
    });

    compareView = initCompareResultView({
        container: compareBody,
        fields,
        numericCompare,
        sortConfig,
        itemCrud,
    });

    const mobileUI = initCompareMobileUI({
        compareBtn,
        onCompare: () => doCompare(),
        onClear: clearSelection,
    });

    function getEmptyStateHtml() {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${emptyIcon}</div>
                <h3>${emptyTitle}</h3>
                <p>${emptyDesc}</p>
            </div>`;
    }

    async function loadItems() {
        compareBody.innerHTML = '<div class="loading"><div class="spinner"></div>加载中...</div>';
        try {
            await Info4Store.ensureLoaded();
            allItems = Info4Store.getBuiltinItems(dataFile);
            if (!allItems.length) {
                const extraKeys = fields.map(f => f.key).slice(0, 4);
                allItems = await DataLoader.loadListFields(dataFile, extraKeys);
            }
            renderItemList();
            compareBody.innerHTML = getEmptyStateHtml();
        } catch (err) {
            compareBody.innerHTML = `<div class="error-message">加载失败: ${err.message}</div>`;
        }
    }

    function getFiltered(filter = searchInput.value) {
        const keyword = filter.toLowerCase();
        return allItems.filter(item => {
            const haystack = [item.name, item.brand, item.category]
                .filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(keyword);
        });
    }

    function renderItemList(filter = '') {
        const filtered = getFiltered(filter);
        itemList.innerHTML = filtered.map(item => {
            const selected = itemCrud.isSelected(selectedIds, item.id);
            const priceText = item.price != null
                ? ` · ¥${parseFloat(item.price).toLocaleString()}`
                : '';
            const inner = `
                <div class="item-name">${item.name}</div>
                <div class="item-meta">${item.brand || ''}${priceText}</div>`;
            return itemCrud.wrapListItem(item, selected, inner);
        }).join('');
        updateUI();
    }

    function updateUI() {
        const filtered = getFiltered();
        selectedCount.textContent = selectedIds.size;
        compareBtn.disabled = selectedIds.size < minCompare;
        compareBtn.textContent = selectedIds.size >= minCompare
            ? `对比 ${selectedIds.size} ${unitLabel}${itemLabel}`
            : `至少选择 ${minCompare} ${unitLabel}`;
        updateSelectAllBtn(selectAllBtn, filtered, selectedIds);
        mobileUI.updateMobileBar(selectedIds.size, minCompare);
    }

    itemList.addEventListener('click', (e) => {
        if (e.target.closest('.item-crud-btn')) return;
        const li = e.target.closest('li');
        if (!li) return;
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

    function clearSelection() {
        selectedIds.clear();
        lastCompared = null;
        compareView.reset();
        renderItemList(searchInput.value);
        compareBody.innerHTML = getEmptyStateHtml();
        compareTitle.textContent = '对比结果';
    }

    clearBtn.addEventListener('click', clearSelection);

    async function triggerCompare() {
        await doCompare();
        if (CompareUtils.isMobileView()) mobileUI.switchTab('compare');
    }

    compareBtn.addEventListener('click', triggerCompare);

    initSelectAllAndEnter({
        selectAllBtn,
        searchInput,
        itemList,
        compareBtn,
        mobileCompareBtn: document.getElementById('mobileCompareBtn'),
        selectPanel: document.querySelector('.select-panel'),
        selectedIds,
        minCompare,
        getFiltered,
        onCompare: triggerCompare,
        onSelectionChange: () => renderItemList(searchInput.value),
    });

    function doCompare() {
        if (selectedIds.size < minCompare) return;
        compareTitle.textContent = `对比结果 (${selectedIds.size} ${unitLabel})`;
        const ids = Array.from(selectedIds);
        const items = allItems.filter(i => ids.some(id => String(id) === String(i.id)));
        lastCompared = items;
        compareView.render(items);
    }

    window.addEventListener('resize', () => {
        if (lastCompared) compareView.render(lastCompared);
    });

    loadItems();
}
