import { gql } from 'apollo-server-core'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	schema {
		mutation: Mutation
	}

	type Mutation {
		truncate: TruncateResponse!
	}

	type TruncateResponse {
		ok: Boolean!
	}
`

export default schema
