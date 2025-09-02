-- Migration : Ajout du système de matricule pour les jeunes
-- Ajout des colonnes matricule et date_affectation

-- Ajouter les nouvelles colonnes à la table youth_registrations
ALTER TABLE youth_registrations
ADD COLUMN IF NOT EXISTS matricule TEXT,
ADD COLUMN IF NOT EXISTS date_affectation TIMESTAMP;

-- Créer un index sur le matricule pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_youth_matricule ON youth_registrations(matricule);
CREATE INDEX IF NOT EXISTS idx_youth_groupe_matricule ON youth_registrations(groupe_assigne, matricule);

-- Contrainte d'unicité pour le matricule
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'matricule_unique'
        AND table_name = 'youth_registrations'
    ) THEN
        ALTER TABLE youth_registrations ADD CONSTRAINT matricule_unique UNIQUE(matricule);
    END IF;
END $$;

-- Fonction pour générer un matricule unique
CREATE OR REPLACE FUNCTION generate_matricule(year_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  random_part TEXT;
  new_matricule TEXT;
  counter INTEGER := 0;
  max_attempts INTEGER := 1000;
BEGIN
  -- Utiliser l'année fournie ou l'année actuelle
  IF year_code IS NULL THEN
    year_part := TO_CHAR(EXTRACT(YEAR FROM NOW()), 'FM00');
  ELSE
    year_part := year_code;
  END IF;

  -- Générer un matricule unique
  LOOP
    -- Générer 2 caractères alphanumériques aléatoires
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 2));

    -- Combiner année + caractères aléatoires
    new_matricule := year_part || random_part;

    -- Vérifier si le matricule existe déjà
    IF NOT EXISTS (SELECT 1 FROM youth_registrations WHERE matricule = new_matricule) THEN
      RETURN new_matricule;
    END IF;

    -- Éviter une boucle infinie
    counter := counter + 1;
    IF counter >= max_attempts THEN
      RAISE EXCEPTION 'Impossible de générer un matricule unique après % tentatives', max_attempts;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour attribuer automatiquement un matricule lors de l'affectation à un groupe
CREATE OR REPLACE FUNCTION assign_matricule_on_group_assignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le groupe est assigné et qu'il n'y a pas encore de matricule
  IF NEW.groupe_assigne IS NOT NULL AND (OLD.groupe_assigne IS NULL OR NEW.groupe_assigne != OLD.groupe_assigne) THEN
    -- Générer un matricule si ce n'est pas déjà fait
    IF NEW.matricule IS NULL THEN
      NEW.matricule := generate_matricule();
    END IF;

    -- Définir la date d'affectation si ce n'est pas déjà fait
    IF NEW.date_affectation IS NULL THEN
      NEW.date_affectation := NOW();
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour l'affectation automatique des matricules
DROP TRIGGER IF EXISTS assign_matricule_trigger ON youth_registrations;
CREATE TRIGGER assign_matricule_trigger
  BEFORE INSERT OR UPDATE ON youth_registrations
  FOR EACH ROW
  EXECUTE FUNCTION assign_matricule_on_group_assignment();

-- Vue pour les statistiques des matricules par année
CREATE VIEW matricule_stats AS
SELECT
  SUBSTRING(matricule FROM 1 FOR 2) as year_code,
  COUNT(*) as total_matricules,
  COUNT(DISTINCT groupe_assigne) as groups_count,
  MIN(date_affectation) as first_assignment,
  MAX(date_affectation) as last_assignment
FROM youth_registrations
WHERE matricule IS NOT NULL
GROUP BY SUBSTRING(matricule FROM 1 FOR 2)
ORDER BY year_code DESC;

-- Fonction pour valider le format du matricule
CREATE OR REPLACE FUNCTION validate_matricule_format(matricule_input TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Le matricule doit faire exactement 4 caractères
  -- 2 premiers : chiffres (année)
  -- 2 derniers : alphanumériques
  IF LENGTH(matricule_input) != 4 THEN
    RETURN FALSE;
  END IF;

  -- Vérifier le format : 2 chiffres + 2 caractères alphanumériques
  IF NOT (matricule_input ~ '^[0-9]{2}[A-Z0-9]{2}$') THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Contrainte pour valider le format du matricule
-- Vérifier si la contrainte existe déjà avant de l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'matricule_format_check'
        AND table_name = 'youth_registrations'
    ) THEN
        ALTER TABLE youth_registrations
        ADD CONSTRAINT matricule_format_check
        CHECK (matricule IS NULL OR validate_matricule_format(matricule));
    END IF;
END $$;

-- Fonction utilitaire pour attribuer des matricules aux jeunes existants sans matricule
CREATE OR REPLACE FUNCTION assign_matricules_to_existing_youth()
RETURNS INTEGER AS $$
DECLARE
  youth_record RECORD;
  assigned_count INTEGER := 0;
BEGIN
  -- Parcourir tous les jeunes qui ont un groupe assigné mais pas de matricule
  FOR youth_record IN
    SELECT id, groupe_assigne
    FROM youth_registrations
    WHERE groupe_assigne IS NOT NULL
    AND matricule IS NULL
  LOOP
    -- Générer et attribuer un matricule
    UPDATE youth_registrations
    SET
      matricule = generate_matricule(),
      date_affectation = COALESCE(date_affectation, NOW())
    WHERE id = youth_record.id;

    assigned_count := assigned_count + 1;
  END LOOP;

  RETURN assigned_count;
END;
$$ LANGUAGE plpgsql;

-- Commentaire sur l'utilisation
COMMENT ON FUNCTION generate_matricule IS 'Génère un matricule unique au format AAYY où AA=année, YY=code alphanumérique';
COMMENT ON FUNCTION assign_matricules_to_existing_youth IS 'Attribue des matricules aux jeunes existants qui n''en ont pas';
COMMENT ON COLUMN youth_registrations.matricule IS 'Matricule unique du jeune (format: AAYY, ex: 25A3)';
COMMENT ON COLUMN youth_registrations.date_affectation IS 'Date d''affectation du jeune dans son groupe actuel';