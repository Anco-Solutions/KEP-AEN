import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
export const supabase=createClient('https://yblvmtaxorbdctvrpqer.supabase.co','sb_publishable_g5YEf2H_2yWoDM1DOzKtQw_qsCvc6ty');
export async function requireUser(role=null){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session){location.href='index.html';return null;}
  const {data,error}=await supabase.from('profiles').select('id,full_name,email,role,active').eq('id',session.user.id).single();
  if(error||!data?.active||!['admin','teacher'].includes(data.role)||(role&&data.role!==role)){
    await supabase.auth.signOut(); location.href='index.html'; return null;
  }
  return data;
}
export function footer(){return '<footer class="site-footer">© 2026 <span class="author">Tassos Ballas</span> · All rights reserved.</footer>';}
export function nav(profile){return '<nav class="app-nav"><a href="index.html">🏠 Νέα Εξέταση</a><a href="archive.html">📁 Αρχείο Εξετάσεων</a>'+(profile.role==='admin'?'<a href="teachers.html">👥 Καθηγητές</a><a href="audit.html">🕘 Ιστορικό</a>':'')+'<button id="logout" class="btn btn-secondary">Αποσύνδεση</button></nav>'}
export function wireLogout(){document.getElementById('logout')?.addEventListener('click',async()=>{await supabase.auth.signOut();location.href='index.html';});}
