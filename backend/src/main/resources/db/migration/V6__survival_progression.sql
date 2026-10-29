CREATE TABLE progression (
 user_id VARCHAR(36) PRIMARY KEY, exp BIGINT NOT NULL DEFAULT 0,
 rating INT NOT NULL DEFAULT 1000, ranked_games INT NOT NULL DEFAULT 0,
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE reward_events (
 user_id VARCHAR(36) NOT NULL, event_key VARCHAR(100) NOT NULL,
 kind VARCHAR(30) NOT NULL, exp INT NOT NULL, rating_before INT NOT NULL,
 rating_after INT NOT NULL, created_at BIGINT NOT NULL,
 PRIMARY KEY(user_id,event_key), FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE TABLE match_queue (
 user_id VARCHAR(36) PRIMARY KEY, mode VARCHAR(12) NOT NULL,
 state VARCHAR(16) NOT NULL, joined_at BIGINT NOT NULL, last_seen BIGINT NOT NULL,
 rating INT NOT NULL, player_level INT NOT NULL, room_id VARCHAR(36),
 FOREIGN KEY(user_id) REFERENCES users(id)
);
CREATE INDEX idx_match_queue ON match_queue(mode,state,joined_at);
CREATE TABLE match_results (
 room_id VARCHAR(36) NOT NULL, user_id VARCHAR(36) NOT NULL,
 mode VARCHAR(12) NOT NULL, placement INT NOT NULL, exp INT NOT NULL,
 rating_before INT NOT NULL, rating_after INT NOT NULL, finished_at BIGINT NOT NULL,
 PRIMARY KEY(room_id,user_id), FOREIGN KEY(user_id) REFERENCES users(id)
);
