import type { NextConfig } from 'next';
const config:NextConfig={
  reactCompiler:true,
  async headers() { return [{source:'/:path*',headers:[
    {key:'X-Content-Type-Options',value:'nosniff'},
    {key:'Referrer-Policy',value:'same-origin'},
    {key:'X-Frame-Options',value:'DENY'},
  ]},{source:'/sw.js',headers:[{key:'Cache-Control',value:'no-cache'}]},
  {source:'/admin/setup',headers:[{key:'Referrer-Policy',value:'no-referrer'}]}]; },
};
export default config;
