
import { addDays, subDays } from "date-fns";
import type { Guide, Company, JobOffer, Commitment } from "./types";

const today = new Date();

export const mockCompanies: Company[] = [
  {
    id: "comp1",
    name: "Buscadores de Aventuras S.A.",
    email: "contacto@buscadoresdeaventuras.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Senderismo", "Ciclismo de Montaña", "Kayak"],
    details: "Proveedor líder de tours de aventura al aire libre durante más de 15 años. Nos enfocamos en experiencias sostenibles y emocionantes.",
    rating: 4.8,
    reviews: 25,
  },
  {
    id: "comp2",
    name: "Tours CityScape",
    email: "reservas@tourscityscape.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Historia", "Arquitectura", "Tours Gastronómicos"],
    details: "Explora las joyas ocultas de la ciudad con nuestros expertos guías locales. Ofrecemos una variedad de tours a pie y en autobús.",
    rating: 4.9,
    reviews: 42,
  },
];

export const mockGuides: Guide[] = [
  {
    id: "guide1",
    name: "Alicia Rodríguez",
    email: "alicia.r@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Historia", "Historia del Arte"],
    languages: ["Inglés", "Español"],
    rate: 250,
    rating: 4.9,
    reviews: 15,
    availability: [addDays(today, 5), addDays(today, 6), addDays(today, 10), addDays(today, 11), addDays(today, 12)],
    commitments: [
       {
        id: "commit_past_1",
        company: mockCompanies[1],
        jobType: "Recorrido por Museo de Arte",
        startDate: subDays(today, 20),
        endDate: subDays(today, 18),
        guideRating: 5,
        companyRating: 5,
      },
      {
        id: "commit_past_2",
        company: mockCompanies[0],
        jobType: "Ruta de Senderismo Histórica",
        startDate: subDays(today, 10),
        endDate: subDays(today, 8),
        guideRating: 4, 
      },
      {
        id: "commit1",
        company: mockCompanies[1],
        jobType: "Recorrido Histórico a Pie",
        startDate: addDays(today, 1),
        endDate: addDays(today, 3),
      },
    ],
  },
  {
    id: "guide2",
    name: "Roberto Williams",
    email: "roberto.w@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Senderismo", "Vida Silvestre"],
    languages: ["Inglés", "Francés"],
    rate: 300,
    rating: 4.5,
    reviews: 12,
    availability: [addDays(today, 7), addDays(today, 8), addDays(today, 9), addDays(today, 14)],
    commitments: [],
  },
  {
    id: "guide3",
    name: "Carlos Pérez",
    email: "carlos.p@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Tours Gastronómicos", "Vida Nocturna"],
    languages: ["Inglés", "Italiano"],
    rate: 220,
    rating: 4.7,
    reviews: 21,
    availability: [addDays(today, 2), addDays(today, 3), addDays(today, 4)],
    commitments: [
      {
        id: "commit2",
        company: mockCompanies[1],
        jobType: "Gastronomía y Vinos del Centro",
        startDate: addDays(today, 20),
        endDate: addDays(today, 20),
      },
       {
        id: "commit_past_3",
        company: mockCompanies[0],
        jobType: "Aventura en Kayak",
        startDate: subDays(today, 5),
        endDate: subDays(today, 5),
        companyRating: 5, 
      }
    ],
  },
  {
    id: "guide4",
    name: "Diana Prince",
    email: "diana.p@email.com",
    avatar: "https://placehold.co/100x100.png",
    specialties: ["Arquitectura", "Arte Moderno"],
    languages: ["Inglés", "Alemán"],
    rate: 275,
    rating: 5.0,
    reviews: 8,
    availability: [addDays(today, 1), addDays(today, 2), addDays(today, 8), addDays(today, 9), addDays(today, 10)],
    commitments: [],
  },
];

export const mockOffers: JobOffer[] = [
  {
    id: "offer1",
    company: mockCompanies[1],
    guideId: "guide2",
    jobType: "Tour Arquitectónico Especial",
    description: "Un tour de 2 días para un cliente corporativo centrado en la arquitectura moderna de la ciudad.",
    startDate: addDays(today, 7),
    endDate: addDays(today, 8),
    status: "pending",
  },
  {
    id: "offer2",
    company: mockCompanies[0],
    guideId: "guide3",
    jobType: "Paseo en Kayak para Principiantes",
    description: "Guía a un grupo de 10 personas en un pintoresco recorrido en kayak por el río. Todo el equipo está incluido.",
    startDate: addDays(today, 4),
    endDate: addDays(today, 4),
    status: "pending",
  },
];
