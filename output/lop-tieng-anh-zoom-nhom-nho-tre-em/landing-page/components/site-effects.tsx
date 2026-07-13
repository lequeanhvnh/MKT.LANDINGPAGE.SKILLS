"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { CheckCircle2, Snowflake } from "lucide-react";

const snowflakes = [
  { id: "snow-01", left: "3%", size: "5px", duration: "13s", delay: "-4s", drift: "34px", opacity: 0.45 },
  { id: "snow-02", left: "9%", size: "8px", duration: "17s", delay: "-11s", drift: "-28px", opacity: 0.42 },
  { id: "snow-03", left: "15%", size: "4px", duration: "12s", delay: "-7s", drift: "42px", opacity: 0.5 },
  { id: "snow-04", left: "21%", size: "7px", duration: "15s", delay: "-2s", drift: "-36px", opacity: 0.38 },
  { id: "snow-05", left: "28%", size: "5px", duration: "18s", delay: "-14s", drift: "30px", opacity: 0.46 },
  { id: "snow-06", left: "34%", size: "9px", duration: "14s", delay: "-8s", drift: "-40px", opacity: 0.32 },
  { id: "snow-07", left: "41%", size: "6px", duration: "16s", delay: "-5s", drift: "38px", opacity: 0.44 },
  { id: "snow-08", left: "48%", size: "4px", duration: "11s", delay: "-9s", drift: "-24px", opacity: 0.52 },
  { id: "snow-09", left: "55%", size: "8px", duration: "19s", delay: "-15s", drift: "35px", opacity: 0.36 },
  { id: "snow-10", left: "62%", size: "5px", duration: "13s", delay: "-6s", drift: "-33px", opacity: 0.48 },
  { id: "snow-11", left: "69%", size: "7px", duration: "17s", delay: "-12s", drift: "27px", opacity: 0.4 },
  { id: "snow-12", left: "76%", size: "4px", duration: "12s", delay: "-1s", drift: "-31px", opacity: 0.5 },
  { id: "snow-13", left: "83%", size: "9px", duration: "16s", delay: "-10s", drift: "40px", opacity: 0.34 },
  { id: "snow-14", left: "89%", size: "5px", duration: "14s", delay: "-3s", drift: "-26px", opacity: 0.46 },
  { id: "snow-15", left: "95%", size: "6px", duration: "18s", delay: "-13s", drift: "32px", opacity: 0.4 },
] as const;

const recentRegistrations = [
  { id: "registration-01", email: "ng*****@gmail.com", time: "vừa đăng ký lịch kiểm tra" },
  { id: "registration-02", email: "tr*****@outlook.com", time: "vừa giữ chỗ tư vấn" },
  { id: "registration-03", email: "ph*****@gmail.com", time: "vừa đăng ký kiểm tra đầu vào" },
  { id: "registration-04", email: "ha*****@icloud.com", time: "vừa để lại thông tin" },
] as const;

type SnowflakeStyle = CSSProperties & {
  "--snow-left": string;
  "--snow-size": string;
  "--snow-duration": string;
  "--snow-delay": string;
  "--snow-drift": string;
  "--snow-opacity": number;
};

function Snowfall() {
  return (
    <div aria-hidden="true" className="snowfall-layer">
      {snowflakes.map((flake) => (
        <span
          key={flake.id}
          className="snowflake-particle"
          style={{
            "--snow-left": flake.left,
            "--snow-size": flake.size,
            "--snow-duration": flake.duration,
            "--snow-delay": flake.delay,
            "--snow-drift": flake.drift,
            "--snow-opacity": flake.opacity,
          } as SnowflakeStyle}
        />
      ))}
    </div>
  );
}

function RegistrationActivity() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let hideTimer = window.setTimeout(() => setIsVisible(false), 4500);

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % recentRegistrations.length);
      setIsVisible(true);
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setIsVisible(false), 4500);
    }, 10000);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const activity = recentRegistrations[activeIndex];

  return (
    <aside
      aria-label="Hoạt động đăng ký minh họa"
      aria-hidden={!isVisible}
      className={`registration-toast ${isVisible ? "registration-toast-visible" : "registration-toast-hidden"}`}
    >
      <span className="registration-toast-icon">
        <CheckCircle2 aria-hidden="true" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-slate-950">{activity.email}</span>
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-deep">Minh hoạ</span>
        </span>
        <span className="mt-0.5 block text-xs font-medium text-slate-600">{activity.time}</span>
      </span>
      <Snowflake aria-hidden="true" className="size-4 shrink-0 text-sky-300" />
    </aside>
  );
}

function ScrollRevealController() {
  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>("main > section, main article, main details, main .soft-shadow"),
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("motion-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("motion-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10%", threshold: 0.08 },
    );

    targets.forEach((target, index) => {
      target.classList.add("motion-reveal");
      target.style.setProperty("--reveal-delay", `${(index % 4) * 55}ms`);
      if (target.getBoundingClientRect().top < window.innerHeight * 0.92) {
        target.classList.add("motion-visible");
      } else {
        observer.observe(target);
      }
    });

    return () => observer.disconnect();
  }, []);

  return null;
}

export function SiteEffects() {
  return (
    <>
      <ScrollRevealController />
      <Snowfall />
      <RegistrationActivity />
    </>
  );
}
