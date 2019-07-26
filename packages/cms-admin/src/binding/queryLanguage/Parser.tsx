import { Lexer, Parser as ChevrotainParser } from 'chevrotain'
import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import { EntityName, FieldName } from '../bindingTypes'
import { ToMany, ToOne } from '../coreComponents'
import { Environment } from '../dao'
import { QueryLanguageError } from './QueryLanguageError'
import { tokenList, TokenRegExps, tokens } from './tokenList'

/**
 * TODO:
 * 	- double quoted strings
 * 	- parentheses within non-unique where
 * 	- predicate negation
 * 	- collections (objects & lists)
 * 	- collection operators (e.g. 'in', 'notIn', etc.)
 * 	- filtering toOne
 */
class Parser extends ChevrotainParser {
	private static rawInput: string = ''
	private static lexer = new Lexer(tokenList)
	private static parser = new Parser()
	private static environment: Environment = new Environment()

	private qualifiedEntityList: () => Parser.AST.QualifiedEntityList = this.RULE<Parser.AST.QualifiedEntityList>(
		'qualifiedEntityList',
		() => {
			const entityName = this.SUBRULE(this.entityIdentifier)
			const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))

			const toOneProps: Parser.AST.AtomicToOneProps[] = []

			this.MANY(() => {
				this.CONSUME(tokens.Dot)
				toOneProps.push(this.SUBRULE(this.toOneProps))
			})

