-- Migration : Mise à jour de la table event_requests pour les demandes d'événement

-- Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE event_requests
ADD COLUMN IF NOT EXISTS admin_comment TEXT,
ADD COLUMN IF NOT EXISTS rejection_comment TEXT;

-- Modifier la valeur par défaut du statut
ALTER TABLE event_requests
ALTER COLUMN status SET DEFAULT 'draft';

-- Ajouter la contrainte de vérification pour le statut (seulement si elle n'existe pas)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'event_requests_status_check'
        AND table_name = 'event_requests'
    ) THEN
        ALTER TABLE event_requests
        ADD CONSTRAINT event_requests_status_check
        CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));
    END IF;
END $$;

-- Création de la table bureaux
CREATE TABLE IF NOT EXISTS bureaux (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Création de la table bureau_members
CREATE TABLE IF NOT EXISTS bureau_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id uuid REFERENCES bureaux(id) ON DELETE CASCADE,
  youth_id TEXT NOT NULL,
  role TEXT NOT NULL,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(bureau_id, youth_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_bureau_members_bureau_id ON bureau_members(bureau_id);
CREATE INDEX IF NOT EXISTS idx_bureau_members_youth_id ON bureau_members(youth_id);
