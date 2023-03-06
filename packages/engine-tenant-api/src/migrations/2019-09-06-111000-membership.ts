import { MigrationBuilder } from '@contember/database-migrations'

const sql = `
CREATE TABLE project_membership (
    id          UUID NOT NULL PRIMARY KEY,
    project_id  UUID NOT NULL,
    identity_id UUID NOT NULL,
    role        TEXT NOT NULL,
    CONSTRAINT project_membership_project FOREIGN KEY (project_id) REFERENCES project(id) ON DELETE CASCADE,
    CONSTRAINT project_membership_identity FOREIGN KEY (identity_id) REFERENCES identity(id) ON DELETE CASCADE
);

CREATE INDEX project_membership_identity_index
    ON project_membership(identity_id);

CREATE UNIQUE INDEX project_membership_unique
    ON project_membership(project_id, identity_id, role);

WITH data AS (SELECT *
              FROM project_member, jsonb_array_elements_text(roles) AS t)
INSERT
INTO project_membership(id, project_id, identity_id, role)
    SELECT public.uuid_generate_v4(), data.project_id, data.identity_id, data.value
    FROM data;

CREATE TABLE project_membership_variable (
    id            UUID  NOT NULL PRIMARY KEY,
    membership_id UUID  NOT NULL,
    variable      TEXT  NOT NULL,
    value         JSONB NOT NULL,
    CONSTRAINT project_membership_variable_unique
        UNIQUE (membership_id, variable),
    CONSTRAINT project_membership_variable_membership FOREIGN KEY (membership_id) REFERENCES project_membership(id) ON DELETE CASCADE
);

WITH data AS (SELECT project_membership.id, project_member_variable.variable, to_jsonb(project_member_variable.values) AS value
              FROM project_membership
                       JOIN project_member_variable
              ON project_membership.identity_id = project_member_variable.identity_id
                  AND project_membership.project_id = project_member_variable.project_id
)
INSERT
INTO project_membership_variable(id, membership_id, variable, value)
    SELECT public.uuid_generate_v4(), data.id, data.variable, data.value
    FROM data;
`

export default async function (builder: MigrationBuilder) {
	builder.sql(sql)
}
