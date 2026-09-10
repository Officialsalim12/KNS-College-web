-- Scholarship seed data for KNS College
-- Run after schema migration

INSERT INTO scholarships (title, award_summary, eligibility, deadline, is_active, guide_path, form_path) VALUES
    ('KNS DIPLOMA PARTIAL SCHOLARSHIP 2026',
     'Partial funding on tuition fees for eligible diploma programmes',
     '[
         {"requirement": "Must be applying for or enrolled in a 2-year diploma programme at KNS College"},
         {"requirement": "Must demonstrate academic excellence and financial need"},
         {"requirement": "Must be a Sierra Leone citizen or permanent resident"},
         {"requirement": "Must meet KNS College admission requirements"}
     ]'::jsonb,
     '2026-09-18 23:59:59+00',
     TRUE,
     NULL,
     NULL
);
