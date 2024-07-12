import { Editor, Element, Path } from 'slate'
import { FunctionComponent, ReactNode } from 'react'
import { RenderElementProps, RenderLeafProps } from 'slate-react'
import { Environment } from '@contember/react-binding'
import { EntityAccessor } from '@contember/binding'

export type EditorPluginWrapperProps = { children?: ReactNode, editor: Editor };
export type EditorPlugin = ((editor: Editor) => void) | {
	extendEditor?: (args: { editor: Editor, children: ReactNode, environment: Environment, entity: EntityAccessor }) => void
	OuterWrapper?: FunctionComponent<EditorPluginWrapperProps>
	InnerWrapper?: FunctionComponent<EditorPluginWrapperProps>
	staticRender?: (props: { children?: ReactNode }, environment: Environment) => ReactNode
}


export type ElementRenderer<T extends Element> = FunctionComponent<RenderElementProps & { element: T }>

export interface EditorElementPlugin<T extends Element> {
	type: T['type']
	render: ElementRenderer<T>
	normalizeNode?: (args: { element: T, path: Path, editor: Editor, preventDefault: () => void }) => void
	isActive?: (args: { editor: Editor, suchThat?: Partial<T> }) => boolean
	isInline?: boolean
	isVoid?: boolean | ((args: { element: T, editor: Editor }) => boolean)
	canContainAnyBlocks?: boolean
	toggleElement?: (args: { editor: Editor, suchThat?: Partial<T> }) => void
	acceptsAttributes?: (args: { editor: Editor, suchThat: Partial<T> }) => boolean
}


export interface EditorMarkPlugin {
	type: string
	isHotKey: (e: KeyboardEvent) => boolean
	render: FunctionComponent<RenderLeafProps>
}
