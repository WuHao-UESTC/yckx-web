# 工程规范

## 基本原则

- 使用 TypeScript 严格模式，不通过 `any`、双重类型断言或关闭规则绕过类型问题。
- `src/app` 只负责路由入口、页面组合、Route Handler 和框架约定文件。
- 业务规则放在 `src/modules/<feature>`，跨业务的服务端基础设施放在 `src/server`。
- 数据库记录不得直接作为公共接口响应；使用明确的 `select` 或 DTO。
- 所有外部输入均不可信，包括 JSON、FormData、查询参数、路由参数和文件元数据。

## 命名

- 文件和目录：`kebab-case`。
- React 组件和类型：`PascalCase`。
- 函数、变量和属性：`camelCase`。
- 常量：`UPPER_SNAKE_CASE`。
- Boolean 使用 `is`、`has`、`can`、`should` 前缀。
- Prisma Model 使用单数 PascalCase，数据库表名通过 `@@map` 保持兼容。
- 路由使用名词和稳定资源标识，不把展示文案写入 URL。

## 模块结构

```text
src/
  app/                    # Next.js 路由入口
  components/             # 跨模块 UI 与布局
  modules/
    posts/
      components/
      server/
      posts.schemas.ts
      posts.types.ts
  server/
    auth/
    http/
    storage/
  lib/                    # 无业务归属的纯工具
```

## 导入与导出

- 优先使用 `@/` 绝对导入。
- 导入顺序为：框架、第三方、项目模块、相对路径、样式。
- 默认导出仅用于 Next.js 约定文件和单一主组件；其他模块使用命名导出。
- 服务端专用模块使用 `import "server-only"`，避免进入客户端包。

## 函数与错误处理

- 一个函数只承担一个明确职责。
- 不使用空的 `.catch(() => {})` 隐藏失败。
- Route Handler 使用统一错误响应，不向客户端返回堆栈、数据库错误或文件系统路径。
- 删除、发布、角色变更等操作必须先重新读取可信记录并检查所有权或角色。
- 多表修改使用事务，避免部分成功。

## 注释

- 注释解释原因、约束和异常情况，不重复描述代码表面行为。
- 删除装饰性分隔线和会随布局变化失效的“左侧/右侧”说明。
- 公共函数仅在调用约束不明显时编写简短 JSDoc。
- `TODO` 必须说明完成条件，长期任务应关联 issue。

## 提交前检查

- 格式化、Lint、类型检查和测试必须全部通过。
- 数据库变更必须包含迁移和回滚说明。
- 安全边界变化必须同步更新 `docs/security.md`。
- 功能变化必须同步更新 `docs/functional-baseline.md`。
