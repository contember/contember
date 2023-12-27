import { assert, isNonNegativeNumber } from '@contember/utilities'
import { OwnPanelProps } from './Types'

export function parseLayoutPanelProps<T extends OwnPanelProps>(props: T): T {
	if (props.defaultVisibility == null && props.visibility == null) {
		console.error('Current props:', props)
		throw new Error('Provide an `defaultVisibility` value when uncontrolled or `visibility` when controlled, cannot provide both or any.')
	}

	if (props.defaultVisibility != null && props.visibility != null) {
		console.error('Current props:', props)
		throw new Error('Provide an `defaultVisibility` value when uncontrolled or `visibility` when controlled, cannot provide both or any.')
	}

	if (props.visibility != null && props.onVisibilityChange == null) {
		throw new Error('You have provided `visibility` prop without a `onVisibilityChange` callback. Either provide a callback and use component as controlled or use `defaultVisibility` to use component as uncontrolled')
	}

	if (props.defaultBehavior == null && props.behavior == null) {
		console.error('Current props:', props)
		throw new Error('Provide an `defaultBehavior` value when uncontrolled or `behavior` when controlled, cannot provide both or any.')
	}
	if (props.defaultBehavior != null && props.behavior != null) {
		console.error('Current props:', props)
		throw new Error('Provide an `defaultBehavior` value when uncontrolled or `behavior` when controlled, cannot provide both or any.')
	}

	if (props.behavior != null && props.onBehaviorChange == null) {
		throw new Error('You have provided `behavior` prop without a `onBehaviorChange` callback. Either provide a callback and use component as controlled or use `defaultBehavior` to use component as uncontrolled')
	}

	if (props.basis != null) {
		assert('LayoutPanel.basis to be number', props.basis, isNonNegativeNumber)
	}

	if (props.maxWidth != null) {
		assert('LayoutPanel.maxWidth to be number', props.maxWidth, isNonNegativeNumber)
	}

	if (props.minWidth != null) {
		assert('LayoutPanel.minWidth to be number', props.minWidth, isNonNegativeNumber)
	}

	if (props.priority != null) {
		assert('LayoutPanel.priority to be number', props.priority, isNonNegativeNumber)
	}

	return props
}
