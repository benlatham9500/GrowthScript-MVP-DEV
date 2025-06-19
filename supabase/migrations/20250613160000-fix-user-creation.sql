
-- Update the handle_new_user function to be more robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users table, but handle conflicts gracefully
  INSERT INTO public.users (_id, email, plan, client_limit)
  VALUES (
    NEW.id,
    NEW.email,
    'none',
    0
  )
  ON CONFLICT (_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to backfill missing user records
CREATE OR REPLACE FUNCTION public.backfill_missing_users()
RETURNS void AS $$
BEGIN
  -- Insert missing user records for existing auth users
  INSERT INTO public.users (_id, email, plan, client_limit)
  SELECT 
    auth.users.id,
    auth.users.email,
    'none',
    0
  FROM auth.users
  LEFT JOIN public.users ON auth.users.id = public.users._id
  WHERE public.users._id IS NULL
  ON CONFLICT (_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the backfill function to create missing records
SELECT public.backfill_missing_users();
