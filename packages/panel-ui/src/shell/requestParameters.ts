import { useCurrentRequest } from '@contember/react-routing'

/** Route parameters are `string | number | RoutingParameter`; slugs are only ever the string case. */
export const stringParameter = (value: unknown): string | undefined => typeof value === 'string' ? value : undefined

/** The project slug in its one fixed position, `/panel/p/:project/...`. */
export const useProjectParameter = (): string | undefined => stringParameter(useCurrentRequest()?.parameters.project)
