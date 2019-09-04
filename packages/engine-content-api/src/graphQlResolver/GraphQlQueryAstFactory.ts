import { isIt } from '@contember/utils'
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
import FieldNode from './FieldNode'
import ObjectNode from './ObjectNode'
import { getArgumentValues } from 'graphql/execution/values'

type NodeFilter = (node: GraphQlFieldNode, path: string[]) => boolean
export default class GraphQlQueryAstFactory {
	constructor(private readonly argumentValuesResolver: typeof getArgumentValues) {}

	public create<Args = any>(info: GraphQLResolveInfo, filter?: NodeFilter): ObjectNode<Args> {
		const node = this.mergeAllFieldNodes(info.fieldNodes)
		const parentType = info.parentType
		if (!this.itIs<GraphQLObjectType>(parentType, 'GraphQLObjectType')) {
			throw new Error(this.getValueType(parentType))
		}

		return this.createFromNode(info, parentType as GraphQLObjectType, node, [], filter || (() => true)) as ObjectNode
	}

	private mergeAllFieldNodes(fieldNodes: ReadonlyArray<GraphQlFieldNode>): GraphQlFieldNode {
		const newGraphQlFieldNodes = [...fieldNodes]
		while (newGraphQlFieldNodes.length > 1) {
			newGraphQlFieldNodes.push(
				this.mergeFieldNodes(
					newGraphQlFieldNodes.pop() as GraphQlFieldNode,
					newGraphQlFieldNodes.pop() as GraphQlFieldNode,
				),
			)
		}
		return newGraphQlFieldNodes[0]
	}

	private mergeFieldNodes(dest: GraphQlFieldNode, src: GraphQlFieldNode): GraphQlFieldNode {
		return {
			...dest,
			selectionSet: {
				...(dest.selectionSet as SelectionSetNode),
				selections: [
					...(dest.selectionSet ? dest.selectionSet.selections : []),
					...(src.selectionSet ? src.selectionSet.selections : []),
				],
			},
		}
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
		const resolvedType = this.resolveObjectType(type)

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
					throw new Error(`Fragment definition ${subNode.name.value} not found`)
				}
				const typeName = fragmentDefinition.typeCondition.name.value
				const subField = info.schema.getType(typeName)
				if (!this.itIs<GraphQLObjectType>(subField, 'GraphQLObjectType')) {
					throw new Error()
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

	private resolveObjectType(type: GraphQLOutputType): GraphQLObjectType {
		if (this.itIs<GraphQLObjectType>(type, 'GraphQLObjectType')) {
			return type
		}
		if (this.itIs<GraphQLList<any>>(type, 'GraphQLList')) {
			return this.resolveObjectType(type.ofType)
		}
		if (this.itIs<GraphQLNonNull<any>>(type, 'GraphQLNonNull')) {
			return this.resolveObjectType(type.ofType)
		}
		throw new Error(this.getValueType(type))
	}

	private getValueType(val: any): string {
		if (typeof val === 'object' && val.constructor) {
			return 'Object of type ' + val.constructor.name + ' is not supported'
		}
		return typeof val + ' is not supported'
	}

	private itIs<T>(val: any, name: string): val is T {
		return typeof val === 'object' && val.constructor && val.constructor.name === name
	}
}
