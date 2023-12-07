DROP DATABASE IF EXISTS myIRC;
CREATE DATABASE myIRC;

USE myIRC;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY(`role_id`) REFERENCES roles(`id`) 
);

CREATE TABLE IF NOT EXISTS `channels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `receiver_id` INT NOT NULL,
  `expeditor_id` INT NOT NULL,
  `content` VARCHAR(5000) NOT NULL,
  `channel_id` INT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`receiver_id`) REFERENCES users(`id`),
  FOREIGN KEY (`expeditor_id`) REFERENCES users(`id`),
  FOREIGN KEY (`channel_id`) REFERENCES channels(`id`)
);

INSERT INTO `roles` (name) VALUES ("chatter");
INSERT INTO `roles` (name) VALUES ("admin");
INSERT INTO `users` (username, password, role_id) VALUES ("Ben", "becker", 1);
INSERT INTO `users` (username, password, role_id) VALUES ("Ibra", "xeno", 1);
INSERT INTO `users` (username, password, role_id) VALUES ("test", "toto", 2);
