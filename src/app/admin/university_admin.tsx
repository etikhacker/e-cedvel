'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { exportToExcel, exportToPDF } from '@/lib/exportSchedule';

type Faculty = { id: string; name: string; university_id: string };
type Group   = { id: string; name: string; faculty_id: string; university_id: string };
type Subject = { id: string; name: string; university_id: string };
type Lesson  = {
  id: string; group_id: string; day: string; time: string;
  subject: string; teacher: string; room: string;
  week: string; subgroup: string;
};

const DAYS = ['Bazar ertəsi','Çərşənbə axşamı','Çərşənbə','Cümə axşamı','Cümə','Şənbə'];
const TABS = ['Cədvəl','Fakültələr','Qruplar','Fənlər','Dərslər'] as const;
type Tab = typeof TABS[number];

/* ── Style helpers ── */
const inp: React.CSSProperties = {
  width:'100%', padding:'9px 13px',
  background:'rgba(255,255,255,0.05)',
  border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:8, color:'#fff',
  fontSize:'0.875rem', fontFamily:'inherit', outline:'none',
};
const sel: React.CSSProperties = {
  ...inp, background:'#161d2a',
};
const lbl: React.CSSProperties = {
  display:'block', fontSize:'0.73rem', fontWeight:600,
  marginBottom:5, color:'rgba(255,255,255,0.5)',
};
const btn = (c: string, sm = false): React.CSSProperties => ({
  padding: sm ? '5px 11px' : '9px 18px',
  background:`${c}18`, border:`1px solid ${c}40`,
  borderRadius:8, color:c, cursor:'pointer',
  fontSize: sm ? '0.73rem' : '0.84rem',
  fontWeight:700, fontFamily:'inherit',
});

export default function UniversityAdminPage() {
  const router = useRouter();
  const [uniId,    setUniId]    = useState<string|null>(null);
  const [uniName,  setUniName]  = useState('');
  const [email,    setEmail]    = useState('');
  const [tab,      setTab]      = useState<Tab>('Cədvəl');
  const [loading,  setLoading]  = useState(true);
  const [faculties,setFaculties]= useState<Faculty[]>([]);
  const [groups,   setGroups]   = useState<Group[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons,  setLessons]  = useState<Lesson[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return; }
      setEmail(session.user.email ?? '');
      const { data } = await supabase
        .from('university_admins')
        .select('university_id, universities(name)')
        .eq('id', session.user.id).single();
      if (!data) { router.replace('/'); return; }
      const id = data.university_id;
      const nm = (data as any).universities?.name ?? '';
      setUniId(id); setUniName(nm);
      await loadAll(id);
    });
  }, []);

  const loadAll = async (id: string) => {
    setLoading(true);
    const [f,g,s,l] = await Promise.all([
      supabase.from('faculties').select('*').eq('university_id',id),
      supabase.from('groups').select('*').eq('university_id',id),
      supabase.from('subjects').select('*').eq('university_id',id),
      supabase.from('schedule_lessons').select('*').eq('university_id',id),
    ]);
    setFaculties(f.data??[]); setGroups(g.data??[]);
    setSubjects(s.data??[]); setLessons(l.data??[]);
    setLoading(false);
  };

  const reload = () => { if (uniId) loadAll(uniId); };

  if (loading) return (
    <div style={{minHeight:'100vh',background:'#0d1117',display:'flex',
      alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0.3)'}}>
      Yüklənir...
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:'#0d1117',color:'#fff',
      fontFamily:'var(--font-geist-sans,system-ui,sans-serif)'}}>

      {/* Header */}
      <header style={{height:60,padding:'0 5%',display:'flex',alignItems:'center',
        justifyContent:'space-between',borderBottom:'1px solid rgba(255,255,255,0.07)',
        background:'rgba(13,17,23,0.95)',position:'sticky',top:0,zIndex:50}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:32,height:32,borderRadius:8,background:'#3b82f6',
            display:'flex',alignItems:'center',justifyContent:'center',
            fontWeight:900,fontSize:'0.72rem'}}>EC</div>
          <div>
            <div style={{fontWeight:700,fontSize:'0.95rem'}}>{uniName}</div>
            <div style={{fontSize:'0.68rem',color:'rgba(255,255,255,0.4)'}}>University Admin</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:'0.78rem',color:'rgba(255,255,255,0.35)'}}>{email}</span>
          <button style={btn('#ef4444',true)}
            onClick={async()=>{await supabase.auth.signOut();router.replace('/login');}}>
            Çıx
          </button>
        </div>
      </header>

      <main style={{maxWidth:1080,margin:'0 auto',padding:'28px 5%'}}>

        {/* Tabs */}
        <div style={{display:'flex',gap:3,marginBottom:26,
          background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',
          borderRadius:10,padding:4}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              flex:1,padding:'8px 0',border:'none',borderRadius:7,
              background:tab===t?'#3b82f6':'transparent',
              color:tab===t?'#fff':'rgba(255,255,255,0.45)',
              fontWeight:tab===t?700:500,fontSize:'0.83rem',
              cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
            }}>{t}</button>
          ))}
        </div>

        {tab==='Cədvəl'    &&<ScheduleTab   lessons={lessons} groups={groups} uniName={uniName}/>}
        {tab==='Fakültələr'&&<FacultiesTab  faculties={faculties} uniId={uniId!} reload={reload}/>}
        {tab==='Qruplar'   &&<GroupsTab     groups={groups} faculties={faculties} uniId={uniId!} reload={reload}/>}
        {tab==='Fənlər'    &&<SubjectsTab   subjects={subjects} uniId={uniId!} reload={reload}/>}
        {tab==='Dərslər'   &&<LessonsTab    lessons={lessons} groups={groups} subjects={subjects} uniId={uniId!} reload={reload}/>}
      </main>
    </div>
  );
}

