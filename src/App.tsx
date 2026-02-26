import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Share2 } from 'lucide-react';
import { QUESTIONS, UI_TEXT } from './constants';
import { getCharacterResult, QuizResult } from './services/gemini';

type AppState = 'intro' | 'quiz' | 'loading' | 'result';
type Language = 'it' | 'en';

export default function App() {
  const [appState, setAppState] = useState<AppState>('intro');
  const [lang, setLang] = useState<Language>('it');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const t = UI_TEXT[lang];
  const questions = QUESTIONS[lang];

  const handleStart = () => {
    setAppState('quiz');
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setResult(null);
    setImageUrl(null);
    setError(null);
  };

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setAnswers(prev => prev.slice(0, -1));
    }
  };

  const handleAnswer = async (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setAppState('loading');
      try {
        const res = await getCharacterResult(newAnswers, lang);
        setResult(res);
        
        if (res.wikiSearchTerm) {
          try {
            const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(res.wikiSearchTerm)}&prop=pageimages&format=json&pithumbsize=500&origin=*`);
            const wikiData = await wikiRes.json();
            const pages = wikiData.query?.pages;
            if (pages) {
              const pageId = Object.keys(pages)[0];
              if (pageId !== '-1' && pages[pageId].thumbnail) {
                setImageUrl(pages[pageId].thumbnail.source);
              }
            }
          } catch (e) {
            console.error("Wiki fetch failed", e);
          }
        }
        
        setAppState('result');
      } catch (err) {
        console.error(err);
        setError(t.error);
        setAppState('intro');
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-1 bg-white/50 backdrop-blur-md p-1 rounded-full border border-bougie-accent/50 shadow-sm">
        <button 
          onClick={() => setLang('it')}
          className={`px-3 py-1.5 rounded-full flex items-center justify-center text-xs font-bold tracking-wider transition-all ${lang === 'it' ? 'bg-white shadow-sm scale-105 text-bougie-ink' : 'opacity-50 hover:opacity-100 text-bougie-ink'}`}
          title="Italiano"
        >
          IT
        </button>
        <button 
          onClick={() => setLang('en')}
          className={`px-3 py-1.5 rounded-full flex items-center justify-center text-xs font-bold tracking-wider transition-all ${lang === 'en' ? 'bg-white shadow-sm scale-105 text-bougie-ink' : 'opacity-50 hover:opacity-100 text-bougie-ink'}`}
          title="English"
        >
          ENG
        </button>
      </div>

      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none opacity-30">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-orange-100 to-transparent blur-3xl" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tl from-stone-200 to-transparent blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {appState === 'intro' && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full text-center space-y-8"
          >
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.2em] font-medium text-bougie-ink/60">
                {t.subtitle}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl leading-tight">
                {t.title1} <span className="italic">{t.title2}</span> {t.title3}
              </h1>
              <p className="text-bougie-ink/70 font-light text-sm md:text-base px-4">
                {t.description}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-800 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}

            <button
              onClick={handleStart}
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-bougie-ink text-bougie-bg rounded-full overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span className="relative z-10 font-medium tracking-wide text-sm uppercase">
                {t.startBtn}
              </span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}

        {appState === 'quiz' && (
          <motion.div
            key={`quiz-${currentQuestionIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-lg w-full space-y-10"
          >
            <div className="space-y-6 text-center">
              <div className="flex items-center justify-between mb-8">
                <div className="w-24 text-left">
                  {currentQuestionIndex > 0 && (
                    <button
                      onClick={handleBack}
                      className="p-2 -ml-2 text-bougie-ink/50 hover:text-bougie-ink transition-colors flex items-center gap-1 text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">{t.back}</span>
                    </button>
                  )}
                </div>
                <div className="flex justify-center gap-2">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all duration-500 ${
                        idx === currentQuestionIndex
                          ? 'w-8 bg-bougie-ink'
                          : idx < currentQuestionIndex
                          ? 'w-2 bg-bougie-ink/40'
                          : 'w-2 bg-bougie-accent'
                      }`}
                    />
                  ))}
                </div>
                <div className="w-24" />
              </div>
              <h2 className="font-serif text-3xl md:text-4xl leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option)}
                  className="w-full text-left p-5 rounded-2xl border border-bougie-accent bg-white/50 backdrop-blur-sm hover:bg-bougie-ink hover:text-bougie-bg hover:border-bougie-ink transition-all duration-300 group"
                >
                  <span className="font-light text-sm md:text-base leading-relaxed">
                    {option}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {appState === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-bougie-ink/40" />
            </motion.div>
            <p className="font-serif italic text-xl text-bougie-ink/60 animate-pulse">
              {t.loading}
            </p>
          </motion.div>
        )}

        {appState === 'result' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md w-full space-y-8"
          >
            <div 
              className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-bougie-accent/50 relative overflow-hidden transition-all duration-1000"
              style={{ boxShadow: `0 20px 40px -10px ${result.auraColor}30` }}
            >
              {/* Decorative aura blob */}
              <div 
                className="absolute -top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-1000" 
                style={{ backgroundColor: result.auraColor }}
              />
              
              <div className="relative z-10 space-y-8 flex flex-col items-center">
                {imageUrl && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-xl"
                  >
                    <img src={imageUrl} alt={result.character} className="w-full h-full object-cover" crossOrigin="anonymous" />
                  </motion.div>
                )}

                <div className="space-y-3 text-center">
                  <div 
                    className="inline-block px-4 py-1.5 rounded-full bg-white border shadow-sm text-[10px] uppercase tracking-widest font-bold"
                    style={{ color: result.auraColor, borderColor: `${result.auraColor}40` }}
                  >
                    {result.vibeScore}
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-bougie-ink/50 mt-4">
                    {t.alterEgo}
                  </p>
                  <h2 className="font-serif text-3xl md:text-4xl leading-tight">
                    {result.character}
                  </h2>
                  <p className="text-sm font-medium text-bougie-ink/60 italic">
                    {t.from} {result.mediaSource}
                  </p>
                </div>

                <div className="space-y-4 w-full">
                  <p className="text-sm font-light leading-relaxed text-bougie-ink/80 text-center">
                    {result.justification}
                  </p>
                </div>

                <div className="py-6 border-y border-bougie-accent/50 text-center w-full">
                  <p className="font-serif italic text-xl md:text-2xl leading-snug">
                    "{result.unhinged}"
                  </p>
                </div>

                <div className="space-y-4 text-center w-full">
                  <p className="text-xs font-medium uppercase tracking-wider text-bougie-ink/40">
                    {t.captionLabel}
                  </p>
                  <p className="text-sm font-medium">
                    {result.caption}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-2 pt-2 w-full">
                  {result.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-bougie-bg rounded-full text-[10px] uppercase tracking-wider text-bougie-ink/60 border border-bougie-accent/50">
                      #{tag.replace(/^#/, '').replace(/\s+/g, '')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStart}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-bougie-ink/20 hover:bg-bougie-ink/5 transition-colors text-sm font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                {t.retake}
              </button>
              <button
                onClick={() => {
                  const shareText = t.shareText.replace('{character}', result.character).replace('{caption}', result.caption);
                  if (navigator.share) {
                    navigator.share({
                      title: t.subtitle,
                      text: shareText,
                      url: window.location.href,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert(t.copied);
                  }
                }}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-bougie-ink text-bougie-bg rounded-full hover:bg-bougie-ink/90 transition-colors text-sm font-medium"
              >
                <Share2 className="w-4 h-4" />
                {t.share}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
