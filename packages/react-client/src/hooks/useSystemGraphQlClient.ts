import { useGraphQlClient } from './useGraphQlClient'

export const useSystemGraphQlClient = (projectSlug: string) => useGraphQlClient(`/system/${projectSlug}`)
