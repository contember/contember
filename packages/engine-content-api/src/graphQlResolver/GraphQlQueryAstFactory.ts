import { isIt } from '../utils'
import {
	FieldNode as GraphQlFieldNode,
	FragmentSpreadNode,
	GraphQLList,
	GraphQLNonNull,
	GraphQLObjectType,
	GraphQLOutputType,
	GraphQLResolveInfo,
} from 'graphql'
import { SelectionSetNode } from 'graphql/language/ast'
import { getArgumentValues } from 'graphql/execution/values'
import { ResolveInfoUtils } from '../utils/ResolveInfoUtils'
import { FieldNode, ObjectNode } from '../inputProcessing'

type NodeFilter = (node: GraphQlFieldNode, path: string[]) => boolean
export default class GraphQlQueryAstFactory {
	constructor(private readonly argumentValuesResolver: typeof getArgumentValues) {}

	public create<Args = any>(info: GraphQLResolveInfo, filter?: NodeFilter): ObjectNode<Args> {
		const node = ResolveInfoUtils.extractFieldNode(info)
		const parentType = info.parentType
		if (!GraphQlQueryAstFactory.itIs<GraphQLObjectType>(parentType, 'GraphQLObjectType')) {
			throw new Error(GraphQlQueryAstFactory.getValueType(parentType))
		}

		return this.createFromNode(info, parentType as GraphQLObjectType, node, [], filter || (() => true)) as ObjectNode
	}

	private createFromNode(
		info: GraphQLResolveInfo,
		parentType: GraphQLObjectType,
		node: GraphQlFieldNode,
		path: string[],
		filter: NodeFilter,
	): ObjectNode | FieldNode | null {
		if (!filter(node, path)) {
			return null
		}
		const name = node.name.value
		const alias = node.alias ? node.alias.value : name
		if (!node.selectionSet) {
			return new FieldNode(name, alias, {})
		}
		const field = parentType.getFields()[name]
		const type = field.type
		const resolvedType = GraphQlQueryAstFactory.resolveObjectType(type)

		const fields: (FieldNode | ObjectNode)[] = this.processSelectionSet(
			info,
			resolvedType,
			node.selectionSet,
			[...path, alias],
			filter,
		)

		return new ObjectNode(
			name,
			alias,
			fields,
			this.argumentValuesResolver(field, node, info.variableValues),
			(field as any).meta || {},
			path,
		)
	}

	private processSelectionSet(
		info: GraphQLResolveInfo,
		parentType: GraphQLObjectType,
		selectionSet: SelectionSetNode,
		path: string[],
		filter: NodeFilter,
	): (FieldNode | ObjectNode)[] {
		const fields: (FieldNode | ObjectNode)[] = []
		for (let subNode of selectionSet.selections) {
			if (isIt<GraphQlFieldNode>(subNode, 'kind', 'Field')) {
				const result = this.createFromNode(info, parentType, subNode, path, filter)
				if (result !== null) {
					fields.push(result)
				}
			} else if (isIt<FragmentSpreadNode>(subNode, 'kind', 'FragmentSpread')) {
				const fragmentDefinition = info.fragments[subNode.name.value]
				if (!fragmentDefinition) {
					throw new Error(`GraphQlQueryAstFactory: Fragment definition ${subNode.name.value} not found`)
				}
				const typeName = fragmentDefinition.typeCondition.name.value
				const subField = info.schema.getType(typeName)
				if (!GraphQlQueryAstFactory.itIs<GraphQLObjectType>(subField, 'GraphQLObjectType')) {
					throw new Error('GraphQlQueryAstFactory: subfield is expected to be GraphQLObjectType')
				}
				fields.push(
					...this.processSelectionSet(
						info,
						subField as GraphQLObjectType,
						fragmentDefinition.selectionSet,
						path,
						filter,
					),
				)
			} else {
				throw new Error('FragmentSpread and InlineFragment are not supported yet')
			}
		}
		return fields
	}

	public static resolveObjectType(type: GraphQLOutputType): GraphQLObjectType {
		if (GraphQlQueryAstFactory.itIs<GraphQLObjectType>(type, 'GraphQLObjectType')) {
			return type
		}
		if (GraphQlQueryAstFactory.itIs<GraphQLList<any>>(type, 'GraphQLList')) {
			return GraphQlQueryAstFactory.resolveObjectType(type.ofType)
		}
		if (GraphQlQueryAstFactory.itIs<GraphQLNonNull<any>>(type, 'GraphQLNonNull')) {
			return GraphQlQueryAstFactory.resolveObjectType(type.ofType)
		}
		throw new Error(GraphQlQueryAstFactory.getValueType(type))
	}

	private static getValueType(val: any): string {
		if (typeof val === 'object' && val.constructor) {
			return 'Object of type ' + val.constructor.name + ' is not supported'
		}
		return typeof val + ' is not supported'
	}

	private static itIs<T>(val: any, name: string): val is T {
		return typeof val === 'object' && val.constructor && val.constructor.name === name
	}
}
