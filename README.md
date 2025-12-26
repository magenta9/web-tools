# Web Tools

一套实用的 Web 开发工具集，基于 Next.js 和 TypeScript 构建。

## 功能特性

- **JWT Tool**: JWT 编码和解码
- **JSON Tool**: JSON 格式化、验证和处理
- **JSON Fix**: AI 辅助修复损坏的 JSON
- **Image Tool**: 图片格式转换和尺寸调整
- **Timestamp Tool**: 时间戳格式转换
- **Diff Tool**: 文本差异对比
- **Translate Tool**: AI 翻译工具
- **AI SQL**: AI 辅助 SQL 生成

## 项目结构

```
web-tools/
├── app/                    # Next.js 前端
│   ├── jwt/               # JWT 工具
│   ├── json/              # JSON 工具
│   ├── jsonfix/           # JSON 修复工具
│   ├── image/             # 图片工具
│   ├── timestamp/         # 时间戳工具
│   ├── diff/              # 差异对比工具
│   ├── translate/         # 翻译工具
│   ├── aisql/             # AI SQL 工具
│   └── components/        # 公共组件
├── server-go/             # Go API 服务器
│   ├── cmd/server/        # 入口
│   ├── internal/          # 内部模块
│   └── docker/            # 数据库配置
└── locales/               # 国际化
```

## 技术栈

**前端:**
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

**后端:**
- Go 1.23+
- Gin Web 框架
- PostgreSQL (历史记录)
- Ollama (AI 功能)

## 快速开始

### 自动化安装 (推荐)

运行自动安装脚本，检查并安装所有必要依赖：

```bash
./setup.sh
```

该脚本会自动：
- 检查 Node.js、Bun、Docker 等依赖
- 安装缺失的依赖（如 Bun）
- 安装前端依赖包
- 提供设置状态摘要

### 手动启动

#### 一键启动前端

```bash
bun install && bun dev
```

访问 [http://localhost:3000](http://localhost:3000)

#### 一键部署后端 (可选，用于 AI 功能和历史记录)

```bash
cd server-go && make up
```

API 服务运行在 [http://localhost:3001](http://localhost:3001)

> **说明**: 后端服务包含 PostgreSQL 数据库和 Go API 服务器，用于支持历史记录存储和 AI 功能。前端可独立运行，不依赖后端服务。

## 可用脚本

| 命令 | 说明 |
|------|------|
| `bun dev` | 启动前端开发服务器 |
| `bun run build` | 构建生产版本 |
| `bun run start` | 启动生产服务器 |
| `bun run lint` | 运行 ESLint |

## 部署

前端支持静态导出，可部署到：
- GitHub Pages
- Netlify
- Vercel
- 任何静态托管服务

```bash
bun run build
# 静态文件生成在 out/ 目录
```

## License

MIT
