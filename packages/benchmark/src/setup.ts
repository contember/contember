import { readFile } from 'fs'
import { promisify } from 'util'
import { join } from 'path'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore-line
import { graphqlRequest } from './http'

const fileRead = promisify(readFile)

const setup = async (tenantEndpoint: string): Promise<string> => {
	const setupResponse = await graphqlRequest({
		endpoint: tenantEndpoint,
		authorizationToken: '12345123451234512345',
		query: `mutation {
  setup(superadmin: { email: "admin@example.com", password: "123456" }) {
    ok
    result {
      superadmin {
        id
      }
      loginKey {
        id
        token
        identity {
          id
        }
      }
    }
  }
}`,
	})

	if (!setupResponse.data.setup.ok) {
		throw new Error('Invalid setup response')
	}

	return setupResponse.data.setup.result.loginKey.token
}

const login = async (tenantEndpoint: string, loginToken: string): Promise<string> => {
	const loginResponse = await graphqlRequest({
		endpoint: tenantEndpoint,
		authorizationToken: loginToken,
		query: `mutation {
  signIn(email: "admin@example.com", password: "123456") {
    ok
    errors {
      code
    }
    result {
      token
      person {
        identity {
          id
        }
      }
    }
  }
}`,
	})

	if (!loginResponse.data.signIn.ok) {
		console.log(loginResponse.data.signIn)
		throw new Error('Invalid login response')
	}

	return loginResponse.data.signIn.result.token
}

const dataInit = async (contentEndpoint: string, accessToken: string) => {
	const initGql = await fileRead(join(__dirname, '/../../src/init.graphql'), { encoding: 'utf8' })

	await graphqlRequest({
		endpoint: contentEndpoint,
		query: initGql,
		authorizationToken: accessToken,
	})
}
;(async () => {
	const serverPort = process.env.CONTEMBER_PORT
	const tenantEndpoint = `http://localhost:${serverPort}/tenant`
	const contentEndpoint = `http://localhost:${serverPort}/content/app/prod`

	const loginToken = await setup(tenantEndpoint)
	const accessToken = await login(tenantEndpoint, loginToken)

	await dataInit(contentEndpoint, accessToken)

	console.log(accessToken)
})().catch(e => {
	console.error(e)
	process.exit(1)
})
