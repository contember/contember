import { Stack, VisuallyHidden } from '@contember/ui'
import { assert, isNonEmptyTrimmedString } from '@contember/utilities'
import { ArrowLeftIcon } from 'lucide-react'
import { ReactNode, memo } from 'react'
import { useMessageFormatter } from '../../i18n'
import { Link, LinkProps } from './Link'

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
