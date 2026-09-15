-- Add Undo/Redo support for the Permissions Manager page.
ALTER TABLE `Role` ADD COLUMN `permission_history_position` INTEGER NOT NULL DEFAULT 0;

CREATE TABLE `RolePermissionHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role_id` INTEGER NOT NULL,
    `seq` INTEGER NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `before` TEXT NOT NULL,
    `after` TEXT NOT NULL,
    `actor_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RolePermissionHistory_role_id_idx`(`role_id`),
    UNIQUE INDEX `RolePermissionHistory_role_id_seq_key`(`role_id`, `seq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `RolePermissionHistory` ADD CONSTRAINT `RolePermissionHistory_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
