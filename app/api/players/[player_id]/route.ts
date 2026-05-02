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

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ player_id: string }> }
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { player_id } = await params;
  const playerId = parseInt(player_id, 10);
  const { searchParams } = new URL(request.url);
  const leagueId = searchParams.get('league_id');

  if (!leagueId) {
    return NextResponse.json({ error: 'League ID is required' }, { status: 400 });
  }

  try {
    // Fetch player info
    const player = await prisma.players.findUnique({
      where: { player_id: playerId },
    });

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Fetch all player stats (weekly stats)
    const playerStats = await prisma.player_stats.findMany({
      where: { player_id: playerId },
      orderBy: { week_number: 'asc' },
    });

    // Fetch league-specific points for this player
    const leagueScores = await prisma.league_player_score.findMany({
      where: {
        player_id: playerId,
        league_id: parseInt(leagueId, 10),
      },
      orderBy: { week_number: 'asc' },
    });

    // Calculate total points in this league
    const totalLeaguePoints = leagueScores.reduce(
      (sum, score) => sum + Number(score.calculated_points || 0),
      0
    );

    return NextResponse.json({
      player: {
        ...player,
        total_points: player.total_points ? Number(player.total_points) : null,
      },
      playerStats: playerStats.map(stat => ({
        ...stat,
        passing_yards: stat.passing_yards || 0,
        rushing_yards: stat.rushing_yards || 0,
        receiving_yards: stat.receiving_yards || 0,
        receptions: stat.receptions || 0,
        touchdowns: stat.touchdowns || 0,
        field_goals_made: stat.field_goals_made || 0,
        fg_missed: stat.fg_missed || 0,
        fg_blocked_by_def: stat.fg_blocked_by_def || 0,
        interceptions: stat.interceptions || 0,
        fumbles_lost: stat.fumbles_lost || 0,
        fumbles_recovered: stat.fumbles_recovered || 0,
        sacks: stat.sacks || 0,
      })),
      leagueScores: leagueScores.map(score => ({
        ...score,
        calculated_points: score.calculated_points ? Number(score.calculated_points) : null,
      })),
      totalLeaguePoints,
    });
  } catch (error) {
    console.error('Failed to fetch player stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}