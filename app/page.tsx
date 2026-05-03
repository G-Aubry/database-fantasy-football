
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

'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import CreateLeagueModal from './CreateLeagueModal'
import Link from 'next/link'

interface League {
  league_id: number
  league_name: string
  max_teams: number
  scoring_type: string
}

export default function Home() {
  const { data: session, status } = useSession()
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchLeagues()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  async function fetchLeagues() {
    try {
      const response = await fetch('/api/leagues')
      const data = await response.json()
      setLeagues(data)
    } catch (error) {
      console.error('Error fetching leagues:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem'}}>👑 Triple 👑 Fantasy 👑</h1>
        <p>Welcome! Please log in or create an account to get started.</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <Link 
            href="/login"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Login
          </Link>
          <Link 
            href="/signup"
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              textDecoration: 'none',
              borderRadius: '4px'
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem'}}>👑 Triple 👑 Fantasy 👑 </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Welcome, {session?.user?.name}!</span>
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
            style={{
              padding: '8px 16px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <CreateLeagueModal onLeagueCreated={fetchLeagues} />

      <p style={{ marginTop: '30px' }}>Leagues:</p>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {leagues.map(league => (
          <li key={league.league_id} style={{ marginBottom: '10px' }}>
            <a 
              href={`/league/${league.league_id}`}
              style={{ 
                textDecoration: 'none', 
                color: '#007bff',
                fontSize: '16px',
                padding: '10px',
                display: 'block',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px'
              }}
            >
              {league.league_name} ({league.max_teams} teams, {league.scoring_type})
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}