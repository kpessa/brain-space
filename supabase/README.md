# Supabase Setup Instructions

## Prerequisites

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Add them to your `.env` file:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Database Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `migrations/001_initial_schema.sql`
4. Paste and run the SQL in the editor
5. You should see success messages for all created tables and policies

### Option 2: Using Supabase CLI

1. Install the Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. Run the migration:
   ```bash
   supabase db push
   ```

## Verify Setup

After running the migration, verify that:

1. The following tables exist:
   - `profiles`
   - `user_progress`
   - `journal_entries`
   - `brain_dumps`

2. Row Level Security (RLS) is enabled on all tables
3. Policies are created for user access

## Testing

1. Start your development server:
   ```bash
   pnpm run dev
   ```

2. Create a new account through the app
3. Create a journal entry or brain dump
4. Check the Supabase dashboard to verify data is being saved

## Troubleshooting

### Authentication Issues
- Ensure your anon key is correct
- Check that email confirmations are disabled for testing (Auth > Settings > Email Auth)

### Data Not Saving
- Verify RLS policies are correctly set up
- Check browser console for any errors
- Ensure the user is properly authenticated

### Real-time Updates Not Working
- Real-time requires additional setup in Supabase dashboard
- Go to Database > Replication and enable the tables you want to sync

## Security Notes

- Never commit your `.env` file with real credentials
- The anon key is safe to use in frontend code
- RLS policies ensure users can only access their own data
- Consider enabling email verification for production use