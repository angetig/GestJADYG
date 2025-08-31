-- Migration : Création de la table central_bureau pour le bureau central
CREATE TABLE central_bureau (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  members JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Insérer un bureau central par défaut
INSERT INTO central_bureau (name, description, members)
VALUES (
  'Bureau Central JADYG',
  'Équipe dirigeante centrale de la JADYG',
  '[]'::jsonb
)
ON CONFLICT DO NOTHING;

-- Créer une fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_central_bureau_updated_at
    BEFORE UPDATE ON central_bureau
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();