import { gql } from 'apollo-server-core'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar DateTime
	#scalar Json

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		diff(stage: String!, filter: [TreeFilter!]): DiffResponse!
		history(stage: String!, filter: [HistoryFilter!], sinceEvent: String, sinceTime: DateTime): HistoryResponse!
	}

	type Mutation {
		migrate(migrations: [Migration!]!): MigrateResponse!
		release(stage: String!, events: [String!]!): ReleaseResponse!
		releaseTree(stage: String!, tree: [TreeFilter!]!): ReleaseTreeResponse!
		rebaseAll: RebaseAllResponse!
	}

	# === history filter ===

	input HistoryFilter {
		entity: String!
		id: String!
	}

	# === tree filter ==
	input TreeFilter {
		entity: String!
		relations: [TreeFilterRelation!]
		id: String!
	}

	input TreeFilterRelation {
		name: String!
		relations: [TreeFilterRelation!]!
	}

	# === history ===

	enum HistoryErrorCode {
		STAGE_NOT_FOUND
	}

	type HistoryResponse {
		ok: Boolean
		errors: [HistoryErrorCode!]!
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
		#oldData: Json!
		#diffData: Json!
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
		#oldData: Json!
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
		#newData: Json!
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

	# === diff ===

	enum DiffErrorCode {
		STAGE_NOT_FOUND
		MISSING_BASE
		NOT_REBASED
	}

	type DiffResponse {
		ok: Boolean!
		errors: [DiffErrorCode!]!
		result: DiffResult
	}

	type DiffResult {
		base: Stage!
		head: Stage!
		events: [DiffEvent!]!
	}

	# === migrate ===

	input Migration {
		version: String!
		name: String!
		formatVersion: Int!
		modifications: [Modification!]!
	}
	input Modification {
		modification: String!
		data: String!
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
		message: String!
	}

	type MigrateResponse {
		ok: Boolean!
		errors: [MigrateError!]!
		result: MigrateResult
	}

	type MigrateResult {
		message: String!
	}

	# === release ===
	enum ReleaseErrorCode {
		STAGE_NOT_FOUND
		MISSING_BASE
		MISSING_DEPENDENCY
		FORBIDDEN
	}

	type ReleaseResponse {
		ok: Boolean!
		errors: [ReleaseErrorCode!]!
	}

	# === releaseTree ===

	enum ReleaseTreeErrorCode {
		STAGE_NOT_FOUND
		MISSING_BASE
		FORBIDDEN
		NOT_REBASED
	}

	type ReleaseTreeResponse {
		ok: Boolean!
		errors: [ReleaseTreeErrorCode!]!
	}

	# === rebase ===

	type RebaseAllResponse {
		ok: Boolean!
	}

	# === diff ===

	interface DiffEvent {
		id: String!
		transactionId: String!
		identityDescription: String!
		identityId: String!
		dependencies: [String!]!
		description: String!
		createdAt: DateTime!
		type: DiffEventType!
	}

	enum DiffEventType {
		UPDATE
		DELETE
		CREATE
	}

	type DiffUpdateEvent implements DiffEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		dependencies: [String!]!
		type: DiffEventType!
		description: String!
		createdAt: DateTime!
	}

	type DiffDeleteEvent implements DiffEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		dependencies: [String!]!
		type: DiffEventType!
		description: String!
		createdAt: DateTime!
	}

	type DiffCreateEvent implements DiffEvent {
		id: String!
		transactionId: String!
		identityId: String!
		identityDescription: String!
		dependencies: [String!]!
		type: DiffEventType!
		description: String!
		createdAt: DateTime!
	}

	# === stage ===

	type Stage {
		id: String!
		name: String!
		slug: String!
	}
`

export default schema
