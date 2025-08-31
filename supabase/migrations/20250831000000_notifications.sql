-- Migration : Création de la table notifications pour le système de notifications

-- Création de la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('event_submitted', 'event_approved', 'event_rejected', 'admin_event_created')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('admin', 'group_leader')),
  recipient_group TEXT, -- Pour les responsables de groupe
  event_id TEXT, -- Référence à l'événement si applicable
  event_title TEXT, -- Titre de l'événement pour référence
  group_name TEXT, -- Nom du groupe concerné
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  read BOOLEAN NOT NULL DEFAULT FALSE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_type ON notifications(recipient_type);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_group ON notifications(recipient_group);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON notifications(event_id);

-- Index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_type, recipient_group, read);

-- Commentaire sur la table
COMMENT ON TABLE notifications IS 'Table des notifications pour le système de gestion d''événements';
COMMENT ON COLUMN notifications.type IS 'Type de notification: event_submitted, event_approved, event_rejected, admin_event_created';
COMMENT ON COLUMN notifications.recipient_type IS 'Type de destinataire: admin ou group_leader';
COMMENT ON COLUMN notifications.recipient_group IS 'Nom du groupe pour les responsables de groupe';