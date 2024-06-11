import { Component, EntitySubTree, Field, SugaredRelativeSingleField, useField } from '@contember/interface'
import { Binding, PersistButton } from '../../lib/components/binding'
import * as React from 'react'
import { Slots } from '../../lib/components/slots'
import { Button } from '../../lib/components/ui/button'

export const input = () => (
	<Binding>
		<Slots.Actions><PersistButton/></Slots.Actions>
		<EntitySubTree entity={'InputRoot(unique=unique)'} setOnCreate={'(unique=unique)'}>
			<UseFieldComponent field={'intValue'}/>
		</EntitySubTree>
	</Binding>
)

type MyComponentProps = {
	field: SugaredRelativeSingleField['field']
}

const UseFieldComponent = Component<MyComponentProps>(
	({ field }) => {
		// The `useField` hook is used to get and update the field value from data-binding.
		const { value, updateValue } = useField<number>(field)
		const increment = () => updateValue((value ?? 0) + 1)
		const decrement = () => updateValue((value ?? 0) - 1)

		return (
			<div className={'flex gap-4 items-center'}>
				<Button onClick={decrement}>Decrement</Button>
				<div className={'w-8 h-8 border flex justify-center items-center'}>
					<div>{value}</div>
				</div>
				<Button onClick={increment}>Increment</Button>
			</div>
		)
	},
	// When using hooks in the render function above, specify `staticRender` as the second argument to `Component` to ensure all data is properly registered.
	({ field }) => (
		<Field field={field}/>
	),
)
