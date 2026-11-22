import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadProfile,rememberProfile} from '../public/profile.js';
const first='11111111-1111-4111-8111-111111111111';
const second='22222222-2222-4222-8222-222222222222';
function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};}
test('nickname and visitor ID survive a new page load',()=>{
 const storage=memoryStorage(),profile=loadProfile(storage,()=>first);
 assert.equal(profile.visitorId,first);profile.nickname='小雨';assert.ok(rememberProfile(storage,profile));
 assert.deepEqual(loadProfile(storage,()=>second),{visitorId:first,nickname:'小雨',persistent:true});
});
test('blocked storage keeps the current session usable',()=>{
 const storage={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 assert.deepEqual(loadProfile(storage,()=>first),{visitorId:first,nickname:'',persistent:false});
});
test('malformed saved data recovers with a new visitor ID',()=>{
 const storage=memoryStorage();storage.setItem('feedback.visitor.v1','invalid json');
 assert.equal(loadProfile(storage,()=>first).visitorId,first);
 storage.setItem('feedback.visitor.v1',JSON.stringify({visitorId:'not-a-uuid',nickname:42}));
 assert.deepEqual(loadProfile(storage,()=>second),{visitorId:second,nickname:'',persistent:true});
});
