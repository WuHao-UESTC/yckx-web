# 英才科协信息库

电子科技大学英才实验学院科协的信息展示与内容管理站点。项目采用 Next.js 模块化单体架构，包含公共站点、成员工作台、管理后台、PostgreSQL 数据库和 NAS 文件存储。

## 环境要求

- Node.js 24
- pnpm 11.20.0（通过 Corepack 管理）
- PostgreSQL
- 生产环境可持久化的上传目录

## 本地开发

```bash
corepack enable
pnpm install --frozen-lockfile
```

根据 [`.env.example`](.env.example) 创建本地环境变量文件，至少配置 `DATABASE_URL` 和 `AUTH_SECRET`。首次连接空数据库时执行：

```bash
pnpm db:migrate
pnpm dev
```

应用默认运行于 <http://localhost:3000>。种子数据不是启动前置条件；确需初始化管理员和邀请码时，先设置全部 `SEED_*` 变量，再运行 `pnpm db:seed`。

## 常用命令

| 命令                     | 用途                                   |
| ------------------------ | -------------------------------------- |
| `pnpm dev`               | 启动开发服务器                         |
| `pnpm build`             | 构建 standalone 生产包                 |
| `pnpm validate`          | 依次检查格式、Lint、Prisma、类型和测试 |
| `pnpm format`            | 统一格式化项目文件                     |
| `pnpm db:migrate`        | 为本地开发创建迁移                     |
| `pnpm db:migrate:deploy` | 在生产环境应用已提交迁移               |
| `pnpm db:migrate:status` | 检查迁移状态                           |
| `pnpm db:seed`           | 显式创建初始数据                       |

项目只使用 `pnpm-lock.yaml`。不要提交 npm、Yarn 或 Bun 的额外锁文件。

## 项目结构

```text
src/app/                 Next.js 路由、页面和 Route Handler
src/components/          跨领域 UI 组件
src/modules/             领域组件、Schema、查询和业务服务
src/server/              鉴权、HTTP 与文件存储基础设施
src/lib/                 通用集成和纯工具
prisma/                  Schema、迁移和种子脚本
docs/                    工程、架构、安全与运维文档
```

## 部署与运维

- [NAS 部署流程](docs/deployment.md)
- [数据库迁移、备份与恢复](docs/database-operations.md)
- [工程规范](docs/engineering-standards.md)
- [目标架构](docs/architecture.md)
- [安全边界](docs/security.md)
- [功能基线](docs/functional-baseline.md)

生产数据库禁止使用 `prisma db push` 或 `prisma migrate reset`。现有数据库第一次接入本迁移链时，必须按数据库运维文档完成备份、恢复演练和 baseline 标记。
