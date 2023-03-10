import { ActionsDefinition as actions, SchemaDefinition as def } from '@contember/schema-definition'

@actions.watch({
	name: 'foo_watch',
	watch: `
		value	
	`,
	webhook: 'http://{{base_domain}}/hook',
})
export class Foo {
	value = def.stringColumn()
}