/* ── SCHEDULE ── */
function ScheduleTab({lessons,groups,uniName}:{lessons:Lesson[];groups:Group[];uniName:string}) {
  const [grp,setGrp]=useState('all');
  const [wk,setWk]=useState('hamisi');
  const [xl,setXl]=useState(false);

  const filtered=lessons.filter(l=>
    (grp==='all'||l.group_id===grp)&&
    (wk==='hamisi'||l.week==='hamisi'||l.week===wk)
  );
  const expData=filtered.map(l=>({
    day:l.day,time:l.time,subject:l.subject,teacher:l.teacher,
    room:l.room,week:l.week,subgroup:l.subgroup,
    group:groups.find(g=>g.id===l.group_id)?.name??'',
  }));
  const title=`${uniName} — Cədvəl`;

  return(
    <div>
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'flex-end'}}>
        <div style={{flex:'0 0 190px'}}>
          <label style={lbl}>Qrup</label>
          <select style={sel} value={grp} onChange={e=>setGrp(e.target.value)}>
            <option value="all">Bütün qruplar</option>
            {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div style={{flex:'0 0 155px'}}>
          <label style={lbl}>Həftə</label>
          <select style={sel} value={wk} onChange={e=>setWk(e.target.value)}>
            <option value="hamisi">Hamısı</option>
            <option value="ust">Üst həftə</option>
            <option value="alt">Alt həftə</option>
          </select>
        </div>
        <div style={{marginLeft:'auto',display:'flex',gap:8}}>
          <button disabled={!filtered.length||xl} style={btn('#22c55e')}
            onClick={async()=>{setXl(true);await exportToExcel(expData,title);setXl(false);}}>
            📊 {xl?'...':'Excel'}
          </button>
          <button disabled={!filtered.length} style={btn('#f87171')}
            onClick={()=>exportToPDF(expData,title)}>
            🖨 PDF/Çap
          </button>
        </div>
      </div>

      {filtered.length===0?<Empty text="Cədvəl yoxdur"/>:(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Gün','Vaxt','Fənn','Müəllim','Otaq','Qrup','Həftə','Yarımqrup'].map(h=>(
                <th key={h} style={{padding:'9px 10px',background:'#3b82f6',color:'#fff',
                  fontSize:'0.75rem',fontWeight:700,textAlign:'left',
                  border:'1px solid #2563eb'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {DAYS.flatMap(day=>{
                const rows=filtered.filter(l=>l.day===day);
                return rows.map((l,i)=>(
                  <tr key={l.id} style={{background:i%2===0?'rgba(255,255,255,0.02)':'transparent'}}>
                    {i===0&&<td rowSpan={rows.length} style={{padding:'8px 10px',
                      fontWeight:700,color:'#3b82f6',fontSize:'0.78rem',
                      border:'1px solid rgba(255,255,255,0.06)',
                      textAlign:'center',verticalAlign:'middle'}}>{day}</td>}
                    {[l.time,l.subject,l.teacher,l.room,
                      groups.find(g=>g.id===l.group_id)?.name??'—',
                      l.week==='ust'?'Üst':l.week==='alt'?'Alt':'Hamısı',
                      l.subgroup==='hamisi'?'Hamısı':l.subgroup,
                    ].map((v,ci)=>(
                      <td key={ci} style={{padding:'7px 10px',fontSize:'0.8rem',
                        border:'1px solid rgba(255,255,255,0.05)',
                        color:'rgba(255,255,255,0.78)'}}>{v}</td>
                    ))}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── FACULTIES ── */
function FacultiesTab({faculties,uniId,reload}:{faculties:Faculty[];uniId:string;reload:()=>void}) {
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [delId,setDelId]=useState<string|null>(null);
  const add=async()=>{
    if(!name.trim())return;
    setSaving(true);
    await supabase.from('faculties').insert({name:name.trim(),university_id:uniId});
    setName('');setSaving(false);reload();
  };
  return(
    <div>
      <SH title="Fakültələr" count={faculties.length}/>
      <div style={{display:'flex',gap:10,marginBottom:18}}>
        <input style={{...inp,flex:1}} placeholder="Fakültə adı" value={name}
          onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <button style={btn('#3b82f6')} onClick={add} disabled={saving}>{saving?'...':'+ Əlavə et'}</button>
      </div>
      <LT headers={['Fakültə adı','Əməliyyat']}
        rows={faculties.map(f=>({id:f.id,cells:[f.name],onDelete:()=>setDelId(f.id)}))}
        delId={delId}
        onConfirm={async id=>{await supabase.from('faculties').delete().eq('id',id);setDelId(null);reload();}}
        onCancel={()=>setDelId(null)}/>
    </div>
  );
}

/* ── GROUPS ── */
function GroupsTab({groups,faculties,uniId,reload}:{groups:Group[];faculties:Faculty[];uniId:string;reload:()=>void}) {
  const [form,setForm]=useState({name:'',faculty_id:''});
  const [saving,setSaving]=useState(false);
  const [delId,setDelId]=useState<string|null>(null);
  const add=async()=>{
    if(!form.name.trim())return;
    setSaving(true);
    await supabase.from('groups').insert({name:form.name.trim(),faculty_id:form.faculty_id||null,university_id:uniId});
    setForm({name:'',faculty_id:''});setSaving(false);reload();
  };
  return(
    <div>
      <SH title="Qruplar" count={groups.length}/>
      <div style={{display:'flex',gap:10,marginBottom:18,flexWrap:'wrap'}}>
        <input style={{...inp,flex:'0 0 190px'}} placeholder="Qrup adı (IT-24.1)"
          value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))}
          onKeyDown={e=>e.key==='Enter'&&add()}/>
        <select style={{...sel,flex:'0 0 210px'}} value={form.faculty_id}
          onChange={e=>setForm(p=>({...p,faculty_id:e.target.value}))}>
          <option value="">Fakültə (ixtiyari)</option>
          {faculties.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <button style={btn('#3b82f6')} onClick={add} disabled={saving}>{saving?'...':'+ Əlavə et'}</button>
      </div>
      <LT headers={['Qrup adı','Fakültə','Əməliyyat']}
        rows={groups.map(g=>({id:g.id,
          cells:[g.name,faculties.find(f=>f.id===g.faculty_id)?.name??'—'],
          onDelete:()=>setDelId(g.id)}))}
        delId={delId}
        onConfirm={async id=>{await supabase.from('groups').delete().eq('id',id);setDelId(null);reload();}}
        onCancel={()=>setDelId(null)}/>
    </div>
  );
}

/* ── SUBJECTS ── */
function SubjectsTab({subjects,uniId,reload}:{subjects:Subject[];uniId:string;reload:()=>void}) {
  const [name,setName]=useState('');
  const [saving,setSaving]=useState(false);
  const [delId,setDelId]=useState<string|null>(null);
  const add=async()=>{
    if(!name.trim())return;
    setSaving(true);
    await supabase.from('subjects').insert({name:name.trim(),university_id:uniId});
    setName('');setSaving(false);reload();
  };
  return(
    <div>
      <SH title="Fənlər" count={subjects.length}/>
      <div style={{display:'flex',gap:10,marginBottom:18}}>
        <input style={{...inp,flex:1}} placeholder="Fənn adı" value={name}
          onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==='Enter'&&add()}/>
        <button style={btn('#3b82f6')} onClick={add} disabled={saving}>{saving?'...':'+ Əlavə et'}</button>
      </div>
      <LT headers={['Fənn adı','Əməliyyat']}
        rows={subjects.map(s=>({id:s.id,cells:[s.name],onDelete:()=>setDelId(s.id)}))}
        delId={delId}
        onConfirm={async id=>{await supabase.from('subjects').delete().eq('id',id);setDelId(null);reload();}}
        onCancel={()=>setDelId(null)}/>
    </div>
  );
}

/* ── LESSONS ── */
const EL={group_id:'',day:'Bazar ertəsi',time:'08:00-09:30',
  subject:'',teacher:'',room:'',week:'hamisi',subgroup:'hamisi'};

function LessonsTab({lessons,groups,subjects,uniId,reload}:{
  lessons:Lesson[];groups:Group[];subjects:Subject[];uniId:string;reload:()=>void;
}) {
  const [form,setForm]=useState({...EL});
  const [saving,setSaving]=useState(false);
  const [delId,setDelId]=useState<string|null>(null);
  const [filt,setFilt]=useState('all');
  const s=(k:string,v:string)=>setForm(p=>({...p,[k]:v}));

  const add=async()=>{
    if(!form.group_id||!form.subject||!form.teacher)return;
    setSaving(true);
    await supabase.from('schedule_lessons').insert({...form,university_id:uniId});
    setForm({...EL});setSaving(false);reload();
  };

  const shown=filt==='all'?lessons:lessons.filter(l=>l.group_id===filt);

  return(
    <div>
      <SH title="Dərs Cədvəli" count={lessons.length}/>

      {/* Add form */}
      <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.07)',
        borderRadius:12,padding:18,marginBottom:22}}>
        <p style={{fontSize:'0.72rem',fontWeight:700,color:'rgba(255,255,255,0.4)',
          marginBottom:12,textTransform:'uppercase',letterSpacing:'0.08em'}}>
          Yeni Dərs
        </p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))',gap:10}}>
          <div><label style={lbl}>Qrup *</label>
            <select style={sel} value={form.group_id} onChange={e=>s('group_id',e.target.value)}>
              <option value="">Seçin</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select></div>
          <div><label style={lbl}>Gün *</label>
            <select style={sel} value={form.day} onChange={e=>s('day',e.target.value)}>
              {DAYS.map(d=><option key={d}>{d}</option>)}
            </select></div>
          <div><label style={lbl}>Vaxt *</label>
            <input style={inp} placeholder="08:00-09:30" value={form.time}
              onChange={e=>s('time',e.target.value)}/></div>
          <div><label style={lbl}>Fənn *</label>
            <select style={sel} value={form.subject} onChange={e=>s('subject',e.target.value)}>
              <option value="">Seçin</option>
              {subjects.map(sub=><option key={sub.id} value={sub.name}>{sub.name}</option>)}
            </select></div>
          <div><label style={lbl}>Müəllim *</label>
            <input style={inp} placeholder="A.B. Həsənov" value={form.teacher}
              onChange={e=>s('teacher',e.target.value)}/></div>
          <div><label style={lbl}>Otaq</label>
            <input style={inp} placeholder="310" value={form.room}
              onChange={e=>s('room',e.target.value)}/></div>
          <div><label style={lbl}>Həftə</label>
            <select style={sel} value={form.week} onChange={e=>s('week',e.target.value)}>
              <option value="hamisi">Hamısı</option>
              <option value="ust">Üst həftə</option>
              <option value="alt">Alt həftə</option>
            </select></div>
          <div><label style={lbl}>Yarımqrup</label>
            <select style={sel} value={form.subgroup} onChange={e=>s('subgroup',e.target.value)}>
              <option value="hamisi">Hamısı</option>
              <option value="1">1-ci yarımqrup</option>
              <option value="2">2-ci yarımqrup</option>
            </select></div>
        </div>
        <button onClick={add}
          disabled={saving||!form.group_id||!form.subject||!form.teacher}
          style={{...btn('#3b82f6'),marginTop:14,opacity:saving?0.6:1}}>
          {saving?'Əlavə edilir...':'+ Dərs Əlavə Et'}
        </button>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
        <button onClick={()=>setFilt('all')} style={btn(filt==='all'?'#3b82f6':'#6b7280',true)}>
          Hamısı ({lessons.length})
        </button>
        {groups.map(g=>(
          <button key={g.id} onClick={()=>setFilt(g.id)}
            style={btn(filt===g.id?'#3b82f6':'#6b7280',true)}>
            {g.name} ({lessons.filter(l=>l.group_id===g.id).length})
          </button>
        ))}
      </div>

      {shown.length===0?<Empty text="Dərs yoxdur"/>:(
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>
              {['Qrup','Gün','Vaxt','Fənn','Müəllim','Otaq','Həftə','Yqrup',''].map(h=>(
                <th key={h} style={{padding:'8px 10px',
                  background:'rgba(59,130,246,0.12)',
                  color:'rgba(255,255,255,0.6)',fontSize:'0.73rem',fontWeight:700,
                  textAlign:'left',border:'1px solid rgba(255,255,255,0.06)'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shown.map((l,i)=>(
                <tr key={l.id} style={{background:i%2===0?'rgba(255,255,255,0.015)':'transparent'}}>
                  {[groups.find(g=>g.id===l.group_id)?.name??'—',
                    l.day,l.time,l.subject,l.teacher,l.room,
                    l.week==='ust'?'Üst':l.week==='alt'?'Alt':'Hamısı',
                    l.subgroup==='hamisi'?'Hamısı':l.subgroup,
                  ].map((v,ci)=>(
                    <td key={ci} style={{padding:'7px 10px',fontSize:'0.79rem',
                      border:'1px solid rgba(255,255,255,0.05)',
                      color:'rgba(255,255,255,0.75)'}}>{v}</td>
                  ))}
                  <td style={{padding:'7px 10px',border:'1px solid rgba(255,255,255,0.05)'}}>
                    {delId===l.id?(
                      <span style={{display:'flex',gap:4}}>
                        <button style={btn('#ef4444',true)}
                          onClick={async()=>{await supabase.from('schedule_lessons').delete().eq('id',l.id);setDelId(null);reload();}}>
                          Bəli
                        </button>
                        <button style={btn('#6b7280',true)} onClick={()=>setDelId(null)}>Xeyr</button>
                      </span>
                    ):(
                      <button style={btn('#ef4444',true)} onClick={()=>setDelId(l.id)}>Sil</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Shared ── */
function SH({title,count}:{title:string;count:number}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:18}}>
      <h2 style={{fontSize:'1.05rem',fontWeight:700,margin:0}}>{title}</h2>
      <span style={{background:'rgba(59,130,246,0.15)',color:'#3b82f6',
        borderRadius:20,padding:'2px 9px',fontSize:'0.72rem',fontWeight:700}}>
        {count}
      </span>
    </div>
  );
}

type LRow={id:string;cells:string[];onDelete:()=>void};
function LT({headers,rows,delId,onConfirm,onCancel}:{
  headers:string[];rows:LRow[];delId:string|null;
  onConfirm:(id:string)=>void;onCancel:()=>void;
}){
  if(!rows.length)return<Empty text="Məlumat yoxdur"/>;
  return(
    <div style={{overflowX:'auto'}}>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr>
          {headers.map(h=>(
            <th key={h} style={{padding:'9px 12px',background:'rgba(59,130,246,0.12)',
              color:'rgba(255,255,255,0.6)',fontSize:'0.75rem',fontWeight:700,
              textAlign:'left',border:'1px solid rgba(255,255,255,0.07)'}}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={row.id} style={{background:i%2===0?'rgba(255,255,255,0.02)':'transparent'}}>
              {row.cells.map((c,ci)=>(
                <td key={ci} style={{padding:'9px 12px',fontSize:'0.84rem',
                  border:'1px solid rgba(255,255,255,0.05)',
                  color:'rgba(255,255,255,0.8)'}}>{c}</td>
              ))}
              <td style={{padding:'9px 12px',border:'1px solid rgba(255,255,255,0.05)'}}>
                {delId===row.id?(
                  <span style={{display:'flex',gap:5}}>
                    <button style={btn('#ef4444',true)} onClick={()=>onConfirm(row.id)}>Bəli, sil</button>
                    <button style={btn('#6b7280',true)} onClick={onCancel}>Xeyr</button>
                  </span>
                ):(
                  <button style={btn('#ef4444',true)} onClick={row.onDelete}>Sil</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty({text}:{text:string}){
  return(
    <div style={{textAlign:'center',padding:'44px 0',
      color:'rgba(255,255,255,0.22)',fontSize:'0.88rem'}}>
      {text}
    </div>
  );
}