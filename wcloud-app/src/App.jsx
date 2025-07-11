import { useEffect, useRef, useState } from 'react';
import WordCloud from 'wordcloud';
import './App.css';
import { ScrollMenu } from 'react-horizontal-scrolling-menu';
import 'react-horizontal-scrolling-menu/dist/styles.css';
import 'keen-slider/keen-slider.min.css';
import { useKeenSlider } from 'keen-slider/react';
import VideoWordCloud from './VideoWordCloud';

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
  // Crescimento logarítmico e tamanho máximo
  weightFactor: function (size) {
    const base = 14; // tamanho mínimo menor
    const fator = 18; // crescimento
    const maxFontSize = 120; // tamanho máximo
    // size é o valor da palavra
    const fontSize = Math.min(base + Math.log2(size) * fator, maxFontSize);
    return fontSize;
  },
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
    console.log('🎨 [DEBUG] drawWord CHAMADO!', {
      text: info.text,
      weight: info.weight,
      fontSize: info.fontSize,
      fontFamily: info.fontFamily,
      currentFont: ctx.font
    });
    
    // Peso da fonte progride conforme o tamanho da palavra
    let weight = 300;
    if (info.fontSize > 30 && info.fontSize <= 50) weight = 400;
    else if (info.fontSize > 50 && info.fontSize <= 70) weight = 700;
    else if (info.fontSize > 70 && info.fontSize <= 100) weight = 800;
    else if (info.fontSize > 100) weight = 900;
    
    const newFont = `${weight} ${info.fontSize}px ${info.fontFamily}`;
    ctx.font = newFont;
    
    // Debug para todas as palavras desenhadas
    console.log('🎯 [DEBUG] Palavra renderizada:', {
      text: info.text,
      valor: info.weight,
      pesoAplicado: weight,
      fontSize: info.fontSize,
      fontAntes: info.fontFamily,
      fontDepois: newFont,
      ctxFont: ctx.font
    });
    
    // Teste visual: adiciona uma borda colorida para palavras com peso alto
    if (weight >= 700) {
      ctx.strokeStyle = '#ff0000'; // vermelho para palavras grossas
      ctx.lineWidth = 2;
      ctx.strokeText(info.text, 0, 0);
    } else if (weight >= 400) {
      ctx.strokeStyle = '#00ff00'; // verde para palavras médias
      ctx.lineWidth = 1;
      ctx.strokeText(info.text, 0, 0);
    }
    
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
      console.log(`[APP] Loading ${key} from localStorage:`, item);
      if (item) {
        const parsed = JSON.parse(item);
        console.log(`[APP] Parsed ${key}:`, parsed);
        if (Array.isArray(parsed) && parsed.every(item => Array.isArray(item) && typeof item[0] === 'string' && typeof item[1] === 'number')) {
          console.log(`[APP] Using loaded ${key}:`, parsed);
          return parsed;
        } else {
          console.log(`[APP] Validation failed for ${key}, using initial value`);
        }
      }
    } catch (e) {
      console.error(`[APP] Error loading ${key}:`, e);
    }
    console.log(`[APP] Using initial value for ${key}:`, initialValue);
    return initialValue;
  });
  const isFirst = useRef(true);
  const ignoreNextPersist = useRef(false);
  useEffect(() => {
    if (isFirst.current) {
      console.log(`[APP] First render for ${key}, skipping save`);
      isFirst.current = false;
      return;
    }
    if (ignoreNextPersist.current) {
      console.log(`[APP] Ignoring save for ${key}`);
      ignoreNextPersist.current = false;
      return;
    }
    try {
      console.log(`[APP] Saving ${key} to localStorage:`, state);
      window.localStorage.setItem(key, JSON.stringify(state));
      
      // Verificar se está sobrescrevendo dados do VideoWordCloud
      if (key === 'wcloud-words') {
        const videoKey = 'video-wcloud-words-v2';
        const videoData = window.localStorage.getItem(videoKey);
        console.log(`[APP] After saving ${key}, checking ${videoKey}:`, videoData);
      }
    } catch (e) {
      console.error(`[APP] Error saving ${key}:`, e);
    }
  }, [key, state]);
  // Função especial para reset temporário
  const setStateNoPersist = (value) => {
    console.log(`[APP] setStateNoPersist called for ${key}:`, value);
    ignoreNextPersist.current = true;
    setState(value);
  };
  return [state, setState, setStateNoPersist];
}

