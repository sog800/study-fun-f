"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { baseUrl } from "@/lib/baseUrl";

type Lesson = {
  id: number;
  title: string;
  topic: string[];
  quiz?: string;
};

const API_BASE = baseUrl;

export default function LessonPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [slideDirection, setSlideDirection] = useState<"next" | "prev" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null); // NEW

  // Swipe handling
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  async function loadLesson() {
    setLoading(true);
    setError("");
    try {
      const access =
        typeof window !== "undefined" ? localStorage.getItem("access") : null;
      if (!access) {
        router.replace("/login");
        return;
      }

      const res = await fetch(`${API_BASE}/activities/lessons/${id}/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access}`,
        },
      });

      if (res.status === 401) {
        router.replace("/login");
        return;
      }

      if (!res.ok) throw new Error(`Failed to load lesson (${res.status})`);

      const data: Lesson = await res.json();
      setLesson(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLesson();
  }, [id]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(media.matches);
    const t = setTimeout(() => setShowSwipeHint(false), 2500);
    return () => clearTimeout(t);
  }, []);

  // Keyboard navigation (accessible)
  function onKeyDown(e: React.KeyboardEvent) {
    if (isAnimating) return;
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "ArrowLeft") handlePrev();
  }

  // Keyboard navigation and reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener?.("change", onChange);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener?.("change", onChange);
    };
  }, [currentSlide, lesson, isAnimating]);

  function animateThen(callback: () => void, dir: "next" | "prev") {
    if (isAnimating || reducedMotion) {
      // Skip animation if reduced-motion
      callback();
      return;
    }
    setSlideDirection(dir);
    setIsAnimating(true);
    setTimeout(() => {
      callback();
      setIsAnimating(false);
      setSlideDirection(null);
    }, 300);
  }

  function handleNext() {
    if (lesson && currentSlide < lesson.topic.length - 1 && !isAnimating) {
      animateThen(() => setCurrentSlide((s) => s + 1), "next");
    }
  }

  function handlePrev() {
    if (currentSlide > 0 && !isAnimating) {
      animateThen(() => setCurrentSlide((s) => s - 1), "prev");
    }
  }

  function handleSlideClick(index: number) {
    if (!lesson || index === currentSlide || isAnimating) return;
    const dir = index > currentSlide ? "next" : "prev";
    animateThen(() => setCurrentSlide(index), dir);
  }

  // Touch swipe
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = null;
  }
  function onTouchMove(e: React.TouchEvent) {
    touchEndX.current = e.changedTouches[0].clientX;
  }
  function onTouchEnd() {
    if (touchStartX.current == null || touchEndX.current == null) return;
    const delta = touchEndX.current - touchStartX.current;
    const threshold = 50; // px
    if (delta < -threshold) handleNext();
    if (delta > threshold) handlePrev();
    touchStartX.current = null;
    touchEndX.current = null;
  }

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
    // Optionally also ensure the whole window is at top (uncomment if needed):
    // window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentSlide]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 animate-pulse" />
          <p className="text-lg sm:text-xl font-bold text-gray-700" style={{ fontFamily: "Times New Roman, serif" }}>
            Loading your lesson... 📚
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl text-center max-w-sm sm:max-w-md w-full">
          <div className="text-4xl sm:text-6xl mb-4">😵</div>
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2" style={{ fontFamily: "Times New Roman, serif" }}>
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4 text-sm sm:text-base" style={{ fontFamily: "Times New Roman, serif" }}>
            {error}
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-transform text-sm sm:text-base"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100">
      <header className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {lesson && (
            <div className="text-center">
              <div className="text-3xl sm:text-4xl mb-2">📖</div>
              <h1 
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg" 
                style={{ fontFamily: 'Times New Roman, serif' }}
              >
                {lesson.title}
              </h1>
              <p className="text-blue-100 mt-2 text-sm sm:text-base" style={{ fontFamily: 'Times New Roman, serif' }}>
                Interactive Learning Experience
              </p>
            </div>
          )}
        </div>
      </header>

      <main
        className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-24 md:pb-8" // add extra bottom padding for sticky controls
        role="main"
        aria-label="Lesson content"
      >
        {!loading && !error && lesson && (
          <div className="space-y-4 sm:space-y-8">
            {/* Slide */}
            <div
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
              onKeyDown={onKeyDown}
              tabIndex={0}
            >
              <div
                className="relative min-h-[320px] sm:min-h-[420px] lg:min-h-[520px] max-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                role="region"
                aria-live="polite"
                aria-label={`Slide ${currentSlide + 1} of ${lesson.topic.length}`}
              >
                {/* Swipe hint on mobile */}
                {showSwipeHint && (
                  <div className="absolute top-3 right-3 md:hidden text-xs bg-black/60 text-white px-2 py-1 rounded-md animate-fade-in">
                    Swipe ⇄
                  </div>
                )}

                <div
                  ref={scrollContainerRef} // NEW
                  className={`absolute inset-0 p-4 sm:p-6 lg:p-8 flex items-start justify-center transition-all duration-300 overflow-y-auto overscroll-y-contain pr-2`}
                >
                  <div className="max-w-3xl w-full">
                    <div className="text-2xl sm:text-3xl lg:text-4xl mb-4 sm:mb-6 text-center">
                      {currentSlide === 0
                        ? "🌟"
                        : currentSlide === lesson.topic.length - 1
                        ? "🎯"
                        : ["💡", "🔍", "🧠", "⭐", "🎨", "🚀"][currentSlide % 6]}
                    </div>

                    <div
                      className="mx-auto text-gray-800 leading-8 sm:leading-8 lg:leading-9 text-justify"
                      style={{ fontFamily: "Times New Roman, serif" }}
                    >
                      <div className="text-[16px] sm:text-[17px] lg:text-[18px] tracking-[0.3px]">
                        {lesson.topic[currentSlide]?.split("\n").map((paragraph, index) => (
                          <p
                            key={index}
                            className="mb-3 sm:mb-4 lg:mb-5 last:mb-0 hover:translate-x-[2px] transition-transform duration-300"
                          >
                            {paragraph}
                          </p>
                        ))}
                        {/* Add a little bottom padding so last lines aren’t hidden under sticky controls */}
                        <div className="h-3 md:h-0" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop/tablet controls */}
              <div className="hidden md:block bg-gradient-to-r from-purple-50 to-blue-50 p-4 lg:p-6">
                <div className="flex justify-between items-center gap-4">
                  <button
                    onClick={handlePrev}
                    disabled={currentSlide === 0 || isAnimating}
                    aria-label="Previous slide"
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    ⬅️ Previous
                  </button>

                  <div className="flex gap-2">
                    {lesson.topic.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleSlideClick(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
                          i === currentSlide
                            ? "bg-gradient-to-r from-purple-500 to-blue-500 scale-125"
                            : "bg-gray-300 hover:bg-gray-400"
                        }`}
                      />
                    ))}
                  </div>

                  {currentSlide < lesson.topic.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={isAnimating}
                      aria-label="Next slide"
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold transition-all hover:scale-105 disabled:opacity-40"
                      style={{ fontFamily: "Times New Roman, serif" }}
                    >
                      Next ➡️
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (lesson.quiz) router.push(`/quiz/${lesson.id}`);
                        else alert("🎊 Great job! Quiz coming soon!");
                      }}
                      aria-label="Start quiz"
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold transition-all hover:scale-105 animate-pulse"
                      style={{ fontFamily: "Times New Roman, serif" }}
                    >
                      🎯 Start Quiz
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile sticky controls */}
              <div className="md:hidden sticky bottom-0 bg-white/90 backdrop-blur border-t border-gray-200 p-2">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentSlide === 0 || isAnimating}
                    aria-label="Previous slide"
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-700 text-white rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-40"
                    style={{ fontFamily: "Times New Roman, serif" }}
                  >
                    ⬅️ <span>Prev</span>
                  </button>

                  <div className="flex gap-1 overflow-x-auto px-1 max-w-[40%]">
                    {lesson.topic.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handleSlideClick(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          i === currentSlide ? "bg-blue-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>

                  {currentSlide < lesson.topic.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={isAnimating}
                      aria-label="Next slide"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-40"
                      style={{ fontFamily: "Times New Roman, serif" }}
                    >
                      <span>Next</span> ➡️
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (lesson.quiz) router.push(`/quiz/${lesson.id}`);
                        else alert("🎊 Great job! Quiz coming soon!");
                      }}
                      aria-label="Start quiz"
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg font-semibold transition-all active:scale-95"
                      style={{ fontFamily: "Times New Roman, serif" }}
                    >
                      🎯 <span>Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fun Facts Section */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
              <div className="text-center">
                <div className="text-xl sm:text-2xl mb-2">💡</div>
                <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
                  Fun Learning Tip
                </h3>
                <p className="text-gray-600 text-sm sm:text-base" style={{ fontFamily: 'Times New Roman, serif' }}>
                  {[
                    "Take notes as you go through each slide! 📝",
                    "Try to summarize each slide in your own words! 🗣️",
                    "Think about real-world examples that relate to this content! 🌍",
                    "Don&apos;t rush - understanding is more important than speed! ⏰",
                    "Feel free to go back and review previous slides! 🔄"
                  ][currentSlide % 5]}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        .animate-fade-in { animation: fadeIn .6s ease; }
        @keyframes fadeIn { from {opacity:0; transform: translateY(6px)} to {opacity:1; transform:none} }

        @keyframes slide-in {
          0% { opacity: 0; transform: translateX(60px) rotate(1.5deg) scale(.95); filter: blur(3px); }
          60% { transform: translateX(-10px) rotate(-1deg) scale(1.02); filter: blur(0); }
          100% { opacity: 1; transform: translateX(0) rotate(0) scale(1); }
        }
        @keyframes slide-out-left {
          0% { opacity: 1; transform: translateX(0) rotate(0) scale(1); }
          100% { opacity: 0; transform: translateX(-80px) rotate(-3deg) scale(.94); filter: blur(2px); }
        }
        @keyframes slide-out-right {
          0% { opacity: 1; transform: translateX(0) rotate(0) scale(1); }
          100% { opacity: 0; transform: translateX(80px) rotate(3deg) scale(.94); filter: blur(2px); }
        }
        .animate-slide-in { animation: slide-in .55s cubic-bezier(.55,.1,.25,1); }
        .animate-slide-out-left { animation: slide-out-left .35s cubic-bezier(.55,.1,.25,1); }
        .animate-slide-out-right { animation: slide-out-right .35s cubic-bezier(.55,.1,.25,1); }
      `}</style>
    </div>
  );
}