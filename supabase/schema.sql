-- 1. Create Tables

-- Companies Table
CREATE TABLE companies (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar TEXT,
    specialties TEXT[],
    details TEXT
);

-- Guides Table
CREATE TABLE guides (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    avatar TEXT,
    specialties TEXT[],
    languages TEXT[],
    rate NUMERIC,
    availability DATE[]
);

-- Commitments Table
CREATE TABLE commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id TEXT REFERENCES guides(id),
    company_id TEXT REFERENCES companies(id),
    job_type TEXT,
    start_date DATE,
    end_date DATE,
    guide_rating INT CHECK (guide_rating >= 1 AND guide_rating <= 5),
    company_rating INT CHECK (company_rating >= 1 AND company_rating <= 5)
);

-- Offers Table
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id TEXT REFERENCES companies(id),
    guide_id TEXT REFERENCES guides(id),
    job_type TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status TEXT
);


-- 2. Disable Row Level Security (RLS)
-- This is important for development, allowing the anon key to access data.
-- For production, you would want to enable RLS and define policies.
ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE guides DISABLE ROW LEVEL SECURITY;
ALTER TABLE commitments DISABLE ROW LEVEL SECURITY;
ALTER TABLE offers DISABLE ROW LEVEL SECURITY;


-- 3. Insert Sample Data

-- Sample Companies
INSERT INTO companies (id, name, email, avatar, specialties, details) VALUES
('comp1', 'Aventuras Globales', 'contacto@aventurasglobales.com', 'https://placehold.co/100x100.png', '{"Senderismo","Historia","Cultural"}', 'Líderes en turismo de aventura y exploración cultural en todo el mundo.'),
('comp2', 'Tours Gastronómicos Locales', 'info@tourgastronomico.com', 'https://placehold.co/100x100.png', '{"Gastronomía","Vinos","Mercados Locales"}', 'Descubre los sabores auténticos de cada ciudad con nuestros tours especializados.');

-- Sample Guides
INSERT INTO guides (id, name, email, avatar, specialties, languages, rate, availability) VALUES
('guide1', 'Ana García', 'ana.garcia@email.com', 'https://placehold.co/100x100.png', '{"Historia","Arte","Arquitectura"}', '{"Español","Inglés"}', 180, '{"2024-08-10", "2024-08-11", "2024-08-15", "2024-08-20", "2024-08-21", "2024-08-22"}'),
('guide2', 'Carlos Sánchez', 'carlos.sanchez@email.com', 'https://placehold.co/100x100.png', '{"Senderismo","Naturaleza","Fotografía"}', '{"Español","Francés"}', 220, '{"2024-08-12", "2024-08-13", "2024-08-18", "2024-08-25", "2024-08-26"}'),
('guide3', 'Laura Martínez', 'laura.martinez@email.com', 'https://placehold.co/100x100.png', '{"Gastronomía","Vinos"}', '{"Español","Italiano"}', 250, '{"2024-08-14", "2024-08-16", "2024-08-17", "2024-08-23", "2024-08-24"}');

-- Sample Commitments (past)
INSERT INTO commitments (guide_id, company_id, job_type, start_date, end_date, guide_rating, company_rating) VALUES
('guide1', 'comp1', 'Tour Histórico', '2024-07-01', '2024-07-05', 5, 4),
('guide2', 'comp1', 'Ruta de Senderismo', '2024-07-10', '2024-07-12', null, 5);

-- Sample Commitments (future)
INSERT INTO commitments (guide_id, company_id, job_type, start_date, end_date) VALUES
('guide3', 'comp2', 'Tour de Tapas', '2024-09-01', '2024-09-03');


-- Sample Offers
INSERT INTO offers (company_id, guide_id, job_type, description, start_date, end_date, status) VALUES
('comp1', 'guide2', 'Tour por el Casco Antiguo', 'Necesitamos un guía para un grupo de 15 turistas americanos. Se requiere inglés fluido.', '2024-09-10', '2024-09-12', 'pending'),
('comp2', 'guide2', 'Ruta del Vino', 'Tour por 3 bodegas locales, cata incluida. Grupo pequeño.', '2024-09-15', '2024-09-15', 'pending');
