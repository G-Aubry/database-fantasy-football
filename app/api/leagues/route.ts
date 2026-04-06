import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leagues = await prisma.league.findMany({
      select: {
        league_id: true,
        league_name: true,
        max_teams: true,
        scoring_type: true,
      },
    })

    return Response.json(leagues)
  } catch (error) {
    console.error('Error fetching leagues:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
