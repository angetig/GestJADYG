-- Migration : Création/Mise à jour de la table social_cases pour les cas sociaux (mariages, naissances, décès)

-- Création de la table social_cases si elle n'existe pas
CREATE TABLE IF NOT EXISTS social_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('marriage', 'death', 'birth')),
  reported_by TEXT NOT NULL, -- Group or person who reported it
  reported_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'validated', 'duplicate', 'rejected')),

  -- Validation fields
  validated_by TEXT,
  validated_at TIMESTAMP,
  rejection_reason TEXT,

  -- Common fields
  description TEXT,

  -- Marriage specific fields
  husband_name TEXT,
  husband_group TEXT,
  wife_name TEXT,
  wife_group TEXT,
  marriage_date DATE,

  -- Death specific fields
  deceased_name TEXT,
  relationship TEXT CHECK (relationship IN ('father', 'mother', 'brother', 'sister', 'child', 'grandparent', 'other')),
  affected_youth JSONB, -- Array of {name: string, group: string} objects
  death_date DATE,

  -- Birth specific fields
  father_name TEXT,
  father_group TEXT,
  mother_name TEXT,
  mother_group TEXT,
  newborn_name TEXT,
  birth_date DATE,

  -- Deduplication
  duplicate_of uuid REFERENCES social_cases(id), -- Reference to original case if duplicate
  linked_youth_ids TEXT[], -- Array of youth member IDs linked to this case

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_social_cases_type ON social_cases(type);
CREATE INDEX IF NOT EXISTS idx_social_cases_status ON social_cases(status);
CREATE INDEX IF NOT EXISTS idx_social_cases_reported_by ON social_cases(reported_by);
CREATE INDEX IF NOT EXISTS idx_social_cases_duplicate_of ON social_cases(duplicate_of);
CREATE INDEX IF NOT EXISTS idx_social_cases_created_at ON social_cases(created_at DESC);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_social_cases_type_status ON social_cases(type, status);
CREATE INDEX IF NOT EXISTS idx_social_cases_reported_at ON social_cases(reported_at DESC);

-- Index pour la recherche par noms (pour la déduplication)
CREATE INDEX IF NOT EXISTS idx_social_cases_husband_name ON social_cases(husband_name) WHERE type = 'marriage';
CREATE INDEX IF NOT EXISTS idx_social_cases_wife_name ON social_cases(wife_name) WHERE type = 'marriage';
CREATE INDEX IF NOT EXISTS idx_social_cases_deceased_name ON social_cases(deceased_name) WHERE type = 'death';
CREATE INDEX IF NOT EXISTS idx_social_cases_newborn_name ON social_cases(newborn_name) WHERE type = 'birth';

-- Index pour les nouveaux champs de naissance
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_cases'
    AND column_name = 'father_name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_cases_father_name ON social_cases(father_name) WHERE type = 'birth';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_cases'
    AND column_name = 'mother_name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_social_cases_mother_name ON social_cases(mother_name) WHERE type = 'birth';
  END IF;
END $$;

-- Supprimer l'ancien index s'il existe
DROP INDEX IF EXISTS idx_social_cases_parent_name;

-- Trigger pour mettre à jour updated_at automatiquement
-- Supprimer d'abord le trigger s'il existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_social_cases_updated_at'
    AND tgrelid = 'social_cases'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER trigger_social_cases_updated_at ON social_cases';
  END IF;
END $$;

-- Créer ou remplacer la fonction
CREATE OR REPLACE FUNCTION update_social_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger seulement s'il n'existe pas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_social_cases_updated_at'
    AND tgrelid = 'social_cases'::regclass
  ) THEN
    CREATE TRIGGER trigger_social_cases_updated_at
      BEFORE UPDATE ON social_cases
      FOR EACH ROW
      EXECUTE FUNCTION update_social_cases_updated_at();
  END IF;
END $$;

-- Commentaire sur la table
COMMENT ON TABLE social_cases IS 'Table des cas sociaux (mariages, naissances, décès) pour éviter les doublons';
COMMENT ON COLUMN social_cases.type IS 'Type de cas social: marriage, death, birth';
COMMENT ON COLUMN social_cases.status IS 'Statut du cas: pending, validated, duplicate';
COMMENT ON COLUMN social_cases.duplicate_of IS 'Référence vers le cas original si c''est un doublon';
COMMENT ON COLUMN social_cases.affected_youth IS 'Liste des jeunes concernés (format JSONB)';
COMMENT ON COLUMN social_cases.linked_youth_ids IS 'IDs des membres de jeunesse liés à ce cas';
-- Mise à jour de la structure si la table existe déjà
-- Ajouter les nouvelles colonnes pour les naissances (père et mère)
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS father_name TEXT;
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS father_group TEXT;
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS mother_name TEXT;
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS mother_group TEXT;

-- Ajouter les colonnes de validation
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS validated_by TEXT;
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP;
ALTER TABLE social_cases ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Supprimer l'ancienne colonne parent_name si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_cases'
    AND column_name = 'parent_name'
  ) THEN
    ALTER TABLE social_cases DROP COLUMN parent_name;
  END IF;
END $$;

-- Supprimer l'ancienne colonne parent_group si elle existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'social_cases'
    AND column_name = 'parent_group'
  ) THEN
    ALTER TABLE social_cases DROP COLUMN parent_group;
  END IF;
END $$;

-- Commentaires sur les colonnes
COMMENT ON COLUMN social_cases.father_name IS 'Nom du père (pour naissances)';
COMMENT ON COLUMN social_cases.father_group IS 'Groupe du père (pour naissances) - peut être vide si père extérieur à l''église';
COMMENT ON COLUMN social_cases.mother_name IS 'Nom de la mère (pour naissances)';
COMMENT ON COLUMN social_cases.mother_group IS 'Groupe de la mère (pour naissances) - peut être vide si mère extérieure à l''église';
COMMENT ON COLUMN social_cases.husband_group IS 'Groupe du mari (pour mariages) - peut être vide si mari extérieur à l''église';
COMMENT ON COLUMN social_cases.wife_group IS 'Groupe de la femme (pour mariages) - peut être vide si femme extérieure à l''église';
COMMENT ON COLUMN social_cases.validated_by IS 'Administrateur qui a validé/rejeté le cas';
COMMENT ON COLUMN social_cases.validated_at IS 'Date de validation/rejet';
COMMENT ON COLUMN social_cases.rejection_reason IS 'Raison du rejet (si applicable)';