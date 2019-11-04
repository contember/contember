import * as path from 'path'

export const getDirectories = (
	projectName: string,
	options: { projectDir?: string; migrationsDir?: string } = {},
): { projectDir: string; migrationsDir: string } => {
	const projectDir = path.resolve(process.cwd(), options.projectDir || path.join('projects', projectName, 'api'))
	const migrationsDir = path.resolve(process.cwd(), options.migrationsDir || path.join(projectDir, 'migrations'))
	return { projectDir, migrationsDir }
}
