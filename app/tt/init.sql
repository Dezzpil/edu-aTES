CREATE TYPE userrole AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id serial,
    public_id text not null unique,
    login text not null unique,
    password text not null ,
    role userrole not null ,
    PRIMARY KEY (id)
);

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
