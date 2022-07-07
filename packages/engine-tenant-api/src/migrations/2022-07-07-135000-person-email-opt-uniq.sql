ALTER TABLE person
	ALTER email DROP NOT NULL,
	ADD CONSTRAINT email_unique UNIQUE (email);
