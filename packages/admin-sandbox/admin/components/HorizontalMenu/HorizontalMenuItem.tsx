import { LinkButton, LinkButtonProps, LinkProps } from '@contember/admin'
import { useClassName, useOnElementClickOutsideCallback, useOnElementMouseEnterDelayedCallback, useReferentiallyStableCallback } from '@contember/react-utils'
import { Button, Collapsible, Stack, Text } from '@contember/ui'
import { dataAttribute } from '@contember/utilities'
import { ChevronDownIcon } from 'lucide-react'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useHorizontalMenuContext } from './contexts'
import { HorizontalMenuItemProps } from './types'

export const HorizontalMenuItem = memo(({ icon, className: classNameProp, componentClassName = 'horizontal-menu-item', title, ...props }: HorizontalMenuItemProps) => {
	const {
		horizontal,
		hover,
	} = useHorizontalMenuContext()

	const [expanded, setExpanded] = useState(horizontal ? false : true)
	const mouseEnterTimeStampRef = useRef<ReturnType<typeof Date.now> | undefined>(undefined)

	const handleButtonClick = useCallback(() => {
		if (mouseEnterTimeStampRef.current && Date.now() < mouseEnterTimeStampRef.current) {
			return
		} else {
			setExpanded(expanded => !expanded)
			mouseEnterTimeStampRef.current = undefined
		}
	}, [])
	const className = useClassName(componentClassName, classNameProp)
	const submenuRef = useRef<HTMLDivElement>(null)

	useOnElementClickOutsideCallback(submenuRef, useCallback(() => {
		if (hover) {
			setExpanded(false)
		}
	}, [hover]))

	const closeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	useEffect(() => {
		return () => clearTimeout(closeTimeout.current)
	}, [])

	useOnElementMouseEnterDelayedCallback(submenuRef, useReferentiallyStableCallback(event => {
		clearTimeout(closeTimeout.current)
	}), 0)

	useOnElementMouseEnterDelayedCallback(submenuRef, useReferentiallyStableCallback(event => {
		if (hover && event.type === 'mouseenter') {
			mouseEnterTimeStampRef.current = Date.now() + 300
			setExpanded(true)
		}
	}))

	const onMouseLeave = useReferentiallyStableCallback(() => {
		if (hover) {
			closeTimeout.current = setTimeout(() => {
				setExpanded(false)
			}, 300)
		}
	})

	if (props.to) {
		if ('buttonProps' in props) {
			throw new Error('HorizontalMenuItem: `buttonProps` are not supported when `to` is set')
		}
		if ('children' in props) {
			throw new Error('HorizontalMenuItem: `children` are not supported when `to` is set. Move `to` prop onto children `<Menu><Menu.Item to={...} /></Menu>` instead.`')
		}

		return (
			<LinkButton
				className={className}
				{...defaultLinkProps}
				{...props}
				justify={horizontal ? 'center' : 'start'}
				title={undefined}
			>
				<>
					{icon}
					{title && <Text>{title}</Text>}
				</>
			</LinkButton>
		)
	} else {
		if ('to' in props) {
			throw new Error('HorizontalMenuItem: `to` is not supported when `buttonProps` are set')
		}

		return (
			<div
				ref={submenuRef}
				className={className}
				data-active={dataAttribute(expanded)}
				onMouseLeave={onMouseLeave}
			>
				<Button {...defaultLinkProps} justify={horizontal ? 'center' : 'space-between'} onClick={handleButtonClick}>
					<>
						{icon}
						{title
							? (
								<Stack
									horizontal
									grow={!horizontal}
									justify={horizontal ? 'center' : 'space-between'}
									gap="gap"
								>
									<Text>{title}</Text>
									<ChevronDownIcon className="lucide more-toggle-icon" />
								</Stack>
							)
							: <ChevronDownIcon className="lucide more-toggle-icon" />
						}
					</>
				</Button>
				<Collapsible
					expanded={expanded}
					{...props}
				/>
			</div>
		)
	}
})
HorizontalMenuItem.displayName = 'Item'

const defaultLinkProps: Omit<LinkButtonProps, keyof LinkProps> = {
	distinction: 'seamless',
	inset: false,
	padding: true,
}
