"use client";

import { useEffect, useState } from "react";

type Remaining = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  ended: boolean;
};

const TARGET_TIME = new Date("2026-07-18T10:00:00+08:00").getTime();

function getRemaining(): Remaining {
  const distance = TARGET_TIME - Date.now();

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, ended: true };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((distance / (1000 * 60)) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    ended: false,
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function RegistrationCountdown() {
  const [remaining, setRemaining] = useState<Remaining | null>(null);

  useEffect(() => {
    setRemaining(getRemaining());
    const timer = window.setInterval(() => setRemaining(getRemaining()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const items = [
    { label: "天", value: remaining ? String(remaining.days) : "--" },
    { label: "时", value: remaining ? pad(remaining.hours) : "--" },
    { label: "分", value: remaining ? pad(remaining.minutes) : "--" },
    { label: "秒", value: remaining ? pad(remaining.seconds) : "--" },
  ];

  return (
    <div className="mt-7 max-w-[34rem] overflow-hidden rounded-xl border border-white/15 bg-white/[0.07] p-4 shadow-2xl shadow-black/10 backdrop-blur-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-white/50">
            Kickoff meeting
          </p>
          <p className="mt-1 text-base font-semibold text-white">
            启动会 <span className="text-brand">2026.07.18 10:00</span>
          </p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-white/10 bg-black/20"
            >
              <span className="text-xl font-bold leading-none text-white">
                {remaining?.ended ? "00" : item.value}
              </span>
              <span className="mt-1 text-xs text-white/50">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      {remaining?.ended && (
        <p className="mt-3 text-sm font-medium text-brand">启动会已开始</p>
      )}
    </div>
  );
}
