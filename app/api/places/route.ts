import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { Place } from "@/lib/types";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";
export async function GET() {
  const storage = await getStorage();
  const places = await storage.listPlaces();
  return NextResponse.json(places);
}

// POST /api/places - 새 장소 등록 또는 body.id가 있으면 수정(메뉴 추가 포함)
export async function POST(req: NextRequest) {
  const storage = await getStorage();
  const body = await req.json();
  const now = new Date().toISOString();

  const existing = body.id ? await storage.getPlace(body.id) : null;

  const place: Place = {
    id: body.id ?? nanoid(),
    name: body.name,
    address: body.address,
    menus: (body.menus ?? existing?.menus ?? []).map((m: any) => ({
      id: m.id ?? nanoid(),
      name: m.name,
      price: m.price,
    })),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const saved = await storage.upsertPlace(place);
  return NextResponse.json(saved, { status: existing ? 200 : 201 });
}
