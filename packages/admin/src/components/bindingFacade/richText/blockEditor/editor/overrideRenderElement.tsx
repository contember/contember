import { Editor } from 'slate'
import { ReferenceElementWrapper } from '../references/ReferenceElementWrapper'
import { isElementWithReference } from '../elements'
import { ErrorBoundary } from 'react-error-boundary'

export const overrideRenderElement = (editor: Editor) => {
	const { renderElement } = editor

	editor.renderElement = props => {
		const children = renderElement(props)
		if (isElementWithReference(props.element)) {
			return <ErrorBoundary fallback={<span style={{ background: 'red', color: 'white' }}>Invalid element</span>}>
				<ReferenceElementWrapper element={props.element}>{children}</ReferenceElementWrapper>
			</ErrorBoundary>
		}
		return children
	}
}
