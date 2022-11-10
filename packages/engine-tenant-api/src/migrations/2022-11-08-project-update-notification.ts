import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE FUNCTION project_updated()
	RETURNS TRIGGER AS
$$
BEGIN
	NEW.updated_at = 'now';
	PERFORM pg_notify('project_updated', new.id::text);
	RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION project_deleted()
	RETURNS TRIGGER AS
$$
BEGIN
	PERFORM pg_notify('project_updated', old.id::text);
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE FUNCTION project_secret_updated()
	RETURNS TRIGGER AS
$$
BEGIN
	UPDATE project SET updated_at = 'now' WHERE id = COALESCE(new.project_id, old.project_id);
	PERFORM pg_notify('project_updated', COALESCE(new.project_id, old.project_id)::TEXT);
	RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_updated
	BEFORE INSERT OR UPDATE OF name, slug, config
	ON project
	FOR EACH ROW
EXECUTE PROCEDURE project_updated();

CREATE TRIGGER project_deleted
	AFTER DELETE
	ON project
	FOR EACH ROW
EXECUTE PROCEDURE project_deleted();

CREATE TRIGGER project_secret_updated
	AFTER DELETE OR INSERT OR UPDATE
	ON project_secret
	FOR EACH ROW
EXECUTE PROCEDURE project_secret_updated();


DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION project_secret_updated() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}

