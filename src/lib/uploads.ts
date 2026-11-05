export const MATERIAL_BUCKET=process.env.NEXT_PUBLIC_MATERIALS_BUCKET || 'Materials';
export const MAX_MATERIAL_BYTES=4*1024*1024;
export const materialSubjectPrefix=(subject:string)=>encodeURIComponent(subject.slice(0,150)).replace(/%/g,'').replace(/[^a-zA-Z0-9_-]/g,'');
export function materialDisplayName(name:string,prefix=''):string {
  const suffix=prefix&&name.startsWith(prefix+'_')?name.slice(prefix.length+1):name;
  return suffix.replace(/^\d+_/,'').replace(/^[a-f0-9-]{36}_/i,'');
}
const extensions:Record<string,string>={
  'image/png':'png','image/jpeg':'jpg','image/webp':'webp','application/pdf':'pdf',
  'application/msword':'doc','application/vnd.ms-excel':'xls','application/vnd.ms-powerpoint':'ppt',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':'pptx',
};
export function validateUpload(mime:string,bytes:Uint8Array,avatar=false):string {
  const ext=extensions[mime];
  if (!ext || (avatar&&!mime.startsWith('image/')) || !bytes.length || bytes.length>(avatar?2*1024*1024:MAX_MATERIAL_BYTES))
    throw new Error('Fayl tipi və ya ölçüsü uyğun deyil.');
  const starts=(values:number[])=>values.every((v,i)=>bytes[i]===v);
  const ascii=(offset:number,length:number)=>String.fromCharCode(...bytes.slice(offset,offset+length));
  const valid=ext==='png'?starts([137,80,78,71,13,10,26,10]):ext==='jpg'?starts([255,216,255]):
    ext==='webp'?ascii(0,4)==='RIFF'&&ascii(8,4)==='WEBP':ext==='pdf'?ascii(0,5)==='%PDF-':
    ['doc','xls','ppt'].includes(ext)?starts([208,207,17,224,161,177,26,225]):starts([80,75,3,4]);
  if (!valid) throw new Error('Fayl məzmunu formatına uyğun deyil.');
  return ext;
}
