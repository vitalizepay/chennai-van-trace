-- Create a student for the existing parent account
INSERT INTO students (
  parent_id,
  school_id,
  van_id,
  full_name,
  grade,
  pickup_stop,
  emergency_contact,
  status
) VALUES (
  'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd',
  '0d14739b-a4ca-4c9c-98a8-8953ac890633',
  '07ce6265-069a-4a80-bb38-b40fc776bfc3',
  'Maharishi Student',
  '5th Grade',
  'Tirumangalam Main Stop',
  '8428334557',
  'active'
);