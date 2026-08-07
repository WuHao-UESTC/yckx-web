import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { removeUserAvatar, replaceUserAvatar } from "@/modules/users/server/avatar-service";
import { requireUser } from "@/server/auth/guards";
import { BadRequestError } from "@/server/http/errors";
import { routeErrorResponse } from "@/server/http/response";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) throw new BadRequestError("未选择头像文件");

    const avatar = await replaceUserAvatar(user.id, file);
    revalidatePath("/");
    revalidatePath("/friends");
    revalidatePath(`/friends/${user.username}`);
    revalidateTag(`friend:${user.username}`, "max");
    revalidateTag("friends", "max");
    revalidatePath("/dashboard/profile");
    return NextResponse.json(avatar);
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    await removeUserAvatar(user.id);
    revalidatePath("/");
    revalidatePath("/friends");
    revalidatePath(`/friends/${user.username}`);
    revalidateTag(`friend:${user.username}`, "max");
    revalidateTag("friends", "max");
    revalidatePath("/dashboard/profile");
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
