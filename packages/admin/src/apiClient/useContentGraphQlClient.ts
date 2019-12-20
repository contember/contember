import { useGraphQlClient } from './useGraphQlClient'

export const useContentGraphQlClient = (project: string, stage: string) =>
	useGraphQlClient(`/content/${project}/${stage}`)
