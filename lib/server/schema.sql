-- Mkurugenzi store schema
-- Target: MySQL 5.7+ / MariaDB 10.3+ (works on cPanel MySQL and plain VPS).
-- All tables use InnoDB + utf8mb4 so emoji-free but international copy is safe.

CREATE TABLE IF NOT EXISTS `products` (
  `id`            VARCHAR(64)  NOT NULL,
  `slug`          VARCHAR(191) NOT NULL,
  `name`          VARCHAR(191) NOT NULL,
  `category`      VARCHAR(32)  NOT NULL DEFAULT 'unisex',
  `price`         INT UNSIGNED NOT NULL DEFAULT 0,
  `compare_price` INT UNSIGNED NULL,
  `stock`         INT          NOT NULL DEFAULT 0,
  `sold`          INT UNSIGNED NOT NULL DEFAULT 0,
  `sizes`         TEXT         NULL,
  `size_stock`    TEXT         NULL,
  `badge`         VARCHAR(64)  NULL,
  `status`        VARCHAR(16)  NOT NULL DEFAULT 'active',
  `img`           VARCHAR(512) NOT NULL DEFAULT '',
  `hover_img`     VARCHAR(512) NULL,
  `description`   TEXT         NULL,
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_slug` (`slug`),
  KEY `products_status` (`status`),
  KEY `products_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promos` (
  `id`         VARCHAR(64)  NOT NULL,
  `code`       VARCHAR(64)  NOT NULL,
  `title`      VARCHAR(191) NOT NULL,
  `type`       VARCHAR(16)  NOT NULL DEFAULT 'percent',
  `value`      INT UNSIGNED NOT NULL DEFAULT 0,
  `starts_at`  DATE         NULL,
  `ends_at`    DATE         NULL,
  `used`       INT UNSIGNED NOT NULL DEFAULT 0,
  `limit_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `active`     TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `promos_code` (`code`),
  KEY `promos_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `clients` (
  `id`         VARCHAR(64)  NOT NULL,
  `name`       VARCHAR(191) NOT NULL,
  `phone`      VARCHAR(64)  NOT NULL DEFAULT '',
  `email`      VARCHAR(191) NOT NULL DEFAULT '',
  `city`       VARCHAR(128) NOT NULL DEFAULT '',
  `orders`     INT UNSIGNED NOT NULL DEFAULT 0,
  `spent`      INT UNSIGNED NOT NULL DEFAULT 0,
  `tier`       VARCHAR(16)  NOT NULL DEFAULT 'new',
  `joined_at`  DATE         NULL,
  `notes`      TEXT         NULL,
  `created_at` TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `clients_tier` (`tier`),
  KEY `clients_spent` (`spent`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `deliveries` (
  `id`          VARCHAR(64)  NOT NULL,
  `reference`   VARCHAR(64)  NOT NULL,
  `client_id`   VARCHAR(64)  NULL,
  `client_name` VARCHAR(191) NOT NULL DEFAULT '',
  `items`       TEXT         NULL,
  `total`       INT UNSIGNED NOT NULL DEFAULT 0,
  `status`      VARCHAR(32)  NOT NULL DEFAULT 'awaiting_payment',
  `payment`     VARCHAR(16)  NOT NULL DEFAULT 'mpesa',
  `courier`     VARCHAR(128) NOT NULL DEFAULT '',
  `tracking`    VARCHAR(128) NOT NULL DEFAULT '',
  `address`     VARCHAR(255) NOT NULL DEFAULT '',
  `placed_at`   DATE         NULL,
  `window`      VARCHAR(128) NOT NULL DEFAULT '',
  `source`      VARCHAR(16)  NOT NULL DEFAULT 'manual',
  `county`      VARCHAR(64)  NOT NULL DEFAULT '',
  `email`       VARCHAR(191) NOT NULL DEFAULT '',
  `phone`       VARCHAR(64)  NOT NULL DEFAULT '',
  `notes`       TEXT         NULL,
  `mpesa_receipt` VARCHAR(64) NOT NULL DEFAULT '',
  `created_at`  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `deliveries_reference` (`reference`),
  KEY `deliveries_status` (`status`),
  KEY `deliveries_client` (`client_id`),
  CONSTRAINT `deliveries_client_fk` FOREIGN KEY (`client_id`)
    REFERENCES `clients` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id`         VARCHAR(64)  NOT NULL,
  `name`       VARCHAR(191) NOT NULL DEFAULT '',
  `contact`    VARCHAR(191) NOT NULL DEFAULT '',
  `subject`    VARCHAR(191) NOT NULL DEFAULT '',
  `body`       TEXT         NULL,
  `status`     VARCHAR(16)  NOT NULL DEFAULT 'new',
  `notes`      TEXT         NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `messages_status` (`status`),
  KEY `messages_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `key`   VARCHAR(64)  NOT NULL,
  `value` TEXT         NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id`            VARCHAR(64)  NOT NULL,
  `email`         VARCHAR(191) NOT NULL,
  `name`          VARCHAR(191) NOT NULL DEFAULT '',
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          VARCHAR(32)  NOT NULL DEFAULT 'admin',
  `created_at`    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
