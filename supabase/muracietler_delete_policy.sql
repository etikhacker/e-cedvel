-- Retired unsafe policy installer. Apply reviewed supabase/migrations instead.
do $$ begin raise exception 'Use the versioned migrations; see docs/DEPLOYMENT.md'; end $$;
