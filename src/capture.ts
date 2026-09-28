// Uygulama çizilmeden önce sayfanın ham HTML'ini saklar. "Sunum dosyası" bu
// kopyaya veriyi gömerek üretilir; bu yüzden main.tsx'te ilk import olmalı.
// Veri yeri, kodun içinde geçemeyecek rastgele bir işaretle belirlenir.
declare global {
  interface Window {
    __APP_HTML__?: string;
    __APP_MARK__?: string;
  }
}

if (!document.getElementById('sa-data')) {
  const mark = `SA_DATA_${Math.random().toString(36).slice(2)}${Date.now()}`;
  const clone = document.documentElement.cloneNode(true) as HTMLElement;
  const root = clone.querySelector('#root');
  if (root?.parentNode) {
    root.parentNode.insertBefore(document.createComment(mark), root);
    window.__APP_HTML__ = '<!doctype html>\n' + clone.outerHTML;
    window.__APP_MARK__ = `<!--${mark}-->`;
  }
}

export {};
