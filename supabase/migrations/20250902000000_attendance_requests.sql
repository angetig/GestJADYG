-- Migration : Système de demandes de présence avec matricule et confirmation
-- Table pour gérer les demandes de présence avec validation par responsable

-- Créer la table des demandes de présence
CREATE TABLE IF NOT EXISTS attendance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricule TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_group TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_id TEXT NOT NULL,
  qr_code_id TEXT NOT NULL,
  group_leader_id TEXT NOT NULL,
  group_leader_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_attendance_requests_matricule ON attendance_requests(matricule);
CREATE INDEX IF NOT EXISTS idx_attendance_requests_group_leader ON attendance_requests(group_leader_id);
CREATE INDEX IF NOT EXISTS idx_attendance_requests_event ON attendance_requests(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_requests_status ON attendance_requests(status);
CREATE INDEX IF NOT EXISTS idx_attendance_requests_requested_at ON attendance_requests(requested_at);

-- Contrainte pour éviter les doublons de demandes en attente
-- Un même matricule ne peut pas avoir plusieurs demandes en attente pour le même événement
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_request
ON attendance_requests(matricule, event_id)
WHERE status = 'pending';

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_attendance_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_attendance_requests_updated_at_trigger ON attendance_requests;
CREATE TRIGGER update_attendance_requests_updated_at_trigger
    BEFORE UPDATE ON attendance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_attendance_requests_updated_at();

-- Fonction utilitaire pour nettoyer les anciennes demandes approuvées/rejetées
CREATE OR REPLACE FUNCTION cleanup_old_attendance_requests(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM attendance_requests
  WHERE status IN ('approved', 'rejected')
  AND requested_at < NOW() - INTERVAL '1 day' * days_old;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les statistiques des demandes de présence
CREATE VIEW attendance_request_stats AS
SELECT
  group_leader_id,
  group_leader_name,
  user_group,
  status,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  MIN(requested_at) as first_request,
  MAX(requested_at) as last_request
FROM attendance_requests
GROUP BY group_leader_id, group_leader_name, user_group, status;

-- Commentaires sur les colonnes
COMMENT ON TABLE attendance_requests IS 'Table des demandes de présence avec validation par responsable de groupe';
COMMENT ON COLUMN attendance_requests.matricule IS 'Matricule du jeune demandant la présence (format AAYY)';
COMMENT ON COLUMN attendance_requests.user_name IS 'Nom complet du jeune';
COMMENT ON COLUMN attendance_requests.user_group IS 'Groupe d''appartenance du jeune';
COMMENT ON COLUMN attendance_requests.event_title IS 'Titre de l''événement';
COMMENT ON COLUMN attendance_requests.event_id IS 'ID unique de l''événement';
COMMENT ON COLUMN attendance_requests.qr_code_id IS 'ID du QR code scanné';
COMMENT ON COLUMN attendance_requests.group_leader_id IS 'ID du responsable de groupe';
COMMENT ON COLUMN attendance_requests.group_leader_name IS 'Nom du responsable de groupe';
COMMENT ON COLUMN attendance_requests.status IS 'Statut de la demande: pending, approved, rejected';
COMMENT ON COLUMN attendance_requests.requested_at IS 'Date et heure de la demande';
COMMENT ON COLUMN attendance_requests.updated_at IS 'Date de dernière mise à jour du statut';

-- Permissions RLS (Row Level Security)
ALTER TABLE attendance_requests ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre aux responsables de groupe de voir leurs propres demandes
CREATE POLICY "Group leaders can view their own requests"
  ON attendance_requests
  FOR SELECT
  TO authenticated
  USING (group_leader_id = auth.uid()::text);

-- Policy pour permettre aux responsables de groupe de mettre à jour leurs propres demandes
CREATE POLICY "Group leaders can update their own requests"
  ON attendance_requests
  FOR UPDATE
  TO authenticated
  USING (group_leader_id = auth.uid()::text);

-- Policy pour permettre aux jeunes d'insérer leurs propres demandes
CREATE POLICY "Users can insert their own requests"
  ON attendance_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy pour permettre aux admins de tout voir
CREATE POLICY "Admins can view all requests"
  ON attendance_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );