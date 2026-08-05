import type { z } from "zod";
import { BadRequestError } from "./errors";

export async function parseJson<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new BadRequestError("请求体必须是有效的 JSON");
  }

  return schema.parse(body);
}

export function parseFormData<TSchema extends z.ZodType>(
  formData: FormData,
  schema: TSchema
): z.infer<TSchema> {
  return schema.parse(Object.fromEntries(formData));
}
