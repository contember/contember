import { createEditorWithEssentials } from '../baseEditor'
import { Editor } from 'slate'


export interface CreateEditorPublicOptions {
	plugins?: ((baseEditor: Editor) => Editor | void)[]
}

export interface CreateEditorOptions extends CreateEditorPublicOptions {
	defaultElementType: string
}

export const createEditor = ({
	plugins = [],
	defaultElementType,
}: CreateEditorOptions) => {
	const editor = createEditorWithEssentials(defaultElementType)
	return initializeEditor({ editor, plugins })
}


export const initializeEditor = ({
	editor,
	plugins = [],
}: CreateEditorPublicOptions & {editor: Editor}): Editor => {
	return plugins.reduce((editor, plugin) => plugin(editor) ?? editor, editor)
}
