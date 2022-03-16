import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar DateTime
	scalar Json
	scalar PrimaryKey

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		executedMigrations(version: String): [ExecutedMigration!]!
		events(args: EventsArgs): [Event!]!
	}

	type Mutation {
		migrate(migrations: [Migration!]!): MigrateResponse!
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
		primaryKey: [PrimaryKey!]!
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
		checksum: String!
		formatVersion: Int!
		modifications: [Json!]!
	}

	# === migrate ===

	input Migration {
		version: String!
		name: String!
		formatVersion: Int!
		modifications: [Json!]!
	}

	enum MigrateErrorCode {
		MUST_FOLLOW_LATEST
		ALREADY_EXECUTED
		INVALID_FORMAT
		INVALID_SCHEMA
		MIGRATION_FAILED
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
