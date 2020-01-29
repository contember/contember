import { BaseEditor } from '../essentials'

export interface AnchorElement {
	type: 'anchor'
	href: string
	children: BaseEditor['children']
}
