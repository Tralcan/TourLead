-- Crear Tabla de Compañías
create table public.companies (
  id text not null,
  name text not null,
  email text,
  avatar text,
  specialties text[],
  details text,
  created_at timestamp with time zone not null default now(),
  constraint companies_pkey primary key (id)
);

-- Crear Tabla de Guías
create table public.guides (
  id text not null,
  name text not null,
  email text,
  avatar text,
  specialties text[],
  languages text[],
  rate numeric,
  availability date[],
  created_at timestamp with time zone not null default now(),
  constraint guides_pkey primary key (id)
);

-- Crear Tabla de Compromisos
create table public.commitments (
  id uuid not null default gen_random_uuid(),
  guide_id text not null,
  company_id text not null,
  job_type text,
  start_date date,
  end_date date,
  guide_rating integer,
  company_rating integer,
  created_at timestamp with time zone not null default now(),
  constraint commitments_pkey primary key (id),
  constraint commitments_company_id_fkey foreign key (company_id) references companies (id) on delete cascade,
  constraint commitments_guide_id_fkey foreign key (guide_id) references guides (id) on delete cascade,
  constraint commitments_company_rating_check check (((company_rating >= 1) and (company_rating <= 5))),
  constraint commitments_guide_rating_check check (((guide_rating >= 1) and (guide_rating <= 5)))
);

-- Crear Tabla de Ofertas
create table public.offers (
  id uuid not null default gen_random_uuid(),
  company_id text not null,
  guide_id text not null,
  job_type text,
  description text,
  start_date date,
  end_date date,
  status text not null default 'pending'::text,
  created_at timestamp with time zone not null default now(),
  constraint offers_pkey primary key (id),
  constraint offers_company_id_fkey foreign key (company_id) references companies (id) on delete cascade,
  constraint offers_guide_id_fkey foreign key (guide_id) references guides (id) on delete cascade
);

-- Habilitar Seguridad a Nivel de Fila (RLS)
alter table public.companies enable row level security;
alter table public.guides enable row level security;
alter table public.commitments enable row level security;
alter table public.offers enable row level security;

-- Crear Políticas (permitir acceso público de lectura por ahora)
create policy "Las compañías públicas son visibles para todos." on public.companies for select using (true);
create policy "Los guías públicos son visibles para todos." on public.guides for select using (true);
create policy "Los compromisos públicos son visibles para todos." on public.commitments for select using (true);
create policy "Las ofertas públicas son visibles para todos." on public.offers for select using (true);

-- Para las mutaciones, confiaremos en la clave anónima por ahora, que tiene acceso completo.
-- En una aplicación real, configurarías políticas basadas en roles de usuario autenticados.
create policy "Los usuarios pueden insertar sus propias compañías." on public.companies for insert with check (true);
create policy "Los usuarios pueden actualizar sus propias compañías." on public.companies for update using (true);
create policy "Los usuarios pueden insertar sus propios guías." on public.guides for insert with check (true);
create policy "Los usuarios pueden actualizar sus propios guías." on public.guides for update using (true);
create policy "Los usuarios pueden insertar sus propios compromisos." on public.commitments for insert with check (true);
create policy "Los usuarios pueden actualizar sus propios compromisos." on public.commitments for update using (true);
create policy "Los usuarios pueden insertar sus propias ofertas." on public.offers for insert with check (true);
create policy "Los usuarios pueden actualizar sus propias ofertas." on public.offers for update using (true);


-- Insertar Datos de Ejemplo
-- Nota: Creando fechas y arrays manualmente para SQL.
-- Compañías
INSERT INTO public.companies (id, name, email, avatar, specialties, details) VALUES
('comp1', 'Buscadores de Aventuras S.A.', 'contacto@buscadoresdeaventuras.com', 'https://placehold.co/100x100.png', '{"Senderismo", "Ciclismo de Montaña", "Kayak"}', 'Proveedor líder de tours de aventura al aire libre durante más de 15 años. Nos enfocamos en experiencias sostenibles y emocionantes.'),
('comp2', 'Tours CityScape', 'reservas@tourscityscape.com', 'https://placehold.co/100x100.png', '{"Historia", "Arquitectura", "Tours Gastronómicos"}', 'Explora las joyas ocultas de la ciudad con nuestros expertos guías locales. Ofrecemos una variedad de tours a pie y en autobús.');

-- Guías
INSERT INTO public.guides (id, name, email, avatar, specialties, languages, rate, availability) VALUES
('guide1', 'Alicia Rodríguez', 'alicia.r@email.com', 'https://placehold.co/100x100.png', '{"Historia", "Historia del Arte"}', '{"Inglés", "Español"}', 250, ARRAY[CURRENT_DATE + 5, CURRENT_DATE + 6, CURRENT_DATE + 10, CURRENT_DATE + 11, CURRENT_DATE + 12]),
('guide2', 'Roberto Williams', 'roberto.w@email.com', 'https://placehold.co/100x100.png', '{"Senderismo", "Vida Silvestre"}', '{"Inglés", "Francés"}', 300, ARRAY[CURRENT_DATE + 7, CURRENT_DATE + 8, CURRENT_DATE + 9, CURRENT_DATE + 14]),
('guide3', 'Carlos Pérez', 'carlos.p@email.com', 'https://placehold.co/100x100.png', '{"Tours Gastronómicos", "Vida Nocturna"}', '{"Inglés", "Italiano"}', 220, ARRAY[CURRENT_DATE + 2, CURRENT_DATE + 3, CURRENT_DATE + 4]),
('guide4', 'Diana Prince', 'diana.p@email.com', 'https://placehold.co/100x100.png', '{"Arquitectura", "Arte Moderno"}', '{"Inglés", "Alemán"}', 275, ARRAY[CURRENT_DATE + 1, CURRENT_DATE + 2, CURRENT_DATE + 8, CURRENT_DATE + 9, CURRENT_DATE + 10]);

-- Compromisos
INSERT INTO public.commitments (guide_id, company_id, job_type, start_date, end_date, guide_rating, company_rating) VALUES
('guide1', 'comp2', 'Recorrido por Museo de Arte', CURRENT_DATE - 20, CURRENT_DATE - 18, 5, 5),
('guide1', 'comp1', 'Ruta de Senderismo Histórica', CURRENT_DATE - 10, CURRENT_DATE - 8, 4, NULL),
('guide1', 'comp2', 'Recorrido Histórico a Pie', CURRENT_DATE + 1, CURRENT_DATE + 3, NULL, NULL),
('guide3', 'comp2', 'Gastronomía y Vinos del Centro', CURRENT_DATE + 20, CURRENT_DATE + 20, NULL, NULL),
('guide3', 'comp1', 'Aventura en Kayak', CURRENT_DATE - 5, CURRENT_DATE - 5, NULL, 5);

-- Ofertas
INSERT INTO public.offers (company_id, guide_id, job_type, description, start_date, end_date, status) VALUES
('comp2', 'guide2', 'Tour Arquitectónico Especial', 'Un tour de 2 días para un cliente corporativo centrado en la arquitectura moderna de la ciudad.', CURRENT_DATE + 7, CURRENT_DATE + 8, 'pending'),
('comp1', 'guide3', 'Paseo en Kayak para Principiantes', 'Guía a un grupo de 10 personas en un pintoresco recorrido en kayak por el río. Todo el equipo está incluido.', CURRENT_DATE + 4, CURRENT_DATE + 4, 'pending');
