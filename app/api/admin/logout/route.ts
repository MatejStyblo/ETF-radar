import { NextResponse } from 'next/server';
import { dashboardLoginAvailable, dashboardCookie } from '@/lib/dashboard/auth';
import { checkOrigin } from '@/lib/security/http';
export async function POST(request: Request) {
 if (!dashboardLoginAvailable(request.headers)) return new Response('Not found',{status:404});
 try { checkOrigin(request); } catch { return new Response('Forbidden',{status:403}); }
 const response = NextResponse.redirect(new URL('/dashboard/login', process.env.APP_ORIGIN),303);
 response.headers.set('Cache-Control','private, no-store');
 response.cookies.set(dashboardCookie,'',{httpOnly:true,secure:true,sameSite:'strict',path:'/dashboard',maxAge:0});
 return response;
}
