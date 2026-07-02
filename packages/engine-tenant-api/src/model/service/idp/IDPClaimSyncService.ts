import { DatabaseContext } from '../../utils/index.js'
import { ClaimMapping, ClaimMappingRule, DEFAULT_SYNC_POLICY, DEFAULT_UNMATCHED } from './ClaimMapping.js'
import { evaluateClaimMapping, MappedMembership } from './ClaimMappingEvaluator.js'
import { validateClaimMappingMembership } from './ClaimMappingValidation.js'
import { ProjectSchemaResolver } from '../../type/index.js'
import { Acl, ProjectRole } from '@contember/schema'
import { MembershipResolver } from '@contember/schema-utils'
import { ProjectBySlugQuery, ProjectMembershipByIdentityQuery } from '../../queries/index.js'
import { CreateOrUpdateProjectMembershipCommand, RemoveProjectMembershipCommand } from '../../commands/index.js'

export type ClaimMappingSnapshot = {
	readonly memberships: readonly MappedMembership[]
}

export type ClaimMappingAudit = {
	readonly before: ClaimMappingSnapshot
	readonly after: ClaimMappingSnapshot
	readonly syncPolicy: NonNullable<ClaimMapping['syncPolicy']>
	readonly unmatched: NonNullable<ClaimMapping['unmatched']>
}

export type ClaimMappingSyncResult = {
	/** Membership before/after delta — present only when the apply actually changed grants. */
	readonly audit: ClaimMappingAudit | null
	/** True when the apply-time safety backstop dropped one or more configured rules (a fail-open marker for the caller's audit). */
	readonly droppedUnsafeRules: boolean
}

/**
 * Applies an IdP's `claimMapping` (A09) after a person has been resolved: evaluates the declarative
 * rules against the IdP claims and grants the resulting project memberships, honouring the per-IdP
 * `syncPolicy` (`always` vs `sticky`) and `unmatched` (`keep` vs `remove`) settings. The mapping
 * grants project memberships only — never global/tenant roles (see {@link ClaimMapping}).
 *
 * Runs at sign-in (inside the sign-in transaction) and, for `always` mappings, again on each OIDC
 * session refresh (see `IdpSessionRevalidator`). Returns a {@link ClaimMappingSyncResult}: an
 * `{ before, after }` audit delta (`null` when nothing changed) plus `droppedUnsafeRules` (true when the
 * apply-time safety backstop dropped a configured rule). The caller emits the `idp_role_mapped` audit
 * from the delta and the `idp_role_mapping_failed` fail-open marker from `droppedUnsafeRules` — audit
 * lives at the caller layer, never here.
 *
 * The caller parses the mapping (via {@link parseClaimMapping}) and decides the fail-open policy: a
 * malformed config is caught by the caller before this runs, while a DB error raised here propagates
 * so the surrounding transaction rolls back the partial apply (no half-applied grants).
 */
export class IDPClaimSyncService {
	constructor(
		private readonly projectSchemaResolver: ProjectSchemaResolver,
	) {
	}

