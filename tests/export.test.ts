import test from 'node:test';
import assert from 'node:assert/strict';
import {exportToPDF,exportToExcel} from '../src/lib/exportSchedule';
const row={day:'Şənbə',time:'09:00-10:30',subject:'<img src=x onerror=alert(1)>',teacher:'=CMD()',room:'101',group:'Ə24',week:'hamisi',subgroup:'ust'};
test('actual print output escapes every user field, includes Saturday, and reports blocked popups',()=>{
  let html='';
  const popup={opener:{},document:{write:(value:string)=>{html=value;},close:()=>{}},focus:()=>{},print:()=>{},onload:null};
  Object.defineProperty(globalThis,'window',{configurable:true,value:{open:()=>popup}});
  try {
    exportToPDF([row],'<script>alert(1)</script>');
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.ok(html.includes('Şənbə'));assert.ok(!html.includes('<script>'));assert.equal(popup.opener,null);
    Object.defineProperty(globalThis,'window',{configurable:true,value:{open:()=>null}});
    assert.throws(()=>exportToPDF([row]),/bloklandı/);
  } finally {Reflect.deleteProperty(globalThis,'window');}
});
test('actual CSV export has UTF-8 BOM, safe filename and formula-neutralized cells',async()=>{
  let output:Blob|null=null;
  const link={href:'',download:'',click:()=>{}};
  const original=URL.createObjectURL;
  URL.createObjectURL=(blob:Blob)=>{output=blob;return 'blob:test';};
  Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>link}});
  try {
    await exportToExcel([row],'../Çədvəl');
    const bytes=new Uint8Array(await (output as unknown as Blob).arrayBuffer());
    assert.deepEqual([...bytes.slice(0,3)],[239,187,191]);
    const content=await (output as unknown as Blob).text();
    assert.ok(content.includes('"\'=CMD()"'));assert.ok(content.includes('Ə24'));
    assert.equal(link.download,'.._Çədvəl.csv');
  } finally {URL.createObjectURL=original;Reflect.deleteProperty(globalThis,'document');}
});
