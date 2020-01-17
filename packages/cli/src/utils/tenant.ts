import prompts from 'prompts'
import { GraphQLClient } from 'graphql-request'
import { Input } from '../cli'
import {
	getDefaultInstance,
	getInstanceStatus,
	InstanceEnvironment,
	readInstanceConfig,
	resolveInstanceEnvironment,
} from './instance'

export type TenantInstanceEnvironment = {
	url: string
} & (
	| ({
			type: 'local'
	  } & InstanceEnvironment)
	| { type: 'remote' }
)
export const createTenantApiUrl = (url: string) => {
	if (url.endsWith('/')) {
		url = url.substring(0, url.length - 1)
	}
	if (url.endsWith('/tenant')) {
		return url
	}
	return url + '/tenant'
}

export const resolveTenantInstanceEnvironmentFromInput = async (
	inputCommand: Input<{
		instance?: string
	}>,
): Promise<TenantInstanceEnvironment> => {
	const workspaceDirectory = process.cwd()
	let [instanceName] = [
		inputCommand.getArgument('instance') ||
			process.env.CONTEMBER_INSTANCE ||
			(await getDefaultInstance({ workspaceDirectory })),
	]
	if (instanceName.includes('://')) {
		return { type: 'remote', url: createTenantApiUrl(instanceName) }
	}
	const instanceEnv = await resolveInstanceEnvironment({ workspaceDirectory, instanceName })
	const instanceStatus = await getInstanceStatus(instanceEnv)
	const runningApi = instanceStatus.find(it => it.name === 'api' && it.running)
	if (!runningApi) {
		throw `Instance ${instanceName} is not running. Run instance:up first.`
	}
	const apiServer = `http://127.0.0.1:${runningApi.ports[0].hostPort}`
	return { type: 'local', ...instanceEnv, url: createTenantApiUrl(apiServer) }
}

export const interactiveResolveLoginToken = async (instance: TenantInstanceEnvironment) => {
	if (process.env.CONTEMBER_LOGIN_TOKEN) {
		return process.env.CONTEMBER_LOGIN_TOKEN
	}
	if (instance.type === 'local') {
		const config = await readInstanceConfig(instance)
		if (config.loginToken) {
			return config.loginToken
		}
	}
	const { loginToken } = await prompts({
		type: 'text',
		name: 'loginToken',
		message: 'Login token',
	})
	return loginToken
}

const createClient = (url: string, token: string) =>
	new GraphQLClient(createTenantApiUrl(url), {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	})

export const interactiveSignIn = async ({
	apiUrl,
	loginToken,
	expiration,
}: {
	apiUrl: string
	loginToken: string
	expiration?: number
}): Promise<string> => {
	const { email, password } = await prompts([
		{
			type: 'text',
			name: 'email',
			message: 'E-mail',
		},
		{
			type: 'password',
			name: 'password',
			message: 'Password',
		},
	])
	if (!expiration) {
		;({ expiration } = await prompts({
			type: 'number',
			name: 'expiration',
			message: 'Expiration in seconds',
			float: false,
			initial: 3600 * 365,
		}))
	}

	const query = `mutation($email: String!, $password: String!, $expiration: Int!) {
  signIn(email: $email, password: $password, expiration: $expiration) {
    ok
    errors {
      code
    }
    result {
      token
    }
  }
}`

	const client = createClient(apiUrl, loginToken)
	const result = await client.request(query, { email, password, expiration })
	if (!result.signIn.ok) {
		throw result.signIn.errors.map((it: any) => it.code)
	}
	return result.signIn.result.token
}

export const interactiveSetup = async (apiUrl: string): Promise<{ loginToken: string }> => {
	const { email, password } = await prompts([
		{
			type: 'text',
			name: 'email',
			message: 'Superadmin email',
		},
		{
			type: 'password',
			name: 'password',
			message: 'Superadmin password',
			validate: password => (password.length < 6 ? 'Password must contain at least 6 characters' : true),
		},
	])

	const query = `mutation($email: String!, $password: String!) {
  setup(superadmin: {email: $email, password: $password}) {
    ok
    result {
      loginKey {
        token
      }
    }
  }
}`

	const client = createClient(apiUrl, '12345123451234512345')
	const result = await client.request(query, { email, password })
	console.log('Superadmin created.')
	console.log('Login token:')
	const loginToken = result.setup.result.loginKey.token
	return { loginToken }
}

