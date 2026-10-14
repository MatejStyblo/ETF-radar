'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function DashboardLogoutButton() {
 const router=useRouter();
 const [pending,setPending]=useState(false);
 const [failed,setFailed]=useState(false);
 return <div><button type="button" disabled={pending} onClick={async()=>{
  if(pending)return;setPending(true);setFailed(false);
  try {
   const response=await fetch('/api/admin/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
   if(!response.ok)throw new Error('Logout unavailable');
   router.replace('/dashboard/login');router.refresh();
  }catch{setFailed(true);}finally{setPending(false);}
 }}>{pending?'Odhlašuji…':'Odhlásit'}</button>{failed&&<p role="alert">Odhlášení se nezdařilo. Zkuste to znovu.</p>}</div>;
}
