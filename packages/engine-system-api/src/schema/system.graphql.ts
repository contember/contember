import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar DateTime
	scalar Json
	scalar PrimaryKey
	scalar Schema

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		executedMigrations(version: String): [ExecutedMigration!]!
		events(args: EventsArgs): [Event!]!
		schema: Schema!
	}

	type Mutation {
		migrate(migrations: [Migration!]!, schemaState: SchemaStateInput): MigrateResponse!
		"""
		Bootstraps an empty project from a snapshot: applies the collapsed schema in a
		single step and records the covered migrations as executed without replaying them.
		Refused (PROJECT_NOT_EMPTY) when any migration has already been executed.
		"""
		migrateFromSnapshot(snapshot: SnapshotInput!, schemaState: SchemaStateInput): MigrateResponse!
	}

	input SchemaStateInput {
		acl: Json!
		validation: Json!
		actions: Json!
		settings: Json!
	}

	input SnapshotInput {
		"Collapsed schema (empty -> target) applied once to every stage."
		formatVersion: Int!
		modifications: [Json!]!
		"Migrations subsumed by the snapshot, recorded as executed without running their SQL."
		covers: [Migration!]!
	}

	# === events ===

	input EventsArgs {
		stage: String
		filter: EventsFilter
		order: EventsOrder
		offset: Int
		"Max 10000"
		limit: Int
	}

	enum EventsOrder {
		CREATED_AT_ASC
		CREATED_AT_DESC
		APPLIED_AT_ASC
		APPLIED_AT_DESC
	}

	input EventsFilter {
		types: [EventType!]
		rows: [EventFilterRow!]
		tables: [String!]
		transactions: [String!]
		identities: [String!]
		createdAt: EventsFilterDate
		appliedAt: EventsFilterDate
	}

	input EventsFilterDate {
		from: DateTime
		to: DateTime
	}

	input EventFilterRow {
		tableName: String!
		primaryKey: [PrimaryKey]!
	}

	interface Event {
		id: String!
		transactionId: String!
		identityDescription: String!
		identityId: String!
		description: String!
		createdAt: DateTime!
		appliedAt: DateTime!
		type: EventType!
		tableName: String!
		primaryKey: [PrimaryKey!]!
	}

	enum EventType {
		UPDATE
		DELETE
		CREATE
	}

	type UpdateEvent implements Event {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		appliedAt: DateTime!
		type: EventType!
		tableName: String!
		primaryKey: [PrimaryKey!]!
		oldValues: Json!
		diffValues: Json!
	}

	type DeleteEvent implements Event {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		appliedAt: DateTime!
		type: EventType!
		tableName: String!
		primaryKey: [PrimaryKey!]!
		oldValues: Json!
	}

	type CreateEvent implements Event {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		appliedAt: DateTime!
		type: EventType!
		tableName: String!
		primaryKey: [PrimaryKey!]!
		newValues: Json!
	}

	# === executedMigrations ===

	type ExecutedMigration {
		version: String!
		name: String!
		executedAt: DateTime!
		
		checksum: String
		formatVersion: Int
		modifications: [Json!]
	}

	# === migrate ===
	enum MigrationType {
		SCHEMA
		CONTENT
	}
	
	input Migration {
		version: String!
		name: String!
		
		type: MigrationType
		schemaMigration: SchemaMigration
		contentMigration: [ContentMigration!]
		
		
		formatVersion: Int @deprecated(reason: "Use schemaMigration with SCHEMA type")
		modifications: [Json!]  @deprecated(reason: "Use schemaMigration with SCHEMA type")
		skippedErrors: [MigrationSkippedError!]   @deprecated(reason: "Use schemaMigration with SCHEMA type")
	}
	
	input ContentMigration {
		query: String!
		stage: String
		variables: Json
		checkMutationResult: Boolean
	}
	
	input SchemaMigration {
		formatVersion: Int!
		modifications: [Json!]!
		skippedErrors: [MigrationSkippedError!]
	}

	input MigrationSkippedError {
		code: String!
		path: String
	}

	enum MigrateErrorCode {
		MUST_FOLLOW_LATEST
		ALREADY_EXECUTED
		INVALID_FORMAT
		INVALID_SCHEMA
		MIGRATION_FAILED
		CONTENT_MIGRATION_FAILED
		CONTENT_MIGRATION_NOT_SUCCESSFUL
		PROJECT_NOT_EMPTY
	}

	type MigrateError {
		code: MigrateErrorCode!
		migration: String!
		developerMessage: String!
	}

	type MigrateResponse {
		ok: Boolean!
		errors: [MigrateError!]! @deprecated
		error: MigrateError
		result: MigrateResult
	}

	type MigrateResult {
		message: String!
	}

	# === stage ===

	type Stage {
		id: String!
		name: String!
		slug: String!
	}
`

export default schema
