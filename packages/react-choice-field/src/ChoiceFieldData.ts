import type {
	ChoiceFieldOptions,
	ChoiceFieldSingleOption,
} from './ChoiceFieldOptions'
import type {
	SingleChoiceFieldRendererProps,
	MultiChoiceFieldRendererProps,
	BaseChoiceFieldRendererProps,
} from './Renderers'

export namespace ChoiceFieldData {
	/**
	 * @deprecated use {@link ChoiceFieldOptions}
	 */
	export type Options<T = unknown> = ChoiceFieldOptions<T>

	/**
	 * @deprecated use {@link ChoiceFieldSingleOption}
	 * */
	export type SingleOption<T = unknown> = ChoiceFieldSingleOption<T>

	/**
	 * @deprecated use {@link SingleChoiceFieldRendererProps}
	 */
	export type SingleChoiceFieldMetadata<T = unknown> = SingleChoiceFieldRendererProps<T>

	/**
	 * @deprecated use {@link MultiChoiceFieldRendererProps}
	 */
	export type MultiChoiceFieldMetadata<T> = MultiChoiceFieldRendererProps<T>


	/**
	 * @deprecated use {@link BaseChoiceFieldRendererProps}
	 */
	export type BaseChoiceFieldMetadata<T = unknown> = BaseChoiceFieldRendererProps<T>
}
