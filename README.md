# Sınav Analiz · Kültür Okulları

Danışan öğrencilerin TYT / AYT deneme sonuçlarını girip, her öğrencinin gelişimini hareketli bir karneyle akıllı tahtada gösteren panel. **Tek bir HTML dosyası** olarak çalışır: kurulum, sunucu ya da internet gerektirmez.

## Nasıl kullanılır?

### Evde: veri girişi
1. Siteyi açın (Vercel adresi) ya da `index.html` dosyasını tarayıcıda açın.
2. **Öğrenciler** sekmesinden öğrenci ekleyin: ad, numara, şube (ör. `12 A`, `12 SAY-4`), alan ve hedef netler.
3. **Sınavlar** sekmesinden deneme ekleyin. Tür seçince dersler ve soru sayıları ÖSYM düzeninde gelir; gerekirse değiştirebilirsiniz.
4. **Sonuç girişi** sekmesinde her ders için **D** ve **Y** yazın. Boş ve net kendiliğinden hesaplanır (4 yanlış 1 doğruyu götürür). Hücreler arasında Tab ile sağa, Enter ile alta geçilir.
5. **Karne** sekmesinden önizleme yapın.

> Veriler **yalnız o bilgisayardaki tarayıcıda** saklanır. Düzenli olarak **💾 Yedek al** ile JSON yedeği indirin. Başka bir bilgisayara geçerken **📂 Yedek yükle** kullanılır.

### Okulda: tahtada sunum
1. **💽 Sunum dosyası** butonuna basın. `Sunum-YYYY-AA-GG.html` dosyası iner.
2. Dosyayı USB belleğe kopyalayın.
3. Tahtada dosyaya çift tıklayın; internet gerekmez.
4. Sol alttaki **☰** düğmesi (ya da **Boşluk** tuşu) öğrenci listesini açar. Seçince liste kapanır ve ekranda **yalnız o öğrenci** görünür.

| Tuş | İşlev |
| --- | --- |
| Boşluk / O | Öğrenci seçiciyi aç / kapat |
| R | Animasyonları tekrar oynat |
| F | Tam ekran |
| Esc | Seçiciyi kapat |

Sağ üstteki düğmelerle animasyonlar kapatılabilir (yavaş tahtalar için). Sunum dosyası salt okunurdur; düzenleme yalnız panelde yapılır.

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # hesap motoru testleri
npm run build      # dist/index.html — tek dosya
```

Vercel: Framework **Vite**, build `npm run build`, çıktı klasörü `dist`.
