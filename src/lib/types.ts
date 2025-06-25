
export type Guide = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialties: string[];
  languages: string[];
  rate: number;
  rating: number;
  reviews: number;
  availability: Date[];
  commitments: Commitment[];
};

export type Company = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialties: string[];
  details: string;
  rating: number;
  reviews: number;
};

export type JobOffer = {
  id: string;
  company: Pick<Company, 'id' | 'name' | 'avatar' | 'rating' | 'reviews'>;
  guideId: string;
  jobType: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'accepted' | 'rejected';
};

export type Commitment = {
  id: string;
  company: Pick<Company, 'id' | 'name' | 'email'>;
  jobType: string;
  startDate: Date;
  endDate: Date;
  guideRating?: number;
  companyRating?: number;
};
