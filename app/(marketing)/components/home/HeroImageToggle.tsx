"use client";

import Image from "next/image";
import { useState } from "react";

type ActiveView = "dashboard" | "website";

export default function HeroImageToggle() {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");

  return (
    <>
      <div className="w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-50/50 mb-8">
        <div className="aspect-video bg-gray-100 flex items-center justify-center relative">
          <Image
            src="/second.png"
            alt="Admin dashboard preview"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className={`object-cover transition-opacity duration-500 ${
              activeView === "dashboard" ? "opacity-100" : "opacity-0"
            }`}
          />
          <Image
            src="/first.jpg"
            alt="Club website preview"
            fill
            sizes="(max-width: 1280px) 100vw, 1280px"
            className={`object-cover transition-opacity duration-500 ${
              activeView === "website" ? "opacity-100" : "opacity-0"
            }`}
          />
        </div>
      </div>

      <div className="flex justify-center">
        <div className="relative max-w-2xl w-full">
          <div className="bg-gray-100/50 rounded-2xl p-1.5 backdrop-blur-sm border border-gray-200/50">
            <div className="flex relative">
              <div
                className="absolute top-0 bottom-0 w-1/2 bg-white rounded-xl shadow-sm border border-gray-200/50 transition-transform duration-300"
                style={{
                  transform:
                    activeView === "dashboard"
                      ? "translateX(0%)"
                      : "translateX(100%)",
                }}
                aria-hidden="true"
              />

              <button
                type="button"
                onClick={() => setActiveView("dashboard")}
                className="relative flex-1 px-8 py-5 rounded-xl text-left flex items-center transition-colors duration-200 z-10"
              >
                <div className="flex-1">
                  <div
                    className={`font-semibold transition-colors duration-200 ${
                      activeView === "dashboard"
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Admin Dashboard
                  </div>
                  <div
                    className={`text-sm transition-colors duration-200 ${
                      activeView === "dashboard"
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    Manage members & events
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("website")}
                className="relative flex-1 px-8 py-5 rounded-xl text-left flex items-center transition-colors duration-200 z-10"
              >
                <div className="flex-1">
                  <div
                    className={`font-semibold transition-colors duration-200 ${
                      activeView === "website"
                        ? "text-gray-900"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Club Website
                  </div>
                  <div
                    className={`text-sm transition-colors duration-200 ${
                      activeView === "website"
                        ? "text-gray-600"
                        : "text-gray-400"
                    }`}
                  >
                    Your public presence
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
