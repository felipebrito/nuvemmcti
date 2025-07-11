import React, { useEffect, useRef, useState } from 'react';
import cloud from 'd3-cloud';
import './VideoWordCloud.css';

const initialWords = [
  ['Foguete', 0], ['Sonho', 0], ['Persistência', 0], ['Nós', 0], ['Brasil', 0],
  ['Livro', 0], ['Descoberta', 0], ['Sustentabilidade', 0], ['Fórmula', 0], ['Fundamental', 0],
  ['Futuro', 0], ['Calculadora', 0], ['Tudo', 0], ['Inspiração', 0], ['Engrenagem', 0],
  ['Vida', 0], ['Teoria', 0], ['Saúde', 0], ['Ideia', 0], ['Necessidade', 0],
  ['Lupa', 0], ['Esperança', 0], ['Laboratório', 0], ['Chip', 0], ['Humanidade', 0],
  ['Avião', 0], ['Soberania', 0], ['Átomo', 0], ['Eu', 0], ['Universo', 0],
  ['Pesquisa', 0], ['Democracia', 0], ['Mundo', 0], ['Comunidade', 0], ['Superação', 0],
  ['Microscópio', 0], ['Trabalho', 0], ['Educação', 0], ['Incrível', 0], ['Gente', 0],
  ['Conhecimento', 0], ['União', 0], ['Amor', 0],
];

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
    } catch (e) {}
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
    } catch (e) {}
  }, [key, state]);
  const setStateNoPersist = (value) => {
    ignoreNextPersist.current = true;
    setState(value);
  };
  return [state, setState, setStateNoPersist];
}

function getFontWeight(size) {
  if (size > 100) return 900;
  if (size > 70) return 800;
  if (size > 50) return 700;
  if (size > 30) return 500;
  return 400;
}
function weightFactor(value) {
  const base = 14;
  const fator = 18;
  const maxFontSize = 120;
  return Math.min(base + Math.log2(value) * fator, maxFontSize);
}

