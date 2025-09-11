"use client";

import { useEffect, useState } from "react";
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
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

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

  function handleNext() {
    if (lesson && currentSlide < lesson.topic.length - 1 && !isAnimating) {
      setSlideDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
        setSlideDirection(null);
      }, 300);
    }
  }

  function handlePrev() {
    if (currentSlide > 0 && !isAnimating) {
      setSlideDirection('prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setIsAnimating(false);
        setSlideDirection(null);
      }, 300);
    }
  }

  function handleSlideClick(index: number) {
    if (index !== currentSlide && !isAnimating) {
      setSlideDirection(index > currentSlide ? 'next' : 'prev');
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(index);
        setIsAnimating(false);
        setSlideDirection(null);
      }, 300);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-teal-100 flex items-center justify-center">
        <div className="text-center animate-bounce">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-xl font-bold text-gray-700" style={{ fontFamily: 'Times New Roman, serif' }}>
            Loading your lesson... 📚
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center max-w-md">
          <div className="text-6xl mb-4">😵</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 mb-4" style={{ fontFamily: 'Times New Roman, serif', fontSize: '15px' }}>
            {error}
          </p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:scale-105 transition-transform"
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
        <div className="max-w-5xl mx-auto px-6 py-8">
          {lesson && (
            <div className="text-center">
              <div className="text-4xl mb-2">📖</div>
              <h1 
                className="text-3xl font-bold text-white drop-shadow-lg" 
                style={{ fontFamily: 'Times New Roman, serif' }}
              >
                {lesson.title}
              </h1>
              <p className="text-blue-100 mt-2" style={{ fontFamily: 'Times New Roman, serif', fontSize: '15px' }}>
                Interactive Learning Experience
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!loading && !error && lesson && (
          <div className="space-y-8">
            {/* Progress Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-600" style={{ fontFamily: 'Times New Roman, serif' }}>
                  Progress: {currentSlide + 1} of {lesson.topic.length}
                </span>
                <span className="text-2xl">
                  {currentSlide === lesson.topic.length - 1 ? '🎉' : '🚀'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${((currentSlide + 1) / lesson.topic.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Main Slide Content */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative h-[500px] flex items-center justify-center p-8">
                <div 
                  className={`absolute inset-0 p-8 flex items-center justify-center transition-all duration-300 ${
                    slideDirection === 'next' ? 'animate-slide-out-left' :
                    slideDirection === 'prev' ? 'animate-slide-out-right' :
                    'animate-slide-in'
                  }`}
                >
                  <div className="max-w-4xl w-full text-center">
                    <div className="text-4xl mb-6">
                      {currentSlide === 0 ? '🌟' : 
                       currentSlide === lesson.topic.length - 1 ? '🎯' : 
                       ['💡', '🔍', '🧠', '⭐', '🎨', '🚀'][currentSlide % 6]}
                    </div>
                    <div 
                      className="text-gray-800 leading-relaxed text-justify slide-content"
                      style={{ 
                        fontFamily: 'Times New Roman, serif', 
                        fontSize: '18px',
                        lineHeight: '1.9',
                        letterSpacing: '0.4px'
                      }}
                    >
                      {lesson.topic[currentSlide]?.split('\n').map((paragraph, index) => (
                        <p
                          key={index}
                          className="mb-5 last:mb-0 hover:translate-x-1 transition-transform duration-300"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrev}
                    disabled={currentSlide === 0 || isAnimating}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Times New Roman, serif' }}
                  >
                    <span>⬅️</span>
                    <span>Previous</span>
                  </button>

                  <div className="flex space-x-2">
                    {lesson.topic.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlideClick(index)}
                        className={`w-4 h-4 rounded-full transition-all duration-300 hover:scale-125 ${
                          index === currentSlide 
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 scale-125' 
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        title={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>

                  {currentSlide < lesson.topic.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={isAnimating}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold transition-all hover:scale-105 disabled:opacity-40"
                      style={{ fontFamily: 'Times New Roman, serif' }}
                    >
                      <span>Next</span>
                      <span>➡️</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (lesson.quiz) {
                          router.push(`/quiz/${lesson.id}`);
                        } else {
                          alert("🎊 Congratulations! You've completed this lesson. Quiz coming soon!");
                        }
                      }}
                      className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold transition-all hover:scale-105 animate-pulse"
                      style={{ fontFamily: 'Times New Roman, serif' }}
                    >
                      <span>🎯</span>
                      <span>Start Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fun Facts Section */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                <div className="text-2xl mb-2">💡</div>
                <h3 className="text-lg font-bold text-gray-700 mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
                  Fun Learning Tip
                </h3>
                <p className="text-gray-600" style={{ fontFamily: 'Times New Roman, serif', fontSize: '30px' }}>
                  {[
                    "Take notes as you go through each slide! 📝",
                    "Try to summarize each slide in your own words! 🗣️",
                    "Think about real-world examples that relate to this content! 🌍",
                    "Don't rush - understanding is more important than speed! ⏰",
                    "Feel free to go back and review previous slides! 🔄"
                  ][currentSlide % 5]}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes slide-in {
          0% {
            opacity: 0;
            transform: translateX(60px) rotate(2deg) scale(.92);
            filter: blur(4px);
          }
          45% {
            transform: translateX(-12px) rotate(-1.5deg) scale(1.02);
            filter: blur(0);
          }
          70% {
            transform: translateX(6px) rotate(.6deg) scale(1);
          }
          100% {
            opacity: 1;
            transform: translateX(0) rotate(0) scale(1);
            filter: blur(0);
          }
        }
        @keyframes slide-out-left {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(0) scale(1);
          }
          40% {
            transform: translateX(-25px) rotate(-2deg) scale(.97);
          }
          100% {
            opacity: 0;
            transform: translateX(-120px) rotate(-4deg) scale(.9);
            filter: blur(3px);
          }
        }
        @keyframes slide-out-right {
          0% {
            opacity: 1;
            transform: translateX(0) rotate(0) scale(1);
          }
            40% {
            transform: translateX(25px) rotate(2deg) scale(.97);
          }
          100% {
            opacity: 0;
            transform: translateX(120px) rotate(4deg) scale(.9);
            filter: blur(3px);
          }
        }
        .animate-slide-in {
          animation: slide-in .6s cubic-bezier(.55,.1,.25,1);
        }
        .animate-slide-out-left {
          animation: slide-out-left .38s cubic-bezier(.55,.1,.25,1);
        }
        .animate-slide-out-right {
          animation: slide-out-right .38s cubic-bezier(.55,.1,.25,1);
        }

        /* Fun subtle floating for current emoji */
        .slide-content ~ .emoji-badge {
          animation: bob 4s ease-in-out infinite;
        }
        @keyframes bob {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }

        /* Add a soft highlight flicker on first render of each slide */
        .slide-content p:first-child {
          position: relative;
        }
        .slide-content p:first-child:before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(255,235,150,.35), rgba(255,255,255,0));
          animation: wipe 1.2s ease;
          pointer-events: none;
        }
        @keyframes wipe {
          0% { transform: translateX(-100%); opacity: .9; }
          70% { opacity:.4; }
          100% { transform: translateX(100%); opacity: 0; }
        }
      `}</style>
    </div>
  );
}