import { afterEach, describe, expect, test } from 'bun:test'
import { readFileSync } from 'node:fs'
import { lstat, mkdir, mkdtemp, readdir, readFile, readlink, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { downloadTemplate, type Fetch, parseTemplateSource, templateArchiveUrl } from '../../../src/lib/remoteTemplate.js'
import { extractTar, parseTar, type TarEntry } from '../../../src/lib/tar.js'

const fixture = readFileSync(new URL('./fixtures/template.tar.gz', import.meta.url))

const tempDirs: string[] = []
const createTempDir = async (): Promise<string> => {
	const dir = await mkdtemp(join(tmpdir(), 'contember-remote-template-test-'))
	tempDirs.push(dir)
	return dir
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })))
})

const listTree = async (root: string, dir = root): Promise<string[]> => {
	const result: string[] = []
	for (const name of (await readdir(dir)).sort()) {
		const path = join(dir, name)
		const stat = await lstat(path)
		const relative = path.slice(root.length + 1)
		if (stat.isSymbolicLink()) {
			result.push(`${relative} -> ${await readlink(path)}`)
		} else if (stat.isDirectory()) {
			result.push(`${relative}/`, ...(await listTree(root, path)))
		} else {
			result.push(relative)
		}
	}
	return result
}

/** Builds a ustar archive; enough to express the hostile entries a real tar tool would refuse to create. */
const tar = (entries: readonly { path: string; type?: string; data?: string; link?: string }[]): Uint8Array => {
	const blocks: Uint8Array[] = []
	for (const { path, type = '0', data = '', link = '' } of entries) {
		const header = new Uint8Array(512)
		const write = (offset: number, value: string) => header.set(new TextEncoder().encode(value), offset)
		const body = new TextEncoder().encode(data)
		write(0, path)
		write(100, '0000644\0')
		write(124, body.length.toString(8).padStart(11, '0') + '\0')
		write(156, type)
		write(157, link)
		write(257, 'ustar\u000000')
		header.fill(0x20, 148, 156)
		const checksum = header.reduce((sum, byte) => sum + byte, 0)
		write(148, checksum.toString(8).padStart(6, '0') + '\0 ')
		blocks.push(header, body, new Uint8Array((512 - (body.length % 512)) % 512))
	}
	blocks.push(new Uint8Array(1024))
	return Buffer.concat(blocks)
}

const respond = (body: Uint8Array, status = 200): Fetch => async () => new Response(body, { status })

const redirectTo = (location: string, then: Fetch): Fetch => {
	let redirected = false
	return async (url, init) => {
		if (redirected) {
			return then(url, init)
		}
		redirected = true
		return new Response(null, { status: 302, headers: { location } })
	}
}

describe('parseTemplateSource', () => {
	test('reads the degit source forms', () => {
		expect(parseTemplateSource('owner/repo')).toStrictEqual({ host: 'github', user: 'owner', name: 'repo', subdir: [], ref: 'HEAD' })
		expect(parseTemplateSource('owner/repo/templates/basic#v1.2')).toStrictEqual({
			host: 'github',
			user: 'owner',
			name: 'repo',
			subdir: ['templates', 'basic'],
			ref: 'v1.2',
		})
		expect(parseTemplateSource('https://github.com/owner/repo.git').name).toBe('repo')
		expect(parseTemplateSource('git@github.com:owner/repo#feature/x').ref).toBe('feature/x')
		expect(parseTemplateSource('gitlab:owner/repo').host).toBe('gitlab')
		expect(parseTemplateSource('bitbucket.org/owner/repo').host).toBe('bitbucket')
		expect(parseTemplateSource('git.sr.ht/~owner/repo').host).toBe('git.sr.ht')
	})

	test('rejects unknown hosts, unparsable sources and dot segments', () => {
		expect(() => parseTemplateSource('example.com/owner/repo')).toThrow('supported from GitHub')
		expect(() => parseTemplateSource('repo')).toThrow('Could not parse')
		expect(() => parseTemplateSource('owner/repo/../x')).toThrow('Could not parse')
		expect(() => parseTemplateSource('owner/repo#../main')).toThrow('Could not parse')
	})
})

describe('templateArchiveUrl', () => {
	test('builds each host archive URL', () => {
		const source = (host: 'github' | 'gitlab' | 'bitbucket' | 'git.sr.ht') => ({ host, user: 'o', name: 'r', subdir: [], ref: 'feature/x' })
		expect(templateArchiveUrl(source('github'))).toBe('https://github.com/o/r/archive/feature/x.tar.gz')
		expect(templateArchiveUrl(source('gitlab'))).toBe('https://gitlab.com/o/r/-/archive/feature/x/r-feature-x.tar.gz')
		expect(templateArchiveUrl(source('bitbucket'))).toBe('https://bitbucket.org/o/r/get/feature/x.tar.gz')
		expect(templateArchiveUrl(source('git.sr.ht'))).toBe('https://git.sr.ht/o/r/archive/feature/x.tar.gz')
	})
})