function D3WordCloud({ words, width = 1200, height = 600, onDropWord, isTouchDragging }) {
  const canvasRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ratio = window.devicePixelRatio || 1;
    const canvas = canvasRef.current;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx?.clearRect(0, 0, width, height);
    const wordObjs = words.map(([text, value]) => {
      const size = weightFactor(value);
      const weight = getFontWeight(size);
      return { text, value, size, weight };
    });
    cloud()
      .size([width, height])
      .words(wordObjs)
      .padding(5)
      .rotate(() => Math.random() > 0.5 ? 0 : 90)
      .font('Rawline')
      .fontWeight(d => d.weight)
      .fontSize(d => d.size)
      .on('end', draw)
      .start();
    function draw(words) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      words.forEach(word => {
        ctx.save();
        ctx.font = `${word.weight} ${word.size}px Rawline, sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.translate(word.x + width / 2, word.y + height / 2);
        ctx.rotate(word.rotate * Math.PI / 180);
        ctx.fillText(word.text, 0, 0);
        ctx.restore();
      });
    }
  }, [words, width, height]);

  // Drag-and-drop target (desktop)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleDragOver = (e) => {
      e.preventDefault();
      setDragOver(true);
    };
    const handleDragLeave = () => {
      setDragOver(false);
    };
    const handleDrop = (e) => {
      e.preventDefault();
      setDragOver(false);
      const word = e.dataTransfer.getData('text/plain');
      if (onDropWord && word) onDropWord(word);
    };
    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('dragleave', handleDragLeave);
    canvas.addEventListener('drop', handleDrop);
    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('dragleave', handleDragLeave);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [onDropWord]);

  // Para drag visual em touch: highlight área
  useEffect(() => {
    if (!canvasRef.current) return;
    if (isTouchDragging) {
      setDragOver(true);
    } else {
      setDragOver(false);
    }
  }, [isTouchDragging]);

  return (
    <canvas
      ref={canvasRef}
      className={dragOver ? 'drag-over' : ''}
      style={{ 
        background: 'transparent', 
        borderRadius: 8, 
        display: 'block', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}
    />
  );
}

function WordCard({ word, count, onAdd, onRemove }) {
  const isTouch = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return (
    <div
      className="word-card"
      draggable={!isTouch}
      onDragStart={e => {
        if (!isTouch) {
          e.dataTransfer.setData('text/plain', word);
          if (window.getSelection) window.getSelection().removeAllRanges();
        }
      }}
      onClick={isTouch ? onAdd : undefined}
      title={isTouch ? 'Toque para adicionar à nuvem, ou use o botão de remover' : 'Arraste para a nuvem ou use os botões'}
    >
      {/* Controles rotacionados para o outro usuário */}
      
      <span className="word-text">{word}</span>
      {/* Controles normais */}
      <div className="card-controls">
        <button
          onClick={onAdd}
          className="control-btn add card-btn"
          title="Adicionar"
          tabIndex={0}
        >
          +
        </button>
        <span className="word-count">{count}</span>
        <button
          onClick={onRemove}
          className="control-btn remove card-btn"
          title="Remover"
          tabIndex={0}
        >
          -
        </button>
      </div>
    </div>
  );
}

// Copiar o componente WordMenuBox do App.jsx para cá
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

function VideoWordCloud() {
  const [words, setWords, setWordsNoPersist] = usePersistentState('video-wcloud-words', initialWords);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const [topBoxX, setTopBoxX] = useState(0); // posição horizontal do menu superior
  const dragData = useRef({ dragging: false, startX: 0, lastX: 0 });
  const [touchDrag, setTouchDrag] = useState({ active: false, word: null, x: 0, y: 0 });
  const wordcloudRef = useRef();

  // Funções de drag customizado para o menu superior
  function handleTopBoxMouseDown(e) {
    dragData.current.dragging = true;
    dragData.current.startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    dragData.current.lastX = topBoxX;
    document.addEventListener('mousemove', handleTopBoxMouseMove);
    document.addEventListener('mouseup', handleTopBoxMouseUp);
    document.addEventListener('touchmove', handleTopBoxMouseMove, { passive: false });
    document.addEventListener('touchend', handleTopBoxMouseUp);
  }
  function handleTopBoxMouseMove(e) {
    if (!dragData.current.dragging) return;
    const clientX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const delta = clientX - dragData.current.startX;
    setTopBoxX(Math.max(-window.innerWidth * 0.25, Math.min(window.innerWidth * 0.25, dragData.current.lastX + delta)));
    if (e.type === 'touchmove') e.preventDefault();
  }
  function handleTopBoxMouseUp() {
    dragData.current.dragging = false;
    document.removeEventListener('mousemove', handleTopBoxMouseMove);
    document.removeEventListener('mouseup', handleTopBoxMouseUp);
    document.removeEventListener('touchmove', handleTopBoxMouseMove);
    document.removeEventListener('touchend', handleTopBoxMouseUp);
  }

  // Atalho de teclado para resetar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        setWords(initialWords);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setWords]);

  // Adiciona uma palavra
  const addWord = (word) => {
    const existingIndex = words.findIndex(([w]) => w === word);
    if (existingIndex >= 0) {
      const newWords = [...words];
      newWords[existingIndex] = [word, Math.min(newWords[existingIndex][1] + 1, 12)];
      setWords(newWords);
    } else {
      setWords([...words, [word, 1]]);
    }
  };
  // Remove uma palavra
  const removeWord = (word) => {
    const existingIndex = words.findIndex(([w]) => w === word);
    if (existingIndex >= 0) {
      const currentCount = words[existingIndex][1];
      if (currentCount > 1) {
        const newWords = [...words];
        newWords[existingIndex] = [word, currentCount - 1];
        setWords(newWords);
      } else {
        setWords(words.filter(([w]) => w !== word));
      }
    }
  };
  // Drag-and-drop: ao soltar no centro, incrementa
  const handleDropWord = (word) => {
    addWord(word);
  };
  // Todas as palavras para o menu
  const allWords = initialWords.map(([w]) => {
    const found = words.find(([w2]) => w2 === w);
    return [w, found ? found[1] : 0];
  });
  // Palavras na nuvem
  const cloudWords = words.filter(([w, count]) => count > 0);

  // Função para drag visual em touch
  function handleTouchDrag(word, e, end = false, move = false) {
    if (!word && end) {
      // Fim do drag: verifica se está sobre a nuvem
      const touch = e.changedTouches[0];
      const cloudRect = wordcloudRef.current?.getBoundingClientRect();
      if (cloudRect && touch) {
        if (
          touch.clientX >= cloudRect.left &&
          touch.clientX <= cloudRect.right &&
          touch.clientY >= cloudRect.top &&
          touch.clientY <= cloudRect.bottom
        ) {
          addWord(touchDrag.word);
        }
      }
      setTouchDrag({ active: false, word: null, x: 0, y: 0 });
      // Remove ghost
      const ghost = document.getElementById('touch-drag-ghost');
      if (ghost) ghost.remove();
      return;
    }
    if (move) {
      const touch = e.touches[0];
      setTouchDrag(d => ({ ...d, x: touch.clientX, y: touch.clientY }));
      // Move ghost
      const ghost = document.getElementById('touch-drag-ghost');
      if (ghost) {
        ghost.style.left = `${touch.clientX - 40}px`;
        ghost.style.top = `${touch.clientY - 30}px`;
      }
      return;
    }
    // Início do drag visual
    const touch = e.touches[0];
    setTouchDrag({ active: true, word, x: touch.clientX, y: touch.clientY });
    // Cria ghost
    let ghost = document.getElementById('touch-drag-ghost');
    if (!ghost) {
      ghost = document.createElement('div');
      ghost.id = 'touch-drag-ghost';
      ghost.style.position = 'fixed';
      ghost.style.zIndex = 9999;
      ghost.style.pointerEvents = 'none';
      ghost.style.background = 'rgba(44,62,120,0.95)';
      ghost.style.color = '#fff';
      ghost.style.fontWeight = 'bold';
      ghost.style.fontSize = '1.1rem';
      ghost.style.padding = '10px 22px';
      ghost.style.borderRadius = '12px';
      ghost.style.boxShadow = '0 4px 24px #0006';
      ghost.style.left = `${touch.clientX - 40}px`;
      ghost.style.top = `${touch.clientY - 30}px`;
      ghost.innerText = word;
      document.body.appendChild(ghost);
    }
  }

  // Estados e handlers para drag dos 4 menus
  const [topMenuX, setTopMenuX] = useState(0);
  const [bottomMenuX, setBottomMenuX] = useState(0);
  const [leftMenuY, setLeftMenuY] = useState(0);
  const [rightMenuY, setRightMenuY] = useState(0);

  const isDraggingTopMenu = useRef(false);
  const dragStartTopX = useRef(0);
  const dragMenuStartTopX = useRef(0);
  function handleTopMenuMouseDown(e) {
    isDraggingTopMenu.current = true;
    dragStartTopX.current = e.clientX;
    dragMenuStartTopX.current = topMenuX;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleTopMenuMouseMove);
    document.addEventListener('mouseup', handleTopMenuMouseUp);
  }
  function handleTopMenuMouseMove(e) {
    if (!isDraggingTopMenu.current) return;
    setTopMenuX(dragMenuStartTopX.current + (e.clientX - dragStartTopX.current));
  }
  function handleTopMenuMouseUp() {
    isDraggingTopMenu.current = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleTopMenuMouseMove);
    document.removeEventListener('mouseup', handleTopMenuMouseUp);
  }

  const isDraggingBottomMenu = useRef(false);
  const dragStartBottomX = useRef(0);
  const dragMenuStartBottomX = useRef(0);
  function handleBottomMenuMouseDown(e) {
    isDraggingBottomMenu.current = true;
    dragStartBottomX.current = e.clientX;
    dragMenuStartBottomX.current = bottomMenuX;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleBottomMenuMouseMove);
    document.addEventListener('mouseup', handleBottomMenuMouseUp);
  }
  function handleBottomMenuMouseMove(e) {
    if (!isDraggingBottomMenu.current) return;
    setBottomMenuX(dragMenuStartBottomX.current + (e.clientX - dragStartBottomX.current));
  }
  function handleBottomMenuMouseUp() {
    isDraggingBottomMenu.current = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleBottomMenuMouseMove);
    document.removeEventListener('mouseup', handleBottomMenuMouseUp);
  }

  const isDraggingLeftMenu = useRef(false);
  const dragStartLeftY = useRef(0);
  const dragMenuStartLeftY = useRef(0);
  function handleLeftMenuMouseDown(e) {
    isDraggingLeftMenu.current = true;
    dragStartLeftY.current = e.clientY;
    dragMenuStartLeftY.current = leftMenuY;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleLeftMenuMouseMove);
    document.addEventListener('mouseup', handleLeftMenuMouseUp);
  }
  function handleLeftMenuMouseMove(e) {
    if (!isDraggingLeftMenu.current) return;
    setLeftMenuY(dragMenuStartLeftY.current + (e.clientY - dragStartLeftY.current));
  }
  function handleLeftMenuMouseUp() {
    isDraggingLeftMenu.current = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleLeftMenuMouseMove);
    document.removeEventListener('mouseup', handleLeftMenuMouseUp);
  }

  const isDraggingRightMenu = useRef(false);
  const dragStartRightY = useRef(0);
  const dragMenuStartRightY = useRef(0);
  function handleRightMenuMouseDown(e) {
    isDraggingRightMenu.current = true;
    dragStartRightY.current = e.clientY;
    dragMenuStartRightY.current = rightMenuY;
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleRightMenuMouseMove);
    document.addEventListener('mouseup', handleRightMenuMouseUp);
  }
  function handleRightMenuMouseMove(e) {
    if (!isDraggingRightMenu.current) return;
    setRightMenuY(dragMenuStartRightY.current + (e.clientY - dragStartRightY.current));
  }
  function handleRightMenuMouseUp() {
    isDraggingRightMenu.current = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleRightMenuMouseMove);
    document.removeEventListener('mouseup', handleRightMenuMouseUp);
  }

  return (
    <div className="video-wordcloud-container">
      <WordMenuBox
        words={allWords}
        onAdd={addWord}
        onRemove={removeWord}
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
        words={allWords}
        onAdd={addWord}
        onRemove={removeWord}
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
        words={allWords}
        onAdd={addWord}
        onRemove={removeWord}
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
        words={allWords}
        onAdd={addWord}
        onRemove={removeWord}
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
      {/* Vídeo de fundo */}
      {!videoError && (
        <video
          ref={videoRef}
          className="background-video"
          autoPlay
          muted
          loop
          playsInline
          onError={() => setVideoError(true)}
        >
          <source src="/videos/bg.mp4" type="video/mp4" />
        </video>
      )}
      {videoError && (
        <div className="video-fallback">
          <div className="animated-background"></div>
        </div>
      )}
      <div className="video-overlay"></div>
      <div className="content-wrapper">
        <div className="wordcloud-section" ref={wordcloudRef}>
          {cloudWords.length > 0 ? (
            <D3WordCloud 
              words={cloudWords} 
              width={1200}
              height={600}
              onDropWord={handleDropWord}
              isTouchDragging={touchDrag.active}
            />
          ) : (
            <div className="empty-state">
              <div className="empty-icon">☁️</div>
              <p>Adicione palavras para ver a nuvem se formar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoWordCloud; 