			return {
				entityName,
				filter,
				toOneProps
			}
		}
	)

	private qualifiedFieldList: () => Parser.AST.QualifiedFieldList = this.RULE<Parser.AST.QualifiedFieldList>(
		'qualifiedFieldList',
		() => {
			const entityName = this.SUBRULE(this.entityIdentifier)
			const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))

			this.CONSUME(tokens.Dot)

			const { toOneProps, fieldName } = this.SUBRULE(this.relativeSingleField)

			return {
				entityName,
				fieldName,
				filter,
				toOneProps
			}
		}
	)

	private relativeSingleField: () => Parser.AST.RelativeSingleField = this.RULE<Parser.AST.RelativeSingleField>(
		'relativeSingleField',
		() => {
			const { toOneProps } = this.SUBRULE(this.relativeSingleEntity)

			const last = toOneProps[toOneProps.length - 1]

			if (last.reducedBy !== undefined || last.filter !== undefined) {
				throw new QueryLanguageError(
					`Cannot parse '${Parser.rawInput}': the last field '${
						last.field
					}' is being reduced or filtered, which, grammatically, makes it a relation but a single field is expected.`
				)
			}

			const fieldName = last.field
			toOneProps.pop()

			return {
				toOneProps,
				fieldName
			}
		}
	)

	private relativeSingleEntity: () => Parser.AST.RelativeSingleEntity = this.RULE<Parser.AST.RelativeSingleEntity>(
		'relativeSingleEntity',
		() => {
			const toOneProps: Parser.AST.AtomicToOneProps[] = []

			this.AT_LEAST_ONE_SEP({
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
			const { toOneProps, fieldName } = this.SUBRULE(this.relativeSingleField)
			const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))
			const toManyProps: Parser.AST.AtomicToManyProps = {
				field: fieldName
			}

			if (filter !== undefined) {
				toManyProps.filter = filter
			}

			return {
				toOneProps,
				toManyProps
			}
		}
	)

	private toOneProps = this.RULE('toOneProps', () => {
		const fieldName = this.SUBRULE(this.fieldName)
		const reducedBy = this.OPTION(() => this.SUBRULE(this.uniqueWhere))
		const props: Parser.AST.AtomicToOneProps = {
			field: fieldName
		}

		if (reducedBy !== undefined) {
			props.reducedBy = reducedBy
		}

		return props
	})

	private nonUniqueWhere: () => Parser.AST.Filter = this.RULE('nonUniqueWhere', () => {
		const cnfWhere: Parser.AST.Filter[] = []

		this.AT_LEAST_ONE(() => {
			this.CONSUME(tokens.LeftBracket)

			cnfWhere.push(this.SUBRULE(this.disjunction))

			this.CONSUME(tokens.RightBracket)
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

	// TODO this is to naïve and needs rewriting
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
		const fields: FieldName[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Dot,
			DEF: () => {
				fields.push(this.SUBRULE(this.fieldIdentifier))
			}
		})

		const condition = this.SUBRULE(this.condition)

		let i = fields.length - 1
		let where: Parser.AST.FieldWhere = {
			[fields[i--]]: condition
		}

		while (i >= 0) {
			where = {
				[fields[i--]]: where
			}
		}

		return where
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
		return this.OR<Parser.AST.ConditionOperator>([
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
	})

	private columnValue: () => Parser.AST.ColumnValue = this.RULE('columnValue', () => {
		return this.OR<Parser.AST.ColumnValue>([
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
	})

	private uniqueWhere = this.RULE('uniqueWhere', () => {
		const where: Input.UniqueWhere<GraphQlBuilder.Literal> = {}

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

		return where
	})

	private fieldName: () => FieldName = this.RULE<FieldName>('fieldName', () => {
		return this.OR([
			{
				ALT: () => this.SUBRULE(this.fieldIdentifier)
			}
		])
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
				ALT: () => this.SUBRULE(this.graphQlLiteral)
			},
			{
				ALT: () => {
					const variableValue = this.SUBRULE(this.variable)
					if (
						typeof variableValue === 'string' ||
						typeof variableValue === 'number' ||
						variableValue instanceof GraphQlBuilder.Literal
					) {
						return variableValue
					}
					throw new QueryLanguageError(
						`A variable can resolve to a literal, string or a number, not ${typeof variableValue}`
					)
				}
			}
		])
	})

	private fieldIdentifier: () => FieldName = this.RULE('fieldIdentifier', () => {
		return this.OR([
			{
				ALT: () => this.SUBRULE(this.identifier)
			},
			{
				ALT: () => {
					const variable = this.SUBRULE(this.variable)
					if (!TokenRegExps.identifier.test(variable)) {
						throw new QueryLanguageError(`The value \$${variable} is not a valid field identifier.`)
					}
					return variable
				}
			}
		])
	})

	private identifier: () => string = this.RULE('identifier', () => {
		return this.CONSUME(tokens.Identifier).image
	})

	private entityIdentifier: () => EntityName = this.RULE('entityIdentifier', () => {
		return this.OR([
			{
				ALT: () => this.CONSUME(tokens.EntityIdentifier).image
			},
			{
				ALT: () => {
					const variable = this.SUBRULE(this.variable)
					if (!TokenRegExps.entityIdentifier.test(variable)) {
						throw new QueryLanguageError(`The value of the variable \$${variable} is not a valid entity identifier.`)
					}
					return variable
				}
			}
		])
	})

	private string = this.RULE('string', () => {
		const image = this.CONSUME(tokens.StringLiteral).image
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
		return parseFloat(this.CONSUME(tokens.NumberLiteral).image)
	})

	private graphQlLiteral = this.RULE('graphQlLiteral', () => {
		const image = this.SUBRULE1(this.identifier)

		return new GraphQlBuilder.Literal(image)
	})

	private variable = this.RULE('variable', () => {
		this.CONSUME(tokens.DollarSign)
		const variableName = this.CONSUME(tokens.Identifier).image

		if (Parser.environment.hasName(variableName)) {
			return Parser.environment.getValue(variableName)
		}
		if (Parser.environment.hasDimension(variableName)) {
			const dimensionValue = Parser.environment.getDimension(variableName)

			if (dimensionValue.length === 1) {
				return dimensionValue[0]
			}
			throw new QueryLanguageError(
				`The variable \$${variableName} resolved to a dimension which exists but contains ${
					dimensionValue.length
				} values. It has to contain exactly one.`
			)
		}
		throw new QueryLanguageError(`Undefined variable \$${variableName}.`)
	})

	private constructor() {
		super(tokenList, { outputCst: false, maxLookahead: 1 })
		this.performSelfAnalysis()
	}

	public static parseQueryLanguageExpression<E extends Parser.EntryPoint>(
		input: string,
		entry: E,
		environment: Environment
	): Parser.ParserResult[E] {
		const lexingResult = Parser.lexer.tokenize((Parser.rawInput = input))

		if (lexingResult.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to tokenize '${input}'.\n\n${lexingResult.errors.map(i => i.message).join('\n')}`
			)
		}

		Parser.environment = environment
		Parser.parser.input = lexingResult.tokens

		let expression: Parser.ParserResult[keyof Parser.ParserResult]

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
			case Parser.EntryPoint.QualifiedEntityList:
				expression = Parser.parser.qualifiedEntityList()
				break
			case Parser.EntryPoint.QualifiedFieldList:
				expression = Parser.parser.qualifiedFieldList()
				break
			case Parser.EntryPoint.UniqueWhere:
				expression = Parser.parser.uniqueWhere()
				break
			case Parser.EntryPoint.Filter:
				expression = Parser.parser.nonUniqueWhere()
				break
			default:
				throw new QueryLanguageError(`Not implemented entry point '${entry}'`)
		}

		if (Parser.parser.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to parse '${input}'.\n\n${Parser.parser.errors.map(i => i.message).join('\n')}`
			)
		}

		return expression as Parser.ParserResult[E]
	}
}

