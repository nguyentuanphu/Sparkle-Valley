import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => m.type() === 'error' && console.log('CON', m.text().slice(0, 300)));
await p.goto('http://localhost:8774/'); await p.waitForTimeout(12000); await b.close();
