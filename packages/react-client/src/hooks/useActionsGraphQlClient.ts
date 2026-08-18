import { useGraphQlClient } from './useGraphQlClient.js'

export const useActionsGraphQlClient = (projectSlug: string) => useGraphQlClient(`/actions/${projectSlug}`)
