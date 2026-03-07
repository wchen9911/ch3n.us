import { useState, useCallback } from "react"
import "./App.css"

type AppState = "HUB" | "MULTIPLICATION" | "FRACTIONS" | "DECIMALS" | "PEMDAS" | "ALGEBRA"
type GameState = "LOBBY" | "PLAYING"


function App() {
  const [appState, setAppState] = useState<AppState>("HUB")

  if (appState === "HUB") {
    return (
      <div className="game-container pokemon-theme">
        <div className="exclusive-banner">AUTHORIZED ACCESS: OWEN ONLY</div>
        <header className="game-header">
          <h1>Owen's Math Hub</h1>
          <p className="subtitle">Elite Training for Owen Chen</p>
        </header>
        <div className="hub-grid">
          <div className="card hub-card" onClick={() => setAppState("MULTIPLICATION")}>
            <div className="pokeball-decoration top"></div>
            <h2>Mult. Battle</h2>
            <span className="grade-tag">Grades 2-4</span>
            <button className="start-btn">Enter ⚔️</button>
          </div>
          <div className="card hub-card" onClick={() => setAppState("FRACTIONS")}>
            <div className="pokeball-decoration top"></div>
            <h2>Fraction Quest</h2>
            <span className="grade-tag">Grades 4-6</span>
            <button className="start-btn">Start 🧩</button>
          </div>
          <div className="card hub-card" onClick={() => setAppState("DECIMALS")}>
            <div className="pokeball-decoration top"></div>
            <h2>Decimal Dash</h2>
            <span className="grade-tag">Grades 4-6</span>
            <button className="start-btn">Dash 💨</button>
          </div>
          <div className="card hub-card" onClick={() => setAppState("PEMDAS")}>
            <div className="pokeball-decoration top"></div>
            <h2>PEMDAS Puzzle</h2>
            <span className="grade-tag">Grades 5-6</span>
            <button className="start-btn">Solve ⚡</button>
          </div>
          <div className="card hub-card" onClick={() => setAppState("ALGEBRA")}>
            <div className="pokeball-decoration top"></div>
            <h2>Algebra Arena</h2>
            <span className="grade-tag">Grades 6+</span>
            <button className="start-btn">Arena 🏟️</button>
          </div>
        </div>
        <footer className="hub-footer">
           <button className="reset-btn" onClick={() => { if(confirm("Reset all progress, Owen?")) { localStorage.clear(); window.location.reload(); } }}>Reset Data</button>
        </footer>
      </div>
    )
  }

  const exit = () => setAppState("HUB")
  switch(appState) {
    case "MULTIPLICATION": return <MultiplicationGame onExit={exit} />
    case "FRACTIONS": return <FractionGame onExit={exit} />
    case "DECIMALS": return <DecimalGame onExit={exit} />
    case "PEMDAS": return <PEMDASGame onExit={exit} />
    case "ALGEBRA": return <AlgebraGame onExit={exit} />
    default: return <div />
  }
}

/* --- REUSABLE GAME COMPONENTS --- */

function MultiplicationGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 })
  const [problem, setProblem] = useState({ a: 1, b: 1, options: [1] as number[] })
  const [feedback, setFeedback] = useState<any>(null)

  const generate = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1, b = Math.floor(Math.random() * 12) + 1
    const ans = a * b
    const opts = new Set([ans])
    while(opts.size < 4) opts.add(ans + (Math.floor(Math.random()*10)-5))
    setProblem({ a, b, options: Array.from(opts).sort(() => Math.random() - 0.5) })
    setFeedback(null)
  }, [])

  if (gameState === "LOBBY") return <Lobby name="Multiplication Battle" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <header className="game-status">Correct: {stats.c} | Wrong: {stats.w}</header>
        <div className="problem-area"><div className="problem">{problem.a} × {problem.b}</div></div>
        <div className="options">
          {problem.options.map(o => <button key={o} className="option-btn" onClick={() => {
            if (o === problem.a * problem.b) { setStats(s=>({ ...s, c: s.c+1 })); setFeedback({m:"💥 HIT!", t:"correct"}); setTimeout(generate, 1000) }
            else { setStats(s=>({ ...s, w: s.w+1 })); setFeedback({m:"MISS!", t:"wrong"}); }
          }}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

function FractionGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 })
  const [prob, setProb] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)

  const generate = useCallback(() => {
    const isSimp = Math.random() > 0.5
    if (isSimp) {
      const common = Math.floor(Math.random()*3)+2, n = Math.floor(Math.random()*5)+1, d = n + Math.floor(Math.random()*5)+1
      const ans = `${n}/${d}`
      const opts = new Set([ans])
      while(opts.size < 4) opts.add(`${Math.floor(Math.random()*5)+1}/${Math.floor(Math.random()*10)+2}`)
      setProb({ t: "SIMP", n1: n*common, d1: d*common, ans, opts: Array.from(opts).sort() })
    } else {
      const n1 = Math.floor(Math.random()*5)+1, d1 = Math.floor(Math.random()*5)+2, n2 = Math.floor(Math.random()*5)+1, d2 = Math.floor(Math.random()*5)+2
      const v1 = n1/d1, v2 = n2/d2, ans = v1 < v2 ? "<" : v1 > v2 ? ">" : "="
      setProb({ t: "COMP", n1, d1, n2, d2, ans, opts: ["<", "=", ">"] })
    }
    setFeedback(null)
  }, [])

  if (gameState === "LOBBY") return <Lobby name="Fraction Quest" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />

  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <header className="game-status">Score: {stats.c} - {stats.w}</header>
        <div className="problem-area">
          {prob?.t === "SIMP" ? <div className="fraction-row"><div className="frac"><span>{prob.n1}</span><hr/><span>{prob.d1}</span></div> <div className="vs">= ?</div></div>
          : <div className="fraction-row"><div className="frac"><span>{prob?.n1}</span><hr/><span>{prob?.d1}</span></div> <div className="vs">?</div> <div className="frac"><span>{prob?.n2}</span><hr/><span>{prob?.d2}</span></div></div>}
        </div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={() => {
            if (o === prob.ans) { setStats(s=>({ ...s, c: s.c+1 })); setFeedback({m:"🌟 NICE!", t:"correct"}); setTimeout(generate, 1000) }
            else { setStats(s=>({ ...s, w: s.w+1 })); setFeedback({m:"Try again!", t:"wrong"}); }
          }}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={() => setGameState("LOBBY")}>Exit</button>
      </div>
    </div>
  )
}

function DecimalGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)

  const generate = useCallback(() => {
    const isMult = Math.random() > 0.7
    let a, b, ans
    if (isMult) { a = (Math.floor(Math.random()*20)+1)/10; b = Math.floor(Math.random()*5)+2; ans = parseFloat((a * b).toFixed(2)) }
    else { a = (Math.floor(Math.random()*100)+10)/10; b = (Math.floor(Math.random()*100)+10)/10; ans = Math.random()>0.5 ? parseFloat((a+b).toFixed(2)) : parseFloat((Math.max(a,b)-Math.min(a,b)).toFixed(2)) }
    const opts = new Set([ans])
    while(opts.size < 4) opts.add(parseFloat((ans + (Math.random()*2-1)).toFixed(2)))
    setProb({ q: isMult ? `${a} × ${b}` : (a > b ? `${a} + ${b}` : `${b} - ${a}`), ans, opts: Array.from(opts).sort() })
    setFeedback(null)
  }, [])

  if (gameState === "LOBBY") return <Lobby name="Decimal Dash" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return <GameView name="Decimal Dash" stats={stats} prob={prob} feedback={feedback} onAnswer={(o:any)=>{
    if(o===prob.ans) { setStats(s=>({...s,c:s.c+1})); setFeedback({m:"✨ SHINY!", t:"correct"}); setTimeout(generate, 1000) }
    else { setStats(s=>({...s,w:s.w+1})); setFeedback({m:"Missed...", t:"wrong"}); }
  }} onExit={()=>setGameState("LOBBY")} />
}

function PEMDASGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)

  const generate = useCallback(() => {
    const a = Math.floor(Math.random()*5)+2, b = Math.floor(Math.random()*5)+2, c = Math.floor(Math.random()*5)+2
    const type = Math.floor(Math.random()*3)
    let q = "", ans = 0
    if(type===0) { q = `(${a} + ${b}) × ${c}`; ans = (a+b)*c }
    else if(type===1) { q = `${a} × ${b} + ${c}`; ans = (a*b)+c }
    else { q = `${a} + ${b} × ${c}`; ans = a+(b*c) }
    const opts = new Set([ans])
    while(opts.size < 4) opts.add(ans + (Math.floor(Math.random()*10)-5))
    setProb({ q, ans, opts: Array.from(opts).sort((x,y)=>x-y) })
    setFeedback(null)
  }, [])

  if (gameState === "LOBBY") return <Lobby name="PEMDAS Puzzle" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return <GameView name="PEMDAS" stats={stats} prob={prob} feedback={feedback} onAnswer={(o:any)=>{
    if(o===prob.ans) { setStats(s=>({...s,c:s.c+1})); setFeedback({m:"🎯 DIRECT HIT!", t:"correct"}); setTimeout(generate, 1000) }
    else { setStats(s=>({...s,w:s.w+1})); setFeedback({m:"Recalibrating...", t:"wrong"}); }
  }} onExit={()=>setGameState("LOBBY")} />
}

function AlgebraGame({ onExit }: { onExit: () => void }) {
  const [gameState, setGameState] = useState<GameState>("LOBBY")
  const [stats, setStats] = useState({ c: 0, w: 0 }), [prob, setProb] = useState<any>(null), [feedback, setFeedback] = useState<any>(null)

  const generate = useCallback(() => {
    const x = Math.floor(Math.random()*10)+1, a = Math.floor(Math.random()*5)+2, b = Math.floor(Math.random()*10)+1
    const ans = x
    const c = a * x + b
    const q = `${a}x + ${b} = ${c}`
    const opts = new Set([ans])
    while(opts.size < 4) opts.add(Math.max(1, ans + (Math.floor(Math.random()*6)-3)))
    setProb({ q, ans, opts: Array.from(opts).sort((x,y)=>x-y) })
    setFeedback(null)
  }, [])

  if (gameState === "LOBBY") return <Lobby name="Algebra Arena" onStart={() => { setGameState("PLAYING"); generate(); }} onExit={onExit} />
  return <GameView name="Algebra" stats={stats} prob={prob} feedback={feedback} onAnswer={(o:any)=>{
    if(o===prob.ans) { setStats(s=>({...s,c:s.c+1})); setFeedback({m:"💪 MASTERED!", t:"correct"}); setTimeout(generate, 1000) }
    else { setStats(s=>({...s,w:s.w+1})); setFeedback({m:"Keep solving!", t:"wrong"}); }
  }} onExit={()=>setGameState("LOBBY")} />
}

function Lobby({ name, onStart, onExit }: any) {
  return (
    <div className="game-container pokemon-theme">
      <div className="card lobby">
        <h2>{name}</h2>
        <p>Ready Owen? Your training begins now.</p>
        <button onClick={onStart} className="start-btn">Start! ⚔️</button>
        <button onClick={onExit} className="exit-btn">Back to Hub 🏠</button>
      </div>
    </div>
  )
}

function GameView({ stats, prob, feedback, onAnswer, onExit }: any) {
  return (
    <div className="game-container pokemon-theme">
      <div className="card playing">
        <header className="game-status">Score: {stats.c} | Mistakes: {stats.w}</header>
        <div className="problem-area"><div className="problem">{prob?.q}</div></div>
        <div className="options">
          {prob?.opts.map((o:any) => <button key={o} className="option-btn" onClick={()=>onAnswer(o)}>{o}</button>)}
        </div>
        {feedback && <div className={`feedback-box ${feedback.t}`}>{feedback.m}</div>}
        <button className="exit-btn" onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}

export default App