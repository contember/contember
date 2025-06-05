import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

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
        event(id: Uuid!): Event
        variables: [Variable!]!
    }

    type Mutation {
        processBatch: ProcessBatchResponse!
        retryEvent(id: Uuid!): RetryEventResponse!
        stopEvent(id: Uuid!): StopEventResponse!
        setVariables(args: SetVariablesArgs!): SetVariablesResponse!
    }

    input EventArgs {
        offset: Int
        "Max 10000"
        limit: Int
    }

    type Event {
        id: Uuid!
        transactionId: Uuid!
        identityId: Uuid
        ipAddress: String
        userAgent: String
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

    type RetryEventResponse {
        ok: Boolean!
    }

    type StopEventResponse {
        ok: Boolean!
    }

    input SetVariablesArgs {
        variables: [VariableInput!]!
        mode: SetVariablesMode
    }

	"""
	Defines how it handles original variables.
	- MERGE merges with new values (default behaviour)
	- SET replaces all variables
	- APPEND_ONLY_MISSING appends values if not already exist
	"""
	enum SetVariablesMode {
		MERGE
		SET
		APPEND_ONLY_MISSING
	}

    input VariableInput {
        name: String!
        value: String!
    }

	type SetVariablesResponse {
		ok: Boolean!
	}

    type Variable {
        name: String!
        value: String!
    }

`
