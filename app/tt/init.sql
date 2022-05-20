CREATE TYPE userrole AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id serial,
    public_id text not null,
    email text not null,
    role userrole not null ,
    PRIMARY KEY (id)
);

INSERT INTO users (public_id, email, role) VALUES ('59bd60f5-ac22-4161-a2a0-a5bf1e64973d', 'n.dezz.orlov@yandex.com', 'admin');
INSERT INTO users (public_id, email, role) VALUES (gen_random_uuid()::text, 'foo@gmail.com', 'worker');
INSERT INTO users (public_id, email, role) VALUES (gen_random_uuid()::text, 'bar@gmail.com', 'worker');

CREATE TABLE tasks (
    id serial,
    public_id uuid,
    description text,
    status smallint,
    created_at timestamp,
    created_by text,
	assigned_at timestamp,
    assigned_to text,
	completed_at timestamp,
    completed_by text,
    PRIMARY KEY (id)
);
