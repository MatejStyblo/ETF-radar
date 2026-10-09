"use client";
import Link from 'next/link';
export default function ErrorPage({reset}:{error:Error&{digest?:string};reset:()=>void}){return <main id="main" className="report-state"><p className="eyebrow">ETF Radar / chyba načtení</p><h1>Teď se to nepodařilo načíst.</h1><p>Zkuste stránku načíst znovu. Pokud jste právě odeslali formulář, chyba sama neznamená, že se pokus neuložil. Neposíláme report emailem.</p><button className="secondary-button" onClick={reset}>Zkusit znovu</button><Link href="/">Zpět ke srovnání</Link></main>}
