import { CrudQueryBuilder, GraphQlBuilder, GraphQlLiteral, Input } from '@contember/client'
import { EmbeddedActionsParser, Lexer } from 'chevrotain'
import { Environment } from '../dao'
import type { EntityName, FieldName, Filter, OrderBy, UniqueWhere } from '../treeParameters'
import type {
	ParsedTaggedMap,
	ParsedTaggedMapVariableValue,
	ParsedTaggedMapLiteralValue,
	ParsedTaggedMapEntry,
	ParsedHasManyRelation,
	ParsedHasOneRelation,
	ParsedQualifiedEntityList,
	ParsedQualifiedFieldList,
	ParsedQualifiedSingleEntity,
	ParsedRelativeEntityList,
	ParsedRelativeSingleEntity,
	ParsedRelativeSingleField,
	ParsedUnconstrainedQualifiedEntityList,
	ParsedUnconstrainedQualifiedSingleEntity,
} from './ParserResults'
import { CacheStore } from './CacheStore'
import { QueryLanguageError } from './QueryLanguageError'
import { tokenList, TokenRegExps, tokens } from './tokenList'

/**
 * TODO:
 * 	- double quoted strings
 * 	- collections (objects & lists)
 * 	- collection operators (e.g. 'in', 'notIn', etc.)
 * 	- filtering toOne
 */
class Parser extends EmbeddedActionsParser {
	private static rawInput: string = ''
	private static lexer = new Lexer(tokenList)
	private static parser = new Parser()
	private static environment: Environment = new Environment()
	private static cacheStore: CacheStore = new CacheStore()

	private qualifiedEntityList = this.RULE<ParsedQualifiedEntityList>('qualifiedEntityList', () => {
		const entityName = this.SUBRULE(this.entityIdentifier)
		const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))

		const relativeSingleEntity = this.OPTION1(() => {
			this.CONSUME(tokens.Dot)
			return this.SUBRULE(this.relativeSingleEntity)
		})
		const hasOneRelationPath = this.ACTION(() =>
			relativeSingleEntity === undefined ? [] : relativeSingleEntity.hasOneRelationPath,
		)

