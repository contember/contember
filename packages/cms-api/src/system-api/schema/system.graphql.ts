import { gql } from 'apollo-server-koa'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		stages: [Stage!]!
		diff(baseStage: String!, headStage: String!, filter: [DiffFilter!]): DiffResponse!
	}

	type Mutation {
		foo: String!
	}

	input DiffFilter {
		entity: String!
		id: String!
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

	interface Event {
		id: String!
		dependencies: [String!]!
		description: String!
		allowed: Boolean!
		type: EventType
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
		type: EventType
		description: String!
		allowed: Boolean!
		entity: String!
		rowId: String!
		fields: [String!]!
	}

	type DeleteEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType
		description: String!
		allowed: Boolean!
		entity: String!
		rowId: String!
	}

	type CreateEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType
		description: String!
		allowed: Boolean!
		entity: String!
		rowId: String!
	}

	type RunMigrationEvent implements Event {
		id: String!
		dependencies: [String!]!
		type: EventType
		description: String!
		allowed: Boolean!
		version: String!
	}

	enum DiffErrorCode {
		BASE_NOT_FOUND
		HEAD_NOT_FOUND
		NOT_REBASED
	}

	type Stage {
		id: String!
		name: String!
		slug: String!
	}
`

export default schema
