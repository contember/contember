import { useClassNameFactory } from '@contember/react-utils'
import { XIcon } from 'lucide-react'
import { memo, ReactNode } from 'react'
import { HTMLDivElementProps } from '../../types'
import { toEnumViewClass, toFeatureClass } from '../../utils'
import { Button } from '../Forms'
import { Stack, StackProps } from '../Stack'

export type DialogModalProps =
	& {
		bodyClassName?: string
		dividers?: boolean
		footer?: ReactNode
		footerProps?: Partial<Omit<StackProps, 'ref'>>
		bodyProps?: Partial<Omit<StackProps, 'ref'>>
		header?: ReactNode
		headerProps?: Partial<Omit<StackProps, 'ref'>>
		headerClassName?: string
		footerClassName?: string
		layout?: 'fit-content' | 'wide' | 'expanded'
		onClose: () => void
	}
	& HTMLDivElementProps

/**
 * @group UI
 */
export const DialogModal = memo(({
	bodyClassName,
	bodyProps,
	children,
	className,
	dividers = false,
	footer,
	footerClassName,
	footerProps,
	header,
	headerClassName,
	headerProps,
	layout = 'fit-content',
	onClose,
	...rest
}: DialogModalProps) => {
	const componentClassName = useClassNameFactory('dialog-modal')

	return (
		<div
			{...rest}
			className={componentClassName(null, [
				toFeatureClass('dividers', dividers),
				toEnumViewClass(layout),
				className,
			])}
		>
			<Stack
				{...headerProps}
				align={headerProps?.align ?? 'center'}
				horizontal={headerProps?.horizontal ?? true}
				justify={headerProps?.justify ?? 'space-between'}
				className={componentClassName('header', headerClassName)}
			>
				{header}
				<Button square borderRadius="full" onClick={onClose} distinction="seamless" className={componentClassName('close-button')}><XIcon /></Button>
			</Stack>

			{children && <div className={componentClassName('body-wrapper')}>
				<Stack
					{...bodyProps}
					className={componentClassName('body', bodyClassName)}
				>
					{children}
				</Stack>
			</div>}

			{footer && <Stack
				{...footerProps}
				className={componentClassName('footer', footerClassName)}
				horizontal={footerProps?.horizontal ?? true}
				justify={footerProps?.justify ?? 'end'}
			>
				{footer}
			</Stack>}
		</div>
	)
})
DialogModal.displayName = 'DialogModal'
