import 'server-only';
export class BodyTooLarge extends Error {}
export async function readLimitedBody(request:Request,maxBytes:number):Promise<Uint8Array<ArrayBuffer>> {
  if(Number(request.headers.get('content-length'))>maxBytes)throw new BodyTooLarge();
  const reader=request.body?.getReader();
  if(!reader)return new Uint8Array();
  const parts:Uint8Array[]=[];let total=0;
  try {
    while(true){
      const {done,value}=await reader.read();if(done)break;
      total+=value.byteLength;
      if(total>maxBytes){await reader.cancel();throw new BodyTooLarge();}
      parts.push(value);
    }
  } finally {reader.releaseLock();}
  const bytes=new Uint8Array(total);let offset=0;
  for(const part of parts){bytes.set(part,offset);offset+=part.length;}
  return bytes;
}
