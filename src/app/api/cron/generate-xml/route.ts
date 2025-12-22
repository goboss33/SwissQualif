import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()

  // 1. Fetch active properties with their images
  const { data: properties, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_images (
        storage_path,
        position
      )
    `)
    .eq('status', 'active')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 2. Generate IDX 3.01 XML
  // Simplified version for MVP
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<root version="3.01">
  <transactions>`

  properties.forEach((p) => {
    xml += `
    <transaction reference="${p.reference}">
      <property_type>apartment</property_type>
      <offer_type>sale</offer_type>
      <price currency="CHF">${p.price_chf}</price>
      <address>
        <street>${p.street}</street>
        <zip>${p.zip_code}</zip>
        <city>${p.city}</city>
        <canton>${p.canton}</canton>
      </address>
      <features>
        <rooms>${p.rooms}</rooms>
        <surface_living unit="sqm">${p.surface_living}</surface_living>
      </features>
      <description lang="fr">${p.description_fr || ''}</description>
      <media>`

    p.property_images?.sort((a: any, b: any) => a.position - b.position).forEach((img: any) => {
      const publicUrl = supabase.storage.from('properties').getPublicUrl(img.storage_path).data.publicUrl
      xml += `
        <image url="${publicUrl}" />`
    })

    xml += `
      </media>
    </transaction>`
  })

  xml += `
  </transactions>
</root>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