	async sync(
		db: DatabaseContext,
		mapping: ClaimMapping,
		claims: Record<string, unknown>,
		identity: { id: string },
		isNewPerson: boolean,
		options: { allowRemoval?: boolean } = {},
	): Promise<ClaimMappingSyncResult> {
		if (mapping.rules.length === 0) {
			return { audit: null, droppedUnsafeRules: false }
		}

		const syncPolicy = mapping.syncPolicy ?? DEFAULT_SYNC_POLICY
		// `unmatched: 'remove'` reconciliation is only safe when the claim surface is COMPLETE: a rule that
		// matched at sign-in but is missing from a partial surface would strip a legitimate membership with no
		// IdP change. At sign-in the surface is always complete, so the caller leaves removal enabled. On the
		// OIDC refresh path the caller passes `allowRemoval` per surface completeness (see IdpSessionRevalidator):
		// a `method: 'refresh'` that rebuilt sign-in's id-token + userinfo surface enables removal (refresh then
		// reconciles exactly like sign-in); a partial surface (userinfo-only probe, or a failed userinfo fetch)
		// disables it so refresh stays additive-only. The audit below reflects this effective value.
		const unmatched = options.allowRemoval === false ? 'keep' : (mapping.unmatched ?? DEFAULT_UNMATCHED)

		// `sticky`: only apply at account creation; an existing account keeps whatever it has. This is
		// also what bounds refresh-sync to `always` mappings — a refresh passes `isNewPerson: false`.
		if (syncPolicy === 'sticky' && !isNewPerson) {
			return { audit: null, droppedUnsafeRules: false }
		}

		// Apply-time safety backstop (A09): re-validate each granted membership against the project's LIVE
		// ACL schema and drop any that fails (fail-closed) — condition-injection above all, but ANY error
		// (unknown role/variable, a malformed condition value, an unsafe predefined). Config-time validation
		// (`IDPManager.assertValidClaimMapping`) is the primary guard, but it is skipped when the target
		// project does not exist yet, is never re-run when it is later created, and a variable's ACL type can
		// drift (e.g. entity → condition) after the mapping was authored. A dropped rule is removed from BOTH
		// the granted set and the removal vocabulary below (both derived from `rules`), so an unsafe rule
		// neither grants nor drives reconciliation. The caller is told a drop happened (`droppedUnsafeRules`)
		// so it can emit the `idp_role_mapping_failed` fail-open marker.
		const { safe: rules, dropped, aclByProject } = await this.dropUnsafeRules(db, mapping.rules)

		// Apply-time safety backstop, part 2 (A09): RUNTIME re-validation of the EVALUATED memberships.
		// `dropUnsafeRules` above only sees each rule's static CONFIG shape, so — like config-time validation —
		// it tolerates a missing membership variable (an A09 grant may set only some of a role's variables).
		// Once the claims are evaluated we know each membership EXACTLY as it would be written, and can
		// fail-close on the one case that tolerance makes unsafe: an `admin` grant whose claim-derived scoping
		// variable resolved empty, which would otherwise persist a bare, UNSCOPED `admin` membership (see
		// {@link dropUnsafeEvaluatedMemberships}). Both drop sets feed the `droppedUnsafeRules` fail-open marker.
		const evaluated = evaluateClaimMapping({ ...mapping, rules }, claims)
		const { safe: memberships, dropped: droppedMemberships } = this.dropUnsafeEvaluatedMemberships(evaluated, aclByProject)
		const droppedUnsafeRules = dropped.length > 0 || droppedMemberships.length > 0

		// The mapping's membership "vocabulary": every (project, role) any rule could grant a membership
		// for. Removal is strictly bounded to this set so memberships and variable names managed outside
		// the mapping are never stripped, even under `unmatched: 'remove'`.
		const vocabularyMemberships = new Map<string, Set<string>>()
		for (const rule of rules) {
			if (rule.grantMembership) {
				const roles = vocabularyMemberships.get(rule.grantMembership.project) ?? new Set<string>()
				roles.add(rule.grantMembership.role)
				vocabularyMemberships.set(rule.grantMembership.project, roles)
			}
		}
		const before = await this.snapshot(db, identity.id, vocabularyMemberships)

		await this.applyMemberships(db, identity.id, memberships, vocabularyMemberships, unmatched)

		const after = await this.snapshot(db, identity.id, vocabularyMemberships)

		if (snapshotEquals(before, after)) {
			return { audit: null, droppedUnsafeRules }
		}

		return { audit: { before, after, syncPolicy, unmatched }, droppedUnsafeRules }
	}

