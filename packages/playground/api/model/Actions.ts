import { c } from '@contember/schema-definition'

@c.Watch({
	name: 'ActionsEntry',
	watch: 'value',
	webhook: {
		url: '{{url}}/webhook',
	},
})
export class ActionsEntry {
	value = c.stringColumn()
}
