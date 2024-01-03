export type RichTextReference =
	& {
		id: string
		type: string
	}
	& Record<string, unknown>
