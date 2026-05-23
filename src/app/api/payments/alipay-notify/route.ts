import { NextResponse } from "next/server";
import { handleAlipayNotify } from "@/lib/alipay";

export async function POST(request: Request) {
  const body = await request.text();
  const params = new URLSearchParams(body);
  const form = Object.fromEntries(params.entries());

  try {
    await handleAlipayNotify(form);
    return new NextResponse("success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "支付宝回调处理失败";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
