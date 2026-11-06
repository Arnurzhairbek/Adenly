const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const base = process.env.TEST_API_URL;
let checks = 0;
const check = (name, fn) => { fn(); checks++; console.log(`PASS ${name}`); };
async function req(path, token, method='GET', body) {
  const response = await fetch(base + path, {method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,body:await response.json()};
}
async function main() {
  assert.equal(process.env.NODE_ENV,'test');assert.ok(base);
  const ids=[];let courseId;
  try {
    await pool.query(fs.readFileSync(require('node:path').join(__dirname,'../db/migration_add_user_errors.sql'),'utf8'));
    const password='Extended-test-123!';const hash=await bcrypt.hash(password,10);
    for (const role of ['user','admin']) {
      const row=(await pool.query('INSERT INTO users(email,password,name,role,is_verified) VALUES($1,$2,$3,$4,true) RETURNING id',[
        `extended-${crypto.randomUUID()}@example.com`,hash,`QA ${role}`,role])).rows[0];ids.push(row.id);
    }
    const [user,admin]=ids;
    const token=jwt.sign({id:user,role:'user',purpose:'access'},process.env.JWT_SECRET,{expiresIn:'1h'});
    const adminToken=jwt.sign({id:admin,role:'admin',purpose:'access'},process.env.JWT_SECRET,{expiresIn:'1h'});
    let r=await req('/api/auth/settings',token);
    check('settings empty object',()=>{assert.equal(r.status,200);assert.equal(typeof r.body,'object')});
    r=await req('/api/auth/settings',token,'PUT',{settings:{theme:'dark',language:'kk'}});
    check('save settings',()=>assert.equal(r.status,200));
    r=await req('/api/auth/settings',token);check('settings persisted',()=>assert.equal(r.body.theme,'dark'));
    r=await req('/api/auth/settings',token,'PUT',{});check('missing settings rejected',()=>assert.equal(r.status,400));
    r=await req('/api/auth/change-password',token,'POST',{});check('password input required',()=>assert.equal(r.status,400));
    r=await req('/api/auth/change-password',token,'POST',{currentPassword:password,newPassword:'x'});check('short password rejected',()=>assert.equal(r.status,400));
    r=await req('/api/auth/change-password',token,'POST',{currentPassword:'wrong',newPassword:'New-password-123!'});check('current password verified',()=>assert.equal(r.status,400));
    r=await req('/api/auth/change-password',token,'POST',{currentPassword:password,newPassword:'New-password-123!'});check('change password',()=>assert.equal(r.status,200));
    check('new password hash stored',()=>assert.notEqual((r.body||{}).password,'New-password-123!'));
    assert.ok(await bcrypt.compare('New-password-123!',(await pool.query('SELECT password FROM users WHERE id=$1',[user])).rows[0].password));
    r=await req('/api/auth/forgot-password',null,'POST',{});check('forgot requires email',()=>assert.equal(r.status,400));
    const email=(await pool.query('SELECT email FROM users WHERE id=$1',[user])).rows[0].email;
    r=await req('/api/auth/forgot-password',null,'POST',{email});check('forgot sends test mail',()=>assert.equal(r.status,200));
    const reset=jwt.sign({id:user,purpose:'reset-password'},process.env.JWT_SECRET,{expiresIn:'15m'});
    r=await req('/api/auth/reset-password/'+reset,null,'POST',{newPassword:'Reset-password-123!'});check('reset password purpose token',()=>assert.equal(r.status,200));
    assert.ok(await bcrypt.compare('Reset-password-123!',(await pool.query('SELECT password FROM users WHERE id=$1',[user])).rows[0].password));
    r=await req('/api/auth/reset-password/not-a-token',null,'POST',{newPassword:'Reset-password-123!'});check('invalid reset token rejected',()=>assert.equal(r.status,400));

    const course=(await pool.query("INSERT INTO courses(title,language_from,language_to) VALUES('QA isolated course','kk','en') RETURNING id")).rows[0];courseId=course.id;
    const lesson=(await pool.query("INSERT INTO lessons(course_id,title,content) VALUES($1,'QA lesson','Read this lesson') RETURNING id",[courseId])).rows[0];
    const test=(await pool.query("INSERT INTO tests(course_id,title,passing_score,max_attempts) VALUES($1,'QA test',70,3) RETURNING id",[courseId])).rows[0];
    const question=(await pool.query("INSERT INTO test_questions(test_id,question_text,points) VALUES($1,'Choose A',1) RETURNING id",[test.id])).rows[0];
    const answer=(await pool.query("INSERT INTO test_answers(question_id,answer_text,is_correct) VALUES($1,'A',true) RETURNING id",[question.id])).rows[0];
    r=await req('/api/achievements/'+user,token);check('initial achievements',()=>assert.equal(r.status,201));
    r=await req('/api/achievements/'+user,token);check('existing achievements',()=>assert.equal(r.body.xp,0));
    r=await req('/api/achievements/'+admin,token);check('foreign achievements forbidden',()=>assert.equal(r.status,403));
    r=await req('/api/progress',token,'POST',{lesson_id:lesson.id,completed:true});check('fixture progress',()=>assert.equal(r.status,201));
    r=await req('/api/progress/user/'+user+'?page=1&limit=1',token);check('paginated progress',()=>{assert.equal(r.status,200);assert.equal(r.body.pagination.total,1);assert.equal(r.body.data[0].lesson_id,lesson.id)});
    r=await req(`/api/progress/user/${user}/course/${courseId}`,token);check('course progress read',()=>assert.equal(r.status,200));
    r=await req('/api/leaderboard',token);check('leaderboard schema',()=>{assert.equal(r.status,200);assert.ok(Array.isArray(r.body))});
    r=await req('/api/tests/course/'+courseId,token);check('course tests',()=>{assert.equal(r.status,200);assert.equal(r.body[0].id,test.id)});
    r=await req(`/api/tests/${test.id}/start`,token);check('test start hides answer key',()=>{assert.equal(r.status,200);assert.equal(r.body.questions[0].answers[0].is_correct,undefined)});
    r=await req(`/api/tests/${test.id}/submit`,token,'POST',{responses:[{question_id:question.id,answer_id:answer.id}],time_taken:1});
    check('valid test grades and creates certificate',()=>{assert.equal(r.status,200);assert.equal(r.body.score,100);assert.equal(r.body.passed,true);assert.ok(r.body.certificate.id)});
    const attempt=r.body.attempt_id,certificate=r.body.certificate;
    r=await req(`/api/tests/attempts/${attempt}`,token);check('own attempt result',()=>{assert.equal(r.status,200);assert.equal(r.body.attempt.score,100);assert.equal(r.body.responses.length,1)});
    r=await req(`/api/tests/attempts/${attempt}`,adminToken);check('foreign attempt hidden',()=>assert.equal(r.status,404));
    r=await req(`/api/tests/${test.id}/attempts`,token);check('attempt history',()=>{assert.equal(r.status,200);assert.equal(r.body.length,1)});
    r=await req('/api/certificates/my',token);check('own certificates',()=>{assert.equal(r.status,200);assert.equal(r.body.length,1)});
    r=await req('/api/certificates/'+certificate.id,token);check('certificate details',()=>{assert.equal(r.status,200);assert.equal(r.body.user_id,user)});
    r=await req('/api/certificates/'+certificate.id,adminToken);check('foreign certificate hidden',()=>assert.equal(r.status,404));
    r=await req('/api/certificates/verify/'+certificate.certificate_number);check('public certificate verification',()=>{assert.equal(r.status,200);assert.equal(r.body.valid,true)});
    r=await req('/api/certificates/verify/missing');check('missing certificate invalid',()=>assert.equal(r.status,404));
    const pdf=await fetch(base+'/api/certificates/'+certificate.id+'/download',{headers:{Authorization:`Bearer ${token}`}});
    check('certificate PDF download',()=>assert.equal(pdf.status,200));
    assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');
    r=await req('/api/notifications',token);const note=r.body[0];assert.ok(note.id);
    r=await req('/api/notifications/'+note.id+'/read',token,'PUT');check('mark own notification read',()=>assert.equal(r.status,200));
    assert.equal((await pool.query('SELECT is_read FROM notifications WHERE id=$1',[note.id])).rows[0].is_read,true);

    r=await req('/api/feedback',token,'POST',{});check('feedback required fields',()=>assert.equal(r.status,400));
    r=await req('/api/feedback',token,'POST',{name:'QA',email,subject:'Test',message:'too short'});check('feedback minimum length',()=>assert.equal(r.status,400));
    r=await req('/api/feedback',token,'POST',{name:'QA',email:'invalid',subject:'Test',message:'A valid long test message'});check('feedback email format',()=>assert.equal(r.status,400));
    r=await req('/api/feedback',token,'POST',{name:'QA',email,subject:'Test',message:'A valid long test message'});check('feedback saved',()=>assert.equal(r.status,201));const feedback=r.body.id;
    r=await req('/api/feedback',token);check('feedback list admin-only',()=>assert.equal(r.status,403));
    r=await req('/api/feedback',adminToken);check('admin feedback list',()=>{assert.equal(r.status,200);assert.ok(r.body.some(f=>f.id===feedback))});
    r=await req('/api/feedback/'+feedback+'/status',adminToken,'PATCH',{status:'resolved'});check('admin feedback status',()=>{assert.equal(r.status,200);assert.equal(r.body.status,'resolved')});
    await pool.query('DELETE FROM feedback WHERE id=$1',[feedback]);

    r=await req('/api/ai-tutor/errors',token,'POST',{});check('AI error input required',()=>assert.equal(r.status,400));
    r=await req('/api/ai-tutor/errors',token,'POST',{error_type:'grammar',error_text:'I is',correct_text:'I am',course_id:courseId,lesson_id:lesson.id});check('learning error saved',()=>assert.equal(r.status,201));
    r=await req('/api/ai-tutor/analyze',token);check('learning analysis',()=>assert.equal(r.status,200));
    r=await req('/api/ai-tutor/recommendations',token);check('learning recommendations',()=>{assert.equal(r.status,200);assert.ok(Array.isArray(r.body.recommendations))});
    r=await req('/api/ai-conversation/start',token,'POST',{});check('conversation language required',()=>assert.equal(r.status,400));
    r=await req('/api/ai-conversation/start',token,'POST',{language:'english',topic:'travel'});check('local conversation start',()=>assert.equal(r.status,201));const conversation=r.body.conversationId;
    r=await req(`/api/ai-conversation/${conversation}/message`,token,'POST',{message:'Hello, I like travel.'});check('local fallback conversation reply',()=>{assert.equal(r.status,200);assert.ok(r.body.response.length>0)});
    r=await req(`/api/ai-conversation/${conversation}/message`,adminToken,'POST',{message:'Hello'});check('foreign conversation hidden',()=>assert.equal(r.status,404));
    r=await req(`/api/ai-conversation/${conversation}/message`,token,'POST',{message:' '});check('empty conversation message rejected',()=>assert.equal(r.status,400));
    r=await req(`/api/ai-conversation/${conversation}/end`,token,'POST');check('conversation end',()=>assert.equal(r.status,200));
    r=await req('/api/ai-conversation/history',token);check('conversation persisted in history',()=>{assert.equal(r.status,200);assert.ok(JSON.stringify(r.body).includes(String(conversation)))});
    console.log(`RESULT: ${checks} extended API checks passed. External SMTP/Groq are not exercised; SEC-01 remains a separate backlog item.`);
  } finally {
    if(courseId)await pool.query('DELETE FROM courses WHERE id=$1',[courseId]);
    if(ids.length)await pool.query('DELETE FROM users WHERE id=ANY($1::int[])',[ids]);
  }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>pool.end());
