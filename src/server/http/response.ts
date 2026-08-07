import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./errors";

export function routeErrorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "请求参数无效",
        code: "VALIDATION_ERROR",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
  }

  if (process.env.NODE_ENV === "production") {
    console.error("Unhandled route error", {
      type: error instanceof Error ? error.name : typeof error,
      code: error instanceof Error ? (error as NodeJS.ErrnoException).code : undefined,
    });
  } else {
    console.error("Unhandled route error", error);
  }
  return NextResponse.json(
    { error: "服务器处理请求时发生错误", code: "INTERNAL_ERROR" },
    { status: 500 }
  );
}
