import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: '.env' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setup() {
    console.log('Creating storage bucket "properties"...')
    const { data, error } = await supabase.storage.createBucket('properties', {
        public: true,
        allowedMimeTypes: ['image/*'],
        fileSizeLimit: 5242880 // 5MB
    })

    if (error) {
        if (error.message.includes('already exists')) {
            console.log('Bucket "properties" already exists.')
        } else {
            console.error('Error creating bucket:', error.message)
        }
    } else {
        console.log('Bucket "properties" created successfully.')
    }
}

setup()
