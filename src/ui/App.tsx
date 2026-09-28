import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import logo from '../assets/logo.png';
import { buildPresentationHtml, canBuildPresentation, downloadFile, isValidData, readFileText, todayStamp } from '../domain/io';
import { sampleData } from '../domain/sample';
import { BACKUP_REMIND_AFTER, useStore } from '../store';
import { Toast } from './common';
import { EntryPage } from './pages/EntryPage';
import { ExamsPage } from './pages/ExamsPage';
import { ReportPage } from './pages/ReportPage';
import { StudentsPage } from './pages/StudentsPage';
import { Presentation } from './Presentation';

type Tab = 'students' | 'exams' | 'entry' | 'report';
const TABS: { id: Tab; label: string }[] = [
  { id: 'students', label: '👩‍🎓 Öğrenciler' },
  { id: 'exams', label: '📝 Sınavlar' },
  { id: 'entry', label: '✏️ Sonuç girişi' },
  { id: 'report', label: '📊 Karne' },
];

export default function App() {
  const store = useStore();
  const { data, readOnly, changesSinceBackup, replaceAll, markBackedUp } = store;
  const [tab, setTab] = useState<Tab>('students');
  const [examId, setExamId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState<{ studentId: string | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sunum dosyasından açıldı: yalnız sunum, düzenleme yok.
  if (readOnly) return <Presentation data={data} />;

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 2800);
  };

  const backup = () => {
    downloadFile(`sinav-analiz-yedek-${todayStamp()}.json`, JSON.stringify(data, null, 2), 'application/json');
    markBackedUp();
    flash('Yedek indirildi ✔ Dosyayı güvenli bir yerde saklayın.');
  };

  const restore = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await readFileText(file));
      if (!isValidData(parsed)) throw new Error();
      if (!confirm(`Yedekteki ${parsed.students.length} öğrenci ve ${parsed.exams.length} sınav yüklenecek. Mevcut veriler bununla DEĞİŞTİRİLECEK. Devam?`)) return;
      replaceAll(parsed);
      flash('Yedek yüklendi ✔');
    } catch {
      alert('Bu dosya geçerli bir Sınav Analiz yedeği değil.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const exportPresentation = () => {
    if (!canBuildPresentation()) {
      alert('Sunum dosyası yalnız yayındaki (derlenmiş) sürümde üretilebilir. Geliştirme önizlemesinde bu özellik kapalı.');
      return;
    }
    downloadFile(`Sunum-${todayStamp()}.html`, buildPresentationHtml(data), 'text/html');
    flash('Sunum dosyası indirildi ✔ USB belleğe kopyalayıp tahtada açın.');
  };

  const loadSample = () => {
    if (data.students.length && !confirm('Örnek veri mevcut verilerin yerine geçecek. Devam?')) return;
    replaceAll(sampleData());
    flash('Örnek veri yüklendi — Karne sekmesine göz atın!');
  };

  const isEmpty = !data.students.length && !data.exams.length;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img src={logo} alt="Kültür Okulları" />
            <div className="brand-text">
              <b>Sınav Analiz</b>
              <span>Danışan öğrenci gelişim paneli</span>
            </div>
          </div>
          <nav className="tabs">
            {TABS.map((t) => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {tab === t.id && <motion.div layoutId="tab-bg" className="tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="topbar-actions">
            <button className="btn small on-dark" onClick={backup} title="Tüm verileri JSON dosyası olarak indir">
              💾 Yedek al
            </button>
            <button className="btn small on-dark" onClick={() => fileRef.current?.click()} title="Yedek dosyasından geri yükle">
              📂 Yedek yükle
            </button>
            <button className="btn small on-dark" onClick={exportPresentation} title="USB için tek dosyalık sunum">
              💽 Sunum dosyası
            </button>
            <button className="btn small orange" onClick={() => setPresenting({ studentId: null })}>
              ▶ Sunumu başlat
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => restore(e.target.files?.[0])} />
          </div>
        </div>
      </header>

      {changesSinceBackup >= BACKUP_REMIND_AFTER && (
        <div className="banner">
          ⚠️ Son yedekten beri {changesSinceBackup} değişiklik yapıldı. Veriler yalnız bu tarayıcıda duruyor — yedek almayı unutmayın.
          <button className="btn small orange" onClick={backup}>
            💾 Şimdi yedek al
          </button>
        </div>
      )}

      {isEmpty && (
        <div className="page" style={{ paddingBottom: 0 }}>
          <motion.div className="card empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2>Hoş geldiniz 👋</h2>
            <p>
              Öğrencilerinizi ve denemeleri ekleyip sonuçları girin; her öğrencinin gelişimi hareketli bir karneye dönüşsün. Önce nasıl göründüğüne bakmak isterseniz
              örnek veriyle deneyebilirsiniz.
            </p>
            <div className="row">
              <button className="btn primary" onClick={() => setTab('students')}>
                ＋ Öğrenci ekleyerek başla
              </button>
              <button className="btn orange" onClick={loadSample}>
                ✨ Örnek veriyle dene
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                📂 Yedekten yükle
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {tab === 'students' ? (
        <StudentsPage
          onOpenReport={(id) => {
            setStudentId(id);
            setTab('report');
          }}
        />
      ) : tab === 'exams' ? (
        <ExamsPage
          onEnter={(id) => {
            setExamId(id);
            setTab('entry');
          }}
        />
      ) : tab === 'entry' ? (
        <EntryPage examId={examId} onExamChange={setExamId} />
      ) : (
        <ReportPage data={data} studentId={studentId} onStudentChange={setStudentId} onPresent={(id) => setPresenting({ studentId: id })} />
      )}

      {presenting && <Presentation data={data} initialStudentId={presenting.studentId} onExit={() => setPresenting(null)} />}
      <Toast message={toast} />
    </>
  );
}
