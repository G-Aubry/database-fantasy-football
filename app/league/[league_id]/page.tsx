import prisma from '@/lib/prisma'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import JoinLeagueButton from './JoinLeagueButton'

interface Props {
  params: Promise<{ league_id: string }>
}

export default async function LeaguePage({ params }: Props) {
  const { league_id } = await params
  const leagueId = parseInt(league_id)

  const session = await getServerSession(authOptions)

  const league = await prisma.league.findUnique({
    where: { league_id: leagueId },
    select: {
      league_id: true,
      league_name: true,
      max_teams: true,
      max_roster_size: true,
      scoring_type: true,
      teams: {
        include: {
          rosters: {
            where: {
              status: 'Starter'
            }
          }
        }
      },
    },
  })

  let playerPoints: Record<number, number> = {}
  const scores = await prisma.league_player_score.groupBy({
    by: ['player_id'],
    where: { league_id: leagueId },
    _sum: { calculated_points: true },
  })
  scores.forEach(score => {
    playerPoints[score.player_id] = Number(score._sum.calculated_points) || 0
  })

  if (!league) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>League not found</h1>
        <Link href="/">← Back to Leagues</Link>
      </div>
    )
  }

  const buttonLeague = {
    league_id: league.league_id,
    max_teams: league.max_teams,
  }

  const buttonTeams = league.teams.map(t => ({
    team_id: t.team_id,
    team_name: t.team_name,
    owner_id: t.owner_id,
  }))

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Link href="/" style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}>
        ← Back to Leagues
      </Link>

      <h1 style={{ fontSize: '2.5rem'}}>{league.league_name}</h1>
      <div style={{ marginBottom: '30px', color: '#666' }}>
        <p><strong>Scoring Type:</strong> {league.scoring_type}</p>
        <p><strong>Max Teams:</strong> {league.max_teams}</p>
        <p><strong>Max Roster Size:</strong> {league.max_roster_size}</p>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '30px' }}>
        <JoinLeagueButton league={buttonLeague} teams={buttonTeams} userId={session?.user?.id} />
        <Link 
          href={`/league/${league_id}/freeagency`}
          style={{
            padding: '10px 15px',
            backgroundColor: '#17a2b8',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Free Agency Pool
        </Link>
      </div>

      <h2>Teams ({league.teams.length})</h2>
      {league.teams.length === 0 ? (
        <p style={{ color: '#999' }}>No teams yet. Teams will appear here once created.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {league.teams.map(team => {
            const starterPoints = team.rosters.reduce((sum, roster) => {
              return sum + (playerPoints[roster.player_id] || 0)
            }, 0)
            
            return (
              <li key={team.team_id} style={{ marginBottom: '10px' }}>
                <Link 
                  href={`/league/${league_id}/team/${team.team_id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: '#007bff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <span>{team.team_name}</span>
                  <span style={{ color: '#333', fontWeight: 'bold' }}>
                    {starterPoints.toFixed(2)} pts
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
