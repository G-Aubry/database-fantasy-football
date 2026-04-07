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

    // Fetch roster to get team_id and player position
    const roster = await prisma.rosters.findUnique({
      where: { roster_id },
      include: { 
        teams: true,
        players: true
      },
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

    if (status === 'Starter') {
      const currentStarters = await prisma.rosters.findMany({
        where: { 
          team_id: roster.team_id,
          status: 'Starter',
          roster_id: { not: roster_id } // Exclude the current player if they were already a starter
        },
        include: { players: true }
      })

      const counts = { QB: 0, RB: 0, WR: 0, TE: 0, K: 0, DEF: 0 }
      for (const p of currentStarters) {
        counts[p.players.player_position as keyof typeof counts]++
      }

      // Add the player we are trying to start
      counts[roster.players.player_position as keyof typeof counts]++

      const totalStarters = Object.values(counts).reduce((a, b) => a + b, 0)
      if (totalStarters > 9) {
        return Response.json({ error: 'Maximum 9 starting players allowed' }, { status: 400 })
      }

      if (counts.QB > 1) return Response.json({ error: 'Maximum 1 QB allowed' }, { status: 400 })
      if (counts.K > 1) return Response.json({ error: 'Maximum 1 K allowed' }, { status: 400 })
      if (counts.DEF > 1) return Response.json({ error: 'Maximum 1 DEF allowed' }, { status: 400 })

      const extraRBs = Math.max(0, counts.RB - 2)
      const extraWRs = Math.max(0, counts.WR - 2)
      const extraTEs = Math.max(0, counts.TE - 1)
      const totalFlex = extraRBs + extraWRs + extraTEs

      if (totalFlex > 1) {
        return Response.json({ error: 'Invalid lineup. Permitted: 2 RB, 2 WR, 1 TE, + 1 FLEX (RB/WR/TE)' }, { status: 400 })
      }
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
