import { FieldNode as GraphQlFieldNode, Kind, SelectionSetNode } from 'graphql'
import { getArgumentValues, InterfaceType, ObjectType, ResolveInfo, ScalarMap, Schema, TypeKind } from '@contember/graphql-json'
import { FieldNode, ObjectNode } from '../inputProcessing/index.js'
import { GraphQlQueryAstFactory, NodeFilter } from '../resolvers/GraphQlQueryAstFactory.js'
import { ResolveInfoUtils } from '../utils/index.js'
import { FieldExtensions } from './JsonTypeRegistry.js'

type AnyNode = ObjectNode | FieldNode

/**
 * JSON-schema counterpart of `GraphQlQueryAstFactory`: turns the resolved field into Contember's query tree.
 * The schema comes from the resolve info, so one factory serves every role schema of a model.
 */
export class JsonQueryAstFactory {
	constructor(
		private readonly scalars: ScalarMap,
		private readonly extensions: Record<string, Record<string, FieldExtensions>>,
	) {}

	public create<Args = any>(info: ResolveInfo, filter?: NodeFilter): ObjectNode<Args> {
		const node = ResolveInfoUtils.extractFieldNode(info)
		const result = this.createFromNode(info, info.parentType, node, [], filter ?? (() => true))
		if (!(result instanceof ObjectNode)) {
			throw new Error(`JsonQueryAstFactory: field ${info.parentType}.${info.fieldName} has no selection`)
		}
		return result
	}

	private createFromNode(
		info: ResolveInfo,
		parentTypeName: string,
		node: GraphQlFieldNode,
		path: string[],
		filter: NodeFilter,
	): AnyNode | null {
		if (!filter(node, path)) {
			return null
		}
		const name = node.name.value
		const alias = node.alias ? node.alias.value : name
		if (!node.selectionSet) {
			return new FieldNode(name, alias, {})
		}
		const field = this.getCompositeType(info.schema, parentTypeName)[1][name]
		if (!field) {
			throw new Error(`JsonQueryAstFactory: unknown field ${parentTypeName}.${name}`)
		}
		const fieldTypeName = field[0][1]
		const fieldType = info.schema.t[fieldTypeName]
		if (!fieldType || fieldType[0] !== TypeKind.OBJECT) {
			throw new Error(`JsonQueryAstFactory: ${fieldTypeName} is not an object type`)
		}
		const fields = this.processSelectionSet(info, fieldTypeName, node.selectionSet, [...path, alias], filter)
		return new ObjectNode(
			name,
			alias,
			fields,
			getArgumentValues(info.schema, field, node, info.variableValues, this.scalars),
			this.extensions[parentTypeName]?.[name] ?? {},
			path,
		)
	}

	private processSelectionSet(
		info: ResolveInfo,
		parentTypeName: string,
		selectionSet: SelectionSetNode,
		path: string[],
		filter: NodeFilter,
	): AnyNode[] {
		const fields: AnyNode[] = []
		for (const subNode of selectionSet.selections) {
			if (subNode.kind === Kind.FIELD) {
				const field = this.createFromNode(info, parentTypeName, subNode, path, filter)
				if (field !== null) {
					fields.push(field)
				}
			} else if (subNode.kind === Kind.FRAGMENT_SPREAD) {
				const fragmentDefinition = info.fragments[subNode.name.value]
				if (!fragmentDefinition) {
					throw new Error(`JsonQueryAstFactory: Fragment definition ${subNode.name.value} not found`)
				}
				const typeName = fragmentDefinition.typeCondition.name.value
				this.getCompositeType(info.schema, typeName)
				fields.push(...this.processSelectionSet(info, typeName, fragmentDefinition.selectionSet, path, filter))
			} else {
				throw new Error('InlineFragment are not supported yet')
			}
		}
		return GraphQlQueryAstFactory.mergeFieldList(fields)
	}

	private getCompositeType(schema: Schema, typeName: string): ObjectType | InterfaceType {
		const type = schema.t[typeName]
		if (!type || (type[0] !== TypeKind.OBJECT && type[0] !== TypeKind.INTERFACE)) {
			throw new Error('JsonQueryAstFactory: subfield is expected to be an object or interface type')
		}
		return type
	}
}
