-- Migration 001: JIRA-style fields (issue type, priority, sprints, labels)
-- Safe to run on an existing database. Run in Cloud SQL Studio or:
--   gcloud sql connect <instance> --user=<user> --database=<db> < 001_jira_fields.sql

-- --- Task: issue type + priority + sprint link ----------------------------
ALTER TABLE `task`
  ADD COLUMN `issue_type` ENUM('story','task','bug','epic') NOT NULL DEFAULT 'task' AFTER `task_description`,
  ADD COLUMN `priority`   ENUM('highest','high','medium','low','lowest') NOT NULL DEFAULT 'medium' AFTER `issue_type`,
  ADD COLUMN `sprint_id`  INT NULL AFTER `team_id`;

-- --- Sprints ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sprint` (
  `sprint_id`  INT NOT NULL AUTO_INCREMENT,
  `team_id`    INT NOT NULL,
  `name`       VARCHAR(255) NOT NULL,
  `goal`       VARCHAR(512) NULL,
  `start_date` DATE NULL,
  `end_date`   DATE NULL,
  `status`     ENUM('planned','active','completed') NOT NULL DEFAULT 'planned',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sprint_id`),
  KEY `idx_sprint_team` (`team_id`),
  CONSTRAINT `fk_sprint_team` FOREIGN KEY (`team_id`) REFERENCES `team`(`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE `task`
  ADD CONSTRAINT `fk_task_sprint` FOREIGN KEY (`sprint_id`) REFERENCES `sprint`(`sprint_id`) ON DELETE SET NULL;

-- --- Labels ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `label` (
  `label_id` INT NOT NULL AUTO_INCREMENT,
  `team_id`  INT NOT NULL,
  `name`     VARCHAR(60) NOT NULL,
  `color`    VARCHAR(20) NOT NULL DEFAULT 'blue',
  PRIMARY KEY (`label_id`),
  KEY `idx_label_team` (`team_id`),
  CONSTRAINT `fk_label_team` FOREIGN KEY (`team_id`) REFERENCES `team`(`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `task_label` (
  `task_id`  INT NOT NULL,
  `label_id` INT NOT NULL,
  PRIMARY KEY (`task_id`, `label_id`),
  CONSTRAINT `fk_tl_task`  FOREIGN KEY (`task_id`)  REFERENCES `task`(`task_id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_tl_label` FOREIGN KEY (`label_id`) REFERENCES `label`(`label_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Normalize any legacy statuses to the board's vocabulary.
UPDATE `task` SET `status` = 'open' WHERE `status` IS NULL OR `status` = '' OR `status` = 'unassigned';
