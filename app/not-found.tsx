import Link from 'next/link.js';
import {Brand} from '@/components/ui/brand';
export default function NotFound(){return <main id="main" className="report-state"><Brand/><p className="eyebrow">404 / mimo radar</p><h1>Tuhle stránku jsme nenašli.</h1><p>Srovnání fondů je stále dostupné. K osobnímu reportu potřebujete platný přístup v původním prohlížeči.</p><Link className="secondary-button" href="/">Otevřít srovnání</Link></main>}
