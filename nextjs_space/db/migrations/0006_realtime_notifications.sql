-- Create function to notify on signals table changes
CREATE OR REPLACE FUNCTION notify_signal_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', OLD.id,
      'userId', OLD.user_id
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN OLD;
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'userId', NEW.user_id,
      'data', row_to_json(NEW)
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for signals table
DROP TRIGGER IF EXISTS signal_change_trigger ON signals;
CREATE TRIGGER signal_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON signals
FOR EACH ROW EXECUTE FUNCTION notify_signal_change();

-- Create function to notify on alert_history table changes
CREATE OR REPLACE FUNCTION notify_alert_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', OLD.id,
      'userId', OLD.user_id
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN OLD;
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'userId', NEW.user_id,
      'data', row_to_json(NEW)
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for alert_history table
DROP TRIGGER IF EXISTS alert_change_trigger ON alert_history;
CREATE TRIGGER alert_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON alert_history
FOR EACH ROW EXECUTE FUNCTION notify_alert_change();

-- Create function to notify on scheduled_agent_jobs table changes
CREATE OR REPLACE FUNCTION notify_agent_job_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
  agent_user_id TEXT;
BEGIN
  -- Get the user_id from the parent agent
  SELECT user_id INTO agent_user_id
  FROM scheduled_agents
  WHERE id = COALESCE(NEW.agent_id, OLD.agent_id);

  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', OLD.id,
      'userId', agent_user_id,
      'agentId', OLD.agent_id
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN OLD;
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'userId', agent_user_id,
      'agentId', NEW.agent_id,
      'data', row_to_json(NEW)
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduled_agent_jobs table
DROP TRIGGER IF EXISTS agent_job_change_trigger ON scheduled_agent_jobs;
CREATE TRIGGER agent_job_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON scheduled_agent_jobs
FOR EACH ROW EXECUTE FUNCTION notify_agent_job_change();

-- Create function to notify on scheduled_agents table changes
CREATE OR REPLACE FUNCTION notify_agent_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', OLD.id,
      'userId', OLD.user_id
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN OLD;
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'userId', NEW.user_id,
      'data', row_to_json(NEW)
    );
    PERFORM pg_notify('db_changes', payload::text);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for scheduled_agents table
DROP TRIGGER IF EXISTS agent_change_trigger ON scheduled_agents;
CREATE TRIGGER agent_change_trigger
AFTER INSERT OR UPDATE OR DELETE ON scheduled_agents
FOR EACH ROW EXECUTE FUNCTION notify_agent_change();
