#!/usr/bin/env node
/** Disposable local UI fixtures. Run from .local-playtest with the pinned CLI
 * and dedicated Colima DOCKER_HOST on PATH. Never accepts a remote URL/key. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile, chmod } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

assert.equal(process.env.ROOM_PLACEMENT_DISPOSABLE_DB, '1', 'Disposable local fixture authorization required');
const config = await readFile('supabase/config.toml', 'utf8');
assert.match(config, /^project_id = "cozy-v3-playtest"$/m, 'Use only the dedicated local playtest project');
const local = JSON.parse(execFileSync('supabase', ['status', '-o', 'json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const base = new URL(local.API_URL);
assert.ok(['127.0.0.1','[::1]'].includes(base.hostname) && base.protocol === 'http:' && !base.search);
const db = new URL(local.DB_URL);
assert.ok(['127.0.0.1','[::1]'].includes(db.hostname) && !db.search);
const options = { auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(url, init={})=>{
  assert.equal(new URL(String(url)).origin,base.origin,'Refusing non-local API origin');
  return fetch(url,{...init,redirect:'error',signal:init.signal??AbortSignal.timeout(20000)});
}}};
const admin = createClient(base.href,local.SERVICE_ROLE_KEY??local.SECRET_KEY,options);
const fixturePath=resolve('fixture.json');
async function checked(operation,label){const {data,error}=await operation;if(error)throw new Error(`${label}: ${error.code??'error'}`);return data;}
async function rpc(client,name,args){const d=await checked(client.rpc(name,args),name);return Array.isArray(d)?d[0]:d;}
async function save(value){await writeFile(fixturePath,JSON.stringify(value,null,2)+'\n',{mode:0o600});await chmod(fixturePath,0o600);}

if(process.argv.includes('--cleanup')){
  const f=JSON.parse(await readFile(fixturePath,'utf8'));
  assert.equal(f.project,'cozy-v3-playtest');assert.equal(f.apiUrl,base.href);
  const ids=f.users.map(u=>u.id);
  for(const u of f.users){const actual=await checked(admin.auth.admin.getUserById(u.id),'verify fixture user');assert.equal(actual.user.email,u.email);assert.ok(u.email.startsWith(f.tag));}
  const memberships=await checked(admin.from('house_memberships').select('house_id').in('profile_id',ids),'fixture memberships');
  const houses=[...new Set(memberships.map(m=>m.house_id))];
  if(houses.length){const occupants=await checked(admin.from('house_memberships').select('profile_id').in('house_id',houses),'fixture house boundary');assert.ok(occupants.every(m=>ids.includes(m.profile_id)),'Refusing cleanup of a house containing other users');}
  const remove=async(table,column,values)=>{if(values.length)await checked(admin.from(table).delete().in(column,values),`cleanup ${table}`);};
  await remove('room_placement_requests','profile_id',ids);
  await remove('room_placements','owned_item_id',f.items.map(i=>i.id));
  await remove('notification_events','house_id',houses);
  await remove('invite_acceptance_requests','profile_id',ids);
  await remove('invite_acceptances','profile_id',ids);
  await remove('house_create_requests','profile_id',ids);
  await remove('house_invites','house_id',houses);
  await remove('house_memberships','profile_id',ids);
  await remove('houses','id',houses);
  await remove('owned_items','id',f.items.map(i=>i.id));
  for(const id of ids)await checked(admin.auth.admin.deleteUser(id),'cleanup auth');
  f.cleaned=true;f.users=f.users.map(({password,...u})=>u);await save(f);
  console.log(JSON.stringify({cleaned:true,users:ids.length,houses:houses.length}));
}else{
  try{await readFile(fixturePath);throw new Error('Fixture file exists; clean or explicitly archive it before preparing another run');}catch(e){if(e.code!=='ENOENT')throw e;}
  const tag=`cozy-ui-${randomUUID()}`;
  const f={project:'cozy-v3-playtest',tag,apiUrl:base.href,publicKey:local.ANON_KEY??local.PUBLISHABLE_KEY,users:[],items:[],houseId:null};
  await save(f);
  for(const [index,name,species] of [[0,'검증 나래','cat'],[1,'검증 민준','rabbit']]){
    const email=`${tag}-${index}@example.invalid`,password=`A9!${randomUUID()}`;
    const created=await checked(admin.auth.admin.createUser({email,password,email_confirm:true}),'create fixture auth');
    const u={id:created.user.id,email,password};f.users.push(u);await save(f);
    const client=createClient(base.href,f.publicKey,options);
    await checked(client.auth.signInWithPassword({email,password}),'fixture sign-in');
    await rpc(client,'complete_onboarding',{p_display_name:name,p_point_color:index?'#88AAC0':'#DD9977',p_animal_name:index?'검증 보리':'검증 토리',p_species:species});
    if(index===0){f.houseId=(await rpc(client,'create_house',{p_name:'공동 배치 검증집',p_request_key:tag})).house_id;f.invite=(await rpc(client,'create_house_invite',{})).invite_token;}
    else await rpc(client,'accept_house_invite',{p_token:f.invite,p_request_key:tag});
    await client.auth.signOut({scope:'local'});await save(f);
  }
  f.items=[{id:randomUUID(),profile_id:f.users[0].id,item_definition_id:'cushion-shell',kind:'furniture',quantity:1},{id:randomUUID(),profile_id:f.users[0].id,item_definition_id:'cushion-star',kind:'furniture',quantity:1},{id:randomUUID(),profile_id:f.users[1].id,item_definition_id:'cushion-knot',kind:'furniture',quantity:1}];
  await save(f);await checked(admin.from('owned_items').insert(f.items),'fixture inventory');
  delete f.invite;await save(f);
  console.log(JSON.stringify({prepared:true,users:f.users.length,items:f.items.length,privateFixturePath:fixturePath}));
}
admin.realtime.disconnect();
