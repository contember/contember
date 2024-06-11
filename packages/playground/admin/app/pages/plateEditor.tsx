import { Binding, PersistButton } from '@app/lib/binding'
import { Slots } from '@app/lib/layout/slots'
import * as React from 'react'
import { EntitySubTree, useField } from '@contember/interface'
import { Button } from '@app/lib/ui/button'
import { PlateEditor } from '@app/lib-extra/plate-editor/plate-editor'

export default () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'PlateEditorContent(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<PlateEditor field="data">

			</PlateEditor>
			<PlateJson />
			<PasteSample />
		</EntitySubTree>
	</Binding>
</>


const PlateJson = () => {
	const data = useField('data')

	return (
		<pre className="bg-gray-800 text-white p-4">
			{JSON.stringify(data.value, null, 2)}
		</pre>
	)
}


const PasteSample = () => {
	const data = useField('data')
	return <Button onClick={() => {
		data.updateValue({
			'children': [
				{
					'type': 'p',
					'children': [
						{
							'text': 'Lorem ipsum',
						},
					],
				},
			],
		})
	}}>Paste sample data</Button>
}
