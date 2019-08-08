import { Block, Inline, Text, Node as SlateNode, Document, NodeJSON, BlockJSON } from 'slate'
import * as slate from 'slate'
import * as Immutable from 'immutable'

export default class JsonBlockSerializer {
	serialize(block: Block): string {
		const jsonBlock = (block as Block & { toJSON: (options?: Object) => BlockJSON }).toJSON({ preserveKeys: true })
		return JSON.stringify(jsonBlock.nodes)
	}

	deserialize(str: string): Immutable.List<Block | Text | Inline> {
		const nodes = JSON.parse(str)
		// @ts-ignore
		return ((slate.Node as unknown) as SlateNode & { createList: (_: Array<NodeJSON>) => Immutable.List<SlateNode> })
			.createList(nodes)
			.filter(node => !Document.isDocument(node))
			.toList() as Immutable.List<Block | Text | Inline>
	}
}
