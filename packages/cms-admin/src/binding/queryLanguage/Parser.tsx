import { Lexer, Parser as ChevrotainParser, TokenType } from 'chevrotain'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, FieldName } from '../bindingTypes'
import { ToManyProps, ToOneProps } from '../coreComponents'
import { Environment } from '../dao'
import { MacroResolver } from './MacroResolver'
import { QueryLanguageError } from './QueryLanguageError'
import { tokenList, tokens } from './tokenList'

class Parser extends ChevrotainParser {
	private static macroResolver = new MacroResolver()
	private static lexer = new Lexer(tokenList)
	private static parser = new Parser()

	private qualifiedFieldList: () => Parser.AST.QualifiedFieldList = this.RULE<Parser.AST.QualifiedFieldList>(
		'qualifiedFieldList',
		() => {
			const toManyProps: ToManyProps[] = []
			const entityName = this.SUBRULE(this.entityIdentifier)
			const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))

			this.CONSUME(tokens.Dot)

			this.MANY(() => {
				toManyProps.push(this.SUBRULE(this.toManyProps))
				this.CONSUME1(tokens.Dot)
			})
			const fieldName = this.SUBRULE(this.fieldIdentifier)

			return {
				entityName,
				filter,
				toManyProps,
				fieldName
			}
		}
	)

	private relativeSingleField: () => Parser.AST.RelativeSingleField = this.RULE<Parser.AST.RelativeSingleField>(
		'relativeSingleField',
		() => {
			const toOneProps: ToOneProps[] = []

			// Deliberately using a combination of consuming the Dot inside MANY as opposed to using MANY_SEP so as to
			// disambiguate the grammar. Otherwise inputs such as "field(fooParam = 1).foo.bar" where a MANY_SEP alternative
			// would match it all the way to "bar", leaving nothing to be matched subsequently. It would be possible to get
			// around this, although it would be somewhat cumbersome.
			this.MANY(() => {
				toOneProps.push(this.SUBRULE(this.toOneProps))
				this.CONSUME(tokens.Dot)
			})

			const fieldName = this.SUBRULE(this.fieldName)

			return {
				toOneProps: toOneProps,
				fieldName: fieldName
			}
		}
	)

	private relativeSingleEntity: () => Parser.AST.RelativeSingleEntity = this.RULE<Parser.AST.RelativeSingleEntity>(
		'relativeSingleEntity',
		() => {
			const toOneProps: ToOneProps[] = []

			this.MANY_SEP({
				SEP: tokens.Dot,
				DEF: () => {
					toOneProps.push(this.SUBRULE(this.toOneProps))
				}
			})

			return {
				toOneProps
			}
		}
	)

	private relativeEntityList: () => Parser.AST.RelativeEntityList = this.RULE<Parser.AST.RelativeEntityList>(
		'relativeEntityList',
		() => {
			const toManyProps: ToManyProps[] = []

			this.MANY_SEP({
				SEP: tokens.Dot,
				DEF: () => {
					toManyProps.push(this.SUBRULE(this.toManyProps))
				}
			})

			return {
				toManyProps
			}
		}
	)

	private toOneProps = this.RULE('toOneProps', () => {
		const fieldName = this.SUBRULE(this.fieldName)
		const reducedBy = this.OPTION(() => this.SUBRULE(this.uniqueWhere))
		const props: ToOneProps = {
			field: fieldName
		}

		if (reducedBy !== undefined) {
			props.reducedBy = reducedBy
		}

		return props
	})

	private toManyProps: () => ToManyProps = this.RULE('toManyProps', () => {
		const fieldName = this.SUBRULE(this.fieldName)
		const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))
		const props: ToManyProps = {
			field: fieldName
		}

		if (filter !== undefined) {
			props.filter = filter
		}

		return props
	})

	private nonUniqueWhere: () => Parser.AST.Filter = this.RULE('nonUniqueWhere', () => {
		const cnfWhere: Parser.AST.Filter[] = []

		this.AT_LEAST_ONE(() => {
			this.SUBRULE(this.optionalWhitespace)
			this.CONSUME(tokens.LeftBracket)

			cnfWhere.push(this.SUBRULE(this.disjunction))

			this.CONSUME(tokens.RightBracket)
			this.SUBRULE2(this.optionalWhitespace)
		})
		if (cnfWhere.length === 1) {
			return cnfWhere[0]
		}
		return {
			and: cnfWhere
		}
	})

	private disjunction: () => Parser.AST.Filter = this.RULE('disjunction', () => {
		const conjunctions: Parser.AST.Filter[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Or,
			DEF: () => {
				conjunctions.push(this.SUBRULE(this.conjunction))
			}
		})
		if (conjunctions.length === 1) {
			return conjunctions[0]
		}
		return {
			or: conjunctions
		}
	})

	private conjunction: () => Parser.AST.Filter = this.RULE('conjunction', () => {
		const negations: Parser.AST.Filter[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.And,
			DEF: () => {
				negations.push(this.SUBRULE(this.negation))
			}
		})
		if (negations.length === 1) {
			return negations[0]
		}
		return {
			and: negations
		}
	})

	private negation: () => Parser.AST.Filter = this.RULE('negation', () => {
		return this.OR<Parser.AST.Filter>([
			{
				ALT: () => {
					this.CONSUME(tokens.Not)
					return {
						not: this.SUBRULE(this.fieldWhere)
					}
				}
			},
			{
				ALT: () => {
					return this.SUBRULE1(this.fieldWhere)
				}
			}
		])
	})

	private fieldWhere: () => Parser.AST.FieldWhere = this.RULE('fieldWhere', () => {
		const field = this.SUBRULE(this.fieldIdentifier)
		const condition = this.SUBRULE(this.condition)

		return {
			[field]: condition
		}
	})

	private condition: () => Parser.AST.Condition = this.RULE('condition', () => {
		const operator = this.SUBRULE(this.conditionOperator)
		const columnValue = this.SUBRULE(this.columnValue)
		const condition: Parser.AST.Condition = {}

		if (columnValue === null) {
			if (operator === 'eq') {
				condition.null = true
			} else if (operator === 'notEq') {
				condition.null = false
			} else {
				throw new QueryLanguageError(`The null keyword as a right hand operand can only be tested for (in)equality.`)
			}
			return condition
		}
		condition[operator] = columnValue

		return condition
	})

	private conditionOperator: () => Parser.AST.ConditionOperator = this.RULE('conditionOperator', () => {
		this.SUBRULE(this.optionalWhitespace)
		const operator = this.OR<Parser.AST.ConditionOperator>([
			{
				ALT: () => {
					this.CONSUME(tokens.Equals)
					return 'eq'
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.NotEquals)
					return 'notEq'
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.LowerThan)
					return 'lt'
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.LowerEqual)
					return 'lte'
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.GreaterThan)
					return 'gt'
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.GreaterEqual)
					return 'gte'
				}
			}
		])
		this.SUBRULE1(this.optionalWhitespace)
		return operator
	})

	// TODO add support for object & list
	private columnValue: () => Parser.AST.ColumnValue = this.RULE('columnValue', () => {
		this.SUBRULE(this.optionalWhitespace)
		const value = this.OR<Parser.AST.ColumnValue>([
			{
				ALT: () => {
					this.CONSUME(tokens.Null)
					return null
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.True)
					return true
				}
			},
			{
				ALT: () => {
					this.CONSUME(tokens.False)
					return false
				}
			},
			{
				ALT: () => this.SUBRULE(this.primaryValue)
			}
		])
		this.SUBRULE1(this.optionalWhitespace)
		return value
	})

	private uniqueWhere = this.RULE('uniqueWhere', () => {
		const where: Input.UniqueWhere<GraphQlBuilder.Literal> = {}

		this.SUBRULE(this.optionalWhitespace)
		this.CONSUME(tokens.LeftParenthesis)
		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Comma,
			DEF: () => {
				const nestedFields: string[] = []
				this.AT_LEAST_ONE_SEP1({
					SEP: tokens.Dot,
					DEF: () => {
						nestedFields.push(this.SUBRULE(this.fieldIdentifier))
					}
				})
				this.CONSUME(tokens.Equals)
				const primaryValue = this.SUBRULE<Input.PrimaryValue<GraphQlBuilder.Literal>>(this.primaryValue)

				let nestedWhere = where
				for (let i = 0, len = nestedFields.length; i < len; i++) {
					const nestedField = nestedFields[i]

					const isLast = len - 1 === i

					if (isLast) {
						if (nestedField in nestedWhere) {
							throw new QueryLanguageError(`Duplicate '${nestedFields.slice(0, i + 1).join('.')}' field`)
						}

						nestedWhere[nestedField] = primaryValue
					} else {
						if (nestedField in nestedWhere) {
							const existingWhere = nestedWhere[nestedField]

							if (typeof existingWhere === 'object' && !(existingWhere instanceof GraphQlBuilder.Literal)) {
								nestedWhere = existingWhere
							} else {
								throw new QueryLanguageError(
									`Malformed expression: cannot simultaneously treat the '${nestedFields.slice(0, i + 1).join('.')}' ` +
										`field as a scalar as well as a relation.`
								)
							}
						} else {
							const newWhere = {}
							nestedWhere[nestedField] = newWhere
							nestedWhere = newWhere
						}
					}
				}
			}
		})
		this.CONSUME(tokens.RightParenthesis)
		this.SUBRULE1(this.optionalWhitespace)

		return where
	})

	private fieldName = this.RULE<FieldName>('fieldName', () => {
		return this.SUBRULE(this.fieldIdentifier)
	})

	private primaryValue = this.RULE('primaryValue', () => {
		return this.OR<Input.PrimaryValue<GraphQlBuilder.Literal>>([
			{
				ALT: () => this.SUBRULE(this.string)
			},
			{
				ALT: () => this.SUBRULE(this.number)
			},
			{
				ALT: () => {
					const identifier = this.SUBRULE(this.fieldIdentifier)
					return new GraphQlBuilder.Literal(identifier)
				}
			}
		])
	})

	private fieldIdentifier: () => FieldName = this.RULE('fieldIdentifier', () => {
		this.SUBRULE(this.optionalWhitespace)
		const identifier = this.CONSUME(tokens.FieldIdentifier).image
		this.SUBRULE1(this.optionalWhitespace)

		return identifier
	})

	private entityIdentifier: () => EntityName = this.RULE('entityIdentifier', () => {
		this.SUBRULE(this.optionalWhitespace)
		const identifier = this.CONSUME(tokens.EntityIdentifier).image
		this.SUBRULE1(this.optionalWhitespace)

		return identifier
	})

	private string = this.RULE('string', () => {
		this.SUBRULE(this.optionalWhitespace)
		const image = this.CONSUME(tokens.StringLiteral).image
		this.SUBRULE1(this.optionalWhitespace)
		return image
			.substring(1, image.length - 1)
			.replace("\\'", "'")
			.replace('\\b', '\b')
			.replace('\\f', '\f')
			.replace('\\n', '\n')
			.replace('\\r', '\r')
			.replace('\\t', '\t')
			.replace('\\v', '\v')
	})

	private number = this.RULE('number', () => {
		this.SUBRULE(this.optionalWhitespace)
		const number = parseFloat(this.CONSUME(tokens.NumberLiteral).image)
		this.SUBRULE1(this.optionalWhitespace)

		return number
	})

	private optionalWhitespace = this.RULE('optionalWhitespace', () => {
		this.OPTION(() => this.CONSUME(tokens.WhiteSpace))
	})

	private constructor() {
		super(tokenList, { outputCst: false })
		this.performSelfAnalysis()
	}

	public static parseQueryLanguageExpression<E extends Parser.EntryPoint>(
		input: string,
		entry: E,
		environment?: Environment
	): Parser.ParserResult[E] {
		const inputWithResolvedMacros = Parser.macroResolver.resolve(input, environment)
		const lexingResult = Parser.lexer.tokenize(inputWithResolvedMacros)

		if (lexingResult.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to tokenize '${inputWithResolvedMacros}'.\n\n${lexingResult.errors.map(i => i.message).join('\n')}`
			)
		}

		Parser.parser.input = lexingResult.tokens

		let expression: Parser.ParserResult[E]

		switch (entry) {
			case Parser.EntryPoint.RelativeSingleField:
				expression = Parser.parser.relativeSingleField()
				break
			case Parser.EntryPoint.RelativeSingleEntity:
				expression = Parser.parser.relativeSingleEntity()
				break
			case Parser.EntryPoint.RelativeEntityList:
				expression = Parser.parser.relativeEntityList()
				break
			case Parser.EntryPoint.QualifiedFieldList:
				expression = Parser.parser.qualifiedFieldList()
				break
			default:
				throw new QueryLanguageError(`Not implemented`)
		}

		if (Parser.parser.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to parse '${input}'.\n\n${Parser.parser.errors.map(i => i.message).join('\n')}`
			)
		}

		return expression
	}
}

