import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';

const prisma = new PrismaClient();

// A generic helper to read CSV data into an array of objects
function parseCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const results: T[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function main() {
  console.log('Starting to seed...');

  // === 1. SEED USERS ===
  const usersData = await parseCSV<any>('./prisma/data/Users.csv');
  for (const row of usersData) {
    await prisma.users.create({
      data: {
        user_id: parseInt(row.user_id),
        username: row.username,
        password_hash: row.password_hash,
        email: row.email,
      },
    });
  }
  console.log('Users seeded');

  // === 2. SEED LEAGUES ===
  const leaguesData = await parseCSV<any>('./prisma/data/League.csv');
  for (const row of leaguesData) {
    await prisma.league.create({
      data: {
        league_id: parseInt(row.league_id),
        league_name: row.league_name,
        max_teams: parseInt(row.max_teams),
        max_roster_size: parseInt(row.max_roster_size),
        scoring_type: row.scoring_type as any, // Assumes value matches enum
      },
    });
  }
  console.log('Leagues seeded');

  // === 3. SEED PLAYERS ===
  const playersData = await parseCSV<any>('./prisma/data/Players.csv');
  for (const row of playersData) {
    await prisma.players.create({
      data: {
        player_id: parseInt(row.player_id),
        first_name: row.first_name,
        last_name: row.last_name,
        player_position: row.player_position as any, // Assumes value matches enum
        nfl_team: row.nfl_team || null,
        total_points: parseFloat(row.total_points),
        is_injured: row.is_injured === 'true' || row.is_injured === '1',
      },
    });
  }
  console.log('Players seeded');

  // === 4. SEED TEAMS ===
  const teamsData = await parseCSV<any>('./prisma/data/Teams.csv');
  for (const row of teamsData) {
    await prisma.teams.create({
      data: {
        team_id: parseInt(row.team_id),
        league_id: row.league_id ? parseInt(row.league_id) : null,
        team_name: row.team_name,
        owner_id: row.owner_id ? parseInt(row.owner_id) : null,
      },
    });
  }
  console.log('Teams seeded');

  // === 5. SEED ROSTERS ===
  const rostersData = await parseCSV<any>('./prisma/data/Rosters.csv');
  for (const row of rostersData) {
    await prisma.rosters.create({
      data: {
        roster_id: parseInt(row.roster_id),
        team_id: parseInt(row.team_id),
        player_id: parseInt(row.player_id),
        league_id: parseInt(row.league_id),
        status: row.status as any, // Assumes value matches enum
      },
    });
  }
  console.log('Rosters seeded');

  // === 6. SEED PLAYER STATS ===
  const playerStatsData = await parseCSV<any>('./prisma/data/PlayerStats.csv');
  for (const row of playerStatsData) {
    await prisma.player_stats.create({
      data: {
        player_id: parseInt(row.player_id),
        week_number: parseInt(row.week_number),
        passing_yards: parseInt(row.passing_yards) || 0,
        rushing_yards: parseInt(row.rushing_yards) || 0,
        receiving_yards: parseInt(row.receiving_yards) || 0,
        receptions: parseInt(row.receptions) || 0,
        touchdowns: parseInt(row.touchdowns) || 0,
        field_goals_made: parseInt(row.field_goals_made) || 0,
        fg_missed: parseInt(row.fg_missed) || 0,
        fg_blocked_by_def: parseInt(row.fg_blocked_by_def) || 0,
        interceptions: parseInt(row.interceptions) || 0,
        fumbles_lost: parseInt(row.fumbles_lost) || 0,
        fumbles_recovered: parseInt(row.fumbles_recovered) || 0,
        sacks: parseInt(row.sacks) || 0,
      },
    });
  }
  console.log('Player Stats seeded');

  // === 7. SEED LEAGUE PLAYER SCORES ===
  const scoresData = await parseCSV<any>('./prisma/data/LeaguePlayerStats.csv');
  for (const row of scoresData) {
    await prisma.league_player_score.create({
      data: {
        league_id: parseInt(row.league_id),
        player_id: parseInt(row.player_id),
        week_number: parseInt(row.week_number),
        calculated_points: parseFloat(row.calculated_points),
      },
    });
  }
  console.log('League Player Scores seeded');

  console.log('Seeding finished successfully.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });