import { NextRequest, NextResponse } from "next/server";
import { subscriptionTargetSchema } from "@/modules/subscriptions/subscription.schemas";
import {
  addSubscription,
  listSubscriptions,
  removeSubscription,
} from "@/modules/subscriptions/server/subscription-service";
import { requireAnyUser } from "@/server/auth/guards";
import { routeErrorResponse } from "@/server/http/response";
import { parseJson } from "@/server/http/validation";

export async function GET() {
  try {
    const user = await requireAnyUser();
    return NextResponse.json(await listSubscriptions(user.id));
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAnyUser();
    const input = await parseJson(request, subscriptionTargetSchema);
    return NextResponse.json(await addSubscription(user.id, input), { status: 201 });
  } catch (error) {
    return routeErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAnyUser();
    const input = subscriptionTargetSchema.parse(Object.fromEntries(request.nextUrl.searchParams));
    await removeSubscription(user.id, input);
    return NextResponse.json({ success: true });
  } catch (error) {
    return routeErrorResponse(error);
  }
}
