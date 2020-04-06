import {
	anchorToolbarButton,
	boldToolbarButton,
	codeToolbarButton,
	headingFiveToolbarButton,
	headingFourToolbarButton,
	headingOneToolbarButton,
	headingSixToolbarButton,
	headingThreeToolbarButton,
	headingTwoToolbarButton,
	italicToolbarButton,
	strikeThroughToolbarButton,
	underlineToolbarButton,
} from './plugins'

export namespace RichEditor {
	export const buttons = {
		anchor: anchorToolbarButton,
		headingOne: headingOneToolbarButton,
		headingTwo: headingTwoToolbarButton,
		headingThree: headingThreeToolbarButton,
		headingFour: headingFourToolbarButton,
		headingFive: headingFiveToolbarButton,
		headingSix: headingSixToolbarButton,

		bold: boldToolbarButton,
		code: codeToolbarButton,
		italic: italicToolbarButton,
		strikeThrough: strikeThroughToolbarButton,
		underline: underlineToolbarButton,
	}
}
