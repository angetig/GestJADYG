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

-- La table commence vide pour utiliser des données réelles uniquement
-- Les transactions seront ajoutées manuellement par les utilisateurs