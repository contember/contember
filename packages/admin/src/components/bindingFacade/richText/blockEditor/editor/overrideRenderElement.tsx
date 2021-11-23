import { Editor, Element } from 'slate'
import { ReferenceElementWrapper } from '../references/ReferenceElementWrapper'
import { isElementWithReference } from '../elements'
import { ErrorBoundary } from 'react-error-boundary'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { SortableRepeaterItem, SortableRepeaterItemHandle } from '../../../collections'
import { DragHandle } from '../../../../ui'
import { EditorBlock } from '@contember/ui'
import { ReactNode, useContext } from 'react'
import { SortedBlocksContext } from '../state/SortedBlocksContext'


export const overrideRenderElement = (editor: Editor) => {
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

const SortableBlock = ({ children, element }: { children: ReactNode, element: Element }) => {
	const editor = useSlateStatic()
	// intentionally passing through the context, so it redraws on order change
	const sortedBlocks = useContext(SortedBlocksContext)
	// intentionally finding path again and not passing from renderElement, because it might have changed
	const [index] = ReactEditor.findPath(editor, element)
	return (
		<SortableRepeaterItem index={index} key={sortedBlocks[index]?.id}>
			<EditorBlock dragHandle={<SortableRepeaterItemHandle><DragHandle /></SortableRepeaterItemHandle>}>
				{children}
			</EditorBlock>
		</SortableRepeaterItem>
	)
}
