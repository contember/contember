import { Component, Field, useEnvironment } from '@contember/react-binding'
import { useMemo } from 'react'
import { RoutingLink, RoutingLinkProps } from './RoutingLink'
import { useBindingLinkParametersResolver } from '../internal/hooks/useBindingLinkParametersResolver'
import { parseLinkTarget } from '../internal/utils/parseLinkTarget'
import { createFieldsFromTarget } from '../internal/utils/createFieldsFromTarget'

export type LinkProps = Omit<RoutingLinkProps, 'parametersResolver'>

/**
 * @group Routing
 */
export const Link = Component(({ to, ...props }: LinkProps) => {
	const parametersResolver = useBindingLinkParametersResolver()
	const env = useEnvironment()
	const desugaredTo = useMemo(() => {
		return parseLinkTarget(to, env)
	}, [to, env])

	return <RoutingLink parametersResolver={parametersResolver} to={desugaredTo} {...props} />
}, (props, env) => {
	const to = parseLinkTarget(props.to, env)

	return <>
		{createFieldsFromTarget(to).map((it, index) => <Field key={`${index}-${it}`} field={it} />)}
		{props.children}
	</>
})
Link.displayName = 'Link'


