import { NextRequest, NextResponse } from 'next/server';

type Payload = {
  taskTitle: string;
  taskType: string;
  taskDate: string; // yyyy-mm-dd
};

// TODO: replace with Prisma/DB save. For now, echo success.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Payload;
    if (!body.taskTitle || !body.taskType || !body.taskDate) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    // If using Prisma, insert here and return the created record.
    // await prisma.task.create({ data: { title, type, date: new Date(body.taskDate) } });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}
