import classnames from 'classnames'
import { forwardRef, memo, ReactNode, useContext, useLayoutEffect, useRef } from 'react'
import { IncreaseHeadingDepth, useClassNamePrefix } from '../../../auxiliary'
import { BoxDepthContext, HeadingDepthContext } from '../../../contexts'
import type { NativeProps } from '../../../types'
import { toViewClass } from '../../../utils'
import { Heading } from '../../Heading'
import { useSectionTabsRegistration } from '../../SectionTabs'

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
			const sectionDepth = useContext(BoxDepthContext)
			const headingDepth = useContext(HeadingDepthContext)
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
						toViewClass(`depth-${sectionDepth}`, true),
						className,
					)}
					ref={ref}
				>
					{heading && (
						<div className={`${prefix}section-heading`} contentEditable={false}>
							<Heading depth={headingDepth} size="small">
								{heading}
							</Heading>
						</div>
					)}
					{actions && (
						<div className={`${prefix}section-actions`} contentEditable={false}>
							{actions}
						</div>
					)}
					{children && (
						<IncreaseHeadingDepth currentDepth={headingDepth} onlyIf={!!heading}>
              {children}
						</IncreaseHeadingDepth>
					)}
				</section>
			)
		},
	),
)
Section.displayName = 'Section'