		return {
			entityName,
			filter,
			hasOneRelationPath,
		}
	})

	private qualifiedFieldList = this.RULE<ParsedQualifiedFieldList>('qualifiedFieldList', () => {
		const entityName = this.SUBRULE(this.entityIdentifier)
		const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))

		this.CONSUME(tokens.Dot)

		const { hasOneRelationPath, field } = this.SUBRULE(this.relativeSingleField)

		return {
			entityName,
			field,
			filter,
			hasOneRelationPath,
		}
	})

	private qualifiedSingleEntity = this.RULE<ParsedQualifiedSingleEntity>('qualifiedSingleEntity', () => {
		const entityName = this.SUBRULE(this.entityIdentifier)

		// TODO this will probably go away once we support singleton entities
		const where = this.SUBRULE(this.uniqueWhere)
		const filter = this.OPTION(() => this.SUBRULE(this.nonUniqueWhere))
		const relativeSingleEntity = this.OPTION1(() => {
			this.CONSUME(tokens.Dot)
			return this.SUBRULE(this.relativeSingleEntity)
		})

		const hasOneRelationPath = this.ACTION(() =>
			relativeSingleEntity === undefined ? [] : relativeSingleEntity.hasOneRelationPath,
		)

		return {
			entityName,
			where,
			hasOneRelationPath,
			filter,
		}
	})

	private unconstrainedQualifiedEntityList = this.RULE<ParsedUnconstrainedQualifiedEntityList>(
		'unconstrainedQualifiedEntityList',
		() => {
			const entityName = this.SUBRULE(this.entityIdentifier)
			const relativeSingleEntity = this.OPTION(() => {
				this.CONSUME(tokens.Dot)
				return this.SUBRULE(this.relativeSingleEntity)
			})

			const hasOneRelationPath = this.ACTION(() =>
				relativeSingleEntity === undefined ? [] : relativeSingleEntity.hasOneRelationPath,
			)

			return {
				entityName,
				hasOneRelationPath,
			}
		},
	)

	private unconstrainedQualifiedSingleEntity = this.RULE<ParsedUnconstrainedQualifiedSingleEntity>(
		'unconstrainedQualifiedSingleEntity',
		() => {
			const entityName = this.SUBRULE(this.entityIdentifier)
			const relativeSingleEntity = this.OPTION1(() => {
				this.CONSUME(tokens.Dot)
				return this.SUBRULE(this.relativeSingleEntity)
			})

			const hasOneRelationPath = this.ACTION(() =>
				relativeSingleEntity === undefined ? [] : relativeSingleEntity.hasOneRelationPath,
			)

			return {
				entityName,
				hasOneRelationPath,
			}
		},
	)

	private relativeSingleField = this.RULE<ParsedRelativeSingleField>('relativeSingleField', () => {
		let { hasOneRelationPath } = this.SUBRULE(this.relativeSingleEntity)

		const last = this.ACTION(() => hasOneRelationPath.pop()!)

		this.ACTION(() => {
			if (last.reducedBy !== undefined || last.filter !== undefined) {
				throw new QueryLanguageError(
					`Cannot parse '${Parser.rawInput}': the last field '${last.field}' is being reduced or filtered, which, grammatically, makes it a relation but a single field is expected.`,
				)
			}
		})

		const field = this.ACTION(() => last.field)

		return {
			hasOneRelationPath,
			field,
		}
	})

	private relativeSingleEntity = this.RULE<ParsedRelativeSingleEntity>('relativeSingleEntity', () => {
		const hasOneRelationPath: ParsedHasOneRelation[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Dot,
			DEF: () => {
				hasOneRelationPath.push(this.SUBRULE(this.hasOneRelation))
			},
		})

		return {
			hasOneRelationPath,
		}
	})

	private relativeEntityList = this.RULE<ParsedRelativeEntityList>('relativeEntityList', () => {
		let { hasOneRelationPath } = this.SUBRULE(this.relativeSingleEntity)

		const last = this.ACTION(() => hasOneRelationPath.pop()!)

		this.ACTION(() => {
			if (last.reducedBy !== undefined) {
				throw new QueryLanguageError(
					`Cannot parse '${Parser.rawInput}': the last field '${last.field}' is being reduced, which, grammatically, makes it a has-one relation but a has-many relation is expected.`,
				)
			}
		})

		const hasManyRelation = this.ACTION(
			(): ParsedHasManyRelation => ({
				field: last.field,
				filter: last.filter,
			}),
		)

		return {
			hasOneRelationPath,
			hasManyRelation,
		}
	})

	private hasOneRelation = this.RULE<ParsedHasOneRelation>('hasOneRelation', () => {
		const fieldName = this.SUBRULE(this.fieldName)
		const reducedBy = this.OPTION(() => this.SUBRULE(this.uniqueWhere))
		const filter = this.OPTION1(() => this.SUBRULE(this.nonUniqueWhere))
		const hasOneRelation: ParsedHasOneRelation = {
			field: fieldName,
			filter,
			reducedBy,
		}

		return hasOneRelation
	})

	private nonUniqueWhere: () => Filter = this.RULE('nonUniqueWhere', () => {
		const cnfWhere: Filter[] = []

		this.AT_LEAST_ONE(() => {
			this.CONSUME(tokens.LeftBracket)

			cnfWhere.push(this.SUBRULE(this.disjunction))

			this.CONSUME(tokens.RightBracket)
		})
		if (cnfWhere.length === 1) {
			return cnfWhere[0]
		}
		return {
			and: cnfWhere,
		}
	})

	private disjunction: () => Filter = this.RULE('disjunction', () => {
		const conjunctions: Filter[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Or,
			DEF: () => {
				conjunctions.push(this.SUBRULE(this.conjunction))
			},
		})
		if (conjunctions.length === 1) {
			return conjunctions[0]
		}
		return {
			or: conjunctions,
		}
	})

	private conjunction: () => Filter = this.RULE('conjunction', () => {
		const negations: Filter[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.And,
			DEF: () => {
				negations.push(this.SUBRULE(this.negation))
			},
		})
		if (negations.length === 1) {
			return negations[0]
		}
		return {
			and: negations,
		}
	})

	// TODO this is to naïve and needs rewriting
	private negation: () => Filter = this.RULE('negation', () => {
		return this.OR([
			{
				ALT: () => {
					this.CONSUME(tokens.Not)
					return {
						not: this.SUBRULE(this.filterGroup),
					}
				},
			},
			{
				ALT: () => {
					return this.SUBRULE1(this.filterGroup)
				},
			},
		])
	})

	private filterGroup: () => Filter = this.RULE('filterGroup', () => {
		return this.OR([
			{
				ALT: () => {
					this.CONSUME(tokens.LeftParenthesis)
					const subFilter = this.SUBRULE(this.disjunction)
					this.CONSUME1(tokens.RightParenthesis)
					return subFilter
				},
			},
			{
				ALT: () => this.SUBRULE1(this.filterAtom),
			},
		])
	})

	private filterAtom: () => Filter = this.RULE('filterAtom', () => {
		return this.OR([
			{
				ALT: () => {
					const variable = this.SUBRULE(this.variable)
					return this.ACTION(() => {
						if (typeof variable !== 'object' || variable instanceof GraphQlBuilder.GraphQlLiteral) {
							throw new QueryLanguageError(`Invalid filter value '${JSON.stringify(variable)}'`)
						}
						return variable
					})
				},
			},
			{
				ALT: () => this.SUBRULE1(this.fieldWhere),
			},
		])
	})

	private fieldWhere: () => Parser.AST.FieldWhere = this.RULE('fieldWhere', () => {
		const fields: FieldName[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Dot,
			DEF: () => {
				fields.push(this.SUBRULE(this.fieldIdentifier))
			},
		})

		const condition = this.SUBRULE(this.condition)

		let i = fields.length - 1
		let where: Parser.AST.FieldWhere = {
			[fields[i--]]: condition,
		}

		while (i >= 0) {
			where = {
				[fields[i--]]: where,
			}
		}

		return where
	})

	private condition: () => Parser.AST.Condition = this.RULE('condition', () => {
		const operator = this.SUBRULE(this.conditionOperator)
		const columnValue = this.SUBRULE(this.columnValue)
		const condition: Parser.AST.Condition = {}

		return this.ACTION(() => {
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
	})

	private conditionOperator: () => Parser.AST.ConditionOperator = this.RULE<Parser.AST.ConditionOperator>(
		'conditionOperator',
		() => {
			return this.OR([
				{
					ALT: () => {
						this.CONSUME(tokens.Equals)
						return 'eq'
					},
				},
				{
					ALT: () => {
						this.CONSUME(tokens.NotEquals)
						return 'notEq'
					},
				},
				{
					ALT: () => {
						this.CONSUME(tokens.LowerThan)
						return 'lt'
					},
				},
				{
					ALT: () => {
						this.CONSUME(tokens.LowerEqual)
						return 'lte'
					},
				},
				{
					ALT: () => {
						this.CONSUME(tokens.GreaterThan)
						return 'gt'
					},
				},
				{
					ALT: () => {
						this.CONSUME(tokens.GreaterEqual)
						return 'gte'
					},
				},
			])
		},
	)

	private columnValue: () => Parser.AST.ColumnValue = this.RULE<Parser.AST.ColumnValue>('columnValue', () => {
		return this.OR([
			{
				ALT: () => {
					this.CONSUME(tokens.Null)
					return null
				},
			},
			{
				ALT: () => {
					this.CONSUME(tokens.True)
					return true
				},
			},
			{
				ALT: () => {
					this.CONSUME(tokens.False)
					return false
				},
			},
			{
				ALT: () => this.SUBRULE(this.primaryValue),
			},
		])
	})

	private uniqueWhere = this.RULE('uniqueWhere', () => {
		const where: UniqueWhere = {}

		this.CONSUME(tokens.LeftParenthesis)
		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Comma,
			DEF: () => {
				const nestedFields: string[] = []
				this.AT_LEAST_ONE_SEP1({
					SEP: tokens.Dot,
					DEF: () => {
						nestedFields.push(this.SUBRULE(this.fieldIdentifier))
					},
				})
				this.CONSUME(tokens.Equals)
				const primaryValue = this.SUBRULE<Input.PrimaryValue<GraphQlBuilder.GraphQlLiteral>>(this.primaryValue)

				this.ACTION(() => {
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

								if (typeof existingWhere === 'object' && !(existingWhere instanceof GraphQlBuilder.GraphQlLiteral)) {
									nestedWhere = existingWhere
								} else {
									throw new QueryLanguageError(
										`Malformed expression: cannot simultaneously treat the '${nestedFields
											.slice(0, i + 1)
											.join('.')}' ` + `field as a scalar as well as a relation.`,
									)
								}
							} else {
								const newWhere = {}
								nestedWhere[nestedField] = newWhere
								nestedWhere = newWhere
							}
						}
					}
				})
			},
		})
		this.CONSUME(tokens.RightParenthesis)

		return where
	})

	private orderBy: () => Input.OrderBy<CrudQueryBuilder.OrderDirection>[] = this.RULE<
		Input.OrderBy<CrudQueryBuilder.OrderDirection>[]
	>('orderBy', () => {
		const order: Input.OrderBy<CrudQueryBuilder.OrderDirection>[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Comma,
			DEF: () => {
				const fieldNames: FieldName[] = []
				this.AT_LEAST_ONE_SEP1({
					SEP: tokens.Dot,
					DEF: () => {
						fieldNames.push(this.SUBRULE(this.fieldIdentifier))
					},
				})
				let literal = this.OPTION(() => this.SUBRULE1(this.graphQlLiteral)) as
					| CrudQueryBuilder.OrderDirection
					| undefined

				this.ACTION(() => {
					if (literal) {
						if (literal.value !== 'asc' && literal.value !== 'desc') {
							throw new QueryLanguageError(`The only valid order directions are \`asc\` and \`desc\`.`)
						}
					} else {
						literal = new GraphQlBuilder.GraphQlLiteral('asc')
					}
					let orderBy: Input.FieldOrderBy<CrudQueryBuilder.OrderDirection> = literal

					for (let i = fieldNames.length - 1; i >= 0; i--) {
						orderBy = { [fieldNames[i]]: orderBy }
					}
					order.push(orderBy as Input.OrderBy<CrudQueryBuilder.OrderDirection>)
				})
			},
		})

		return order
	})

	private taggedMap: () => ParsedTaggedMap = this.RULE<ParsedTaggedMap>('taggedMap', () => {
		const name = this.SUBRULE(this.pageName)
		return {
			name,
			entries: this.OPTION(() => this.SUBRULE(this.taggedMapEntries)) ?? [],
		}
	})

	private taggedMapEntries: () => ParsedTaggedMapEntry[] = this.RULE<ParsedTaggedMapEntry[]>('taggedMapEntries', () => {
		this.CONSUME(tokens.LeftParenthesis)
		const entries: ParsedTaggedMapEntry[] = []
		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Comma,
			DEF: () => entries.push(this.SUBRULE(this.taggedMapEntry)),
		})
		this.CONSUME(tokens.RightParenthesis)

		return entries
	})

	private taggedMapEntry: () => ParsedTaggedMapEntry = this.RULE<ParsedTaggedMapEntry>('taggedMapEntry', () => {
		const variableName = this.CONSUME(tokens.Identifier).image
		this.CONSUME1(tokens.Colon)
		const value = this.OR([
			{
				ALT: () => this.SUBRULE(this.taggedMapLiteralValue),
			},
			{
				ALT: () => this.SUBRULE(this.taggedMapVariableValue),
			},
		])

		return {
			key: variableName,
			value,
		}
	})

	private taggedMapLiteralValue: () => ParsedTaggedMapLiteralValue = this.RULE<ParsedTaggedMapLiteralValue>('taggedMapLiteralValue', () => {
		const value = this.OR([
			{
				ALT: () => this.SUBRULE(this.string),
			},
			{
				ALT: () => this.SUBRULE(this.number),
			},
		])

		return {
			type: 'literal',
			value,
		}
	})

	private taggedMapVariableValue: () => ParsedTaggedMapVariableValue = this.RULE<ParsedTaggedMapVariableValue>('taggedMapVariableValue', () => {
		const start = this.CONSUME(tokens.DollarSign)
		this.SUBRULE(this.relativeSingleField)
		const end = this.LA(0)
		const field = this.input.slice(this.input.indexOf(start) + 1, this.input.indexOf(end) + 1).map(it => it.image).join('')

		return {
			type: 'variable',
			value: field,
		}
	})


	private fieldName: () => FieldName = this.RULE<FieldName>('fieldName', () => {
		return this.OR([
			{
				ALT: () => this.SUBRULE(this.fieldIdentifier),
			},
		])
	})

	private primaryValue = this.RULE<Input.PrimaryValue<GraphQlBuilder.GraphQlLiteral>>('primaryValue', () => {
		return this.OR([
			{
				ALT: () => this.SUBRULE(this.string),
			},
			{
				ALT: () => this.SUBRULE(this.number),
			},
			{
				ALT: () => this.SUBRULE(this.graphQlLiteral),
			},
			{
				ALT: () => {
					const variableValue = this.SUBRULE(this.variable)
					return this.ACTION(() => {
						if (
							typeof variableValue === 'string' ||
							typeof variableValue === 'number' ||
							variableValue instanceof GraphQlBuilder.GraphQlLiteral
						) {
							return variableValue
						}
						throw new QueryLanguageError(
							`A variable can resolve to a literal, string or a number, not ${typeof variableValue}`,
						)
					})
				},
			},
		])
	})

	private fieldIdentifier: () => FieldName = this.RULE('fieldIdentifier', () => {
		return this.SUBRULE(this.identifier)
		// return this.OR([
		// 	{
		// 		ALT: () => this.SUBRULE(this.identifier),
		// 	},
		// 	{
		// 		ALT: () => {
		// 			const variable = this.SUBRULE(this.variable)
		// 			return this.ACTION(() => {
		// 				if (!(typeof variable === 'string') || !TokenRegExps.identifier.test(variable)) {
		// 					throw new QueryLanguageError(`The value \$${variable} is not a valid field identifier.`)
		// 				}
		// 				return variable
		// 			})
		// 		},
		// 	},
		// ])
	})

	private identifier: () => string = this.RULE('identifier', () => {
		return this.OR([
			{
				ALT: () => this.CONSUME(tokens.Identifier).image,
			},
			{
				// TODO this is a temporary hack to allow for literals that start with an uppercase letter… 🙈
				ALT: () => this.CONSUME(tokens.EntityIdentifier).image,
			},
		])
	})

	private pageName: () => string = this.RULE('pageName', () => {
		const parts: string[] = []

		this.AT_LEAST_ONE_SEP({
			SEP: tokens.Slash,
			DEF: () => parts.push(this.CONSUME(tokens.Identifier).image),
		})

		return parts.join('/')
	})

	private entityIdentifier: () => EntityName = this.RULE('entityIdentifier', () => {
		return this.OR([
			{
				ALT: () => this.CONSUME(tokens.EntityIdentifier).image,
			},
			{
				ALT: () => {
					const variable = this.SUBRULE(this.variable)
					return this.ACTION(() => {
						if (!(typeof variable === 'string') || !TokenRegExps.entityIdentifier.test(variable)) {
							throw new QueryLanguageError(`The value of the variable \$${variable} is not a valid entity identifier.`)
						}
						return variable
					})
				},
			},
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

	private graphQlLiteral: () => GraphQlBuilder.GraphQlLiteral = this.RULE('graphQlLiteral', () => {
		const image = this.SUBRULE(this.identifier)

		return new GraphQlBuilder.GraphQlLiteral(image)
	})

	private variable = this.RULE<string | number | GraphQlLiteral | Filter | UniqueWhere>('variable', () => {
		this.CONSUME(tokens.DollarSign)
		const variableName = this.CONSUME(tokens.Identifier).image

		return this.ACTION(() => {
			if (Parser.environment.hasName(variableName)) {
				return Parser.environment.getValue(variableName)
			}
			if (Parser.environment.hasDimension(variableName)) {
				const dimensionValue = Parser.environment.getDimension(variableName)

				if (dimensionValue.length === 1) {
					return dimensionValue[0]
				}
				throw new QueryLanguageError(
					`The variable \$${variableName} resolved to a dimension which exists but contains ${dimensionValue.length} values. It has to contain exactly one. ` +
						`Perhaps you forgot to set the 'maxItems' prop of your DimensionsSwitcher?`,
				)
			}
			throw new QueryLanguageError(`Undefined variable \$${variableName}.`)
		})
	})

	private constructor() {
		super(tokenList, { outputCst: false, maxLookahead: 1 })
		this.performSelfAnalysis()
	}

	public static parseQueryLanguageExpression<E extends Parser.EntryPoint>(
		input: string,
		entry: E,
		environment: Environment,
	): Parser.ParserResult[E] {
		const cached = this.cacheStore.get(environment, entry, input)

		if (cached !== undefined) {
			return cached
		}

		const lexingResult = Parser.lexer.tokenize((Parser.rawInput = input))

		if (lexingResult.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to tokenize '${input}'.\n\n${lexingResult.errors.map(i => i.message).join('\n')}`,
			)
		}

		Parser.environment = environment
		Parser.parser.input = lexingResult.tokens

		let expression: Parser.ParserResult[keyof Parser.ParserResult]

		switch (entry) {
			case 'relativeSingleField':
				expression = Parser.parser.relativeSingleField()
				break
			case 'relativeSingleEntity':
				expression = Parser.parser.relativeSingleEntity()
				break
			case 'relativeEntityList':
				expression = Parser.parser.relativeEntityList()
				break
			case 'qualifiedEntityList':
				expression = Parser.parser.qualifiedEntityList()
				break
			case 'qualifiedFieldList':
				expression = Parser.parser.qualifiedFieldList()
				break
			case 'qualifiedSingleEntity':
				expression = Parser.parser.qualifiedSingleEntity()
				break
			case 'unconstrainedQualifiedEntityList':
				expression = Parser.parser.unconstrainedQualifiedEntityList()
				break
			case 'unconstrainedQualifiedSingleEntity':
				expression = Parser.parser.unconstrainedQualifiedSingleEntity()
				break
			case 'uniqueWhere':
				expression = Parser.parser.uniqueWhere()
				break
			case 'filter':
				expression = Parser.parser.nonUniqueWhere()
				break
			case 'orderBy':
				expression = Parser.parser.orderBy()
				break
			case 'taggedMap':
				expression = Parser.parser.taggedMap()
				break
			default:
				throw new QueryLanguageError(`Not implemented entry point '${entry}'`)
		}

		if (Parser.parser.errors.length !== 0) {
			throw new QueryLanguageError(
				`Failed to parse '${input}'.\n\n${Parser.parser.errors.map(i => i.message).join('\n')}`,
			)
		}

		this.cacheStore.set(environment, entry, input, expression as Parser.ParserResult[E])

		return expression as Parser.ParserResult[E]
	}
}

namespace Parser {
	export namespace AST {
		export type FieldWhere = Input.FieldWhere<Condition>

		export type ColumnValue = Input.ColumnValue<GraphQlBuilder.GraphQlLiteral>

		export type Condition = Input.Condition<ColumnValue>

		export type ConditionOperator = keyof Pick<Condition, 'eq' | 'notEq' | 'lt' | 'lte' | 'gt' | 'gte'>
	}

	export interface ParserResult {
		qualifiedEntityList: ParsedQualifiedEntityList // E.g. Author[age < 123].son.sisters(name = 'Jane')
		qualifiedFieldList: ParsedQualifiedFieldList // E.g. Author[age < 123].son.sister.name
		qualifiedSingleEntity: ParsedQualifiedSingleEntity // E.g. Author(id = 123).son.sister
		unconstrainedQualifiedEntityList: ParsedUnconstrainedQualifiedEntityList // E.g. Author.son.sister
		unconstrainedQualifiedSingleEntity: ParsedUnconstrainedQualifiedSingleEntity // E.g. Author.son.sister
		relativeSingleField: ParsedRelativeSingleField // E.g. authors(id = 123).person.name
		relativeSingleEntity: ParsedRelativeSingleEntity // E.g. localesByLocale(locale.slug = en)
		relativeEntityList: ParsedRelativeEntityList // E.g. genres(slug = 'sciFi').authors[age < 123]
		uniqueWhere: UniqueWhere // E.g. (author.mother.id = 123)
		filter: Filter // E.g. [author.son.age < 123]
		orderBy: OrderBy // E.g. items.order asc, items.content.name asc
		taggedMap: ParsedTaggedMap // E.g editUser(id: $entity.id, foo: 'bar')
	}

	export type EntryPoint = keyof ParserResult
}

export { Parser }
