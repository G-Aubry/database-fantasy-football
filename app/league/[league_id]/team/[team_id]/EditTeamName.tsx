'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  teamId: number
  initialTeamName: string
  isOwner: boolean
}

export default function EditTeamName({
  teamId,
  initialTeamName,
  isOwner,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(initialTeamName)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSave = async () => {
    setError('')
    if (name === initialTeamName) {
      setIsEditing(false)
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update team name')
      }

      setIsEditing(false)
      // Refresh the page to show the new name
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div>
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ fontSize: '2rem', fontWeight: 'bold' }}
          />
          <button onClick={handleSave} style={{ padding: '8px 12px', backgroundColor: '#065700' }}>
            Save
          </button>
          <button
            onClick={() => {
              setIsEditing(false)
              setName(initialTeamName)
              setError('')
            }}
            style={{ padding: '8px 12px', backgroundColor: '#ff0000' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <h1 style={{ fontSize: '2.5rem'}}>{name}</h1>
          {isOwner && (
            <button onClick={() => setIsEditing(true)} style={{ padding: '8px 12px', backgroundColor: '#e1e1e1'}}>
              Edit Name
            </button>
          )}
        </div>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
