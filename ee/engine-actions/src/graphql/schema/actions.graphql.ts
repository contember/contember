import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql/language'

export const schema: DocumentNode = gql`
	scalar DateTime
	scalar Json
	scalar Uuid

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		failedEvents(args: EventArgs): [Event!]!
		eventsToProcess(args: EventArgs): [Event!]!
		eventsInProcessing(args: EventArgs): [Event!]!
	}

	type Mutation {
		processBatch: ProcessBatchResponse!
	}

	input EventArgs {
		offset: Int
		"Max 10000"
		limit: Int
	}

	type Event {
		id: Uuid!
		transactionId: Uuid!
		createdAt: DateTime!
		lastStateChange: DateTime!
		resolvedAt: DateTime
		visibleAt: DateTime
		numRetries: Int!
		state: EventState!
		stage: String!
		target: String!
		payload: Json!
		log: Json!
	}

	enum EventState {
		created
		retrying
		processing
		succeed
		failed
		stopped
	}

	type ProcessBatchResponse {
		ok: Boolean!
	}
`
