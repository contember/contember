import { ElementToolbarButton } from '../../../toolbars'
import { HeadingElement, headingElementType } from './HeadingElement'

export const headingOneToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading1',
	label: 'Heading level 1',
	title: 'Heading level 1',
	suchThat: { level: 1 },
}

export const headingTwoToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading2',
	label: 'Heading level 2',
	title: 'Heading level 2',
	suchThat: { level: 2 },
}

export const headingThreeToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading3',
	label: 'Heading level 3',
	title: 'Heading level 3',
	suchThat: { level: 3 }, // TODO
}

export const headingFourToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading4',
	label: 'Heading level 4',
	title: 'Heading level 4',
	suchThat: { level: 4 }, // TODO
}

export const headingFiveToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading5',
	label: 'Heading level 5',
	title: 'Heading level 5',
	suchThat: { level: 5 }, // TODO
}

export const headingSixToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	contemberIcon: 'heading6',
	label: 'Heading level 6',
	title: 'Heading level 6',
	suchThat: { level: 6 }, // TODO
}
