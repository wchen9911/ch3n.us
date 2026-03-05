import { useState, useEffect, useCallback, useRef } from 'react'
import './App.css'

type GameState = 'LOBBY' | 'PLAYING' | 'SUMMARY'

const QUESTION_TIME = 10 // 10 seconds per question

function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [score, setScore] = useState(0)
  const [currentProblem, setCurrentProblem] = useState({ a: 1, b: 1 })
  const [options, setOptions] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [feedback, setFeedback] = useState<{msg: string, type: 'correct' | 'wrong'} | null>(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const generateProblem = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1
    const b = Math.floor(Math.random() * 12) + 1
    const correct = a * b
    
    const distractors = new Set<number>()
    while(distractors.size < 3) {
      const offset = Math.floor(Math.random() * 5) + 1
      const dist = Math.random() > 0.5 ? correct + offset : Math.max(1, correct - offset)
      if (dist !== correct) distractors.add(dist)
    }
    
    const allOptions = Array.from(distractors)
    allOptions.push(correct)
    allOptions.sort(() => Math.random() - 0.5)
    
    setCurrentProblem({ a, b })
    setOptions(allOptions)
    setFeedback(null)
    setTimeLeft(QUESTION_TIME)
  }, [])

  const handleNext = useCallback(() => {
    if (questionCount + 1 >= 10) {
      setGameState('SUMMARY')
    } else {
      setQuestionCount(q => q + 1)
      generateProblem()
    }
  }, [questionCount, generateProblem])

  // Timer logic
  useEffect(() => {
    if (gameState === 'PLAYING' && !feedback) {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      } else {
        setFeedback({ msg: `Time's Up! The answer was ${currentProblem.a * currentProblem.b}`, type: 'wrong' })
        setTimeout(handleNext, 2000)
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [gameState, timeLeft, feedback, currentProblem, handleNext])

  const startGame = () => {
    setScore(0)
    setQuestionCount(0)
    setGameState('PLAYING')
    generateProblem()
  }

  const handleAnswer = (answer: number) => {
    if (feedback) return 

    if (timerRef.current) clearTimeout(timerRef.current)

    const isCorrect = answer === currentProblem.a * currentProblem.b
    if (isCorrect) {
      setScore(s => s + 1)
      setFeedback({ msg: '💥 CRITICAL HIT! Wild Problem fainted!', type: 'correct' })
    } else {
      setFeedback({ msg: `It's not very effective... It was ${currentProblem.a * currentProblem.b}`, type: 'wrong' })
    }

    setTimeout(handleNext, 1500)
  }

  return (
    <div className="game-container pokemon-theme">
      <header className="game-header">
        <h1>ch3n.us Math Hub</h1>
        <p className="subtitle">Become a Math Master!</p>
      </header>

      {gameState === 'LOBBY' && (
        <div className="card lobby">
          <div className="pokeball-decoration top"></div>
          <h2>Multiplication Battle!</h2>
          <p>Defeat 10 wild problems to win the Badge!</p>
          <p className="rules">⚡ {QUESTION_TIME} seconds per battle ⚡</p>
          <button onClick={startGame} className="start-btn">Battle! ⚔️</button>
          <div className="pokeball-decoration bottom"></div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="card playing">
          <div className="battle-info">
            <div className="trainer-stats">
              <span className="label">TRAINER SCORE:</span> {score}
            </div>
            <div className="battle-count">
              BATTLE {questionCount + 1}/10
            </div>
          </div>
          
          <div className="timer-bar-container">
            <div 
              className={`timer-bar ${timeLeft < 4 ? 'low' : ''}`} 
              style={{ width: `${(timeLeft / QUESTION_TIME) * 100}%` }}
            ></div>
          </div>
          <div className="timer-text">{timeLeft}s remaining!</div>

          <div className="problem-area">
            <div className="wild-tag">A wild problem appeared!</div>
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
          
          {feedback && (
            <div className={`feedback-box ${feedback.type}`}>
              {feedback.msg}
            </div>
          )}
        </div>
      )}

      {gameState === 'SUMMARY' && (
        <div className="card summary">
          <div className="victory-banner">VICTORY!</div>
          <h2>Battle Summary</h2>
          <div className="final-score">
            You defeated <span>{score}</span> wild problems!
          </div>
          <p className="rank">
            {score === 10 ? "🏆 Rank: Math Master" : score > 7 ? "🥈 Rank: Ace Trainer" : "🥉 Rank: Rookie"}
          </p>
          <div className="actions">
            <button onClick={startGame}>Rematch</button>
            <button onClick={() => setGameState('LOBBY')} className="secondary">Exit to Hub</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
