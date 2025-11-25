interface ReportWithLocation {
  id: string;
  userId: string;
  uid?: string;
  location?: {
    lat: number;
    lng: number;
  };
  lat?: number;
  lng?: number;
  note?: string;
  description?: string;
  category?: string;
  status?: string;
  type?: string;
  hasPhoto?: boolean;
  hasAudio?: boolean;
  createdAt?: any;
}

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  points?: number;
  badges?: string[];
};
