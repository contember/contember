---
title: Identity providers (IdP)
---
An identity provider (IdP) is a service that allows users to authenticate using external accounts, such as Apple ID, Facebook, or other OIDC compatible IdP. By integrating with an identity provider, you can enable your users to sign in to your application using their existing accounts, rather than requiring them to create a new account specifically for your application.

To use an identity provider in Contember, you will need to configure the identity provider in the system and then provide a way for users to initiate the authentication process. This can typically be done by providing a login button or link that redirects the user to the identity provider's authentication page.

Once the user has authenticated with the identity provider, they will be redirected back to your application, where Contember will handle the rest of the authentication process. If the user's identity can be successfully verified, they will be logged in to your application.

## IdP configuration

### Adding new IdP

To add a new identity provider (IdP) in Contember, you will need to use the `addIDP` mutation provided by the [tenant API](./overview.md). This mutation allows you to specify the details of the identity provider you want to add, including its type, configuration, and options.

#### Example how to use the addIDP mutation to add a new OIDC identity provider:

```graphql
mutation {
	addIDP(
		identityProvider: "oidc-provider",
		type: "oidc",
		configuration: {
			url: "https://oidc-provider.com/.well-known/openid-configuration",
			clientId: "YOUR_CLIENT_ID",
			clientSecret: "YOUR_CLIENT_SECRET",
			responseType: "code",
			claims: "openid email"
		},
		options: {
			autoSignUp: true,
			exclusive: false
		}
	) {
		ok
		error {
			code
			developerMessage
		}
	}
}
```

:::note claims vs scope
Note that claims in configuration are actually "scopes" in OIDC terminology. This will be fixed in a future version.
:::

In this example, the identityProvider field is set to "oidc-provider", which is a custom slug that you can use to identify the identity provider in your application. The type field is set to "oidc" to indicate that this is an OIDC identity provider.

The configuration field should include the URL of the provider's OpenID Connect configuration, as well as the client ID and client secret provided by the provider. The responseType and claims fields are optional.

The options field allows you to specify additional options for the identity provider, such as whether to automatically sign up users who don't already have an account and whether to allow only this identity provider for authentication.

If the "ok" in response is `false`, you will find details in `error`, possible error codes are following: `ALREADY_EXISTS`, `UNKNOWN_TYPE`, `INVALID_CONFIGURATION`

### Updating existing IdP

To update an existing identity provider (IdP) in Contember, you will need to use the updateIDP mutation. This mutation allows you to specify the updated details of the identity provider you want to update, including its configuration and options.

#### Example how to use the updateIDP mutation to update an existing OIDC identity provider:

```graphql
mutation {
	updateIDP(
		identityProvider: "oidc-provider",
		configuration: {
			url: "https://new-oidc-provider.com/.well-known/openid-configuration",
			clientId: "NEW_CLIENT_ID",
			clientSecret: "NEW_CLIENT_SECRET",
			responseType: "code",
			claims: "openid email profile"
		},
		options: {
			autoSignUp: false,
			exclusive: false
		}
	) {
		ok
		error {
			code
			developerMessage
		}
	}
}

```
In this example, the identityProvider field is set to "oidc-provider", which is the custom slug that you used to identify the identity provider when you added it to Contember.

The configuration field should include the updated details for the identity provider, such as the URL of the provider's OpenID Connect configuration, the client ID and client secret provided by the provider, and any optional parameters such as responseType and claims.

The options field allows you to specify updated options for the identity provider, such as whether to automatically sign up users who don't already have an account and whether to allow only this identity provider for authentication.

If the "ok" in response is `false`, you will find details in `error`, possible error codes are following: `NOT_FOUND`, `INVALID_CONFIGURATION`

### Temporarily disabling and enabling an IdP

In Contember, you can enable or disable an identity provider (IdP) using the `enableIDP` and `disableIDP` mutations. These mutations allow you to control whether an identity provider is available.

To disable an identity provider, you can use the `disableIDP` mutation like this:

```graphql
mutation {
	disableIDP(identityProvider: "oidc-provider") {
		ok
		error {
			code
			developerMessage
		}
	}
}
```
In this example, the identityProvider field is set to "oidc-provider", which is the custom slug that you used to identify the identity provider when you added it to Contember.

