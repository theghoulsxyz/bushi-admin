"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";

// Branding
const BRAND = {
  nickname: "Bushi",
  shopName: "BushiBarberShop",
  logoLight: "/bushii-logo.png",
  accent: "#ffffff",
  fontTitle: "'Bebas Neue', sans-serif",
  fontScript: "'UnifrakturCook', cursive",
};

function injectBrandFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("bushi-fonts")) return;
  const link = document.createElement("link");
  link.id = "bushi-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=UnifrakturCook:wght@700&display=swap";
  document.head.appendChild(link);
}

// Utilities
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const startHour = 8;
const endHour = 22;
const slotMinutes = 30;

function generateSlots() {
  const slots: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += slotMinutes) {
      slots.push(`${pad(h)}:${pad(m)}`);
    }
  }
  return slots;
}
const DAY_SLOTS = generateSlots();

function getMonthMatrix(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = (first.getDay() + 6) % 7; // Monday-first
  const matrix: Date[][] = [];
  let current = 1 - startDay;
  for (let week = 0; week < 6; week++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      row.push(new Date(year, month, current));
      current++;
    }
    matrix.push(row);
  }
  return matrix;
}

// Local storage
const LS_KEY = "barber_appointments_v1";
const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";
const readStore = () => {
  if (!canUseStorage()) return {} as Record<string, Record<string, string>>;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) || {};
  } catch {
    return {};
  }
};
const writeStore = (data: Record<string, Record<string, string>>) => {
  if (canUseStorage()) localStorage.setItem(LS_KEY, JSON.stringify(data));
};

// Icons
const ICONS = {
  delete: "/razor.png",
};

