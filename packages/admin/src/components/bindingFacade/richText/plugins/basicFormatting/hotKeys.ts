import isHotkey from 'is-hotkey'
import { RichTextBooleanMarkNames } from './RichTextNode'

export const hotKeys: {
	[key in RichTextBooleanMarkNames]: (event: KeyboardEvent) => boolean
} = {
	isBold: isHotkey('mod+b'),
	isCode: isHotkey('mod+`'),
	isItalic: isHotkey('mod+i'),
	isStruckThrough: isHotkey('mod+opt+s'),
	isUnderlined: isHotkey('mod+u'),
}
