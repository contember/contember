ALTER TABLE person
	ADD name TEXT;
UPDATE person
SET name = SPLIT_PART(email, '@', 1);
