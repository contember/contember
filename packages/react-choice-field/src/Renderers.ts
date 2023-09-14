import { EntityAccessor, ErrorAccessor } from '@contember/react-binding'
import { ChoiceFieldOptions, ChoiceFieldSingleOption } from './ChoiceFieldOptions'

export interface BaseChoiceFieldRendererProps<Value = unknown> {
	data: ChoiceFieldOptions<Value>
	errors: ErrorAccessor.Error[] | undefined
	onSearch?: (input: string) => void
	isLoading?: boolean
}

export interface SingleChoiceFieldRendererProps<Value = unknown> extends BaseChoiceFieldRendererProps<Value> {
	currentValue: ChoiceFieldSingleOption<Value> | null
	onSelect: (newValue: Value) => void
	onClear: () => void
}

export interface MultiChoiceFieldRendererProps<Value> extends BaseChoiceFieldRendererProps<Value> {
	currentValues: ChoiceFieldSingleOption<Value>[]
	onClear: () => void
	onAdd: (option: Value) => void
	onRemove: (option: Value) => void
	onMove?: (oldIndex: number, newIndex: number) => void
}


export type DynamicMultiChoiceFieldRendererProps = MultiChoiceFieldRendererProps<EntityAccessor>
