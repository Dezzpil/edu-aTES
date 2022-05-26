CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id serial,
    public_id text not null unique,
    email text not null,
    role user_role not null ,
    PRIMARY KEY (id)
);

INSERT INTO users (public_id, email, role) VALUES ('59bd60f5-ac22-4161-a2a0-a5bf1e64973d', 'n.dezz.orlov@yandex.com', 'admin');

CREATE TABLE tasks (
    id serial,
    public_id uuid default gen_random_uuid(),
    description text,
    status smallint,
    created_at timestamp default current_timestamp,
    created_by text,
	assigned_at timestamp default current_timestamp,
    assigned_to text,
	completed_at timestamp,
    completed_by text,
    PRIMARY KEY (id)
);
