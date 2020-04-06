import { ElementToolbarButton } from '../../../toolbars'
import { HeadingElement, headingElementType } from './HeadingElement'

export const headingOneToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header-one',
	suchThat: { level: 1 },
}

export const headingTwoToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header-two',
	suchThat: { level: 2 },
}

export const headingThreeToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header',
	suchThat: { level: 3 }, // TODO
}

export const headingFourToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header',
	suchThat: { level: 4 }, // TODO
}

export const headingFiveToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header',
	suchThat: { level: 5 }, // TODO
}

export const headingSixToolbarButton: ElementToolbarButton<HeadingElement> = {
	elementType: headingElementType,
	blueprintIcon: 'header',
	suchThat: { level: 6 }, // TODO
}
