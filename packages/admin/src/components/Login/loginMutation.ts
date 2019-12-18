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
