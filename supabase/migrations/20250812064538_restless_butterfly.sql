/*
  # Système de Répartition des Groupes de Jeunesse

  1. New Tables
    - `youth_registrations`
      - `id` (uuid, primary key)
      - `nom_prenom` (text, nom et prénom complet)
      - `genre` (text, Homme/Femme)
      - `tranche_age` (text, 13-17, 18-24, etc.)
      - `photo_url` (text, URL de la photo optionnelle)
      - `quartier_residence` (text, quartier de résidence)
      - `contact1` (text, contact principal)
      - `contact2` (text, contact secondaire optionnel)
      - `statut_matrimonial` (text, Marié(e), Célibataire, etc.)
      - `situation_professionnelle` (text, Étudiant(e), Travailleur, Sans emploi)
      - `type_travail` (text, Public, Privé, etc.)
      - `niveau_etude` (text, niveau d'études)
      - `annee_conversion` (text, années de conversion)
      - `bapteme_eau` (text, OUI/NON)
      - `bapteme_saint_esprit` (text, OUI/NON)
      - `message_jeunesse` (text, message optionnel)
      - `groupe_assigne` (text, nom du groupe assigné)
      - `date_inscription` (timestamptz, date d'inscription)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `youth_registrations` table
    - Add policies for public read/write access (pour les inscriptions)
    - Add policies for authenticated users (admin/responsables)
*/

CREATE TABLE IF NOT EXISTS youth_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom_prenom text NOT NULL,
  genre text NOT NULL CHECK (genre IN ('Homme', 'Femme')),
  tranche_age text NOT NULL CHECK (tranche_age IN ('13-17', '18-24', '25-30', '31-40', '41+')),
  photo_url text,
  quartier_residence text NOT NULL,
  contact1 text NOT NULL,
  contact2 text,
  statut_matrimonial text NOT NULL CHECK (statut_matrimonial IN ('Marié(e)', 'Célibataire', 'Veuf(ve)', 'Fiancé(e)', 'Concubinage')),
  situation_professionnelle text NOT NULL CHECK (situation_professionnelle IN ('Étudiant(e)', 'Travailleur', 'Sans emploi')),
  type_travail text CHECK (type_travail IN ('Public', 'Privé', 'Entrepreneur', 'Je vais au cours')),
  niveau_etude text NOT NULL CHECK (niveau_etude IN ('Aucun', 'Primaire', 'Secondaire', 'Formation qualifiante', 'Bac', 'BTS', 'Licence', 'Master', 'Doctorat', 'Formation professionnelle', 'DUT')),
  annee_conversion text NOT NULL CHECK (annee_conversion IN ('0-3', '4-7', '7-10', '10-20', '20-40', '40+')),
  bapteme_eau text NOT NULL CHECK (bapteme_eau IN ('OUI', 'NON')),
  bapteme_saint_esprit text NOT NULL CHECK (bapteme_saint_esprit IN ('OUI', 'NON')),
  message_jeunesse text,
  groupe_assigne text NOT NULL CHECK (groupe_assigne IN ('Disciples', 'Les Élus', 'Sel et Lumière', 'Porteurs de l''Alliance', 'Bergerie du Maître', 'Vases d''Honneur', 'Sacerdoce Royal', 'Flambeaux', 'Serviteurs Fidèles', 'Héritiers du Royaume')),
  date_inscription timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE youth_registrations ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre les inscriptions publiques (création)
CREATE POLICY "Allow public registration"
  ON youth_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy pour permettre la lecture publique (pour les statistiques)
CREATE POLICY "Allow public read"
  ON youth_registrations
  FOR SELECT
  TO anon
  USING (true);

-- Policy pour permettre aux utilisateurs authentifiés de tout voir et modifier
CREATE POLICY "Allow authenticated full access"
  ON youth_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_youth_registrations_groupe ON youth_registrations(groupe_assigne);
CREATE INDEX IF NOT EXISTS idx_youth_registrations_date ON youth_registrations(date_inscription);
CREATE INDEX IF NOT EXISTS idx_youth_registrations_duplicate_check ON youth_registrations(nom_prenom, situation_professionnelle, statut_matrimonial, quartier_residence);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_youth_registrations_updated_at
    BEFORE UPDATE ON youth_registrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();