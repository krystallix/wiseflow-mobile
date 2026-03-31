import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

// ─── Pasaran calculation ──────────────────────────────────────────────────────

const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const;
type Pasaran = typeof PASARAN[number];

function getPasaran(date: Date): Pasaran {
  const epoch = new Date(1900, 0, 1);
  const diffDays = Math.floor((date.getTime() - epoch.getTime()) / 86400000);
  const idx = ((diffDays % 5) + 5 + 2) % 5;
  return PASARAN[idx];
}

// ─── Hijri conversion (Kuwaiti algorithm) ────────────────────────────────────

function gregorianToHijriDay(date: Date): number {
  const gYear = date.getFullYear();
  const gMonth = date.getMonth() + 1;
  const gDay = date.getDate();
  const jd_adj = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - jd_adj;
  const m = gMonth + 12 * jd_adj - 3;
  let jdn = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const remaining = l - 10631 * n + 354;
  const j = Math.floor((10985 - remaining) / 5316) * Math.floor((50 * remaining) / 17719) +
    Math.floor(remaining / 5670) * Math.floor((43 * remaining) / 15238);
  const rem2 = remaining - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  return rem2 - Math.floor((709 * Math.floor((24 * rem2) / 709)) / 24);
}

// ─── Day data ─────────────────────────────────────────────────────────────────

const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', "Jum", 'Sab'] as const;

type DayData = {
  date: Date;
  dayShort: string;
  dayNum: number;
  isToday: boolean;
  isSunday: boolean;
  hijriDay: number;
  pasaran: Pasaran;
};

function buildWeek(today: Date): DayData[] {
  const days: DayData[] = [];
  const startOfWeek = new Date(today);
  const dow = today.getDay(); // 0=Sun
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  startOfWeek.setDate(today.getDate() + diffToMon);

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    days.push({
      date,
      dayShort: DAY_SHORT[date.getDay()],
      dayNum: date.getDate(),
      isToday: date.toDateString() === today.toDateString(),
      isSunday: date.getDay() === 0,
      hijriDay: gregorianToHijriDay(date),
      pasaran: getPasaran(date),
    });
  }
  return days;
}

// ─── Colors (Hex #AARRGGBB or #RRGGBB required for Android widget) ────────────

const COLORS = {
  bg: '#00000000',        // fully transparent (Samsung-style widget)
  todayBg: '#6366f1',
  white: '#ffffff',
  whiteAlpha40: '#66ffffff', // ~40% opacity white
  sunday: '#fca5a5',
  pasaran: '#a5b4fc',
} as const;

// ─── Day Column ───────────────────────────────────────────────────────────────

function DayColumn({ day }: { day: DayData }) {
  return (
    <FlexWidget
      style={{
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
      }}
    >
      <TextWidget
        text={day.dayShort}
        style={{
          fontSize: 10,
          fontWeight: '600',
          color: day.isSunday ? COLORS.sunday : COLORS.whiteAlpha40,
        }}
      />

      {/* spacer */}
      <FlexWidget style={{ height: 4 }} />

      <FlexWidget
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: day.isToday ? COLORS.todayBg : '#00000000',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={String(day.dayNum)}
          style={{
            fontSize: day.isToday ? 16 : 15,
            fontWeight: '800',
            color: day.isToday
              ? COLORS.white
              : day.isSunday
              ? COLORS.sunday
              : COLORS.white,
          }}
        />
      </FlexWidget>

      {/* spacer */}
      <FlexWidget style={{ height: 4 }} />

      <TextWidget
        text={String(day.hijriDay)}
        style={{
          fontSize: 9,
          color: day.isToday ? COLORS.pasaran : COLORS.whiteAlpha40,
          fontWeight: '500',
        }}
      />

      <TextWidget
        text={day.pasaran.slice(0, 3).toUpperCase()}
        style={{
          fontSize: 8,
          fontWeight: '700',
          color: day.isToday ? COLORS.pasaran : COLORS.whiteAlpha40,
        }}
      />
    </FlexWidget>
  );
}

// ─── Widget Component ─────────────────────────────────────────────────────────

export function CalendarWidget() {
  const today = new Date();
  const week  = buildWeek(today);

  const monthYear = today.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const todayData = week.find(d => d.isToday)!;

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        flex: 1,
        flexDirection: 'column',
        backgroundColor: COLORS.bg,
        padding: 16,
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text={monthYear}
          style={{ fontSize: 14, fontWeight: '800', color: COLORS.white }}
        />
        <FlexWidget
          style={{
            backgroundColor: COLORS.todayBg,
            borderRadius: 99,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <TextWidget
            text={`${todayData?.pasaran ?? ''}  H${todayData?.hijriDay ?? ''}`}
            style={{ fontSize: 10, fontWeight: '700', color: COLORS.white }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* spacer */}
      <FlexWidget style={{ height: 16 }} />

      {/* Week strip */}
      <FlexWidget style={{ flexDirection: 'row' }}>
        {week.map((day, idx) => (
          <DayColumn key={idx} day={day} />
        ))}
      </FlexWidget>
    </FlexWidget>
  );
}