	/**
	 * Partition rules into those safe to apply and those dropped by the apply-time safety backstop. A rule
	 * is dropped when its granted membership produces ANY validation error against the project's CURRENT ACL
	 * schema (fail-closed) — condition-injection above all, but also an unknown role/variable, a malformed
	 * condition value, or a forbidden predefined variable. A validation throw is treated as unsafe (we cannot
	 * prove the grant safe). Schemas (and, when needed, project existence) are resolved at most once per
	 * project. The dropped set is returned so the caller can emit a fail-open audit marker.
	 *
	 * When `getSchema` returns no ACL it does NOT mean "the project does not exist": it returns undefined both
	 * for a project that has no row yet AND for one whose row exists but whose container / content schema is
	 * momentarily unresolvable (mid-provisioning, transient). The two need OPPOSITE handling, so we
	 * disambiguate via the tenant `project` table:
	 *   - no project row → the grant is genuinely inert (`applyMemberships` resolves the same slug and skips
	 *     it, so nothing is written). KEEP the rule for when the project is created later.
	 *   - project row EXISTS but the ACL is unresolvable → `applyMemberships` WOULD still write the membership
	 *     (it resolves the slug from the tenant `project` table, independent of the content schema), so an
	 *     UNVALIDATED grant — including a claim-derived value targeting a `condition` ACL variable — could
	 *     land. Fail closed: DROP the rule (it re-applies on a later sign-in once the schema resolves). This
	 *     matches the direct add-member path, which refuses a membership whose project schema can't be resolved.
	 *
	 * Returns the per-project ACL map it built (`aclByProject`) so the runtime backstop
	 * ({@link dropUnsafeEvaluatedMemberships}) can re-use it without re-resolving any schema.
	 */
	private async dropUnsafeRules(
		db: DatabaseContext,
		rules: readonly ClaimMappingRule[],
	): Promise<{ safe: ClaimMappingRule[]; dropped: ClaimMappingRule[]; aclByProject: Map<string, Acl.Schema | null> }> {
		const aclByProject = new Map<string, Acl.Schema | null>()
		const projectExistsBySlug = new Map<string, boolean>()
		const safe: ClaimMappingRule[] = []
		const dropped: ClaimMappingRule[] = []
		for (const rule of rules) {
			const membership = rule.grantMembership
			if (!membership) {
				safe.push(rule)
				continue
			}
			if (!aclByProject.has(membership.project)) {
				const schema = await this.projectSchemaResolver.getSchema(membership.project)
				aclByProject.set(membership.project, schema?.acl ?? null)
			}
			const acl = aclByProject.get(membership.project) ?? null
			if (acl === null) {
				if (!projectExistsBySlug.has(membership.project)) {
					const project = await db.queryHandler.fetch(new ProjectBySlugQuery(membership.project))
					projectExistsBySlug.set(membership.project, project != null)
				}
				// project row exists but its ACL is unresolvable → can't prove the grant safe → drop (fail-closed);
				// no row yet → genuinely inert, keep for a project created later.
				if (projectExistsBySlug.get(membership.project)) {
					dropped.push(rule)
				} else {
					safe.push(rule)
				}
				continue
			}
			let unsafe: boolean
			try {
				unsafe = validateClaimMappingMembership(acl, membership).length > 0
			} catch {
				unsafe = true
			}
			if (unsafe) {
				dropped.push(rule)
			} else {
				safe.push(rule)
			}
		}
		return { safe, dropped, aclByProject }
	}

	/**
	 * RUNTIME companion to {@link dropUnsafeRules} (A09 apply-time backstop, part 2). `dropUnsafeRules`
	 * validates each rule's static CONFIG shape and — like config-time validation — TOLERATES a missing
	 * membership variable (`VARIABLE_EMPTY`): an A09 grant may legitimately set only some of a role's
	 * variables. For an ordinary role that tolerance is safe: a variable that resolves to no value just
	 * narrows CONTENT access (the membership resolver maps it to `{ never: true }` — strictly LESS access,
	 * never more), and a role's tenant permissions are matched against that role's OWN tenant rule (a
	 * missing variable there denies, never escalates).
	 *
	 * The ONE role that breaks the assumption is the project `admin` role: {@link ProjectScope} grants the
	 * PROJECT_ADMIN tenant role (project secrets, member management, IdP config, deploy, …) to ANY identity
	 * holding an `admin` membership in the project — keyed on the role NAME alone, independent of the
	 * membership's variables. So when a claim-derived variable meant to SCOPE an `admin` grant resolves
	 * empty, `applyMemberships` drops the empty variable before the write and persists a BARE `admin`
	 * membership — i.e. UNSCOPED project-admin, even though the operator intended a scoped grant, and a
	 * membership the direct add-member path ({@link MembershipResolver}, via `MembershipValidator`) would
	 * REJECT as `VARIABLE_EMPTY`. (`admin` is the only role-name-based grant in the whole authorization
	 * layer; every other privilege is gated by ACL variables/predicates, so it cannot be widened this way.)
	 *
	 * So, fail-closed, we re-validate every evaluated `admin` grant EXACTLY as it would be written (empty
	 * variables filtered out, as `applyMemberships` does) against the live ACL and DROP it if the resolver
	 * reports any error — i.e. if a required (non-fallback) `admin` variable would be absent. Under `keep`
	 * the bare grant is then never written; under `remove` it is absent from the granted set, so
	 * reconciliation revokes any pre-existing one. Non-`admin` grants are left untouched (their partial
	 * grants stay valid). The drop folds into `droppedUnsafeRules`, so the caller still emits the
	 * `idp_role_mapping_failed` fail-open marker.
	 */
	private dropUnsafeEvaluatedMemberships(
		memberships: readonly MappedMembership[],
		aclByProject: ReadonlyMap<string, Acl.Schema | null>,
	): { safe: MappedMembership[]; dropped: MappedMembership[] } {
		const resolver = new MembershipResolver()
		const safe: MappedMembership[] = []
		const dropped: MappedMembership[] = []
		for (const membership of memberships) {
			const acl = aclByProject.get(membership.project) ?? null
			// Only `admin` is privileged by role name independent of its variables (see above). A null ACL means
			// the project has no row yet — an existing-but-unresolvable project had its rule dropped upstream, so
			// it never reaches here — so the grant is inert (`applyMemberships` skips the missing project): keep it.
			if (membership.role !== ProjectRole.ADMIN || acl === null) {
				safe.push(membership)
				continue
			}
			// Validate the membership as it will be persisted: `applyMemberships` filters out empty-valued
			// variables before the write, so an unset required (non-fallback) variable surfaces here as
			// `VARIABLE_EMPTY`, exactly as the direct add-member path reports and rejects it. Any error ⇒ unsafe.
			const written: Acl.Membership = {
				role: membership.role,
				variables: membership.variables.filter(it => it.values.length > 0).map(it => ({ name: it.name, values: [...it.values] })),
			}
			let unsafe: boolean
			try {
				unsafe = resolver.resolve(acl, [written], MembershipResolver.UnknownIdentity, false).errors.length > 0
			} catch {
				unsafe = true
			}
			if (unsafe) {
				dropped.push(membership)
			} else {
				safe.push(membership)
			}
		}
		return { safe, dropped }
	}

