CREATE TYPE userrole AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id text not null unique,
    email text not null,
    role userrole not null ,
    PRIMARY KEY (id)
);

INSERT INTO users (id, email, role) VALUES (gen_random_uuid()::text, 'n.dezz.orlov@yandex.com', 'admin');
INSERT INTO users (id, email, role) VALUES (gen_random_uuid()::text, 'foo@gmail.com', 'worker');
INSERT INTO users (id, email, role) VALUES (gen_random_uuid()::text, 'bar@gmail.com', 'worker');

CREATE TABLE tasks (
    id serial,
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
