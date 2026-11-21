// Retired unsafe mail relay. Deploy before enabling the new application.
declare const Deno: {serve(handler:()=>Response):void};
Deno.serve(() => new Response(JSON.stringify({error:'Use the application invitation endpoint.'}),{
  status:410,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
}));
