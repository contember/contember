import { createToken, Lexer } from 'chevrotain'

export namespace TokenRegExps {
	export const entityIdentifier = /[A-Z_]\w*/
	export const identifier = /[a-zA-Z_]\w*/
}

const identifier = createToken({
	name: 'Identifier',
	pattern: TokenRegExps.identifier,
})

export const tokens = {
	WhiteSpace: createToken({
		name: 'WhiteSpace',
		pattern: /\s+/,
		group: Lexer.SKIPPED,
	}),

	EntityIdentifier: createToken({
		name: 'EntityIdentifier',
		pattern: TokenRegExps.entityIdentifier,
	}),

	Identifier: identifier,

	DollarSign: createToken({
		name: 'DollarSign',
		pattern: /\$/,
	}),

	Dot: createToken({
		name: 'Dot',
		pattern: /\./,
	}),

	Comma: createToken({
		name: 'Comma',
		pattern: /,/,
	}),

	Colon: createToken({
		name: 'Colon',
		pattern: /:/,
	}),

	Slash: createToken({
		name: 'Slash',
		pattern: /\//,
	}),

	NumberLiteral: createToken({
		name: 'NumberLiteral',
		pattern: /-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/,
	}),

	StringLiteral: createToken({
		name: 'StringLiteral',
		pattern: /'(:?[^\\']|\\(:?[bfnrtv'\\/]|u[0-9a-fA-F]{4}))*'/,
	}),

	LeftParenthesis: createToken({
		name: 'LeftParenthesis',
		pattern: /\(/,
	}),

	RightParenthesis: createToken({
		name: 'RightParenthesis',
		pattern: /\)/,
	}),

	LeftBracket: createToken({
		name: 'LeftBracket',
		pattern: /\[/,
	}),

	RightBracket: createToken({
		name: 'RightBracket',
		pattern: /]/,
	}),

	NotEquals: createToken({
		name: 'NotEquals',
		pattern: /!=/,
	}),

	True: createToken({
		name: 'True',
		pattern: /true/,
		longer_alt: identifier,
	}),

	False: createToken({
		name: 'False',
		pattern: /false/,
		longer_alt: identifier,
	}),

	Null: createToken({
		name: 'Null',
		pattern: /null/,
		longer_alt: identifier,
	}),

	Equals: createToken({
		name: 'Equals',
		pattern: /=/,
	}),

	Not: createToken({
		name: 'Not',
		pattern: /!/,
	}),

	And: createToken({
		name: 'And',
		pattern: /&&/,
	}),

	Or: createToken({
		name: 'Or',
		pattern: /\|\|/,
	}),

	LowerEqual: createToken({
		name: 'LowerEqual',
		pattern: /<=/,
	}),

	GreaterEqual: createToken({
		name: 'GreaterEqual',
		pattern: />=/,
	}),

	LowerThan: createToken({
		name: 'LowerThan',
		pattern: /</,
	}),

	GreaterThan: createToken({
		name: 'GreaterThan',
		pattern: />/,
	}),
}

const tokenList = [
	tokens.WhiteSpace,
	tokens.True,
	tokens.False,
	tokens.Null,
	tokens.EntityIdentifier,
	tokens.Identifier,
	tokens.DollarSign,
	tokens.Dot,
	tokens.Comma,
	tokens.Colon,
	tokens.Slash,
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
	tokens.Or,
]

export { tokenList }
