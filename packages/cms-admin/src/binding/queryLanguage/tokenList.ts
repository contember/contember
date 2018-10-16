import { createToken, Lexer } from 'chevrotain'

export const tokens = {
	WhiteSpace: createToken({
		name: 'WhiteSpace',
		pattern: /\s+/,
		group: Lexer.SKIPPED
	}),

	Identifier: createToken({
		name: 'Identifier',
		pattern: /[a-zA-z]\w*/
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
		pattern: /\,/
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
		pattern: /\]/
	}),

	NotEquals: createToken({
		name: 'NotEquals',
		pattern: '/!=/'
	}),

	Equals: createToken({
		name: 'Equals',
		pattern: /=/
	})
}

const tokenList = [
	tokens.WhiteSpace,
	tokens.Identifier,
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
	tokens.Equals
]

export default tokenList
