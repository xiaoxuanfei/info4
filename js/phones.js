/**
 * 手机对比页面
 */
(function () {
    const PHONE_FIELDS = [
        { key: 'brand', label: '品牌' },
        { key: 'price', label: '价格', format: v => '¥' + parseFloat(v).toLocaleString() },
        { key: 'screen_size', label: '屏幕尺寸', format: v => v + ' 英寸' },
        { key: 'resolution', label: '分辨率' },
        { key: 'processor', label: '处理器' },
        { key: 'ram', label: '运行内存', format: v => v + ' GB' },
        { key: 'storage', label: '存储容量', format: v => v + ' GB' },
        { key: 'battery', label: '电池容量', format: v => v + ' mAh' },
        { key: 'camera_main', label: '主摄像头' },
        { key: 'camera_front', label: '前置摄像头' },
        { key: 'os', label: '操作系统' },
        { key: 'weight', label: '重量', format: v => v + ' g' },
        { key: 'release_date', label: '发布日期' },
    ];

    const NUMERIC_COMPARE = {
        price: 'min', screen_size: 'max', ram: 'max', storage: 'max', battery: 'max', weight: 'min',
    };

    bootCompareBuiltin({
        dataFile: 'phones',
        fields: PHONE_FIELDS,
        numericCompare: NUMERIC_COMPARE,
        sortConfig: {
            fieldOptions: buildSortFieldOptions(PHONE_FIELDS, NUMERIC_COMPARE, [
                { key: 'rating', label: '配置评分' },
                { key: 'value', label: '性价比（公式）' },
            ]),
            defaultRules: [{ key: 'price', order: 'asc' }],
            defaultLayout: 'ltr',
            defaultDisplayMode: 'table',
            formula: {
                default: '(ram * 2 + storage + battery / 50) / price * 1000',
                hint: '默认：配置加权分/价格×1000。可用变量: price, ram, storage, battery, screen_size, weight',
                variables: ['price', 'ram', 'storage', 'battery', 'screen_size', 'weight'],
            },
            getRating: (item) =>
                (parseFloat(item.ram) || 0) * 2 +
                (parseFloat(item.storage) || 0) +
                (parseFloat(item.battery) || 0) / 50,
        },
        emptyIcon: '📱',
        emptyTitle: '选择手机进行对比',
        emptyDesc: '从列表选择至少 2 款手机；左侧列表与对比结果均支持增删改查',
        itemLabel: '手机',
        unitLabel: '款',
    });
})();
