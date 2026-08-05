import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { renameMemberCategory } from "@/modules/taxonomies/server/taxonomy-service";
import { renameCategorySchema } from "@/modules/taxonomies/taxonomy.schemas";
import { requireUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const user = await requireUser();
    const { slug } = await params;
    const input = await parseJson(req, renameCategorySchema);
    const category = await renameMemberCategory(slug, input, user);
    revalidatePath("/knowledge-base");
    revalidatePath("/competition");
    revalidatePath("/dashboard/taxonomies");
    revalidatePath("/admin/categories");
    return NextResponse.json(category);
  } catch (error) {
    return routeErrorResponse(error);
  }
}
