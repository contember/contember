import { isIt, ResolveInfoUtils } from '../utils'
import {
	FieldNode as GraphQlFieldNode,
	FragmentSpreadNode,
	getArgumentValues,
	GraphQLObjectType,
	GraphQLOutputType,
	GraphQLResolveInfo,
	isListType,
	isNonNullType,
	isObjectType,
	Kind,
	SelectionSetNode,
} from 'graphql'
import { FieldNode, ObjectNode } from '../inputProcessing'
import { isDeepStrictEqual } from 'util'

type NodeFilter = (node: GraphQlFieldNode, path: string[]) => boolean
type AnyNode = ObjectNode | FieldNode

export class GraphQlQueryAstFactory {

	public create<Args = any>(info: GraphQLResolveInfo, filter?: NodeFilter): ObjectNode<Args> {
		const node = ResolveInfoUtils.extractFieldNode(info)
		const parentType = info.parentType

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

		const fields: AnyNode[] = this.processSelectionSet(info, resolvedType, node.selectionSet, [...path, alias], filter)

		return new ObjectNode(
			name,
			alias,
			fields,
			getArgumentValues(field, node, info.variableValues),
			field.extensions || {},
			path,
		)
	}

	private processSelectionSet(
		info: GraphQLResolveInfo,
		parentType: GraphQLObjectType,
		selectionSet: SelectionSetNode,
		path: string[],
		filter: NodeFilter,
	): AnyNode[] {
		const fields: ObjectNode | FieldNode[] = []
		for (const subNode of selectionSet.selections) {
			if (isIt<GraphQlFieldNode>(subNode, 'kind', Kind.FIELD)) {
				const field = this.createFromNode(info, parentType, subNode, path, filter)
				if (field === null) {
					continue
				}
				fields.push(field)
			} else if (isIt<FragmentSpreadNode>(subNode, 'kind', Kind.FRAGMENT_SPREAD)) {
				const fragmentDefinition = info.fragments[subNode.name.value]
				if (!fragmentDefinition) {
					throw new Error(`GraphQlQueryAstFactory: Fragment definition ${subNode.name.value} not found`)
				}
				const typeName = fragmentDefinition.typeCondition.name.value
				const subField = info.schema.getType(typeName)
				if (!isObjectType(subField)) {
					throw new Error('GraphQlQueryAstFactory: subfield is expected to be GraphQLObjectType')
				}
				const fragmentSelection = this.processSelectionSet(
					info,
					subField as GraphQLObjectType,
					fragmentDefinition.selectionSet,
					path,
					filter,
				)
				fields.push(...fragmentSelection)
			} else {
				throw new Error('InlineFragment are not supported yet')
			}
		}
		return GraphQlQueryAstFactory.mergeFieldList(fields)
	}

	public static resolveObjectType(type: GraphQLOutputType): GraphQLObjectType {
		if (isObjectType(type)) {
			return type
		}
		if (isListType(type)) {
			return GraphQlQueryAstFactory.resolveObjectType(type.ofType)
		}
		if (isNonNullType(type)) {
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

	private static mergeFieldList(nodes: AnyNode[]): AnyNode[] {
		const result: Record<string, AnyNode> = {}
		for (const node of nodes) {
			result[node.alias] = result[node.alias] ? GraphQlQueryAstFactory.mergeFields(result[node.alias], node) : node
		}
		return Object.values(result)
	}

	private static mergeFields(left: AnyNode, right: AnyNode): AnyNode {
		if (left.constructor !== right.constructor) {
			throw new Error(`GraphQlQueryAstFactory: cannot merge ${left.constructor.name} and ${right.constructor.name}`)
		}
		if (left.name !== right.name) {
			throw new Error(`GraphQlQueryAstFactory: incompatible fields ${left.name} and ${right.name}`)
		}
		if (left instanceof ObjectNode && right instanceof ObjectNode) {
			if (!isDeepStrictEqual(left.args, right.args)) {
				throw new Error(`GraphQlQueryAstFactory: incompatible args`)
			}
			const fields = GraphQlQueryAstFactory.mergeFieldList([...left.fields, ...right.fields])
			return new ObjectNode(left.name, left.alias, fields, left.args, left.extensions, left.path)
		}
		return left
	}
}
