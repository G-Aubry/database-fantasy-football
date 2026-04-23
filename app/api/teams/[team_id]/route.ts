
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ team_id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const { team_id } = await params;

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const team = await prisma.teams.findUnique({
      where: { team_id: parseInt(team_id, 10) },
    });

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    }

    const updatedTeam = await prisma.teams.update({
      where: { team_id: parseInt(team_id, 10) },
      data: { team_name: name },
    });

    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Failed to update team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
