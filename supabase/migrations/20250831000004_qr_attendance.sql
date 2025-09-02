-- Migration : Création des tables pour le système de pointage QR Code
-- Table des QR Codes générés pour les événements
CREATE TABLE qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  group_name TEXT NOT NULL,
  qr_code TEXT NOT NULL, -- Base64 encoded QR code data
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Table des enregistrements de présence
CREATE TABLE attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id uuid REFERENCES qr_codes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_group TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_title TEXT NOT NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT NOW(),
  location TEXT, -- GPS coordinates if available
  device_info TEXT
);

-- Index pour optimiser les recherches
CREATE INDEX idx_qr_codes_group_name ON qr_codes(group_name);
CREATE INDEX idx_qr_codes_expires_at ON qr_codes(expires_at);
CREATE INDEX idx_qr_codes_is_active ON qr_codes(is_active);
CREATE INDEX idx_attendance_records_qr_code_id ON attendance_records(qr_code_id);
CREATE INDEX idx_attendance_records_user_id ON attendance_records(user_id);
CREATE INDEX idx_attendance_records_event_id ON attendance_records(event_id);
CREATE INDEX idx_attendance_records_scanned_at ON attendance_records(scanned_at);

-- Fonction pour désactiver automatiquement les QR codes expirés
CREATE OR REPLACE FUNCTION deactivate_expired_qr_codes()
RETURNS void AS $$
BEGIN
  UPDATE qr_codes
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les QR codes expirés
CREATE OR REPLACE FUNCTION check_qr_code_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Désactiver le QR code s'il est expiré
  IF NEW.expires_at < NOW() THEN
    NEW.is_active := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER qr_code_expiry_trigger
  BEFORE INSERT OR UPDATE ON qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION check_qr_code_expiry();

-- Vue pour les statistiques de présence
CREATE VIEW attendance_stats AS
SELECT
  event_id,
  event_title,
  user_group as group_name,
  COUNT(*) as total_attendees,
  COUNT(DISTINCT user_id) as unique_attendees,
  MIN(scanned_at) as first_scan,
  MAX(scanned_at) as last_scan
FROM attendance_records
GROUP BY event_id, event_title, user_group;

-- Fonction pour nettoyer les anciens enregistrements (optionnel)
CREATE OR REPLACE FUNCTION cleanup_old_attendance_records(days_old INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM attendance_records
  WHERE scanned_at < (NOW() - INTERVAL '1 day' * days_old);

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;