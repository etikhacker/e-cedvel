import test from 'node:test';
import assert from 'node:assert/strict';
import {findConflicts,timeRange,filterSchedule,academicWeek} from '../src/lib/scheduling';
const base={id:'one',group_id:'group1',university_id:'uni1',day:'Şənbə',time:'09:00-10:30',teacher:'Əli Əliyev',room:'101',week:'hamisi',subgroup:'ust'};
test('partial overlap catches room and teacher across distinct subgroups/groups',()=>{
  const result=findConflicts({...base,id:'two',group_id:'group2',time:'10:00-11:30',subgroup:'alt'},[base]);
  assert.deepEqual(result.map(x=>x.type),['teacher','room']);
});
test('group overlap includes full group, excludes disjoint subgroups',()=>{
  assert.ok(findConflicts({...base,id:'two',teacher:'B',room:'102',subgroup:'hamisi'},[base]).some(c=>c.type==='group'));
  assert.deepEqual(findConflicts({...base,id:'two',teacher:'B',room:'102',subgroup:'alt'},[base]),[]);
});
test('different universities, disjoint weeks and adjacent times do not conflict',()=>{
  for(const extra of [{university_id:'uni2'},{time:'10:30-12:00'},{week:'alt'}]) {
    assert.deepEqual(findConflicts({...base,id:'two',...extra},[{...base,week:'ust'}]),[]);
  }
});
test('same row is excluded and resource whitespace is normalized',()=>{
  assert.deepEqual(findConflicts(base,[base]),[]);
  assert.ok(findConflicts({...base,id:'two',teacher:'  Əli   Əliyev  '},[base]).some(c=>c.type==='teacher'));
});
test('invalid and inverted ranges rejected',()=>{
  for(const v of ['24:00-25:00','10:30-09:00','09:00-09:00','9:00-10:00','x'])assert.throws(()=>timeRange(v));
});
test('empty and Saturday schedules, subgroup and week selection',()=>{
  assert.deepEqual(filterSchedule([], 'ust','alt'),[]);
  const rows=[base,{...base,id:'two',subgroup:'hamisi',week:'alt',time:'08:00-09:00'},{...base,id:'three',subgroup:'alt'}];
  assert.deepEqual(filterSchedule(rows,'ust','alt').map(x=>x.id),['two','one']);
});
test('academic weeks use configured Baku date, missing semester stays unknown',()=>{
  assert.equal(academicWeek(null),null);
  assert.equal(academicWeek('2026-09-14','ust',new Date('2026-09-20T20:00:00Z')),'alt');
  assert.equal(academicWeek('2026-09-14','alt',new Date('2026-09-14T00:00:00Z')),'alt');
  assert.equal(academicWeek('2026-09-14','ust',new Date('2026-09-01T00:00:00Z')),null);
});
