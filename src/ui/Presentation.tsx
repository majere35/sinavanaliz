import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import logo from '../assets/logo.png';
import { fieldLabel } from '../domain/exams';
import type { AppData } from '../domain/types';
import { GroupBoard } from './GroupBoard';
import { RaceBoard } from './RaceBoard';
import { ReportCard } from './ReportCard';
import { Shapes } from './Shapes';
import { avatarColor, groupBy, initials } from './util';

const PREF_KEY = 'sinav-analiz-animasyon-kapali';

function loadReduce(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) === '1';
  } catch {
    return false;
  }
}

export type Scene = { kind: 'welcome' } | { kind: 'student'; id: string } | { kind: 'group' } | { kind: 'race' };

interface Props {
  data: AppData;
  /** Panelden açıldıysa çıkış; sunum dosyasında yok. */
  onExit?: () => void;
  initial?: Scene;
}

export function Presentation({ data, onExit, initial = { kind: 'welcome' } }: Props) {
  const [scene, setScene] = useState<Scene>(initial);
  const [picker, setPicker] = useState(false);
  const [replay, setReplay] = useState(0);
  const [reduce, setReduce] = useState(loadReduce);
  const student = scene.kind === 'student' ? data.students.find((s) => s.id === scene.id) ?? null : null;
  const sceneKey = scene.kind === 'student' ? `s-${scene.id}` : scene.kind;

  const choose = (next: Scene) => {
    setPicker(false);
    setScene(next);
    setReplay((r) => r + 1);
  };

  const toggleReduce = () => {
    setReduce((v) => {
      try {
        localStorage.setItem(PREF_KEY, v ? '0' : '1');
      } catch {
        /* yoksay */
      }
      return !v;
    });
  };

  const toggleFullscreen = useCallback(() => {
    const d = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (document.fullscreenElement || d.webkitFullscreenElement) {
      (document.exitFullscreen?.bind(document) ?? d.webkitExitFullscreen)?.();
    } else {
      (el.requestFullscreen?.bind(el) ?? el.webkitRequestFullscreen)?.();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPicker(false);
      else if (e.key === ' ' || e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setPicker((p) => !p);
      } else if (e.key.toLowerCase() === 'r') setReplay((r) => r + 1);
      else if (e.key.toLowerCase() === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleFullscreen]);

  const groups = groupBy(data.students.slice().sort((a, b) => a.name.localeCompare(b.name, 'tr')), (s) => s.section || 'Şubesiz');

  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
      <div className={`present stage ${reduce ? 'reduce-motion' : ''}`}>
        <Shapes />

        <AnimatePresence mode="wait">
          {scene.kind !== 'welcome' && (student || scene.kind !== 'student') ? (
            <motion.div key={`${sceneKey}-${replay}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {student ? <ReportCard data={data} student={student} /> : scene.kind === 'group' ? <GroupBoard data={data} /> : <RaceBoard data={data} />}
            </motion.div>
          ) : (
            <motion.div key={`welcome-${replay}`} className="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.img
                src={logo}
                alt="Özel Bursa Kültür Okulları"
                initial={{ scale: 0.6, opacity: 0, filter: 'brightness(3)' }}
                animate={{ scale: 1, opacity: 1, filter: 'brightness(1)' }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.h1 initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.7 }}>
                Gelişim <em>Yolculuğu</em>
              </motion.h1>
              <motion.p initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.7 }}>
                TYT · AYT deneme analizi — Bademli Kampüsü
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Perde geçişi: öğrenci değişince ekranı turuncu-mavi bir şerit süpürür */}
        <AnimatePresence>
          {scene.kind !== 'welcome' && !reduce && (
            <motion.div
              key={`wipe-${sceneKey}-${replay}`}
              style={{ position: 'fixed', inset: 0, zIndex: 65, background: 'linear-gradient(100deg, #f07a2b, #3b38a6)', pointerEvents: 'none' }}
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.3, 1] }}
            />
          )}
        </AnimatePresence>

        <div className="present-controls">
          {scene.kind !== 'welcome' && (
            <button className="btn small on-dark" onClick={() => setReplay((r) => r + 1)} title="Animasyonları baştan oynat (R)">
              ↻ Tekrar oynat
            </button>
          )}
          <button className="btn small on-dark" onClick={toggleReduce} title="Animasyonları aç/kapat">
            {reduce ? '✨ Animasyon aç' : '⏸ Animasyon kapat'}
          </button>
          <button className="btn small on-dark" onClick={toggleFullscreen} title="Tam ekran (F)">
            ⛶ Tam ekran
          </button>
          {onExit && (
            <button className="btn small on-dark" onClick={onExit}>
              ✕ Panele dön
            </button>
          )}
        </div>

        <button className="picker-btn" onClick={() => setPicker(true)} title="Öğrenci seç (Boşluk)" aria-label="Öğrenci seç">
          ☰
        </button>

        <AnimatePresence>
          {picker && (
            <motion.div className="curtain" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPicker(false)}>
              <motion.div
                className="picker"
                initial={{ y: 30, scale: 0.97 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Ne gösterelim?</h2>
                <p>Seçim yapınca liste kapanır; öğrenci seçilirse ekranda yalnız o öğrenci görünür.</p>
                <div className="scene-tiles">
                  <button className="scene-tile group" onClick={() => choose({ kind: 'group' })}>
                    <span>👥</span>Grup genel bakış
                  </button>
                  <button className="scene-tile race" onClick={() => choose({ kind: 'race' })}>
                    <span>🏁</span>Net yarışı
                  </button>
                  <button className="scene-tile" onClick={() => choose({ kind: 'welcome' })}>
                    <span>🏠</span>Karşılama ekranı
                  </button>
                </div>
                {groups.map(([section, list]) => (
                  <div key={section}>
                    <div className="picker-section">{section}</div>
                    <div className="picker-grid">
                      {list.map((s) => (
                        <button key={s.id} className="pick" onClick={() => choose({ kind: 'student', id: s.id })}>
                          <span className="avatar" style={{ background: avatarColor(s.id) }}>
                            {initials(s.name)}
                          </span>
                          <span>
                            {s.name}
                            <small>{fieldLabel(s.field)}</small>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {!data.students.length && <p>Henüz öğrenci yok.</p>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
