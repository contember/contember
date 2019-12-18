import * as slate from 'slate'
import { Block, BlockJSON, Document, Inline, Node as SlateNode, NodeJSON, Text } from 'slate'
import * as Immutable from 'immutable'

export default class JsonBlockSerializer {
	serialize(block: Block): string {
		const jsonBlock = (block as Block & { toJSON: (options?: Record<string, any>) => BlockJSON }).toJSON({
			preserveKeys: true,
		})
		return JSON.stringify(jsonBlock.nodes)
	}

	deserialize(str: string): Immutable.List<Block | Text | Inline> {
		const Node = ((slate as any).Node as unknown) as SlateNode & {
			createList: (_: Array<NodeJSON>) => Immutable.List<SlateNode>
		}
		try {
			const nodes = JSON.parse(str)
			return Node.createList(nodes)
				.filter(node => !Document.isDocument(node))
				.toList() as Immutable.List<Block | Text | Inline>
		} catch (e) {
			return Node.createList([]) as Immutable.List<never>
		}
	}
}
