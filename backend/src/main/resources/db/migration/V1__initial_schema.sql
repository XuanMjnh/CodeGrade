-- Complete schema for CodeGrade Network 6.0.0. Apply to a new database.
CREATE TABLE transaction_locks (scope VARCHAR(32) PRIMARY KEY);
INSERT INTO transaction_locks VALUES('competition');
INSERT INTO transaction_locks VALUES('identity');
CREATE TABLE submission_sequence (id INT PRIMARY KEY, next_value BIGINT NOT NULL DEFAULT 0);
INSERT INTO submission_sequence(id) VALUES(1);
CREATE TABLE users (
 id VARCHAR(36) PRIMARY KEY, username VARCHAR(40) NOT NULL UNIQUE,
 display_name VARCHAR(100) NOT NULL, password_hash VARCHAR(255) NOT NULL,
 email VARCHAR(254) NOT NULL DEFAULT '',
 role VARCHAR(20) NOT NULL, enabled BOOLEAN NOT NULL DEFAULT TRUE,
 elo INT NOT NULL DEFAULT 1200, wins INT NOT NULL DEFAULT 0, created_at BIGINT NOT NULL,
 CHECK (role IN ('ADMIN','AUTHOR','CODER'))
);
CREATE TABLE sessions (
 token_hash VARCHAR(64) PRIMARY KEY, user_id VARCHAR(36) NOT NULL,
 expires_at BIGINT NOT NULL, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
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
 title VARCHAR(200) NOT NULL, starts_at BIGINT NOT NULL, ends_at BIGINT NOT NULL,
 rated BOOLEAN NOT NULL DEFAULT FALSE, settled BOOLEAN NOT NULL DEFAULT FALSE,
 FOREIGN KEY(author_id) REFERENCES users(id)
);
CREATE TABLE submissions (
 id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 request_id VARCHAR(80) NOT NULL, source_code LONGTEXT NOT NULL, language VARCHAR(15) NOT NULL,
 mode VARCHAR(15) NOT NULL, room_id VARCHAR(36), round_id VARCHAR(36), contest_id VARCHAR(36),
 received_at BIGINT NOT NULL, status VARCHAR(20) NOT NULL, score DOUBLE NOT NULL DEFAULT 0,
 rank_eligible BOOLEAN NOT NULL DEFAULT FALSE, admission_order BIGINT NOT NULL DEFAULT 0,
 current_test INT NOT NULL DEFAULT 0, completed_tests INT NOT NULL DEFAULT 0, total_tests INT NOT NULL DEFAULT 0,
 snapshot LONGTEXT NOT NULL, result LONGTEXT, worker_id VARCHAR(80), lease_token VARCHAR(36),
 lease_until BIGINT, attempts INT NOT NULL DEFAULT 0, completed_at BIGINT,
 UNIQUE(user_id,request_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(problem_id) REFERENCES problems(id)
);
CREATE INDEX idx_queue ON submissions(status,received_at,admission_order);
CREATE INDEX idx_round ON submissions(round_id,mode,status,received_at,admission_order);
CREATE TABLE solved (
 user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 PRIMARY KEY(user_id,problem_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(problem_id) REFERENCES problems(id)
);
CREATE TABLE events (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, user_id VARCHAR(36), type VARCHAR(60) NOT NULL,
 payload LONGTEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE INDEX idx_events_user ON events(user_id,id);
CREATE TABLE commands (
 user_id VARCHAR(36) NOT NULL, request_id VARCHAR(80) NOT NULL, fingerprint VARCHAR(64) NOT NULL,
 response LONGTEXT NOT NULL, created_at BIGINT NOT NULL, PRIMARY KEY(user_id,request_id),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE audit (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, actor_id VARCHAR(80) NOT NULL,
 action VARCHAR(60) NOT NULL, entity_id VARCHAR(80) NOT NULL, payload LONGTEXT NOT NULL,
 created_at BIGINT NOT NULL
);
CREATE TABLE drafts (
 user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL, language VARCHAR(15) NOT NULL,
 source_code LONGTEXT NOT NULL, updated_at BIGINT NOT NULL, PRIMARY KEY(user_id,problem_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
CREATE TABLE bookmarks(user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL, PRIMARY KEY(user_id,problem_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE);
CREATE TABLE comments (
 id VARCHAR(36) PRIMARY KEY, user_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 body VARCHAR(4000) NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
 FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
CREATE TABLE announcements (
 id VARCHAR(36) PRIMARY KEY, author_id VARCHAR(36) NOT NULL, title VARCHAR(200) NOT NULL,
 body VARCHAR(4000) NOT NULL, created_at BIGINT NOT NULL,
 FOREIGN KEY(author_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE room_presence(room_id VARCHAR(36) NOT NULL,user_id VARCHAR(36) NOT NULL,last_seen BIGINT NOT NULL,PRIMARY KEY(room_id,user_id), FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
CREATE TABLE problem_numbers (
 number BIGINT AUTO_INCREMENT PRIMARY KEY,
 problem_id VARCHAR(36) NOT NULL UNIQUE,
 FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
CREATE INDEX idx_submission_history ON submissions(user_id,received_at,admission_order,id);
CREATE TABLE progression (
 user_id VARCHAR(36) PRIMARY KEY, exp BIGINT NOT NULL DEFAULT 0,
 rating INT NOT NULL DEFAULT 1000, ranked_games INT NOT NULL DEFAULT 0,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE reward_events (
 user_id VARCHAR(36) NOT NULL, event_key VARCHAR(100) NOT NULL,
 kind VARCHAR(30) NOT NULL, exp INT NOT NULL, rating_before INT NOT NULL,
 rating_after INT NOT NULL, created_at BIGINT NOT NULL,
 PRIMARY KEY(user_id,event_key), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE match_queue (
 user_id VARCHAR(36) PRIMARY KEY, mode VARCHAR(12) NOT NULL,
 state VARCHAR(16) NOT NULL, joined_at BIGINT NOT NULL, last_seen BIGINT NOT NULL,
 rating INT NOT NULL, player_level INT NOT NULL, room_id VARCHAR(36),
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX idx_match_queue ON match_queue(mode,state,joined_at);
CREATE TABLE match_results (
 room_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL,
 mode VARCHAR(12) NOT NULL, placement INT NOT NULL, exp INT NOT NULL,
 rating_before INT NOT NULL, rating_after INT NOT NULL, finished_at BIGINT NOT NULL,
 PRIMARY KEY(room_id,user_id), FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Relational membership and bank indexes avoid scanning JSON snapshots.
CREATE TABLE room_members (
 room_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, status VARCHAR(16) NOT NULL,
 PRIMARY KEY(room_id,user_id), FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE room_problem_bank (
 room_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 PRIMARY KEY(room_id,problem_id), FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE,
 FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
CREATE TABLE contest_problems (
 contest_id VARCHAR(36) NOT NULL, problem_id VARCHAR(36) NOT NULL,
 PRIMARY KEY(contest_id,problem_id), FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
 FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
CREATE TABLE contest_registrations (
 contest_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL, status VARCHAR(12) NOT NULL,
 PRIMARY KEY(contest_id,user_id), FOREIGN KEY(contest_id) REFERENCES contests(id) ON DELETE CASCADE,
 FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE, CHECK(status IN ('ACCEPTED','PENDING'))
);
CREATE INDEX idx_sessions_user ON sessions(user_id,expires_at);
CREATE INDEX idx_sessions_expiry ON sessions(expires_at);
CREATE INDEX idx_problem_catalog ON problems(status,category_id,difficulty,created_at);
CREATE INDEX idx_survival_bank ON problems(status,survival,difficulty);
CREATE INDEX idx_rooms_state ON rooms(state,updated_at);
CREATE INDEX idx_room_members_user ON room_members(user_id,status,room_id);
CREATE INDEX idx_room_bank_problem ON room_problem_bank(problem_id,room_id);
CREATE INDEX idx_contests_schedule ON contests(settled,ends_at,starts_at);
CREATE INDEX idx_contest_problem ON contest_problems(problem_id,contest_id);
CREATE INDEX idx_contest_registration_user ON contest_registrations(user_id,status,contest_id);
CREATE INDEX idx_submission_user_status ON submissions(user_id,status,received_at);
CREATE INDEX idx_submission_contest ON submissions(contest_id,user_id,problem_id,mode,received_at,admission_order);
CREATE INDEX idx_submission_problem_rank ON submissions(problem_id,mode,status,rank_eligible,user_id);
CREATE INDEX idx_submission_lease ON submissions(status,lease_until);
CREATE INDEX idx_comments_problem ON comments(problem_id,created_at);
CREATE INDEX idx_announcements_time ON announcements(created_at);
CREATE INDEX idx_match_queue_room ON match_queue(room_id,state,last_seen);
CREATE INDEX idx_match_results_history ON match_results(user_id,finished_at);
CREATE INDEX idx_reward_history ON reward_events(user_id,created_at);
