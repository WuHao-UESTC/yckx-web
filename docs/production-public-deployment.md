# NAS 公网生产部署操作手册

本文档用于将当前仅在 NAS 局域网运行的英才科协信息库部署为可从公网访问的生产站点。

目标结构：

```text
公网用户
  -> 域名 HTTPS
  -> 路由器 443 端口或 VPS/反向隧道
  -> NAS Nginx Proxy Manager
  -> Next.js 生产进程 0.0.0.0:3000
  -> PostgreSQL
```

当前实测部署信息（2026-08-06）：

- NAS：UGREEN NASync DXP4800 Plus，局域网地址 `192.168.1.120`。
- 路由器 WAN IPv4：`218.194.32.92`，网关 `218.194.32.1`。
- 域名：`yckx.iceaxing.com`，DNS 由 Cloudflare 管理。
- Nginx Proxy Manager 运行在 Docker 中：NAS `8080 -> NPM 80`、`4443 -> NPM 443`、`8181 -> NPM 81`。
- Next.js 通过 `pnpm exec next start -H 0.0.0.0 -p 3000` 运行，NPM 目标为 `192.168.1.120:3000`。
- SSL 证书已通过 Cloudflare DNS Challenge 申请。
- 当前只能从校园网/局域网访问，移动网络访问公网 `80/443` 超时，推测教育网上级网络拦截入站连接。公网访问问题未解决前，不要把“证书申请成功”当作“公网已经可访问”。
- 当前邮件 worker 应调用本机地址 `http://127.0.0.1:3000`，不依赖公网域名。

禁止直接将 Next.js 开发服务器、PostgreSQL、NAS 管理端口或 SSH 端口暴露到公网。数据库密码、163 授权码、`AUTH_SECRET` 和 `EMAIL_WORKER_SECRET` 不得提交到 Git、写入公开文档或发送到聊天记录。

## 1. 开发机提交代码

在 Windows 开发机 PowerShell 中执行：

```powershell
cd "E:\repo_英才科协信息库\yckx-web-main"

corepack.cmd pnpm install --frozen-lockfile
corepack.cmd pnpm validate
corepack.cmd pnpm build
```

确认检查成功后提交并推送到 `main`：

```powershell
git status
git add .
git commit -m "feat: add guest accounts comments subscriptions and email notifications"
git push origin main
```

如果当前分支或远程仓库不明确，先执行：

```powershell
git branch --show-current
git remote -v
```

NAS 生产发布只从 GitHub `main` 分支拉取代码。

## 2. 确认 NAS 基础信息

从电脑 SSH 登录 NAS：

```bash
ssh -p <SSH端口> <NAS用户名>@192.168.1.120
```

检查项目目录：

```bash
cd /volume1/docker/yckx
pwd
ls
```

如果目录不正确，查找项目：

```bash
find /volume1/docker -maxdepth 4 -name package.json -print
```

检查当前运行方式：

```bash
ps -ef | grep -E "next dev|next start|pnpm" | grep -v grep
docker ps
docker compose ps
```

记录当前采用的运行方式：

- 直接运行 `pnpm dev`；
- Docker Compose；
- NAS 图形界面管理的容器。

如果使用 Docker Compose，依赖安装、Prisma 迁移、构建和启动都应在实际 Web 容器或镜像构建流程中完成。先使用 `docker compose config --services` 确认服务名，不得猜测服务名。

## 3. 检查公网 IPv4

在 NAS 执行：

```bash
curl -4 https://api.ipify.org
echo
ip -4 addr
```

同时登录路由器管理页面，查看 WAN 或互联网 IPv4 地址。

### 3.1 具有公网 IPv4

如果 NAS 查询到的公网地址与路由器 WAN 地址一致，通常可以继续采用域名、端口转发和 NAS 反向代理方案。

### 3.2 处于 CGNAT

如果路由器 WAN 地址属于以下范围，或者与公网查询结果不一致，通常表示处于运营商 CGNAT：

