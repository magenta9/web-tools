# Web Tools Go Server

用于 Web Tools 的 Go API 服务器，替代原有的 Node.js 服务器。

## 目录结构

```
server-go/
├── cmd/
│   └── server/
│       └── main.go              # 应用入口
├── internal/
│   ├── config/
│   │   └── config.go            # 配置管理
│   ├── handler/
│   │   ├── database.go          # MySQL 数据库操作
│   │   ├── history.go           # 历史记录管理
│   │   └── ollama.go            # Ollama AI 接口
│   ├── model/
│   │   └── model.go             # 数据模型定义
│   └── repository/
│       └── repository.go        # PostgreSQL 数据访问层
├── docker/
│   ├── docker-compose.yml       # PostgreSQL 容器配置
│   └── init.sql                 # 数据库初始化脚本
├── Makefile                     # 常用命令
├── go.mod                       # Go 模块定义
├── go.sum                       # 依赖锁定
├── .env.example                 # 环境变量示例
└── README.md
```

## 系统要求

- Go 1.23+
- Docker & Docker Compose
- Ollama (用于 AI 功能)

## 快速开始

### 1. 启动数据库

```bash
make db-up
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 根据需要编辑 .env 文件
```

### 3. 运行服务器

```bash
# 开发模式
make run

# 或编译后运行
make build
./bin/server
```

## Makefile 命令

| 命令 | 说明 |
|------|------|
| `make db-up` | 启动 PostgreSQL 容器 |
| `make db-down` | 停止 PostgreSQL 容器 |
| `make db-reset` | 重置数据库（删除所有数据） |
| `make db-logs` | 查看数据库日志 |
| `make run` | 运行服务器（开发模式） |
| `make build` | 编译二进制文件 |
| `make clean` | 清理编译产物 |

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_PORT` | 3001 | API 服务端口 |
| `DB_HOST` | localhost | PostgreSQL 主机 |
| `DB_PORT` | 5432 | PostgreSQL 端口 |
| `DB_USER` | webtools | PostgreSQL 用户名 |
| `DB_PASSWORD` | webtools123 | PostgreSQL 密码 |
| `DB_NAME` | webtools | PostgreSQL 数据库名 |
| `OLLAMA_HOST` | http://localhost:11434 | Ollama API 地址 |

## API 文档

### 健康检查

#### GET /api/health

检查服务器状态。

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2025-12-25T20:00:00+08:00"
}
```

---

### Ollama AI 接口

#### GET /api/ollama/models

获取可用的 Ollama 模型列表。

**响应示例：**
```json
{
  "success": true,
  "models": [
    {"name": "llama3.2", "size": 2048000000, "modified_at": "2025-12-25T10:00:00Z"}
  ],
  "host": "http://localhost:11434"
}
```

#### POST /api/ollama/generate

根据数据库 Schema 生成 SQL 查询。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `prompt` | string | ✓ | 自然语言描述 |
| `schema` | string | | 数据库 Schema |
| `model` | string | | 模型名称，默认 llama3.2 |

**请求示例：**
```json
{
  "prompt": "查询所有用户",
  "schema": "Table: users\n  Columns:\n    - id int (PRIMARY KEY)\n    - name varchar(100)",
  "model": "llama3.2"
}
```

**响应示例：**
```json
{
  "success": true,
  "response": "SELECT * FROM users;"
}
```

#### POST /api/ollama/chat

与 AI 进行对话。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `message` | string | ✓ | 消息内容 |

**请求示例：**
```json
{
  "message": "解释一下 JOIN 的用法"
}
```

#### POST /api/ollama/translate

AI 翻译接口。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `text` | string | ✓ | 待翻译文本 |
| `sourceLang` | string | ✓ | 源语言 (zh/en/ja) |
| `targetLang` | string | ✓ | 目标语言 (zh/en/ja) |
| `style` | string | | 风格: standard/casual/formal |
| `model` | string | | 模型名称 |

**请求示例：**
```json
{
  "text": "Hello, world!",
  "sourceLang": "en",
  "targetLang": "zh",
  "style": "casual"
}
```

**响应示例：**
```json
{
  "success": true,
  "translation": "你好，世界！"
}
```

---

### MySQL 数据库操作

#### POST /api/db/connect

测试 MySQL 数据库连接。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `host` | string | ✓ | 数据库主机 |
| `port` | int | | 端口，默认 3306 |
| `user` | string | ✓ | 用户名 |
| `password` | string | | 密码 |
| `database` | string | | 数据库名 |
| `ssl` | bool | | 是否启用 SSL |

