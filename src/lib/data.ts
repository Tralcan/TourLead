import { addDays } from "date-fns";
import type { Guide, Company, JobOffer, Commitment } from "./types";

const today = new Date();

export const mockCompanies: Company[] = [
  {
    id: "comp1",
    name: "Adventure Seekers Inc.",
    email: "contact@adventureseekers.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Hiking", "Mountain Biking", "Kayaking"],
    details: "Leading provider of outdoor adventure tours for over 15 years. We focus on sustainable and thrilling experiences.",
  },
  {
    id: "comp2",
    name: "CityScape Tours",
    email: "booking@cityscapetours.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["History", "Architecture", "Food Tours"],
    details: "Explore the city's hidden gems with our expert local guides. We offer a variety of walking and bus tours.",
  },
];

export const mockGuides: Guide[] = [
  {
    id: "guide1",
    name: "Alice Johnson",
    email: "alice.j@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["History", "Art History"],
    languages: ["English", "Spanish"],
    rate: 250,
    availability: [addDays(today, 5), addDays(today, 6), addDays(today, 10), addDays(today, 11), addDays(today, 12)],
    commitments: [
      {
        id: "commit1",
        company: { id: "comp2", name: "CityScape Tours", email: "booking@cityscapetours.com" },
        jobType: "Historical Walking Tour",
        startDate: addDays(today, 1),
        endDate: addDays(today, 3),
      },
    ],
  },
  {
    id: "guide2",
    name: "Bob Williams",
    email: "bob.w@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Hiking", "Wildlife"],
    languages: ["English", "French"],
    rate: 300,
    availability: [addDays(today, 7), addDays(today, 8), addDays(today, 9), addDays(today, 14)],
    commitments: [],
  },
  {
    id: "guide3",
    name: "Charlie Brown",
    email: "charlie.b@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Food Tours", "Nightlife"],
    languages: ["English", "Italian"],
    rate: 220,
    availability: [addDays(today, 2), addDays(today, 3), addDays(today, 4)],
    commitments: [
      {
        id: "commit2",
        company: { id: "comp2", name: "CityScape Tours", email: "booking@cityscapetours.com" },
        jobType: "Downtown Food & Wine",
        startDate: addDays(today, 20),
        endDate: addDays(today, 20),
      },
    ],
  },
  {
    id: "guide4",
    name: "Diana Prince",
    email: "diana.p@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Architecture", "Modern Art"],
    languages: ["English", "German"],
    rate: 275,
    availability: [addDays(today, 1), addDays(today, 2), addDays(today, 8), addDays(today, 9), addDays(today, 10)],
    commitments: [],
  },
];

export const mockOffers: JobOffer[] = [
  {
    id: "offer1",
    company: mockCompanies[1],
    guideId: "guide2",
    jobType: "Special Architectural Tour",
    description: "A 2-day tour for a corporate client focusing on the city's modern architecture.",
    startDate: addDays(today, 7),
    endDate: addDays(today, 8),
    status: "pending",
  },
  {
    id: "offer2",
    company: mockCompanies[0],
    guideId: "guide3",
    jobType: "Beginner's Kayaking Trip",
    description: "Lead a group of 10 on a scenic river kayaking tour. All equipment provided.",
    startDate: addDays(today, 4),
    endDate: addDays(today, 4),
    status: "pending",
  },
];
