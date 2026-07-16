import { NextResponse } from "next/server";

const phonePattern = /^(0|\+84)[0-9]{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      phone?: unknown;
      email?: unknown;
    };

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (name.length < 2) {
      return NextResponse.json({ error: "Vui lòng nhập họ tên hợp lệ." }, { status: 400 });
    }
    if (!phonePattern.test(phone)) {
      return NextResponse.json(
        { error: "Số điện thoại cần có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx." },
        { status: 400 },
      );
    }
    if (!emailPattern.test(email)) {
      return NextResponse.json({ error: "Vui lòng nhập email hợp lệ." }, { status: 400 });
    }

    const lead = {
      name,
      phone,
      email,
      source: "english-zoom-kids-landing-page",
      createdAt: new Date().toISOString(),
    };
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;

    if (!webhookUrl) {
      console.info("[lead-preview]", lead);
      return NextResponse.json({ ok: true, mode: "preview" });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Lead webhook rejected request", response.status);
      return NextResponse.json(
        { error: "Chưa thể gửi thông tin lúc này. Anh/chị vui lòng thử lại." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, mode: "connected" });
  } catch (error) {
    console.error("Invalid lead request", error);
    return NextResponse.json(
      { error: "Dữ liệu chưa hợp lệ. Anh/chị vui lòng kiểm tra và thử lại." },
      { status: 400 },
    );
  }
}
