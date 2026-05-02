/*
 * Copyright 2026 Grant Aubry
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { team_id, player_id, league_id, action } = await request.json()

    if (!team_id || !player_id || !league_id || !action) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns the team
    const team = await prisma.teams.findUnique({
      where: { team_id },
      include: {
        league: true,
        _count: {
          select: { rosters: true }
        }
      }
    })

    if (!team || team.owner_id !== parseInt(session.user.id)) {
      return Response.json({ error: 'You do not own this team' }, { status: 403 })
    }

    if (action === 'pickUp') {
      if (!team.league) {
        return Response.json({ error: 'Team does not belong to a league' }, { status: 400 })
      }

      if (team._count.rosters >= team.league.max_roster_size) {
        return Response.json({ 
          error: `Roster is full (Max: ${team.league.max_roster_size} players). Please drop a player first.` 
        }, { status: 400 })
      }

      // Check if player already on any roster in this league
      const existingRoster = await prisma.rosters.findFirst({
        where: {
          league_id,
          player_id,
        },
      })

      if (existingRoster) {
        return Response.json({ error: 'Player is already on a roster in this league' }, { status: 400 })
      }

      // Add player to bench
      const newRoster = await prisma.rosters.create({
        data: {
          team_id,
          player_id,
          league_id,
          status: 'Bench',
        },
        include: { players: true },
      })

      return Response.json(newRoster)
    } else if (action === 'drop') {
      // Remove player from roster
      const roster = await prisma.rosters.findFirst({
        where: {
          team_id,
          player_id,
        },
      })

      if (!roster) {
        return Response.json({ error: 'Player not on roster' }, { status: 404 })
      }

      await prisma.rosters.delete({
        where: { roster_id: roster.roster_id },
      })

      return Response.json({ message: 'Player dropped successfully' })
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error with free agency:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
