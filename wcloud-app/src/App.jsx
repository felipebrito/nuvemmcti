import { useEffect, useRef, useState } from 'react';
import WordCloud from 'wordcloud';
import './App.css';
import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';

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
      // Garante que é um array de [string, number]
      if (Array.isArray(parsed) && parsed.every(item => Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'number')) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('[DEBUG] Erro ao carregar palavras:', err);
  }
  return null;
}

// Hook robusto para persistência
function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.every(item => Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'number')) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
    return initialValue;
  });
  const isFirst = useRef(true);
  const ignoreNextPersist = useRef(false);
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (ignoreNextPersist.current) {
      ignoreNextPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      console.log('[DEBUG] usePersistentState: Salvo no localStorage:', state);
    } catch (e) {
      // ignore
    }
  }, [key, state]);
  // Função especial para reset temporário
  const setStateNoPersist = (value) => {
    ignoreNextPersist.current = true;
    setState(value);
  };
  return [state, setState, setStateNoPersist];
}

function WordCard({ word, selected, onClick, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(word)}
      onClick={onClick}
      style={{
        minWidth: 120,
        padding: '18px 32px',
        margin: '0 12px',
        borderRadius: 18,
        background: selected
          ? 'rgba(255,255,255,0.18)'
          : 'rgba(40,40,60,0.22)',
        color: selected ? '#fff' : '#e0e0e0',
        fontWeight: 700,
        fontSize: 24,
        boxShadow: selected
          ? '0 4px 32px 0 #fff8, 0 1.5px 8px #44f8'
          : '0 1.5px 8px #0004',
        backdropFilter: 'blur(8px)',
        border: selected ? '2px solid #fff' : '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(.4,2,.3,1)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {word}
    </div>
  );
}

function WordList({ words, selected, setSelected, onDragStart }) {
  return (
    <ScrollMenu>
      {words.map(([w]) => (
        <WordCard
          key={w}
          word={w}
          selected={selected === w}
          onClick={() => setSelected(w)}
          onDragStart={onDragStart}
        />
      ))}
    </ScrollMenu>
  );
}

function WordAutoWidthCarousel({ words, selected, setSelected, isMoving, setIsMoving, onAdd, onDragStart, isDesktop }) {
  const [sliderRef, instanceRef] = useKeenSlider({
    loop: true,
    mode: 'snap',
    rtl: false,
    slides: { perView: 'auto' },
    dragStart: () => setIsMoving(true),
    dragEnd: () => setIsMoving(false),
    slideChanged(s) {
      setSelected(words[s.track.details.rel][0]);
    },
  });
  const selectedIdx = words.findIndex(([w]) => w === selected);
  return (
    <div style={{
      position: 'relative',
      width: '60vw',
      maxWidth: 600,
      margin: '0 auto 24px auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      zIndex: 2,
    }}>
      <div
        ref={sliderRef}
        className="keen-slider"
        style={{
          width: '100%',
          overflow: 'hidden',
          background: 'none',
          boxShadow: 'none',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
      >
        {words.map(([word], idx) => (
          <div
            className="keen-slider__slide"
            key={word}
            draggable={isDesktop}
            onDragStart={isDesktop ? (e) => onDragStart(e, word) : undefined}
            style={{
              minWidth: Math.max(80, word.length * 18),
              maxWidth: 340,
              width: 'auto',
              margin: '0 8px',
              fontSize: 24,
              fontWeight: selected === word ? 800 : 500,
              color: '#fff',
              background: selected === word ? 'rgba(255,255,255,0.18)' : 'rgba(40,40,60,0.22)',
              borderRadius: 18,
              boxShadow: selected === word ? '0 4px 32px 0 #fff8, 0 1.5px 8px #44f8' : '0 1.5px 8px #0004',
              backdropFilter: 'blur(8px)',
              border: selected === word ? '3px solid #fff' : '2px solid transparent',
              transition: 'all 0.3s cubic-bezier(.4,2,.3,1)',
              cursor: 'pointer',
              userSelect: 'none',
              whiteSpace: 'nowrap',
              overflow: 'visible', // Permite que o botão + não seja cortado
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: '0 18px',
            }}
            onClick={() => setSelected(word)}
          >
            <span>{word}</span>
            {selectedIdx === idx && (
              <button
                onClick={e => { e.stopPropagation(); onAdd(word); }}
                style={{
                  background: 'rgba(40,40,60,0.7)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  fontSize: 22,
                  fontWeight: 800,
                  boxShadow: '0 2px 8px #0006',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 5,
                }}
                tabIndex={-1}
                title="Adicionar palavra"
              >
                +
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const canvasRef = useRef(null);
  const [words, setWords, setWordsNoPersist] = usePersistentState('wcloud-words', initialWords);
  console.log('[DEBUG] Valor inicial de words no state:', words);
  const [selected, setSelected] = useState(initialWords[0][0]);
  const [highlight, setHighlight] = useState(false);
  const [touchDrag, setTouchDrag] = useState({ active: false, word: null, x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);
  const didMount = useRef(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 800);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Atalho de teclado para resetar pesos (apenas na interface, não persiste)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        setWordsNoPersist(prev => prev.map(([w]) => [w, 1]));
        setHighlight(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  // Drag & Drop desktop
  const onDragStart = (e, word) => {
    e.dataTransfer.setData('text/plain', word);
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
    const word = e.dataTransfer.getData('text/plain');
    setWords(prev => prev.map(([w, v]) => w === word ? [w, v + 1] : [w, v]));
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

  // Incrementar palavra (botão + ou drag)
  const incrementWord = (word) => {
    setWords(prev => {
      const updated = prev.map(([w, v]) => {
        if (w === word) {
          console.log('[DEBUG] Incrementando palavra:', w, 'Valor antes:', v, 'Valor depois:', v + 1);
          return [w, v + 1];
        }
        return [w, v];
      });
      console.log('[DEBUG] Novo array após incremento:', updated);
      return updated;
    });
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
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
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
      }}>
        {/* Conteúdo principal acima do fundo */}
        <WordAutoWidthCarousel
          words={words}
          selected={selected}
          setSelected={setSelected}
          isMoving={isMoving}
          setIsMoving={setIsMoving}
          onAdd={incrementWord}
          onDragStart={onDragStart}
          isDesktop={isDesktop}
        />
        <canvas
          ref={canvasRef}
          width={900}
          height={600}
          style={{ background: 'transparent', borderRadius: 8, transition: 'opacity 0.5s, box-shadow 0.5s', outline: 'none' }}
          onDragOver={onDragOver}
          onDrop={e => {
            e.preventDefault();
            const word = e.dataTransfer.getData('text/plain');
            incrementWord(word);
            setHighlight(true);
            if (canvasRef.current) canvasRef.current.style.outline = 'none';
          }}
          onDragLeave={onDragLeave}
        />
      </div>
    </div>
  );
}

export default App;
