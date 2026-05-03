import { recalculateAllLeaguePoints } from '../../../actions'
import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🔄 Backfill API called - starting recalculation...')
  try {
    const result = await recalculateAllLeaguePoints()
    console.log('✅ Backfill API completed successfully')
    return NextResponse.json({
      message: 'Recalculation completed successfully',
      result
    })
  } catch (error) {
    console.error('❌ Backfill API error:', error)
    return NextResponse.json({
      error: 'Recalculation failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}