```text
10.0.0.0/8
172.16.0.0/12
192.168.0.0/16
100.64.0.0/10
```

CGNAT 环境不能使用普通端口转发，应采用 Cloudflare Tunnel、FRP 或 VPS 反向代理。推荐优先使用 Cloudflare Tunnel。采用 Tunnel 时通常不需要开放路由器 80/443 入站端口。

## 4. 准备域名

建议使用固定域名，例如：

```text
yckx.example.com
```

具有公网 IPv4 时，在域名 DNS 管理处添加：

```text
记录类型：A
主机记录：yckx
记录值：公网 IPv4
TTL：默认
```

检查解析结果：

```bash
nslookup yckx.example.com
```

解析结果应与公网 IPv4 一致。公网 IP 会变化时，需要配置路由器 DDNS、Cloudflare DNS 自动更新或域名服务商提供的 DDNS。

## 5. 备份数据库和上传目录

任何生产数据库迁移前都必须备份 PostgreSQL 和 `UPLOAD_DIR`。

创建备份目录：

```bash
mkdir -p /volume1/docker/yckx-backups
```

如果 PostgreSQL 位于 Docker 容器，先确认服务名：

```bash
docker compose config --services
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}"
```

根据实际服务名和数据库配置执行：

```bash
docker compose exec -T <postgres服务名> \
  pg_dump -U <数据库用户> -d <数据库名> -Fc \
  > /volume1/docker/yckx-backups/yckx-$(date +%Y%m%d-%H%M%S).dump
```

检查备份：

```bash
ls -lh /volume1/docker/yckx-backups
pg_restore --list /volume1/docker/yckx-backups/<实际备份文件名>.dump
```

备份上传目录。假设当前上传目录为 `/volume1/docker/yckx/uploads`：

```bash
tar -czf /volume1/docker/yckx-backups/uploads-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /volume1/docker/yckx uploads
```

至少保留一份已经验证可读取的数据库备份和上传目录备份。

## 6. 配置生产环境变量

项目的 `prisma.config.ts` 使用 `dotenv/config`，NAS 上应在项目根目录创建 `.env`。不要只创建 `.env.production`，否则 Prisma CLI 可能无法读取 `DATABASE_URL`。

```bash
cd /volume1/docker/yckx
vi .env
```

填写：

```dotenv
DATABASE_URL=生产环境PostgreSQL连接串
AUTH_SECRET=随机高强度密钥
AUTH_TRUST_HOST=true

UPLOAD_DIR=/volume1/docker/yckx/uploads

NEXT_PUBLIC_SITE_URL=https://yckx.example.com

SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=wushenlunzhe007@163.com
SMTP_PASSWORD=163客户端授权码
SMTP_FROM=wushenlunzhe007@163.com
SMTP_SECURE=true

EMAIL_WORKER_SECRET=新的随机高强度密钥
```

`SMTP_PASSWORD` 必须填写 163 邮箱客户端授权码，不是邮箱登录密码。

生成随机密钥：

```bash
openssl rand -base64 48
```

如果 NAS 没有 `openssl`：

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

限制环境变量文件权限：

```bash
chmod 600 .env
git status --short
```

`.env` 不应出现在 Git 待提交文件中。

## 7. 拉取生产代码

```bash
cd /volume1/docker/yckx
git fetch origin
git pull --ff-only origin main
```

禁止在生产环境使用：

```text
git reset --hard
prisma db push
prisma migrate dev
prisma migrate reset
pnpm db:migrate
```

生产数据库只执行已经提交并审核的 `pnpm db:migrate:deploy`。

## 8. 安装依赖并迁移数据库

