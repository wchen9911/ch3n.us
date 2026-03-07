import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import "./App.css"

type AppState = "HUB" | "MULTIPLICATION" | "FRACTIONS"
type MultiplicationState = "LOBBY" | "PLAYING"
const QUESTION_TIME = 10 
const MULT_STORAGE_KEY = "ch3n_math_stats"

interface ProblemStats {
  correct: number
  wrong: number
  reinforceCount: number
}
type PerformanceMap = Record<string, ProblemStats>

function App() {
  const [appState, setAppState] = useState<AppState>("HUB")

  if (appState === "HUB") {
    return (
      <div className="game-container pokemon-theme">
        <header className="game-header">
          <h1>ch3n.us Math Hub</h1>
          <p className="subtitle">Level Up Your Math Skills!</p>
        </header>
        <div className="hub-grid">
          <div className="card hub-card" onClick={() => setAppState("MULTIPLICATION")}>
            <div className="pokeball-decoration top"></div>
            <h2>Multiplication Battle</h2>
            <p>1x1 to 12x12 Adaptive Training</p>
            <span className="grade-tag">Grades 2-4</span>
            <button className="start-btn">Enter Battle ⚔️</button>
            <div className="pokeball-decoration bottom"></div>
          </div>
          <div className="card hub-card" onClick={() => setAppState("FRACTIONS")}>
            <div className="pokeball-decoration top"></div>
            <h2>Fraction Quest</h2>
            <p>Simplifying, Adding & Comparing</p>
            <span className="grade-tag">Grades 4-6</span>
            <button className="start-btn">Start Quest 🧩</button>
            <div className="pokeball-decoration bottom"></div>
          </div>
        </div>
        <footer className="hub-footer">
           <button 
            className="reset-btn"
            onClick={() => { if(confirm("Reset all progress for ALL games?")) { localStorage.clear(); window.location.reload(); } }}
          >
            Reset All Data
          </button>
        </footer>
      </div>
    )
  }

  if (appState === "MULTIPLICATION") {
    return <MultiplicationGame onExit={() => setAppState("HUB")} />
  }

  return <FractionGame onExit={() => setAppState("HUB")} />
}

function MultiplicationGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<MultiplicationState>("LOBBY")
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [currentProblem, setCurrentProblem] = useState({ a: 1, b: 1 })
  const [options, setOptions] = useState<number[]>([])
  const [feedback, setFeedback] = useState<{msg: string, type: "correct" | "wrong"} | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [performance, setPerformance] = useState<PerformanceMap>({})
  const [wrongQueue, setWrongQueue] = useState<string[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(MULT_STORAGE_KEY)
    if (saved) {
      try { setPerformance(JSON.parse(saved)) } catch (e) { console.error(e) }
    }
  }, [])

  const updatePerformance = useCallback((a: number, b: number, isCorrect: boolean) => {
    const key = `${Math.min(a, b)}x${Math.max(a, b)}`
    setPerformance(prev => {
      const current = prev[key] || { correct: 0, wrong: 0, reinforceCount: 0 }
      const next = {
        ...current,
        correct: isCorrect ? current.correct + 1 : current.correct,
        wrong: !isCorrect ? current.wrong + 1 : current.wrong,
        reinforceCount: !isCorrect ? 2 : Math.max(0, current.reinforceCount - 1)
      }
      const newPerf = { ...prev, [key]: next }
      localStorage.setItem(MULT_STORAGE_KEY, JSON.stringify(newPerf))
      return newPerf
    })
    if (!isCorrect) setWrongQueue(prev => [...prev, key, key])
  }, [])

  const generateProblem = useCallback(() => {
    let nextA: number, nextB: number
    if (wrongQueue.length > 0) {
      const [key, ...rest] = wrongQueue
      const [sa, sb] = key.split("x").map(Number)
      nextA = sa; nextB = sb
      setWrongQueue(rest)
    } else {
      let found = false, attempts = 0
      nextA = 1; nextB = 1
      while (!found && attempts < 20) {
        const ta = Math.floor(Math.random() * 12) + 1
        const tb = Math.floor(Math.random() * 12) + 1
        const key = `${Math.min(ta, tb)}x${Math.max(ta, tb)}`
        const stats = performance[key]
        if (stats && stats.correct > 3 && stats.wrong === 0) { attempts++; continue }
        nextA = ta; nextB = tb; found = true
      }
    }
    const correct = nextA * nextB
    const distractors = new Set<number>()
    while(distractors.size < 3) {
      const offset = Math.floor(Math.random() * 5) + 1
      const dist = Math.random() > 0.5 ? correct + offset : Math.max(1, correct - offset)
      if (dist !== correct) distractors.add(dist)
    }
    const allOptions = [...Array.from(distractors), correct].sort(() => Math.random() - 0.5)
    setCurrentProblem({ a: nextA, b: nextB })
    setOptions(allOptions); setFeedback(null); setTimeLeft(QUESTION_TIME)
  }, [wrongQueue, performance])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      } else {
        setSessionWrong(w => w + 1)
        updatePerformance(currentProblem.a, currentProblem.b, false)
        setFeedback({ msg: "⏰ TIME OUT!", type: "wrong" })
        setTimeout(generateProblem, 2000)
      }
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [gameState, timeLeft, feedback, currentProblem, updatePerformance, generateProblem])

  const handleAnswer = (answer: number) => {
    if (feedback) return 
    const isCorrect = answer === currentProblem.a * currentProblem.b
    updatePerformance(currentProblem.a, currentProblem.b, isCorrect)
    if (isCorrect) {
      setSessionCorrect(s => s + 1)
      setFeedback({ msg: "💥 CRITICAL HIT!", type: "correct" })
    } else {
      setSessionWrong(w => w + 1)
      setFeedback({ msg: "MISS!", type: "wrong" })
    }
    setTimeout(generateProblem, 1500)
  }

  const lifetimeStats = useMemo(() => {
    return Object.values(performance).reduce((acc, curr) => ({
      correct: acc.correct + curr.correct,
      wrong: acc.wrong + curr.wrong
    }), { correct: 0, wrong: 0 })
  }, [performance])

  if (gameState === "LOBBY") {
    return (
      <div className="game-container pokemon-theme">
        <div className="card lobby">
          <h2>Multiplication Battle</h2>
          <div className="lifetime-badge">
            <h3>LIFETIME STATS</h3>
            <div className="stats-grid">
              <div>✅ {lifetimeStats.correct} Correct</div>
              <div>❌ {lifetimeStats.wrong} Wrong</div>
            </div>
          </div>
          <button onClick={() => { setGameState("PLAYING"); generateProblem(); }} className="start-btn">Start Battle! ⚔️</button>
          <button onClick={onExit} className="exit-btn">Back to Hub 🏠</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <div className="battle-info">
          <div className="session-stats">
            SESSION: <span className="c">{sessionCorrect}</span> | <span className="w">{sessionWrong}</span>
          </div>
        </div>
        <div className="timer-bar-container">
          <div className={`timer-bar ${timeLeft < 4 ? "low" : ""}`} style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}></div>
        </div>
        <div className="problem-area">
          <div className="problem">{currentProblem.a} × {currentProblem.b}</div>
        </div>
        <div className="options">
          {options.map(opt => (
            <button key={opt} onClick={() => handleAnswer(opt)} className={`option-btn ${feedback && opt === currentProblem.a * currentProblem.b ? "correct" : ""}`} disabled={!!feedback}>{opt}</button>
          ))}
        </div>
        {feedback && <div className={`feedback-box ${feedback.type}`}>{feedback.msg}</div>}
        <button onClick={() => setGameState("LOBBY")} className="exit-btn">End Run 💨</button>
      </div>
    </div>
  )
}

interface Fraction {
  n: number
  d: number
}

function FractionGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<MultiplicationState>("LOBBY")
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionWrong, setSessionWrong] = useState(0)
  const [problem, setProblem] = useState<{f1: Fraction, f2: Fraction, type: "COMPARE" | "SIMPLIFY"}>({ f1: {n:1,d:2}, f2: {n:1,d:2}, type: "SIMPLIFY" })
  const [options, setOptions] = useState<any[]>([])
  const [feedback, setFeedback] = useState<{msg: string, type: "correct" | "wrong"} | null>(null)
  
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

  const generateProblem = useCallback(() => {
    const isCompare = Math.random() > 0.5
    if (isCompare) {
      const f1 = { n: Math.floor(Math.random()*8)+1, d: Math.floor(Math.random()*8)+2 }
      const f2 = { n: Math.floor(Math.random()*8)+1, d: Math.floor(Math.random()*8)+2 }
      setProblem({ f1, f2, type: "COMPARE" })
      setOptions(["<", "=", ">"])
    } else {
      const common = Math.floor(Math.random()*4)+2
      const sn = Math.floor(Math.random()*6)+1
      const sd = Math.floor(Math.random()*6)+sn+1
      const f1 = { n: sn * common, d: sd * common }
      setProblem({ f1, f2: {n:sn, d:sd}, type: "SIMPLIFY" })
      const distractors = new Set<string>()
      distractors.add(`${sn}/${sd}`)
      while(distractors.size < 4) {
        distractors.add(`${Math.floor(Math.random()*5)+1}/${Math.floor(Math.random()*10)+6}`)
      }
      setOptions(Array.from(distractors).sort(() => Math.random() - 0.5))
    }
    setFeedback(null)
  }, [])

  const handleAnswer = (ans: any) => {
    if (feedback) return
    let correct = false
    if (problem.type === "COMPARE") {
      const v1 = problem.f1.n / problem.f1.d
      const v2 = problem.f2.n / problem.f2.d
      const actual = v1 < v2 ? "<" : v1 > v2 ? ">" : "="
      correct = ans === actual
    } else {
      const g = gcd(problem.f1.n, problem.f1.d)
      correct = ans === `${problem.f1.n/g}/${problem.f1.d/g}`
    }

    if (correct) {
      setSessionCorrect(s => s + 1)
      setFeedback({ msg: "🌟 PERFECT!", type: "correct" })
    } else {
      setSessionWrong(w => w + 1)
      setFeedback({ msg: "Oops!", type: "wrong" })
    }
    setTimeout(generateProblem, 1500)
  }

  if (gameState === "LOBBY") {
    return (
      <div className="game-container pokemon-theme">
        <div className="card lobby">
          <h2>Fraction Quest</h2>
          <p>Master the art of fractions!</p>
          <button onClick={() => { setGameState("PLAYING"); generateProblem(); }} className="start-btn">Begin Quest 🧩</button>
          <button onClick={onExit} className="exit-btn">Back to Hub 🏠</button>
        </div>
      </div>
    )
  }

  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <div className="battle-info">
          <div className="session-stats">SCORE: {sessionCorrect} | {sessionWrong}</div>
        </div>
        <div className="problem-area">
          {problem.type === "COMPARE" ? (
            <div className="problem fraction-row">
              <div className="frac"><span>{problem.f1.n}</span><hr/><span>{problem.f1.d}</span></div>
              <div className="vs">?</div>
              <div className="frac"><span>{problem.f2.n}</span><hr/><span>{problem.f2.d}</span></div>
            </div>
          ) : (
            <div className="problem fraction-row">
               <div className="frac"><span>{problem.f1.n}</span><hr/><span>{problem.f1.d}</span></div>
               <div className="vs">= ?</div>
            </div>
          )}
        </div>
        <div className="options">
          {options.map(opt => (
            <button key={opt} onClick={() => handleAnswer(opt)} className="option-btn">{opt}</button>
          ))}
        </div>
        {feedback && <div className={`feedback-box ${feedback.type}`}>{feedback.msg}</div>}
        <button onClick={() => setGameState("LOBBY")} className="exit-btn">End Run 💨</button>
      </div>
    </div>
  )
}

export default App