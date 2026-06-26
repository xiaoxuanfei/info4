/**
 * 首页：分类对比、搜索、新增自定义对比
 */
(function () {
    const categoryFilters = document.getElementById('categoryFilters');
    const moduleSearch = document.getElementById('moduleSearch');
    const moduleContainer = document.getElementById('moduleContainer');
    const resultSummary = document.getElementById('resultSummary');
    const allModulesTitle = document.getElementById('allModulesTitle');
    const allModulesDesc = document.getElementById('allModulesDesc');
    const addModuleBtn = document.getElementById('addModuleBtn');
    const addModuleModal = document.getElementById('addModuleModal');
    const moduleNameInput = document.getElementById('moduleNameInput');
    const moduleCategorySelect = document.getElementById('moduleCategorySelect');
    const modulePreview = document.getElementById('modulePreview');
    const createModuleBtn = document.getElementById('createModuleBtn');
    const cancelModuleBtn = document.getElementById('cancelModuleBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');

    let activeCategory = 'all';
    let previewTimer = null;

    function getModules() {
        return getAllModules();
    }

    function renderCategoryFilters() {
        if (!categoryFilters) return;
        categoryFilters.innerHTML = COMPARE_CATEGORIES.map(cat => `
            <button type="button" class="category-chip ${cat.id === activeCategory ? 'active' : ''}"
                data-category="${cat.id}">
                <span class="category-chip-icon">${cat.icon}</span>
                ${cat.name}
            </button>
        `).join('');
    }

    function moduleMatchesSearch(mod, keyword) {
        if (!keyword) return true;
        const cat = getCategoryById(mod.category);
        const haystack = [
            mod.title,
            mod.description,
            cat?.name,
            cat?.description,
            ...(mod.keywords || []),
        ].join(' ').toLowerCase();
        return haystack.includes(keyword);
    }

    function getFilteredModules() {
        const keyword = moduleSearch.value.trim().toLowerCase();
        return getModules().filter(mod => {
            const categoryMatch = activeCategory === 'all' || mod.category === activeCategory;
            return categoryMatch && moduleMatchesSearch(mod, keyword);
        });
    }

    function isCustomModule(mod) {
        if (mod.custom) return true;
        if (String(mod.id).startsWith('custom-')) return true;
        return !COMPARE_MODULES.some(m => m.id === mod.id);
    }

    function renderModuleCard(mod) {
        const cat = getCategoryById(mod.category);
        const isCustom = isCustomModule(mod);
        const inner = `
                <span class="category-badge">${cat?.icon || ''} ${cat?.name || ''}</span>
                <div class="feature-icon ${mod.iconClass}">${mod.icon}</div>
                <h2>${mod.title}${isCustom ? ' <span class="custom-tag">自定义</span>' : ''}</h2>
                <p>${mod.description}</p>`;

        if (isCustom) {
            return `
            <div class="feature-card-wrap feature-card-custom-wrap" data-category="${mod.category}">
                <button type="button" class="module-delete-btn" data-id="${mod.id}" title="删除此对比项" aria-label="删除">
                    <span aria-hidden="true">×</span>
                </button>
                <a href="${mod.href}" class="feature-card feature-card-custom">${inner}</a>
            </div>`;
        }

        return `
            <a href="${mod.href}" class="feature-card" data-category="${mod.category}">
                ${inner}
            </a>`;
    }

    function renderCategoryBlock(cat, modules) {
        return `
            <section class="home-category-block" id="cat-${cat.id}">
                <div class="home-category-header">
                    <div class="home-category-header-icon">${cat.icon}</div>
                    <div class="home-category-header-body">
                        <h3>${cat.name}</h3>
                        <p>${cat.description}</p>
                        <span class="home-category-count">${modules.length} 个对比项</span>
                    </div>
                </div>
                <div class="feature-grid home-category-grid">
                    ${modules.map(renderModuleCard).join('')}
                </div>
            </section>`;
    }

    function renderGroupedModules(modules) {
        if (!moduleContainer) return;

        if (modules.length === 0) {
            moduleContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <h3>未找到匹配的对比项</h3>
                    <p>试试其他关键词，或点击「+ 新增对比」创建</p>
                </div>`;
            return;
        }

        const cats = activeCategory === 'all'
            ? COMPARE_CATEGORIES.filter(c => c.id !== 'all')
            : COMPARE_CATEGORIES.filter(c => c.id === activeCategory);

        const blocks = cats.map(cat => ({
            category: cat,
            modules: modules.filter(m => m.category === cat.id),
        })).filter(g => g.modules.length > 0);

        moduleContainer.innerHTML = blocks.map(g =>
            renderCategoryBlock(g.category, g.modules)
        ).join('');
    }

    function updateSummary(count) {
        if (!resultSummary) return;
        const cat = getCategoryById(activeCategory);
        const keyword = moduleSearch.value.trim();
        let text = `共 ${count} 个对比项`;
        if (activeCategory !== 'all') text += ` · ${cat.name}`;
        if (keyword) text += ` · 搜索「${keyword}」`;
        resultSummary.textContent = text;
    }

    function updateSectionTitles() {
        if (!allModulesTitle || !allModulesDesc) return;
        if (activeCategory === 'all') {
            allModulesTitle.textContent = '📂 分类对比';
            allModulesDesc.textContent = '每个分类下的对比项，点击卡片进入对比';
        } else {
            const cat = getCategoryById(activeCategory);
            allModulesTitle.textContent = `${cat?.icon || ''} ${cat?.name || ''}`;
            allModulesDesc.textContent = cat?.description || '';
        }
    }

    function render() {
        try {
            const modules = getFilteredModules();
            renderGroupedModules(modules);
            updateSummary(modules.length);
            renderCategoryFilters();
            updateSectionTitles();
        } catch (err) {
            console.error('首页渲染失败:', err);
            if (moduleContainer) {
                moduleContainer.innerHTML = `
                    <div class="error-message">对比项加载失败，请刷新页面。(${err.message})</div>`;
            }
        }
    }

    function setCategory(catId) {
        activeCategory = catId;
        render();
        if (catId !== 'all') {
            document.getElementById(`cat-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function renderPreviewCard(preview) {
        const cat = getCategoryById(preview.category);
        const fieldLabels = preview.fields.map(f => f.label).join('、');
        const sampleList = preview.sampleItems?.length
            ? `<ul class="preview-item-list">${preview.sampleItems.map(it =>
                `<li>${it.name}${it.price != null ? ` · ¥${parseFloat(it.price).toFixed(0)}` : ''}</li>`
            ).join('')}</ul>`
            : '';
        modulePreview.innerHTML = `
            <div class="preview-card">
                <div class="preview-icon">${preview.icon}</div>
                <div>
                    <strong>${preview.title}</strong>
                    <span class="preview-cat">${cat?.icon} ${cat?.name}</span>
                    <p class="preview-fields">对比字段：${fieldLabels}</p>
                    ${sampleList}
                    <p class="preview-hint">将使用本地模板生成 ${preview.sampleCount || 5} 条示例数据</p>
                </div>
            </div>`;
        createModuleBtn.disabled = false;
        if (!moduleCategorySelect.dataset.userPicked) {
            moduleCategorySelect.value = preview.category;
        }
    }

    function updatePreview() {
        const name = moduleNameInput.value.trim();
        const category = moduleCategorySelect.value;

        if (!name) {
            modulePreview.innerHTML = '<p class="preview-placeholder">输入名称后将自动识别类型并生成示例数据</p>';
            createModuleBtn.disabled = true;
            return;
        }

        clearTimeout(previewTimer);
        previewTimer = setTimeout(() => {
            const preview = CustomModules.buildPreview(name, category);
            if (!preview) {
                modulePreview.innerHTML = '<p class="preview-placeholder">无法识别该名称</p>';
                createModuleBtn.disabled = true;
                return;
            }
            renderPreviewCard(preview);
        }, 300);
    }

    function openModal() {
        moduleNameInput.value = '';
        moduleCategorySelect.value = 'life';
        delete moduleCategorySelect.dataset.userPicked;
        updatePreview();
        addModuleModal.classList.add('open');
        addModuleModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        setTimeout(() => moduleNameInput.focus(), 50);
    }

    function closeModal() {
        addModuleModal.classList.remove('open');
        addModuleModal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
    }

    if (categoryFilters) {
        categoryFilters.addEventListener('click', (e) => {
            const chip = e.target.closest('.category-chip');
            if (!chip) return;
            setCategory(chip.dataset.category);
        });
    }

    if (moduleContainer) {
        moduleContainer.addEventListener('mousedown', (e) => {
            if (e.target.closest('.module-delete-btn')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });

        moduleContainer.addEventListener('click', async (e) => {
            const delBtn = e.target.closest('.module-delete-btn');
            if (!delBtn) return;
            e.preventDefault();
            e.stopPropagation();

            const id = delBtn.dataset.id;
            const mod = CustomModules.getById(id);
            if (!mod) {
                await CustomModules.syncFromFile();
                render();
                return;
            }
            if (!confirm(`确定删除「${mod.title}」？\n删除后请到 info4 页导出 data/info4.json 同步到代码。`)) return;

            delBtn.disabled = true;
            try {
                await CustomModules.deleteModule(id);
                await CustomModules.syncFromFile();
                render();
            } catch (err) {
                alert('删除失败：' + err.message);
                delBtn.disabled = false;
            }
        });
    }

    if (moduleSearch) {
        moduleSearch.addEventListener('input', render);
        moduleSearch.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                moduleSearch.value = '';
                render();
            }
        });
    }

    if (addModuleBtn) addModuleBtn.addEventListener('click', openModal);
    if (cancelModuleBtn) cancelModuleBtn.addEventListener('click', closeModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (addModuleModal) {
        addModuleModal.addEventListener('click', (e) => {
            if (e.target === addModuleModal) closeModal();
        });
    }

    if (moduleNameInput) moduleNameInput.addEventListener('input', updatePreview);
    if (moduleCategorySelect) {
        moduleCategorySelect.addEventListener('change', () => {
            moduleCategorySelect.dataset.userPicked = '1';
            updatePreview();
        });
    }

    if (createModuleBtn) {
        createModuleBtn.addEventListener('click', async () => {
            const name = moduleNameInput.value.trim();
            if (!name) return;
            createModuleBtn.disabled = true;
            createModuleBtn.textContent = '正在创建...';
            try {
                const mod = await CustomModules.createModule(name, moduleCategorySelect.value);
                if (!mod) return;
                closeModal();
                location.href = mod.href;
            } catch (err) {
                alert('创建失败：' + err.message);
            } finally {
                createModuleBtn.disabled = false;
                createModuleBtn.textContent = '创建并打开';
            }
        });
    }

    if (moduleNameInput) {
        moduleNameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !createModuleBtn.disabled) {
                e.preventDefault();
                createModuleBtn.click();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && addModuleModal?.classList.contains('open')) {
            closeModal();
        }
    });

    const urlCategory = new URLSearchParams(location.search).get('cat');
    if (urlCategory && COMPARE_CATEGORIES.some(c => c.id === urlCategory)) {
        activeCategory = urlCategory;
    }

    async function init() {
        try {
            await Info4Store.ensureLoaded();
            await CustomModules.syncFromFile();
        } catch (err) {
            console.error('初始化失败:', err);
            if (moduleContainer) {
                moduleContainer.innerHTML = `
                    <div class="error-message">数据加载失败：${err.message}。请确认 data/info4.json 存在并用 Live Server 打开。</div>`;
            }
            return;
        }
        render();
    }

    init();
})();
