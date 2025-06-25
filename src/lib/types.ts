export type Guide = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  specialties: string[];
  languages: string[];
  rate: number;
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
};

export type JobOffer = {
  id: string;
  company: Pick<Company, 'id' | 'name' | 'avatar'>;
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
};
