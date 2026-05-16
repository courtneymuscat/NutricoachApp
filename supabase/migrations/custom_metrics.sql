-- Custom metrics: user-defined trackable measurements beyond weight
-- (body fat %, body measurements, RHR, blood pressure, etc.)

CREATE TABLE IF NOT EXISTS custom_metrics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  unit        text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  archived    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT custom_metrics_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS custom_metrics_user_idx
  ON custom_metrics (user_id, archived, sort_order);

ALTER TABLE custom_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manage_custom_metrics" ON custom_metrics
  FOR ALL USING (user_id = auth.uid());

-- Coaches can read their active clients' metric definitions
CREATE POLICY "coach_read_custom_metrics" ON custom_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.client_id = custom_metrics.user_id
        AND coach_clients.coach_id = auth.uid()
        AND coach_clients.status = 'active'
    )
  );


CREATE TABLE IF NOT EXISTS custom_metric_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  metric_id   uuid NOT NULL REFERENCES custom_metrics(id) ON DELETE CASCADE,
  value       numeric NOT NULL,
  logged_at   timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS custom_metric_logs_user_metric_idx
  ON custom_metric_logs (user_id, metric_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS custom_metric_logs_metric_idx
  ON custom_metric_logs (metric_id, logged_at DESC);

ALTER TABLE custom_metric_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manage_custom_metric_logs" ON custom_metric_logs
  FOR ALL USING (user_id = auth.uid());

-- Coaches can read their active clients' metric entries
CREATE POLICY "coach_read_custom_metric_logs" ON custom_metric_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM coach_clients
      WHERE coach_clients.client_id = custom_metric_logs.user_id
        AND coach_clients.coach_id = auth.uid()
        AND coach_clients.status = 'active'
    )
  );
