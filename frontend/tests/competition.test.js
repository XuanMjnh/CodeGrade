import test from 'node:test';
import assert from 'node:assert/strict';
import {competitionScope,shouldClearSubmission} from '../src/lib/competition.js';
test('same problem in different matches and rounds has a different scope',()=>{
 const room={id:'a',current:{id:'r1'}};
 assert.notEqual(competitionScope(room,null,'p'),competitionScope({...room,id:'b'},null,'p'));
 assert.notEqual(competitionScope(room,null,'p'),competitionScope({...room,current:{id:'r2'}},null,'p'));
 assert.equal(competitionScope(null,null,'p'),null);
});
test('official ACK clears only the unchanged editor in its own competition',()=>{
 const op={type:'SUBMIT',scope:'contest:a:p',editVersion:3};
 assert.equal(shouldClearSubmission(op,{scope:op.scope,editVersion:3}),true);
 assert.equal(shouldClearSubmission(op,{scope:op.scope,editVersion:4}),false);
 assert.equal(shouldClearSubmission(op,{scope:'contest:b:p',editVersion:3}),false);
 assert.equal(shouldClearSubmission(op,{scope:null,editVersion:3}),false);
 for(const type of ['PRECHECK','RUN_EXAMPLES'])assert.equal(shouldClearSubmission({...op,type},{scope:op.scope,editVersion:3}),false);
});
