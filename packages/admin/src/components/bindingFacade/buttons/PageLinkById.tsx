import { EntityAccessor, useEntity } from '@contember/react-binding'
import { ComponentType, memo, ReactNode, useMemo } from 'react'
import { InnerRoutingLinkProps, Link, RequestState } from '../../../routing'

interface BasePageLinkByIdProps {
	Component?: ComponentType<InnerRoutingLinkProps>
	children?: ReactNode
}

interface SimplePageLinkByIdTarget {
	to: string
	idParameterName?: string
}

interface CustomPageLinkByIdTarget {
	change: (id: string, entity: EntityAccessor) => RequestState
}

type PageLinkByIdProps =
	& BasePageLinkByIdProps
	& (
		| CustomPageLinkByIdTarget
		| SimplePageLinkByIdTarget
	)

/** @deprecated Use PageLinkButton instead */
export const PageLinkById = memo(function (props: PageLinkByIdProps) {
	const parentEntity = useEntity()
	const id = parentEntity.id
	const target = useMemo(() => {
		if (typeof id !== 'string') {
			return null
		}
		if ('to' in props) {
			return {
				pageName: props.to,
				parameters: {
					[props.idParameterName ?? 'id']: id,
				},
			}
		}
		return () => props.change(id, parentEntity)
	}, [id, parentEntity, props])

	if (target !== null) {
		return (
			<Link to={target} Component={props.Component}>
				{props.children}
			</Link>
		)
	}
	return null
})
