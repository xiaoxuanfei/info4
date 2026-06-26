# BreakInfo 知识库

BreakInfo 是纯前端本地产品对比平台（HTML + JS + JSON）。

## 文档目录

| 文档 | 说明 |
|------|------|
| [快速开始](getting-started.md) | 安装 Live Server、启动预览 |
| [数据文件说明](data-format.md) | info4.json 格式 |
| [架构说明](architecture.md) | 目录结构、数据流 |
| [info4 缓存](info4.md) | 增删改查与导出 |

## 常用操作

| 目标 | 操作 |
|------|------|
| 本地预览 | Go Live → `http://127.0.0.1:8080` |
| 管理数据 | [info4 管理页](../info4.html) |
| 导出到代码 | info4 页 → 导出 info4.json → 覆盖 `data/` |
| 首页删除对比 | 自定义卡片左上角 × |

## 数据

- 唯一文件：`data/info4.json`
- 浏览器缓存键名：`info4`

返回 [README.md](../README.md)
