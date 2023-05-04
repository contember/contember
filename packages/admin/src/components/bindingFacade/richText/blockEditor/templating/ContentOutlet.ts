import { BindingError } from '@contember/binding'

export interface ContentOutletProps {
	placeholder?: string
}

/**
 * Marker for Content in Block Editor blocks
 *
 * This is deliberately not a Contember Component!
 *
 * @group Block Editor
 */
export const ContentOutlet = (props: ContentOutletProps) => {
	throw new BindingError(
		`BlockEditor.ContentOutlet may only appear as an immediate child of a block!\n\n` +
			`This may also happen when you change the code of your block to newly contain a ContentOutlet. ` +
			`Such change is generally ill-advised because there can already be data in your database that would be ` +
			`inconsistent with the new code.`,
	)
}
