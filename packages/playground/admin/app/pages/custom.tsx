import { Component, EntitySubTree, Field, SugaredRelativeSingleField, useField } from '@contember/interface'
import { PencilIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Binding, PersistButton } from '~/lib/binding'
import { Slots } from '~/lib/layout'
import { Button } from '~/lib/ui/button'

export const Input = () => (
	<Binding>
		<Slots.Title>
			<Title icon={<PencilIcon />}>Custom Input</Title>
		</Slots.Title>

		<Slots.Actions>
			<PersistButton/>
		</Slots.Actions>

		<EntitySubTree entity="InputRoot(unique = unique)" setOnCreate="(unique = unique)">
			<UseFieldComponent field="intValue"/>
		</EntitySubTree>
	</Binding>
)

interface MyComponentProps {
	field: SugaredRelativeSingleField['field']
}

const UseFieldComponent = Component<MyComponentProps>(
	({ field: fieldName }) => {
		// The `useField` hook is used to get and update the field value from data-binding.
		const field = useField<number>(fieldName)
		const increment = () => field.updateValue((field.value ?? 0) + 1)
		const decrement = () => field.updateValue((field.value ?? 0) - 1)

		return (
			<div className="flex gap-4 items-center">
				<Button onClick={decrement}>Decrement</Button>
				<div className={'w-8 h-8 border flex justify-center items-center'}>
					<div>{field.value}</div>
				</div>
				<Button onClick={increment}>Increment</Button>
			</div>
		)
	},
	// When using hooks in the render function above, specify `staticRender` as the second argument to `Component` to ensure all data is properly registered.
	({ field }) => (
		<Field field={field} />
	),
)