直接运行 Node.js 时执行：

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate:status
pnpm db:migrate:deploy
pnpm db:migrate:status
```

迁移状态应包含并成功应用：

```text
20260808100000_external_users_comments_subscriptions
```

Docker Compose 环境示例：

```bash
docker compose config --services
docker compose exec <web服务名> pnpm install --frozen-lockfile
docker compose exec <web服务名> pnpm db:generate
docker compose exec <web服务名> pnpm db:migrate:status
docker compose exec <web服务名> pnpm db:migrate:deploy
```

必须将 `<web服务名>` 替换为 `docker compose config --services` 返回的真实服务名。

## 9. 停止开发服务器

查找当前进程：

```bash
ps -ef | grep -E "next dev|next start" | grep -v grep
```

确认进程号后停止：

```bash
kill <进程号>
```

不要使用 `pkill -f node`，避免终止 NAS 上其他 Node.js 服务。

Docker Compose 环境使用：

```bash
docker compose stop <web服务名>
```

## 10. 构建并启动生产版本

```bash
cd /volume1/docker/yckx
pnpm build
```

直接运行时，先前台测试：

```bash
pnpm exec next start -H 0.0.0.0 -p 3000
```

另开终端检查：

```bash
curl -I http://127.0.0.1:3000
```

应返回正常 HTTP 状态，而不是连接失败。

临时后台运行：

```bash
nohup pnpm exec next start -H 0.0.0.0 -p 3000 \
  > /volume1/docker/yckx/next.log 2>&1 &
```

`nohup` 仅适用于初次验证。正式生产运行应使用 Docker Compose、NAS 任务管理器或其他进程管理方式，确保 NAS 重启后应用自动恢复。

## 11. 配置 NAS 反向代理

群晖 DSM 通常位于：

```text
控制面板
-> 登录门户
-> 高级
-> 反向代理服务器
```

创建规则：

```text
来源协议：HTTPS
来源主机名：yckx.example.com
来源端口：443

目标协议：HTTP
目标主机名：127.0.0.1
目标端口：3000
```

同时配置：

- HTTP 自动跳转 HTTPS；
- 请求体大小满足文章附件和图片上传需求；
- 转发 `Host`；
- 转发 `X-Forwarded-Proto`；
- NAS 界面提供 WebSocket 选项时启用。

其他 NAS 系统中查找 `Reverse Proxy`、`反向代理`、`Application Portal` 或 `应用门户`。

本项目当前使用 Nginx Proxy Manager。推荐在 NPM 中使用以下 Proxy Host：

```text
Domain Names: yckx.iceaxing.com
Scheme: http
Forward Hostname / IP: 192.168.1.120
Forward Port: 3000
Websockets Support: 开启
Block Common Exploits: 开启
```

NPM 容器的管理页面使用 NAS `8181`，不得转发到公网。若使用 Docker 中的 NPM，Next.js 不能只监听 `127.0.0.1`，否则容器会返回 `502 Bad Gateway`。

## 12. 配置 HTTPS 证书

在 NAS 证书管理界面申请 Let's Encrypt 证书，域名填写：

```text
yckx.example.com
```

当前使用 Cloudflare DNS Challenge，因此申请和续期证书不依赖公网 `80`。DNS Challenge 仍需要 NAS 能够访问 Cloudflare API；Cloudflare Zero Trust 不可用不影响 DNS API 的使用。采用 HTTP Challenge 时，公网必须能够访问 NAS 的 80 端口。采用 Cloudflare Tunnel 时按照 Tunnel 的证书方案配置，不一定需要将 80/443 端口转发到 NAS。

## 13. 配置路由器端口转发

只有确认具有公网 IPv4 时才配置：

```text
TCP 80  -> 192.168.1.120:80
TCP 443 -> 192.168.1.120:443
```

如果 NPM 使用本项目的 Docker 端口映射，则路由器内部端口应改为：

```text
TCP 80  -> 192.168.1.120:8080
TCP 443 -> 192.168.1.120:4443
```

公网端口 `443` 与路由器管理页面冲突时，应关闭 WAN 管理或把路由器管理 HTTPS 改为高位端口；不要把正式网站的公网端口改成高位端口。

禁止向公网开放：

```text
3000  Next.js 内部端口
5432  PostgreSQL
5000/5001 NAS 管理端口
22    SSH
```

采用 Cloudflare Tunnel 时通常不需要此步骤。

## 14. 测试公网访问

```bash
nslookup yckx.example.com
curl -I https://yckx.example.com
```

浏览器检查：

```text
https://yckx.example.com
https://yckx.example.com/login
https://yckx.example.com/register
```

确认首页、登录页和注册页可以打开，HTTPS 证书有效，浏览器没有混合内容警告。

## 15. 配置 163 SMTP

登录 163 邮箱网页版：

1. 进入邮箱设置。
2. 找到 POP3/SMTP/IMAP 服务。
3. 开启 SMTP 服务。
4. 完成短信或安全验证。
5. 生成客户端授权码。
6. 将授权码填写到 NAS `.env` 的 `SMTP_PASSWORD`。
7. 完整重启 Next.js 应用。

## 16. 配置邮件 Outbox 定时任务

公网接口可用后先测试：

```bash
curl -X POST http://127.0.0.1:3000/api/internal/email-outbox/process \
  -H "x-email-worker-secret: 实际密钥"
