// the full profile shape as it comes back from the Supabase database
// includes the resolved timezone, which is calculated during onboarding and stored
export type Profile = {
  id: string;           // the row's primary key in the profiles table
  user_id: string;      // foreign key linking to the Supabase auth.users table
  first_name: string;
  date_of_birth: string;        // stored as an ISO date string (YYYY-MM-DD)
  time_of_birth: string | null; // null if the user didn't know their birth time
  city_of_birth: string;
  timezone: string;     // IANA timezone string resolved from the birth city
  created_at: string;
  updated_at: string;
};

// a slimmer version of the profile that doesn't include timezone
//used when reading from storage contexts where timezone isn't persisted
export type StoredProfile = {
  id: string;
  user_id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  created_at: string;
  updated_at: string;
};

// the shape of the controlled form state in the onboarding/settings profile form
// uses a Date object for dateOfBirth so the date picker component can work with it directly
export type ProfileFormValues = {
  firstName: string;
  dateOfBirth: Date;              // a Date object so the date picker component can work with it directly
  timeOfBirth: string;           // kept as a string for the time input field
  city: string;
  timezone: string;              // populated automatically after the city is geolocated
};
