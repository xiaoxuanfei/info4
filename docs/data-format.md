# 数据文件说明

## 唯一数据文件

| 文件 | 用途 |
|------|------|
| `data/info4.json` | 全部对比数据（内置 + 自定义） |

## 结构

```json
{
  "version": 2,
  "builtin": {
    "phones": [ { "id": 1, "name": "...", ... } ],
    "beverages": [...],
    "snoring": [...],
    "browsers": [...]
  },
  "customModules": [
    {
      "id": "custom-xxx",
      "title": "自行车对比",
      "category": "life",
      "config": { "fields": [...], "items": [...] }
    }
  ]
}
```

## 读写

- **读取**：`fetch('data/info4.json')` → 写入 localStorage `info4`
- **写入**：在 info4 管理页编辑 → 导出 `info4.json` → 覆盖到 `data/`

返回 [知识库首页](README.md)
