import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Watch {
  id: string
  when_bought?: string | null
  created_at: string
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
}

function twoDigitToYear(yy: number) {
  return yy >= 70 ? 1900 + yy : 2000 + yy
}

function formatDateToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeWhenBought(when_bought?: string | null, created_at?: string): string | null {
  if (!when_bought || !when_bought.trim()) {
    return null
  }

  const s = when_bought.trim()

  // Already ISO YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s)
    if (!isNaN(d.getTime())) return s
  }

  // Month-YY or Month-YYYY (e.g., "March-24", "Oct 2023")
  const monthYearMatch = s.match(/^([A-Za-z]+)[\s-]+(\d{2}|\d{4})$/)
  if (monthYearMatch) {
    const monthStr = monthYearMatch[1].toLowerCase()
    const y = monthYearMatch[2]
    const monthIndex = MONTHS[monthStr]
    if (monthIndex !== undefined) {
      const year = y.length === 2 ? twoDigitToYear(Number(y)) : Number(y)
      const d = new Date(year, monthIndex, 1)
      return formatDateToISO(d)
    }
  }

  // Year only - use January 1st
  if (/^\d{4}$/.test(s)) {
    const d = new Date(Number(s), 0, 1)
    return formatDateToISO(d)
  }

  // Two-digit year only (e.g., "24")
  if (/^\d{2}$/.test(s)) {
    const year = twoDigitToYear(Number(s))
    const d = new Date(year, 0, 1)
    return formatDateToISO(d)
  }

  // Try native Date parsing
  const native = new Date(s)
  if (!isNaN(native.getTime())) {
    return formatDateToISO(native)
  }

  // Cannot parse - leave as is
  console.log(`Could not parse date: ${s}`)
  return null
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting purchase date normalization...')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch all watches
    const { data: watches, error: fetchError } = await supabase
      .from('watches')
      .select('id, when_bought, created_at')

    if (fetchError) {
      console.error('Error fetching watches:', fetchError)
      throw fetchError
    }

    console.log(`Found ${watches?.length || 0} watches to process`)

    const updates: { id: string; oldValue: string | null; newValue: string | null }[] = []
    const errors: { id: string; value: string | null; error: string }[] = []

    // Process each watch
    for (const watch of (watches as Watch[]) || []) {
      try {
        const normalizedDate = normalizeWhenBought(watch.when_bought, watch.created_at)
        
        // Only update if the value changed
        if (normalizedDate && normalizedDate !== watch.when_bought) {
          const { error: updateError } = await supabase
            .from('watches')
            .update({ when_bought: normalizedDate })
            .eq('id', watch.id)

          if (updateError) {
            console.error(`Error updating watch ${watch.id}:`, updateError)
            errors.push({
              id: watch.id,
              value: watch.when_bought || null,
              error: updateError.message
            })
          } else {
            console.log(`Updated watch ${watch.id}: "${watch.when_bought}" -> "${normalizedDate}"`)
            updates.push({
              id: watch.id,
              oldValue: watch.when_bought || null,
              newValue: normalizedDate
            })
          }
        }
      } catch (err) {
        console.error(`Error processing watch ${watch.id}:`, err)
        errors.push({
          id: watch.id,
          value: watch.when_bought || null,
          error: err instanceof Error ? err.message : String(err)
        })
      }
    }

    const response = {
      success: true,
      totalProcessed: watches?.length || 0,
      updatedCount: updates.length,
      errorCount: errors.length,
      updates,
      errors
    }

    console.log('Normalization complete:', response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in normalize-purchase-dates function:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : String(error) 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
