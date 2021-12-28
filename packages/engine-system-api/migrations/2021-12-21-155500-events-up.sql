CREATE INDEX event_data_created ON system.event_data (created_at);
CREATE INDEX transaction_applied ON system.stage_transaction (applied_at);

ALTER TABLE system.stage
	DROP event_id;
DROP TABLE system.event_bak;
