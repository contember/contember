CREATE INDEX project_alias ON project USING gin ((config -> 'alias'));
