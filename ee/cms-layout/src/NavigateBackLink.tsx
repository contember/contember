import { Link, LinkProps, useMessageFormatter } from '@contember/admin'
import { Stack } from '@contember/ui'
import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode, memo } from 'react'
import { assert, isNonEmptyTrimmedString } from './packages/assert-types'
import { VisuallyHidden } from './packages/ui-visually-hidden'

export const navigationBackLinkDictionary = {
	navigationBackLink: {
		back: 'Back',
	},
}

export type LabeledProps = {
	ariaLabel: string;
	children: Exclude<ReactNode, string | null | undefined>;
} | {
	ariaLabel?: string;
	children?: string | null | undefined;
}

export type NavigateBackLinkProps =
	& Omit<LinkProps, 'children'>
	& LabeledProps
	& {
		icon?: ReactNode;
		breakpoint?: number | null | undefined;
	}

export const NavigateBackLink = memo<NavigateBackLinkProps>(({
	icon,
	ariaLabel,
	children,
	...props
}) => {
	const formatMessage = useMessageFormatter(navigationBackLinkDictionary)

	const finalAriaLabel = isNonEmptyTrimmedString(children) ? children : (ariaLabel ?? formatMessage('navigationBackLink.back'))
	assert('ariaLabel to be present when children is empty', finalAriaLabel, isNonEmptyTrimmedString)

	return (
		<Link {...props} aria-label={finalAriaLabel}>
			<Stack direction="horizontal" align="center">
				{icon ?? <ArrowLeftIcon />}
				{<VisuallyHidden>{children ?? formatMessage('navigationBackLink.back')}</VisuallyHidden>}
			</Stack>
		</Link>
	)
})
NavigateBackLink.displayName = 'NavigateBackLink'