**请求示例：**
```json
{
  "host": "localhost",
  "port": 3306,
  "user": "root",
  "password": "password"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "Connection successful"
}
```

#### POST /api/db/databases

获取数据库列表。

**请求参数：** 同 `/api/db/connect`

**响应示例：**
```json
{
  "success": true,
  "databases": ["information_schema", "mysql", "myapp"]
}
```

#### POST /api/db/schema

获取数据库 Schema 信息。

**请求参数：** 同 `/api/db/connect`，`database` 为必填

**响应示例：**
```json
{
  "success": true,
  "schema": {
    "tables": {
      "users": [
        {"name": "id", "type": "int", "nullable": false, "isPrimaryKey": true},
        {"name": "name", "type": "varchar(100)", "nullable": true, "isPrimaryKey": false}
      ]
    },
    "formatted": "Database Schema:\n\nTable: users\n  Columns:\n    - id int (PRIMARY KEY)\n    - name varchar(100)\n"
  }
}
```

#### POST /api/db/execute

执行 SQL 查询（仅支持只读操作）。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `sql` | string | ✓ | SQL 查询语句 |
| `host` | string | ✓ | 数据库主机 |
| `port` | int | | 端口 |
| `user` | string | ✓ | 用户名 |
| `password` | string | | 密码 |
| `database` | string | ✓ | 数据库名 |
| `ssl` | bool | | 是否启用 SSL |

**安全限制：** 仅允许 `SELECT`、`SHOW`、`DESCRIBE`、`EXPLAIN`、`WITH` 开头的查询。

**请求示例：**
```json
{
  "sql": "SELECT * FROM users LIMIT 10",
  "host": "localhost",
  "user": "root",
  "password": "password",
  "database": "myapp"
}
```

**响应示例：**
```json
{
  "success": true,
  "rows": [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"}
  ],
  "header": "id\tname",
  "rowCount": 2
}
```

---

### 历史记录（需要 PostgreSQL）

#### POST /api/history

保存工具使用历史。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tool_name` | string | ✓ | 工具名称 |
| `input_data` | any | | 输入数据 |
| `output_data` | any | | 输出数据 |

**请求示例：**
```json
{
  "tool_name": "json",
  "input_data": {"raw": "{\"a\":1}"},
  "output_data": {"formatted": "{\n  \"a\": 1\n}"}
}
```

#### GET /api/history

获取工具使用历史。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `tool_name` | string | ✓ | 工具名称 |
| `limit` | int | | 返回数量，默认 50 |

**请求示例：**
```
GET /api/history?tool_name=json&limit=10
```

**响应示例：**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "tool_name": "json",
      "input_data": {"raw": "{\"a\":1}"},
      "output_data": {"formatted": "{\n  \"a\": 1\n}"},
      "created_at": "2025-12-25T20:00:00+08:00"
    }
  ]
}
```

---

## 数据库 Schema

### tool_history 表

存储工具使用历史记录。

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | SERIAL | 主键 |
| `tool_name` | VARCHAR(50) | 工具名称 |
| `input_data` | JSONB | 输入数据 |
| `output_data` | JSONB | 输出数据 |
| `created_at` | TIMESTAMP | 创建时间 |

### config 表

存储配置信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | VARCHAR(100) | 配置键（主键） |
| `value` | JSONB | 配置值 |
| `updated_at` | TIMESTAMP | 更新时间 |

---

## 技术栈

- **Web 框架**: [Gin](https://github.com/gin-gonic/gin)
- **PostgreSQL 驱动**: [pgx](https://github.com/jackc/pgx)
- **MySQL 驱动**: [go-sql-driver/mysql](https://github.com/go-sql-driver/mysql)
- **环境变量**: [godotenv](https://github.com/joho/godotenv)

## 特性

- **优雅降级**: 即使 PostgreSQL 不可用，服务器也能正常启动（历史记录功能除外）
- **API 兼容**: 与原 Node.js 服务器 API 完全兼容，前端无需修改
- **安全限制**: 数据库查询仅允许只读操作
- **CORS 支持**: 默认允许所有来源的跨域请求
- **请求日志**: 自动记录所有 API 请求

## 开发说明

### 添加新的 API 端点

1. 在 `internal/handler/` 下创建或修改 handler
2. 在 `cmd/server/main.go` 中注册路由
3. 如需数据库操作，在 `internal/repository/` 中添加方法

### 修改数据库 Schema

1. 修改 `docker/init.sql`
2. 运行 `make db-reset` 重置数据库

## License

MIT
