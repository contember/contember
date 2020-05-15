import { gql } from 'apollo-server-core'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar DateTime

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		diff(stage: String!, filter: [TreeFilter!]): DiffResponse!
	}

	type Mutation {
		migrate(migrations: [Migration!]!): MigrateResponse!
		release(stage: String!, events: [String!]!): ReleaseResponse!
		releaseTree(stage: String!, tree: [TreeFilter!]!): ReleaseTreeResponse!
		rebaseAll: RebaseAllResponse!
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
		events: [Event!]!
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

	# === events ===

	interface Event {
		id: String!
		dependencies: [String!]!
		description: String!
		allowed: Boolean!
		createdAt: DateTime!
		type: EventType!
	}

	enum EventType {
		UPDATE
		DELETE
		CREATE
		RUN_MIGRATION
	}

	type UpdateEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType!
		description: String!
		allowed: Boolean!
		createdAt: DateTime!
	}

	type DeleteEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType!
		description: String!
		allowed: Boolean!
		createdAt: DateTime!
	}

	type CreateEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType!
		description: String!
		allowed: Boolean!
		createdAt: DateTime!
	}

	type RunMigrationEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType!
		description: String!
		allowed: Boolean!
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
