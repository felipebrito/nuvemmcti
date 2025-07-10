import { useEffect, useRef, useState } from 'react';
import WordCloud from 'wordcloud';
import './App.css';

const initialWords = [
  ['Foguete', 3], ['Sonho', 1], ['Persistência', 7], ['Nós', 1], ['Brasil', 1],
  ['Livro', 8], ['Descoberta', 5], ['Sustentabilidade', 7], ['Fórmula', 3], ['Fundamental', 6],
  ['Futuro', 1], ['Calculadora', 4], ['Tudo', 6], ['Inspiração', 1], ['Engrenagem', 7],
  ['Vida', 8], ['Teoria', 1], ['Saúde', 5], ['Ideia', 9], ['Necessidade', 6],
  ['Lupa', 4], ['Esperança', 1], ['Laboratório', 7], ['Chip', 8], ['Humanidade', 6],
  ['Avião', 2], ['Soberania', 5], ['Átomo', 9], ['Eu', 4], ['Universo', 1],
  ['Pesquisa', 7], ['Democracia', 1], ['Mundo', 6], ['Comunidade', 8], ['Superação', 9],
  ['Microscópio', 5], ['Trabalho', 7], ['Educação', 3], ['Incrível', 4], ['Gente', 6],
  ['Conhecimento', 3], ['União', 5], ['Amor', 8],
];

const fontWeights = [300, 400, 700, 800];

const optionsBase = {
  gridSize: 8, // menor grid para palavras maiores
  weightFactor: 22, // aumenta o tamanho das palavras
  fontFamily: 'Rawline, sans-serif',
  color: function() {
    return (['#fff', '#e0e0e0'])[Math.floor(Math.random() * 2)]; // branco e cinza claro
  },
  backgroundColor: 'rgba(0,0,0,0)', // fundo transparente
  rotateRatio: 1,
  rotationSteps: 360,
  minRotation: 0,
  maxRotation: Math.PI * 2,
  draw: function drawWord(ctx, info) {
    // Peso da fonte progride conforme o tamanho da palavra
    let weight = 300;
    if (info.fontSize > 40 && info.fontSize <= 60) weight = 400;
    else if (info.fontSize > 60 && info.fontSize <= 90) weight = 700;
    else if (info.fontSize > 90) weight = 800;
    ctx.font = `${weight} ${info.fontSize}px ${info.fontFamily}`;
    ctx.fillStyle = info.fill;
    ctx.save();
    ctx.translate(info.x, info.y);
    ctx.rotate(info.rotate);
    ctx.fillText(info.text, 0, 0);
    ctx.restore();
  },
};

// Utilitário para localStorage
const STORAGE_KEY = 'wcloud-words';
function saveWords(words) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    console.log('[DEBUG] Palavras salvas no localStorage:', words);
  } catch (err) {
    console.error('[DEBUG] Erro ao salvar palavras:', err);
  }
}
function loadWords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      console.log('[DEBUG] Palavras carregadas do localStorage:', parsed);
      return parsed;
    }
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar palavras:', err);
  }
  return null;
}

