import type { ElementToolbarButton } from '../../../toolbars'
import { HeadingElement, headingElementType } from './HeadingElement'

export const headingOneToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading1',
	label: 'Heading level 1',
	title: 'Heading level 1',
	suchThat: { level: 1, isNumbered: false },
}

export const headingOneNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading1Numbered',
	label: 'Numbered heading level 1',
	title: 'Numbered heading level 1',
	suchThat: { level: 1, isNumbered: true },
}

export const headingTwoToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading2',
	label: 'Heading level 2',
	title: 'Heading level 2',
	suchThat: { level: 2, isNumbered: false },
}

export const headingTwoNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading2Numbered',
	label: 'Numbered heading level 2',
	title: 'Numbered heading level 2',
	suchThat: { level: 2, isNumbered: true },
}

export const headingThreeToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading3',
	label: 'Heading level 3',
	title: 'Heading level 3',
	suchThat: { level: 3, isNumbered: false },
}

export const headingThreeNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading3Numbered',
	label: 'Numbered heading level 3',
	title: 'Numbered heading level 3',
	suchThat: { level: 3, isNumbered: true },
}

export const headingFourToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading4',
	label: 'Heading level 4',
	title: 'Heading level 4',
	suchThat: { level: 4, isNumbered: false },
}

export const headingFourNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading4Numbered',
	label: 'Numbered heading level 4',
	title: 'Numbered heading level 4',
	suchThat: { level: 4, isNumbered: true },
}

export const headingFiveToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading5',
	label: 'Heading level 5',
	title: 'Heading level 5',
	suchThat: { level: 5, isNumbered: false },
}

export const headingFiveNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading5Numbered',
	label: 'Numbered heading level 5',
	title: 'Numbered heading level 5',
	suchThat: { level: 5, isNumbered: true },
}

export const headingSixToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading6',
	label: 'Heading level 6',
	title: 'Heading level 6',
	suchThat: { level: 6, isNumbered: false },
}

export const headingSixNumberedToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading6Numbered',
	label: 'Numbered heading level 6',
	title: 'Numbered heading level 6',
	suchThat: { level: 6, isNumbered: true },
}
