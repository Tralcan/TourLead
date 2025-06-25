
export type Guide = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  rate: number | null;
  rating: number;
  reviews: number;
  availability: Date[];
  commitments: Commitment[];
};

export type Company = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  specialties: string[] | null;
  details: string | null;
  rating: number;
  reviews: number;
};

export type JobOffer = {
  id: string;
  company: Company;
  guide_id: string;
  job_type: string | null;
  description: string | null;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Commitment = {
  id: string;
  company: Pick<Company, 'id' | 'name' | 'email'>;
  company_id: string;
  guide_id: string;
  job_type: string | null;
  startDate: Date;
  endDate: Date;
  guide_rating?: number | null;
  company_rating?: number | null;
};
