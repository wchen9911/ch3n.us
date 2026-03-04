import { useState, useEffect, useCallback } from 'react'
import './App.css'

type GameState = 'LOBBY' | 'PLAYING' | 'SUMMARY'

function App() {
  const [gameState, setGameState] = useState<GameState>('LOBBY')
  const [score, setScore] = useState(0)
  const [currentProblem, setCurrentProblem] = useState({ a: 1, b: 1 })
  const [options, setOptions] = useState<number[]>([])
  const [questionCount, setQuestionCount] = useState(0)
  const [feedback, setFeedback] = useState<{msg: string, type: 'correct' | 'wrong'} | null>(null)

  const generateProblem = useCallback(() => {
    const a = Math.floor(Math.random() * 12) + 1
    const b = Math.floor(Math.random() * 12) + 1
    const correct = a * b
    
    // Generate distractors
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
  }, [])

  const startGame = () => {
    setScore(0)
    setQuestionCount(0)
    setGameState('PLAYING')
    generateProblem()
  }

  const handleAnswer = (answer: number) => {
    if (feedback) return // Prevent double-clicking

    const isCorrect = answer === currentProblem.a * currentProblem.b
    if (isCorrect) {
      setScore(s => s + 1)
      setFeedback({ msg: '🌟 Correct! Great job!', type: 'correct' })
    } else {
      setFeedback({ msg: `Oops! The answer was ${currentProblem.a * currentProblem.b}`, type: 'wrong' })
    }

    setTimeout(() => {
      if (questionCount + 1 >= 10) {
        setGameState('SUMMARY')
      } else {
        setQuestionCount(q => q + 1)
        generateProblem()
      }
    }, 1500)
  }

  return (
    <div className="game-container">
      <header className="game-header">
        <h1>ch3n.us Math Hub</h1>
        <p className="subtitle">Fun Games for Elementary Learners</p>
      </header>

      {gameState === 'LOBBY' && (
        <div className="card lobby">
          <h2>Game 1: Multiplication Quest</h2>
          <p>Master your 1 to 12 tables! Can you get 10/10?</p>
          <button onClick={startGame} className="start-btn">🚀 Start Playing!</button>
          <div className="upcoming">
            <p>More games coming soon: Addition Dash, Fraction Fun, and more!</p>
          </div>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <div className="card playing">
          <div className="stats">
            <span>Score: {score}</span>
            <span>Question: {questionCount + 1}/10</span>
          </div>
          <div className="problem">
            {currentProblem.a} × {currentProblem.b} = ?
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
            <div className={`feedback ${feedback.type}`}>
              {feedback.msg}
            </div>
          )}
        </div>
      )}

      {gameState === 'SUMMARY' && (
        <div className="card summary">
          <h2>Game Complete!</h2>
          <div className="final-score">
            You got <span>{score}</span> out of 10!
          </div>
          <p>{score === 10 ? "🏆 Perfect Score! You're a Math Wizard!" : "Great effort! Keep practicing!"}</p>
          <button onClick={startGame}>Play Again</button>
          <button onClick={() => setGameState('LOBBY')} className="secondary">Main Menu</button>
        </div>
      )}
    </div>
  )
}

export default App
