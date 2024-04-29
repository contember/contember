import { Binding, PersistButton } from '../../lib/components/binding'
import { Slots } from '../../lib/components/slots'
import { InputField } from '../../lib/components/form'
import * as React from 'react'
import { EntitySubTree, useField } from '@contember/interface'
import { PlateEditor } from '../../lib/components/richt-text-editor/plate-editor'
import { Button } from '../../lib/components/ui/button'

export default () => <>
	<Binding>
		<Slots.Actions>
			<PersistButton />
		</Slots.Actions>
		<EntitySubTree entity={'EditorContent(unique=unique)'} setOnCreate={'(unique=unique)'}>
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
