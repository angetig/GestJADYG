-- Migration : Création de la table financial_transactions pour la comptabilité des groupes

-- Création de la table financial_transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  recorded_by TEXT NOT NULL,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  category TEXT,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_financial_transactions_group_name ON financial_transactions(group_name);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_group_date ON financial_transactions(group_name, date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category) WHERE category IS NOT NULL;

-- Trigger pour mettre à jour updated_at automatiquement
-- Supprimer d'abord le trigger s'il existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_financial_transactions_updated_at'
    AND tgrelid = 'financial_transactions'::regclass
  ) THEN
    EXECUTE 'DROP TRIGGER trigger_financial_transactions_updated_at ON financial_transactions';
  END IF;
END $$;

-- Créer ou remplacer la fonction
CREATE OR REPLACE FUNCTION update_financial_transactions_updated_at()
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
    WHERE tgname = 'trigger_financial_transactions_updated_at'
    AND tgrelid = 'financial_transactions'::regclass
  ) THEN
    CREATE TRIGGER trigger_financial_transactions_updated_at
      BEFORE UPDATE ON financial_transactions
      FOR EACH ROW
      EXECUTE FUNCTION update_financial_transactions_updated_at();
  END IF;
END $$;

-- Commentaires sur la table et les colonnes
COMMENT ON TABLE financial_transactions IS 'Table des transactions financières des groupes de jeunesse';
COMMENT ON COLUMN financial_transactions.group_name IS 'Nom du groupe qui enregistre la transaction';
COMMENT ON COLUMN financial_transactions.date IS 'Date de l''opération financière';
COMMENT ON COLUMN financial_transactions.description IS 'Libellé/description de l''opération';
COMMENT ON COLUMN financial_transactions.type IS 'Type de transaction: income (recette) ou expense (dépense)';
COMMENT ON COLUMN financial_transactions.amount IS 'Montant en FCFA';
COMMENT ON COLUMN financial_transactions.recorded_by IS 'Personne qui a enregistré la transaction';
COMMENT ON COLUMN financial_transactions.category IS 'Catégorie optionnelle (cotisation, achat matériel, don, etc.)';

-- Insérer quelques données d'exemple pour les tests
INSERT INTO financial_transactions (group_name, date, description, type, amount, recorded_by, category)
VALUES
  ('Disciples', '2025-08-01', 'Cotisations mensuelles', 'income', 150000, 'Admin', 'cotisation'),
  ('Disciples', '2025-08-05', 'Achat de matériel sportif', 'expense', 75000, 'Admin', 'achat matériel'),
  ('Disciples', '2025-08-15', 'Participation évènement régional', 'income', 50000, 'Admin', 'évènement'),
  ('Les Élus', '2025-08-03', 'Don de bienfaisance', 'income', 50000, 'Admin', 'don'),
  ('Les Élus', '2025-08-10', 'Sortie évangélisation', 'expense', 25000, 'Admin', 'évangélisation'),
  ('Les Élus', '2025-08-20', 'Achat de livres bibliques', 'expense', 30000, 'Admin', 'achat matériel'),
  ('Sel et Lumière', '2025-08-02', 'Vente de pâtisseries', 'income', 30000, 'Admin', 'activité'),
  ('Sel et Lumière', '2025-08-08', 'Location de salle', 'expense', 40000, 'Admin', 'location'),
  ('Sel et Lumière', '2025-08-12', 'Cotisations membres', 'income', 80000, 'Admin', 'cotisation'),
  ('Porteurs de l''Alliance', '2025-08-04', 'Cotisations membres', 'income', 120000, 'Admin', 'cotisation'),
  ('Porteurs de l''Alliance', '2025-08-18', 'Frais de transport', 'expense', 15000, 'Admin', 'transport'),
  ('Vases d''Honneur', '2025-08-06', 'Don spécial', 'income', 25000, 'Admin', 'don'),
  ('Vases d''Honneur', '2025-08-14', 'Matériel de musique', 'expense', 45000, 'Admin', 'achat matériel'),
  ('Flambeaux', '2025-08-07', 'Cotisations mensuelles', 'income', 90000, 'Admin', 'cotisation'),
  ('Flambeaux', '2025-08-16', 'Sortie culturelle', 'expense', 35000, 'Admin', 'activité'),
  ('Serviteurs Fidèles', '2025-08-09', 'Participation formation', 'income', 20000, 'Admin', 'formation'),
  ('Serviteurs Fidèles', '2025-08-21', 'Achat de chaises', 'expense', 60000, 'Admin', 'achat matériel'),
  ('Héritiers du Royaume', '2025-08-11', 'Cotisations membres', 'income', 70000, 'Admin', 'cotisation'),
  ('Héritiers du Royaume', '2025-08-19', 'Frais de communication', 'expense', 10000, 'Admin', 'communication')
ON CONFLICT DO NOTHING;