const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db/db');
const base = process.env.TEST_API_URL || 'http://127.0.0.1:5000';
let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log(`PASS ${name}`); };
async function request(route, method='GET', body, token) {
  const r = await fetch(base + route, {method, headers:{'Content-Type':'application/json', ...(token ? {Authorization:`Bearer ${token}`} : {})}, body:body === undefined ? undefined : JSON.stringify(body)});
  return {status:r.status, body:await r.json()};
}
async function main() {
  for(let i=0;i<60;i++) {
    try { if((await request('/health')).status===200) break; } catch {}
    await new Promise(resolve=>setTimeout(resolve,1000));
  }
  check('database readiness', ()=>{});
  assert.equal((await request('/health')).status,200);
  const email=`qa-${Date.now()}@example.com`, password='Qa-test-123!';
  let r=await request('/api/auth/register','POST',{email:'invalid',password,name:'QA'});
  check('invalid email rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/register','POST',{email,password});
  check('missing name rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/register','POST',{email,password,name:'QA User',role:'admin'});
  check('registration',()=>assert.equal(r.status,201));
  const user=(await pool.query('SELECT * FROM users WHERE email=$1',[email])).rows[0];
  check('public registration cannot assign admin',()=>assert.equal(user.role,'user'));
  check('password is hashed',()=>assert.notEqual(user.password,password));
  assert.equal(await bcrypt.compare(password,user.password),true);
  r=await request('/api/auth/register','POST',{email,password,name:'QA User'});
  check('duplicate email rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/login','POST',{email,password});
  check('unverified user cannot login',()=>assert.equal(r.status,403));
  const verification=jwt.sign({id:user.id,email,purpose:'verify-email'},process.env.JWT_SECRET,{expiresIn:'1d'});
  r=await request('/api/auth/me','GET',undefined,verification);
  check('verification token cannot authorize API',()=>assert.equal(r.status,401));
  r=await request(`/api/auth/verify-email/${verification}`);
  check('email verification endpoint',()=>assert.equal(r.status,200));
  r=await request('/api/auth/login','POST',{email,password:'wrong'});
  check('wrong password rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/login','POST',{email,password});
  check('JWT login',()=>assert.equal(r.status,200));
  const token=r.body.token;
  const claims=jwt.verify(token,process.env.JWT_SECRET);
  check('access token identity',()=>assert.equal(claims.id,user.id));
  r=await request('/api/auth/me','GET',undefined,token);
  check('own profile',()=>assert.equal(r.body.id,user.id));
  r=await request('/api/auth/me','PUT',{name:'Жаңартылған ат'});
  check('anonymous profile update rejected',()=>assert.equal(r.status,401));
  r=await request('/api/auth/me','PUT',{name:'   '},token);
  check('blank profile name rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/me','PUT',{name:42},token);
  check('non-text profile name rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/me','PUT',{name:'x'.repeat(101)},token);
  check('oversized profile name rejected',()=>assert.equal(r.status,400));
  r=await request('/api/auth/me','PUT',{name:'  Жаңартылған ат  ',role:'admin',email:'other@example.com',id:2147483647},token);
  check('profile update returns safe fields',()=>{assert.equal(r.status,200);assert.equal(r.body.name,'Жаңартылған ат');assert.equal(r.body.role,'user');assert.equal(r.body.email,email);assert.equal(r.body.id,user.id);assert.equal(r.body.password,undefined)});
  r=await request('/api/auth/me','GET',undefined,token);
  check('profile persists on reload',()=>assert.equal(r.body.name,'Жаңартылған ат'));
  r=await request('/api/progress/user/'+user.id);
  check('protected API without token',()=>assert.equal(r.status,401));
  const expired=jwt.sign({id:user.id,role:'user',purpose:'access'},process.env.JWT_SECRET,{expiresIn:-1});
  r=await request('/api/auth/me','GET',undefined,expired);
  check('expired token rejected',()=>assert.equal(r.status,401));
  r=await request('/api/courses','POST',{title:'Forbidden'});
  check('admin route requires authentication',()=>assert.equal(r.status,401));
  r=await request('/api/courses','POST',{title:'Forbidden'},token);
  check('ordinary user cannot create courses',()=>assert.equal(r.status,403));
  r=await request('/api/courses');
  check('seeded course list',()=>{assert.equal(r.status,200);assert.ok(r.body.length>0)});
  const course=r.body[0];
  r=await request('/api/courses/'+course.id+'/lessons');
  const canonicalLessons=r.body;
  check('canonical course lessons route',()=>{assert.equal(r.status,200);assert.ok(r.body.length>0)});
  r=await request('/api/courses/invalid/lessons');
  check('invalid course ID rejected',()=>assert.equal(r.status,400));
  r=await request('/api/courses/2147483647/lessons');
  check('missing course returns 404',()=>assert.equal(r.status,404));
  const emptyCourse=(await pool.query("INSERT INTO courses (title) VALUES ('QA empty course') RETURNING id")).rows[0];
  try {
    r=await request('/api/courses/'+emptyCourse.id+'/lessons');
    check('existing course without lessons returns empty list',()=>{assert.equal(r.status,200);assert.deepEqual(r.body,[])});
  } finally {
    await pool.query('DELETE FROM courses WHERE id=$1',[emptyCourse.id]);
  }
  r=await request('/api/lessons/course/'+course.id);
  check('legacy and canonical lessons agree',()=>assert.deepEqual(r.body,canonicalLessons));
  check('course lessons',()=>{assert.equal(r.status,200);assert.ok(r.body.length>0);assert.ok(r.body.every(l=>l.course_id===course.id))});
  const lesson=r.body[0];
  r=await request('/api/lessons/'+lesson.id);
  check('lesson content',()=>{assert.equal(r.status,200);assert.ok(r.body.content)});
  r=await request('/api/lessons/2147483647');
  check('missing lesson',()=>assert.equal(r.status,404));
  r=await request('/api/progress','POST',{lesson_id:lesson.id,completed:true,user_id:2147483647},token);
  check('progress belongs to authenticated user',()=>{assert.equal(r.status,201);assert.equal(r.body.user_id,user.id)});
  r=await request('/api/progress/user/2147483647','GET',undefined,token);
  check('other user progress protected',()=>assert.equal(r.status,403));
  r=await request('/api/notifications','GET',undefined,token);
  check('empty notifications',()=>{assert.equal(r.status,200);assert.deepEqual(r.body,[])});
  r=await request('/api/notifications','POST',{message:'QA',user_id:2147483647},token);
  check('notification created for self',()=>assert.equal(r.status,201));
  r=await request('/api/notifications','GET',undefined,token);
  check('notification persistence and ownership',()=>{assert.equal(r.body.length,1);assert.equal(r.body[0].user_id,user.id)});
  r=await request('/api/notifications','POST',{message:'QA'});
  check('anonymous notification write rejected',()=>assert.equal(r.status,401));
  await pool.query('DELETE FROM users WHERE id=$1',[user.id]);
  console.log(`RESULT: ${passed} checks passed. SMTP delivery and browser UI are not covered.`);
}
main().catch(err=>{console.error(err);process.exitCode=1}).finally(()=>pool.end());
