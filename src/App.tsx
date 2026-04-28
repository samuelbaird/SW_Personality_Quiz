import { AnimatePresence } from 'framer-motion'
import { LoadingScreen } from './components/LoadingScreen'
import { useQuiz } from './hooks/useQuiz'
import { Home } from './pages/Home'
import { Quiz } from './pages/Quiz'
import { Result } from './pages/Result'

function App() {
  const {
    screen,
    questions,
    answers,
    activeQuestion,
    progress,
    result,
    error,
    startQuiz,
    updateAnswer,
    goNext,
    goBack,
    submitQuiz,
    tryAgain,
  } = useQuiz()

  return (
    <main className="relative min-h-screen px-4 py-10 text-slate-100">
      {/* z-0 (not negative): negative z-index can paint behind <body> and hide the image */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/imperial-corridor-bg.png')" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px]" aria-hidden />
        <div
          className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(30,64,175,0.22),transparent_55%),radial-gradient(circle_at_bottom,rgba(190,24,93,0.12),transparent_42%)]"
          aria-hidden
        />
      </div>

      <div className="relative z-10">
        <AnimatePresence mode="wait">
        {screen === 'home' ? <Home key="home" onStart={startQuiz} /> : null}

        {screen === 'quiz' ? (
          <Quiz
            key="quiz"
            questions={questions}
            answers={answers}
            activeQuestion={activeQuestion}
            progress={progress}
            error={error}
            onAnswerChange={updateAnswer}
            onBack={goBack}
            onNext={goNext}
            onSubmit={() => {
              void submitQuiz()
            }}
          />
        ) : null}

        {screen === 'loading' ? <LoadingScreen key="loading" /> : null}

        {screen === 'result' && result ? <Result key="result" result={result} onTryAgain={tryAgain} /> : null}
        </AnimatePresence>
      </div>
    </main>
  )
}

export default App
