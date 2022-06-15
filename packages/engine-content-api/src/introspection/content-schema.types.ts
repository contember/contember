export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: string
	String: string
	Boolean: boolean
	Int: number
	Float: number
	Json: any
}

export type Query = {
	readonly __typename?: 'Query'
	readonly schema?: Maybe<_Schema>
}

export type _Argument = _LiteralArgument | _PathArgument | _ValidatorArgument

export type _Column = _Field & {
	readonly __typename?: '_Column'
	readonly defaultValue?: Maybe<Scalars['Json']>
	readonly enumName?: Maybe<Scalars['String']>
	readonly name: Scalars['String']
	readonly nullable: Scalars['Boolean']
	readonly rules: ReadonlyArray<_Rule>
	readonly type: Scalars['String']
	readonly validators: ReadonlyArray<_Validator>
}

export type _Entity = {
	readonly __typename?: '_Entity'
	readonly customPrimaryAllowed: Scalars['Boolean']
	readonly fields: ReadonlyArray<_Field>
	readonly name: Scalars['String']
	readonly unique: ReadonlyArray<_UniqueConstraint>
}

export type _Enum = {
	readonly __typename?: '_Enum'
	readonly name: Scalars['String']
	readonly values: ReadonlyArray<Scalars['String']>
}

export type _Field = {
	readonly name: Scalars['String']
	readonly nullable?: Maybe<Scalars['Boolean']>
	readonly rules: ReadonlyArray<_Rule>
	readonly type: Scalars['String']
	readonly validators: ReadonlyArray<_Validator>
}

export type _LiteralArgument = {
	readonly __typename?: '_LiteralArgument'
	readonly value?: Maybe<Scalars['Json']>
}

export enum _OnDeleteBehaviour {
	Cascade = 'cascade',
	Restrict = 'restrict',
	SetNull = 'setNull'
}

export type _OrderBy = {
	readonly __typename?: '_OrderBy'
	readonly direction: _OrderByDirection
	readonly path: ReadonlyArray<Scalars['String']>
}

export enum _OrderByDirection {
	Asc = 'asc',
	Desc = 'desc'
}

export type _PathArgument = {
	readonly __typename?: '_PathArgument'
	readonly path: ReadonlyArray<Scalars['String']>
}

export type _Relation = _Field & {
	readonly __typename?: '_Relation'
	readonly inversedBy?: Maybe<Scalars['String']>
	readonly name: Scalars['String']
	readonly nullable?: Maybe<Scalars['Boolean']>
	readonly onDelete?: Maybe<_OnDeleteBehaviour>
	readonly orderBy?: Maybe<ReadonlyArray<_OrderBy>>
	readonly orphanRemoval?: Maybe<Scalars['Boolean']>
	readonly ownedBy?: Maybe<Scalars['String']>
	readonly rules: ReadonlyArray<_Rule>
	readonly side: _RelationSide
	readonly targetEntity: Scalars['String']
	readonly type: Scalars['String']
	readonly validators: ReadonlyArray<_Validator>
}

export enum _RelationSide {
	Inverse = 'inverse',
	Owning = 'owning'
}

export type _Rule = {
	readonly __typename?: '_Rule'
	readonly message?: Maybe<_RuleMessage>
	readonly validator: Scalars['Int']
}

export type _RuleMessage = {
	readonly __typename?: '_RuleMessage'
	readonly text?: Maybe<Scalars['String']>
}

export type _Schema = {
	readonly __typename?: '_Schema'
	readonly entities: ReadonlyArray<_Entity>
	readonly enums: ReadonlyArray<_Enum>
}

export type _UniqueConstraint = {
	readonly __typename?: '_UniqueConstraint'
	readonly fields: ReadonlyArray<Scalars['String']>
}

export type _Validator = {
	readonly __typename?: '_Validator'
	readonly arguments: ReadonlyArray<_Argument>
	readonly operation: Scalars['String']
}

export type _ValidatorArgument = {
	readonly __typename?: '_ValidatorArgument'
	readonly validator: Scalars['Int']
}
