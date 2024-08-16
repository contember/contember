import { Editor as SlateEditor, Text as SlateText } from 'slate'

export const canToggleMark = <T extends SlateText, E extends SlateEditor>(
	editor: E,
	markName: string,
	markValue: unknown = true,
) => {
	return editor.canToggleMarks({ [markName]: markValue })
}
