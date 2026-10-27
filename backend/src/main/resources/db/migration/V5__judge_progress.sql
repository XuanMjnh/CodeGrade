ALTER TABLE submissions ADD COLUMN current_test INT NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN completed_tests INT NOT NULL DEFAULT 0;
ALTER TABLE submissions ADD COLUMN total_tests INT NOT NULL DEFAULT 0;
CREATE INDEX idx_submission_history ON submissions(user_id,received_at,id);
