import { Button, Component, Field, HasMany, HasOne, useEntity } from '@contember/admin'
import { useCallback } from 'react'

interface AddContentProps {
	field: string
}

export const AddContent = Component<AddContentProps>(
	({ field }) => {
		const content = useEntity(field)

		const addContent = useCallback(() => {
			const maxOrder = Array.from(content.getEntityList('blocks')).map(it => it.getField<number>('order').value ?? 0).reduce((a, b) => Math.max(a, b), -1)
			content.getEntityList('blocks').createNewEntity(getAccessor => {
				getAccessor().getField('json').updateValue(JSON.stringify({ 'formatVersion': 1, 'children': [{ 'type': 'paragraph', 'children': [{ 'text': 'Hi!' }] }] }))
				getAccessor().getField('order').updateValue(maxOrder + 1)
			})
		}, [content])

		const addQuote = useCallback(() => {
			const maxOrder = Array.from(content.getEntityList('blocks')).map(it => it.getField<number>('order').value ?? 0).reduce((a, b) => Math.max(a, b), -1)
			content.getEntityList('blocks').createNewEntity(getAccessor => {
				let refId: string|null = null
				getAccessor().getEntityList('references').createNewEntity(getAccessor => {
					getAccessor().getField('id').asUuid.setToUuid()
					refId = getAccessor().getField<string>('id').value!
					getAccessor().getField('type').updateValue('quote')
					getAccessor().getField('primaryText').updateValue('A')
					getAccessor().getField('secondaryText').updateValue('B')
				})
				getAccessor().getField('json').updateValue(JSON.stringify({ 'formatVersion': 1, 'children': [{ 'type': 'reference', 'children': [{ 'text': 'Quote!' }], 'referenceId': refId }] }))
				getAccessor().getField('order').updateValue(maxOrder + 1)
			})
		}, [content])

		return (
			<>
				<details>
					<summary>JSON ({content.getEntityList('blocks').length} children)</summary>
					<HasOne field={field}>
						<HasMany field="blocks">
							<p><Field field="order" />: <code><Field field="json" /></code></p>
						</HasMany>
					</HasOne>
				</details>

				<Button onClick={addContent}>
					Add content
				</Button>
				<Button onClick={addQuote}>
					Add quote
				</Button>
			</>
		)
	},
	({ field }) => (
		<HasOne field={field}>
			<HasMany field="blocks">
				<Field field="json" />
			</HasMany>
		</HasOne>
	),
	'AddContent',
)


