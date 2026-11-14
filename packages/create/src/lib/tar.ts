import { lstat, mkdir, symlink, writeFile } from 'node:fs/promises'
import { join, resolve, sep } from 'node:path'
import { hasCode, isNotFound } from './fsErrors.js'

export type TarEntry =
	| { readonly type: 'file'; readonly path: string; readonly mode: number; readonly data: Uint8Array }
	| { readonly type: 'directory'; readonly path: string }
	| { readonly type: 'symlink'; readonly path: string; readonly target: string }

const blockSize = 512
const decoder = new TextDecoder()

const readString = (block: Uint8Array, offset: number, length: number): string => {
	const field = block.subarray(offset, offset + length)
	const end = field.indexOf(0)
	return decoder.decode(end === -1 ? field : field.subarray(0, end))
}

const readOctal = (block: Uint8Array, offset: number, length: number, field: string): number => {
	const text = readString(block, offset, length).trim()
	if (!/^[0-7]*$/.test(text)) {
		throw new Error(`Invalid tar archive: unreadable ${field} field`)
	}
	return text === '' ? 0 : Number.parseInt(text, 8)
}

const verifyChecksum = (block: Uint8Array): void => {
	const expected = readOctal(block, 148, 8, 'checksum')
	let sum = 0
	for (let i = 0; i < blockSize; i++) {
		sum += i >= 148 && i < 156 ? 0x20 : block[i]
	}
	if (sum !== expected) {
		throw new Error('Invalid tar archive: header checksum mismatch')
	}
}

/** PAX extended header records: `<length> <key>=<value>\n`. */
const parsePax = (data: Uint8Array): Map<string, string> => {
	const records = new Map<string, string>()
	let offset = 0
	while (offset < data.length) {
		const space = data.indexOf(0x20, offset)
		const length = space === -1 ? Number.NaN : Number(decoder.decode(data.subarray(offset, space)))
		if (!Number.isSafeInteger(length) || length <= 0 || offset + length > data.length) {
			throw new Error('Invalid tar archive: malformed PAX header')
		}
		const record = decoder.decode(data.subarray(space + 1, offset + length - 1))
		const equals = record.indexOf('=')
		if (equals > 0) {
			records.set(record.slice(0, equals), record.slice(equals + 1))
		}
		offset += length
	}
	return records
}

/** Reads a POSIX (ustar/PAX) or GNU tar archive. Rejects entry types other than files, directories and symlinks. */
export const parseTar = (archive: Uint8Array): TarEntry[] => {
	const entries: TarEntry[] = []
	let pax = new Map<string, string>()
	let longName: string | undefined
	let longLink: string | undefined
	let offset = 0
	while (offset + blockSize <= archive.length) {
		const header = archive.subarray(offset, offset + blockSize)
		if (header.every(byte => byte === 0)) {
			return entries
		}
		verifyChecksum(header)
		const type = String.fromCharCode(header[156])
		const paxSize = pax.get('size')
		if (paxSize !== undefined && !/^\d+$/.test(paxSize)) {
			throw new Error('Invalid tar archive: unreadable PAX size')
		}
		const size = paxSize !== undefined ? Number(paxSize) : readOctal(header, 124, 12, 'size')
		const dataStart = offset + blockSize
		if (!Number.isSafeInteger(size) || dataStart + size > archive.length) {
			throw new Error('Invalid tar archive: entry exceeds the archive')
		}
		const data = archive.subarray(dataStart, dataStart + size)
		offset = dataStart + Math.ceil(size / blockSize) * blockSize

		if (type === 'x') {
			pax = parsePax(data)
			continue
		}
		if (type === 'g') {
			continue
		}
		if (type === 'L' || type === 'K') {
			const value = readString(data, 0, data.length)
			if (type === 'L') {
				longName = value
			} else {
				longLink = value
			}
			continue
		}

		const isUstar = readString(header, 257, 5) === 'ustar'
		const prefix = isUstar ? readString(header, 345, 155) : ''
		const name = readString(header, 0, 100)
		const path = pax.get('path') ?? longName ?? (prefix ? `${prefix}/${name}` : name)
		const linkTarget = pax.get('linkpath') ?? longLink ?? readString(header, 157, 100)
		pax = new Map()
		longName = undefined
		longLink = undefined

		if (type === '0' || type === '\0' || type === '7') {
			entries.push({ type: 'file', path, mode: readOctal(header, 100, 8, 'mode'), data })
		} else if (type === '5') {
			entries.push({ type: 'directory', path })
		} else if (type === '2') {
			entries.push({ type: 'symlink', path, target: linkTarget })
		} else {
			throw new Error(`Unsupported tar entry "${path}" (type ${JSON.stringify(type)})`)
		}
	}
	throw new Error('Invalid tar archive: missing end-of-archive marker')
}

const unsafe = (what: string, value: string): Error => new Error(`Refusing ${what} in template archive: ${JSON.stringify(value)}`)

/** Longer and deeper than any real template path; together they bound the per-component work for each entry. */
const maxPathLength = 4096
const maxPathDepth = 256

