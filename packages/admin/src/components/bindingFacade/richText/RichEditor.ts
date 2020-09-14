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
	horizontalRuleToolbarButton,
	italicToolbarButton,
	orderedListToolbarButton,
	scrollTargetToolbarButton,
	strikeThroughToolbarButton,
	tableToolbarButton,
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
		horizontalRule: horizontalRuleToolbarButton,
		orderedList: orderedListToolbarButton,
		scrollTarget: scrollTargetToolbarButton,
		unorderedList: unorderedListToolbarButton,
		table: tableToolbarButton,

		bold: boldToolbarButton,
		code: codeToolbarButton,
		highlight: highlightToolbarButton,
		italic: italicToolbarButton,
		strikeThrough: strikeThroughToolbarButton,
		underline: underlineToolbarButton,
	}
}
