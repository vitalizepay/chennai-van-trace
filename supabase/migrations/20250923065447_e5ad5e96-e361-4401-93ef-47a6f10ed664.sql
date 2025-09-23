-- Create sample students for testing the dashboard functionality

-- Insert students for parent "paranet-maharishi" (school: maharishi, van: maharishi01)
INSERT INTO students (
  full_name, 
  grade, 
  pickup_stop, 
  parent_id, 
  van_id, 
  school_id,
  emergency_contact,
  medical_info,
  status,
  boarded,
  dropped
) VALUES 
(
  'Aarav Kumar', 
  'Grade 5', 
  'Tirumangalam Bus Stop', 
  'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd', -- paranet-maharishi user_id
  '07ce6265-069a-4a80-bb38-b40fc776bfc3', -- maharishi01 van_id
  '0d14739b-a4ca-4c9c-98a8-8953ac890633', -- maharishi school_id
  '8428334557',
  'No medical conditions',
  'active',
  false,
  false
),
(
  'Sneha Patel', 
  'Grade 3', 
  'Tirumangalam Bus Stop', 
  'b1eab585-bb9d-4cd9-8b9e-24ef51fb72bd', -- paranet-maharishi user_id  
  '07ce6265-069a-4a80-bb38-b40fc776bfc3', -- maharishi01 van_id
  '0d14739b-a4ca-4c9c-98a8-8953ac890633', -- maharishi school_id
  '8428334557',
  'Asthma - carries inhaler',
  'active',
  false,
  false
);

-- Insert students for parent "Senthil" (school: CHINMAYA, van: CHINMAYA01)
INSERT INTO students (
  full_name, 
  grade, 
  pickup_stop, 
  parent_id, 
  van_id, 
  school_id,
  emergency_contact,
  medical_info,
  status,
  boarded,
  dropped
) VALUES 
(
  'Priya Sharma', 
  'Grade 4', 
  'Karthinagar Bus Stop', 
  '888267fe-e96f-49ec-9730-4aff7aed4c0f', -- Senthil user_id
  '7e8badb0-8e00-47b4-833d-0a454c038846', -- CHINMAYA01 van_id
  '87c18212-75be-4d7f-8c74-350ad7e1e093', -- CHINMAYA school_id
  '9944205805',
  'Food allergy - nuts',
  'active',
  false,
  false
),
(
  'Karthik Raja', 
  'Grade 6', 
  'Karthinagar Bus Stop', 
  '888267fe-e96f-49ec-9730-4aff7aed4c0f', -- Senthil user_id
  '7e8badb0-8e00-47b4-833d-0a454c038846', -- CHINMAYA01 van_id
  '87c18212-75be-4d7f-8c74-350ad7e1e093', -- CHINMAYA school_id
  '9944205805',
  'No medical conditions',
  'active',
  false,
  false
);