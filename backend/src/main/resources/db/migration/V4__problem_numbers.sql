CREATE TABLE problem_numbers (
 number BIGINT AUTO_INCREMENT PRIMARY KEY,
 problem_id VARCHAR(36) NOT NULL UNIQUE,
 FOREIGN KEY(problem_id) REFERENCES problems(id) ON DELETE CASCADE
);
INSERT INTO problem_numbers(problem_id) SELECT id FROM problems ORDER BY created_at,id;