/** The entry's path components below `subdir`, or `undefined` when it lies outside; throws on paths that could escape. */
const relativeComponents = (path: string, strip: number, subdir: readonly string[]): string[] | undefined => {
	if (path.startsWith('/')) {
		throw unsafe('absolute path', path)
	}
	if (path.length > maxPathLength) {
		throw unsafe('overlong path', path.slice(0, 100))
	}
	const components = path.split('/').filter(it => it !== '' && it !== '.').slice(strip)
	if (components.length > maxPathDepth) {
		throw unsafe('too deeply nested path', path.slice(0, 100))
	}
	if (components.length <= subdir.length || subdir.some((it, index) => components[index] !== it)) {
		return undefined
	}
	const relative = components.slice(subdir.length)
	if (relative.some(it => it === '..' || it.includes('\\'))) {
		throw unsafe('path', path)
	}
	return relative
}

/** Resolves `target` from the link's directory; it must stay inside the root and not pass through another archive link. */
const isContainedLinkTarget = (link: readonly string[], target: string, links: ReadonlySet<string>): boolean => {
	if (target.length > maxPathLength || target.startsWith('/') || target.includes('\\') || /^[a-zA-Z]:/.test(target)) {
		return false
	}
	const resolved = link.slice(0, -1)
	const parts = target.split('/').filter(it => it !== '' && it !== '.')
	if (parts.length > maxPathDepth) {
		return false
	}
	for (const [index, part] of parts.entries()) {
		if (part === '..') {
			if (resolved.length === 0) {
				return false
			}
			resolved.pop()
		} else {
			resolved.push(part)
			if (index < parts.length - 1 && links.has(resolved.join('/'))) {
				return false
			}
		}
	}
	return true
}

/**
 * Creates the directories one component at a time and refuses to pass through a symlink. The string checks cannot see
 * aliases a case-insensitive or normalising filesystem makes (`D/L` is `d/l`), the filesystem itself can.
 */
const ensureDirectory = async (root: string, components: readonly string[], path: string): Promise<void> => {
	let current = root
	for (const component of components) {
		current = join(current, component)
		try {
			const stat = await lstat(current)
			if (stat.isSymbolicLink()) {
				throw unsafe('entry below a symlink', path)
			}
			if (!stat.isDirectory()) {
				throw new Error(`Template archive entry ${JSON.stringify(path)} collides with a file`)
			}
		} catch (error) {
			if (!isNotFound(error)) {
				throw error
			}
			await mkdir(current)
		}
	}
}

/** Walks a created link's target on the filesystem: no component before the last may be a symlink. */
const assertTargetWithoutLinks = async (root: string, link: readonly string[], target: string, path: string): Promise<void> => {
	const resolved = link.slice(0, -1)
	const parts = target.split('/').filter(it => it !== '' && it !== '.')
	for (const [index, part] of parts.entries()) {
		if (part === '..') {
			resolved.pop()
			continue
		}
		resolved.push(part)
		if (index === parts.length - 1) {
			return
		}
		try {
			if ((await lstat(join(root, ...resolved))).isSymbolicLink()) {
				throw unsafe('symlink pointing outside the template', `${path} -> ${target}`)
			}
		} catch (error) {
			if (isNotFound(error)) {
				// a dangling target; the string check already kept it inside
				return
			}
			if (hasCode(error, 'ENOTDIR')) {
				throw unsafe('symlink resolving through a file', `${path} -> ${target}`)
			}
			throw error
		}
	}
}

export interface ExtractOptions {
	/** Leading path components dropped from every entry, e.g. the archive's top-level directory. */
	readonly strip: number
	/** Only entries below this directory (after `strip`) are extracted, relative to it. */
	readonly subdir?: readonly string[]
}

/**
 * Writes the entries into `targetDir`. Paths stay inside it, no entry may sit below a symlink, and a link target must
 * resolve inside without passing through another link. Checked on the names first, then on the filesystem while
 * writing. Links are created last, so no file is written through one.
 */
export const extractTar = async (entries: readonly TarEntry[], targetDir: string, { strip, subdir = [] }: ExtractOptions): Promise<void> => {
	const root = resolve(targetDir)
	const selected = entries.flatMap(entry => {
		const relative = relativeComponents(entry.path, strip, subdir)
		return relative ? [{ entry, relative }] : []
	})
	const links = new Set(selected.filter(it => it.entry.type === 'symlink').map(it => it.relative.join('/')))
	for (const { entry, relative } of selected) {
		if (relative.some((_, index) => index > 0 && links.has(relative.slice(0, index).join('/')))) {
			throw unsafe('entry below a symlink', entry.path)
		}
		if (entry.type === 'symlink' && !isContainedLinkTarget(relative, entry.target, links)) {
			throw unsafe('symlink pointing outside the template', `${entry.path} -> ${entry.target}`)
		}
		if (!resolve(root, ...relative).startsWith(root + sep)) {
			throw unsafe('path', entry.path)
		}
	}
	await mkdir(root, { recursive: true })
	for (const { entry, relative } of selected) {
		if (entry.type === 'directory') {
			await ensureDirectory(root, relative, entry.path)
		} else if (entry.type === 'file') {
			await ensureDirectory(root, relative.slice(0, -1), entry.path)
			// `wx` never follows or replaces an existing entry
			await writeFile(join(root, ...relative), entry.data, { mode: (entry.mode & 0o777) || 0o644, flag: 'wx' })
		}
	}
	const created: { relative: readonly string[]; target: string; path: string }[] = []
	for (const { entry, relative } of selected) {
		if (entry.type === 'symlink') {
			await ensureDirectory(root, relative.slice(0, -1), entry.path)
			await symlink(entry.target, join(root, ...relative))
			created.push({ relative, target: entry.target, path: entry.path })
		}
	}
	for (const link of created) {
		await assertTargetWithoutLinks(root, link.relative, link.target, link.path)
	}
}
