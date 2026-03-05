import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import './App.css'

type GameState = 'LOBBY' | 'PLAYING' | 'SUMMARY'

const QUESTION_TIME = 10 
const STORAGE_KEY = 'ch3n_math_stats'

interface ProblemStats {
  correct: number
  wrong: number
  reinforceCount: number // How many times this needs to be repeated soon
}

type PerformanceMap = Record<string, ProblemStats>

function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [currentProblem, setCurrentProblem] = useState({ a: 1, b: 1 })
  const [options, setOptions] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{msg: string, type: 'correct' | 'wrong'} | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [performance, setPerformance] = useState<PerformanceMap>({})
  const [wrongQueue, setWrongQueue] = useState<string[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setPerformance(JSON.parse(saved))
      } catch (e) {
        console.error("Failed to load stats", e)
      }
    }
  }, [])

  // Save stats to localStorage
  const updatePerformance = useCallback((a: number, b: number, isCorrect: boolean) => {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}` // Normalized key
    setPerformance(prev => {
      const current = prev[key] || { correct: 0, wrong: 0, reinforceCount: 0 }
      const next = {
        ...current,
        correct: isCorrect ? current.correct + 1 : current.correct,
        wrong: !isCorrect ? current.wrong + 1 : current.wrong,
        reinforceCount: !isCorrect ? 2 : Math.max(0, current.reinforceCount - 1)
      }
      const newPerf = { ...prev, [key]: next }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPerf))
      return newPerf
    })

    if (!isCorrect) {
      setWrongQueue(prev => [...prev, key, key]) // Add twice to queue
    }
  }, [])

  const generateProblem = useCallback(() => {
    let nextA: number, nextB: number
    
    // 1. Try to pick from wrongQueue first
    if (wrongQueue.length > 0) {
      const [key, ...rest] = wrongQueue
      const [sa, sb] = key.split('x').map(Number)
      nextA = sa
      nextB = sb
      setWrongQueue(rest)
    } else {
      // 2. Otherwise generate a semi-random one, avoiding "easy/mastered" ones
      // We'll favor problems with high 'wrong' counts or 0 'correct' counts
      let found = false
      let attempts = 0
      nextA = 1
      nextB = 1
      
      while (!found && attempts < 20) {
        const ta = Math.floor(Math.random() * 12) + 1
        const tb = Math.floor(Math.random() * 12) + 1
        const key = `${Math.min(ta, tb)}x${Math.max(ta, tb)}`
        const stats = performance[key]
        
        // Skip if mastered (e.g. correct > 3 and no recent wrongs)
        if (stats && stats.correct > 3 && stats.wrong === 0) {
          attempts++
          continue
        }
        
        nextA = ta
        nextB = tb
        found = true
      }
    }
    
    const correct = nextA * nextB
    const distractors = new Set<number>()
    while(distractors.size < 3) {
      const offset = Math.floor(Math.random() * 5) + 1
      const dist = Math.random() > 0.5 ? correct + offset : Math.max(1, correct - offset)
      if (dist !== correct) distractors.add(dist)
    }
    
    const allOptions = Array.from(distractors)
    allOptions.push(correct)
    allOptions.sort(() => Math.random() - 0.5)
    
    setCurrentProblem({ a: nextA, b: nextB })
    setOptions(allOptions)
    setFeedback(null)
    setTimeLeft(QUESTION_TIME)
  }, [wrongQueue, performance])

  // Timer logic
  useEffect(() => {
    if (gameState === 'PLAYING' && !feedback) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      } else {
        setSessionWrong(w => w + 1)
        updatePerformance(currentProblem.a, currentProblem.b, false)
        setFeedback({ msg: `⏰ TIME OUT! It was ${currentProblem.a * currentProblem.b}`, type: 'wrong' })
        setTimeout(generateProblem, 2000)
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [gameState, timeLeft, feedback, currentProblem, updatePerformance, generateProblem])

  const startGame = () => {
    setSessionCorrect(0)
    setSessionWrong(0)
    setGameState('PLAYING')
    generateProblem()
  }

  const handleAnswer = (answer: number) => {
    if (feedback) return 
    if (timerRef.current) clearTimeout(timerRef.current)

    const isCorrect = answer === currentProblem.a * currentProblem.b
    updatePerformance(currentProblem.a, currentProblem.b, isCorrect)

    if (isCorrect) {
      setSessionCorrect(s => s + 1)
      setFeedback({ msg: '💥 CRITICAL HIT!', type: 'correct' })
    } else {
      setSessionWrong(w => w + 1)
      setFeedback({ msg: `MISS! It was ${currentProblem.a * currentProblem.b}`, type: 'wrong' })
    }

    setTimeout(generateProblem, 1500)
  }

  const lifetimeStats = useMemo(() => {
    return Object.values(performance).reduce((acc, curr) => ({
      correct: acc.correct + curr.correct,
      wrong: acc.wrong + curr.wrong
    }), { correct: 0, wrong: 0 })
  }, [performance])

  return (
    <div className="game-container pokemon-theme">
      <header className="game-header">
        <h1>ch3n.us Math Hub</h1>
        <p className="subtitle">Persistent Adaptive Training</p>
      </header>

      {gameState === 'LOBBY' && (
        <div className="card lobby">
          <div className="pokeball-decoration top"></div>
          <h2>Infinite Battle Mode</h2>
          <p>The game learns what you find hard!</p>
          
          <div className="lifetime-badge">
            <h3>LIFETIME STATS</h3>
            <div className="stats-grid">
              <div>✅ {lifetimeStats.correct} Correct</div>
              <div>❌ {lifetimeStats.wrong} Wrong</div>
            </div>
          </div>

          <button onClick={startGame} className="start-btn">Battle! ⚔️</button>
          
          <button 
            className="reset-btn"
            onClick={() => { if(confirm('Reset all progress?')) { localStorage.clear(); setPerformance({}); } }}
          >
            Reset Data
          </button>
          <div className="pokeball-decoration bottom"></div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="card playing">
          <div className="battle-info">
            <div className="session-stats">
              SESSION: <span className="c">{sessionCorrect}</span> | <span className="w">{sessionWrong}</span>
            </div>
            <div className="queue-info">
              {wrongQueue.length > 0 && <span className="alert">⚠️ REINFORCING {Math.ceil(wrongQueue.length/2)} PROBLEMS</span>}
            </div>
          </div>
          
          <div className="timer-bar-container">
            <div 
              className={`timer-bar ${timeLeft < 4 ? 'low' : ''}`} 
              style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
            ></div>
          </div>

          <div className="problem-area">
            <div className="problem">
              {currentProblem.a} × {currentProblem.b}
            </div>
          </div>

          <div className="options">
            {options.map(opt => (
              <button 
                key={opt} 
                onClick={() => handleAnswer(opt)}
                className={`option-btn ${feedback && opt === currentProblem.a * currentProblem.b ? 'correct' : ''}`}
                disabled={!!feedback}
              >
                {opt}
              </button>
            ))}
          </div>
          
          <div className="battle-controls">
            <button onClick={() => setGameState('LOBBY')} className="exit-btn">Run Away 💨</button>
          </div>

          {feedback && (
            <div className={`feedback-box ${feedback.type}`}>
              {feedback.msg}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App
