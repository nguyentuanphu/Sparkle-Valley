// (r89) printing a page for a grown-up: the play report (js/report.ts) and the certificate card (js/parents.ts).
// An app opened from the Home Screen ignores print() on iPhone and iPad, so there the page is made into a one-page PDF on
// the device and handed to the share sheet (Print, Save to Files, Mail); a browser that cannot share files saves it.
// Everywhere else the browser's own print window opens.

// an app started from the Home Screen (iOS only marks it with navigator.standalone; others with the display mode)
export const homeScreenApp = () => ('standalone' in navigator && navigator.standalone === true) || ['standalone', 'fullscreen'].some(d => matchMedia(`(display-mode: ${d})`).matches) && /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1;

/** a one-page A4 PDF showing one JPEG picture filling the page (the smallest valid file: catalogue, pages, page,
 *  picture, drawing); `landscape` turns the page on its side */
export function pdfOf(jpeg: Uint8Array, w: number, h: number, landscape = false): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder(), parts: Uint8Array[] = [], offs: number[] = []; let len = 0;
  const put = (b: Uint8Array | string) => { const u = typeof b === 'string' ? enc.encode(b) : b; parts.push(u); len += u.length; };
  const [pw, ph] = landscape ? [842, 595] : [595, 842], draw = `q ${pw} 0 0 ${ph} 0 0 cm /Im Do Q`;
  put('%PDF-1.4\n');
  const obj = (n: number, body: (string | Uint8Array)[]) => { offs[n] = len; put(`${n} 0 obj\n`); body.forEach(put); put('\nendobj\n'); };
  obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
  obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
  obj(3, [`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im 4 0 R >> >> /Contents 5 0 R >>`]);
  obj(4, [`<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`, jpeg, '\nendstream']);
  obj(5, [`<< /Length ${draw.length} >>\nstream\n${draw}\nendstream`]);
  const xref = len; put(`xref\n0 6\n0000000000 65535 f \n${[1, 2, 3, 4, 5].map(n => String(offs[n]).padStart(10, '0') + ' 00000 n \n').join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  const out = new Uint8Array(len); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out;
}

/** a canvas as JPEG bytes (white behind anything see-through) */
export function jpegOf(c: HTMLCanvasElement, q = .92): Uint8Array {
  return Uint8Array.from(atob(c.toDataURL('image/jpeg', q).split(',')[1]), ch => ch.charCodeAt(0));
}

/** hand a PDF to the share sheet, or save it where sharing files is not possible */
export async function sharePDF(bytes: Uint8Array<ArrayBuffer>, name: string): Promise<void> {
  const file = new File([bytes], name, { type: 'application/pdf' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: name }); return; } } catch (e) { if (e instanceof DOMException && e.name === 'AbortError') return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

/** print one picture on its own A4 page (landscape or portrait) with the browser's print window: a frame of its own
 *  holds just the picture, so nothing of the game is printed */
export function printPicture(src: string, landscape: boolean): Promise<void> {
  return new Promise(done => {
    const f = document.createElement('iframe'); f.className = 'printframe'; f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    f.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>@page{size:A4 ${landscape ? 'landscape' : 'portrait'};margin:8mm}html,body{margin:0;height:100%}body{display:flex;align-items:center;justify-content:center}img{max-width:100%;max-height:100%}</style></head><body><img alt=""></body></html>`;
    f.onload = () => {
      const img = f.contentDocument?.querySelector('img'), w = f.contentWindow;
      if (!img || !w) { f.remove(); done(); return; }
      img.onload = () => { w.focus(); w.print(); setTimeout(() => f.remove(), 1000); done(); };
      img.onerror = () => { f.remove(); done(); };
      img.src = src;
    };
    document.body.appendChild(f);
  });
}