namespace Parser {
	export namespace AST {
		export type AtomicToOneProps = ToOne.AtomicPrimitivePublicProps

		export type AtomicToManyProps = ToMany.AtomicPrimitivePublicProps

		export interface RelativeSingleEntity {
			toOneProps: AtomicToOneProps[]
		}

		export interface RelativeSingleField extends RelativeSingleEntity {
			fieldName: FieldName
		}

		export interface RelativeEntityList extends RelativeSingleEntity {
			toManyProps: AtomicToManyProps
		}

		export interface QualifiedEntityList extends RelativeSingleEntity {
			entityName: EntityName
			filter?: Filter
		}

		export interface QualifiedFieldList extends RelativeSingleEntity {
			entityName: EntityName
			fieldName: FieldName
			filter?: Filter
		}

		export type FieldWhere = Input.FieldWhere<Condition>

		export type Filter = Input.Where<Condition>

		export type ColumnValue = Input.ColumnValue<GraphQlBuilder.Literal>

		export type Condition = Input.Condition<ColumnValue>

		export type ConditionOperator = keyof Pick<Condition, 'eq' | 'notEq' | 'lt' | 'lte' | 'gt' | 'gte'>

		export type UniqueWhere = Input.UniqueWhere<GraphQlBuilder.Literal>
	}

	export enum EntryPoint {
		QualifiedEntityList = 'qualifiedEntityList', // E.g. "Author[age < 123].son.sisters(name = 'Jane')
		QualifiedFieldList = 'qualifiedFieldList', // E.g. "Author[age < 123].son.sister.name
		RelativeSingleField = 'relativeSingleField', // E.g. authors(id = 123).person.name
		RelativeSingleEntity = 'relativeSingleEntity', // E.g. localesByLocale(locale.slug = en)
		RelativeEntityList = 'relativeEntityList', // E.g. genres(slug = 'sciFi').authors[age < 123]
		UniqueWhere = 'uniqueWhere', // E.g. (author.mother.id = 123)
		Filter = 'filter' // E.g. [author.son.age < 123]
	}

	export interface ParserResult {
		qualifiedEntityList: AST.QualifiedEntityList
		qualifiedFieldList: AST.QualifiedFieldList
		relativeSingleField: AST.RelativeSingleField
		relativeSingleEntity: AST.RelativeSingleEntity
		relativeEntityList: AST.RelativeEntityList
		uniqueWhere: AST.UniqueWhere
		filter: AST.Filter
	}
}

export { Parser }
