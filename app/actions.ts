'use server'

import prisma from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createLeague(formData: FormData) {
  const leagueName = formData.get('leagueName') as string
  const maxTeams = parseInt(formData.get('maxTeams') as string) || 12
  const maxRosterSize = parseInt(formData.get('maxRosterSize') as string) || 15
  const scoringType = (formData.get('scoringType') as string) || 'Standard'

  if (!leagueName.trim()) {
    throw new Error('League name is required')
  }

  await prisma.league.create({
    data: {
      league_name: leagueName,
      max_teams: maxTeams,
      max_roster_size: maxRosterSize,
      scoring_type: scoringType as 'PPR' | 'Half_PPR' | 'Standard',
    },
  })

  redirect('/')
}