// do not forget to update packages/cli/src/utils/project.ts
export const projectNameToEnvName = (projectName: string): string => {
	return projectName.toUpperCase().replace(/-/g, '_')
}