```

公网域名能够从 NAS 回环访问时，也可以使用 `https://yckx.example.com`。如果校园网阻止公网入站，必须使用本机地址，不能因为域名证书已申请成功就继续调用公网地址。

正常返回示例：

```json
{ "sent": 0, "failed": 0 }
```

创建 worker 环境文件：

```bash
vi /volume1/docker/yckx-worker.env
```

内容：

```dotenv
EMAIL_WORKER_SECRET=实际密钥
```

设置权限：

```bash
chmod 600 /volume1/docker/yckx-worker.env
```

创建脚本：

```bash
vi /volume1/docker/yckx-worker.sh
```

内容：

```bash
#!/bin/sh

set -eu

. /volume1/docker/yckx-worker.env

curl --fail --silent --show-error --max-time 30 \
  -X POST "http://127.0.0.1:3000/api/internal/email-outbox/process" \
  -H "x-email-worker-secret: ${EMAIL_WORKER_SECRET}"
```

设置权限并测试：

```bash
chmod 700 /volume1/docker/yckx-worker.sh
/volume1/docker/yckx-worker.sh
```

在 NAS 任务计划中创建：

```text
任务类型：用户自定义脚本
运行用户：运行应用的专用用户
执行频率：每 1 分钟
执行脚本：/volume1/docker/yckx-worker.sh
```

## 17. 上线验收

依次验证：

1. 匿名用户可以读取已发布文章。
2. 匿名用户不能读取草稿。
3. 游客注册可以收到邮箱验证码。
4. 科协人员注册必须填写有效邀请码。
5. 未验证邮箱不能登录。
6. 游客登录后进入 `/guest`。
7. 游客不能访问内部 `/dashboard` 写功能。
8. 游客可以直接发表评论。
9. 管理员可以在 `/admin/comments` 删除评论。
10. 用户可以订阅整站、分类和专栏。
11. 发布知识库、竞赛或新闻文章后生成邮件 Outbox 任务。
12. worker 执行后收到 163 邮件通知。
13. 日常文章和大事记不发送订阅邮件。
14. 上传文件继续写入持久化 `UPLOAD_DIR`。
15. 日志中不包含数据库凭据、SMTP 授权码或绝对存储路径。
16. NAS 重启后应用和定时任务能够恢复。

## 18. 回退原则

- 应用回退使用明确的历史 Git 提交并重新构建，不使用 `git reset --hard` 清理生产目录。
- 数据库迁移没有通用的自动向下回滚。发生严重问题时先停止写流量，再恢复迁移前 PostgreSQL 备份。
- 上传目录恢复必须与数据库恢复到同一时间点。
- 回退后重新执行首页、登录、草稿权限、上传、搜索和数据库写入检查。