// Substituir WordCard para aceitar isTopMenu e exibir apenas um conjunto de controles
function WordCard({ word, count, onAdd, onRemove, isTopMenu }) {
  return (
    <div
      className="word-card"
      style={{
        transform: isTopMenu ? 'rotate(180deg)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        margin: '8px 0',
        boxSizing: 'border-box',
      }}
    >
      <div className="word-controls" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="control-btn add" onClick={onAdd} title="Adicionar">+</button>
        <span className="word-count">{count}</span>
        <button className="control-btn remove" onClick={onRemove} title="Remover">-</button>
      </div>
      <span className="word-text" style={{ marginLeft: 16, fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{word}</span>
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

// Novo componente para o menu de palavras, com rotação opcional
function WordMenuBox({ words, onAdd, onRemove, dragProps, style, cardRotation = 0 }) {
  return (
    <div
      className="words-section-top"
      style={style}
      {...dragProps}
    >
      <div className="words-header" style={{ transform: `rotate(${-cardRotation}deg)` }}>
        Palavras
      </div>
      <div className="words-list">
        {words.map(([word, count]) => (
          <WordCard
            key={word + cardRotation}
            word={word}
            count={count}
            onAdd={() => onAdd(word)}
            onRemove={() => onRemove(word)}
            isTopMenu={false}
            style={{ transform: `rotate(${cardRotation}deg)` }}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  console.log('[APP] App component rendering');
  const canvasRef = useRef(null);
  const [words, setWords, setWordsNoPersist] = usePersistentState('wcloud-words', initialWords);
  const [selected, setSelected] = useState(initialWords[0][0]);
  const [highlight, setHighlight] = useState(false);
  const [touchDrag, setTouchDrag] = useState({ active: false, word: null, x: 0, y: 0 });
  const [isMoving, setIsMoving] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 800);
  const [currentPage, setCurrentPage] = useState('video'); // 'main' ou 'video'
  const didMount = useRef(false);
  // Adicionar estado e handlers para drag de cada menu
  const [topMenuX, setTopMenuX] = useState(0);
  const [bottomMenuX, setBottomMenuX] = useState(0);
  const [leftMenuY, setLeftMenuY] = useState(0);
  const [rightMenuY, setRightMenuY] = useState(0);

  const isDraggingTopMenu = useRef(false);
  const dragStartTopX = useRef(0);
  const dragMenuStartTopX = useRef(0);
  const handleTopMenuMouseDown = (e) => {
    isDraggingTopMenu.current = true;
    dragStartTopX.current = e.clientX;
    dragMenuStartTopX.current = topMenuX;
    document.body.style.userSelect = 'none';
  };
  const handleTopMenuMouseMove = (e) => {
    if (!isDraggingTopMenu.current) return;
    setTopMenuX(dragMenuStartTopX.current + (e.clientX - dragStartTopX.current));
  };
  const handleTopMenuMouseUp = () => {
    isDraggingTopMenu.current = false;
    document.body.style.userSelect = '';
  };
  useEffect(() => {
    if (!isDraggingTopMenu.current) return;
    window.addEventListener('mousemove', handleTopMenuMouseMove);
    window.addEventListener('mouseup', handleTopMenuMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleTopMenuMouseMove);
      window.removeEventListener('mouseup', handleTopMenuMouseUp);
    };
  }, [isDraggingTopMenu.current]);

  const isDraggingBottomMenu = useRef(false);
  const dragStartBottomX = useRef(0);
  const dragMenuStartBottomX = useRef(0);
  const handleBottomMenuMouseDown = (e) => {
    isDraggingBottomMenu.current = true;
    dragStartBottomX.current = e.clientX;
    dragMenuStartBottomX.current = bottomMenuX;
    document.body.style.userSelect = 'none';
  };
  const handleBottomMenuMouseMove = (e) => {
    if (!isDraggingBottomMenu.current) return;
    setBottomMenuX(dragMenuStartBottomX.current + (e.clientX - dragStartBottomX.current));
  };
  const handleBottomMenuMouseUp = () => {
    isDraggingBottomMenu.current = false;
    document.body.style.userSelect = '';
  };
  useEffect(() => {
    if (!isDraggingBottomMenu.current) return;
    window.addEventListener('mousemove', handleBottomMenuMouseMove);
    window.addEventListener('mouseup', handleBottomMenuMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleBottomMenuMouseMove);
      window.removeEventListener('mouseup', handleBottomMenuMouseUp);
    };
  }, [isDraggingBottomMenu.current]);

  const isDraggingLeftMenu = useRef(false);
  const dragStartLeftY = useRef(0);
  const dragMenuStartLeftY = useRef(0);
  const handleLeftMenuMouseDown = (e) => {
    isDraggingLeftMenu.current = true;
    dragStartLeftY.current = e.clientY;
    dragMenuStartLeftY.current = leftMenuY;
    document.body.style.userSelect = 'none';
  };
  const handleLeftMenuMouseMove = (e) => {
    if (!isDraggingLeftMenu.current) return;
    setLeftMenuY(dragMenuStartLeftY.current + (e.clientY - dragStartLeftY.current));
  };
  const handleLeftMenuMouseUp = () => {
    isDraggingLeftMenu.current = false;
    document.body.style.userSelect = '';
  };
  useEffect(() => {
    if (!isDraggingLeftMenu.current) return;
    window.addEventListener('mousemove', handleLeftMenuMouseMove);
    window.addEventListener('mouseup', handleLeftMenuMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleLeftMenuMouseMove);
      window.removeEventListener('mouseup', handleLeftMenuMouseUp);
    };
  }, [isDraggingLeftMenu.current]);

  const isDraggingRightMenu = useRef(false);
  const dragStartRightY = useRef(0);
  const dragMenuStartRightY = useRef(0);
  const handleRightMenuMouseDown = (e) => {
    isDraggingRightMenu.current = true;
    dragStartRightY.current = e.clientY;
    dragMenuStartRightY.current = rightMenuY;
    document.body.style.userSelect = 'none';
  };
  const handleRightMenuMouseMove = (e) => {
    if (!isDraggingRightMenu.current) return;
    setRightMenuY(dragMenuStartRightY.current + (e.clientY - dragStartRightY.current));
  };
  const handleRightMenuMouseUp = () => {
    isDraggingRightMenu.current = false;
    document.body.style.userSelect = '';
  };
  useEffect(() => {
    if (!isDraggingRightMenu.current) return;
    window.addEventListener('mousemove', handleRightMenuMouseMove);
    window.addEventListener('mouseup', handleRightMenuMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleRightMenuMouseMove);
      window.removeEventListener('mouseup', handleRightMenuMouseUp);
    };
  }, [isDraggingRightMenu.current]);

  // Teste de carregamento da fonte
  useEffect(() => {
    console.log('🔤 [DEBUG] Testando carregamento da fonte Rawline');
    
    // Teste 1: Verificar se a fonte está disponível
    if (document.fonts && document.fonts.check) {
      const isRawlineLoaded = document.fonts.check('1em Rawline');
      console.log('📋 [DEBUG] Fonte Rawline carregada:', isRawlineLoaded);
      
      // Teste 2: Verificar diferentes pesos
      const weights = [300, 400, 700, 800, 900];
      weights.forEach(weight => {
        const isWeightLoaded = document.fonts.check(`${weight} 1em Rawline`);
        console.log(`📋 [DEBUG] Rawline ${weight}:`, isWeightLoaded);
      });
    }
    
    // Teste 3: Criar um elemento de teste para verificar a fonte
    const testElement = document.createElement('div');
    testElement.style.fontFamily = 'Rawline, sans-serif';
    testElement.style.fontWeight = '900';
    testElement.style.fontSize = '24px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.textContent = 'Teste Rawline 900';
    document.body.appendChild(testElement);
    
    // Verificar se a fonte foi aplicada
    const computedStyle = window.getComputedStyle(testElement);
    console.log('🎨 [DEBUG] Fonte computada do teste:', {
      fontFamily: computedStyle.fontFamily,
      fontWeight: computedStyle.fontWeight,
      fontSize: computedStyle.fontSize
    });
    
    // Limpar o elemento de teste
    setTimeout(() => {
      document.body.removeChild(testElement);
    }, 1000);
  }, []);

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
      console.log('🚀 [DEBUG] Iniciando renderização do WordCloud');
      const options = {
        ...optionsBase,
        list: words,
        draw: optionsBase.draw, // forçar explicitamente
        drawOutOfBound: false,
        drawMask: false,
      };
      console.log('⚙️ [DEBUG] Opções do WordCloud:', {
        listLength: words.length,
        hasDrawFunction: typeof options.draw === 'function',
        drawFunctionName: options.draw.name,
        fontFamily: options.fontFamily
      });
      WordCloud(canvasRef.current, options);
      console.log('✅ [DEBUG] WordCloud chamado com sucesso');

      // TESTE: Escrever uma palavra no centro do canvas usando Rawline 900
      const ctx = canvasRef.current.getContext('2d');
      ctx.save();
      ctx.font = '900 64px Rawline, sans-serif';
      ctx.fillStyle = '#ff00cc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('TESTE RAWLINE 900', canvasRef.current.width / 2, canvasRef.current.height / 2);
      ctx.restore();
      console.log('🟣 [DEBUG] TESTE RAWLINE 900 desenhado no centro do canvas');
    }
    // eslint-disable-next-line
  }, [words]);

  // Incrementar palavra (botão + ou drag)
  const incrementWord = (word) => {
    setWords(prev => {
      const updated = prev.map(([w, v]) => {
        if (w === word) {
          return [w, v + 1];
        }
        return [w, v];
      });
      return updated;
    });
  };

  // Renderiza a página baseada no estado
  if (currentPage === 'video') {
    return <VideoWordCloud />;
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', overflow: 'hidden', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      {/* Header com navegação */}
      <header style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '20px', 
        textAlign: 'center', 
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto',
        zIndex: 10,
        background: 'rgba(10, 42, 90, 0.9)',
        backdropFilter: 'blur(10px)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#fff' }}>WordCloud</h1>
        <div style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={() => setCurrentPage('main')}
            style={{
              padding: '10px 20px',
              background: currentPage === 'main' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Principal
          </button>
          <button 
            onClick={() => setCurrentPage('video')}
            style={{
              padding: '10px 20px',
              background: currentPage === 'video' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '20px',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Com Vídeo
          </button>
        </div>
      </header>
      {/* Menu superior colaborativo */}
      <WordMenuBox
        words={words}
        onAdd={incrementWord}
        onRemove={word => setWords(prev => prev.map(([w, v]) => w === word ? [w, Math.max(0, v - 1)] : [w, v]))}
        dragProps={{ onMouseDown: handleTopMenuMouseDown }}
        style={{
          left: `calc(50% + ${topMenuX}px)`,
          position: 'fixed',
          top: 40,
          transform: 'translateX(-50%) scale(0.7) rotate(180deg)',
          zIndex: 20,
          cursor: 'grab',
        }}
        cardRotation={180}
      />
      <WordMenuBox
        words={words}
        onAdd={incrementWord}
        onRemove={word => setWords(prev => prev.map(([w, v]) => w === word ? [w, Math.max(0, v - 1)] : [w, v]))}
        dragProps={{ onMouseDown: handleBottomMenuMouseDown }}
        style={{
          left: `calc(50% + ${bottomMenuX}px)`,
          position: 'fixed',
          bottom: 40,
          transform: 'translateX(-50%) scale(0.7) rotate(0deg)',
          zIndex: 20,
          cursor: 'grab',
        }}
        cardRotation={0}
      />
      <WordMenuBox
        words={words}
        onAdd={incrementWord}
        onRemove={word => setWords(prev => prev.map(([w, v]) => w === word ? [w, Math.max(0, v - 1)] : [w, v]))}
        dragProps={{ onMouseDown: handleLeftMenuMouseDown }}
        style={{
          top: `calc(50% + ${leftMenuY}px)`,
          position: 'fixed',
          left: 40,
          transform: 'translateY(-50%) scale(0.7) rotate(90deg)',
          zIndex: 20,
          cursor: 'grab',
        }}
        cardRotation={90}
      />
      <WordMenuBox
        words={words}
        onAdd={incrementWord}
        onRemove={word => setWords(prev => prev.map(([w, v]) => w === word ? [w, Math.max(0, v - 1)] : [w, v]))}
        dragProps={{ onMouseDown: handleRightMenuMouseDown }}
        style={{
          top: `calc(50% + ${rightMenuY}px)`,
          position: 'fixed',
          right: 40,
          transform: 'translateY(-50%) scale(0.7) rotate(-90deg)',
          zIndex: 20,
          cursor: 'grab',
        }}
        cardRotation={-90}
      />
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
        paddingTop: '80px', // Espaço para o header fixo
      }}>
        {/* Conteúdo principal acima do fundo */}
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
