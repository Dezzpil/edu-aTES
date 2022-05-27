CREATE TYPE user_role AS ENUM ('admin', 'manager', 'worker');

CREATE TABLE users (
    id serial,
    public_id text unique not null,
    email text not null,
    role user_role not null ,
    PRIMARY KEY (id)
);

INSERT INTO users (public_id, email, role) VALUES ('59bd60f5-ac22-4161-a2a0-a5bf1e64973d', 'n.dezz.orlov@yandex.com', 'admin');

CREATE TABLE tasks (
    id serial,
    public_id text unique not null,
    description text,
    price numeric,
    PRIMARY KEY (id)
);

CREATE DOMAIN uint AS integer NOT NULL CHECK ( VALUE >= 0 );
CREATE TYPE transaction_type AS ENUM ('enrollment', 'withdrawal', 'payment');

CREATE TABLE transactions (
    id serial,
    created_at timestamp default current_timestamp,
    debit uint default 0,
    credit uint default 0,
    user_id integer not null,
    type transaction_type,
    task_id integer null,
    cycle_id integer not null,
    PRIMARY KEY (id)
);

CREATE TABLE cycles (
    id serial,
    created_at timestamp default current_timestamp,
    is_closed boolean default false,
    closed_at timestamp null,
    PRIMARY KEY (id)
);

INSERT INTO cycles DEFAULT VALUES;

CREATE TABLE payments (
    id serial,
    transaction_id integer not null,
    value uint
);

-- CREATE TABLE billing_cycles (
--     id serial,
--     created_at timestamp,
--     user_id integer not null,
--     debit uint default 0,
--     credit uint default 0,
--     PRIMARY KEY (id)
-- )

CREATE VIEW balances (
    user_id, dt, ct, balance
) AS (
    SELECT u.id, SUM(t.debit) as dt, SUM(t.credit) as ct, SUM(t.debit) - SUM(t.credit) as value
    FROM users u
      LEFT JOIN transactions t on u.id = t.user_id
    GROUP BY u.id
    ORDER BY u.id DESC
);
