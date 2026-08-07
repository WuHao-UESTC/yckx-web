export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class BadRequestError extends HttpError {
  constructor(message = "请求参数无效") {
    super(400, "BAD_REQUEST", message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "请先登录") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "无权执行此操作") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "资源不存在") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends HttpError {
  constructor(message = "资源状态冲突") {
    super(409, "CONFLICT", message);
  }
}

export class StorageUnavailableError extends HttpError {
  constructor(message = "上传目录暂时不可用，请检查服务器存储配置") {
    super(503, "STORAGE_UNAVAILABLE", message);
  }
}