function IconImg({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="h-5 w-5 object-contain inline-block" />;
}

// Primitives
function Button(
  { className = "", children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
) {
  return (
    <button
      className={`px-3 py-2 rounded-xl shadow-md border border-gray-700 hover:border-white/60 bg-neutral-900 hover:bg-neutral-800 transition text-sm flex items-center gap-2 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  (props, ref) => (
    <input
      ref={ref}
      className="w-full px-3 py-2 rounded-xl border border-gray-600 bg-neutral-950 text-white focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
      {...props}
    />
  )
);
TextInput.displayName = "TextInput";

function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      {/* Mobile-safe full-height container using dynamic viewport and flex layout */}
      <div className="relative bg-neutral-950 text-white rounded-none md:rounded-xl shadow-2xl w-screen h-dvh md:w-[min(760px,96vw)] md:h-[90vh] flex flex-col">
        {/* Header (always visible) */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between flex-none">
          <h3 className="text-base md:text-lg font-bold tracking-wide" style={{ fontFamily: BRAND.fontTitle }}>{title}</h3>
        </div>
        {/* Scrollable content area */}
        <div className="flex-1 overflow-auto p-4 md:p-5">{children}</div>
        {/* Footer (always visible) with safe-area padding for iOS */}
        <div className="px-4 md:px-5 py-3 border-t border-neutral-800 bg-neutral-900 flex items-center justify-end flex-none pb-[max(env(safe-area-inset-bottom),0px)]">
          {footer}
        </div>
      </div>
    </div>
  );
}

// Main component
export default function BarbershopAdminPanel() {
  useEffect(() => { injectBrandFonts(); }, []);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [data, setData] = useState<Record<string, Record<string, string>>>(() => readStore());
  useEffect(() => writeStore(data), [data]);

  const [showYear, setShowYear] = useState(false);

  const matrix = useMemo(() => getMonthMatrix(currentYear, currentMonth), [currentYear, currentMonth]);

  const [dayModal, setDayModal] = useState<{ open: boolean; dateISO: string | null }>({ open: false, dateISO: null });
  const openDay = (d: Date) => setDayModal({ open: true, dateISO: toISODate(d) });
  const closeDay = () => setDayModal({ open: false, dateISO: null });

  const monthName = new Date(currentYear, currentMonth, 1).toLocaleString(undefined, { month: "long" });

  return (
    <>
      <div className="min-h-screen w-full bg-black text-white">
        <div className="max-w-6xl mx-auto p-3 md:p-8">
          <div className="flex flex-col items-center gap-3 mb-6">
            {BRAND.logoLight && (
              <img
                src={BRAND.logoLight}
                alt="logo"
                className="h-24 md:h-32 w-auto cursor-pointer"
                onClick={() => {
                  setCurrentYear(today.getFullYear());
                  setCurrentMonth(today.getMonth());
                }}
              />
            )}
            <div className="text-center flex flex-col items-center gap-2 w-full">
              <h1
                className="mt-2 text-xl md:text-2xl font-bold cursor-pointer hover:text-gray-300 select-none"
                style={{ fontFamily: BRAND.fontTitle }}
                onClick={() => setShowYear(true)}
              >
                {monthName} {currentYear}
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-4 px-2 md:px-0 max-w-[680px] mx-auto md:max-w-none">
            {matrix.flat().map((date, idx) => {
              const inMonth = date.getMonth() === currentMonth;
              const iso = toISODate(date);
              const isToday = iso === toISODate(new Date());
              return (
                <div
                  key={idx}
                  className={`rounded-2xl flex items-center justify-center bg-neutral-900 text-white border transition cursor-pointer aspect-[0.78] md:aspect-square p-3 md:p-6 ${inMonth ? "" : "opacity-40"} ${isToday ? "border-white" : "border-neutral-800"}`}
                  onClick={() => openDay(date)}
                >
                  <div className="select-none text-[clamp(1.1rem,6.2vw,1.8rem)] md:text-[2rem]" style={{ fontFamily: BRAND.fontScript }}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DayEditorModal open={dayModal.open} dateISO={dayModal.dateISO} data={data} setData={setData} onClose={closeDay} />
      <YearModal open={showYear} onClose={() => setShowYear(false)} currentYear={currentYear} setMonth={setCurrentMonth} />
    </>
  );
}

function DayEditorModal({ open, onClose, dateISO, data, setData }: { open: boolean; onClose: () => void; dateISO: string | null; data: Record<string, Record<string, string>>; setData: React.Dispatch<React.SetStateAction<Record<string, Record<string, string>>>>; }) {
  const dayData = (dateISO && data[dateISO]) || {};
  // Immediate, durable save: updates React state AND writes to localStorage synchronously
  const setNameFor = (time: string, name: string) => {
    if (!dateISO) return;
    setData((prev) => {
      const copy = { ...prev } as Record<string, Record<string, string>>;
      const day = { ...(copy[dateISO] || {}) } as Record<string, string>;
      if (!name) delete day[time]; else day[time] = name;
      copy[dateISO] = day;
      try { localStorage.setItem(LS_KEY, JSON.stringify(copy)); } catch {}
      return copy;
    });
  };
  return (
    <Modal open={open} onClose={onClose} title={dateISO ? new Date(dateISO).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Appointments"} footer={<Button onClick={onClose}>Close</Button>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DAY_SLOTS.map((time) => (<SlotRow key={time} time={time} name={dayData[time] || ""} onSave={setNameFor} />))}
      </div>
    </Modal>
  );
}

function SlotRow({ time, name, onSave }: { time: string; name: string; onSave: (time: string, name: string) => void; }) {
  const [value, setValue] = useState(name);
  useEffect(() => setValue(name), [name]);
  const hasName = Boolean((name || "").trim());

  const lastSavedRef = useRef<string>(name);
  const [justSaved, setJustSaved] = useState(false);
  const triggerSavedFlash = () => { setJustSaved(true); window.setTimeout(() => setJustSaved(false), 900); };
  const flushSave = () => {
    const next = value;
    if (next === lastSavedRef.current) return;
    onSave(time, next);
    lastSavedRef.current = next;
    triggerSavedFlash();
  };

  // Secure remove: two-step confirm with auto-cancel
  const [confirmRemove, setConfirmRemove] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);
  const armRemove = () => {
    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    setConfirmRemove(true);
    confirmTimerRef.current = window.setTimeout(() => setConfirmRemove(false), 3500); // auto-cancel after 3.5s
  };
  const cancelRemove = () => {
    if (confirmTimerRef.current) { clearTimeout(confirmTimerRef.current); confirmTimerRef.current = null; }
    setConfirmRemove(false);
  };
  const handleClear = () => { onSave(time, ""); lastSavedRef.current = ""; setConfirmRemove(false); triggerSavedFlash(); };

  useEffect(() => () => { if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current); }, []);

  return (
    <div className={`border rounded-2xl p-4 flex flex-col gap-2 bg-neutral-900 ${hasName ? "border-white" : "border-neutral-700"}`}>
      <div className="flex items-center justify-between">
        <div className="text-base font-bold tabular-nums">{time}</div>
      </div>
      <TextInput
        value={value}
        onChange={(e) => { setValue((e.target as HTMLInputElement).value); }}
        onBlur={flushSave}
        onKeyDown={(e) => { if (e.key === "Enter") flushSave(); }}
        autoComplete="off"
        inputMode="text"
      />
      <div className="flex items-center justify-between gap-2">
        <div className={`text-xs transition-opacity ${justSaved ? 'opacity-100' : 'opacity-0'}`} aria-live="polite">
          <span className="inline-flex items-center gap-1 text-green-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Saved
          </span>
        </div>
        {hasName && (
          !confirmRemove ? (
            <Button onClick={armRemove} aria-label="Prepare to remove appointment" className="select-none">
              <IconImg src={ICONS.delete} alt="Remove" /> Remove
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button onClick={cancelRemove} className="border-yellow-600/60 hover:border-yellow-400/70">Cancel</Button>
              <Button onClick={handleClear} className="border-red-700/70 hover:border-red-500/80 bg-red-900/30">
                <IconImg src={ICONS.delete} alt="Confirm remove" /> Confirm
              </Button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function YearModal({ open, onClose, currentYear, setMonth }: { open: boolean; onClose: () => void; currentYear: number; setMonth: (m: number) => void; }) {
  if (!open) return null;
  const months = Array.from({ length: 12 }, (_, i) => new Date(currentYear, i, 1).toLocaleString(undefined, { month: "long" }));
  return (
    <Modal open={open} onClose={onClose} title={`${currentYear}`} footer={<Button onClick={onClose}>Close</Button>}>
      <div className="grid grid-cols-3 gap-3">
        {months.map((m, idx) => (
          <div key={idx} onClick={() => { setMonth(idx); onClose(); }} className="cursor-pointer p-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-center" style={{ fontFamily: BRAND.fontTitle }}>
            {m}
          </div>
        ))}
      </div>
    </Modal>
  );
}

// --- Dev Self-Tests ---
function runDevTests() {
  const failures: string[] = [];
  const assert = (cond: boolean, msg: string) => { if (!cond) failures.push(msg); };

  // Slots: count & bounds
  assert(
    DAY_SLOTS.length === (endHour - startHour) * (60 / slotMinutes),
    `DAY_SLOTS length expected ${(endHour - startHour) * (60 / slotMinutes)}, got ${DAY_SLOTS.length}`
  );
  assert(DAY_SLOTS[0] === "08:00", `First slot should be 08:00, got ${DAY_SLOTS[0]}`);
  assert(DAY_SLOTS[DAY_SLOTS.length - 1] === "21:30", `Last slot should be 21:30, got ${DAY_SLOTS[DAY_SLOTS.length - 1]}`);
  assert(DAY_SLOTS.every((t) => /^(\d{2}):(\d{2})$/.test(t)), "Slots must be HH:MM formatted");

  // Month grid 6x7
  const m = getMonthMatrix(2025, 0);
  assert(Array.isArray(m) && m.length === 6, `Matrix weeks should be 6, got ${m.length}`);
  assert(m.every((row) => row.length === 7), `Each week should have 7 days`);
  assert(m.flat().length === 42, `Matrix cells should be 42, got ${m.flat().length}`);

  // Format helpers
  const d = new Date(2025, 8, 7);
  assert(toISODate(d) === "2025-09-07", `toISODate incorrect: ${toISODate(d)}`);
  assert(pad(0) === "00" && pad(9) === "09" && pad(10) === "10", "pad should left-pad to 2 digits");

  if (failures.length === 0) console.log("[Barber Admin] Tests passed ✔");
  else console.warn("[Barber Admin] Tests FAILED:", failures);
}
if (typeof window !== "undefined") {
  try {
    runDevTests();
    // Extra test: localStorage mirror integrity on write (smoke test)
    try {
      const before = localStorage.getItem(LS_KEY);
      const sample = { "2099-01-01": { "08:00": "Test" } };
      localStorage.setItem(LS_KEY, JSON.stringify(sample));
      const after = localStorage.getItem(LS_KEY);
      if (!after || after !== JSON.stringify(sample)) console.warn("[Barber Admin] LS write mirror failed");
      // restore
      if (before !== null) localStorage.setItem(LS_KEY, before);
    } catch {}
  } catch (e) { console.error("[Barber Admin] Tests crashed", e); }
}
