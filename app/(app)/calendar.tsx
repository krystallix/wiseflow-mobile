import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Card } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react-native';

// ─── Calendar Utilities ───────────────────────────────────────────────────────

// Pasaran (Javanese 5-day week) cycle from known epoch
// 1 January 1900 = Pon (index 2)
const PASARAN = ['Legi', 'Pahing', 'Pon', 'Wage', 'Kliwon'] as const;
type Pasaran = typeof PASARAN[number];

// Javanese day names
const JAVA_DAY = ['Ahad', 'Senin', 'Selasa', 'Rebo', 'Kemis', 'Jemuah', 'Setu'] as const;

// Javanese Saka month names
const JAVA_MONTH = ['Sura', 'Sapar', 'Mulud', 'Bakda Mulud', 'Jumadil Awal', 'Jumadil Akhir', 'Rejeb', 'Ruwah', 'Pasa', 'Sawal', 'Dulkaidah', 'Besar'] as const;

// Javanese year cycle (8-year Windu)
const JAVA_YEAR_NAMES = ['Alip', 'Ehe', 'Jimawal', 'Je', 'Dal', 'Be', 'Wawu', 'Jimakir'] as const;

// Hijri month names
const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi'ul Awal", "Rabi'ul Akhir",
  'Jumadil Awal', 'Jumadil Akhir', 'Rajab', "Sya'ban",
  'Ramadan', 'Syawal', "Dzul Qa'dah", "Dzul Hijjah",
] as const;

function getPasaran(date: Date): { name: Pasaran; index: number } {
  // Epoch: 1 Jan 1900 = Pon (index 2)
  const epoch = new Date(1900, 0, 1);
  const diffDays = Math.floor((date.getTime() - epoch.getTime()) / 86400000);
  const idx = ((diffDays % 5) + 5 + 2) % 5;
  return { name: PASARAN[idx], index: idx };
}

// Simplified Hijri conversion (Kuwaiti algorithm)
function gregorianToHijri(gYear: number, gMonth: number, gDay: number) {
  const jd = Math.floor((14 - gMonth) / 12);
  const y = gYear + 4800 - jd;
  const m = gMonth + 12 * jd - 3;
  let jdn = gDay + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;

  const l = jdn - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const remaining = l - 10631 * n + 354;
  const j = Math.floor((10985 - remaining) / 5316) * Math.floor((50 * remaining) / 17719) +
    Math.floor(remaining / 5670) * Math.floor((43 * remaining) / 15238);
  const rem2 = remaining - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hMonth = Math.floor((24 * rem2) / 709);
  const hDay = rem2 - Math.floor((709 * hMonth) / 24);
  const hYear = 30 * n + j - 30;
  return { day: hDay, month: hMonth, year: hYear };
}

// Simplified Javanese Saka conversion
function gregorianToJavanese(date: Date) {
  const { day: hDay, month: hMonth, year: hYear } = gregorianToHijri(
    date.getFullYear(), date.getMonth() + 1, date.getDate()
  );
  // Javanese Saka = Hijri + 512 (approx.)
  const sakaYear = hYear + 512;
  const yearInCycle = sakaYear % 8;
  const yearName = JAVA_YEAR_NAMES[yearInCycle] ?? JAVA_YEAR_NAMES[0];
  const monthName = JAVA_MONTH[hMonth - 1] ?? JAVA_MONTH[0];
  const windu = Math.floor(sakaYear / 8);
  const pasaran = getPasaran(date);
  const javaDay = JAVA_DAY[date.getDay()];
  return { day: hDay, month: monthName, year: sakaYear, yearName, windu, pasaran, javaDay };
}

