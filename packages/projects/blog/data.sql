INSERT INTO "Category" VALUES
	(uuid_generate_v4()),
	(uuid_generate_v4()),
	(uuid_generate_v4()),
	(uuid_generate_v4()),
	(uuid_generate_v4());


INSERT INTO "CategoryLocale"
	SELECT
		uuid_generate_v4(),
		concat(t.prefix, ' - ', row_number()
		OVER ()),
		t.locale,
		"Category".id
	FROM "Category", unnest(ARRAY [ROW ('en' :: "locale", 'category' :: TEXT), ROW ('cs' :: "locale", 'kategorie' :: TEXT)]) AS t(locale "locale", prefix TEXT);


INSERT INTO "Author" VALUES
	(uuid_generate_v4(), 'author 1'),
	(uuid_generate_v4(), 'author 2'),
	(uuid_generate_v4(), 'author 3');

INSERT INTO "Site" VALUES
	(uuid_generate_v4(), 'site1.cz'),
	(uuid_generate_v4(), 'site2.cz');


INSERT INTO "Post"
	SELECT
		uuid_generate_v4(),
		now(),
		(SELECT id
		 FROM "Author"
		 WHERE t = t
		 ORDER BY random()
		 LIMIT 1)
	FROM unnest(ARRAY [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) t;


INSERT INTO "PostLocale" (id, title, locale, post_id)
	SELECT
		uuid_generate_v4(),
		concat(t.prefix, ' - ', row_number()
		OVER ()),
		t.locale,
		"Post".id
	FROM "Post", unnest(ARRAY [ROW ('en' :: "locale", 'post' :: TEXT), ROW ('cs' :: "locale", 'článek' :: TEXT)]) AS t(locale "locale", prefix TEXT);

WITH t AS (
	SELECT
		"Post".id AS post_id,
		"Category".id AS category_id,
		mod(row_number()
			OVER (), 3) = 0 AS active
	FROM "Post", "Category"
), data AS (
	SELECT
		post_id,
		category_id
	FROM t
	WHERE active = TRUE
)

INSERT INTO "PostCategories" (post_id, category_id)
	SELECT *
	FROM data;

WITH t AS (
	SELECT
		uuid_generate_v4(),
		"Post".id AS post_id,
		"Site".id AS site_id,
		CASE WHEN mod(row_number()
					  OVER (), 2) = 0 THEN 'visible' :: "siteVisibility" ELSE 'hidden' :: "siteVisibility" END
	FROM "Post", "Site"
)
INSERT INTO "PostSite" (id, post_id, site_id, visibility) SELECT * FROM t
