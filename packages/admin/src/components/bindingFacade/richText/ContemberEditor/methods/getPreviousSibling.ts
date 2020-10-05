import { Node as SlateNode, NodeEntry, Path as SlatePath } from 'slate'
import { BaseEditor } from '../../baseEditor'

export const getPreviousSibling = <
	E extends BaseEditor = BaseEditor,
	CurrentNode extends SlateNode = SlateNode,
	PreviousNode extends SlateNode = CurrentNode
>(
	editor: E,
	node: CurrentNode,
	nodePath: SlatePath,
): NodeEntry<PreviousNode> | undefined => {
	const lastPathIndex = nodePath[nodePath.length - 1]
	if (lastPathIndex === 0) {
		return undefined
	}
	const previousPath = nodePath.slice(0, -1).concat(lastPathIndex - 1)
	return [SlateNode.get(editor, previousPath) as PreviousNode, previousPath]
}
