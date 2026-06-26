# BreakInfo 产品对比平台

纯前端本地部署：**HTML + JS + JSON**，无需后端。

## 快速开始

1. VS Code 打开 **`break-info` 根目录**
2. 安装 [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) 扩展
3. 点击 **Go Live** → 访问 `http://127.0.0.1:8080`

## 数据文件

所有对比数据集中在 **`data/info4.json`**：

- 内置对比：手机、饮料、止鼾、浏览器
- 自定义对比模块

浏览器缓存键名也为 `info4`。编辑后请到 [info4 管理页](info4.html) 导出 `info4.json` 覆盖到 `data/` 目录。

## 知识库

| 文档 | 内容 |
|------|------|
| [docs/README.md](docs/README.md) | 知识库索引 |
| [快速开始](docs/getting-started.md) | Live Server 启动 |
| [info4 缓存](docs/info4.md) | 增删改查与导出 |
| [数据格式](docs/data-format.md) | JSON 结构 |
| [架构说明](docs/architecture.md) | 项目结构 |

## 功能

- 多类目对比（生活类 / 应用类 / 方法类）
- 内置与自定义对比项
- info4 本地缓存增删改查
- 多级排序、性价比公式、移动端适配

## License

See [LICENSE](LICENSE)
