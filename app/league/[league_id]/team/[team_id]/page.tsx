import prisma from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import RosterTable from './RosterTable'
import EditTeamName from './EditTeamName'

interface Props {
  params: Promise<{ league_id: string; team_id: string }>
}


export default async function TeamRosterPage({ params }: Props) {
  const { league_id, team_id } = await params
  const leagueId = parseInt(league_id)
  const teamId = parseInt(team_id)

  const session = await getServerSession(authOptions)

  const team = await prisma.teams.findUnique({
    where: { team_id: teamId },
    select: {
      team_id: true,
      team_name: true,
      league_id: true,
      owner_id: true,
      rosters: {
        include: {
          players: true,
        },
      },
    },
  })

  // Fetch cumulative points for each player in the league
  let playerPoints: Record<number, number> = {}
  if (team?.league_id) {
    const scores = await prisma.league_player_score.groupBy({
      by: ['player_id'],
      where: { league_id: team.league_id },
      _sum: { calculated_points: true },
    })
    scores.forEach(score => {
      playerPoints[score.player_id] = Number(score._sum.calculated_points) || 0
    })
  }

  if (!team || team.league_id !== leagueId) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Team not found</h1>
        <Link href={`/league/${leagueId}`}>← Back to League</Link>
      </div>
    )
  }

  const isOwner = !!(session?.user?.id && team.owner_id === parseInt(session.user.id))

  const startingPlayers = team.rosters.filter(roster => roster.status === 'Starter')
  const benchPlayers = team.rosters.filter(roster => roster.status === 'Bench')

  const sanitizeRosters = (rosters: any[]) =>
    rosters.map(roster => ({
      ...roster,
      players: {
        ...roster.players,
        total_points: roster.players.total_points ? Number(roster.players.total_points) : null,
      },
    }))

  const sanitizedStartingPlayers = sanitizeRosters(startingPlayers)
  const sanitizedBenchPlayers = sanitizeRosters(benchPlayers)

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href={`/league/${leagueId}`} style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}>
        ← Back to League
      </Link>

      <EditTeamName
        teamId={team.team_id}
        initialTeamName={team.team_name}
        isOwner={isOwner}
      />


      <h2>Starting Lineup ({startingPlayers.length})</h2>
      <RosterTable
        rosters={sanitizedStartingPlayers}
        isOwner={isOwner}
        teamId={teamId}
        leagueId={leagueId}
        playerPoints={playerPoints}
        title="Starting Lineup"
      />

      <h2>Bench ({benchPlayers.length})</h2>
      <RosterTable
        rosters={sanitizedBenchPlayers}
        isOwner={isOwner}
        teamId={teamId}
        leagueId={leagueId}
        playerPoints={playerPoints}
        title="Bench"
      />
    </div>
  )
}
