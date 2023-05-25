import { useClassNameFactory } from '@contember/utilities'
import { forwardRef, memo, ReactNode, useLayoutEffect, useRef } from 'react'
import type { HTMLDivElementProps } from '../../types'
import { Message } from '../Message'
import { useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'
import { Heading } from '../Typography'

export interface SectionOwnProps {
	id?: string
	heading?: ReactNode
	showTab?: boolean
	actions?: ReactNode
	children?: ReactNode
}

export type SectionProps =
	& SectionOwnProps
	& HTMLDivElementProps

const randomId = () => (Math.random() + 1).toString(36).substring(7)

/**
 * The `Section` component defines a section on page. It automatically generates sub-menu for quick navigation on the page.
 *
 * @example
 * ```
 * <Section heading="Content" />
 * ```
 *
 * @group UI
 */
export const Section = memo(forwardRef<HTMLElement, SectionProps>(({
	actions,
	children,
	heading,
	id,
	className,
	showTab = true,
	...divProps
}: SectionProps, ref) => {
	const componentClassName = useClassNameFactory('section')

	const [registerTab, unregisterTab] = useSectionTabsRegistration()
	const sectionId = useRef<string>(id ? `section-${id}` : 'section-' + randomId())

	useLayoutEffect(() => {
		if (!heading || !showTab) {
			return
		}

		const tab = { id: sectionId.current, label: heading }

		registerTab(tab)

		return () => {
			unregisterTab(tab)
		}
	}, [heading, registerTab, sectionId, showTab, unregisterTab])

	return (
		<section
			{...divProps}
			id={sectionId.current}
			className={componentClassName(null, className)}
			ref={ref}
		>
			{import.meta.env.DEV && <Message distinction="striking" intent="warn" className="message--nesting-warning">Please use <code><strong>Section</strong></code> as parent element of the <code><strong>LocaleSideDimension</strong></code>.</Message>}
			{(heading || actions) && (
				<div className={componentClassName('heading')} contentEditable={false}>
					<Heading depth={3}>
						{heading}
					</Heading>
					<Stack direction="horizontal" className={componentClassName('actions')} contentEditable={false}>
						{actions}
					</Stack>
				</div>
			)}
			{children}
		</section>
	)
}))
Section.displayName = 'Section'