function App() {
  const canvasRef = useRef(null);
  const [words, setWords] = useState(() => loadWords() || initialWords);
  const [selected, setSelected] = useState(initialWords[0][0]);
  const [highlight, setHighlight] = useState(false);
  const [touchDrag, setTouchDrag] = useState({ active: false, word: null, x: 0, y: 0 });

  // Touch handlers
  const handleTouchStart = (w) => (e) => {
    const touch = e.touches[0];
    setSelected(w);
    setTouchDrag({ active: true, word: w, x: touch.clientX, y: touch.clientY });
  };
  const handleTouchMove = (e) => {
    if (!touchDrag.active) return;
    const touch = e.touches[0];
    setTouchDrag((prev) => ({ ...prev, x: touch.clientX, y: touch.clientY }));
  };
  const handleTouchEnd = (e) => {
    if (!touchDrag.active) return;
    // Verifica se soltou sobre o canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (
        touchDrag.x >= rect.left &&
        touchDrag.x <= rect.right &&
        touchDrag.y >= rect.top &&
        touchDrag.y <= rect.bottom
      ) {
        setWords((prev) => prev.map(([w, v]) => w === touchDrag.word ? [w, v + 1] : [w, v]));
        setHighlight(true);
      }
    }
    setTouchDrag({ active: false, word: null, x: 0, y: 0 });
  };

  // Atalho de teclado para resetar pesos
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        setWords(prev => prev.map(([w]) => [w, 1]));
        setHighlight(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Persistir palavras no localStorage
  useEffect(() => {
    saveWords(words);
  }, [words]);

  // Prevenir gesto de voltar/avançar do browser
  useEffect(() => {
    // Previne swipe back/forward em touch
    const preventTouchNav = (e) => {
      if (e.touches && e.touches.length === 1) {
        const touch = e.touches[0];
        if (touch.clientX < 30 || touch.clientX > window.innerWidth - 30) {
          e.preventDefault();
          console.log('[DEBUG] Swipe lateral bloqueado');
        }
      }
    };
    window.addEventListener('touchstart', preventTouchNav, { passive: false });
    // Previne teclas de navegação
    const preventKeys = (e) => {
      if (
        (e.key === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) ||
        (e.key === 'ArrowRight' && (e.metaKey || e.ctrlKey)) ||
        e.key === 'BrowserBack' ||
        e.key === 'BrowserForward'
      ) {
        e.preventDefault();
        console.log('[DEBUG] Tecla de navegação bloqueada:', e.key);
      }
    };
    window.addEventListener('keydown', preventKeys);
    // Previne popstate (voltar/avançar)
    const preventPop = (e) => {
      history.pushState(null, '', window.location.href);
      console.log('[DEBUG] popstate bloqueado');
    };
    window.addEventListener('popstate', preventPop);
    // Inicializa o pushState para bloquear histórico
    history.pushState(null, '', window.location.href);
    return () => {
      window.removeEventListener('touchstart', preventTouchNav);
      window.removeEventListener('keydown', preventKeys);
      window.removeEventListener('popstate', preventPop);
    };
  }, []);

  // Efeito de destaque ao adicionar
  useEffect(() => {
    if (highlight && canvasRef.current) {
      canvasRef.current.style.boxShadow = '0 0 32px 8px #44f8';
      setTimeout(() => {
        if (canvasRef.current) canvasRef.current.style.boxShadow = 'none';
        setHighlight(false);
      }, 500);
    }
  }, [highlight]);

  // Drag & Drop
  const onDragStart = (w) => {
    setSelected(w);
  };
  const onDragOver = (e) => {
    e.preventDefault();
    if (canvasRef.current) canvasRef.current.style.outline = '3px dashed #44f';
  };
  const onDragLeave = () => {
    if (canvasRef.current) canvasRef.current.style.outline = 'none';
  };
  const onDrop = (e) => {
    e.preventDefault();
    setWords(prev => prev.map(([w, v]) => w === selected ? [w, v + 1] : [w, v]));
    setHighlight(true);
    if (canvasRef.current) canvasRef.current.style.outline = 'none';
  };

  // Atualiza a nuvem de palavras
  useEffect(() => {
    if (canvasRef.current) {
      const options = {
        ...optionsBase,
        list: words,
        drawOutOfBound: false,
        drawMask: false,
      };
      WordCloud(canvasRef.current, options);
    }
    // eslint-disable-next-line
  }, [words]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden', background: 'transparent' }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        src="/bg.mp4"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}>
        {/* Conteúdo principal acima do fundo */}
        <div style={{
          marginBottom: 24,
          display: 'flex',
          flexDirection: 'row',
          gap: 0,
          alignItems: 'center',
          width: '40vw',
          minWidth: 320,
          maxWidth: 600,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: '#222',
          borderRadius: 12,
          boxShadow: '0 2px 12px #0004',
          padding: 8,
          marginTop: 16,
          justifyContent: 'center',
          position: 'relative',
        }}>
          {words.map(([w], idx) => (
            <div
              key={w}
              draggable
              onDragStart={() => onDragStart(w)}
              onClick={() => setSelected(w)}
              onTouchStart={handleTouchStart(w)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                minWidth: 100,
                padding: '12px 18px',
                margin: '0 6px',
                borderRadius: 8,
                background: selected === w ? '#44f' : '#333',
                color: selected === w ? '#fff' : '#eee',
                fontWeight: selected === w ? 700 : 400,
                fontSize: selected === w ? 22 : 18,
                boxShadow: selected === w ? '0 2px 8px #44f8' : 'none',
                cursor: 'grab',
                border: selected === w ? '2px solid #fff' : '2px solid transparent',
                transition: 'all 0.2s',
                textAlign: 'center',
                userSelect: 'none',
                touchAction: 'manipulation',
              }}
            >
              {w}
            </div>
          ))}
          {/* Fantasma do drag no touch */}
          {touchDrag.active && (
            <div
              style={{
                position: 'fixed',
                left: touchDrag.x - 50,
                top: touchDrag.y - 30,
                width: 100,
                height: 40,
                background: '#44f',
                color: '#fff',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 22,
                boxShadow: '0 2px 12px #44f8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                pointerEvents: 'none',
                zIndex: 9999,
                opacity: 0.85,
              }}
            >
              {touchDrag.word}
            </div>
          )}
        </div>
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          style={{ background: 'transparent', borderRadius: 8, transition: 'opacity 0.5s, box-shadow 0.5s', outline: 'none' }}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragLeave={onDragLeave}
        />
      </div>
    </div>
  );
}

export default App;
