import classnames from 'classnames'
import { DetailedHTMLProps, forwardRef, HTMLAttributes, memo, ReactNode, useLayoutEffect, useRef } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import { Message } from '../Message'
import { useSectionTabsRegistration } from '../SectionTabs'
import { Stack } from '../Stack'
import { Heading } from '../Typography/Heading'

export interface SectionOwnProps {
	id?: string
	heading?: ReactNode
	showTab?: boolean
	actions?: ReactNode
	children?: ReactNode
}

export interface SectionProps extends SectionOwnProps, Omit<DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>, 'children'> { }

const randomId = () => (Math.random() + 1).toString(36).substring(7)

export const Section = memo(
	forwardRef<HTMLElement, SectionProps>(
		({ actions, children, heading, id, className, showTab = true, ...divProps }: SectionProps, ref) => {
			const prefix = useClassNamePrefix()

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
					className={classnames(
						`${prefix}section`,
						className,
					)}
					ref={ref}
				>
					{import.meta.env.DEV && <Message distinction="striking" intent="warn" className="message--nesting-warning">Please use <code><strong>Section</strong></code> as parent element of the <code><strong>LocaleSideDimension</strong></code>.</Message>}
					{(heading || actions) && (
						<div className={`${prefix}section-heading`} contentEditable={false}>
							<Heading depth={3}>
								{heading}
							</Heading>
							<Stack direction="horizontal" className={`${prefix}section-actions`} contentEditable={false}>
								{actions}
							</Stack>
						</div>
					)}
					{children}
				</section>
			)
		},
	),
)
Section.displayName = 'Section'
