# 英才科协信息库后续开发与维护手册

本文档说明生产环境已经运行后，后续如何开发、测试、发布、维护和回退。项目代码位于 Windows 开发机，生产版本运行在 NAS；不要直接在 NAS 上修改业务代码。

## 1. 环境边界

```text
Windows 开发机
  -> feature/bugfix 分支
  -> 基本检查和构建
  -> GitHub main
  -> NAS 备份、拉取、迁移、构建、重启
  -> Nginx Proxy Manager
  -> Next.js 生产进程 :3000
```

当前生产信息：

- 项目目录：`/volume1/docker/yckx`
- NAS：`192.168.1.120`
- 站点域名：`yckx.iceaxing.com`
- Next.js：`0.0.0.0:3000`
- NPM：`8080 -> 80`、`4443 -> 443`、`8181 -> 81`
- PostgreSQL 和 `UPLOAD_DIR` 必须使用生产持久化数据
- 公网入站目前受校园网上级网络限制，只能在校园网/局域网验收

## 2. 开发分支

在 Windows PowerShell 中执行：

```powershell
cd "E:\repo_英才科协信息库\yckx-web-main"
git switch main
git pull --ff-only origin main
git switch -c feat/功能名称
```

开发环境使用 `.env.local` 或本地 `.env`，不能复制生产 `.env` 到 Git，也不能让本地应用连接生产数据库。文档统一放在 `docs`。

完成后执行：

```powershell
corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm format:check
corepack.cmd pnpm lint
corepack.cmd pnpm typecheck
corepack.cmd pnpm test
corepack.cmd pnpm db:validate
corepack.cmd pnpm build
git diff --check
```

本项目的自动化协作只做基本检查，不启动本地开发服务器。

## 3. 数据库变更

修改 `prisma/schema.prisma` 后，先在开发数据库生成并验证 migration，再提交 migration 文件：

```powershell
corepack.cmd pnpm db:generate
corepack.cmd pnpm exec prisma migrate dev --name describe_change
corepack.cmd pnpm db:migrate:status
```

生产环境只执行：

```bash
pnpm db:migrate:deploy
```

禁止在生产环境执行：

```text
prisma db push
prisma migrate dev
prisma migrate reset
pnpm db:migrate
git reset --hard
```

涉及删除字段、枚举替换、数据回填或文件关联的迁移，必须先备份 PostgreSQL 和 `/volume1/docker/yckx/uploads`，并设计前向兼容的分阶段发布。不要依赖不存在的通用 down migration。

## 4. 合并和发布

完成本地检查后提交并推送：

```powershell
git add <修改的文件>
git commit -m "feat: describe change"
git push -u origin feat/功能名称
```

合并到 `main` 后，在 NAS 执行以下标准流程。除 `git pull` 之外的每一步都属于 NAS 运维操作：

```bash
cd /volume1/docker/yckx

# 1. 先备份 PostgreSQL 和 uploads
# 2. 拉取已合并的 main
git fetch origin
git pull --ff-only origin main

# 3. 安装依赖、生成 Client、执行已审核迁移
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:status
pnpm db:migrate:deploy

# 4. 构建新版本
pnpm build

# 5. 停止旧 Next.js 进程后启动生产版本
pnpm exec next start -H 0.0.0.0 -p 3000
```

如果使用进程管理器或 NAS 任务管理器，应使用对应的重启命令，不要同时启动第二个 `3000` 进程。出现 `EADDRINUSE` 时先用 `ss -ltnp | grep ':3000'` 找到并确认旧的 Next.js PID。

## 5. 环境变量

生产 `.env` 只保留在 NAS 项目根目录，并设置：

```bash
chmod 600 /volume1/docker/yckx/.env
```

以下变量的处理规则：

- `NEXT_PUBLIC_*`：修改后必须重新 `pnpm build` 并重启。
- `DATABASE_URL`、`AUTH_SECRET`、`AUTH_TRUST_HOST`、`SMTP_*`、`EMAIL_WORKER_SECRET`：修改后必须重启；生产发布时建议同时重新构建。
- Next.js 16 使用 Cache Components。Server Action 中使用 `updateTag`，Route Handler 中使用 `revalidateTag(tag, "max")`，并结合 `revalidatePath` 失效公开文章、成员资料、头像或首页统计缓存；修改 `next.config.ts` 的 `cacheComponents` 后必须重新构建并检查静态外壳与流式加载。
- SMTP 使用 `smtp.163.com:465`，`SMTP_PASSWORD` 是客户端授权码，不是登录密码。
- `EMAIL_WORKER_SECRET` 曾经泄露或被写入聊天/日志时，必须生成新值，并同步更新定时任务脚本。

