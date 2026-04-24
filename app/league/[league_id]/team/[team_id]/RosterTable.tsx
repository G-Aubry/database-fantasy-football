'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Player {
  player_id: number
  first_name: string
  last_name: string
  player_position: string
  nfl_team: string | null
  total_points: number | null
}

interface Roster {
  roster_id: number
  status: string | null
  players: Player
}

interface RosterTableProps {
  rosters: Roster[]
  isOwner: boolean
  teamId: number
  leagueId: number
  playerPoints: Record<number, number>
  title: string
  isStartingLineup?: boolean
}

export default function RosterTable({ rosters, isOwner, teamId, leagueId, playerPoints, title, isStartingLineup }: RosterTableProps) {
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  async function handleStatusChange(rosterId: number, newStatus: string) {
    setLoading(rosterId)
    setError('')

    try {
      const response = await fetch(`/api/rosters/${rosterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roster_id: rosterId, status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update roster')
      }

      // Refresh the page to show updated roster
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(null)
    }
  }

  async function handleDropPlayer(rosterId: number, playerId: number) {
    if (!confirm('Are you sure you want to drop this player?')) return

    setLoading(rosterId)
    setError('')

    try {
      const response = await fetch('/api/freeagency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: teamId,
          player_id: playerId,
          league_id: leagueId,
          action: 'drop',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to drop player')
      }

      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const STARTER_SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DEF', 'K']

  let rowsToRender: { slot?: string; roster?: Roster }[] = []

  if (isStartingLineup) {
    const availablePlayers = [...rosters]
    const takePlayer = (condition: (p: Roster) => boolean) => {
      const index = availablePlayers.findIndex(condition)
      if (index !== -1) {
        return availablePlayers.splice(index, 1)[0]
      }
      return undefined
    }

    STARTER_SLOTS.forEach(slot => {
      if (slot === 'FLEX') {
        rowsToRender.push({ slot, roster: takePlayer(p => ['RB', 'WR', 'TE'].includes(p.players.player_position)) })
      } else {
        rowsToRender.push({ slot, roster: takePlayer(p => p.players.player_position === slot) })
      }
    })

    // If somehow there are extra starting players that don't fit the valid slots, append them safely
    availablePlayers.forEach(p => {
      rowsToRender.push({ slot: 'EXTRA', roster: p })
    })
  } else {
    rowsToRender = rosters.map(r => ({ roster: r }))
  }

  if (!isStartingLineup && rosters.length === 0) {
    return <p style={{ color: '#999' }}>No players in {title.toLowerCase()}</p>
  }

  return (
    <div>
      {error && <p style={{ color: '#d32f2f', marginBottom: '10px' }}>{error}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            {isStartingLineup && <th style={{ padding: '10px', textAlign: 'left' }}>Slot</th>}
            <th style={{ padding: '10px', textAlign: 'left' }}>Player</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Position</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>NFL Team</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Points</th>
            {isOwner && <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rowsToRender.map((row, index) => {
            if (!row.roster) {
              return (
                <tr key={`empty-${index}`} style={{ borderBottom: '1px solid #eee', backgroundColor: '#fafafa' }}>
                  {isStartingLineup && <td style={{ padding: '10px', fontWeight: 'bold', color: '#666' }}>{row.slot}</td>}
                  <td style={{ padding: '10px', color: '#999', fontStyle: 'italic' }}>Empty</td>
                  <td style={{ padding: '10px' }}>-</td>
                  <td style={{ padding: '10px' }}>-</td>
                  <td style={{ padding: '10px' }}>-</td>
                  {isOwner && <td style={{ padding: '10px' }}>-</td>}
                </tr>
              )
            }

            const roster = row.roster
            return (
              <tr key={roster.roster_id} style={{ borderBottom: '1px solid #eee' }}>
                {isStartingLineup && <td style={{ padding: '10px', fontWeight: 'bold' }}>{row.slot}</td>}
                <td style={{ padding: '10px' }}>
                  <Link
                    href={`/league/${leagueId}/player/${roster.players.player_id}?league_id=${leagueId}`}
                    style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
                  >
                    {roster.players.first_name} {roster.players.last_name}
                  </Link>
                </td>
                <td style={{ padding: '10px' }}>{roster.players.player_position}</td>
                <td style={{ padding: '10px' }}>{roster.players.nfl_team || 'N/A'}</td>
                <td style={{ padding: '10px' }}>{(playerPoints[roster.players.player_id] || 0).toFixed(2)}</td>
                {isOwner && (
                  <td style={{ padding: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {roster.status === 'Bench' && (
                      <button
                        onClick={() => handleStatusChange(roster.roster_id, 'Starter')}
                        disabled={loading === roster.roster_id}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading === roster.roster_id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Start
                      </button>
                    )}
                    {roster.status === 'Starter' && (
                      <button
                        onClick={() => handleStatusChange(roster.roster_id, 'Bench')}
                        disabled={loading === roster.roster_id}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ffc107',
                          color: 'black',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading === roster.roster_id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        Bench
                      </button>
                    )}
                    <button
                      onClick={() => handleDropPlayer(roster.roster_id, roster.players.player_id)}
                      disabled={loading === roster.roster_id}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: loading === roster.roster_id ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      Drop
                    </button>
                  </td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
