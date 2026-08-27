import { gql } from 'graphql-tag'
import { DocumentNode } from 'graphql'

export const schema: DocumentNode = gql`
    scalar DateTime
    scalar Json
    scalar UUID

    schema {
        query: Query
        mutation: Mutation
    }

    type Query {
        failedEvents(args: EventArgs): [Event!]!
        eventsToProcess(args: EventArgs): [Event!]!
        eventsInProcessing(args: EventArgs): [Event!]!
        event(id: UUID!): Event
        variables: [Variable!]!
    }

    type Mutation {
        processBatch: ProcessBatchResponse!
        retryEvent(id: UUID!): RetryEventResponse!
        stopEvent(id: UUID!): StopEventResponse!
        setVariables(args: SetVariablesArgs!): SetVariablesResponse!
    }

    input EventArgs {
        offset: Int
        "Max 10000"
        limit: Int
    }

    type Event {
        id: UUID!
        transactionId: UUID!
        identityId: UUID
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
        """Null when the value is not readable, which is every ENVIRONMENT one."""
        value: String
        source: VariableSource!
    }

	"""
	Where the value comes from.
	- DATABASE is stored in the project database, readable and writable with setVariables
	- ENVIRONMENT is supplied by the engine environment, overrides a stored value of the same name, and is neither readable nor writable
	"""
	enum VariableSource {
		DATABASE
		ENVIRONMENT
	}

`
