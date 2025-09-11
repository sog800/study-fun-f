"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("access");
    if (token) {
      router.replace("/topics"); // already logged in
    }
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white">
      {/* Animated Title */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-6 text-4xl font-extrabold md:text-5xl"
      >
        Welcome to <span className="text-yellow-300">StudyFun</span> 🎓
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mb-10 max-w-md text-center text-lg text-white/90"
      >
        Learn smarter, not harder. Your lessons, slides, and quizzes all in one
        place.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex gap-4"
      >
        <button
          onClick={() => router.push("/login")}
          className="rounded-lg bg-white px-6 py-2 text-blue-600 shadow-lg transition hover:bg-gray-100"
        >
          Login
        </button>
        <button
          onClick={() => router.push("/signup")}
          className="rounded-lg bg-yellow-400 px-6 py-2 text-blue-800 shadow-lg transition hover:bg-yellow-300"
        >
          Sign Up
        </button>
      </motion.div>
    </div>
  );
}
