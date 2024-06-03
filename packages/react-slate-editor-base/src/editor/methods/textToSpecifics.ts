import { Text as SlateText } from 'slate'
import { TextSpecifics } from '../../types/editor'

export const textToSpecifics = <Text extends SlateText = SlateText>(textNode: Text): TextSpecifics<Text> => {
	const { text, ...specifics } = textNode
	return specifics
}
