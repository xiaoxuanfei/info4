# 架构说明

## 技术栈

HTML + CSS + 原生 JavaScript + `data/info4.json` + localStorage

## 目录结构

```
break-info/
├── index.html          # 首页
├── info4.html          # 数据管理
├── compare.html        # 自定义对比
├── phones.html 等      # 内置对比页
├── data/info4.json     # 唯一数据文件
├── js/
│   ├── info4-store.js    # 缓存读写
│   ├── custom-modules.js # 自定义模块
│   ├── data-loader.js    # 内置数据加载
│   └── home.js           # 首页
└── css/style.css
```

## 数据流

```
data/info4.json ──fetch──► localStorage (info4) ──► 各对比页
                              │
                              └── 编辑 / 删除 / 导出
```

返回 [知识库首页](README.md)
