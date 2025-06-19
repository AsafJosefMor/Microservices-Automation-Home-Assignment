-- 01_create_users.sql

-- 1) Create users table
CREATE TABLE IF NOT EXISTS users (
                                     id    SERIAL PRIMARY KEY,
                                     name  TEXT   NOT NULL,
                                     email TEXT
);

-- 2) Seed the hard-coded admin user with ID = 1 (only once)
INSERT INTO users(id, name, email)
VALUES (1, 'admin', NULL)
    ON CONFLICT (id) DO NOTHING;

-- 3) Reset the users_id_seq to the current max(id)
--    so that the next SERIAL value will be max(id)+1 = 2
SELECT setval(
               pg_get_serial_sequence('users', 'id'),
               COALESCE(MAX(id), 1)
       )
FROM users;