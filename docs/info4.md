# info4 本地缓存

info4 是 BreakInfo 的统一数据层：浏览器 `localStorage` 键名 **`info4`**，文件 **`data/info4.json`**。

## 文件结构

```json
{
  "version": 2,
  "updatedAt": 1234567890,
  "builtin": {
    "phones": [...],
    "beverages": [...],
    "snoring": [...],
    "browsers": [...]
  },
  "customModules": [...]
}
```

## 使用流程

1. 打开首页自动从 `data/info4.json` 加载到缓存
2. 在 [info4.html](../info4.html) 或首页增删改查
3. 点击 **导出 info4.json** 覆盖到 `data/` 目录

## 操作说明

| 按钮 | 作用 |
|------|------|
| 从 data/ 重新加载 | 用服务器上的 info4.json 覆盖本地缓存 |
| 导出 info4.json | 下载单个文件覆盖到 data/ |
| 备份 info4 | 下载 info4-backup.json |
| 清除 info4 | 删除浏览器缓存 |

返回 [知识库首页](README.md)
