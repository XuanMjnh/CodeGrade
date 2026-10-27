CREATE TABLE system_lock (id INT PRIMARY KEY);
INSERT INTO system_lock VALUES(1);
CREATE TABLE users (
 id VARCHAR(36) PRIMARY KEY, username VARCHAR(40) NOT NULL UNIQUE,
 display_name VARCHAR(100) NOT NULL, password_hash VARCHAR(100) NOT NULL,
 role VARCHAR(20) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE,
 elo INT NOT NULL DEFAULT 1200, wins INT NOT NULL DEFAULT 0, created_at BIGINT NOT NULL,
 CHECK (role IN ('ADMIN','AUTHOR','CODER'))
);
CREATE TABLE sessions (
 token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
 expires_at BIGINT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE categories (
 id VARCHAR(36) PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description VARCHAR(1000) NOT NULL
);
CREATE TABLE problems (
 id VARCHAR(36) PRIMARY KEY, author_id VARCHAR(36) NOT NULL,
 category_id VARCHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
 difficulty INT NOT NULL, status VARCHAR(12) NOT NULL, survival BOOLEAN NOT NULL,
 version INT NOT NULL, document LONGTEXT NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(author_id) REFERENCES users(id), FOREIGN KEY(category_id) REFERENCES categories(id),
 CHECK(difficulty BETWEEN 1 AND 6)
);
CREATE TABLE rooms (
 id VARCHAR(36) PRIMARY KEY, invite_code VARCHAR(10) NOT NULL UNIQUE,
 state VARCHAR(30) NOT NULL, version BIGINT NOT NULL, document LONGTEXT NOT NULL,
 updated_at BIGINT NOT NULL
);
CREATE TABLE contests (
 id VARCHAR(36) PRIMARY KEY, author_id VARCHAR(36) NOT NULL, document LONGTEXT NOT NULL,
 FOREIGN KEY(author_id) REFERENCES users(id)
);
CREATE TABLE submissions (
 id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 request_id VARCHAR(80) NOT NULL, source_code LONGTEXT NOT NULL, language VARCHAR(15) NOT NULL,
 mode VARCHAR(15) NOT NULL, room_id VARCHAR(36), round_id VARCHAR(36), contest_id VARCHAR(36),
 received_at BIGINT NOT NULL, status VARCHAR(20) NOT NULL, score DOUBLE NOT NULL DEFAULT 0,
 snapshot LONGTEXT NOT NULL, result LONGTEXT, worker_id VARCHAR(80), lease_token VARCHAR(36),
 lease_until BIGINT, attempts INT NOT NULL DEFAULT 0, completed_at BIGINT,
 UNIQUE(user_id,request_id), FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(problem_id) REFERENCES problems(id)
);
CREATE INDEX idx_queue ON submissions(status,received_at);
CREATE INDEX idx_round ON submissions(room_id,round_id,status);
CREATE TABLE solved (
 user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 PRIMARY KEY(user_id,problem_id), FOREIGN KEY(user_id) REFERENCES users(id),
 FOREIGN KEY(problem_id) REFERENCES problems(id)
);
CREATE TABLE events (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(36), type VARCHAR(60) NOT NULL,
 payload LONGTEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE INDEX idx_events_user ON events(user_id,id);
CREATE TABLE commands (
 user_id VARCHAR(36) NOT NULL, request_id VARCHAR(80) NOT NULL, fingerprint VARCHAR(64) NOT NULL,
 response LONGTEXT NOT NULL, created_at BIGINT NOT NULL, PRIMARY KEY(user_id,request_id)
);
CREATE TABLE audit (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id VARCHAR(80) NOT NULL,
 action VARCHAR(60) NOT NULL, entity_id VARCHAR(80) NOT NULL, payload LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
);
CREATE TABLE drafts (
 user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL, language VARCHAR(15) NOT NULL,
 source_code LONGTEXT NOT NULL, updated_at BIGINT NOT NULL, PRIMARY KEY(user_id,problem_id)
);
