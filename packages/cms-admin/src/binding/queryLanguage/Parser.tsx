import { Lexer, Parser as ChevrotainParser } from 'chevrotain'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName, FieldName, Filter } from '../bindingTypes'
import { ToOneProps } from '../coreComponents'
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
			throw new QueryLanguageError(`Not implemented`)
		}
	)

	private relativeSingleField: () => Parser.AST.RelativeSingleField = this.RULE<Parser.AST.RelativeSingleField>(
		'relativeSingleField',
		() => {
			const toOneProps: ToOneProps[] = []

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
			throw new QueryLanguageError(`Not implemented`)
		}
	)

	private toOneProps = this.RULE('toOneProps', () => {
		const fieldName = this.SUBRULE(this.fieldName)
		const reducedBy = this.OPTION(() => this.SUBRULE(this.uniqueWhere))
		// TODO add nonUnique where
		const props: ToOneProps = {
			field: fieldName
		}

		if (reducedBy !== undefined) {
			props['reducedBy'] = reducedBy
		}

		return props
	})

	private nonUniqueWhere = this.RULE('reductionWhere', () => {}) // TODO

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

	private fieldIdentifier = this.RULE('fieldIdentifier', () => {
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
			filter: Filter[]
			toOneProps: ToOneProps[]
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
			filter: Filter[]
		}
	}

	export enum EntryPoint {
		QualifiedFieldList = 'qualifiedFieldList', // E.g. "Author[age < 123].name
		RelativeSingleField = 'relativeSingleField', // E.g. authors(id = 123).person.name
		RelativeSingleEntity = 'relativeSingleEntity', // E.g. localesByLocale(locale.slug = en)
		RelativeEntityList = 'relativeEntityList' // E.g. authors[age < 123].name
	}

	export interface ParserResult {
		qualifiedFieldList: AST.QualifiedFieldList
		relativeSingleField: AST.RelativeSingleField
		relativeSingleEntity: AST.RelativeSingleEntity
		relativeEntityList: AST.RelativeEntityList
	}
}

export { Parser }
