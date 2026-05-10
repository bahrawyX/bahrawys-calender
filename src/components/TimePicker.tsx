import * as React from "react";
import { ClockIcon } from "./icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: string;    // HH:mm 24h
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function format12(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${mStr} ${ampm}`;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, label, disabled = false }) => {
  const [hh, mm] = value.split(":");
  const set = (newHH: string, newMM: string) => onChange(`${newHH}:${newMM}`);

  return (
    <div className="flex flex-col gap-1.5">
      {label && <p className="text-xs font-semibold text-muted-foreground">{label}</p>}

      {/* Trigger display row */}
      <div className="flex h-9 w-full items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm text-muted-foreground">
        <ClockIcon className="h-4 w-4 opacity-50 shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-foreground font-normal tabular-nums">{format12(value)}</span>
      </div>

      {/* Two Select dropdowns side by side */}
      <div className="flex gap-2">
        {/* Hour */}
        <Select value={hh} onValueChange={(v) => set(v, mm)} disabled={disabled}>
          <SelectTrigger className="flex-1 h-9 text-sm tabular-nums focus:ring-0 focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {HOURS.map((h) => (
              <SelectItem key={h} value={h} className="tabular-nums">
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="flex items-center text-muted-foreground font-medium text-sm select-none">:</span>

        {/* Minute */}
        <Select value={mm} onValueChange={(v) => set(hh, v)} disabled={disabled}>
          <SelectTrigger className="flex-1 h-9 text-sm tabular-nums focus:ring-0 focus-visible:ring-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-56">
            {MINUTES.map((m) => (
              <SelectItem key={m} value={m} className="tabular-nums">
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TimePicker;

