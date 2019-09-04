UPDATE system.event
SET data = jsonb_build_object('version', coalesce(substring(data ->> 'file', 0, 17), data ->> 'version'))
WHERE type = 'run_migration';
