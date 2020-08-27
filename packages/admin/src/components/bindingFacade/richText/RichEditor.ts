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
	highlightToolbarButton,
	italicToolbarButton,
	orderedListToolbarButton,
	scrollTargetToolbarButton,
	strikeThroughToolbarButton,
	underlineToolbarButton,
	unorderedListToolbarButton,
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
		orderedList: orderedListToolbarButton,
		scrollTarget: scrollTargetToolbarButton,
		unorderedList: unorderedListToolbarButton,

		bold: boldToolbarButton,
		code: codeToolbarButton,
		highlight: highlightToolbarButton,
		italic: italicToolbarButton,
		strikeThrough: strikeThroughToolbarButton,
		underline: underlineToolbarButton,
	}
}
