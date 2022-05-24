CREATE TYPE userrole AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id serial,
    public_id text not null,
    email text not null,
    role userrole not null ,
    PRIMARY KEY (id)
);

INSERT INTO users (public_id, email, role) VALUES ('59bd60f5-ac22-4161-a2a0-a5bf1e64973d', 'n.dezz.orlov@yandex.com', 'admin');

CREATE TABLE balances (
    id serial,
    user_id integer not null unique,
    value bigint default 0,
    PRIMARY KEY (id)
);

INSERT INTO balances (user_id) VALUES (1);

CREATE TABLE tasks (
    id serial,
    public_id text,
    description text,
    status smallint,
	assigned_at timestamp,
    assigned_to_public_id text,
	completed_at timestamp,
    completed_by_public_id text,
    price numeric,
    PRIMARY KEY (id)
);


