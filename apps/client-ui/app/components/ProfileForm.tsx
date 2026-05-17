// uses controlled form state and click-outside detection, so it's a client component
"use client";

// useEffect for click-outside detection, useRef for the dropdown container, useState for open/closed
import { useEffect, useRef, useState } from "react";
// useForm for controlled form state, Controller for wrapping the custom date picker
import { useForm, Controller } from "react-hook-form";
// zodResolver bridges the zod schema into react-hook-form's validation
import { zodResolver } from "@hookform/resolvers/zod";
// zod for defining and enforcing the form validation rules
import { z } from "zod/v4";
// the calendar date picker component
import { DayPicker } from "react-day-picker";
// DayPicker's built-in styles
import "react-day-picker/style.css";
// icons for each form field
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
// the shape of the form's output values
import type { ProfileFormValues } from "@/utils/supabase/types";

// the validation rules for the profile form, used by react-hook-form to validate on submit
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  // must be an actual Date object, not a string
  dateOfBirth: z.date({ error: "Date of birth is required" }),
  //optional field, no minimum length
  timeOfBirth: z.string(),
  city: z.string().min(1, "City of birth is required"),
  // populated automatically from the geocoding result, but still required before submit
  timezone: z.string().min(1, "Timezone is required"),
});

// formats a Date object as a readable string like "January 5, 1990" for the button label
function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// a custom date picker field that wraps react-day-picker in a styled dropdown
function DatePickerField({
  value,
  onChange,
  error,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}) {
  // controls whether the calendar dropdown is visible
  const [open, setOpen] = useState(false);
  // ref on the wrapper div so we can detect clicks outside of it
  const ref = useRef<HTMLDivElement>(null);

  // close the calendar when the user clicks anywhere outside of it
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
      {/* the trigger button, styled like the other input fields in the form */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 rounded-lg border px-3.5 py-2.5 text-sm text-left transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
          //red tint if there's a validation error
          error
            ? "border-red-500/40 bg-red-500/5"
            : "border-white/10 bg-white/[0.04] hover:border-white/20"
        }`}
      >
        <CalendarDays className="w-4 h-4 text-gray-500 shrink-0" />
        {/* show the selected date or a placeholder in a different color */}
        <span className={value ? "text-white" : "text-gray-500"}>
          {value ? formatDate(value) : "Select date…"}
        </span>
      </button>

      {/* the dropdown calendar panel, only rendered when open */}
      {open && (
        <div className="absolute z-50 mt-2 left-0 rounded-xl border border-white/10 bg-github-dark shadow-2xl shadow-black/40 p-3 rdp-dark">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              // pass the selected date up to the form controller
              onChange(date ?? undefined);
              // auto-close the calendar once a date is chosen
              if (date) setOpen(false);
            }}
            // start the calendar at the selected date or year 2000 if nothing is selected yet
            defaultMonth={value ?? new Date(2000, 0)}
            // show year and month dropdowns so users don't have to click through decades
            captionLayout="dropdown"
            // constrain the range to reasonable birth years
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            animate
          />
        </div>
      )}
    </div>
  );
}

// the props the form accepts from its parent (onboarding page or settings page)
type ProfileFormProps = {
  defaultValues?: Partial<ProfileFormValues>;    // pre-fill the form for the settings edit case
  onSubmit: (data: ProfileFormValues) => void | Promise<void>;
  submitLabel?: string;                          // "Get Started" on onboarding, "Save" on settings
  loading?: boolean;                             // disables the submit button while saving
  onCancel?: () => void;                         // optional cancel button for the settings edit flow
};

// a reusable form for entering birth details, shared between onboarding and settings
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
    // plug the zod schema into react-hook-form for validation
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      dateOfBirth: defaultValues?.dateOfBirth ?? undefined,
      timeOfBirth: defaultValues?.timeOfBirth ?? "",
      city: defaultValues?.city ?? "",
      // default to Eastern time as a sensible starting point
      timezone: defaultValues?.timezone ?? "America/New_York",
    },
  });

  // base input class shared across all text fields
  const inputBase =
    "w-full rounded-lg border px-3.5 py-2.5 pl-11 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  // normal state with subtle border and background
  const inputNormal = `${inputBase} border-white/10 bg-white/[0.04] hover:border-white/20`;
  // error state switches to red tint
  const inputError = `${inputBase} border-red-500/40 bg-red-500/5`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* first name field */}
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
        {/* show validation error below the field */}
        {errors.firstName && (
          <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>
        )}
      </div>

      {/* date of birth field, uses the custom DayPicker dropdown via Controller */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">
          Date of birth <span className="text-red-400">*</span>
        </label>
        {/* Controller bridges react-hook-form's register API with the custom component */}
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

      {/* time of birth field, optional since not everyone knows their exact birth time */}
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

      {/* city of birth field, used to geocode lat/lng and timezone */}
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

      {/* timezone is set programmatically after geocoding the city, not shown to the user */}
      <input type="hidden" {...register("timezone")} />

      {/* form action buttons */}
      <div className="flex gap-3 pt-2">
        {/* cancel button is optional, only shown in the settings edit flow */}
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 cursor-pointer"
          >
            Cancel
          </button>
        )}
        {/* submit button, disabled and shows "Saving…" while loading */}
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
