'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'

interface Player {
  player_id: number
  first_name: string
  last_name: string
  player_position: string
  nfl_team: string | null
  total_points: number | null
}

interface PlayerStats {
  player_id: number
  week_number: number
  passing_yards: number
  rushing_yards: number
  receiving_yards: number
  receptions: number
  touchdowns: number
  field_goals_made: number
  fg_missed: number
  fg_blocked_by_def: number
  interceptions: number
  fumbles_lost: number
  fumbles_recovered: number
  sacks: number
}

interface LeagueScore {
  league_id: number
  player_id: number
  week_number: number
  calculated_points: number | null
}

interface PlayerStatData {
  player: Player
  playerStats: PlayerStats[]
  leagueScores: LeagueScore[]
  totalLeaguePoints: number
}

export default function PlayerStatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const playerId = params.player_id as string
  const leagueId = searchParams.get('league_id')

  const [data, setData] = useState<PlayerStatData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchPlayerStats() {
      if (!playerId || !leagueId) {
        setError('Missing player or league information')
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/players/${playerId}?league_id=${leagueId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch player stats')
        }
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPlayerStats()
  }, [playerId, leagueId])

  if (loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        <p>Loading player stats...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <Link
          href={`/league/${leagueId}`}
          style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}
        >
          ← Back to League
        </Link>
        <p style={{ color: '#d32f2f' }}>{error}</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
        <Link
          href={`/league/${leagueId}`}
          style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}
        >
          ← Back to League
        </Link>
        <p>No data available</p>
      </div>
    )
  }

  const { player, playerStats, leagueScores, totalLeaguePoints } = data

  // Create a map of week -> league score for quick lookup
  const leagueScoreMap = new Map<number, number>()
  leagueScores.forEach(score => {
    leagueScoreMap.set(score.week_number, score.calculated_points || 0)
  })

  // Get unique weeks from player stats
  const weeks = [...new Set(playerStats.map(s => s.week_number))].sort((a, b) => a - b)

  return (
    <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
      <Link
        href={`/league/${leagueId}`}
        style={{ textDecoration: 'none', color: '#007bff', marginBottom: '20px', display: 'inline-block' }}
      >
        ← Back to League
      </Link>

      {/* Player Header */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>
          {player.first_name} {player.last_name}
        </h1>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <span><strong>Position:</strong> {player.player_position}</span>
          <span><strong>NFL Team:</strong> {player.nfl_team || 'N/A'}</span>
          <span><strong>Total Points (Season):</strong> {player.total_points?.toFixed(2) || '0.00'}</span>
          <span style={{ color: '#28a745', fontWeight: 'bold' }}>
            <strong>Points in League:</strong> {totalLeaguePoints.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Weekly Stats Table */}
      <h2 style={{ marginBottom: '15px' }}>Weekly Statistics</h2>
      {playerStats.length === 0 ? (
        <p style={{ color: '#999', marginBottom: '30px' }}>No weekly stats available</p>
      ) : (
        <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Week</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Pass Yds</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Rush Yds</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Rec Yds</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Rec</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>TDs</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>FG</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>FG Miss</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>INT</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Fum Lost</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Fum Rec</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Sacks</th>
                <th style={{ padding: '10px', textAlign: 'right', backgroundColor: '#e8f5e9' }}>League Pts</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map(week => {
                const stats = playerStats.find(s => s.week_number === week)
                const leaguePts = leagueScoreMap.get(week) || 0
                return (
                  <tr key={week} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px', fontWeight: 'bold' }}>Week {week}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.passing_yards || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.rushing_yards || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.receiving_yards || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.receptions || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.touchdowns || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.field_goals_made || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.fg_missed || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.interceptions || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.fumbles_lost || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.fumbles_recovered || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right' }}>{stats?.sacks || 0}</td>
                    <td style={{ padding: '10px', textAlign: 'right', backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
                      {leaguePts.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Season Totals */}
      <h2 style={{ marginBottom: '15px' }}>Season Totals</h2>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Passing Yards</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.passing_yards || 0), 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Rushing Yards</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.rushing_yards || 0), 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Receiving Yards</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.receiving_yards || 0), 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Receptions</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.receptions || 0), 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Touchdowns</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.touchdowns || 0), 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Field Goals</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.field_goals_made || 0), 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Interceptions</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.interceptions || 0), 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Fumbles Lost</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.fumbles_lost || 0), 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px' }}>Sacks</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
              {playerStats.reduce((sum, s) => sum + (s.sacks || 0), 0)}
            </div>
          </div>
          <div style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '4px' }}>
            <div style={{ color: '#2e7d32', fontSize: '12px' }}>Total League Points</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#2e7d32' }}>
              {totalLeaguePoints.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}