describe('downloadTemplate', () => {
	test('extracts a subdirectory of a git archive with its symlink, executable bit and long path', async () => {
		const target = await createTempDir()
		const requests: string[] = []
		await downloadTemplate('owner/repo/templates/basic#main', target, async (url, init) => {
			requests.push(`${url} ${init.redirect}`)
			return requests.length === 1
				? new Response(null, { status: 302, headers: { location: 'https://codeload.example.com/archive.tar.gz' } })
				: respond(fixture)(url, init)
		})

		expect(requests).toStrictEqual([
			'https://github.com/owner/repo/archive/main.tar.gz manual',
			'https://codeload.example.com/archive.tar.gz manual',
		])
		const deep = 'deep/'.repeat(12)
		expect(await listTree(target)).toStrictEqual([
			'bin/',
			'bin/run.sh',
			'contember.template.yaml',
			...Array.from({ length: 12 }, (_, index) => `${'deep/'.repeat(index + 1)}`),
			`${deep}file-with-a-long-name.txt`,
			'link.yaml -> contember.template.yaml',
		])
		expect((await lstat(join(target, 'bin/run.sh'))).mode & 0o100).toBe(0o100)
		expect(await readFile(join(target, deep, 'file-with-a-long-name.txt'), 'utf8')).toBe('long\n')
	})

	test('extracts the whole repository without its top-level directory', async () => {
		const target = await createTempDir()
		await downloadTemplate('owner/repo', target, respond(fixture))
		expect((await readdir(target)).sort()).toStrictEqual(['README.md', 'templates'])
	})

	test('reports an HTTP error with the URL', async () => {
		const target = await createTempDir()
		await expect(downloadTemplate('owner/repo#nope', target, respond(new Uint8Array(), 404))).rejects.toThrow(
			'Could not download https://github.com/owner/repo/archive/nope.tar.gz: HTTP 404',
		)
	})

	test('refuses a redirect hop to plain HTTP', async () => {
		const target = await createTempDir()
		const fetchArchive = redirectTo('http://example.com/a.tar.gz', respond(fixture))
		await expect(downloadTemplate('owner/repo', target, fetchArchive)).rejects.toThrow('non-HTTPS')
	})

	test('stops after too many redirects', async () => {
		const target = await createTempDir()
		const loop: Fetch = async () => new Response(null, { status: 302, headers: { location: 'https://example.com/again' } })
		await expect(downloadTemplate('owner/repo', target, loop)).rejects.toThrow('too many or invalid redirects')
	})

	test('refuses an archive that is not gzip', async () => {
		const target = await createTempDir()
		await expect(downloadTemplate('owner/repo', target, respond(new TextEncoder().encode('<html>')))).rejects.toThrow('not a readable gzip')
	})
})

