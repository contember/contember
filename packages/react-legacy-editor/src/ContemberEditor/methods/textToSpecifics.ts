import type { TextSpecifics } from '../../baseEditor'
import { Text as SlateText } from 'slate'

export const textToSpecifics = <Text extends SlateText = SlateText>(textNode: Text): TextSpecifics<Text> => {
	const { text, ...specifics } = textNode
	return specifics
}
