export type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

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

export type ProfileFormValues = {
  firstName: string;
  dateOfBirth: Date | undefined;
  timeOfBirth: string;
  city: string;
  timezone: string;
};
