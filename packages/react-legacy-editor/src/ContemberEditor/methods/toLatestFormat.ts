import { BindingError } from '@contember/react-binding'
import type { SerializableEditorNode } from '../../baseEditor'
import { Editor as SlateEditor, Element as SlateElement } from 'slate'

export const toLatestFormat = <E extends SlateEditor>(
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
	let formatNumber = potentiallyOldNode.formatVersion
	try {
		for (; formatNumber < editor.formatVersion; formatNumber++) {
			potentiallyOldNode = {
				formatVersion: formatNumber + 1,
				children: potentiallyOldNode.children.map(oldChild =>
					editor.upgradeFormatBySingleVersion(oldChild, formatNumber),
				) as SlateElement[],
			}
		}
		return potentiallyOldNode
	} catch (e) {
		const genericMessage = `Failed to upgrade editor format from version ${formatNumber}.`
		if (e instanceof RangeError) {
			throw new BindingError(
				`${genericMessage}\nDetected a stack overflow. ` +
					`Perhaps you incorrectly implemented 'upgradeFormatBySingleVersion'?`,
			)
		}
		throw new BindingError(genericMessage)
	}
}
