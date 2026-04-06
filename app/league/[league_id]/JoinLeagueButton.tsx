'use client'

import { useState } from 'react'

interface Team {
  team_id: number
  team_name: string
  owner_id: number | null
}

interface League {
  league_id: number
  max_teams: number
}

interface JoinLeagueButtonProps {
  league: League
  teams: Team[]
  userId: string | null | undefined
}

export default function JoinLeagueButton({ league, teams, userId }: JoinLeagueButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!userId) {
    return null // Don't show the button if user is not logged in
  }

  const isLeagueFull = teams.length >= league.max_teams
  const userHasTeam = userId ? teams.some(team => team.owner_id === parseInt(userId, 10)) : false

  if (isLeagueFull || userHasTeam) {
    return null // Don't show button if league is full or user already has a team
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          league_id: league.league_id,
          team_name: teamName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create team')
      }

      // Success, close modal and refresh the page to show the new team
      setShowModal(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#28a745',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          marginTop: '10px',
          marginBottom: '20px',
        }}
      >
        Join League
      </button>

      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ padding: '30px', background: 'white', borderRadius: '8px', minWidth: '350px' }}>
            <h2>Create Your Team</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input
                type="text"
                placeholder="Enter team name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                style={{ padding: '10px', fontSize: '16px', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              {error && <p style={{ color: '#d32f2f', fontSize: '14px', margin: 0 }}>{error}</p>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '10px 20px', border: '1px solid #ddd', borderRadius: '4px', background: '#f5f5f5' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
