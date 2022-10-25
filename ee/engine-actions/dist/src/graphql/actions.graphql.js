"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schema = void 0;
const graphql_tag_1 = require("graphql-tag");
exports.schema = (0, graphql_tag_1.gql) `
	scalar DateTime
	scalar Json
	scalar Uuid

	schema {
		query: Query
		mutation: Mutation
	}

	type Query {
		failedEvents(args: EventsArgs): [Event!]!
		eventsToProcess(args: EventsArgs): [Event!]!
		eventsInProcessing(args: EventsArgs): [Event!]!
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
		state: EventState
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
`;
//# sourceMappingURL=actions.graphql.js.map