describe('tar extraction', () => {
	const extract = async (archive: Uint8Array) => {
		const target = await createTempDir()
		await extractTar(parseTar(archive), join(target, 'out'), { strip: 1 })
		return target
	}

	test.each([
		['a parent-directory path', [{ path: 'top/../../evil.txt', data: 'x' }]],
		['an absolute path', [{ path: '/tmp/evil.txt', data: 'x' }]],
		['a symlink leaving the template', [{ path: 'top/link', type: '2', link: '../../outside' }]],
		['an absolute symlink', [{ path: 'top/link', type: '2', link: '/etc/passwd' }]],
		['a Windows drive symlink', [{ path: 'top/link', type: '2', link: 'C:/Windows' }]],
		['a backslash symlink', [{ path: 'top/link', type: '2', link: '..\\..\\outside' }]],
		['a file below a symlink', [{ path: 'top/dir', type: '2', link: '.' }, { path: 'top/dir/file.txt', data: 'x' }]],
		['a symlink chain leaving the template', [
			{ path: 'top/d/l', type: '2', link: '..' },
			{ path: 'top/esc', type: '2', link: 'd/l/..' },
			{ path: 'top/esc/planted', type: '2', link: 'x' },
		]],
	])('refuses %s before writing anything', async (_, entries) => {
		const target = await createTempDir()
		// nested, so that a `..` escaping the output directory would still land inside `target`
		await expect(extractTar(parseTar(tar(entries)), join(target, 'a/b/out'), { strip: 1 })).rejects.toThrow('Refusing')
		expect(await readdir(target)).toStrictEqual([])
	})

	// A link the name checks cannot see stands in for an alias on a case-insensitive filesystem (`D/L` is `d/l`).
	test.each([
		['a file written through it', [{ path: 'top/alias/x.txt', data: 'x' }]],
		['a symlink created through it', [{ path: 'top/alias/x', type: '2', link: 'y' }]],
		['a symlink resolving through it', [{ path: 'top/esc', type: '2', link: 'alias/..' }]],
	])('checks the filesystem for links the names do not show: %s', async (_, entries) => {
		const target = await createTempDir()
		const out = join(target, 'a/b/out')
		await mkdir(out, { recursive: true })
		await symlink('..', join(out, 'alias'))
		await expect(extractTar(parseTar(tar(entries)), out, { strip: 1 })).rejects.toThrow('Refusing')
		expect(await readdir(join(target, 'a/b'))).toStrictEqual(['out'])
	})

	test('refuses a too deeply nested path', async () => {
		const entries: TarEntry[] = [{ type: 'file', path: `top/${'a/'.repeat(300)}x`, mode: 0o644, data: new Uint8Array() }]
		await expect(extractTar(entries, join(await createTempDir(), 'out'), { strip: 1 })).rejects.toThrow('too deeply nested path')
	})

	test('refuses a symlink resolving through a file', async () => {
		const archive = tar([{ path: 'top/f.txt', data: 'x' }, { path: 'top/link', type: '2', link: 'f.txt/x/../g' }])
		await expect(extract(archive)).rejects.toThrow('symlink resolving through a file')
	})

	test('refuses an overlong path', async () => {
		const entries: TarEntry[] = [{ type: 'file', path: `top/${'a/'.repeat(5000)}x`, mode: 0o644, data: new Uint8Array() }]
		await expect(extractTar(entries, join(await createTempDir(), 'out'), { strip: 1 })).rejects.toThrow('overlong path')
	})

	test('allows a symlink to a symlink inside the template', async () => {
		const target = await extract(tar([
			{ path: 'top/c.txt', data: 'c' },
			{ path: 'top/b', type: '2', link: 'c.txt' },
			{ path: 'top/a', type: '2', link: 'b' },
		]))
		expect(await readFile(join(target, 'out/a'), 'utf8')).toBe('c')
	})

	test('ignores unusual names outside the requested subdirectory', async () => {
		const target = await createTempDir()
		const entries = parseTar(tar([{ path: 'top/other/back\\slash.txt', data: 'x' }, { path: 'top/tpl/a.txt', data: 'a' }]))
		await extractTar(entries, join(target, 'out'), { strip: 1, subdir: ['tpl'] })
		expect(await readdir(join(target, 'out'))).toStrictEqual(['a.txt'])
	})

	test('reads GNU long names and long link targets', async () => {
		const longName = `top/${'n'.repeat(120)}.txt`
		const longLink = `${'n'.repeat(120)}.txt`
		const target = await extract(tar([
			{ path: '././@LongLink', type: 'L', data: `${longName}\0` },
			{ path: 'top/truncated', data: 'long' },
			{ path: '././@LongLink', type: 'K', data: `${longLink}\0` },
			{ path: 'top/link', type: '2', link: 'truncated' },
		]))
		expect(await readFile(join(target, 'out', `${'n'.repeat(120)}.txt`), 'utf8')).toBe('long')
		expect(await readlink(join(target, 'out/link'))).toBe(longLink)
	})

	test('rejects hard links and other entry types', () => {
		expect(() => parseTar(tar([{ path: 'top/a', type: '1', link: 'top/b' }]))).toThrow('Unsupported tar entry')
		expect(() => parseTar(tar([{ path: 'top/fifo', type: '6' }]))).toThrow('Unsupported tar entry')
	})

	test('rejects a PAX size that is not a plain number', () => {
		const record = '14 size=-1600\n'
		expect(() => parseTar(tar([{ path: 'pax', type: 'x', data: record }, { path: 'top/a', data: '' }]))).toThrow('unreadable PAX size')
	})

	test('rejects a corrupted header and a truncated archive', () => {
		const archive = tar([{ path: 'top/a.txt', data: 'hello' }])
		const corrupted = new Uint8Array(archive)
		corrupted[0] = 'X'.charCodeAt(0)
		expect(() => parseTar(corrupted)).toThrow('checksum')
		expect(() => parseTar(archive.subarray(0, 512))).toThrow('exceeds the archive')
	})

	test('keeps paths from PAX headers', async () => {
		const pax = `path=top/${'p'.repeat(150)}.txt\n`
		const record = `${pax.length + 4} ${pax}`
		const target = await extract(tar([{ path: 'pax', type: 'x', data: record }, { path: 'ignored', data: 'pax' }]))
		expect(await readFile(join(target, 'out', `${'p'.repeat(150)}.txt`), 'utf8')).toBe('pax')
	})
})