export const interactiveResolveApiToken = async ({
	instance,
}: {
	instance: TenantInstanceEnvironment
}): Promise<string> => {
	if (process.env.CONTEMBER_API_TOKEN) {
		return process.env.CONTEMBER_API_TOKEN
	}
	if (instance.type === 'local') {
		const config = await readInstanceConfig(instance)
		if (config.apiToken) {
			return config.apiToken
		}
	}
	const { strategy } = await prompts({
		type: 'select',
		name: 'strategy',
		message: 'Authentication',
		choices: [
			{ value: 'signin', title: 'Sign in using email and password' },
			{ value: 'token', title: 'Enter an API token' },
		],
	})
	if (strategy === 'signin') {
		const loginToken = await interactiveResolveLoginToken(instance)
		return await interactiveSignIn({ apiUrl: instance.url, loginToken, expiration: 60 * 5 })
	}
	const { token } = await prompts({
		type: 'text',
		name: 'token',
		message: 'API token',
	})

	return token
}
interface Project {
	slug: string
	roles: {
		name: string
		variables: {
			name: string
		}[]
	}[]
}

export const listProjects = async ({
	instance,
	apiToken,
}: {
	instance: TenantInstanceEnvironment
	apiToken: string
}): Promise<Project[]> => {
	const client = createClient(instance.url, apiToken)
	const response = await client.request(`query {
  me {
    projects {
      project {
        slug
        roles {
          name
          variables {
            name
          }
        }
      }
    }
  }
}`)

	return response.me.projects.map((it: any) => it.project)
}

type MembershipVariable = {
	name: string
	values: string[]
}
type Membership = {
	role: string
	variables: MembershipVariable[]
}
export const interactiveCreateApiKey = async ({
	instance,
	apiToken,
}: {
	instance: TenantInstanceEnvironment
	apiToken: string
}): Promise<{ id: string; token: string }> => {
	const projects = await listProjects({ instance, apiToken })
	const { projectSlug } = await prompts({
		type: 'select',
		message: 'Project',
		name: 'projectSlug',
		choices: projects.map(it => ({ value: it.slug, title: it.slug })),
	})
	const project = projects.find(it => it.slug === projectSlug)
	if (!project) {
		throw new Error()
	}
	const memberships: Membership[] = []
	let choices = project.roles.map(({ name }) => ({ value: name, title: name }))
	let another = false
	do {
		const { roleName } = await prompts({
			type: 'select',
			message: 'Role',
			name: 'roleName',
			choices: choices,
		})
		choices = choices.filter(it => it.value !== roleName)
		const role = project.roles.find(it => it.name === roleName)
		if (!role) {
			throw new Error()
		}
		const membership: Membership = { role: role.name, variables: [] }
		memberships.push(membership)
		for (const variable of role.variables) {
			const { values } = await prompts({
				type: 'list',
				message: `Values for ${variable.name} (comma separated)`,
				name: 'values',
				// @ts-ignore
				separator: ',',
			})
			membership.variables.push({ name: variable.name, values })
		}
		if (choices.length) {
			;({ another } = await prompts({
				name: 'another',
				message: 'Do you want to add another role?',
				type: 'confirm',
				initial: false,
			}))
		} else {
			another = false
		}
	} while (another)
	console.log(`project: ${project.slug}`)
	console.log('memberships:')
	console.log(JSON.stringify(memberships, null, '  '))
	const { ok } = await prompts({
		name: 'ok',
		message: 'Are you sure you want to create this API key?',
		type: 'confirm',
		inactive: 'no, start again',
	})
	if (!ok) {
		return await interactiveCreateApiKey({ instance, apiToken })
	}

	const query = `mutation($projectSlug: String!, $memberships: [MembershipInput!]!) {
  createApiKey(projectSlug: $projectSlug, memberships: $memberships) {
    ok
    errors {
      code
    }
    result {
      apiKey {
        id
        token
      }
    }
  }
}`
	const client = createClient(instance.url, apiToken)
	const response = await client.request(query, { projectSlug: project.slug, memberships })
	if (!response.createApiKey.ok) {
		throw response.createApiKey.errors.map((it: any) => it.code)
	}
	return response.createApiKey.result.apiKey
}
