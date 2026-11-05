import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'tests/e2e',workers:1,fullyParallel:false,
  use:{baseURL:'http://127.0.0.1:3100',headless:true,screenshot:'only-on-failure',trace:'retain-on-failure'},
  webServer:[
    {command:'node tests/mock-supabase.mjs',url:'http://127.0.0.1:54391/health',reuseExistingServer:!process.env.CI},
    {command:'npm run start -- --port 3100',url:'http://127.0.0.1:3100',reuseExistingServer:!process.env.CI,
      env:{NEXT_PUBLIC_APP_URL:'http://127.0.0.1:3100',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54391',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test-anon-key'}},
  ],
});
