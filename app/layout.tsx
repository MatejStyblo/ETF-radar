import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'ETF Radar — náklady v souvislostech',description:'Porovnejte průběžné náklady ETF na hlavním NYSE. Odlišné indexy, transparentní nákladový model. Vlastní modelová investice, ověřitelné zdroje a osobní srovnání.',openGraph:{title:'ETF Radar — fondy na NYSE, náklady v souvislostech',description:'Malý roční poplatek. Jaký rozdíl udělá za 20 let?',locale:'cs_CZ',type:'website'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="cs"><body><a className="skip-link" href="#main">Přejít na obsah</a>{children}</body></html>}
