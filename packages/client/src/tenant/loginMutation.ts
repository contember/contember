export type LoginMutationResponse = {
	data: {
		signIn: {
			ok: boolean
			errors: Array<{
				endUserMessage: string | null
				code: string
			}>
			result: {
				token: string
				person: {
					id: string
					email: string
					identity: {
						id: string
						projects: Array<{
							project: {
								id: string
								slug: string
							}
							memberships: Array<{
								role: string
							}>
						}>
					}
				}
			} | null
		}
	}
}

export const loginMutation = `
	mutation($email: String!, $password: String!, $expiration: Int) {
		signIn(email: $email, password: $password, expiration: $expiration) {
			ok
			errors {
				endUserMessage
				code
			}
			result {
				token
				person {
					id
					email
					identity {
						id
						projects {
							project {
								id
								slug
							}
							memberships {
								role
							}
						}
					}
				}
			}
		}
	}
`