	// Membership writes are driven through the low-level commands directly (as InviteManager also does),
	// not via ProjectMemberManager (the "normal" add/update-member path): A09 needs semantics that path does
	// not offer — empty-value hard-delete avoidance under `keep`, and vocabulary-bounded removal under `remove`.
	private async applyMemberships(
		db: DatabaseContext,
		identityId: string,
		grantedMemberships: readonly MappedMembership[],
		vocabularyMemberships: ReadonlyMap<string, ReadonlySet<string>>,
		unmatched: NonNullable<ClaimMapping['unmatched']>,
	): Promise<void> {
		// Group granted memberships by project so each project is resolved (slug -> id) only once.
		const byProject = new Map<string, MappedMembership[]>()
		for (const membership of grantedMemberships) {
			const list = byProject.get(membership.project) ?? []
			list.push(membership)
			byProject.set(membership.project, list)
		}

		// Under `remove`, reconcile every project in the mapping's membership vocabulary — not only the
		// projects granted this sign-in — so a membership whose claim disappeared entirely (its project is
		// then absent from `byProject`) is still revoked. `keep` only ever touches the projects it grants.
		const projectSlugs = unmatched === 'remove'
			? new Set([...vocabularyMemberships.keys(), ...byProject.keys()])
			: new Set(byProject.keys())

		for (const projectSlug of projectSlugs) {
			const project = await db.queryHandler.fetch(new ProjectBySlugQuery(projectSlug))
			if (!project) {
				// Mapping references a project that does not exist (or was deleted) — skip it rather
				// than fail the whole sign-in. The audit's before/after won't reflect it.
				continue
			}

			const memberships = byProject.get(projectSlug) ?? []
			const grantedRoles = new Set(memberships.map(it => it.role))

			if (unmatched === 'remove') {
				// Removal is bounded to the mapping's own membership vocabulary (project::role named by some
				// rule): a role the mapping could grant but doesn't this sign-in is stripped, while a
				// membership role no rule names (managed outside the mapping) is left untouched.
				const vocabularyRoles = vocabularyMemberships.get(projectSlug) ?? new Set<string>()
				const existing = await db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: project.id }, [identityId]))
				for (const membership of existing) {
					if (vocabularyRoles.has(membership.role) && !grantedRoles.has(membership.role)) {
						await db.commandBus.execute(new RemoveProjectMembershipCommand(project.id, identityId, membership.role))
					}
				}
			}

			for (const membership of memberships) {
				// Under `remove` the IdP is the source of truth, and the system does NOT allow an empty membership
				// variable — the direct add-member path hard-deletes a membership whose variable resolves to no
				// values (`CreateOrUpdateProjectMembershipCommand` deletes such a row), and the membership
				// resolver reports a missing/empty variable as VARIABLE_EMPTY. So a DECLARED variable that resolves
				// to no values means the grant is empty-scoped and meaningless: REVOKE the whole membership,
				// consistently with that invariant, rather than leaving a role with a missing/empty variable. (CORR-1:
				// clearing the variable to `[]` instead would, for a `condition` variable, parse to `{ or: [] }` =
				// allow-all — the opposite of revoking.) Under `keep` we never revoke, so an empty variable is simply
				// not applied below and the grant stays.
				if (unmatched === 'remove' && membership.variables.some(it => it.values.length === 0)) {
					await db.commandBus.execute(new RemoveProjectMembershipCommand(project.id, identityId, membership.role))
					continue
				}

				await db.commandBus.execute(
					new CreateOrUpdateProjectMembershipCommand(
						project.id,
						identityId,
						{
							role: membership.role,
							// Drop variables with no values: an unset variable simply isn't applied (a role with no
							// variables is fine — it sends none). Under `keep` this is the only empty-handling; under
							// `remove` an empty DECLARED variable already revoked the whole membership above. Because the
							// filtered list never carries an empty `set`, the command's hard-delete-on-empty never fires
							// here — so `keep` never revokes a grant, and `remove`'s revocation stays explicit above.
							variables: membership.variables
								.filter(it => it.values.length > 0)
								.map(it => ({ name: it.name, set: [...it.values] })),
						},
					),
				)
			}
		}
	}

	/**
	 * Snapshot the identity's mapping-relevant memberships for the audit delta: its memberships (with
	 * variable values) for exactly the (project, role) pairs in the mapping's vocabulary. Bounding is by
	 * (project, role) — a membership whose ROLE no rule names is excluded entirely — which keeps the audit
	 * consistent with the (also vocabulary-bounded) reconciliation. NOTE the bound is per-(project, role),
	 * NOT per-variable-name: for an in-vocabulary membership ALL its variables are snapshotted, including any
	 * variable managed OUTSIDE the mapping on that same role (e.g. an admin-set `condition` filter), and a
	 * `passthrough` variable's value IS the verbatim external claim value. So the idp_role_mapped event_data
	 * can disclose claim-derived / admin-managed variable values for a mapped role to system:viewAuthLog
	 * readers — by design (the recorded value is the ACL grant being audited). Variable values are included
	 * so a sign-in that only changes a claim-derived membership variable — itself a row-level ACL grant — is
	 * still detected as a change and audited.
	 */
	private async snapshot(
		db: DatabaseContext,
		identityId: string,
		vocabularyMemberships: ReadonlyMap<string, ReadonlySet<string>>,
	): Promise<ClaimMappingSnapshot> {
		const memberships: MappedMembership[] = []
		for (const [slug, roles] of vocabularyMemberships) {
			const project = await db.queryHandler.fetch(new ProjectBySlugQuery(slug))
			if (!project) {
				continue
			}
			const rows = await db.queryHandler.fetch(new ProjectMembershipByIdentityQuery({ id: project.id }, [identityId]))
			for (const row of rows) {
				// Only the roles the mapping itself could grant: a membership role no rule names (managed outside
				// the mapping) is neither reconciled nor disclosed in the audit delta.
				if (roles.has(row.role)) {
					memberships.push({ project: slug, role: row.role, variables: row.variables })
				}
			}
		}

		return { memberships: sortMemberships(memberships) }
	}
}

// Stable ordering (memberships by project+role, variables by name, values sorted) so `snapshotEquals`
// compares by content, not by the DB's row/array order. Assumes variable `values` are always JSON
// string arrays (which they are — the membership commands only ever store `string[]`); a non-string
// element would make the default sort order-unstable and the JSON.stringify comparison spurious, so
// keep variable values string-typed.
const sortMemberships = (memberships: readonly MappedMembership[]): readonly MappedMembership[] =>
	[...memberships]
		.map(membership => ({
			project: membership.project,
			role: membership.role,
			variables: [...membership.variables]
				.map(variable => ({ name: variable.name, values: [...variable.values].sort() }))
				.sort((a, b) => a.name.localeCompare(b.name)),
		}))
		.sort((a, b) => a.project.localeCompare(b.project) || a.role.localeCompare(b.role))

const snapshotEquals = (a: ClaimMappingSnapshot, b: ClaimMappingSnapshot): boolean => JSON.stringify(a) === JSON.stringify(b)
