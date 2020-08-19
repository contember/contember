CREATE TABLE tenant.mail_template (
	id         UUID NOT NULL PRIMARY KEY,
	project_id UUID NOT NULL,
	mail_type  TEXT NOT NULL,
	variant    TEXT NOT NULL,
	subject    TEXT NOT NULL,
	content    TEXT NOT NULL,
	use_layout BOOL NOT NULL,
	CONSTRAINT mail_template_project FOREIGN KEY (project_id) REFERENCES tenant.project(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX mail_template_identifier ON tenant.mail_template(project_id, mail_type, variant);
CREATE INDEX mail_template_project_index
	ON tenant.mail_template(project_id);
