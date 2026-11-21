// Local-only deterministic Auth/REST stand-in. Database authorization is tested
// separately against PostgreSQL in database.test.ts; this is not a live Auth test.
import http from 'node:http';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const profiles=new Map();
const user=n=>({id:id(n),aud:'authenticated',role:'authenticated',email:'test'+n+'@example.az',email_confirmed_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email'},user_metadata:{full_name:'Test '+n},created_at:'2026-01-01T00:00:00Z'});
http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'http://127.0.0.1:3100','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type,prefer,x-supabase-api-version','Access-Control-Allow-Methods':'GET,POST,PATCH,DELETE,OPTIONS'};
  const send=(status,value)=>{res.writeHead(status,headers);res.end(JSON.stringify(value));};
  if(req.method==='OPTIONS'){
    headers['Access-Control-Allow-Headers']=req.headers['access-control-request-headers']||'*';
    return send(204,null);
  }
  if(url.pathname==='/health')return send(200,{ok:true});
  const bearer=(req.headers.authorization||'').replace('Bearer ','');
  let n=0;
  try{n=Number(JSON.parse(Buffer.from(bearer.split('.')[1],'base64url').toString()).sub.slice(-12));}catch{}
  if(url.pathname==='/auth/v1/user')return n?send(200,user(n)):send(401,{message:'Invalid token',code:'bad_jwt'});
  if(url.pathname==='/auth/v1/logout')return send(204,null);
  if(url.pathname==='/auth/v1/token')return send(400,{error:'invalid_grant',error_description:'Invalid test token'});
  if(url.pathname.startsWith('/rest/v1/')){
    const table=url.pathname.split('/').pop();
    let data=[];
    if(table==='university_admins')data=n===1?[{id:id(n),role:'superadmin',university_id:null}]:n===2?[{id:id(n),role:'university_admin',university_id:id(101),universities:{name:'Test Universiteti'}}]:[];
    else if(table==='universities')data=[{id:id(101),name:'Test Universiteti',short_name:'TEST',is_active:true,semester_start:'2026-09-14',first_week:'ust'}];
    else if(table==='faculties')data=[{id:id(201),university_id:id(101),name:'Test fakültəsi'}];
    else if(table==='groups')data=[{id:id(301),name:'TEST-1',university_id:id(101),faculty_id:id(201),faculties:{name:'Test fakültəsi'}}];
    else if(table==='profiles'){
      if(req.method==='POST'){
        let body='';for await(const part of req)body+=part;
        if(n===8)return send(500,{code:'XX000',message:'simulated database failure'});
        profiles.set(n,JSON.parse(body));return send(201,null);
      }
      data=[profiles.get(n)||{id:id(n),name:'Test '+n,group_id:id(301),university_id:id(101),subgroup:'ust',saved_grades:{Math:42},saved_details:{Math:{total:42}},notes:n===4?'Second account note':'First account note',absences:{},notification_settings:null}];
    }
    else if(table==='schedule_lessons'){
      if(n===7)return send(500,{code:'XX000',message:'simulated schedule failure'});
      data=n===4?[]:[{id:id(401),group_id:id(301),university_id:id(101),subject:'Şənbə dərsi',teacher:'Müəllim',room:'101',day:'Şənbə',time:'09:00-10:30',week:'hamisi',subgroup:'hamisi',type:'mesqele'}];
    }
    if((req.headers.accept||'').includes('application/vnd.pgrst.object+json'))return data.length?send(200,data[0]):send(406,{code:'PGRST116',message:'no row'});
    return send(200,data);
  }
  send(404,{error:'Not a test endpoint'});
}).listen(54391,'127.0.0.1');
