import prisma from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import FreeAgencyTable from './FreeAgencyTable'

interface Props {
  params: Promise<{ league_id: string }>
}

export default async function FreeAgencyPage({ params }: Props) {
  const { league_id } = await params
  const leagueId = parseInt(league_id)

  const session = await getServerSession(authOptions)

  const league = await prisma.league.findUnique({
    where: { league_id: leagueId },
  })

  if (!league) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>League not found</h1>
        <Link href="/">← Back to Leagues</Link>
      </div>
    )
  }

  const userTeam = session?.user?.id 
    ? await prisma.teams.findFirst({
        where: {
          league_id: leagueId,
          owner_id: parseInt(session.user.id)
        }
      })
    : null

  // Find all players not on any roster in this league
  const availablePlayers = await prisma.players.findMany({
    where: {
      rosters: {
        none: {
          league_id: leagueId
        }
      }
    }
  })

  // Fetch cumulative points for each player in the league
  let playerPoints: Record<number, number> = {}
  const scores = await prisma.league_player_score.groupBy({
    by: ['player_id'],
    where: { league_id: leagueId },
    _sum: { calculated_points: true },
  })
  scores.forEach(score => {
    playerPoints[score.player_id] = Number(score._sum.calculated_points) || 0
  })

  // Map scores to players and sort
  const sanitizedPlayers = availablePlayers.map(p => ({
    ...p,
    total_points: playerPoints[p.player_id] || 0
  })).sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points
    }
    return a.last_name.localeCompare(b.last_name)
  })

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/league/${league_id}`} style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}>
        ← Back to League
      </Link>

      <h1>Free Agency</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Add available players to your team. 
        {league.max_roster_size && ` (Max Roster Size: ${league.max_roster_size})`}
      </p>

      <FreeAgencyTable 
        players={sanitizedPlayers} 
        userTeamId={userTeam?.team_id || null} 
        leagueId={leagueId} 
      />
    </div>
  )
}
