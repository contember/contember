import { useClassName } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { HTMLAnchorElementProps } from '../../types'
import { Label } from '../Typography'

export type AnchorProps = HTMLAnchorElementProps & {
	active?: boolean;
	componentClassName?: string;
}

export const Anchor = memo(forwardRef<HTMLAnchorElement, AnchorProps>(({
	active,
	className: classNameProp,
	componentClassName = 'anchor',
	children,
	...props
}, forwardedRef) => (
	<a
		ref={forwardedRef}
		{...props}
		data-active={dataAttribute(active)}
		className={useClassName(componentClassName, classNameProp)}
	>
		<Label>
			{children}
		</Label>
	</a>
)))
Anchor.displayName = 'Anchor'
