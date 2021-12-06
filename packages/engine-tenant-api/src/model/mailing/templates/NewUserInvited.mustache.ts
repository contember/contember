import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,<br>you have been invited to contribute on project {{project}}.</p>
	{{#password}}
		<p>An account has been created for you with a following credentials:</p>
		<table>
			<tr><th>E-mail:</th><td>{{email}}</td></tr>
			<tr><th>Password:</th><td>{{password}}</td></tr>
		</table>
	{{/password}}
	{{#token}}
		<p>An account for e-mail <strong>{{email}}</strong> has been created.</p>
		<p>To setup a password, use following code in appropriate interface:</p>
		<code>{{token}}</code>
	{{/token}}
`)
