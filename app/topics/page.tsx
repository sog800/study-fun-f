"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";
import { baseUrl } from "@/lib/baseUrl";
import React from "react";

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
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  const TOPIC_CHAR_LIMIT = 15000;
  const MAX_FILE_BYTES = 7 * 1024 * 1024; // 7 MB
  const ALLOWED_EXT = [".pdf", ".ppt", ".pptx"];

  function formatBytes(bytes: number) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B","KB","MB","GB"];
    const i = Math.floor(Math.log(bytes)/Math.log(k));
    return (bytes/Math.pow(k,i)).toFixed(2) + " " + sizes[i];
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError("");
    const f = e.target.files?.[0];
    if (!f) {
      setFile(null);
      return;
    }
    const lower = f.name.toLowerCase();
    if (!ALLOWED_EXT.some(ext => lower.endsWith(ext))) {
      setFile(null);
      setFileError("Unsupported file type. Use PDF or PPT/PPTX.");
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setFile(null);
      setFileError(`File too large. Limit is 7 MB (got ${formatBytes(f.size)}).`);
      return;
    }
    // If a valid file is chosen, optionally clear text input
    setTopicText("");
    setFile(f);
  }

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
    setCreateError("");
    setFileError("");

    if (!title.trim()) {
        setCreateError("Title is required");
        return;
    }
    if (!file && !topicText.trim()) {
        setCreateError("Provide text or upload a file");
        return;
    }
    if (!file && topicText.length > TOPIC_CHAR_LIMIT) {
        setCreateError(`Content exceeds ${TOPIC_CHAR_LIMIT.toLocaleString()} characters.`);
        return;
    }

    setCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (file) {
        formData.append("file", file);
      } else {
        formData.append("topic", topicText.trim());
      }
      const res = await apiCall(CREATE_LESSON_URL, { method: "POST", body: formData });
      if (!res.ok) {
        const errorData = await res.json().catch(()=>({}));
        throw new Error(errorData.error || `Failed (${res.status})`);
      }
      setTitle("");
      setTopicText("");
      setFile(null);
      loadLessons();
    } catch (err: any) {
      setCreateError(err.message || "Could not create lesson");
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
        <form onSubmit={createLesson} className="w-full max-w-xl mx-auto space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Title</label>
          <input
            type="text"
            value={title}
            disabled={creating}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border-2 border-purple-200 focus:border-purple-500 outline-none text-sm sm:text-base"
            placeholder="Enter a descriptive lesson title"
          />
        </div>

        <div className="flex items-center justify-center">
          <span className="text-xs text-gray-500 font-medium tracking-wide">
            Provide text OR upload a file
          </span>
        </div>

        {/* Text area (disabled if file chosen) */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Paste / type content (max {TOPIC_CHAR_LIMIT.toLocaleString()} chars)
          </label>
            <textarea
              value={topicText}
              disabled={creating || !!file}
              onChange={(e) => {
                if (e.target.value.length <= TOPIC_CHAR_LIMIT) setTopicText(e.target.value);
              }}
              placeholder={file ? "Disabled while a file is selected" : "Paste lesson content here..."}
              className="w-full px-4 py-3 min-h-[140px] rounded-lg border-2 border-purple-200 focus:border-purple-500 outline-none text-sm sm:text-base resize-vertical disabled:opacity-60"
            />
          <div className="flex justify-between text-[11px] sm:text-xs text-gray-500">
            <span>
              {topicText.length.toLocaleString()} / {TOPIC_CHAR_LIMIT.toLocaleString()} chars (~{Math.ceil(topicText.length/4).toLocaleString()} tokens)
            </span>
            {topicText.length >= TOPIC_CHAR_LIMIT && (
              <span className="text-red-500 font-semibold">Limit reached</span>
            )}
          </div>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Upload PDF / PPT (max 7 MB)
          </label>
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            disabled={creating}
            onChange={handleFileChange}
            className="w-full text-xs sm:text-sm file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-blue-500 file:to-purple-500 file:text-white file:font-semibold file:text-xs sm:file:text-sm file:cursor-pointer"
          />
          {file && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-md px-3 py-2 text-xs sm:text-sm">
              <div className="truncate">
                <strong className="text-blue-700">{file.name}</strong>
                <span className="text-gray-500 ml-2">{formatBytes(file.size)}</span>
              </div>
              <button
                type="button"
                onClick={() => { setFile(null); setFileError(""); }}
                className="text-red-500 font-semibold ml-3"
              >
                Remove
              </button>
            </div>
          )}
          {fileError && <p className="text-red-500 text-xs font-medium">{fileError}</p>}
          <p className="text-[11px] sm:text-xs text-gray-500 leading-snug">
            Accepted: PDF (.pdf), PowerPoint (.ppt, .pptx). Large documents are internally processed in smart parts (no duplicate intros or conclusions).
          </p>
        </div>

        {createError && (
          <div className="text-red-600 text-xs sm:text-sm font-semibold bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {createError}
          </div>
        )}

        <button
          type="submit"
          disabled={creating || (!!file && fileError !== "") || (!file && topicText.trim().length === 0)}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold text-base sm:text-lg shadow hover:scale-[1.03] active:scale-95 transition disabled:opacity-60 disabled:scale-100"
        >
          {creating ? "Processing..." : "Create Lesson"}
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
