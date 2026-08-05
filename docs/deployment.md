# NAS 部署

生产站点位于 NAS `192.168.1.120`，代码以 GitHub `main` 分支作为唯一发布来源。本文档不保存 SSH 凭据、数据库密码或其他密钥。

## 首次部署前确认

在执行生产操作前记录以下实际值：

- SSH 用户和端口。
- 项目绝对路径。
- 进程管理方式，或 Docker Compose 项目名与 Web/PostgreSQL 服务名。
- PostgreSQL 数据库名、备份目录和上传目录。
- 当前反向代理的域名、HTTPS 和请求大小限制。

这些信息确定后写入 NAS 的受限运维配置，不提交到 Git。

## 发布门槛

开发机在推送 `main` 前必须执行：

```bash
pnpm install --frozen-lockfile
pnpm validate
pnpm build
```

GitHub Actions 的 `Quality` 检查必须通过。涉及数据库或文件存储的版本还必须完成 [数据库与文件备份](database-operations.md)。

## 标准发布顺序

以下命令中的路径和服务命令必须替换为 NAS 上的实际值：

```bash
ssh -p <port> <user>@192.168.1.120
cd <deployment-directory>
git fetch origin
git pull --ff-only origin main
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm build
<restart-web-service>
```

`src/generated/prisma` 不进入 Git，因此每次包含 `prisma/schema.prisma` 变更的更新都必须在 NAS 重新执行 `pnpm db:generate`。项目的 `dev`、`build` 和 `start` 脚本也会在启动前自动生成 Client，但数据库迁移仍必须显式执行。

## NAS 开发服务器更新

NAS 上长期运行 `next dev` 时，Git 拉取不会替换进程内已经加载的 Prisma Client。包含 Schema 或迁移的更新按以下顺序执行：

```bash
git pull --ff-only origin main
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:status
pnpm db:migrate:deploy
<stop-current-dev-process>
pnpm dev
```

必须先停止旧进程再执行最后的 `pnpm dev`。仅依赖热更新会继续使用旧枚举和模型 delegate，表现为 `Expected CategoryType` 或 `findMany` 未定义。

如果应用由 Docker Compose 构建和运行，则依赖安装、迁移、构建和重启应在对应容器或镜像流程中完成。禁止猜测服务名后直接操作生产容器。

部署后至少检查：

1. 公共首页和一篇已发布文章可访问。
2. 登录、工作台和管理员页面权限正确。
3. 草稿不能由匿名用户访问。
4. 上传、下载和删除文件使用持久化 `UPLOAD_DIR`。
5. 搜索、文章阅读量和数据库写入正常。
6. 应用日志中没有凭据、绝对存储路径或数据库堆栈泄漏。

## 回退原则

- 应用回退使用明确的历史 Git 提交，并重新构建；不使用 `git reset --hard` 清理生产目录。
- 数据库迁移没有通用的自动向下回滚。先停止写流量，再根据该版本的迁移说明和已验证备份恢复。
- 上传目录恢复必须与数据库恢复到同一备份时间点，避免文件记录和磁盘内容不一致。
- 回退完成后重复部署后检查并记录原因。
