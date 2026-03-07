import { useState, useCallback, useEffect, useRef } from "react"
import "./App.css"

type AppState = "HUB" | "MULTIPLICATION" | "FRACTIONS" | "DECIMALS" | "PEMDAS" | "ALGEBRA"
type GameState = "LOBBY" | "PLAYING"
const UNLOCK_KEY = "owen_math_unlock_level"
const GOAL = 20
const TIME_LIMIT = 15
const VERSION = "v1.2.3"

const LEVELS: {id: AppState, name: string, grade: string}[] = [
  {id: "MULTIPLICATION", name: "Mult. Battle", grade: "Grades 2-4"},
  {id: "FRACTIONS", name: "Fraction Quest", grade: "Grades 4-6"},
  {id: "DECIMALS", name: "Decimal Dash", grade: "Grades 4-6"},
  {id: "PEMDAS", name: "PEMDAS Puzzle", grade: "Grades 5-6"},
  {id: "ALGEBRA", name: "Algebra Arena", grade: "Grades 6+"}
]

function App() {
  const [appState, setAppState] = useState<AppState>("HUB")
  const [unlockLevel, setUnlockLevel] = useState(0)

  useEffect(() => {
    const saved = localStorage.getItem(UNLOCK_KEY)
    if (saved) setUnlockLevel(parseInt(saved))
  }, [])

  const onComplete = (state: AppState) => {
    const currentIndex = LEVELS.findIndex(l => l.id === state)
    if (currentIndex === unlockLevel && unlockLevel < LEVELS.length - 1) {
      const nextLevel = unlockLevel + 1
      setUnlockLevel(nextLevel)
      localStorage.setItem(UNLOCK_KEY, nextLevel.toString())
      alert("🏆 LEVEL UNLOCKED! New training available, Owen!")
    }
    setAppState("HUB")
  }

  if (appState === "HUB") {
    return (
      <div className="game-container pokemon-theme">
        <div className="exclusive-banner">AUTHORIZED ACCESS: OWEN ONLY</div>
        <header className="game-header">
          <h1>Owen's Math Hub</h1>
          <p className="subtitle">Progress: {unlockLevel + 1} / {LEVELS.length} | Goal: 20 Correct per Game</p>
        </header>
        <div className="hub-grid">
          {LEVELS.map((lvl, idx) => {
            const isLocked = idx > unlockLevel
            return (
              <div key={lvl.id} className={`card hub-card ${isLocked ? "locked" : ""}`} onClick={() => !isLocked && setAppState(lvl.id)}>
                <div className="pokeball-decoration top"></div>
                <h2>{lvl.name}</h2>
                <span className="grade-tag">{lvl.grade}</span>
                {isLocked ? <div className="lock-icon">🔒 LOCKED</div> : <button className="start-btn">Enter ⚔️</button>}
              </div>
            )
          })}
        </div>
        <footer className="hub-footer">
           <p className="version-display">Owen's Hub {VERSION}</p>
           <button className="reset-btn" onClick={() => { if(confirm("Reset all progress, Owen?")) { localStorage.clear(); window.location.reload(); } }}>Reset Data</button>
        </footer>
      </div>
    )
  }

  const exit = () => setAppState("HUB")
  switch(appState) {
    case "MULTIPLICATION": return <MultiplicationGame onExit={exit} onComplete={() => onComplete("MULTIPLICATION")} />
    case "FRACTIONS": return <FractionGame onExit={exit} onComplete={() => onComplete("FRACTIONS")} />
    case "DECIMALS": return <DecimalGame onExit={exit} onComplete={() => onComplete("DECIMALS")} />
    case "PEMDAS": return <PEMDASGame onExit={exit} onComplete={() => onComplete("PEMDAS")} />
    case "ALGEBRA": return <AlgebraGame onExit={exit} onComplete={() => onComplete("ALGEBRA")} />
    default: return <div />
  }
}

/* --- REUSABLE COMPONENTS --- */

