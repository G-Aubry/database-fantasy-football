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

import { useState } from 'react'
import { createLeague } from './actions'

interface CreateLeagueModalProps {
  onLeagueCreated?: () => void
}

export default function CreateLeagueModal({ onLeagueCreated }: CreateLeagueModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (formData: FormData) => {
    try {
      setError('')
      await createLeague(formData)
      setIsOpen(false)
      onLeagueCreated?.()
    } catch (err: any) {
      if (err?.digest === 'NEXT_REDIRECT') {
        return
      }
      setError(err instanceof Error ? err.message : 'Failed to create league')
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
      >
        + Create League
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h2>Create New League</h2>
            {error && <p style={{ color: '#d32f2f', marginBottom: '15px' }}>{error}</p>}
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                name="leagueName" 
                placeholder="League name" 
                required
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input 
                type="number" 
                name="maxTeams" 
                placeholder="Max teams" 
                defaultValue="12"
                min="2"
                max="16"
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <input 
                type="number" 
                name="maxRosterSize" 
                placeholder="Max roster size" 
                defaultValue="15"
                min="1"
                max="30"
                style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
              />
              <select name="scoringType" defaultValue="Standard" style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}>
                <option value="Standard">Standard</option>
                <option value="PPR">PPR</option>
                <option value="Half_PPR">Half PPR</option>
              </select>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Create
                </button>
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  style={{ flex: 1, padding: '10px', cursor: 'pointer', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}