import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		you have been invited to contribute on project {{project}}.<br>
		An account has been created for you with a following credentials:
	</p>
	<table>
		<tr>
			<th>E-mail:</th>
			<td>{{email}}</td>
		</tr>
		<tr>
			<th>Password:</th>
			<td>{{password}}</td>
		</tr>
	</table>
`)
