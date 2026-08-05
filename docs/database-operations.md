# 数据库迁移、备份与恢复

## 基本约束

- 生产环境只执行 `pnpm db:migrate:deploy`，禁止使用 `prisma db push`、`prisma migrate dev` 和 `prisma migrate reset`。
- 迁移文件必须先进入 Git，并经过测试和人工复核。
- 任何生产迁移前都要备份 PostgreSQL 和 `UPLOAD_DIR`。
- 备份只有在校验可读并完成过恢复演练后才可作为回退依据。

## 迁移链

当前迁移顺序：

1. `20260731000000_baseline`：描述重构前已经存在的业务表、索引和外键。
2. `20260801165502_add_fts`：加入文章全文搜索列、索引、触发器和历史数据回填。
3. `20260805090000_add_news_and_milestones`：加入新闻分类枚举、默认科协新闻分类和大事记表。
4. `20260806090000_content_domains`：加入文章领域、新闻/日常专栏类型、成员分类创建者、附件用途和照片文件关联，并回填历史文章与专栏。
5. `20260806120000_admin_deletion_and_avatars`：加入头像文件关联和 `AVATAR` 文件用途，并将用户所有内容的外键改为数据库级联删除。
6. `20260806180000_technical_columns_and_markdown_styles`：加入分类下技术专栏、文章与技术专栏多对多关系，以及文章 Markdown 渲染风格。

基线迁移用于新建空数据库。它绝不能直接应用到已经包含业务表的生产数据库。

第三个迁移的回退需要先停止大事记写入并备份数据库，再删除 `milestones` 表及其索引；PostgreSQL 枚举值不能通过普通向下迁移安全移除，因此应用回退时保留 `NEWS` 枚举和新闻分类记录，或从迁移前备份整体恢复。

第四个迁移会根据旧分类类型和旧 `PostType` 回填 `PostKind`，并删除旧 `postType` 列和枚举。该迁移不移动 `UPLOAD_DIR` 中的文件，也不改写文章 slug。由于包含枚举替换和数据回填，不提供通用向下迁移；需要回退时必须同时恢复迁移前数据库备份和与其一致的上传目录快照，再部署旧应用提交。

第六个迁移不改写现有分类、专栏、文章 slug 或 Markdown 正文。现有文章统一回填为 `DEFAULT` 渲染风格，新增关联表初始为空。回退应用版本前应从迁移前数据库备份恢复；仅删除新增表和列会丢失技术专栏归属及文章样式选择。

## 现有生产库首次接入基线

以下操作只做一次，且必须在维护窗口内进行：

1. 确认当前代码对应的数据库 schema 与 `prisma/schema.prisma` 一致。
2. 完成数据库和上传目录备份，并在隔离数据库执行恢复演练。
3. 查看迁移状态：`pnpm db:migrate:status`。
4. 对已经存在业务表、但尚未登记此迁移链的数据库，只登记基线：

```bash
pnpm exec prisma migrate resolve --applied 20260731000000_baseline
```

5. 执行 `pnpm db:migrate:deploy`。全文搜索迁移使用幂等 DDL，即使旧 SQL 曾被手工运行，也应让正式迁移执行并写入迁移记录。
6. 再次运行 `pnpm db:migrate:status`，确认没有待执行或失败迁移。

如果 `_prisma_migrations` 已存在未知记录，或者 schema 对比发现差异，停止操作并先分析差异；不要通过 `resolve --applied` 掩盖不一致。

## PostgreSQL 备份

优先在数据库容器或具备匹配版本 PostgreSQL 客户端的 NAS 环境执行。示例中的文件名应包含精确时间：

```bash
pg_dump --format=custom --no-owner --file=<backup-directory>/yckx-YYYYMMDD-HHMMSS.dump "$DATABASE_URL"
pg_restore --list <backup-directory>/yckx-YYYYMMDD-HHMMSS.dump
```

校验内容至少包括命令退出码、文件非空、`pg_restore --list` 可读取，以及备份文件的 SHA-256。不要把 `DATABASE_URL` 或密码打印进共享日志。

## 上传目录备份

在停止写入或进入维护模式后，对 `UPLOAD_DIR` 创建带时间戳的快照或归档，并记录 SHA-256、文件数量和总大小。优先使用 NAS 的只读快照；使用归档时必须保留文件权限，并确认目标路径不位于被归档目录内部。

## 恢复演练

1. 创建隔离的临时数据库，禁止连接生产数据库名。
2. 使用 `pg_restore --clean --if-exists --no-owner` 恢复备份。
3. 检查核心表数量、管理员登录所需记录、三类文章回填结果、分类/专栏类型以及文章与文件关联。
4. 将上传目录备份恢复到隔离路径，并抽查数据库中的文件记录可解析到该目录。
5. 使用隔离环境变量启动应用，完成登录、文章读取、搜索和文件下载检查。
6. 记录演练时间、备份标识、结果和清理情况。

## 故障处理

- 迁移失败时不要重复手工修改 `_prisma_migrations`。
- 保留失败日志和数据库状态，停止新版本写流量。
- 可修复迁移应提交新的前向迁移；只有确认迁移实际完成或已完整回滚时，才使用 `prisma migrate resolve`。
- 需要恢复时，应同时恢复数据库和上传目录到一致时间点，再部署与该数据版本兼容的应用提交。
