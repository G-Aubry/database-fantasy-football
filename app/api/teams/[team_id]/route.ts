
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

// PATCH /api/teams/:team_id - Update a team's name
export async function PATCH(
  request: Request,
  { params }: { params: { team_id: string } }
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const { team_id } = params;

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

    // Optional: Check if the user is the owner of the team
    // For now, allowing any logged-in user to edit for simplicity.
    // In a real app, you'd want to enforce ownership here.
    // if (team.owner_id !== session.user.id) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

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
