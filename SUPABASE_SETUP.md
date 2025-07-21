# 🚀 Supabase Setup Guide for Brain Space

This guide will walk you through setting up your Supabase database for the Brain Space app.

## Prerequisites

✅ You've already created a Supabase project  
✅ You've added your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 1: Run the Database Migration

Since you have your Supabase credentials set up, here's how to create the database schema:

### Option A: Using Supabase Dashboard (Recommended) 🎯

1. **Open your Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query" button

3. **Run the Migration**
   - Copy the entire contents of `supabase/init.sql`
   - Paste it into the SQL editor
   - Click "Run" (or press Ctrl/Cmd + Enter)

4. **Verify Success**
   - You should see "Success. No rows returned" message
   - Check the final notice: "Brain Space database schema created successfully!"

### Option B: Using Supabase CLI (Alternative)

If you prefer using the CLI, you'll need to install it first:

**On macOS (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**On Windows (using Scoop):**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**On Linux:**
```bash
curl -sSL https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
```

**Then run:**
```bash
# Login to Supabase
supabase login

# Initialize project (if not already done)
supabase init

# Link to your project
supabase link --project-ref <your-project-ref>

# Run the migration
supabase db push
```

## Step 2: Verify the Setup

1. **Check Tables Created**
   - In Supabase Dashboard, go to "Table Editor"
   - You should see these tables:
     - `profiles`
     - `user_progress`
     - `journal_entries`
     - `brain_dumps`

2. **Verify RLS is Enabled**
   - Click on each table
   - Check that "RLS enabled" shows a green checkmark
   - Click "Policies" tab to see the security policies

3. **Test Authentication Settings**
   - Go to "Authentication" → "Providers"
   - Ensure "Email" is enabled
   - For testing, you may want to disable email confirmation:
     - Go to "Authentication" → "Email Templates"
     - Under "Enable email confirmations", toggle it OFF

## Step 3: Test the Integration

1. **Start your development server:**
   ```bash
   pnpm run dev
   ```

2. **Create an account:**
   - Visit http://localhost:5174
   - Click "Sign up"
   - Enter email and password
   - You should be logged in automatically

3. **Test data persistence:**
   - Create a journal entry
   - Create a brain dump
   - Refresh the page - your data should persist!

4. **Verify in Supabase:**
   - Go to Table Editor in Supabase
   - Check `journal_entries` and `brain_dumps` tables
   - You should see your created data

## Troubleshooting

### "Permission denied" errors
- Make sure RLS policies are correctly set up
- Verify you're authenticated (check browser console)

### Data not saving
- Check browser console for errors
- Verify your environment variables are loaded
- Ensure you're not in offline mode

### Can't create account
- Check email settings in Supabase Authentication
- Disable email confirmation for testing
- Check Supabase logs for errors

### Real-time not working
- This is normal - real-time requires additional setup
- The app will still work with regular data fetching

## Security Notes

🔒 **Important**: 
- Never commit your `.env` file
- The anon key is safe for frontend use
- RLS policies ensure data isolation between users
- For production, enable email verification

## Next Steps

✨ Your Supabase integration is now complete! You can:
- Start creating journal entries
- Build mind maps with brain dumps
- Track your hero's journey progress
- Everything saves automatically to the cloud!

Need help? Check the [Supabase docs](https://supabase.com/docs) or the app's README.