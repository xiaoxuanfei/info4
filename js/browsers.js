/**
 * iOS 浏览器对比页面
 */
(function () {
    const BROWSER_FIELDS = [
        { key: 'developer', label: '开发商' },
        { key: 'engine', label: '渲染引擎' },
        { key: 'ios_min_version', label: '最低 iOS 版本' },
        { key: 'sync_service', label: '同步服务' },
        { key: 'ad_blocker', label: '广告拦截' },
        { key: 'tracking_protection', label: '跟踪保护', format: v => v + ' / 5' },
        { key: 'extensions_support', label: '扩展支持' },
        { key: 'password_manager', label: '密码管理' },
        { key: 'reader_mode', label: '阅读模式' },
        { key: 'tab_groups', label: '标签页管理' },
        { key: 'privacy_score', label: '隐私评分', format: v => v + ' / 5' },
        { key: 'feature_score', label: '功能丰富度', format: v => v + ' / 5' },
        { key: 'default_browser', label: '默认浏览器' },
        { key: 'translate', label: '翻译功能' },
        { key: 'data_collection', label: '数据收集' },
        { key: 'special_features', label: '特色功能' },
    ];

    const NUMERIC_COMPARE = {
        tracking_protection: 'max', privacy_score: 'max', feature_score: 'max', price: 'min',
    };

    const BROWSER_SORT_FIELDS = [
        { key: 'tracking_protection', label: '跟踪保护' },
        { key: 'privacy_score', label: '隐私评分' },
        { key: 'feature_score', label: '功能丰富度' },
        { key: 'price', label: '费用' },
    ];

    bootCompareBuiltin({
        dataFile: 'browsers',
        fields: BROWSER_FIELDS,
        numericCompare: NUMERIC_COMPARE,
        sortConfig: {
            fieldOptions: buildSortFieldOptions(BROWSER_SORT_FIELDS, NUMERIC_COMPARE, [
                { key: 'rating', label: '综合评分' },
                { key: 'value', label: '性价比（公式）' },
            ]),
            defaultRules: [{ key: 'privacy_score', order: 'desc' }, { key: 'feature_score', order: 'desc' }],
            defaultLayout: 'ltr',
            formula: {
                default: '(privacy_score * 2 + feature_score + tracking_protection) * 10',
                hint: '默认：(隐私×2 + 功能 + 跟踪保护) × 10',
                variables: ['privacy_score', 'feature_score', 'tracking_protection', 'price'],
            },
            getRating: (item) =>
                ((parseFloat(item.privacy_score) || 0) +
                (parseFloat(item.feature_score) || 0) +
                (parseFloat(item.tracking_protection) || 0)) / 3,
        },
        emptyIcon: '🌐',
        emptyTitle: '选择浏览器进行对比',
        emptyDesc: '左侧列表与对比结果均支持增删改查',
        itemLabel: '浏览器',
        unitLabel: '款',
    });
})();