namespace Parser {
	export namespace AST {
		export interface QualifiedFieldList {
			entityName: EntityName
			filter?: Filter
			toManyProps: ToManyProps[]
			fieldName: FieldName
		}

		export interface RelativeSingleField {
			toOneProps: ToOneProps[]
			fieldName: FieldName
		}

		export interface RelativeSingleEntity {
			toOneProps: ToOneProps[]
		}

		export interface RelativeEntityList {
			toManyProps: ToManyProps[]
		}

		export type FieldWhere = Input.FieldWhere<Condition>

		export type Filter = Input.Where<Condition>

		export type ColumnValue = Input.ColumnValue<GraphQlBuilder.Literal>

		export type Condition = Input.Condition<ColumnValue>

		export type ConditionOperator = keyof Pick<Condition, 'eq' | 'notEq' | 'lt' | 'lte' | 'gt' | 'gte'>
	}

	export enum EntryPoint {
		QualifiedFieldList = 'qualifiedFieldList', // E.g. "Author[age < 123].name
		RelativeSingleField = 'relativeSingleField', // E.g. authors(id = 123).person.name
		RelativeSingleEntity = 'relativeSingleEntity', // E.g. localesByLocale(locale.slug = en)
		RelativeEntityList = 'relativeEntityList' // E.g. authors[age < 123]
	}

	export interface ParserResult {
		qualifiedFieldList: AST.QualifiedFieldList
		relativeSingleField: AST.RelativeSingleField
		relativeSingleEntity: AST.RelativeSingleEntity
		relativeEntityList: AST.RelativeEntityList
	}
}

export { Parser }