function Lobby({ name, onStart, onExit }: any) {
  return (
    <div className="game-container pokemon-theme">
      <div className="card lobby">
        <h2>{name}</h2>
        <p>Ready Owen? You need 20 correct answers to advance!</p>
        <button onClick={onStart} className="start-btn">Start! ⚔️</button>
        <button onClick={onExit} className="exit-btn">Back to Hub 🏠</button>
      </div>
    </div>
  )
}

function GameHeader({ stats, streak, timeLeft, goal }: any) {
  return (
    <header className="game-status-bar">
      <div className="stat-item">Goal: {stats.c}/{goal}</div>
      <div className="stat-item streak-display">Streak: {streak} {streak >= 3 && "🔥"}</div>
      <div className="timer-container">
        <div className={`timer-fill ${timeLeft <= 3 ? "low" : ""}`} style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }} />
      </div>
      <div className="stat-item">Time: {timeLeft}s</div>
    </header>
  )
}

/* --- GAMES --- */

function MultiplicationGame({ onExit, onComplete }: any) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 })
  const [streak, setStreak] = useState(0)
  const [problem, setProblem] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef<any>(null)

  const generate = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1, b = Math.floor(Math.random() * 12) + 1
    const ans = a * b
    const opts = new Set([ans])
    while(opts.size < 6) opts.add(ans + (Math.floor(Math.random()*20)-10))
    setProblem({ a, b, ans, options: Array.from(opts).sort(() => Math.random() - 0.5) })
    setFeedback(null)
    setTimeLeft(TIME_LIMIT)
  }, [])

  const handleTimeOut = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStats(s => ({ ...s, w: s.w + 1 }))
    setStreak(0)
    setFeedback({ m: "⏲️ TIME UP!", t: "wrong" })
    setTimeout(generate, 1500)
  }, [generate])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, feedback, handleTimeOut])

  const handleAnswer = (o: number) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (o === problem.ans) {
      const newC = stats.c + 1
      setStats(s => ({ ...s, c: newC }))
      setStreak(prev => prev + 1)
      setFeedback({ m: streak >= 2 ? "🔥 FIRE STREAK!" : "💥 HIT!", t: "correct" })
      if (newC >= GOAL) setTimeout(onComplete, 1000)
      else setTimeout(generate, 1000)
    } else {
      setStats(s => ({ ...s, w: s.w + 1 }))
      setStreak(0)
      setFeedback({ m: "MISS!", t: "wrong" })
      setTimeout(generate, 1500)
    }
  }

  if (gameState === "LOBBY") return <Lobby name="Multiplication Battle" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <GameHeader stats={stats} streak={streak} timeLeft={timeLeft} goal={GOAL} />
        <div className="problem-area"><div className="problem">{problem?.a} × {problem?.b}</div></div>
        <div className="options">
          {problem?.options.map((o: any) => <button key={o} className="option-btn" onClick={() => handleAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}

function FractionGame({ onExit, onComplete }: any) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [streak, setStreak] = useState(0)
  const [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef<any>(null)

  const generate = useCallback(() => {
    const isSimp = Math.random() > 0.5
    if (isSimp) {
      const common = Math.floor(Math.random()*3)+2, n = Math.floor(Math.random()*5)+1, d = n + Math.floor(Math.random()*5)+1
      const ans = `${n}/${d}`
      const opts = new Set([ans])
      while(opts.size < 6) opts.add(`${Math.floor(Math.random()*5)+1}/${Math.floor(Math.random()*10)+2}`)
      setProb({ t: "SIMP", n1: n*common, d1: d*common, ans, opts: Array.from(opts).sort() })
    } else {
      const n1 = Math.floor(Math.random()*5)+1, d1 = Math.floor(Math.random()*5)+2, n2 = Math.floor(Math.random()*5)+1, d2 = Math.floor(Math.random()*5)+2
      const v1 = n1/d1, v2 = n2/d2, ans = v1 < v2 ? "<" : v1 > v2 ? ">" : "="
      setProb({ t: "COMP", n1, d1, n2, d2, ans, opts: ["<", "=", ">"] })
    }
    setFeedback(null)
    setTimeLeft(TIME_LIMIT)
  }, [])

  const handleTimeOut = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0)
    setFeedback({ m: "⏲️ TIME UP!", t: "wrong" }); setTimeout(generate, 1500)
  }, [generate])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, feedback, handleTimeOut])

  const handleAnswer = (o: any) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (o === prob.ans) {
      const newC = stats.c + 1; setStats(s => ({ ...s, c: newC })); setStreak(prev => prev + 1)
      setFeedback({ m: "🌟 NICE!", t: "correct" })
      if (newC >= GOAL) setTimeout(onComplete, 1000); else setTimeout(generate, 1000)
    } else {
      setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0); setFeedback({ m: "Try again!", t: "wrong" }); setTimeout(generate, 1500)
    }
  }

  if (gameState === "LOBBY") return <Lobby name="Fraction Quest" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />

  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <GameHeader stats={stats} streak={streak} timeLeft={timeLeft} goal={GOAL} />
        <div className="problem-area">
          {prob?.t === "SIMP" ? <div className="fraction-row"><div className="frac"><span>{prob.n1}</span><hr/><span>{prob.d1}</span></div> <div className="vs">= ?</div></div>
          : <div className="fraction-row"><div className="frac"><span>{prob?.n1}</span><hr/><span>{prob?.d1}</span></div> <div className="vs">?</div> <div className="frac"><span>{prob?.n2}</span><hr/><span>{prob?.d2}</span></div></div>}
        </div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={() => handleAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

function DecimalGame({ onExit, onComplete }: any) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [streak, setStreak] = useState(0)
  const [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef<any>(null)

  const generate = useCallback(() => {
    const isMult = Math.random() > 0.7
    let a, b, ans
    if (isMult) { a = (Math.floor(Math.random()*20)+1)/10; b = Math.floor(Math.random()*5)+2; ans = parseFloat((a * b).toFixed(2)) }
    else { a = (Math.floor(Math.random()*100)+10)/10; b = (Math.floor(Math.random()*100)+10)/10; ans = Math.random()>0.5 ? parseFloat((a+b).toFixed(2)) : parseFloat((Math.max(a,b)-Math.min(a,b)).toFixed(2)) }
    const opts = new Set([ans])
    while(opts.size < 6) opts.add(parseFloat((ans + (Math.random()*4-2)).toFixed(2)))
    setProb({ q: isMult ? `${a} × ${b}` : (a > b ? `${a} + ${b}` : `${b} - ${a}`), ans, opts: Array.from(opts).sort((x,y)=>x-y) })
    setFeedback(null); setTimeLeft(TIME_LIMIT)
  }, [])

  const handleTimeOut = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0)
    setFeedback({ m: "⏲️ TIME UP!", t: "wrong" }); setTimeout(generate, 1500)
  }, [generate])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, feedback, handleTimeOut])

  const handleAnswer = (o: any) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (o === prob.ans) {
      const newC = stats.c + 1; setStats(s => ({ ...s, c: newC })); setStreak(prev => prev + 1)
      setFeedback({ m: "✨ SHINY!", t: "correct" })
      if (newC >= GOAL) setTimeout(onComplete, 1000); else setTimeout(generate, 1000)
    } else {
      setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0); setFeedback({ m: "Missed...", t: "wrong" }); setTimeout(generate, 1500)
    }
  }

  if (gameState === "LOBBY") return <Lobby name="Decimal Dash" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <GameHeader stats={stats} streak={streak} timeLeft={timeLeft} goal={GOAL} />
        <div className="problem-area"><div className="problem">{prob?.q}</div></div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={() => handleAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

function PEMDASGame({ onExit, onComplete }: any) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [streak, setStreak] = useState(0)
  const [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef<any>(null)

  const generate = useCallback(() => {
    const a = Math.floor(Math.random()*5)+2, b = Math.floor(Math.random()*5)+2, c = Math.floor(Math.random()*5)+2
    const type = Math.floor(Math.random()*3)
    let q = "", ans = 0
    if(type===0) { q = `(${a} + ${b}) × ${c}`; ans = (a+b)*c }
    else if(type===1) { q = `${a} × ${b} + ${c}`; ans = (a*b)+c }
    else { q = `${a} + ${b} × ${c}`; ans = a+(b*c) }
    const opts = new Set([ans])
    while(opts.size < 6) opts.add(ans + (Math.floor(Math.random()*20)-10))
    setProb({ q, ans, opts: Array.from(opts).sort((x,y)=>x-y) })
    setFeedback(null); setTimeLeft(TIME_LIMIT)
  }, [])

  const handleTimeOut = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0)
    setFeedback({ m: "⏲️ TIME UP!", t: "wrong" }); setTimeout(generate, 1500)
  }, [generate])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, feedback, handleTimeOut])

  const handleAnswer = (o: any) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (o === prob.ans) {
      const newC = stats.c + 1; setStats(s => ({ ...s, c: newC })); setStreak(prev => prev + 1)
      setFeedback({ m: "🎯 DIRECT HIT!", t: "correct" })
      if (newC >= GOAL) setTimeout(onComplete, 1000); else setTimeout(generate, 1000)
    } else {
      setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0); setFeedback({ m: "Recalibrating...", t: "wrong" }); setTimeout(generate, 1500)
    }
  }

  if (gameState === "LOBBY") return <Lobby name="PEMDAS Puzzle" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <GameHeader stats={stats} streak={streak} timeLeft={timeLeft} goal={GOAL} />
        <div className="problem-area"><div className="problem">{prob?.q}</div></div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={() => handleAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

function AlgebraGame({ onExit, onComplete }: any) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [streak, setStreak] = useState(0)
  const [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const timerRef = useRef<any>(null)

  const generate = useCallback(() => {
    const x = Math.floor(Math.random()*10)+1, a = Math.floor(Math.random()*5)+2, b = Math.floor(Math.random()*10)+1
    const ans = x, c = a * x + b, q = `${a}x + ${b} = ${c}`
    const opts = new Set([ans])
    while(opts.size < 6) opts.add(Math.max(1, ans + (Math.floor(Math.random()*10)-5)))
    setProb({ q, ans, opts: Array.from(opts).sort((x,y)=>x-y) })
    setFeedback(null); setTimeLeft(TIME_LIMIT)
  }, [])

  const handleTimeOut = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0)
    setFeedback({ m: "⏲️ TIME UP!", t: "wrong" }); setTimeout(generate, 1500)
  }, [generate])

  useEffect(() => {
    if (gameState === "PLAYING" && !feedback) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleTimeOut()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gameState, feedback, handleTimeOut])

  const handleAnswer = (o: any) => {
    if (feedback) return
    if (timerRef.current) clearInterval(timerRef.current)
    if (o === prob.ans) {
      const newC = stats.c + 1; setStats(s => ({ ...s, c: newC })); setStreak(prev => prev + 1)
      setFeedback({ m: "💪 MASTERED!", t: "correct" })
      if (newC >= GOAL) setTimeout(onComplete, 1000); else setTimeout(generate, 1000)
    } else {
      setStats(s => ({ ...s, w: s.w + 1 })); setStreak(0); setFeedback({ m: "Keep solving!", t: "wrong" }); setTimeout(generate, 1500)
    }
  }

  if (gameState === "LOBBY") return <Lobby name="Algebra Arena" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <GameHeader stats={stats} streak={streak} timeLeft={timeLeft} goal={GOAL} />
        <div className="problem-area"><div className="problem">{prob?.q}</div></div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={() => handleAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

export default App
