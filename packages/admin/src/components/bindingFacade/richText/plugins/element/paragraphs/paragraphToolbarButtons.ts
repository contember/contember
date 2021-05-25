import type { ElementToolbarButton } from '../../../toolbars'
import { ParagraphElement, paragraphElementType } from './ParagraphElement'

export const paragraphToolbarButton: ElementToolbarButton<ParagraphElement> = {
	elementType: paragraphElementType,
	blueprintIcon: 'paragraph',
	label: 'Paragraph',
	title: 'Paragraph',
	suchThat: { isNumbered: false },
}

export const paragraphNumberedToolbarButton: ElementToolbarButton<ParagraphElement> = {
	elementType: paragraphElementType,
	contemberIcon: 'paragraphNumbered',
	label: 'Numbered paragraph',
	title: 'Numbered paragraph',
	suchThat: { isNumbered: true },
}
