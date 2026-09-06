import { buildRows, toCsv } from '@/lib/directExport';
import { PROFESSIONS } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';
import fs from 'fs';
const o={professions:PROFESSIONS.map(p=>p.slug),cities:CITY_PAGES.map(c=>c.slug),budget:0,siteUrl:'',utm:true};
fs.writeFileSync('/tmp/k.txt','\uFEFF'+toCsv(buildRows(o),{bid:30}));
