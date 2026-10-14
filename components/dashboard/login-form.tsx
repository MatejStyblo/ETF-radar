'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function DashboardLoginForm() {
 const router = useRouter();
 const [key,setKey] = useState('');
 const [pending,setPending] = useState(false);
 const [error,setError] = useState('');
 return <form onSubmit={async event=>{
  event.preventDefault();if(pending)return;setPending(true);setError('');
  try {
   const response=await fetch('/api/admin/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key})});
   const result=await response.json();
   if(response.ok&&result.ok===true){setKey('');router.replace('/dashboard');router.refresh();return;}
   setError(typeof result.message==='string'?result.message:'Přihlášení se nezdařilo.');
  } catch {setError('Spojení se nezdařilo. Zkuste to znovu.');}
  finally {setPending(false);}
 }} aria-busy={pending}>
  <label htmlFor="dashboard-key">Heslo</label>
  <input id="dashboard-key" type="password" required autoComplete="current-password" value={key} onChange={event=>setKey(event.target.value)} aria-describedby={error?'dashboard-login-error':undefined} aria-invalid={Boolean(error)}/>
  {error&&<p id="dashboard-login-error" role="alert">{error}</p>}
  <button className="primary-button" disabled={pending} type="submit">{pending?'Přihlašuji…':'Otevřít dashboard'}</button>
 </form>;
}
