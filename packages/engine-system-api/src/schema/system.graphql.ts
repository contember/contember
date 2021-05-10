import { gql } from 'apollo-server-core'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar DateTime
	scalar Json

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		executedMigrations(version: String): [ExecutedMigration!]!
		history(stage: String!, filter: [HistoryFilter!], sinceEvent: String, sinceTime: DateTime): HistoryResponse!
	}

	type Mutation {
		migrate(migrations: [Migration!]!): MigrateResponse!
	}

	# === history filter ===

	input HistoryFilter {
		entity: String!
		id: String!
	}

	# === history ===

	enum HistoryErrorCode {
		STAGE_NOT_FOUND
	}

	type HistoryError {
		code: HistoryErrorCode!
		developerMessage: String!
	}

	type HistoryResponse {
		ok: Boolean
		errors: [HistoryErrorCode!]! @deprecated
		error: HistoryError
		result: HistoryResult
	}

	type HistoryResult {
		events: [HistoryEvent!]!
	}

	interface HistoryEvent {
		id: String!
		transactionId: String!
		identityDescription: String!
		identityId: String!
		description: String!
		createdAt: DateTime!
		type: HistoryEventType!
	}

	enum HistoryEventType {
		UPDATE
		DELETE
		CREATE
		RUN_MIGRATION
	}

	type HistoryUpdateEvent implements HistoryEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		type: HistoryEventType!
		tableName: String!
		primaryKeys: [String!]!
		oldValues: Json!
		diffValues: Json!
	}

	type HistoryDeleteEvent implements HistoryEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		type: HistoryEventType!
		tableName: String!
		primaryKeys: [String!]!
		oldValues: Json!
	}

	type HistoryCreateEvent implements HistoryEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		type: HistoryEventType!
		tableName: String!
		primaryKeys: [String!]!
		newValues: Json!
	}

	type HistoryRunMigrationEvent implements HistoryEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		description: String!
		createdAt: DateTime!
		type: HistoryEventType!
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
