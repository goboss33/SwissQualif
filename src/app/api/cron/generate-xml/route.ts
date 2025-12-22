import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as ftp from 'basic-ftp'
import { Readable } from 'stream'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = await createClient()

  // 1. Fetch all active portal configurations
  const { data: configs, error: configError } = await supabase
    .from('portals_config')
    .select('*, agencies(name)')
    .eq('is_active', true)

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 })
  }

  const results = []

  // 2. Process each agency/portal configuration
  for (const config of configs) {
    try {
      // Fetch properties for this specific agency
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(`
          *,
          property_images (
            storage_path,
            position
          )
        `)
        .eq('agency_id', config.agency_id)
        .eq('status', 'active')

      if (propError) throw propError

      // Generate XML content (IDX 3.01)
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<root version="3.01">
  <transactions>`

      properties?.forEach((p) => {
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

      // 3. Upload via FTP
      if (config.ftp_host && config.ftp_user && config.ftp_password) {
        const client = new ftp.Client()
        client.ftp.verbose = false
        try {
          await client.access({
            host: config.ftp_host,
            user: config.ftp_user,
            password: config.ftp_password,
            secure: false
          })

          const stream = Readable.from([xml])
          await client.uploadFrom(stream, `swissqualif_export_${config.portal_name}.xml`)
          results.push({ agency: config.agencies?.name, portal: config.portal_name, status: 'success' })
        } finally {
          client.close()
        }
      } else {
        results.push({ agency: config.agencies?.name, portal: config.portal_name, status: 'error', message: 'Paramètres FTP manquants' })
      }
    } catch (err: any) {
      results.push({ agency: config.agencies?.name, portal: config.portal_name, status: 'error', message: err.message })
    }
  }

  return NextResponse.json({ processed: results })
}
