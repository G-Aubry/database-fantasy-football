import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roster_id, status } = await request.json()

    if (!roster_id || !status) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Fetch roster to get team_id
    const roster = await prisma.rosters.findUnique({
      where: { roster_id },
      include: { teams: true },
    })

    if (!roster) {
      return Response.json({ error: 'Roster not found' }, { status: 404 })
    }

    // Verify user owns the team
    const team = roster.teams
    if (team.owner_id !== parseInt(session.user.id)) {
      return Response.json({ error: 'You do not own this team' }, { status: 403 })
    }

    // Validate status
    if (!['Starter', 'Bench'].includes(status)) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Update roster status
    const updatedRoster = await prisma.rosters.update({
      where: { roster_id },
      data: { status },
      include: { players: true },
    })

    return Response.json(updatedRoster)
  } catch (error) {
    console.error('Error updating roster:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
