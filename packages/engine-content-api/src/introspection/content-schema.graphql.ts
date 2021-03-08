import { gql } from 'apollo-server-core'
import { DocumentNode } from 'graphql'

const schema: DocumentNode = gql`
	scalar Json

	type Query {
		schema: _Schema
	}

	type _Schema {
		enums: [_Enum!]!
		entities: [_Entity!]!
	}

	type _Entity {
		name: String!
		customPrimaryAllowed: Boolean!
		fields: [_Field!]!
		unique: [_UniqueConstraint!]!
	}

	type _UniqueConstraint {
		fields: [String!]!
	}

	interface _Field {
		name: String!
		type: String!
		nullable: Boolean
		rules: [_Rule!]!
		validators: [_Validator!]!
	}

	type _Column implements _Field {
		name: String!
		type: String!
		enumName: String
		defaultValue: Json
		nullable: Boolean!
		rules: [_Rule!]!
		validators: [_Validator!]!
	}

	enum _OnDeleteBehaviour {
		restrict
		cascade
		setNull
	}

	enum _RelationSide {
		owning
		inverse
	}
	enum _OrderByDirection {
		asc
		desc
	}
	type _OrderBy {
		path: [String!]!
		direction: _OrderByDirection!
	}

	type _Relation implements _Field {
		name: String!
		type: String!
		side: _RelationSide!
		targetEntity: String!
		ownedBy: String
		inversedBy: String
		nullable: Boolean
		onDelete: _OnDeleteBehaviour
		orphanRemoval: Boolean
		orderBy: [_OrderBy!]
		rules: [_Rule!]!
		validators: [_Validator!]!
	}

	type _Rule {
		message: _RuleMessage
		validator: Int!
	}

	type _Validator {
		operation: String!
		arguments: [_Argument!]!
	}

	union _Argument = _ValidatorArgument | _PathArgument | _LiteralArgument

	type _ValidatorArgument {
		validator: Int!
	}

	type _PathArgument {
		path: [String!]!
	}

	type _LiteralArgument {
		value: Json
	}

	type _RuleMessage {
		text: String
	}

	type _Enum {
		name: String!
		values: [String!]!
	}
`

export default schema
