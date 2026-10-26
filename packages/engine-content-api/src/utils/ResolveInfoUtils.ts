import { FieldNode as GraphQlFieldNode, SelectionSetNode } from 'graphql'

export class ResolveInfoUtils {
	public static extractFieldNode(info: { readonly fieldNodes: readonly GraphQlFieldNode[] }): GraphQlFieldNode {
		const newGraphQlFieldNodes = [...info.fieldNodes]
		while (newGraphQlFieldNodes.length > 1) {
			newGraphQlFieldNodes.push(
				ResolveInfoUtils.mergeFieldNodes(
					newGraphQlFieldNodes.pop() as GraphQlFieldNode,
					newGraphQlFieldNodes.pop() as GraphQlFieldNode,
				),
			)
		}
		return newGraphQlFieldNodes[0]
	}

	private static mergeFieldNodes(dest: GraphQlFieldNode, src: GraphQlFieldNode): GraphQlFieldNode {
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
}
