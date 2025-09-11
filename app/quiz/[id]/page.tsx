"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { baseUrl } from "@/lib/baseUrl";
import { useApi } from "@/hooks/useApi";

type Lesson = {
  id: number;
  title: string;
  quiz?: string;
};

type Question = {
  question: string;
  options: { [key: string]: string };
  correctAnswer: string;
};

type QuizResult = {
  score: number;
  totalQuestions: number;
  percentage: number;
  feedback: string;
  questionResults: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    explanation: string;
  }[];
};

const API_BASE = baseUrl;

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { apiCall } = useApi();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);

  async function loadLesson() {
    setLoading(true);
    setError("");

    try {
      const res = await apiCall(`${API_BASE}/activities/lessons/${id}/`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error(`Failed to load lesson (${res.status})`);

      const data: Lesson = await res.json();
      setLesson(data);
      
      if (data.quiz) {
        parseQuiz(data.quiz);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function parseQuiz(quizText: string) {
    try {
      // Normalize line endings
      const raw = quizText.replace(/\r/g, "").trim();

      // Optional: extract final answer key if present (e.g. "Answers: 1. C 2. A 3. D 4. B 5. C")
      const answerKeyRegex = /answers?:\s*((?:\d+\s*[\.\-]?\s*[A-D]\s*)+)/i;
      let answerMap: Record<number, string> = {};
      const answerKeyMatch = raw.match(answerKeyRegex);
      if (answerKeyMatch) {
        const pairs = answerKeyMatch[1].match(/\d+\s*[.\-]?\s*[A-D]/gi) || [];
        pairs.forEach(p => {
          const m = p.match(/(\d+)\s*[.\-]?\s*([A-D])/i);
          if (m) {
            answerMap[parseInt(m[1], 10) - 1] = m[2].toUpperCase();
          }
        });
      }

      // Split into question blocks
      const blocks = raw
        .split(/\n(?=\d+\.\s|Question\s*\d+\s*[:.])/i)
        .filter(b => b.trim().match(/^\d+\.|^Question\s*\d+/i));

      const parsed: Question[] = [];

      blocks.forEach((block, idx) => {
        const lines = block.split("\n").map(l => l.trim()).filter(Boolean);

        // First line = question line
        let qLine = lines.shift() || "";
        // Remove numbering like "1. " or "Question 1:"
        qLine = qLine.replace(/^Question\s*\d+\s*[:.\-]?\s*/i, "")
                     .replace(/^\d+\.\s*/, "")
                     .trim();

        const options: Record<string, string> = {};
        let inlineCorrect: string | null = null;

        lines.forEach(line => {
          // Option lines
          const optMatch = line.match(/^([A-D])[\).\-\:]\s*(.+)$/);
          if (optMatch) {
              const letter = optMatch[1].toUpperCase();
              let text = optMatch[2].trim();
              // Remove trailing markers like "(correct)" from option text
              const correctTag = text.match(/\b(correct|answer)\b/i);
              if (correctTag && !inlineCorrect) inlineCorrect = letter;
              text = text.replace(/\b(correct|answer)\b/ig, "").trim();
              options[letter] = text;
              return;
          }

          // Standalone correct line inside block
          const answerLine = line.match(/(correct answer|answer)\s*[:\-]\s*([A-D])/i);
          if (answerLine) {
            inlineCorrect = answerLine[2].toUpperCase();
          }
        });

        // Fallback: answer key mapping
        const correct = (inlineCorrect || answerMap[idx] || "A").toUpperCase();

        parsed.push({
          question: qLine,
          options,
          correctAnswer: correct,
        });
      });

      setQuestions(parsed);

      // Debug log
      console.log("Parsed quiz:", parsed);
    } catch (e) {
      console.error("Failed to parse quiz:", e);
      setError("Failed to parse quiz format");
    }
  }

  function handleAnswerChange(questionIndex: number, answer: string) {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: answer.toUpperCase() }));
  }

  async function submitQuiz() {
    if (Object.keys(userAnswers).length !== questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setSubmitting(true);
    try {
      const quizData = {
        questions: questions.map((q, index) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer.toUpperCase(),
          userAnswer: (userAnswers[index] || "").toUpperCase(),
        })),
      };
      console.log("Sending quizData:", quizData); // debug
      const res = await apiCall(`${API_BASE}/activities/lessons/${id}/grade-quiz/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quizData),
      });
      if (!res.ok) throw new Error("Failed to grade quiz");
      const result: QuizResult = await res.json();
      setResult(result);
    } catch (err: any) {
      setError(err.message || "Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    loadLesson();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md">
          <div className="text-red-600 text-center">
            <h2 className="text-xl font-bold mb-2">Error</h2>
            <p>{error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100">
      <header className="w-full py-6 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-white">
            Quiz: {lesson?.title}
          </h1>
          <p className="text-blue-100 mt-1">
            Test your knowledge on this topic
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Answer all questions
              </h2>
              <p className="text-gray-600">
                {questions.length} questions • Choose the best answer for each
              </p>
            </div>

            <div className="space-y-8">
              {questions.map((question, questionIndex) => (
                <div key={questionIndex} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {questionIndex + 1}. {question.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.entries(question.options).map(([letter, text]) => (
                      <label
                        key={letter}
                        className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          userAnswers[questionIndex] === letter
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          value={letter}
                          checked={userAnswers[questionIndex] === letter}
                          onChange={() => handleAnswerChange(questionIndex, letter)}
                          className="mt-1 mr-3 text-blue-600"
                        />
                        <span className="font-medium text-blue-600 mr-2">{letter})</span>
                        <span className="text-gray-700">{text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={submitQuiz}
                disabled={submitting || Object.keys(userAnswers).length !== questions.length}
                className="px-8 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold text-lg rounded-lg shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {submitting ? 'Grading...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 ${
                result.percentage >= 70 ? 'bg-green-100' : result.percentage >= 50 ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                <span className={`text-3xl font-bold ${
                  result.percentage >= 70 ? 'text-green-600' : result.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {Math.round(result.percentage)}%
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Quiz Complete!
              </h2>
              <p className="text-gray-600">
                You scored {result.score} out of {result.totalQuestions} questions correctly
              </p>
            </div>

            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">AI Feedback:</h3>
              <p className="text-blue-700">{result.feedback}</p>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800">Detailed Results:</h3>
              {result.questionResults.map((questionResult, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  questionResult.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                }`}>
                  <p className="font-semibold text-gray-800 mb-2">
                    {index + 1}. {questionResult.question}
                  </p>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Your answer: </span>
                      <span className={questionResult.isCorrect ? 'text-green-600' : 'text-red-600'}>
                        {questionResult.userAnswer}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Correct answer: </span>
                      <span className="text-green-600">{questionResult.correctAnswer}</span>
                    </div>
                  </div>
                  {questionResult.explanation && (
                    <p className="mt-2 text-gray-700 text-sm italic">
                      {questionResult.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => router.push(`/lesson/${id}`)}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Review Lesson
              </button>
              <button
                onClick={() => router.push('/topics')}
                className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
              >
                Back to Topics
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
