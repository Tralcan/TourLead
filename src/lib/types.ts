
export type Guide = {
  id: string; // UUID del usuario
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  summary: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  rate: number | null;
  rating: number; // Calculado
  reviews: number; // Calculado
  availability: string[]; // Fechas en formato ISO string
  commitments?: Commitment[];
};

export type Company = {
  id: string; // UUID del usuario
  name: string;
  email: string | null;
  avatar: string | null;
  specialties: string[] | null;
  details: string | null;
  rating?: number; // Calculado
  reviews?: number; // Calculado
  contact_person?: string | null;
  phone_landline?: string | null;
  phone_mobile?: string | null;
  address?: string | null;
};

export type JobOffer = {
  id: number; // id autoincremental de la oferta
  company: Company;
  company_id: string; // UUID de la empresa
  guide_id: string; // UUID del guía
  job_type: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Commitment = {
  id: number; // id autoincremental del compromiso
  company: Company;
  company_id: string; // UUID de la empresa
  guide_id: string; // UUID del guía
  job_type: string | null;
  offer?: { description: string | null } | null;
  startDate: Date;
  endDate: Date;
  guide_rating?: number | null;
  company_rating?: number | null;
};
