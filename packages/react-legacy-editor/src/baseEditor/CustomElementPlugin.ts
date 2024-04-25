import { Editor, Element, Path } from 'slate'
import { FunctionComponent } from 'react'
import { RenderElementProps } from 'slate-react'

export interface CustomElementPlugin<T extends Element> {
	type: T['type']
	render: FunctionComponent<Omit<RenderElementProps, 'element'> & { element: T }>
	normalizeNode?: (args: { element: T, path: Path, editor: Editor, preventDefault: () => void }) => void
	isActive?: (args: { editor: Editor, suchThat?: Partial<T> }) => boolean
	isInline?: boolean
	isVoid?: boolean | ((args: { element: T, editor: Editor }) => boolean)
	canContainAnyBlocks?: boolean
	toggleElement?: (args: { editor: Editor, suchThat?: Partial<T> }) => void
	acceptsAttributes?: (args: { editor: Editor, suchThat: Partial<T> }) => boolean
}
