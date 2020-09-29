import { BaseEditor, ElementNode, SerializableEditorNode } from '../../baseEditor'

export const toLatestFormat = <E extends BaseEditor>(
	editor: E,
	potentiallyOldNode: SerializableEditorNode,
): SerializableEditorNode => {
	if (potentiallyOldNode.formatVersion === editor.formatVersion) {
		return potentiallyOldNode
	}
	if (potentiallyOldNode.formatVersion > editor.formatVersion) {
		// Boy oh boy, do we have a situation…
		return potentiallyOldNode // Just hope it's at least somewhat backwards compatible.
	}
	for (let formatNumber = potentiallyOldNode.formatVersion; formatNumber < editor.formatVersion; formatNumber++) {
		potentiallyOldNode = {
			formatVersion: formatNumber + 1,
			children: potentiallyOldNode.children.map(oldChild =>
				editor.upgradeFormatBySingleVersion(oldChild, formatNumber),
			) as ElementNode[],
		}
	}
	return potentiallyOldNode
}
