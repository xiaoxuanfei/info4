/**
 * 饮料对比页面
 */
(function () {
    const BEVERAGE_FIELDS = [
        { key: 'brand', label: '品牌' },
        { key: 'category', label: '类别' },
        { key: 'price', label: '价格', format: v => '¥' + parseFloat(v).toFixed(2) },
        { key: 'volume', label: '容量', format: v => v + ' ml' },
        { key: 'calories', label: '热量', format: v => v + ' kcal/100ml' },
        { key: 'sugar', label: '糖分', format: v => v + ' g/100ml' },
        { key: 'caffeine', label: '咖啡因', format: v => v + ' mg/100ml' },
        { key: 'sodium', label: '钠', format: v => v + ' mg/100ml' },
        { key: 'ingredients', label: '主要成分' },
        { key: 'origin', label: '产地' },
        { key: 'flavor', label: '口味' },
    ];

    const NUMERIC_COMPARE = {
        price: 'min', volume: 'max', calories: 'min', sugar: 'min', caffeine: 'min', sodium: 'min',
    };

    bootCompareBuiltin({
        dataFile: 'beverages',
        fields: BEVERAGE_FIELDS,
        numericCompare: NUMERIC_COMPARE,
        sortConfig: {
            fieldOptions: buildSortFieldOptions(BEVERAGE_FIELDS, NUMERIC_COMPARE, [
                { key: 'rating', label: '健康评分' },
                { key: 'value', label: '性价比（公式）' },
            ]),
            defaultRules: [{ key: 'sugar', order: 'asc' }, { key: 'volume', order: 'desc' }],
            defaultLayout: 'ltr',
            formula: {
                default: '(100 - calories - sugar * 2) / price * 50',
                hint: '默认：健康分/价格×50',
                variables: ['price', 'volume', 'calories', 'sugar', 'caffeine', 'sodium'],
            },
            getRating: (item) =>
                Math.max(0, 100 - (parseFloat(item.calories) || 0)) +
                Math.max(0, 20 - (parseFloat(item.sugar) || 0)),
        },
        emptyIcon: '🥤',
        emptyTitle: '选择饮料进行对比',
        emptyDesc: '左侧列表与对比结果均支持增删改查',
        itemLabel: '饮料',
        unitLabel: '款',
    });
})();
