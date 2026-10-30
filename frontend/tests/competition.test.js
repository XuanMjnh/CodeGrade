import test from 'node:test';
import assert from 'node:assert/strict';
import {competitionScope} from '../src/lib/competition.js';
test('same problem in different matches and rounds has a different scope',()=>{
 const room={id:'a',current:{id:'r1'}};
 assert.notEqual(competitionScope(room,null,'p'),competitionScope({...room,id:'b'},null,'p'));
 assert.notEqual(competitionScope(room,null,'p'),competitionScope({...room,current:{id:'r2'}},null,'p'));
 assert.equal(competitionScope(null,null,'p'),null);
});
test('contest drafts are isolated by contest and problem',()=>{
 assert.notEqual(competitionScope(null,'a','p'),competitionScope(null,'b','p'));
 assert.notEqual(competitionScope(null,'a','p'),competitionScope(null,'a','q'));
});
