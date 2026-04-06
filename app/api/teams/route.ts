import { getServerSession } from 'next-auth'
import { authOptions } from '../auth/[...nextauth]/route'
import prisma from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { league_id, team_name } = body

    if (!league_id || !team_name || !team_name.trim()) {
      return NextResponse.json({ error: 'League ID and a valid team name are required' }, { status: 400 })
    }

    const leagueId = parseInt(league_id)
    const ownerId = parseInt(session.user.id)

    // Fetch league and its teams to perform validation checks
    const league = await prisma.league.findUnique({
      where: { league_id: leagueId },
      include: {
        teams: true,
      },
    })

    if (!league) {
      return NextResponse.json({ error: 'League not found' }, { status: 404 })
    }

    // Check if the league is full
    if (league.teams.length >= league.max_teams) {
      return NextResponse.json({ error: 'This league is already full' }, { status: 400 })
    }

    // Check if the user already has a team in this league
    const userHasTeam = league.teams.some(team => team.owner_id === ownerId)
    if (userHasTeam) {
      return NextResponse.json({ error: 'You already have a team in this league' }, { status: 400 })
    }

    // Create the new team
    const newTeam = await prisma.teams.create({
      data: {
        team_name: team_name.trim(),
        league_id: leagueId,
        owner_id: ownerId,
      },
    })

    return NextResponse.json(newTeam, { status: 201 })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
