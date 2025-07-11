import React, { useEffect, useRef, useState, useCallback } from 'react';
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

// Configurações padrão dos boxes
const defaultBoxConfig = {
  top: { x: 0, y: 0, rotation: 0, scale: 0.7, enabled: true },
  bottom: { x: 0, y: 0, rotation: 0, scale: 0.7, enabled: true },
  left: { x: 0, y: 0, rotation: 90, scale: 0.7, enabled: true },
  right: { x: 0, y: 0, rotation: -90, scale: 0.7, enabled: true }
};

// HOOK DE PERSISTÊNCIA SIMPLES E FUNCIONAL
function usePersistentState(key, initialValue, onDataRecovered) {
  const [state, setState] = useState(() => {
    console.log(`[PERSIST] Loading ${key}...`);
    
    // Tentar carregar do localStorage
    try {
      const saved = localStorage.getItem(key);
      console.log(`[PERSIST] Trying ${key}:`, saved);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[PERSIST] Found valid data in ${key}:`, parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.error(`Error loading from ${key}:`, e);
    }
    
    console.log(`[PERSIST] Using initial value for ${key}:`, initialValue);
    return initialValue;
  });

  useEffect(() => {
    console.log(`[PERSIST] useEffect triggered for ${key}:`, state);
    console.log(`[PERSIST] State type:`, typeof state);
    console.log(`[PERSIST] State length:`, Array.isArray(state) ? state.length : 'not array');
    
    try {
      const jsonData = JSON.stringify(state);
      console.log(`[PERSIST] JSON data:`, jsonData);
      localStorage.setItem(key, jsonData);
      console.log(`[PERSIST] Successfully saved to localStorage`);
      
      // Verificar se foi salvo
      const verify = localStorage.getItem(key);
      console.log(`[PERSIST] Verification:`, verify);
    } catch (e) {
      console.error('Error saving data:', e);
    }
  }, [key, state]);

  return [state, setState];
}

// Hook para configurações dos boxes
function useBoxConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const saved = window.localStorage.getItem('box-config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validação simples: se tem a estrutura esperada, usa ela
        if (parsed && 
            typeof parsed === 'object' &&
            parsed.top && parsed.bottom && parsed.left && parsed.right) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading box config:', e);
    }
    return defaultBoxConfig;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem('box-config', JSON.stringify(config));
    } catch (e) {
      console.error('Error saving box config:', e);
    }
  }, [config]);

  return [config, setConfig];
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
  const [positionedWords, setPositionedWords] = useState([]);
  const [wordAnimations, setWordAnimations] = useState({});

  // Função de easing suave (ease-in-out)
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // Função de easing baseada no spinner (ease-in-out com scale)
  function easeBounce(t) {
    // Simula o movimento do spinner: escala de 0 a 1 e volta
    if (t < 0.5) {
      // Primeira metade: escala de 0 a 1 (ease-in)
      return 2 * t * t;
    } else {
      // Segunda metade: escala de 1 a 0 (ease-out)
      const f = 2 * t - 2;
      return 1 - f * f / 2;
    }
  }

  // Função de easing para flutuação natural (ondulante)
  function easeFloat(t) {
    // Movimento ondulante suave como uma onda
    return 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
  }

  // Função para criar animação suave baseada no spinner
  function createSmoothAnimation(start, end, duration, startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeBounce(progress);
    return start + (end - start) * easedProgress;
  }

  // Função para criar flutuação natural
  function createFloatAnimation(start, end, duration, startTime) {
    const elapsed = (Date.now() - startTime) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeFloat(progress);
    return start + (end - start) * easedProgress;
  }

  function draw(words) {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    
    const currentTime = Date.now();
    
    words.forEach((word, index) => {
      const wordKey = `${word.text}-${index}`;
      
      // Inicializar animação se não existir
      if (!wordAnimations[wordKey]) {
        wordAnimations[wordKey] = {
          floatX: { start: 0, end: (Math.random() - 0.5) * 3, duration: 2 + Math.random() * 0.5, startTime: currentTime },
          floatY: { start: 0, end: (Math.random() - 0.5) * 2, duration: 2.5 + Math.random() * 0.5, startTime: currentTime },
          glow: { start: 0.3, end: 0.8, duration: 2 + Math.random() * 0.3, startTime: currentTime },
          alpha: { start: 0.4, end: 0.7, duration: 2.2 + Math.random() * 0.4, startTime: currentTime }
        };
      }
      
      const anim = wordAnimations[wordKey];
      
      // Calcular posições suaves
      const floatX = createFloatAnimation(anim.floatX.start, anim.floatX.end, anim.floatX.duration, anim.floatX.startTime);
      const floatY = createFloatAnimation(anim.floatY.start, anim.floatY.end, anim.floatY.duration, anim.floatY.startTime);
      const glow = createSmoothAnimation(anim.glow.start, anim.glow.end, anim.glow.duration, anim.glow.startTime);
      const alpha = createSmoothAnimation(anim.alpha.start, anim.alpha.end, anim.alpha.duration, anim.alpha.startTime);
      
      // Verificar se a animação terminou e criar nova
      const elapsedX = (currentTime - anim.floatX.startTime) / 1000;
      const elapsedY = (currentTime - anim.floatY.startTime) / 1000;
      const elapsedGlow = (currentTime - anim.glow.startTime) / 1000;
      const elapsedAlpha = (currentTime - anim.alpha.startTime) / 1000;
      
      if (elapsedX >= anim.floatX.duration) {
        anim.floatX.start = anim.floatX.end;
        anim.floatX.end = (Math.random() - 0.5) * 3; // ±1.5px
        anim.floatX.duration = 2 + Math.random() * 0.5;
        anim.floatX.startTime = currentTime;
      }
      
      if (elapsedY >= anim.floatY.duration) {
        anim.floatY.start = anim.floatY.end;
        anim.floatY.end = (Math.random() - 0.5) * 2; // ±1px
        anim.floatY.duration = 2.5 + Math.random() * 0.5;
        anim.floatY.startTime = currentTime;
      }
      
      if (elapsedGlow >= anim.glow.duration) {
        anim.glow.start = anim.glow.end;
        anim.glow.end = 0.3 + Math.random() * 0.5; // 0.3-0.8
        anim.glow.duration = 2 + Math.random() * 0.3;
        anim.glow.startTime = currentTime;
      }
      
      if (elapsedAlpha >= anim.alpha.duration) {
        anim.alpha.start = anim.alpha.end;
        anim.alpha.end = 0.4 + Math.random() * 0.3; // 0.4-0.7
        anim.alpha.duration = 2.2 + Math.random() * 0.4;
        anim.alpha.startTime = currentTime;
      }
      
      // Brilho individual para cada palavra
      const alphaGlow = glow;
      const shadowBlur = 8 + 24 * glow;
      
      // Cor baseada no índice da palavra (efeito arco-íris sutil)
      const hue = (index * 30) % 360;
      const saturation = 20 + (glow * 30); // 20-50%
      const lightness = 70 + (glow * 20); // 70-90%
      
      ctx.save();
      ctx.font = `${word.weight} ${word.size}px Rawline, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(word.x + width / 2 + floatX, word.y + height / 2 + floatY);
      ctx.rotate(word.rotate * Math.PI / 180);
      
      // Primeira camada: base com cor sutil e transparência animada
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
      ctx.fillText(word.text, 0, 0);
      
      // Segunda camada: brilho animado individual
      ctx.fillStyle = `rgba(255,255,255,${alphaGlow})`;
      ctx.shadowColor = `hsl(${hue}, 80%, 70%)`;
      ctx.shadowBlur = shadowBlur;
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillText(word.text, 0, 0);
      
      ctx.restore();
    });
  }

  // Animation loop for redrawing the cloud with glow effect
  useEffect(() => {
    let running = true;
    function animate() {
      if (!running) return;
      // Only redraw if we have positioned words from d3-cloud
      if (positionedWords.length > 0) {
        draw(positionedWords);
      }
      requestAnimationFrame(animate);
    }
    animate();
    return () => { running = false; };
  }, [positionedWords]);

  useEffect(() => {
    if (!canvasRef.current || words.length === 0) return;
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
      .on('end', (positionedWords) => {
        // Store the positioned words for the animation loop
        setPositionedWords(positionedWords);
        // Reset animations when words change
        setWordAnimations({});
        draw(positionedWords);
      })
      .start();
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

// Componente de Menu de Controle
function ControlMenu({ config, setConfig, isOpen, onClose }) {
  const [localConfig, setLocalConfig] = useState(config);

  // Sempre que o menu abrir, puxe o valor mais recente do config
  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
    }
  }, [isOpen, config]);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  const handleReset = () => {
    setLocalConfig(defaultBoxConfig);
  };

  const updateBoxConfig = (box, field, value) => {
    const newConfig = {
      ...localConfig,
      [box]: {
        ...localConfig[box],
        [field]: value
      }
    };
    setLocalConfig(newConfig);
    // Persistir imediatamente
    setConfig(newConfig);
  };

  if (!isOpen) return null;

  return (
    <div className="control-menu-overlay" onClick={onClose}>
      <div className="control-menu" onClick={e => e.stopPropagation()}>
        <div className="control-menu-header">
          <h3>Configurações dos Boxes</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="control-menu-content">
          {Object.entries(localConfig).map(([boxName, boxConfig]) => (
            <div key={boxName} className="box-config-section">
              <div className="box-config-header">
                <label className="box-toggle">
                  <input
                    type="checkbox"
                    checked={boxConfig.enabled}
                    onChange={(e) => updateBoxConfig(boxName, 'enabled', e.target.checked)}
                  />
                  <span className="box-name">{boxName.toUpperCase()}</span>
                </label>
              </div>
              
              {boxConfig.enabled && (
                <div className="box-config-controls">
                  <div className="control-group">
                    <label>Posição X:</label>
                    <input
                      type="range"
                      min="-200"
                      max="200"
                      value={boxConfig.x}
                      onChange={(e) => updateBoxConfig(boxName, 'x', parseInt(e.target.value))}
                    />
                    <span className="value-display">{boxConfig.x}px</span>
                  </div>
                  
                  <div className="control-group">
                    <label>{boxName === 'left' ? 'Altura (bottom):' : 'Posição Y:'}</label>
                    <input
                      type="range"
                      min="-200"
                      max="800"
                      value={boxConfig.y}
                      onChange={(e) => updateBoxConfig(boxName, 'y', parseInt(e.target.value))}
                    />
                    <span className="value-display">{boxConfig.y}px</span>
                  </div>
                  
                  {/* Só mostra rotação se não for o box top */}
                  <div className="control-group">
                    <label>Rotação:</label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      value={boxConfig.rotation}
                      onChange={(e) => updateBoxConfig(boxName, 'rotation', parseInt(e.target.value))}
                    />
                    <span className="value-display">{boxConfig.rotation}°</span>
                  </div>
                  <div className="control-group">
                    <label>Escala:</label>
                    <input
                      type="range"
                      min="0.3"
                      max="1.2"
                      step="0.1"
                      value={boxConfig.scale}
                      onChange={(e) => updateBoxConfig(boxName, 'scale', parseFloat(e.target.value))}
                    />
                    <span className="value-display">{boxConfig.scale}x</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="control-menu-footer">
          <button className="reset-btn" onClick={handleReset}>Resetar</button>
          <button className="save-btn" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}

// Componente WordMenuBox com classes CSS específicas
function WordMenuBox({ words, onAdd, onRemove, dragProps, sectionClass, style, cardRotation = 0, enabled = true, headerStyle }) {
  if (!enabled) return null;
  
  return (
    <div
      className={sectionClass}
      style={style}
      {...dragProps}
    >
      <div className="words-header" style={headerStyle}>

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
          />
        ))}
      </div>
    </div>
  );
}

function VideoWordCloud() {
  // Usar apenas o novo hook, sem resets automáticos
  const [words, setWords] = usePersistentState('wcloud-words', initialWords);
  
  // Monitoramento simples
  useEffect(() => {
    const checkStorage = () => {
      const saved = localStorage.getItem('wcloud-words');
      console.log(`[MONITOR] Current localStorage data:`, saved);
    };
    
    // Verificar a cada 5 segundos
    const interval = setInterval(checkStorage, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);
  const [touchDrag, setTouchDrag] = useState({ active: false, word: null, x: 0, y: 0 });
  const wordcloudRef = useRef();
  const [boxConfig, setBoxConfig] = useBoxConfig();
  const [controlMenuOpen, setControlMenuOpen] = useState(false);

  // Controle de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setControlMenuOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setControlMenuOpen(false);
      } else if (e.key === 'r' || e.key === 'R') {
        console.log('[VIDEO] Reset triggered by R key');
        localStorage.removeItem('wcloud-words');
        window.location.reload();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Removida a dependência setWords

  // Adiciona uma palavra
  const addWord = (word) => {
    console.log(`[VIDEO] Adding word: ${word}`);
    console.log(`[VIDEO] Current words before:`, words);
    
    setWords(prev => {
      console.log(`[VIDEO] setWords callback called with prev:`, prev);
      const existing = prev.find(([w]) => w === word);
      if (existing) {
        const newState = prev.map(([w, count]) => w === word ? [w, count + 1] : [w, count]);
        console.log(`[VIDEO] Updated existing word: ${word}, new state:`, newState);
        return newState;
      } else {
        const newState = [...prev, [word, 1]];
        console.log(`[VIDEO] Added new word: ${word}, new state:`, newState);
        return newState;
      }
    });
    
    console.log(`[VIDEO] addWord function completed`);
  };
  // Remove uma palavra
  const removeWord = (word) => {
    console.log(`[VIDEO] Removing word: ${word}`);
    const existingIndex = words.findIndex(([w]) => w === word);
    if (existingIndex >= 0) {
      const currentCount = words[existingIndex][1];
      if (currentCount > 1) {
        const newWords = [...words];
        newWords[existingIndex] = [word, currentCount - 1];
        console.log(`[VIDEO] Decreased word count: ${word}, new state:`, newWords);
        setWords(newWords);
      } else {
        const newWords = words.filter(([w]) => w !== word);
        console.log(`[VIDEO] Removed word completely: ${word}, new state:`, newWords);
        setWords(newWords);
      }
    }
  };
  // Drag-and-drop: ao soltar no centro, incrementa
  const handleDropWord = (word) => {
    addWord(word);
  };
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




  
  return (
    <div className="video-wordcloud-container">
      <WordMenuBox
        words={words}
        onAdd={addWord}
        onRemove={removeWord}
        sectionClass="words-section-top"
        style={{
          position: 'fixed',
          left: `calc(50% + ${boxConfig.top.x}px)`,
          top: `calc(24px + ${boxConfig.top.y}px)`,
          transform: `translate(-50%, 0) scale(${boxConfig.top.scale}) rotate(180deg)`
        }}
        cardRotation={boxConfig.top.rotation}
        enabled={boxConfig.top.enabled}
      />
      <WordMenuBox
        words={words}
        onAdd={addWord}
        onRemove={removeWord}
        sectionClass="words-section-bottom"
        style={{
          position: 'fixed',
          left: `calc(50% + ${boxConfig.bottom.x}px)`,
          bottom: `calc(24px + ${boxConfig.bottom.y}px)`,
          transform: `translate(-50%, 0) scale(${boxConfig.bottom.scale}) rotate(0deg)`
        }}
        cardRotation={0}
        enabled={boxConfig.bottom.enabled}
      />
      <WordMenuBox
        words={words}
        onAdd={addWord}
        onRemove={removeWord}
        sectionClass="words-section-left"
        style={{
          position: 'fixed',
          left: `calc(50% + ${boxConfig.left.x}px)`,
          bottom: `calc(${boxConfig.left.y}px)`,
          transform: `translate(-850px, -400px) scale(${boxConfig.left.scale}) rotate(90deg)`
        }}
        cardRotation={90}
        enabled={boxConfig.left.enabled}
      />
      <WordMenuBox
        words={words}
        onAdd={addWord}
        onRemove={removeWord}
        sectionClass="words-section-right"
        style={{
          position: 'fixed',
          right: `calc(24px + -90px)`,
          top: `calc(50% + ${boxConfig.right.y}px)`,
          transform: `translate(0, -110px) scale(${boxConfig.right.scale}) rotate(-90deg)`
        }}
        cardRotation={90}
        enabled={boxConfig.right.enabled}
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
      <ControlMenu
        config={boxConfig}
        setConfig={setBoxConfig}
        isOpen={controlMenuOpen}
        onClose={() => setControlMenuOpen(false)}
      />
      <div className="shortcuts-hint">
        <div className="shortcut-item">
          <span className="key">C</span>
          <span className="description">Configurações</span>
        </div>
        <div className="shortcut-item">
          <span className="key">R</span>
          <span className="description">Resetar</span>
        </div>
      </div>
    </div>
  );
}

export default VideoWordCloud; 