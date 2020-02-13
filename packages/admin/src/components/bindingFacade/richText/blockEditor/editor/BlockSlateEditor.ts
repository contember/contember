import { BaseEditor, EditorWithAnchors, EditorWithBasicFormatting, EditorWithParagraphs } from '../../plugins'

export type BlockSlateEditor = EditorWithParagraphs<EditorWithAnchors<EditorWithBasicFormatting<BaseEditor>>>
