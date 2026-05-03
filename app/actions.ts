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

'use server'

import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createLeague(formData: FormData) {
  const leagueName = formData.get('leagueName') as string
  const maxTeams = parseInt(formData.get('maxTeams') as string) || 12
  const maxRosterSize = parseInt(formData.get('maxRosterSize') as string) || 15
  const scoringType = (formData.get('scoringType') as string) || 'Standard'

  if (!leagueName.trim()) {
    throw new Error('League name is required')
  }

  // Create the league
  const league = await prisma.league.create({
    data: {
      league_name: leagueName,
      max_teams: maxTeams,
      max_roster_size: maxRosterSize,
      scoring_type: scoringType as 'PPR' | 'Half_PPR' | 'Standard',
    },
  })

  // Calculate and insert points for all players in this league
  await calculateAndInsertLeaguePlayerPoints(league.league_id, scoringType as 'PPR' | 'Half_PPR' | 'Standard')

  redirect('/')
}

// Helper function to calculate fantasy points based on scoring type
function calculateFantasyPoints(stats: any, scoringType: 'PPR' | 'Half_PPR' | 'Standard'): number {
  let points = 0

  // Passing
  points += (stats.passing_yards || 0) * 0.04 // 1/25th pt per yard (0.04)
  points -= (stats.interceptions || 0) * 2

  // Rushing
  points += (stats.rushing_yards || 0) * 0.1 // 1/10 pt per yard

  // Receiving
  points += (stats.receiving_yards || 0) * 0.1 // 1/10 pt per yard
  if (scoringType === 'PPR') {
    points += (stats.receptions || 0) * 1
  } else if (scoringType === 'Half_PPR') {
    points += (stats.receptions || 0) * 0.5
  }

  // Touchdowns
  points += (stats.touchdowns || 0) * 6 

  // Kicking
  points += (stats.field_goals_made || 0) * 3
  points -= (stats.fg_missed || 0) * 1

  // Defense/Sacks
  points += (stats.sacks || 0) * 1

  // Fumbles
  points -= (stats.fumbles_lost || 0) * 2

  return Math.round(points * 100) / 100 // Round to 2 decimal places
}

// Function to calculate and insert league player points for a league
async function calculateAndInsertLeaguePlayerPoints(leagueId: number, scoringType: 'PPR' | 'Half_PPR' | 'Standard'): Promise<number> {
  console.log(`🔢 Processing league ${leagueId} with scoring type ${scoringType}`)

  // Get all players
  const players = await prisma.players.findMany()
  console.log(`👥 Found ${players.length} players`)

  // Get all player stats
  const allStats = await prisma.player_stats.findMany()
  console.log(`📈 Found ${allStats.length} total player stats across all weeks`)

  // Group stats by player
  const playerStatsMap = new Map<number, any[]>()
  allStats.forEach(stat => {
    if (!playerStatsMap.has(stat.player_id)) {
      playerStatsMap.set(stat.player_id, [])
    }
    playerStatsMap.get(stat.player_id)!.push(stat)
  })

  // Calculate points for each player and week
  const leagueScores = []

  for (const player of players) {
    const stats = playerStatsMap.get(player.player_id) || []

    for (const stat of stats) {
      const points = calculateFantasyPoints(stat, scoringType)
      if (points > 0) { // Only include if they have points
        leagueScores.push({
          league_id: leagueId,
          player_id: player.player_id,
          week_number: stat.week_number,
          calculated_points: points,
        })
      }
    }
  }

  console.log(`💾 Inserting ${leagueScores.length} league player scores for league ${leagueId}`)

  // Insert all league player scores
  if (leagueScores.length > 0) {
    await prisma.league_player_score.createMany({
      data: leagueScores,
    })
  }

  return leagueScores.length
}

// Function to backfill/recalculate points for ALL leagues
export async function recalculateAllLeaguePoints() {
  console.log('🚀 Starting recalculation of all league points...')

  try {
    // First, delete all existing league player scores
    console.log('🗑️ Deleting existing league player scores...')
    const deleteResult = await prisma.league_player_score.deleteMany({})
    console.log(`✅ Deleted ${deleteResult.count} existing league player scores`)

    // Get all leagues
    console.log('📋 Fetching all leagues...')
    const leagues = await prisma.league.findMany({
      select: {
        league_id: true,
        scoring_type: true,
        league_name: true,
      },
    })

    console.log(`📊 Found ${leagues.length} leagues to process`)

    if (leagues.length === 0) {
      console.log('⚠️ No leagues found in database!')
      return { leaguesProcessed: 0, totalScoresCreated: 0 }
    }

    let totalScoresCreated = 0

    for (const league of leagues) {
      console.log(`⚽ Calculating points for league "${league.league_name}" (${league.league_id}) - ${league.scoring_type}`)
      try {
        const scoresCreated = await calculateAndInsertLeaguePlayerPoints(league.league_id, league.scoring_type)
        console.log(`✅ Completed league ${league.league_id} - created ${scoresCreated} scores`)
        totalScoresCreated += scoresCreated
      } catch (error) {
        console.error(`❌ Failed to calculate points for league ${league.league_id}:`, error)
      }
    }

    console.log(`🎉 Recalculation complete! Processed ${leagues.length} leagues, created ${totalScoresCreated} total scores`)
    return { leaguesProcessed: leagues.length, totalScoresCreated }
  } catch (error) {
    console.error('💥 Major error in recalculation:', error)
    throw error
  }
}