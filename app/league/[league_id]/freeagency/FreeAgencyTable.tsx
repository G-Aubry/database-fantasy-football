'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Player {
  player_id: number
  first_name: string
  last_name: string
  player_position: string
  nfl_team: string | null
  total_points: number | null
}

interface FreeAgencyTableProps {
  players: Player[]
  userTeamId: number | null
  leagueId: number
}

export default function FreeAgencyTable({ players, userTeamId, leagueId }: FreeAgencyTableProps) {
  const [loading, setLoading] = useState<number | null>(null)
  const [error, setError] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('points_desc')

  async function handleAddPlayer(playerId: number) {
    if (!userTeamId) return

    setLoading(playerId)
    setError('')

    try {
      const response = await fetch('/api/freeagency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_id: userTeamId,
          player_id: playerId,
          league_id: leagueId,
          action: 'pickUp',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add player')
      }

      // Success, reload to update the list
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(null)
    }
  }

  const positionOrder = ['QB', 'RB', 'WR', 'TE', 'DEF', 'K']
  const uniquePositions = ['All', ...Array.from(new Set(players.map(p => p.player_position))).sort((a, b) => {
    const indexA = positionOrder.indexOf(a)
    const indexB = positionOrder.indexOf(b)
    
    // If a position isn't in our predefined list, put it at the end
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    
    return indexA - indexB
  })]

  const filteredAndSortedPlayers = useMemo(() => {
    return players
      .filter(player => {
        const matchesSearch = `${player.first_name} ${player.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPosition = positionFilter === 'All' || player.player_position === positionFilter
        return matchesSearch && matchesPosition
      })
      .sort((a, b) => {
        const pointsA = a.total_points || 0
        const pointsB = b.total_points || 0
        
        if (sortOrder === 'points_desc') return pointsB - pointsA
        if (sortOrder === 'points_asc') return pointsA - pointsB
        if (sortOrder === 'name_asc') return a.last_name.localeCompare(b.last_name)
        if (sortOrder === 'name_desc') return b.last_name.localeCompare(a.last_name)
        return 0
      })
  }, [players, searchQuery, positionFilter, sortOrder])

  return (
    <div>
      {error && <p style={{ color: '#d32f2f', marginBottom: '10px', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>{error}</p>}
      {!userTeamId && <p style={{ color: '#ff9800', marginBottom: '10px' }}>You must own a team in this league to pick up players.</p>}
      
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Search player name..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', flex: '1', minWidth: '200px' }}
        />
        <select 
          value={positionFilter} 
          onChange={(e) => setPositionFilter(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          {uniquePositions.map(pos => (
            <option key={pos} value={pos}>{pos === 'All' ? 'All Positions' : pos}</option>
          ))}
        </select>
        <select 
          value={sortOrder} 
          onChange={(e) => setSortOrder(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
        >
          <option value="points_desc">Points (High to Low)</option>
          <option value="points_asc">Points (Low to High)</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
        </select>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Player</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Position</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>NFL Team</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Points</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredAndSortedPlayers.map(player => (
            <tr key={player.player_id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px' }}>
                <Link
                  href={`/league/${leagueId}/player/${player.player_id}?league_id=${leagueId}`}
                  style={{ color: '#007bff', textDecoration: 'none', fontWeight: '500' }}
                >
                  {player.first_name} {player.last_name}
                </Link>
              </td>
              <td style={{ padding: '10px' }}>{player.player_position}</td>
              <td style={{ padding: '10px' }}>{player.nfl_team || 'N/A'}</td>
              <td style={{ padding: '10px' }}>{(player.total_points || 0).toFixed(2)}</td>
              <td style={{ padding: '10px' }}>
                <button
                  onClick={() => handleAddPlayer(player.player_id)}
                  disabled={!userTeamId || loading === player.player_id}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: (!userTeamId || loading === player.player_id) ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    opacity: (!userTeamId || loading === player.player_id) ? 0.6 : 1,
                  }}
                >
                  {loading === player.player_id ? 'Adding...' : 'Add'}
                </button>
              </td>
            </tr>
          ))}
          {filteredAndSortedPlayers.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No free agents match your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
