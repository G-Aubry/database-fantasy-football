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