function getHijriMonthName(m: number) {
  return HIJRI_MONTHS[(m - 1 + 12) % 12];
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// ─── Types ────────────────────────────────────────────────────────────────────

type DayCell = {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSunday: boolean;
  hijri: { day: number; month: number; year: number };
  pasaran: { name: Pasaran; index: number };
};

// ─── Build Calendar Grid ──────────────────────────────────────────────────────

function buildGrid(year: number, month: number, today: Date): DayCell[] {
  const cells: DayCell[] = [];
  const first = new Date(year, month, 1);
  // Week starts Monday (1), so offset: Mon=0..Sun=6
  let startOffset = (first.getDay() + 6) % 7;

  // Previous month fill
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const daysInPrev = getDaysInMonth(prevYear, prevMonth);
  for (let i = startOffset - 1; i >= 0; i--) {
    const date = new Date(prevYear, prevMonth, daysInPrev - i);
    cells.push(makeCell(date, false, today));
  }

  // Current month
  const daysInCurrent = getDaysInMonth(year, month);
  for (let d = 1; d <= daysInCurrent; d++) {
    const date = new Date(year, month, d);
    cells.push(makeCell(date, true, today));
  }

  // Next month fill (complete to 42 cells = 6 weeks)
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (cells.length < 42) {
    const date = new Date(nextYear, nextMonth, nextDay++);
    cells.push(makeCell(date, false, today));
  }

  return cells;
}

function makeCell(date: Date, isCurrentMonth: boolean, today: Date): DayCell {
  const isToday = date.toDateString() === today.toDateString();
  const isSunday = date.getDay() === 0;
  const hijri = gregorianToHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const pasaran = getPasaran(date);
  return { date, day: date.getDate(), isCurrentMonth, isToday, isSunday, hijri, pasaran };
}

// ─── Month/year helpers ───────────────────────────────────────────────────────

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Day Cell Component ───────────────────────────────────────────────────────

function CalendarCell({
  cell,
  isSelected,
  onPress,
}: {
  cell: DayCell;
  isSelected: boolean;
  onPress: () => void;
}) {
  const textColor = !cell.isCurrentMonth
    ? '#cbd5e1'
    : cell.isSunday
    ? '#f43f5e'
    : '#1e293b';

  const subColor = !cell.isCurrentMonth ? '#e2e8f0' : cell.isSunday ? '#fca5a5' : '#94a3b8';

  return (
    <Pressable
      onPress={onPress}
      style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}
    >
      <View
        style={{
          width: 38,
          height: 48,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isSelected ? '#312e81' : cell.isToday ? '#eef2ff' : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: '700',
            color: isSelected ? 'white' : textColor,
            lineHeight: 20,
          }}
        >
          {cell.day}
        </Text>
        <Text
          style={{
            fontSize: 8,
            fontWeight: '600',
            color: isSelected ? 'rgba(255,255,255,0.7)' : subColor,
            lineHeight: 11,
          }}
          numberOfLines={1}
        >
          {cell.hijri.day} {cell.pasaran.name.slice(0, 3).toUpperCase()}
        </Text>
      </View>
    </Pressable>
  );
}

// ─── Date Details Card ────────────────────────────────────────────────────────

function DateDetailsCard({ date }: { date: Date }) {
  const hijri = gregorianToHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const java  = gregorianToJavanese(date);

  const gregorianLabel = date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dayName = date.toLocaleDateString('id-ID', { weekday: 'long' });

  return (
    <Card className="rounded-[24px] bg-card border border-border/40 shadow-none p-5">
      <VStack className="gap-5">
        <HStack className="items-center gap-2">
          <CalendarDays size={15} color="#6366f1" />
          <Text className="font-bold text-foreground text-sm">Date Details</Text>
        </HStack>

        {/* Gregorian */}
        <VStack className="gap-1">
          <Text className="text-[10px] font-bold text-muted-foreground tracking-widest">GREGORIAN</Text>
          <Text className="text-xl font-extrabold text-foreground">
            {date.getDate()} {MONTHS[date.getMonth()]} {date.getFullYear()}
          </Text>
          <Text className="text-xs text-muted-foreground">{dayName} {java.pasaran.name}</Text>
        </VStack>

        <View className="h-px bg-border/20" />

        {/* Javanese */}
        <VStack className="gap-1">
          <HStack className="items-center gap-1.5">
            <Text className="text-[10px]">✨</Text>
            <Text className="text-[10px] font-bold text-muted-foreground tracking-widest">JAVANESE</Text>
          </HStack>
          <Text className="text-lg font-extrabold text-foreground">
            {java.day} {java.month} {java.year}
          </Text>
          <Text className="text-xs text-muted-foreground">
            Year {java.yearName} · Windu {java.windu}
          </Text>
        </VStack>

        <View className="h-px bg-border/20" />

        {/* Hijri */}
        <VStack className="gap-1">
          <HStack className="items-center gap-1.5">
            <Text className="text-[10px]">☽</Text>
            <Text className="text-[10px] font-bold text-muted-foreground tracking-widest">HIJRI</Text>
          </HStack>
          <Text className="text-lg font-extrabold text-foreground">
            {hijri.day} {getHijriMonthName(hijri.month)} {hijri.year} H
          </Text>
        </VStack>

        <View className="h-px bg-border/20" />

        {/* Pasaran row */}
        <VStack className="gap-2">
          <Text className="text-[10px] font-bold text-muted-foreground tracking-widest">PASARAN</Text>
          <HStack className="flex-wrap gap-1.5">
            {PASARAN.map(p => {
              const active = p === java.pasaran.name;
              return (
                <View
                  key={p}
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: active ? '#312e81' : '#f1f5f9' }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: active ? 'white' : '#64748b' }}
                  >
                    {p}
                  </Text>
                </View>
              );
            })}
          </HStack>
        </VStack>
      </VStack>
    </Card>
  );
}

