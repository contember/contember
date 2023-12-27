import { AnchorButton, Stack, VisuallyHidden } from '@contember/ui'
import { ArrowLeftIcon } from 'lucide-react'
import { memo, ReactNode, useMemo } from 'react'
import { useMessageFormatter } from '@contember/react-i18n'
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
		visuallyHidden?: boolean;
	}

export const NavigateBackLink = memo<NavigateBackLinkProps>(({
	icon,
	ariaLabel,
	children,
	visuallyHidden = true,
	...props
}) => {
	const formatMessage = useMessageFormatter(navigationBackLinkDictionary)

	const finalAriaLabel = typeof children === 'string' ? children : (ariaLabel ?? formatMessage('navigationBackLink.back'))

	return (
		<Link Component={AnchorButton} componentProps={useMemo(() => ({ borderRadius: 'full', distinction: 'seamless' }), [])} {...props} aria-label={finalAriaLabel}>
			<Stack horizontal align="center">
				{icon ?? <ArrowLeftIcon />}
				<VisuallyHidden hidden={visuallyHidden}>{children ?? formatMessage('navigationBackLink.back')}</VisuallyHidden>
			</Stack>
		</Link>
	)
})
NavigateBackLink.displayName = 'NavigateBackLink'
