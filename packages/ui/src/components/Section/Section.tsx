import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { NativeProps } from '../../types'
import { Message } from '../Message'
import { useSectionTabsRegistration } from '../SectionTabs'
import { Heading } from '../Typography/Heading'

export interface SectionOwnProps {
	id?: string
	heading?: ReactNode
	actions?: ReactNode
	children?: ReactNode
}

export interface SectionProps extends SectionOwnProps, Omit<NativeProps<HTMLElement>, 'children'> {}

const randomId = () => (Math.random() + 1).toString(36).substring(7)

export const Section = memo(
	forwardRef<HTMLElement, SectionProps>(
		({ actions, children, heading, id, className, ...divProps }: SectionProps, ref) => {
			const prefix = useClassNamePrefix()

			const [registerTab, unregisterTab] = useSectionTabsRegistration()
			const sectionId = useRef<string>(id ? `section-${id}` : 'section-' + randomId())

			useLayoutEffect(() => {
				if (!heading) {
					return
				}

				const tab = { id: sectionId.current, label: heading }

				registerTab(tab)

				return () => {
					unregisterTab(tab)
				}
			}, [sectionId, heading, registerTab, unregisterTab])

			return (
				<section
					{...divProps}
					id={sectionId.current}
					className={classnames(
						`${prefix}section`,
						className,
					)}
					ref={ref}
				>
					{import.meta.env.DEV && <Message distinction="striking" intent="warn" className="message--nesting-warning">Please use <code><strong>Section</strong></code> as parent element of the <code><strong>LocaleSideDimension</strong></code>.</Message>}
					{heading && (
						<div className={`${prefix}section-heading`} contentEditable={false}>
							<Heading depth={3}>
								{heading}
							</Heading>
						</div>
					)}
					{actions && (
						<div className={`${prefix}section-actions`} contentEditable={false}>
							{actions}
						</div>
					)}
					{children}
				</section>
			)
		},
	),
)
Section.displayName = 'Section'
