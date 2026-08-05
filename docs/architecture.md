# 目标架构

## 架构选择

项目继续采用 Next.js 模块化单体。公共站点、用户工作台、管理后台和 Route Handler 保持在同一应用中，共享认证、数据模型和部署单元。

不拆分微服务，也不为内部页面额外建设独立后端。只有需要被浏览器异步调用或未来可能开放给外部客户端的能力保留 Route Handler，其余服务端页面优先直接调用服务层。

## 依赖方向

```text
app route/page
    -> module component / module service
        -> authorization + schema validation
            -> Prisma / storage / external integration
```

依赖只能沿箭头向下。页面不得自行复制权限规则，客户端不得直接获得数据库模型中的敏感字段。

## 服务端边界

- `src/server/auth`：会话读取、数据库用户确认、角色和资源所有权检查。
- `src/server/http`：输入解析、统一错误和安全响应。
- `src/server/storage`：NAS 文件路径、文件类型、配额和文件生命周期。
- `src/modules/*/server`：领域查询和修改逻辑。

## 数据访问

- 查询使用最小 `select`，关联选择器集中复用。
- 公共查询必须固定 `status = PUBLISHED`，不能由查询参数取消。
- 私有查询必须从当前数据库用户派生权限，不能信任客户端传入的 `authorId` 或 `role`。
- 页面和 API 返回 DTO，不返回 `passwordHash`、`storedPath` 等服务端字段。

## 写操作

所有 Route Handler 和 Server Action 按以下顺序执行：

1. 认证当前用户。
2. 校验输入结构和长度。
3. 读取目标资源。
4. 检查角色或所有权。
5. 在必要时使用事务完成修改。
6. 返回最小结果并刷新相关缓存。

## 渐进式重构

- 保留现有路由和数据库表名。
- 先引入共享边界，再逐页把查询和写操作迁入模块。
- 每迁移一个领域，都通过功能基线回归后再删除旧实现。
- 生产数据库只执行已审核迁移，不使用 `db push`。
