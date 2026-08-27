import { NextRequest, NextResponse } from "next/server";
import { getStorage } from "@/lib/storage";
import { nanoid } from "nanoid";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const storage = await getStorage();
  const meeting = await storage.getMeeting(params.id);
  if (!meeting) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(meeting);
}

// PUT /api/meetings/:id
// 모임 이후에도 특정 참석자와 나눈 이야기를 계속 추가할 수 있도록,
// body.newStories 로 넘어온 항목은 새 작성일시(createdAt)를 부여해 append합니다.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const storage = await getStorage();
  const existing = await storage.getMeeting(params.id);
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const body = await req.json();
  const now = new Date().toISOString();

  const appendedStories = (body.newStories ?? []).map((s: any) => ({
    id: nanoid(),
    personId: s.personId,
    content: s.content,
    categoryIds: s.categoryIds ?? [],
    createdAt: now,
  }));

  const updated = {
    ...existing,
    date: body.date ?? existing.date,
    time: body.time ?? existing.time,
    placeId: body.placeId ?? existing.placeId,
    attendeeIds: body.attendeeIds ?? existing.attendeeIds,
    amount: body.amount ?? existing.amount,
    stories: [...existing.stories, ...appendedStories],
    updatedAt: now,
  };

  const saved = await storage.upsertMeeting(updated);
  return NextResponse.json(saved);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const storage = await getStorage();
  await storage.deleteMeeting(params.id);
  return NextResponse.json({ ok: true });
}
