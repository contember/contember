import { EditorWithAnchors } from '../plugins/anchors'
import { EditorWithBasicFormatting } from '../plugins/basicFormatting'
import { EditorNode, EditorWithEssentials } from '../plugins/essentials'

export type HoveringToolbarEditor = EditorWithAnchors<EditorWithBasicFormatting<EditorWithEssentials<EditorNode>>>
