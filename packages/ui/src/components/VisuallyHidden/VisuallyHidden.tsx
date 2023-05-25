import { NestedClassName, PolymorphicComponentPropsWithRef, PolymorphicRef, dataAttribute, useClassName } from '@contember/utilities'
import { ElementType, PropsWithChildren, forwardRef, memo } from 'react'

export type OwnVisuallyHiddenProps = PropsWithChildren<{
	hidden?: boolean;
	className?: NestedClassName;
	componentClassName?: string;
}>

export type VisuallyHiddenProps<C extends ElementType> =
	PolymorphicComponentPropsWithRef<C, OwnVisuallyHiddenProps>

export type VisuallyHiddenComponentType = (<C extends ElementType = 'span'>(
	props: VisuallyHiddenProps<C>,
) => React.ReactElement | null) & {
	displayName?: string | undefined;
}

export const VisuallyHidden: VisuallyHiddenComponentType = memo(forwardRef(
	<C extends ElementType = 'span'>({
		as,
		className,
		componentClassName = 'visually-hidden',
		hidden = true,
		children,
		...rest
	}: PropsWithChildren<VisuallyHiddenProps<C>>, forwardedRef: PolymorphicRef<C>) => {
		const Component = as ?? 'span'

		return (
			<Component
				ref={forwardedRef}
				data-hidden={dataAttribute(hidden)}
				className={useClassName(componentClassName, className)}
				{...rest}
			>
				{children}
			</Component>
		)
	},
))
VisuallyHidden.displayName = 'VisuallyHidden'