// ─── Main Calendar Screen ─────────────────────────────────────────────────────

export default function CalendarScreen() {
  const today  = useMemo(() => new Date(), []);
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selected, setSelected]   = useState<Date>(today);

  const grid = useMemo(() => buildGrid(viewYear, viewMonth, today), [viewYear, viewMonth, today]);

  const prevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelected(today);
  };

  // Hijri month for current view
  const midMonth = new Date(viewYear, viewMonth, 15);
  const midHijri = gregorianToHijri(viewYear, viewMonth + 1, 15);
  const midJava  = gregorianToJavanese(midMonth);

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
      <VStack className="gap-4 p-4">

        {/* Header */}
        <HStack className="justify-between items-center mb-1">
          <VStack>
            <Text className="text-xl font-extrabold text-foreground">Calendar</Text>
            <Text className="text-xs text-muted-foreground">Gregorian · Javanese · Hijri</Text>
          </VStack>
          <Pressable
            onPress={goToday}
            className="px-4 py-2 rounded-full bg-card border border-border/40 active:opacity-70"
          >
            <Text className="text-xs font-bold text-foreground">Today</Text>
          </Pressable>
        </HStack>

        {/* Calendar Card */}
        <Card className="rounded-[28px] bg-card border border-border/40 shadow-none p-4">
          <VStack className="gap-3">

            {/* Month nav */}
            <HStack className="justify-between items-center px-1">
              <Pressable
                onPress={prevMonth}
                className="h-9 w-9 rounded-full bg-[#312e81] items-center justify-center active:opacity-70"
              >
                <ChevronLeft size={16} color="white" />
              </Pressable>

              <VStack className="items-center gap-0.5">
                <Text className="text-base font-extrabold text-foreground">
                  {MONTHS[viewMonth]} {viewYear}
                </Text>
                <HStack className="items-center gap-3">
                  <HStack className="items-center gap-1">
                    <Text className="text-[10px]">☽</Text>
                    <Text className="text-[10px] text-muted-foreground font-medium">
                      {getHijriMonthName(midHijri.month)} {midHijri.year} H
                    </Text>
                  </HStack>
                  <HStack className="items-center gap-1">
                    <Text className="text-[10px]">✨</Text>
                    <Text className="text-[10px] text-muted-foreground font-medium">
                      {midJava.month} {midJava.year} AJ
                    </Text>
                  </HStack>
                </HStack>
              </VStack>

              <Pressable
                onPress={nextMonth}
                className="h-9 w-9 rounded-full bg-[#312e81] items-center justify-center active:opacity-70"
              >
                <ChevronRight size={16} color="white" />
              </Pressable>
            </HStack>

            {/* Week day headers */}
            <HStack className="mb-1">
              {WEEK_DAYS.map(wd => (
                <View key={wd} style={{ flex: 1, alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: wd === 'Sun' ? '#f43f5e' : '#94a3b8',
                    }}
                  >
                    {wd}
                  </Text>
                </View>
              ))}
            </HStack>

            {/* Grid rows */}
            {Array.from({ length: 6 }).map((_, rowIdx) => (
              <HStack key={rowIdx} className="mb-0.5">
                {grid.slice(rowIdx * 7, rowIdx * 7 + 7).map((cell, colIdx) => (
                  <CalendarCell
                    key={`${rowIdx}-${colIdx}`}
                    cell={cell}
                    isSelected={cell.date.toDateString() === selected.toDateString()}
                    onPress={() => setSelected(cell.date)}
                  />
                ))}
              </HStack>
            ))}
          </VStack>
        </Card>

        {/* Date Details */}
        <DateDetailsCard date={selected} />

      </VStack>
    </ScrollView>
  );
}
