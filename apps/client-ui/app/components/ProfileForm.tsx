"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import type { ProfileFormValues } from "@/utils/supabase/types";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  dateOfBirth: z.date({ error: "Date of birth is required" }),
  timeOfBirth: z.string(),
  city: z.string().min(1, "City of birth is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function DatePickerField({
  value,
  onChange,
  error,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
          error
            ? "border-red-500/40 bg-red-500/5"
            : "border-white/10 bg-white/[0.04] hover:border-white/20"
        }`}
      >
        <CalendarDays className="w-4 h-4 text-gray-500 shrink-0" />
        <span className={value ? "text-white" : "text-gray-500"}>
          {value ? formatDate(value) : "Select date…"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 rounded-xl border border-white/10 bg-github-dark shadow-2xl shadow-black/40 p-3 rdp-dark">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date ?? undefined);
              if (date) setOpen(false);
            }}
            defaultMonth={value ?? new Date(2000, 0)}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            animate
          />
        </div>
      )}
    </div>
  );
}

type ProfileFormProps = {
  defaultValues?: Partial<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  onCancel?: () => void;
};

export function ProfileForm({
  defaultValues,
  onSubmit,
  submitLabel = "Save",
  loading = false,
  onCancel,
}: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      dateOfBirth: defaultValues?.dateOfBirth ?? undefined,
      timeOfBirth: defaultValues?.timeOfBirth ?? "",
      city: defaultValues?.city ?? "",
      timezone: defaultValues?.timezone ?? "America/New_York",
    },
  });

  const inputBase =
    "w-full rounded-lg border px-3.5 py-2.5 pl-11 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  const inputNormal = `${inputBase} border-white/10 bg-white/[0.04] hover:border-white/20`;
  const inputError = `${inputBase} border-red-500/40 bg-red-500/5`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* First Name */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          First name <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            {...register("firstName")}
            className={errors.firstName ? inputError : inputNormal}
            placeholder="Enter your name"
          />
        </div>
        {errors.firstName && (
          <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>
        )}
      </div>

      {/* Date of Birth */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Date of birth <span className="text-red-400">*</span>
        </label>
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field }) => (
            <DatePickerField
              value={field.value}
              onChange={field.onChange}
              error={errors.dateOfBirth?.message}
            />
          )}
        />
        {errors.dateOfBirth && (
          <p className="text-xs text-red-400 mt-1">{errors.dateOfBirth.message}</p>
        )}
      </div>

      {/* Time of Birth */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Time of birth <span className="text-gray-600 text-[10px]">(optional)</span>
        </label>
        <div className="relative">
          <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="time"
            {...register("timeOfBirth")}
            className={inputNormal}
            placeholder="HH:MM"
          />
        </div>
      </div>

      {/* City of Birth */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          City of birth <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            {...register("city")}
            className={errors.city ? inputError : inputNormal}
            placeholder="e.g. New York"
          />
        </div>
        {errors.city && (
          <p className="text-xs text-red-400 mt-1">{errors.city.message}</p>
        )}
      </div>

      {/* Hidden timezone field */}
      <input type="hidden" {...register("timezone")} />

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
