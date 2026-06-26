/**
 * 止鼾方案对比页面
 */
(function () {
    const SNORING_FIELDS = [
        { key: 'brand', label: '品牌/来源' },
        { key: 'category', label: '类别' },
        { key: 'price', label: '参考价格', format: v => v === 0 ? '免费' : '¥' + parseFloat(v).toLocaleString() },
        { key: 'treatment_type', label: '类型' },
        { key: 'usage_method', label: '使用方式' },
        { key: 'principle', label: '作用原理' },
        { key: 'effectiveness_rate', label: '有效率', format: v => v + '%' },
        { key: 'suitable_for', label: '适用人群' },
        { key: 'comfort_score', label: '舒适度', format: v => v + ' / 5' },
        { key: 'portability_score', label: '便携性', format: v => v + ' / 5' },
        { key: 'noise_db', label: '噪音', format: v => v === 0 ? '无' : v + ' dB' },
        { key: 'daily_usage', label: '使用频率' },
        { key: 'side_effects', label: '副作用/注意' },
        { key: 'maintenance', label: '维护要求' },
        { key: 'insurance', label: '医保/费用' },
    ];

    const NUMERIC_COMPARE = {
        price: 'min', effectiveness_rate: 'max', comfort_score: 'max',
        portability_score: 'max', noise_db: 'min',
    };

    bootCompareBuiltin({
        dataFile: 'snoring',
        fields: SNORING_FIELDS,
        numericCompare: NUMERIC_COMPARE,
        sortConfig: {
            fieldOptions: buildSortFieldOptions(SNORING_FIELDS, NUMERIC_COMPARE, [
                { key: 'rating', label: '综合评分' },
                { key: 'value', label: '性价比（公式）' },
            ]),
            defaultRules: [{ key: 'price', order: 'asc' }, { key: 'effectiveness_rate', order: 'desc' }],
            defaultLayout: 'ltr',
            formula: {
                default: '(effectiveness_rate * 0.6 + comfort_score * 10 + portability_score * 5) / (price + 1)',
                hint: '默认：(有效率×0.6 + 舒适度×10 + 便携×5) / (费用+1)',
                variables: ['price', 'effectiveness_rate', 'comfort_score', 'portability_score', 'noise_db'],
            },
            getRating: (item) =>
                (parseFloat(item.effectiveness_rate) || 0) * 0.6 +
                (parseFloat(item.comfort_score) || 0) * 10 +
                (parseFloat(item.portability_score) || 0) * 5,
        },
        emptyIcon: '😴',
        emptyTitle: '选择方案进行对比',
        emptyDesc: '左侧列表与对比结果均支持增删改查',
        itemLabel: '方案',
        unitLabel: '种',
    });
})();