生成新密钥：

```bash
openssl rand -base64 48
```

## 6. Nginx Proxy Manager

NPM Docker 容器的端口映射：

```text
8080:80   网站 HTTP
4443:443  网站 HTTPS
8181:81   NPM 管理页面，仅局域网
```

Proxy Host：

```text
Domain Names: yckx.iceaxing.com
Scheme: http
Forward Hostname / IP: 192.168.1.120
Forward Port: 3000
Websockets Support: 开启
Block Common Exploits: 开启
```

Next.js 必须监听 `0.0.0.0:3000`，否则 Docker 中的 NPM 会返回 `502 Bad Gateway`。SSL 证书使用 Cloudflare DNS Challenge；证书申请成功不代表公网端口已经开放。

不要将 `3000`、`8181`、SSH、PostgreSQL 或 NAS 管理端口转发到公网。

## 7. 邮件与定时任务

验证码和密码重置邮件由应用通过 SMTP 立即发送；订阅通知使用 `EmailOutbox`，由 worker 处理。当前校园网公网不可达时，worker 必须调用本机地址：

```bash
curl --fail --silent --show-error --max-time 30 \
  -X POST "http://127.0.0.1:3000/api/internal/email-outbox/process" \
  -H "x-email-worker-secret: ${EMAIL_WORKER_SECRET}"
```

返回：

```json
{ "sent": 0, "failed": 0 }
```

表示接口鉴权成功但当前没有待发送记录，不代表 SMTP 已经完成测试。注册验证码或找回密码邮件应通过页面单独验证；订阅邮件需要先订阅再发布知识库、新闻或竞赛文章。

NAS 任务计划建议每分钟执行一次，脚本中的 secret 不得写入 Git、公开文档或命令历史。

## 8. 发布后验收

每次发布至少检查：

1. `curl -I http://127.0.0.1:3000` 返回正常状态。
2. 局域网通过 NPM 访问首页和一篇已发布文章。
3. 登录、游客后台、内部后台权限隔离正确。
4. 游客注册和找回密码能收到验证码。
5. 游客可以发表评论，管理员可以删除评论。
6. 订阅可增加、取消和修改分类/专栏。
7. 知识库、新闻、竞赛首次发布后可生成 Outbox 记录并发送邮件。
8. 日常文章和大事记不会触发订阅邮件。
9. 上传目录、数据库写入和日志正常。
10. 内部成员文件库显示 5GB 总空间和 1GB 单文件上限，公开图片首次访问后能复用展示副本和 ETag。
11. NPM、Next.js、数据库和定时任务在 NAS 重启后能恢复。

### 照片上传故障定位

- 页面提示 `上传目录暂时不可用` 时，检查 `.env` 中的 `UPLOAD_DIR` 是否为持久化绝对路径，并确认运行 Next.js 的系统用户拥有目录的读写权限和剩余空间。
- 页面提示 `HTTP 413` 时，检查 Nginx Proxy Manager 的请求体上限和超时；代理上限应覆盖单文件 1GB 限制，照片建议先压缩到适合网页展示的尺寸。
- 文件上传和照片入库是连续的两个请求。若文件上传成功但照片发布失败，优先执行 `pnpm db:migrate:status`，确认 `20260806230000_routine_group_photos` 已应用，再重启当前 Next.js 进程。

## 9. 回退和故障处理

应用回退应提交一个修复提交或部署已知可用的历史提交并重新构建，不在生产目录执行破坏性 Git 清理。数据库问题先停止写流量，保留日志，再根据备份和迁移说明恢复数据库与 `uploads` 到同一时间点。

典型故障：

- `EADDRINUSE: 3000`：已有 Next.js 进程运行，先确认 PID，不要重复启动。
- NPM `502`：检查 Next.js 是否监听 `0.0.0.0:3000`，以及 Proxy Host 是否指向 `192.168.1.120:3000`。
- SSL HTTP Challenge 超时：公网 `80` 不可达；使用 DNS Challenge 或检查路由器/上级网络。
- 移动网络访问 `80/443` 超时、校园网可访问：校园网上级网络拦截入站，需要网络管理员或 VPS + FRP。

所有生产操作、备份、迁移、重启和网络配置都应记录日期、提交 SHA、迁移状态、操作者和结果。
