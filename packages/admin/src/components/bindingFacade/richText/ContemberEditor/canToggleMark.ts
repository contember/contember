import { BaseEditor, TextNode } from '../baseEditor'

export const canToggleMark = <T extends TextNode, E extends BaseEditor>(
	editor: E,
	markName: string,
	markValue: unknown = true,
) => {
	return editor.canToggleMarks({ [markName]: markValue })
}
