import { DocumentNode, parse } from 'graphql'

const schema: DocumentNode = parse(
	/* GraphQL */ `
	schema {
		mutation: Mutation
	}

	type Mutation {
		truncate: TruncateResponse!
		forceMigrate(migrations: [Migration!]!, schemaState: SchemaStateInput): MigrateResponse!
		migrationModify(migration: String!, modification: MigrationModification!): MigrationModifyResponse!
		migrationDelete(migration: String!): MigrationDeleteResponse!
	}

	type TruncateResponse {
		ok: Boolean!
	}

	input MigrationModification {
		version: String
		name: String
		formatVersion: Int
		modifications: [Json!]
	}

	enum MigrationModifyErrorCode {
		NOT_FOUND
	}

	type MigrationModifyError {
		code: MigrationModifyErrorCode!
		developerMessage: String!
	}

	type MigrationModifyResponse {
		ok: Boolean!
		error: MigrationModifyError
	}

	enum MigrationDeleteErrorCode {
		NOT_FOUND
		INVALID_FORMAT
	}

	type MigrationDeleteError {
		code: MigrationDeleteErrorCode!
		developerMessage: String!
	}

	type MigrationDeleteResponse {
		ok: Boolean!
		error: MigrationDeleteError
	}
`,
	{ noLocation: true },
)

export default schema
