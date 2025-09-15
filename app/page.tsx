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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white px-4 sm:px-6 lg:px-8">
      {/* Animated Title */}
      <motion.h1
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="mb-6 text-3xl font-extrabold text-center sm:text-4xl md:text-5xl lg:text-6xl"
      >
        Welcome to{" "}
        <span className="text-yellow-300 block sm:inline">StudyFun</span> 🎓
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mb-8 sm:mb-10 max-w-xs sm:max-w-md lg:max-w-lg text-center text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed"
      >
        Learn smarter, not harder. Your lessons, slides, and quizzes all in one
        place.
      </motion.p>

      {/* Buttons */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-xs sm:max-w-none sm:w-auto"
      >
        <button
          onClick={() => router.push("/login")}
          className="w-full sm:w-auto rounded-lg bg-white px-6 py-3 sm:py-2 text-blue-600 font-semibold shadow-lg transition-all duration-300 hover:bg-gray-100 hover:scale-105 active:scale-95 text-base sm:text-sm lg:text-base"
        >
          Login
        </button>
        <button
          onClick={() => router.push("/signup")}
          className="w-full sm:w-auto rounded-lg bg-yellow-400 px-6 py-3 sm:py-2 text-blue-800 font-semibold shadow-lg transition-all duration-300 hover:bg-yellow-300 hover:scale-105 active:scale-95 text-base sm:text-sm lg:text-base"
        >
          Sign Up
        </button>
      </motion.div>

      {/* Additional decorative elements for larger screens */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="hidden lg:block absolute top-10 left-10 text-6xl opacity-20"
      >
        📚
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 1 }}
        className="hidden lg:block absolute top-20 right-20 text-5xl opacity-20"
      >
        🚀
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.9, duration: 1 }}
        className="hidden lg:block absolute bottom-20 left-20 text-4xl opacity-20"
      >
        💡
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.1, duration: 1 }}
        className="hidden lg:block absolute bottom-10 right-10 text-5xl opacity-20"
      >
        🎯
      </motion.div>
    </div>
  );
}