When you execute the disableIDP mutation, it will return a response indicating whether the operation was successful. If the operation was not successful, the ok field will be set to false and the error field will contain details about the error that occurred. Possible error code is `NOT_FOUND`.

To enable a previously disabled identity provider, you can use the enableIDP mutation like this:

```graphql
mutation {
	enableIDP(identityProvider: "oidc-provider") {
		ok
		error {
			code
			developerMessage
		}
	}
}
```
The enableIDP mutation works in a similar way to the disableIDP mutation, with the identityProvider field specifying the custom slug of the identity provider you want to enable.

When you execute the disableIDP mutation, it will return a response indicating whether the operation was successful. If the operation was not successful, the ok field will be set to false and the error field will contain details about the error that occurred. Possible error code is `NOT_FOUND`.

## IdP authentication

You can use the `initSignInIDP` and `signInIDP` mutations to authenticate users using an external identity provider (IdP). The initSignInIDP mutation allows you to initiate the authentication process, while the signInIDP mutation allows you to complete the authentication process and obtain an access token that can be used to authenticate subsequent requests.

To initiate the authentication process, you can use the `initSignInIDP` mutation like this:

```graphql
mutation {
	initSignInIDP(identityProvider: "oidc-provider", redirectUrl: "https://my-app.dev/finish-auth") {
		ok
		error {
			code
			developerMessage
		}
		result {
			authUrl
			sessionData
		}
	}
}
```
In this example, the identityProvider field is set to "oidc-provider", which is the custom slug that you used to identify the OIDC identity provider when you added it to Contember. The redirectUrl field specifies the URL that the user should be redirected to after they have authenticated with the identity provider.


The initSignInIDP mutation will return a response indicating whether the operation was successful. If the "ok" in response is `false`, you will find details in `error`, possible error code is: `PROVIDER_NOT_FOUND`

The result field will contain the authUrl and sessionData that you will need to complete the authentication process, you must store sessionData according to OIDC state and nonce handling recommendation.

To complete the authentication process, you will need to redirect the user to the authUrl provided by the initSignInIDP mutation. The user will be prompted to authenticate with the identity provider, and once they have done so, they will be redirected back to the redirectUrl specified in the initSignInIDP mutation.

Once the user has been redirected back to the redirectUrl, you can use the signInIDP mutation to complete the authentication process and obtain an access token:

```graphql
mutation {
	signInIDP(
		identityProvider: "oidc-provider",
		idpResponse: {
			url: "https://my-app.dev/finish-auth?code=ABC123&state=XYZ789"
		},
		redirectUrl: "https://my-app.dev/finish-auth",
		sessionData: {nonce: "123456",state: "XYZ789"},
		expiration: 3600
	) {
		ok
		error {
			code
			developerMessage
		}
		result {
			token
			person {
				id
				email
			}
		}
	}
}
```
In this example, the identityProvider field is set to "oidc-provider" again, and the idpResponse field includes the URL that the user was redirected to after authenticating with the identity provider. The redirectUrl field must match the redirectUrl specified in the initSignInIDP mutation, and the sessionData field should include the sessionData returned by the initSignInIDP mutation. The expiration field specifies the number of seconds that the access token should be valid for.

The signInIDP mutation returns a response that indicates whether the authentication operation was successful, and if successful, provides an access token that can be used to authenticate subsequent requests.

Here is an example of the response that the signInIDP mutation might return:

```json
{
	"ok": true,
	"error": null,
	"result": {
		"token": "XXX",
		"person": {
			"id": "user-uuid",
			"email": "john.doe@example.com"
		}
	}
}
```

The result field contains the access token in the token field, and information about the authenticated user in the person field.

If the signInIDP mutation was not successful, the ok field would be set to false and the error field would contain details about the error that occurred. Following error codes are possible for this mutation: `INVALID_IDP_RESPONSE`, `IDP_VALIDATION_FAILED`, `PERSON_NOT_FOUND`, `PERSON_ALREADY_EXISTS`
