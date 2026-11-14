import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import { FileSystem } from './FileSystem.js'
import { isNotFound } from './fsErrors.js'

/**
 * Resolves a path from a template directive against the project root.
 * Refuses absolute paths, the root itself and anything that leaves the root, lexically or through a symlink.
 */
export const resolveProjectPath = async (fs: FileSystem, root: string, path: string): Promise<string> => {
	const outside = new Error(`Template path "${path}" points outside the project`)
	if (isAbsolute(path)) {
		throw outside
	}
	const resolved = resolve(root, path)
	if (!isStrictlyInside(root, resolved)) {
		throw outside
	}
	const realRoot = await fs.realPath(root)
	const realPath = await resolveExistingPrefix(fs, resolved)
	if (realPath === undefined) {
		throw new Error(`Template path "${path}" passes through a dangling symlink`)
	}
	if (!isStrictlyInside(realRoot, realPath)) {
		throw outside
	}
	return resolved
}

/**
 * Like resolveProjectPath, and the path must not exist yet. fs.cp into an existing directory writes entries the check
 * above never saw, and Bun's fs.cp follows symlinks it finds there.
 */
export const resolveNewProjectPath = async (fs: FileSystem, root: string, path: string): Promise<string> => {
	const resolved = await resolveProjectPath(fs, root, path)
	if (await isPresent(fs, resolved)) {
		throw new Error(`Template path "${path}" already exists`)
	}
	return resolved
}

const isStrictlyInside = (root: string, path: string): boolean => {
	const rel = relative(root, path)
	return rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
}

/**
 * realpath() of the longest existing prefix, with the missing components appended (they cannot be symlinks).
 * Returns undefined for a dangling symlink: writing to it would create its target, wherever that is.
 */
const resolveExistingPrefix = async (fs: FileSystem, path: string): Promise<string | undefined> => {
	try {
		return await fs.realPath(path)
	} catch (error) {
		if (!isNotFound(error)) {
			throw error
		}
	}
	if (await isPresent(fs, path)) {
		return undefined
	}
	const parent = dirname(path)
	if (parent === path) {
		return path
	}
	const realParent = await resolveExistingPrefix(fs, parent)
	return realParent === undefined ? undefined : join(realParent, basename(path))
}

const isPresent = async (fs: FileSystem, path: string): Promise<boolean> => {
	try {
		await fs.lstat(path)
		return true
	} catch (error) {
		if (isNotFound(error)) {
			return false
		}
		throw error
	}
}
