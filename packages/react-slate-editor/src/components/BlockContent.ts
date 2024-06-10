import { useEditorBlockElement } from '../contexts'

export interface ContentOutletProps {
}

/**
 * Marker for Content in Block Editor blocks
 *
 * This is deliberately not a Contember Component!
 *
 * @group Block Editor
 */
export const BlockContent = (props: ContentOutletProps) => {
	return useEditorBlockElement().children
}
