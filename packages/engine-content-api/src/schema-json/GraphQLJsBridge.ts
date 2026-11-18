import {
	ASTNode,
	DocumentNode,
	execute,
	FieldNode,
	FragmentDefinitionNode,
	GraphQLObjectType,
	GraphQLScalarType,
	GraphQLSchema,
	GraphQLSchemaConfig,
	isIntrospectionType,
	isSpecifiedScalarType,
	Kind,
	OperationTypeNode,
	printSchema,
	SelectionSetNode,
	visit,
} from 'graphql'
import { buildSchema, CompletedResult, ResolveInfo, ResolverFn, ScalarImplementation, TypeKind } from '@contember/graphql-json'
import { Context } from '../types.js'
import { JsonSchemaExtension } from './JsonContentSchemaBuilder.js'
import { aliasAwareResolver } from './JsonEntityTypes.js'
import { JsonOutputField } from './JsonTypeRegistry.js'

/**
 * Merges a graphql-js schema contribution (plugins) into a JSON content schema. Its root fields are delegated to
 * graphql-js on the contributor's own small schema, so the contributor's resolvers keep receiving graphql-js `info`, and
 * its response is inserted as is.
 */
export const createGraphQLJsBridge = (contribution: GraphQLSchema | GraphQLSchemaConfig): JsonSchemaExtension => {
	const schema = contribution instanceof GraphQLSchema ? contribution : new GraphQLSchema(contribution)
	const json = buildSchema(printSchema(schema))
	const rootTypes = new Set([schema.getQueryType()?.name, schema.getMutationType()?.name])

	const types: JsonSchemaExtension['types'] = {}
	for (const [name, type] of Object.entries(json.t)) {
		if (!rootTypes.has(name)) {
			types[name] = type
		}
	}

	const rootFields = (type: GraphQLObjectType | null | undefined, operation: OperationTypeNode): Record<string, JsonOutputField> => {
		const jsonType = type ? json.t[type.name] : undefined
		if (!jsonType || jsonType[0] !== TypeKind.OBJECT) {
			return {}
		}
		return Object.fromEntries(
			Object.entries(jsonType[1]).map(([name, field]) => [
				name,
				{ type: field[0], args: field[1] ?? undefined, deprecationReason: field[3], resolve: createDelegatingResolver(schema, operation) },
			]),
		)
	}

	return {
		types,
		includedTypes: contribution instanceof GraphQLSchema ? [] : (contribution.types ?? []).map(it => it.name),
		scalars: getCustomScalars(schema),
		queries: rootFields(schema.getQueryType(), OperationTypeNode.QUERY),
		mutations: rootFields(schema.getMutationType(), OperationTypeNode.MUTATION),
	}
}

/** Coercion of the custom scalars a converted graphql-js schema declares; without it they validate as plain literals. */
export const getCustomScalars = (schema: GraphQLSchema): Record<string, ScalarImplementation> => {
	const scalars: Record<string, ScalarImplementation> = {}
	for (const type of Object.values(schema.getTypeMap())) {
		if (type instanceof GraphQLScalarType && !isSpecifiedScalarType(type) && !isIntrospectionType(type)) {
			scalars[type.name] = {
				serialize: value => type.serialize(value),
				parseValue: value => type.parseValue(value),
				parseLiteral: (ast, variables) => type.parseLiteral(ast, variables),
			}
		}
	}
	return scalars
}

const createDelegatingResolver =
	(schema: GraphQLSchema, operation: OperationTypeNode): ResolverFn<unknown, Context> => async (parent, args, context, info) => {
		if (parent) {
			return aliasAwareResolver(parent, args, context, info)
		}
		const result = await execute({
			schema,
			document: createDelegatedDocument(info, operation),
			// graphql-js coerces them itself; the coerced values would be coerced twice
			variableValues: info.rawVariableValues,
			contextValue: context,
		})
		return new CompletedResult(result.data?.[info.path.key], result.errors ?? [])
	}

/** The resolved field as a standalone operation. */
const createDelegatedDocument = (info: ResolveInfo, operation: OperationTypeNode): DocumentNode => {
	const fragments = collectFragments(info.fieldNodes, info.fragments)
	const usedVariables = new Set<string>()
	for (const node of [...info.fieldNodes, ...fragments]) {
		visit(node, {
			Variable: variable => {
				usedVariables.add(variable.name.value)
			},
		})
	}
	const selectionSet: SelectionSetNode = { kind: Kind.SELECTION_SET, selections: info.fieldNodes }
	return {
		kind: Kind.DOCUMENT,
		definitions: [
			{
				kind: Kind.OPERATION_DEFINITION,
				operation,
				variableDefinitions: info.operation.variableDefinitions?.filter(it => usedVariables.has(it.variable.name.value)),
				selectionSet,
			},
			...fragments,
		],
	}
}

const collectFragments = (
	nodes: readonly FieldNode[],
	fragments: Record<string, FragmentDefinitionNode>,
): FragmentDefinitionNode[] => {
	const collected = new Map<string, FragmentDefinitionNode>()
	const queue: ASTNode[] = [...nodes]
	while (queue.length > 0) {
		const node = queue.pop()
		if (!node) {
			break
		}
		visit(node, {
			FragmentSpread: spread => {
				const fragment = fragments[spread.name.value]
				if (fragment && !collected.has(fragment.name.value)) {
					collected.set(fragment.name.value, fragment)
					queue.push(fragment)
				}
			},
		})
	}
	return [...collected.values()]
}
