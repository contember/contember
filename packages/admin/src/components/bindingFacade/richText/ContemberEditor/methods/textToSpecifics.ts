import type { TextNode, TextSpecifics } from '../../baseEditor'

export const textToSpecifics = <Text extends TextNode = TextNode>(textNode: Text): TextSpecifics<Text> => {
	const { text, ...specifics } = textNode
	return specifics
}
