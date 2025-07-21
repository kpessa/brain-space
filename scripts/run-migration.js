import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  if (!supabaseUrl) console.error('  - VITE_SUPABASE_URL')
  if (!supabaseServiceKey) console.error('  - SUPABASE_SERVICE_KEY')
  console.error('\nPlease add these to your .env file.')
  console.error('You can find the service key in your Supabase project settings under API.')
  process.exit(1)
}

console.log('🚀 Connecting to Supabase...')
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '001_initial_schema.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📄 Running migration...')
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    let successCount = 0
    let errorCount = 0
    
    for (const statement of statements) {
      try {
        // Skip empty statements
        if (!statement.trim()) continue
        
        // Add semicolon back
        const sql = statement + ';'
        
        // Execute the statement
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single()
        
        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_sql').select().single().eq('query', sql)
          
          if (directError) {
            console.error(`❌ Error executing statement: ${directError.message}`)
            console.error(`   Statement: ${sql.substring(0, 50)}...`)
            errorCount++
          } else {
            console.log(`✅ Executed: ${sql.substring(0, 50)}...`)
            successCount++
          }
        } else {
          console.log(`✅ Executed: ${sql.substring(0, 50)}...`)
          successCount++
        }
      } catch (err) {
        console.error(`❌ Error: ${err.message}`)
        errorCount++
      }
    }
    
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Success: ${successCount} statements`)
    console.log(`   ❌ Errors: ${errorCount} statements`)
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be okay if tables already exist.')
      console.log('   Please check your Supabase dashboard to verify the schema.')
    } else {
      console.log('\n🎉 Migration completed successfully!')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// Note about alternative approach
console.log('\n📝 Note: Since the Supabase CLI requires special installation,')
console.log('   we recommend using the Supabase Dashboard SQL Editor instead.')
console.log('   This script is provided as an alternative, but may have limitations.\n')

console.log('⚠️  This script requires a service key with admin privileges.')
console.log('   For security, use the Dashboard method for production.\n')

// Run the migration
runMigration()