"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import { baseUrl } from "@/lib/baseUrl";

type Lesson = {
  id: number;
  title: string;
  topic?: string[];
  created_at?: string;
};

const LESSONS_URL = `${baseUrl}/activities/lessons/`;
const CREATE_LESSON_URL = `${baseUrl}/activities/lessons/create/`;
const DELETE_LESSON_URL = (id: number) => `${baseUrl}/activities/lessons/${id}/`;

export default function TopicsPage() {
  const router = useRouter();
  const { apiCall, logout } = useApi();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [topicText, setTopicText] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Rough safe limit so original + prompts + rewritten text fit in gpt-3.5-turbo (16k ctx).
  // ~4 chars per token => 15,000 chars ≈ 3,750 tokens (leaves room for instructions and AI output).
  const TOPIC_CHAR_LIMIT = 15000;

  async function loadLessons() {
    setLoading(true);
    setError("");
    try {
      const res = await apiCall(LESSONS_URL, { method: "GET" });
      if (!res.ok) throw new Error(`Failed to load topics (${res.status})`);
      const data = await res.json();
      setLessons(Array.isArray(data) ? data : data.results ?? []);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function createLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setCreateError("Title is required");
      return;
    }
    if (!topicText.trim()) {
      setCreateError("Please enter your topic content");
      return;
    }
    if (topicText.length > TOPIC_CHAR_LIMIT) {
      setCreateError(`Content exceeds limit of ${TOPIC_CHAR_LIMIT.toLocaleString()} characters.`);
      return;
    }
    setCreating(true);
    setCreateError("");
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("topic", topicText.trim());
      const res = await apiCall(CREATE_LESSON_URL, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create topic (${res.status})`);
      }
      setTitle("");
      setTopicText("");
      loadLessons();
    } catch (e: any) {
      setCreateError(e.message || "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  async function deleteLesson(id: number) {
    if (!confirm("Are you sure you want to delete this topic?")) return;
    setDeletingId(id);
    try {
      const res = await apiCall(DELETE_LESSON_URL(id), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete topic");
      setLessons((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      alert("Could not delete topic.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    loadLessons();
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-100 flex flex-col">
      <header className="w-full py-8 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white drop-shadow-lg tracking-tight">
              StudyFun Dashboard
            </h1>
            <p className="text-lg text-blue-100 mt-1 font-light">
              Your topics, your way. Learn, create, and have fun!
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-xl bg-pink-500 px-5 py-2 text-white font-semibold shadow hover:bg-pink-600 transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-2 py-8">
        {/* Add Topic Form */}
        <form
          onSubmit={createLesson}
          className="w-full max-w-xl bg-white/90 rounded-2xl shadow-xl p-8 mb-10 flex flex-col items-center animate-fade-in"
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-4 tracking-tight">
            Add a New Topic
          </h2>
          {createError && (
            <div className="w-full mb-3 rounded-lg bg-red-100 text-red-700 px-4 py-2 text-sm text-center">
              {createError}
            </div>
          )}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-lg border-2 border-blue-200 focus:border-blue-500 outline-none text-lg font-medium transition"
            placeholder="Topic Title (e.g. Introduction to Biology)"
            disabled={creating}
            maxLength={100}
            required
          />
          <textarea
            value={topicText}
            onChange={(e) => {
              const v = e.target.value;
              if (v.length <= TOPIC_CHAR_LIMIT) setTopicText(v);
            }}
            className="w-full mb-2 px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 outline-none text-base font-normal transition min-h-[100px] resize-vertical"
            placeholder="Type or paste your topic content here..."
            disabled={creating}
            maxLength={TOPIC_CHAR_LIMIT}
            required
          />
          <div className="w-full mb-4 text-xs flex justify-between text-gray-500">
            <span>
              {topicText.length.toLocaleString()} / {TOPIC_CHAR_LIMIT.toLocaleString()} chars
              {"  "}(~{Math.ceil(topicText.length / 4).toLocaleString()} tokens est.)
            </span>
            {topicText.length >= TOPIC_CHAR_LIMIT && (
              <span className="text-red-500 font-semibold">Limit reached</span>
            )}
          </div>
          <button
            type="submit"
            disabled={creating || topicText.length === 0 || topicText.length > TOPIC_CHAR_LIMIT}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-lg shadow disabled:opacity-60 disabled:cursor-not-allowed hover:scale-105 transition-transform"
          >
            {creating ? "Adding..." : "Add Topic"}
          </button>
        </form>

        {/* Topics List */}
        <section className="w-full max-w-4xl">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-2xl bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-100 text-red-700 p-4 text-center font-semibold">
              {error}
            </div>
          ) : lessons.length === 0 ? (
            <div className="rounded-xl bg-white/80 text-blue-700 p-6 text-center font-semibold shadow">
              No topics yet. Add your first topic above!
            </div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {lessons.map((lesson, idx) => (
                <li
                  key={lesson.id}
                  className="relative group bg-white rounded-2xl shadow-lg p-6 flex flex-col justify-between border-2 border-transparent hover:border-blue-400 transition-all animate-slide-in"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <Link
                    href={`/lesson/${lesson.id}`}
                    className="flex-1"
                  >
                    <h3 className="text-xl font-bold text-blue-700 mb-2 group-hover:underline">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600 text-base line-clamp-3">
                      {lesson.topic?.[0]?.slice(0, 120) || "No content"}
                    </p>
                  </Link>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-gray-400">
                      {lesson.created_at
                        ? new Date(lesson.created_at).toLocaleDateString()
                        : ""}
                    </span>
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      disabled={deletingId === lesson.id}
                      className="ml-2 px-3 py-1 rounded-lg bg-red-100 text-red-600 font-semibold hover:bg-red-200 transition text-sm"
                    >
                      {deletingId === lesson.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.7s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animate-slide-in {
          animation: slideIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px);}
          to { opacity: 1; transform: none;}
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-40px);}
          to { opacity: 1; transform: none;}
        }
      `}</style>
    </div>
  );
}
