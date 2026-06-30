-- Collabora database schema
-- Reconstructed from the SQL queries in server/routes/*.js.
-- Types/lengths are reasonable defaults; adjust if your original differed.
--
-- Load into a fresh database, e.g.:
--   gcloud sql connect collabora-db --user=collabora --database=collabora < schema.sql
-- or:
--   mysql -h HOST -u USER -p DBNAME < schema.sql

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user` (
  `user_id`    INT          NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name`  VARCHAR(100) NOT NULL,
  `email`      VARCHAR(255) NOT NULL,
  `password`   VARCHAR(255) NOT NULL,          -- bcrypt hash
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_user_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `team` (
  `team_id`          INT          NOT NULL AUTO_INCREMENT,
  `team_name`        VARCHAR(255) NOT NULL,
  `team_description` TEXT         NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`team_id`),
  UNIQUE KEY `uq_team_name` (`team_name`)      -- code returns ER_DUP_ENTRY on dup name
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Team membership (user <-> team, with role)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_team` (
  `user_id` INT NOT NULL,
  `team_id` INT NOT NULL,
  `role`    ENUM('admin','member') NOT NULL DEFAULT 'member',
  PRIMARY KEY (`user_id`, `team_id`),          -- supports INSERT IGNORE on re-add
  KEY `idx_user_team_team` (`team_id`),
  CONSTRAINT `fk_user_team_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_team_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task` (
  `task_id`          INT          NOT NULL AUTO_INCREMENT,
  `task_name`        VARCHAR(255) NOT NULL,
  `task_description` TEXT         NULL,
  `issue_type`       ENUM('story','task','bug','epic') NOT NULL DEFAULT 'task',
  `priority`         ENUM('highest','high','medium','low','lowest') NOT NULL DEFAULT 'medium',
  `due_date`         DATE         NULL,
  `status`           VARCHAR(50)  NOT NULL DEFAULT 'open', -- open | in-progress | in-review | completed
  `team_id`          INT          NOT NULL,
  `created_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`),
  KEY `idx_task_team` (`team_id`),
  CONSTRAINT `fk_task_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Subtask relationship (task_id is the child, parent_task_id its parent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sub_task` (
  `task_id`        INT NOT NULL,
  `parent_task_id` INT NOT NULL,
  PRIMARY KEY (`task_id`),                      -- a task has at most one parent
  KEY `idx_sub_task_parent` (`parent_task_id`),
  CONSTRAINT `fk_sub_task_child`  FOREIGN KEY (`task_id`)        REFERENCES `task` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_task_parent` FOREIGN KEY (`parent_task_id`) REFERENCES `task` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Task assignment (user <-> task)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_task` (
  `user_id` INT NOT NULL,
  `task_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `task_id`),          -- supports ER_DUP_ENTRY on re-assign
  KEY `idx_user_task_task` (`task_id`),
  CONSTRAINT `fk_user_task_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_task_task` FOREIGN KEY (`task_id`) REFERENCES `task` (`task_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Task comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `task_comment` (
  `comment_id`   INT       NOT NULL AUTO_INCREMENT,
  `task_id`      INT       NOT NULL,
  `content`      TEXT      NOT NULL,
  `commented_by` INT       NOT NULL,
  `commented_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`comment_id`),
  KEY `idx_task_comment_task` (`task_id`),
  KEY `idx_task_comment_user` (`commented_by`),
  CONSTRAINT `fk_task_comment_task` FOREIGN KEY (`task_id`)      REFERENCES `task` (`task_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_comment_user` FOREIGN KEY (`commented_by`) REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Discussions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `discussion` (
  `post_id`    INT       NOT NULL AUTO_INCREMENT,
  `content`    TEXT      NOT NULL,
  `user_id`    INT       NOT NULL,
  `team_id`    INT       NOT NULL,
  `posted_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`post_id`),
  KEY `idx_discussion_team` (`team_id`),
  KEY `idx_discussion_user` (`user_id`),
  CONSTRAINT `fk_discussion_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_discussion_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Sub-discussion relationship (post_id is the reply, parent_post_id its parent)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sub_discussion` (
  `post_id`        INT NOT NULL,
  `parent_post_id` INT NOT NULL,
  PRIMARY KEY (`post_id`),
  KEY `idx_sub_discussion_parent` (`parent_post_id`),
  CONSTRAINT `fk_sub_discussion_post`   FOREIGN KEY (`post_id`)        REFERENCES `discussion` (`post_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sub_discussion_parent` FOREIGN KEY (`parent_post_id`) REFERENCES `discussion` (`post_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Files (metadata; bytes live in the GCS bucket)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `file` (
  `file_id`           INT          NOT NULL AUTO_INCREMENT,
  `filename`          VARCHAR(512) NOT NULL,    -- GCS object name
  `original_filename` VARCHAR(512) NOT NULL,
  `file_extension`    VARCHAR(20)  NULL,
  `user_id`           INT          NOT NULL,
  `team_id`           INT          NOT NULL,
  `gcs_bucket`        VARCHAR(255) NOT NULL,
  `gcs_path`          VARCHAR(1024) NOT NULL,
  `file_size`         BIGINT       NULL,
  `content_type`      VARCHAR(255) NULL,
  `upload_timestamp`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`file_id`),
  KEY `idx_file_team` (`team_id`),
  KEY `idx_file_user` (`user_id`),
  CONSTRAINT `fk_file_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_file_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification` (
  `notification_id`   INT          NOT NULL AUTO_INCREMENT,
  `team_id`           INT          NULL,
  `notification_type` VARCHAR(100) NOT NULL,
  `message`           TEXT         NOT NULL,
  `link`              VARCHAR(512) NULL,
  `notified_at`       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`notification_id`),
  KEY `idx_notification_team` (`team_id`),
  CONSTRAINT `fk_notification_team` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ---------------------------------------------------------------------------
-- Notification recipients (notification <-> user, with read flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notification_recipients` (
  `notification_id` INT     NOT NULL,
  `user_id`         INT     NOT NULL,
  `read_status`     BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`notification_id`, `user_id`),
  KEY `idx_notif_recipients_user` (`user_id`),
  CONSTRAINT `fk_notif_recipients_notif` FOREIGN KEY (`notification_id`) REFERENCES `notification` (`notification_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_notif_recipients_user`  FOREIGN KEY (`user_id`)         REFERENCES `user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
