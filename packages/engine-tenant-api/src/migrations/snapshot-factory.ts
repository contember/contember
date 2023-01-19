import { MigrationArgs, MigrationBuilder } from '@contember/database-migrations'
import { TenantMigrationArgs } from './types'
import { createCredentials } from './tenantCredentials'

export default async (sqlFactory: () => string) => {
	return async (builder: MigrationBuilder, args: MigrationArgs<TenantMigrationArgs>) => {

		const sql = sqlFactory()
		builder.sql(sql)

		builder.sql(`DO LANGUAGE plpgsql
$$
	BEGIN
		EXECUTE FORMAT('ALTER FUNCTION project_secret_updated() SET SEARCH_PATH = %s', QUOTE_IDENT(CURRENT_SCHEMA()));
	END
$$;
`)

		await createCredentials(builder, args)
	}
}
