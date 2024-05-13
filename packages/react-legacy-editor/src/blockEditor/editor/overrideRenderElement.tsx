import { Editor } from 'slate'
import { ReferenceElementWrapper } from '../references/ReferenceElementWrapper'
import { isElementWithReference } from '../elements'
import { ErrorBoundary } from 'react-error-boundary'
import { ReactEditor } from 'slate-react'
import { ComponentType, ReactNode } from 'react'
import { EditorElement } from '../../slate-types'


export interface OverrideRenderElementOptions {
	renderSortableBlock: ComponentType<{ children: ReactNode, element: EditorElement }>
}

export const overrideRenderElement = (editor: Editor, { renderSortableBlock: SortableBlock }: OverrideRenderElementOptions) => {
	const { renderElement } = editor

	editor.renderElement = props => {
		let children = renderElement(props)
		const path = ReactEditor.findPath(editor, props.element)
		if (isElementWithReference(props.element)) {
			children = (
				<ErrorBoundary fallback={<span style={{ background: 'red', color: 'white' }}>Invalid element</span>}>
					<ReferenceElementWrapper element={props.element}>{children}</ReferenceElementWrapper>
				</ErrorBoundary>
			)
		}
		if (path.length === 1) {
			return <SortableBlock element={props.element}>{children}</SortableBlock>
		}
		return children
	}
}
