import { Editor, Element, Path } from 'slate'
import { FunctionComponent } from 'react'
import { RenderElementProps } from 'slate-react'
import { ElementSpecifics } from './Node'

export interface CustomElementPlugin<T extends Element> {
	type: T['type']
	render: FunctionComponent<Omit<RenderElementProps, 'element'> & { element: T }>
	normalizeNode?: (args: { element: T, path: Path, editor: Editor }) => void | true
	isActive?: (args: { editor: Editor, suchThat?: ElementSpecifics<T> }) => boolean
	canContainAnyBlocks: boolean
	toggleElement?: (args: { editor: Editor, suchThat?: ElementSpecifics<T> }) => void
}
