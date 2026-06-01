import { useGraphQlClient } from './useGraphQlClient.js'

export const useSystemGraphQlClient = (projectSlug: string) => useGraphQlClient(`/system/${projectSlug}`)
