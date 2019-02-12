import { createToken, Lexer } from 'chevrotain'

export const tokens = {
	WhiteSpace: createToken({
		name: 'WhiteSpace',
		pattern: /\s+/,
		group: Lexer.SKIPPED
	}),

	EntityIdentifier: createToken({
		name: 'EntityIdentifier',
		pattern: /[A-Z]\w*/
	}),

	FieldIdentifier: createToken({
		name: 'FieldIdentifier',
		pattern: /[a-zA-Z]\w*/
	}),

	Variable: createToken({
		name: 'Variable',
		pattern: /\$\w+/
	}),

	Dot: createToken({
		name: 'Dot',
		pattern: /\./
	}),

	Comma: createToken({
		name: 'Comma',
		pattern: /,/
	}),

	NumberLiteral: createToken({
		name: 'NumberLiteral',
		pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/
	}),

	StringLiteral: createToken({
		name: 'StringLiteral',
		pattern: /'(:?[^\\']|\\(:?[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/
	}),

	LeftParenthesis: createToken({
		name: 'LeftParenthesis',
		pattern: /\(/
	}),

	RightParenthesis: createToken({
		name: 'RightParenthesis',
		pattern: /\)/
	}),

	LeftBracket: createToken({
		name: 'LeftBracket',
		pattern: /\[/
	}),

	RightBracket: createToken({
		name: 'RightBracket',
		pattern: /]/
	}),

	NotEquals: createToken({
		name: 'NotEquals',
		pattern: '/!=/'
	}),

	True: createToken({
		name: 'True',
		pattern: /true/
	}),

	False: createToken({
		name: 'False',
		pattern: /false/
	}),

	Null: createToken({
		name: 'Null',
		pattern: /null/
	}),

	Equals: createToken({
		name: 'Equals',
		pattern: /=/
	}),

	Not: createToken({
		name: 'Not',
		pattern: /!/
	}),

	And: createToken({
		name: 'And',
		pattern: /&&/
	}),

	Or: createToken({
		name: 'Or',
		pattern: /\|\|/
	}),

	LowerEqual: createToken({
		name: 'LowerEqual',
		pattern: /<=/
	}),

	GreaterEqual: createToken({
		name: 'GreaterEqual',
		pattern: />=/
	}),

	LowerThan: createToken({
		name: 'LowerThan',
		pattern: /</
	}),

	GreaterThan: createToken({
		name: 'GreaterThan',
		pattern: />/
	})
}

const tokenList = [
	tokens.WhiteSpace,
	tokens.True,
	tokens.False,
	tokens.Null,
	tokens.EntityIdentifier,
	tokens.FieldIdentifier,
	tokens.Variable,
	tokens.Dot,
	tokens.Comma,
	tokens.StringLiteral,
	tokens.NumberLiteral,
	tokens.LeftParenthesis,
	tokens.RightParenthesis,
	tokens.LeftBracket,
	tokens.RightBracket,
	tokens.NotEquals,
	tokens.Equals,
	tokens.Not,
	tokens.GreaterEqual,
	tokens.GreaterThan,
	tokens.LowerEqual,
	tokens.LowerThan,
	tokens.And,
	tokens.Or
]

export { tokenList }
