-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Sep 11, 2026 at 10:48 AM
-- Server version: 11.8.9-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u988844918_RSCRM_DB`
--

-- --------------------------------------------------------

--
-- Table structure for table `AttendanceLog`
--

CREATE TABLE `AttendanceLog` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `check_in_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `check_out_at` datetime(3) DEFAULT NULL,
  `working_duration_minutes` int(11) DEFAULT NULL,
  `status` varchar(191) NOT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'QR_SCAN',
  `branch_id` int(11) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AttendanceLog`
--

INSERT INTO `AttendanceLog` (`id`, `employee_id`, `check_in_at`, `check_out_at`, `working_duration_minutes`, `status`, `source`, `branch_id`, `notes`) VALUES
(1, 2, '2026-09-01 04:55:51.109', '2026-09-01 12:31:32.032', 456, 'PRESENT', 'QR_SCAN', 1, NULL),
(2, 3, '2026-09-01 05:00:21.635', '2026-09-01 12:31:55.363', 452, 'PRESENT', 'QR_SCAN', 1, NULL),
(3, 4, '2026-09-01 05:00:21.867', '2026-09-01 12:33:24.099', 453, 'PRESENT', 'QR_SCAN', 1, NULL),
(4, 7, '2026-09-01 05:00:41.705', '2026-09-01 12:33:34.749', 533, 'PRESENT', 'QR_SCAN', 1, NULL),
(5, 6, '2026-09-01 05:00:03.685', '2026-09-01 12:35:23.275', 535, 'PRESENT', 'QR_SCAN', 1, NULL),
(6, 2, '2026-09-02 04:21:05.941', '2026-09-02 12:31:08.847', 490, 'PRESENT', 'QR_SCAN', 1, NULL),
(7, 4, '2026-09-02 04:22:59.924', '2026-09-02 12:31:27.279', 488, 'PRESENT', 'QR_SCAN', 1, NULL),
(8, 3, '2026-09-02 04:53:45.419', '2026-09-02 12:31:43.274', 458, 'PRESENT', 'QR_SCAN', 1, NULL),
(9, 7, '2026-09-02 04:45:05.652', '2026-09-02 12:36:42.565', 417, 'PRESENT', 'QR_SCAN', 1, NULL),
(10, 2, '2026-09-03 04:14:37.707', '2026-09-03 12:31:06.373', 496, 'PRESENT', 'QR_SCAN', 1, NULL),
(11, 3, '2026-09-03 04:40:25.114', '2026-09-03 12:31:42.835', 471, 'PRESENT', 'QR_SCAN', 1, NULL),
(12, 7, '2026-09-03 04:53:16.595', '2026-09-03 13:45:08.701', 532, 'PRESENT', 'QR_SCAN', 1, NULL),
(13, 4, '2026-09-03 05:00:11.181', '2026-09-03 12:31:22.949', 451, 'PRESENT', 'QR_SCAN', 1, NULL),
(14, 6, '2026-09-03 05:15:55.200', '2026-09-03 13:08:51.075', 473, 'LATE', 'QR_SCAN', 1, NULL),
(15, 17, '2026-09-03 09:28:35.067', '2026-09-03 13:20:16.383', 232, 'PRESENT', 'QR_SCAN', 1, NULL),
(16, 2, '2026-09-04 04:25:03.096', '2026-09-04 12:31:10.304', 486, 'PRESENT', 'QR_SCAN', 1, NULL),
(17, 3, '2026-09-04 04:26:48.478', '2026-09-04 12:32:37.741', 486, 'PRESENT', 'QR_SCAN', 1, NULL),
(18, 4, '2026-09-04 05:25:35.713', '2026-09-04 12:32:15.067', 427, 'LATE', 'QR_SCAN', 1, NULL),
(19, 7, '2026-09-04 04:55:46.701', '2026-09-04 13:32:25.752', 517, 'PRESENT', 'QR_SCAN', 1, NULL),
(20, 6, '2026-09-04 05:49:32.126', '2026-09-04 13:32:25.752', 463, 'APPROVED_LATE', 'QR_SCAN', 1, NULL),
(21, 17, '2026-09-04 09:38:37.804', '2026-09-04 14:02:09.454', 264, 'PRESENT', 'QR_SCAN', 1, NULL),
(22, 2, '2026-09-05 04:12:33.867', '2026-09-05 12:56:53.090', 524, 'PRESENT', 'QR_SCAN', 1, NULL),
(23, 4, '2026-09-05 04:49:35.667', '2026-09-05 12:56:53.090', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(24, 7, '2026-09-05 04:35:10.782', '2026-09-05 12:56:53.090', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(25, 2, '2026-09-07 04:59:45.756', '2026-09-07 12:31:06.414', 451, 'PRESENT', 'QR_SCAN', 1, NULL),
(26, 3, '2026-09-07 04:45:11.034', '2026-09-07 12:31:42.279', 467, 'PRESENT', 'QR_SCAN', 1, NULL),
(27, 4, '2026-09-07 04:42:06.365', '2026-09-07 12:31:22.117', 469, 'PRESENT', 'QR_SCAN', 1, NULL),
(28, 7, '2026-09-07 04:45:56.605', '2026-09-07 12:31:22.117', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(29, 6, '2026-09-07 06:00:42.773', '2026-09-07 12:31:22.117', NULL, 'LATE', 'QR_SCAN', 1, NULL),
(30, 2, '2026-09-08 04:27:21.313', '2026-09-08 12:34:19.239', 487, 'PRESENT', 'QR_SCAN', 1, NULL),
(31, 4, '2026-09-08 04:35:38.697', '2026-09-08 12:34:37.624', 479, 'PRESENT', 'QR_SCAN', 1, NULL),
(32, 3, '2026-09-08 04:54:09.649', '2026-09-08 12:34:54.415', 461, 'PRESENT', 'QR_SCAN', 1, NULL),
(33, 7, '2026-09-08 04:54:09.649', '2026-09-08 13:03:21.505', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(34, 6, '2026-09-08 04:54:09.649', '2026-09-08 13:03:21.505', 489, 'PRESENT', 'QR_SCAN', 1, NULL),
(35, 2, '2026-09-09 04:10:10.839', '2026-09-09 12:31:07.884', 501, 'PRESENT', 'QR_SCAN', 1, NULL),
(36, 4, '2026-09-09 04:42:21.254', '2026-09-09 12:31:48.979', 469, 'PRESENT', 'QR_SCAN', 1, NULL),
(37, 3, '2026-09-09 04:50:47.915', '2026-09-09 12:32:34.077', 462, 'PRESENT', 'QR_SCAN', 1, NULL),
(38, 6, '2026-09-09 04:53:47.630', '2026-09-09 12:31:32.198', 458, 'PRESENT', 'QR_SCAN', 1, NULL),
(39, 7, '2026-09-09 04:57:05.778', '2026-09-09 12:31:14.500', 454, 'PRESENT', 'QR_SCAN', 1, NULL),
(40, 2, '2026-09-10 04:22:15.568', '2026-09-10 12:31:12.333', 489, 'PRESENT', 'QR_SCAN', 1, NULL),
(41, 4, '2026-09-10 04:26:06.141', '2026-09-10 12:32:41.504', 487, 'PRESENT', 'QR_SCAN', 1, NULL),
(42, 3, '2026-09-10 04:53:56.055', '2026-09-10 12:32:11.523', 458, 'PRESENT', 'QR_SCAN', 1, NULL),
(43, 6, '2026-09-10 05:48:11.890', '2026-09-10 12:32:11.523', NULL, 'LATE', 'QR_SCAN', 1, NULL),
(44, 7, '2026-09-10 04:50:42.492', '2026-09-10 12:32:11.523', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(45, 17, '2026-09-10 07:24:12.480', '2026-09-10 12:32:11.523', NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(47, 2, '2026-09-11 04:15:43.391', NULL, NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(48, 33, '2026-09-11 04:23:32.035', NULL, NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(49, 4, '2026-09-11 04:45:54.079', NULL, NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(50, 3, '2026-09-11 04:49:59.626', NULL, NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(51, 17, '2026-09-11 07:31:45.979', NULL, NULL, 'PRESENT', 'QR_SCAN', 1, NULL),
(52, 6, '2026-09-11 05:30:51.724', NULL, NULL, 'LATE', 'QR_SCAN', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `AttendanceProposal`
--

CREATE TABLE `AttendanceProposal` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `target_date` datetime(3) NOT NULL,
  `reason` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AttendanceProposal`
--

INSERT INTO `AttendanceProposal` (`id`, `employee_id`, `type`, `target_date`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`) VALUES
(1, 2, 'LEAVE', '2026-09-02 18:30:00.000', 'Good afternoon, Sir. I’m not feeling well( personal problem)need to take rest . I kindly request you to grant me leave for tomorrow. I apologize for the short notice and request your understa', 'REJECTED', 1, '2026-09-03 07:11:03.899', '2026-09-02 06:36:15.975', '2026-09-03 07:11:03.900'),
(2, 6, 'LATE_CHECKIN', '2026-09-04 05:30:00.000', 'Krishna ashtami Puja so that s why I want take one hour extra time ', 'APPROVED', 1, '2026-09-04 10:12:32.422', '2026-09-04 03:36:14.806', '2026-09-04 10:12:32.423'),
(3, 3, 'LEAVE', '2026-09-04 18:30:00.000', 'Good morning, Sir. I would like to request leave for tomorrow due to some personal work, including an online job application at MeeSeva and some bank work. Kindly grant me leave for tomorrow.', 'APPROVED', 1, '2026-09-08 09:46:37.792', '2026-09-04 05:44:02.744', '2026-09-08 09:46:37.793');

-- --------------------------------------------------------

--
-- Table structure for table `AuditEvent`
--

CREATE TABLE `AuditEvent` (
  `id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `action` varchar(191) NOT NULL,
  `entity_type` varchar(191) NOT NULL,
  `entity_id` int(11) NOT NULL,
  `old_value` varchar(191) DEFAULT NULL,
  `new_value` varchar(191) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AuditEvent`
--

INSERT INTO `AuditEvent` (`id`, `actor_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `reason`, `created_at`) VALUES
(1, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-01 01:40:19.915'),
(2, 1, 'KIOSK_CREDENTIAL_CREATED', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_id\":1,\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\",\"username\":\"Attendance-001\",\"company_id\":1}', NULL, '2026-09-01 04:12:33.052'),
(3, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-01 04:12:56.460'),
(4, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-01 04:44:07.353'),
(5, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:51:06.750'),
(6, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:51:40.088'),
(7, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:51:48.935'),
(8, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:52:09.216'),
(9, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:53:04.439'),
(10, 2, 'SECURITY_ALERT', 'AUTH_FAILED', 2, NULL, 'Invalid password attempt', NULL, '2026-09-01 04:57:19.178'),
(11, 4, 'SECURITY_ALERT', 'AUTH_FAILED', 4, NULL, 'Invalid password attempt', NULL, '2026-09-01 05:12:07.106'),
(12, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-01 07:42:52.568'),
(13, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-01 09:31:02.967'),
(14, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-01 10:56:03.535'),
(15, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 1, NULL, '{\"calls\":35,\"visits\":0,\"deals\":3,\"isBelowTarget\":false}', NULL, '2026-09-01 12:22:57.019'),
(16, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 2, NULL, '{\"calls\":1,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-01 12:24:46.270'),
(17, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 3, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-01 12:27:06.199'),
(18, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-01 13:05:22.730'),
(19, 6, 'SECURITY_ALERT', 'AUTH_FAILED', 6, NULL, 'Invalid password attempt', NULL, '2026-09-01 13:33:54.561'),
(20, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 4, NULL, '{\"calls\":0,\"visits\":1,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-01 13:50:53.792'),
(21, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 5, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-01 13:52:15.850'),
(22, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-01 13:52:49.919'),
(23, 7, 'SECURITY_ALERT', 'AUTH_FAILED', 7, NULL, 'Invalid password attempt', NULL, '2026-09-02 04:45:16.931'),
(24, 7, 'SECURITY_ALERT', 'AUTH_FAILED', 7, NULL, 'Invalid password attempt', NULL, '2026-09-02 04:45:37.254'),
(25, 7, 'SECURITY_ALERT', 'AUTH_FAILED', 7, NULL, 'Invalid password attempt', NULL, '2026-09-02 04:45:55.459'),
(26, 7, 'SECURITY_ALERT', 'AUTH_FAILED', 7, NULL, 'Invalid password attempt', NULL, '2026-09-02 04:46:18.477'),
(27, 7, 'SECURITY_ALERT', 'AUTH_FAILED', 7, NULL, 'Invalid password attempt', NULL, '2026-09-02 04:46:24.742'),
(28, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-02 04:53:04.652'),
(29, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-02 06:24:48.900'),
(30, 2, 'SUBMIT_LEAVE_PROPOSAL', 'ATTENDANCE_PROPOSAL', 1, NULL, '{\"type\":\"LEAVE\",\"target_date\":\"2026-09-02T18:30:00.000Z\",\"end_date\":\"2026-09-03\",\"reason\":\"Good afternoon, Sir. I’m not feeling well( personal problem)need to take rest . I kindly request you', NULL, '2026-09-02 06:36:17.473'),
(31, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-02 08:25:56.779'),
(32, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-02 08:26:27.541'),
(33, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 6, NULL, '{\"calls\":25,\"visits\":0,\"deals\":6,\"isBelowTarget\":false}', NULL, '2026-09-02 12:07:04.494'),
(34, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 7, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-02 12:15:31.145'),
(35, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 8, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-02 12:21:14.431'),
(36, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-02 12:42:21.612'),
(37, 2, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 2, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"test_kiosk_label\"}', NULL, '2026-09-02 12:49:53.066'),
(38, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 9, NULL, '{\"calls\":0,\"visits\":1,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-02 12:55:12.557'),
(39, 8, 'SECURITY_ALERT', 'AUTH_FAILED', 8, NULL, 'Invalid password attempt', NULL, '2026-09-02 14:40:44.934'),
(40, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-02 15:34:02.502'),
(41, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-02 15:37:24.264'),
(42, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-02 16:51:28.007'),
(43, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-02 17:36:31.954'),
(44, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 02:16:46.965'),
(45, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 03:18:55.645'),
(46, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 04:45:33.300'),
(47, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 04:53:07.749'),
(48, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 05:00:52.511'),
(49, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 05:14:30.224'),
(50, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 05:14:44.129'),
(51, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 05:15:08.648'),
(52, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-03 05:45:04.401'),
(53, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 06:17:28.332'),
(54, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 07:16:00.971'),
(55, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 10, NULL, '{\"calls\":21,\"visits\":0,\"deals\":2,\"isBelowTarget\":false}', NULL, '2026-09-03 12:03:53.902'),
(56, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 11, NULL, '{\"calls\":49,\"visits\":0,\"deals\":5,\"isBelowTarget\":false}', NULL, '2026-09-03 12:05:11.622'),
(57, 6, 'SECURITY_ALERT', 'AUTH_FAILED', 6, NULL, 'Invalid password attempt', NULL, '2026-09-03 12:19:56.221'),
(58, 6, 'SECURITY_ALERT', 'AUTH_FAILED', 6, NULL, 'Invalid password attempt', NULL, '2026-09-03 12:20:05.215'),
(59, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 12, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-03 12:23:10.332'),
(60, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 13, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-03 13:06:47.443'),
(61, 6, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 6, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 13:07:04.166'),
(62, 6, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 6, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 13:07:05.932'),
(63, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 14, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-03 13:18:42.610'),
(64, 17, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 15, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-03 13:57:37.530'),
(65, 28, 'STATUS_CHANGED', 'SITE_VISIT', 1, NULL, '{\"status\":\"PENDING_CUSTOMER_RECONFIRMATION\"}', NULL, '2026-09-03 15:51:19.817'),
(66, 28, 'STATUS_CHANGED', 'SITE_VISIT', 1, NULL, '{\"status\":\"CONFIRMED\"}', NULL, '2026-09-03 15:51:19.985'),
(67, 28, 'STATUS_CHANGED', 'SITE_VISIT', 2, NULL, '{\"status\":\"PENDING_CUSTOMER_RECONFIRMATION\"}', NULL, '2026-09-03 15:51:20.200'),
(68, 28, 'STATUS_CHANGED', 'SITE_VISIT', 2, NULL, '{\"status\":\"ON_HOLD\"}', NULL, '2026-09-03 15:51:20.302'),
(69, 29, 'STATUS_CHANGED', 'SITE_VISIT', 3, NULL, '{\"status\":\"ACCEPTED\"}', NULL, '2026-09-03 15:51:20.901'),
(70, 29, 'STATUS_CHANGED', 'SITE_VISIT', 4, NULL, '{\"status\":\"ACCEPTED\"}', NULL, '2026-09-03 15:51:21.270'),
(71, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-03 20:58:32.547'),
(72, 6, 'SUBMIT_LATE_PROPOSAL', 'ATTENDANCE_PROPOSAL', 2, NULL, '{\"type\":\"LATE_CHECKIN\",\"target_date\":\"2026-09-04T05:30:00.000Z\",\"reason\":\"Krishna ashtami Puja so that s why I want take one hour extra time \"}', NULL, '2026-09-04 03:36:15.992'),
(73, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-04 05:25:26.402'),
(74, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 05:30:28.467'),
(75, 3, 'SUBMIT_LEAVE_PROPOSAL', 'ATTENDANCE_PROPOSAL', 3, NULL, '{\"type\":\"LEAVE\",\"target_date\":\"2026-09-04T18:30:00.000Z\",\"end_date\":\"2026-09-05\",\"reason\":\"Good morning, Sir. I would like to request leave for tomorrow due to some personal work, including a', NULL, '2026-09-04 05:44:04.541'),
(76, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 05:46:49.046'),
(77, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 06:01:44.422'),
(78, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 06:18:21.992'),
(79, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 06:41:58.863'),
(80, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-04 06:45:44.855'),
(81, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-04 06:49:25.415'),
(82, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 07:03:04.398'),
(83, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 09:05:06.270'),
(84, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 09:34:40.805'),
(85, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 10:07:47.506'),
(86, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 10:31:12.290'),
(87, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 12:06:15.399'),
(88, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 16, NULL, '{\"calls\":57,\"visits\":0,\"deals\":1,\"isBelowTarget\":false}', NULL, '2026-09-04 12:07:26.198'),
(89, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 12:09:30.533'),
(90, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 17, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-04 12:19:00.645'),
(91, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 18, NULL, '{\"calls\":37,\"visits\":0,\"deals\":8,\"isBelowTarget\":false}', NULL, '2026-09-04 12:20:27.005'),
(92, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 12:28:36.278'),
(93, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 12:38:43.137'),
(94, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 19, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-04 13:08:24.047'),
(95, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 20, NULL, '{\"calls\":0,\"visits\":1,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-04 13:36:53.062'),
(96, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 21, NULL, '{\"calls\":0,\"visits\":1,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-04 13:37:01.891'),
(97, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-04 13:59:49.133'),
(98, 17, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 22, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-04 14:03:05.632'),
(99, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-04 22:06:06.557'),
(100, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-05 07:22:36.876'),
(101, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-05 07:22:54.068'),
(102, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-05 08:13:04.091'),
(103, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 23, NULL, '{\"calls\":33,\"visits\":0,\"deals\":2,\"isBelowTarget\":false}', NULL, '2026-09-05 12:51:49.460'),
(104, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-05 12:56:24.227'),
(105, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-05 12:56:45.879'),
(106, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-05 12:56:46.042'),
(107, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 24, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-05 14:30:43.988'),
(108, 30, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 30, NULL, 'Refresh token reuse detected', NULL, '2026-09-06 00:27:56.867'),
(109, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-06 08:33:52.163'),
(110, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-06 08:34:49.392'),
(111, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:07:06.471'),
(112, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:07:35.200'),
(113, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:08:30.459'),
(114, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:09:21.163'),
(115, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:09:37.581'),
(116, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:09:57.550'),
(117, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-06 12:10:06.936'),
(118, 31, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 31, NULL, 'Refresh token reuse detected', NULL, '2026-09-06 12:30:16.080'),
(119, 31, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 31, NULL, 'Refresh token reuse detected', NULL, '2026-09-06 12:30:17.341'),
(120, 31, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 31, NULL, 'Refresh token reuse detected', NULL, '2026-09-06 12:30:18.974'),
(122, 0, 'SECURITY_ALERT', 'AUTH_FAILED', 0, NULL, 'Attempted login with invalid/inactive code', NULL, '2026-09-06 13:55:37.812'),
(123, 0, 'SECURITY_ALERT', 'AUTH_FAILED', 0, NULL, 'Attempted login with invalid/inactive code', NULL, '2026-09-06 13:56:29.332'),
(124, 0, 'SECURITY_ALERT', 'AUTH_FAILED', 0, NULL, 'Attempted login with invalid/inactive code', NULL, '2026-09-06 13:56:42.601'),
(125, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-06 15:42:12.144'),
(126, 0, 'SECURITY_ALERT', 'AUTH_FAILED', 0, NULL, 'Attempted login with invalid/inactive code', NULL, '2026-09-06 16:12:17.106'),
(127, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-07 04:23:48.867'),
(128, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-07 04:24:37.184'),
(129, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-07 04:25:25.929'),
(130, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-07 04:26:52.616'),
(131, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-07 05:01:50.157'),
(132, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-07 05:03:48.962'),
(133, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-07 05:06:35.794'),
(134, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-07 06:54:40.764'),
(135, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 25, NULL, '{\"calls\":17,\"visits\":0,\"deals\":1,\"isBelowTarget\":false}', NULL, '2026-09-07 12:15:24.952'),
(136, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 26, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-07 12:15:44.892'),
(137, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 27, NULL, '{\"calls\":37,\"visits\":0,\"deals\":4,\"isBelowTarget\":false}', NULL, '2026-09-07 12:25:06.799'),
(138, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 28, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-07 12:34:35.558'),
(139, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-08 04:28:29.832'),
(140, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-08 06:29:28.455'),
(141, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-08 06:48:16.467'),
(142, 6, 'SECURITY_ALERT', 'AUTH_FAILED', 6, NULL, 'Invalid password attempt', NULL, '2026-09-08 06:59:31.259'),
(143, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-08 10:54:22.852'),
(144, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 29, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-08 12:29:35.151'),
(145, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 30, NULL, '{\"calls\":42,\"visits\":0,\"deals\":4,\"isBelowTarget\":false}', NULL, '2026-09-08 12:30:03.626'),
(146, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 31, NULL, '{\"calls\":18,\"visits\":0,\"deals\":1,\"isBelowTarget\":false}', NULL, '2026-09-08 12:30:30.266'),
(147, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 32, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-08 12:30:49.023'),
(148, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-08 12:34:10.221'),
(149, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-08 12:34:52.726'),
(150, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-08 13:03:09.579'),
(151, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 33, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-08 16:43:37.707'),
(152, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-09 03:54:43.004'),
(153, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 34, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-09 12:06:44.022'),
(154, 7, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 35, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-09 12:23:06.457'),
(155, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-09 12:26:50.944'),
(156, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 36, NULL, '{\"calls\":9,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-09 12:28:51.459'),
(157, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 37, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-09 12:28:56.665'),
(158, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 38, NULL, '{\"calls\":39,\"visits\":0,\"deals\":4,\"isBelowTarget\":false}', NULL, '2026-09-09 12:29:24.628'),
(159, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-09 12:31:01.952'),
(160, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-09 18:47:26.042'),
(161, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-10 04:22:09.030'),
(162, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 04:25:21.979'),
(163, 3, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 3, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 05:00:47.390'),
(164, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-10 05:50:37.047'),
(165, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-10 07:11:01.187'),
(166, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-10 07:14:50.066'),
(167, 1, 'SECURITY_ALERT', 'AUTH_FAILED', 1, NULL, 'Invalid password attempt', NULL, '2026-09-10 07:16:14.011'),
(168, 17, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 17, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 07:25:55.238'),
(169, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 09:58:31.413'),
(170, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 12:05:36.888'),
(171, 3, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 39, NULL, '{\"calls\":15,\"visits\":0,\"deals\":1,\"isBelowTarget\":false}', NULL, '2026-09-10 12:09:45.532'),
(172, 2, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 40, NULL, '{\"calls\":34,\"visits\":0,\"deals\":3,\"isBelowTarget\":false}', NULL, '2026-09-10 12:13:53.299'),
(173, 6, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 41, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-10 12:27:54.001'),
(174, 4, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 4, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 12:30:34.262'),
(175, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-10 12:31:27.852'),
(176, 4, 'SUBMIT_DAILY_REPORT', 'DAILY_REPORT', 42, NULL, '{\"calls\":0,\"visits\":0,\"deals\":0,\"isBelowTarget\":false}', NULL, '2026-09-10 12:31:57.399'),
(177, 2, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 2, NULL, 'Refresh token reuse detected', NULL, '2026-09-11 04:16:07.347'),
(178, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-11 04:45:46.572'),
(179, 1, 'SECURITY_ALERT', 'TOKEN_FAMILY_REVOKED', 1, NULL, 'Refresh token reuse detected', NULL, '2026-09-11 07:28:57.989'),
(180, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-11 07:29:50.610'),
(181, 1, 'KIOSK_LOGIN', 'KIOSK_CREDENTIAL', 1, NULL, '{\"branch_name\":\"Miyapur (Main Branch)\",\"label\":\"Attendance portal\"}', NULL, '2026-09-11 07:30:35.673'),
(182, 17, 'SECURITY_ALERT', 'AUTH_FAILED', 17, NULL, 'Invalid password attempt', NULL, '2026-09-11 07:31:29.258'),
(183, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-11 08:31:24.149'),
(184, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-11 08:31:44.119'),
(185, 5, 'SECURITY_ALERT', 'AUTH_FAILED', 5, NULL, 'Invalid password attempt', NULL, '2026-09-11 08:32:15.983'),
(186, 31, 'SECURITY_ALERT', 'AUTH_FAILED', 31, NULL, 'Invalid password attempt', NULL, '2026-09-11 09:57:26.757');

-- --------------------------------------------------------

--
-- Table structure for table `AuthSession`
--

CREATE TABLE `AuthSession` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `family_token` varchar(191) NOT NULL,
  `refresh_token_hash` varchar(191) NOT NULL,
  `consumed` tinyint(1) NOT NULL DEFAULT 0,
  `revoked` tinyint(1) NOT NULL DEFAULT 0,
  `revocation_reason` varchar(191) DEFAULT NULL,
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `AuthSession`
--

INSERT INTO `AuthSession` (`id`, `employee_id`, `family_token`, `refresh_token_hash`, `consumed`, `revoked`, `revocation_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(1, 1, 'b4b0632d-1bd9-47ec-8078-d888614a314e', 'eb5b3a36e16a2da9cb4f0acb9ed24fe4adb32d16dc0831160456c2319688d6a6', 0, 0, NULL, '2026-09-08 01:40:37.337', '2026-09-01 01:40:37.338', '2026-09-01 01:40:37.338'),
(2, 1, 'acaa16ea-cdb8-4a53-b849-62ede1b4b76a', '4ad807e1bb5c1b6ec0c02d9d05be28399f0353ee99c5aa45b9c7ebc219e3dac4', 0, 0, NULL, '2026-09-08 01:43:08.132', '2026-09-01 01:43:08.133', '2026-09-01 01:43:08.133'),
(3, 1, '74b6867a-8b69-46a3-891c-f253126ac8da', 'fa47358b4042e288ae56db417b21bc9adff16ffe9a9c6274bcd2fbd15246596e', 0, 0, NULL, '2026-09-08 04:07:11.305', '2026-09-01 04:07:11.306', '2026-09-01 04:07:11.306'),
(4, 1, '404f1f54-b869-42e3-b2f5-52e07f6cb868', '272c085e2673ddc1e52ab155e71c4e1af5cc472ece7380c4f7739ebe745bb607', 0, 0, NULL, '2026-09-08 04:11:24.884', '2026-09-01 04:11:24.885', '2026-09-01 04:11:24.885'),
(5, 1, '96c804ba-655d-4a26-9181-bc74e5cd47ee', '6b78713301fb2c83b5f6a3f32c81eae31e408fe0ebaa4f38ccb5ea1c690682c3', 0, 0, NULL, '2026-09-08 04:14:36.524', '2026-09-01 04:14:36.525', '2026-09-01 04:14:36.525'),
(6, 1, 'c3b455c8-d434-4b57-ae76-87d3ec7fc96f', '62b5e53eb7ae5f2bc5db61f66ea4999a9c20081e86c02094a56101da2adaeb9d', 0, 0, NULL, '2026-09-08 04:26:42.006', '2026-09-01 04:26:42.007', '2026-09-01 04:26:42.007'),
(7, 1, 'ba745bc7-0ffb-4b36-862c-66123eff0c00', '44d2394548eef2abbcc16d9a05be75d4482c759c74e214daf1abc2d691c0f42b', 0, 0, NULL, '2026-09-08 04:37:48.462', '2026-09-01 04:37:48.463', '2026-09-01 04:37:48.463'),
(8, 1, '6f396592-e506-444f-9b9f-c8714058b215', '119afdac797f63ea3626b459aeff2bbab5c3b2171622204b4a0cb34a099cee73', 0, 0, NULL, '2026-09-08 04:45:32.559', '2026-09-01 04:45:32.560', '2026-09-01 04:45:32.560'),
(9, 1, '2aa5b806-1e82-4a83-8d04-39efe7973f71', 'bf2c66d8464af99d71f2fc34c710c47ae4792f5a3abf4e5e278c219db449b4bf', 0, 0, NULL, '2026-09-08 04:46:13.665', '2026-09-01 04:46:13.666', '2026-09-01 04:46:13.666'),
(10, 1, 'ee5e105a-6dad-4522-83e2-0c332e3f0527', '9a8bb68a74201c794ce68ab468e7dc0585488ae2f342056ed2cc96021f8beb32', 0, 0, NULL, '2026-09-08 04:47:53.952', '2026-09-01 04:47:53.953', '2026-09-01 04:47:53.953'),
(11, 1, '70f5084c-64d3-4dd5-8cf7-8bc05876c29c', 'b773db06ba29f912ff866af6d7d85558b5e3f7443ba297ad7787e0317426695a', 0, 0, NULL, '2026-09-08 04:53:13.399', '2026-09-01 04:53:13.400', '2026-09-01 04:53:13.400'),
(12, 2, 'ec31d520-0baf-4514-9397-6da09480eac4', 'a09a3027350b582270a112ea7d40c61cd7c1b246b505f47edd6a00ad83908e43', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 04:54:07.001', '2026-09-01 04:54:07.002', '2026-09-01 04:55:19.649'),
(13, 2, 'e4557a28-501e-41a8-a9b8-ead6751a6138', '9c01844bc1a0e814adfbd867ff79551b359c55db1398b59a6ade891304d53535', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 04:55:24.488', '2026-09-01 04:55:24.489', '2026-09-01 05:22:43.157'),
(14, 1, '2e3e0337-66bc-4f17-823a-3cbc922928d4', '7eea62f5091886fb1f65da28848989c8ef2c08e412b395c85fcdb8670fba8289', 0, 0, NULL, '2026-09-08 04:57:10.167', '2026-09-01 04:57:10.168', '2026-09-01 04:57:10.168'),
(15, 3, 'bc83d11e-f769-48ee-963d-82f6ab355583', '19d031ac44b6d7582413e5ff45ba52c81bd02bd0f9ba73e5c80c3c88eacfa6df', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 04:58:39.385', '2026-09-01 04:58:39.386', '2026-09-01 04:59:45.410'),
(16, 3, '413208bf-70cd-4384-87f3-a38558b2d8e8', '4b4bd87927d4e60878bb8cebf387e596aeaea2a943604cdf2b36e611985ab654', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 04:59:54.387', '2026-09-01 04:59:54.388', '2026-09-02 17:34:32.526'),
(17, 2, '38160754-2ac3-4f35-99f8-e2ce28a7e81a', '4638b12a2dcc77cc3ff84484e9acd220a1a67cd59f3f272eda2400f03d9fa0ad', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 05:09:01.779', '2026-09-01 05:09:01.780', '2026-09-01 05:22:43.157'),
(18, 2, '29c7d738-218a-41b9-ab08-11515dd3873b', 'a3e942d7eb3f503784b27f01040717beb3801f2a85da482a3e203072fcb91727', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 05:10:45.528', '2026-09-01 05:10:45.529', '2026-09-01 05:22:43.157'),
(19, 3, 'fa38fccd-9abc-4844-9c9a-88548890dcc6', '8baf149d20faa2bf0b87dfe19bec3e7ed312f270389972504508df025e2f0074', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 05:12:32.695', '2026-09-01 05:12:32.695', '2026-09-02 17:34:32.526'),
(20, 4, 'd389f273-7f54-4754-8d48-54b97109f381', 'd1a0530da327fa0e3b794a86f90402cffc703bdd7dd6ddeddb149f5370e7a423', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 05:12:35.443', '2026-09-01 05:12:35.444', '2026-09-01 05:16:09.725'),
(21, 4, '0feb7a53-5575-400e-9e8c-bbb92dbffb61', '8a6154c30d790f7602a3a6c982b484b6e58c6526ef339540e564e1e7f36dd9bf', 0, 0, NULL, '2026-09-08 05:16:14.289', '2026-09-01 05:16:14.290', '2026-09-01 05:16:14.290'),
(22, 2, '8334bb93-544b-47da-a6cc-a840bda3f71e', '4565bfac10826599f1b6bc6a4d551762cbc631fbcc4a4c3ef9fad1021097d1b6', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 05:16:34.228', '2026-09-01 05:16:34.229', '2026-09-01 05:22:43.157'),
(23, 2, 'fbfcfc57-b05f-42f1-b46b-e0d7daa9ef4b', '78bc1250322e744ceed6b40053e6129fc70799da2a6d8fc89d8ebe3f1b1f017f', 0, 0, NULL, '2026-09-08 05:22:47.929', '2026-09-01 05:22:47.930', '2026-09-01 05:22:47.930'),
(24, 2, 'a04029dc-8211-4bf6-a3e8-041229314bda', 'f1837222ad68105f77278e0ac469a90662e493086a4d7cc40835342bfd48fffc', 0, 0, NULL, '2026-09-08 05:24:04.095', '2026-09-01 05:24:04.095', '2026-09-01 05:24:04.095'),
(25, 2, '654fc241-24ed-422c-84aa-5101c6b11d44', 'a6998fa5352694ba68fb48d3b3b3c649496281ebe9a5247ca87b75442d391e80', 0, 0, NULL, '2026-09-08 05:26:55.623', '2026-09-01 05:26:55.624', '2026-09-01 05:26:55.624'),
(26, 3, '0c0f5966-4f72-48e3-b94a-9f45f2912bbc', '46de85c6f7cde237d2357e17f2b6e849887a13ebc9a1eda98ed4d02fc3e2d8d2', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 05:34:11.531', '2026-09-01 05:34:11.532', '2026-09-02 17:34:32.526'),
(27, 2, '51f6781b-fe01-4ffb-b657-11a924c4932f', 'f304ff3feacd639b493567f502665917a03309766ce47bc2d8583ab0c541cc2e', 0, 0, NULL, '2026-09-08 05:35:11.721', '2026-09-01 05:35:11.722', '2026-09-01 05:35:11.722'),
(28, 3, 'ea2c2eef-99d8-4441-859e-e31854132b78', '03d99974489567c419940f957a95059346d81283cb45efcee085e22a2cb518d7', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 05:36:44.514', '2026-09-01 05:36:44.515', '2026-09-02 17:34:32.526'),
(29, 3, 'fe9393e2-c60a-460a-bdc0-d30fca4ad4e0', '93e36a488cec2cb68b73d24d4364941fb67b86b57161ed119c520be6e2527f08', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 05:37:12.073', '2026-09-01 05:37:12.073', '2026-09-02 17:34:32.526'),
(30, 2, 'e47642f0-3fcd-4332-80dc-7a5f35a3359f', '7b54f57b1aecac838459f37bd1e6a2189d09122244169b3ead6293e07f78e545', 0, 0, NULL, '2026-09-08 05:37:52.403', '2026-09-01 05:37:52.404', '2026-09-01 05:37:52.404'),
(31, 2, '8ef47201-95da-46cc-b739-bbe8e06c0ea6', '04e06e3d24c197df5d4806343095481719d93ea6abd95ab7d91f13cf3380bcbe', 0, 0, NULL, '2026-09-08 05:38:28.604', '2026-09-01 05:38:28.605', '2026-09-01 05:38:28.605'),
(32, 4, 'ec0c0753-b503-469d-a343-f4ccda80aca5', '4b0cd43425e28f11788383e796f1062ef7855b0345115e2b2c91ebc22984ccb7', 0, 0, NULL, '2026-09-08 05:40:12.852', '2026-09-01 05:40:12.853', '2026-09-01 05:40:12.853'),
(33, 3, '96a27d22-a894-418a-a675-9acef5505c44', '4157dbda2030d4252fe042a72178977ac26bf144516d9c396cad8085e6ff1fc7', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 05:42:06.559', '2026-09-01 05:42:06.559', '2026-09-02 17:34:32.526'),
(34, 4, '399597f5-f256-4d52-99bf-bf76fe48a73b', 'fc5c0624ab34ebf1d799f52af46857ba9e86e61ba76df9b41b41e14e48a3d9d6', 0, 0, NULL, '2026-09-08 05:42:22.110', '2026-09-01 05:42:22.111', '2026-09-01 05:42:22.111'),
(35, 4, '7f3f209b-6a39-498a-aca6-2634c9ad48a6', '515feaa4b375412db2d3f57714b3ae152b9408e582bd17096ec10c1dff6a4337', 0, 0, NULL, '2026-09-08 05:50:56.386', '2026-09-01 05:50:56.387', '2026-09-01 05:50:56.387'),
(36, 2, '917c876a-a1df-4507-a283-96871aee1cca', 'f3539acb5962083cc634544839b94512339caa227a149c9a1ed56de8df1cb2ca', 0, 0, NULL, '2026-09-08 05:55:58.257', '2026-09-01 05:55:58.257', '2026-09-01 05:55:58.257'),
(37, 1, '2ddf0762-9671-4bc2-9b4d-ea20c3dfef2a', 'c71581d25ab1f7ed2fb7d7016fc95939de5e628181d50dc27330a06deb368304', 0, 0, NULL, '2026-09-08 07:10:23.058', '2026-09-01 07:10:23.059', '2026-09-01 07:10:23.059'),
(38, 1, 'f3548ed7-214e-4e38-a8a7-2da03731dc51', '792951e30acf6f28c08b1f4f77299a3010529a8bab5446a3d33dbdb06c0edeaf', 0, 0, NULL, '2026-09-08 07:18:32.047', '2026-09-01 07:18:32.048', '2026-09-01 07:18:32.048'),
(39, 1, '8c77192e-d318-4b3a-abe7-59ae34ca413a', '26bed74771dbd335810504139d9dc9b75e8ce3005fff6f78525cf9fb00e77f30', 0, 0, NULL, '2026-09-08 07:19:22.988', '2026-09-01 07:19:22.989', '2026-09-01 07:19:22.989'),
(40, 5, 'f802655a-5ef7-4fb5-af0a-f1e5894f7882', '83dc178dc76cc1d9f828a2517845c0a9661cc9486359458dd9514e913c9984a2', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 07:27:12.473', '2026-09-01 07:27:12.473', '2026-09-01 07:31:54.659'),
(41, 1, 'a8ca8006-9aec-4099-a56a-8deecf8235bf', '9fbb239ea72e0dab82e8e08ab4a4a662a6f4609584169cd30c2eca942a7169f6', 0, 0, NULL, '2026-09-08 07:29:25.485', '2026-09-01 07:29:25.486', '2026-09-01 07:29:25.486'),
(42, 5, '73f61993-c8c2-4d80-a9d2-9f4ac6dd255b', '78b2aa990a61ced4b334650645e04adb5ab265eb1af87c6f24244f5424ad8b65', 0, 1, 'PASSWORD_CHANGED', '2026-09-08 07:29:42.233', '2026-09-01 07:29:42.233', '2026-09-01 07:31:54.659'),
(43, 1, '00987963-ac89-4b59-9ea6-1dfa9adc83f3', 'f213faf1ac7a5c38bd3c664af50e908b7e1d568d6a69227f8cc92eed6390da8d', 0, 0, NULL, '2026-09-08 07:31:05.717', '2026-09-01 07:31:05.718', '2026-09-01 07:31:05.718'),
(44, 5, '1a46b67e-306d-4685-9664-0bccf5cf1a2e', '33efcf615db38a4ea2e60e734bf42ec326b369fe0c4f82ab327bfe42d97e8e85', 0, 1, 'ADMIN_PASSWORD_RESET', '2026-09-08 07:31:59.265', '2026-09-01 07:31:59.266', '2026-09-06 12:03:26.987'),
(45, 1, '3f795f59-68cc-48bb-ae3b-875b8adece3b', 'e23e15dbbc954dea7d2215be7a564e8b4942e198901ea19aedebde25da5bba8c', 0, 0, NULL, '2026-09-08 07:36:29.895', '2026-09-01 07:36:29.896', '2026-09-01 07:36:29.896'),
(46, 1, '5c4c530a-d72d-44c1-a90e-6afbe6a182cf', '87e5ae92d32724d310b03a000735799715488252b60a0c5a86dff81e50367719', 0, 0, NULL, '2026-09-08 07:36:49.303', '2026-09-01 07:36:49.304', '2026-09-01 07:36:49.304'),
(47, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', '94c09ec776a4219dd4141e42c8631ee4c4f405c14c18cfe9aea999cd51ce8a20', 1, 0, NULL, '2026-09-08 07:37:04.849', '2026-09-01 07:37:04.850', '2026-09-01 07:37:35.007'),
(48, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', 'ba52dc34fbbefee7aa6c9d4a9a60114ee8d32577adb3b2687a68bfdb5a26ad7a', 1, 0, NULL, '2026-09-08 07:37:38.645', '2026-09-01 07:37:38.645', '2026-09-01 07:37:51.109'),
(49, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', 'fd908abf15e356b4dcfe10d7a96ad3a9e9740a74faed7112b4aac5754f62fe88', 1, 0, NULL, '2026-09-08 07:37:54.779', '2026-09-01 07:37:54.780', '2026-09-01 07:39:29.426'),
(50, 1, '58023de6-a91b-43ac-bfcd-2fc857915a14', '8f3b2da8d95461240703699a37a883b31e771074c850c94123f8051d09b025aa', 0, 0, NULL, '2026-09-08 07:39:03.874', '2026-09-01 07:39:03.875', '2026-09-01 07:39:03.875'),
(51, 1, '645aca41-34c5-409e-8bdc-557ecd172118', '215b7f4cc76f4922680c6152961135d06191c8256edb8785bf491e6a905318f9', 0, 0, NULL, '2026-09-08 07:39:25.742', '2026-09-01 07:39:25.743', '2026-09-01 07:39:25.743'),
(52, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', '262c57863ad6f7a76dcf496d3b32f6be99f0b6c3e93d98d704f83908c18a57b9', 1, 0, NULL, '2026-09-08 07:39:33.182', '2026-09-01 07:39:33.182', '2026-09-01 07:41:24.499'),
(53, 1, '0c1d8dbf-74a9-426e-b1d6-25ea13ce42d5', '84d58a318b8a4017de2aa2f5cebd9953c0397f5c74e8c1410bf5709148684fa9', 0, 0, NULL, '2026-09-08 07:40:00.153', '2026-09-01 07:40:00.153', '2026-09-01 07:40:00.153'),
(54, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', '2c811b650463ebc5292cd547bb90ba4c93bf5d93b5741ed5b4e181f2e4ba430f', 1, 0, NULL, '2026-09-08 07:41:28.261', '2026-09-01 07:41:28.262', '2026-09-01 07:50:27.349'),
(55, 5, 'fd69276c-8824-4b07-868c-014b6b489ff2', '5b8a9a14fdb91eb90c9dad97c69b913317aa7005cd533012073e329554ebd569', 0, 1, 'LOGGED_OUT', '2026-09-08 07:43:04.582', '2026-09-01 07:43:04.582', '2026-09-11 08:30:15.773'),
(56, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', '27f54f0022ae7d703894a0ea65f8b8b143c4b1a8c78780de3548a7126c3fdf50', 1, 0, NULL, '2026-09-08 07:50:31.285', '2026-09-01 07:50:31.286', '2026-09-01 07:54:57.044'),
(57, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', '067f7165d8db4379965a2f89880762c3433334690cccf6aa320a4b36700920ac', 1, 0, NULL, '2026-09-08 07:55:00.790', '2026-09-01 07:55:00.791', '2026-09-01 08:01:04.239'),
(58, 1, '67fd6175-a2ac-428d-8b37-bd45d9e25a90', 'c1fa39424777e4b6efac4b7708ea4264e2020bf2608212a3e1f79faae2f16c33', 0, 1, 'LOGGED_OUT', '2026-09-08 08:01:07.938', '2026-09-01 08:01:07.939', '2026-09-01 13:16:53.340'),
(59, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '47c32169485c91b511524678c50d932e05c05c14df5d1d7411a4137daa4ba898', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 08:01:24.827', '2026-09-01 08:01:24.828', '2026-09-01 09:31:02.475'),
(60, 2, '33cadf0f-e866-4586-977e-c1d677968c5b', '1bc674959178948f12e4ef4f2f70e93a0f0182f4fbcccf0ee38f782cdfd24a52', 0, 0, NULL, '2026-09-08 08:16:36.498', '2026-09-01 08:16:36.499', '2026-09-01 08:16:36.499'),
(61, 1, '940a534b-4b49-4821-868e-35dabb10b31f', 'ba6988b960f3f536dd08e92e19235ab88cd18ef1b48aec231d84e05e360b08a3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 08:24:30.787', '2026-09-01 08:24:30.788', '2026-09-01 09:31:02.475'),
(62, 1, '940a534b-4b49-4821-868e-35dabb10b31f', 'e8ccbb8ef65f54ef055fd7e20bc12adb4f673e762d0f0e67c319ad0cdac3db47', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 08:30:04.601', '2026-09-01 08:30:04.602', '2026-09-01 09:31:02.475'),
(63, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '14ef6f9524e57c2ee8e430ad48a91aa892ee24f1aa9583d6c22c6449fd8b1a8f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 08:47:40.969', '2026-09-01 08:47:40.970', '2026-09-01 09:31:02.475'),
(64, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '8167aed6754032d7e595f531094c9b331270391272b80575020e7b98b2dbd1bc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 08:52:11.855', '2026-09-01 08:52:11.856', '2026-09-01 09:31:02.475'),
(65, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '9c645a10c034fdaa810ea56adef332aee12a8b7defe7722569c538fc7b5d39b0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 09:05:49.999', '2026-09-01 09:05:49.999', '2026-09-01 09:31:02.475'),
(66, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '1280d65ebfc2e92fbc64ffd1c6bb423aef94420d2f0729812ff8e78c53c55ebb', 1, 0, NULL, '2026-09-08 09:31:05.399', '2026-09-01 09:31:05.399', '2026-09-01 09:39:13.961'),
(67, 1, '940a534b-4b49-4821-868e-35dabb10b31f', '7bf6180106f32a8fbfa94aa4469da2b941cb11565b921b7155d4eed273fc76d5', 0, 0, NULL, '2026-09-08 09:39:18.878', '2026-09-01 09:39:18.879', '2026-09-01 09:39:18.879'),
(68, 3, '9b85122e-1b50-44bb-b32d-f3f1a0d888e6', '00fe5fd926b4d25d1888c496ff624cb86b0ae32fd5184441bba96bdbb82fd5d9', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 09:51:37.687', '2026-09-01 09:51:37.687', '2026-09-02 17:34:32.526'),
(69, 3, '3328e0e9-a78f-40e9-b0e6-a584d2acbd3b', 'd9d3338431269daabbfaf3536cc004e2579bc26918e52eb0a9b98cc50cf6380e', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 09:56:12.132', '2026-09-01 09:56:12.133', '2026-09-02 17:34:32.526'),
(70, 3, '39e3f4a2-f56b-4f6c-9829-9b78a36221bc', 'bc724ef2ee74904bf92445e82be2520f1f61fc090c78027340d00259c92f0caa', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 09:56:38.554', '2026-09-01 09:56:38.555', '2026-09-02 17:34:32.526'),
(71, 3, '31c83c19-0348-493e-ac13-030059add8ec', 'bf445e0ba12a369b71e6b375fd87e9209fe11dea911390e87c12f3d5f6efd2ac', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 09:56:58.966', '2026-09-01 09:56:58.969', '2026-09-02 17:34:32.526'),
(72, 6, 'cb3d9617-7c5f-4263-ad6f-d2c8a34cb236', '4093014ee3e05c525eea753e9acd8c1daac952833e27372bee81e7993add60c0', 0, 1, 'LOGGED_OUT', '2026-09-08 10:04:26.718', '2026-09-01 10:04:26.718', '2026-09-01 10:22:22.618'),
(73, 6, 'a24c735b-28a1-4991-809f-dc5fdbfe5b58', 'debd5f2a50f0796eb87c5f9f5e58d531317c287b132c24d77254a26ceb0b24a1', 0, 0, NULL, '2026-09-08 10:07:10.560', '2026-09-01 10:07:10.560', '2026-09-01 10:07:10.560'),
(74, 3, '5642c5c0-7ae7-4698-bbe5-e80cc969dfa7', '22563991e1ef027ed676a6a41298768a85b8e05c3bdf4c9351e7842458b4bb13', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:09:37.705', '2026-09-01 10:09:37.705', '2026-09-02 17:34:32.526'),
(75, 7, '953622bd-b863-4584-8f14-9c26ff8fc1cc', '7f10c7aad627c1ebc1a531968e3bedf9808f144cc699174709109dadc565a319', 0, 1, 'LOGGED_OUT', '2026-09-08 10:11:04.081', '2026-09-01 10:11:04.082', '2026-09-01 11:43:04.934'),
(76, 3, '838171de-c6d1-4f2f-bc5e-970763b14716', '8d458d39729bff22762d66353978c79cb3b0872f0b121b1ed01fa5cce3791b38', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:11:33.771', '2026-09-01 10:11:33.772', '2026-09-02 17:34:32.526'),
(77, 7, '8ffc76dc-09e7-4230-a7d5-8427089dd154', '27f3d8795f8998ad2492286905695db892096ecd3288c17b415c1638d0982445', 0, 0, NULL, '2026-09-08 10:11:54.620', '2026-09-01 10:11:54.621', '2026-09-01 10:11:54.621'),
(78, 4, 'a50b40f3-9f48-40d4-9f61-5c67ee56f0f6', '8806a7f31957950d97ce7702af17688fc0a78d5393d7ebf6277653a2f11fa209', 0, 0, NULL, '2026-09-08 10:16:04.202', '2026-09-01 10:16:04.203', '2026-09-01 10:16:04.203'),
(79, 4, '4cc5043c-9741-466e-8599-8026bebab9e0', '3e75cddff73d6e9dfbfe6a564225b61e6f8b2dad1b6792c01bdc7658d50088f5', 1, 0, NULL, '2026-09-08 10:17:15.772', '2026-09-01 10:17:15.773', '2026-09-01 12:24:00.759'),
(80, 3, '916b553a-5685-4353-9569-a19c9030505c', '77a9d26a9a41834b6ea4a928e33f26d72becc48f0a52c42777696b75872bb7f4', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:35:20.475', '2026-09-01 10:35:20.476', '2026-09-02 17:34:32.526'),
(81, 3, '916b553a-5685-4353-9569-a19c9030505c', '40023f7a2141d589435d7fa764e890affa6635d8cd1216ebff42c38503cad237', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:35:58.780', '2026-09-01 10:35:58.781', '2026-09-02 17:34:32.526'),
(82, 3, '916b553a-5685-4353-9569-a19c9030505c', 'e534713ff4114ef52634da4f7ffb2ea59da4de61af35129344752f4d55b63556', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:37:45.301', '2026-09-01 10:37:45.301', '2026-09-02 17:34:32.526'),
(83, 3, '916b553a-5685-4353-9569-a19c9030505c', 'a956e8aaa215f9fd8dafbc8a257c8b975dd67f839192bedc6acec4522eaee039', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:39:34.366', '2026-09-01 10:39:34.367', '2026-09-02 17:34:32.526'),
(84, 3, '916b553a-5685-4353-9569-a19c9030505c', '6bd3ef58686751a75fdf8fac891b6d9a00cfc842ac5d991cf550be68f7bb07bf', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:41:14.859', '2026-09-01 10:41:14.860', '2026-09-02 17:34:32.526'),
(85, 3, '916b553a-5685-4353-9569-a19c9030505c', 'f5832f6a66cc4b6d60994e3ccc64fc7f0402f2875e335720c409770fe7a43c92', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:41:39.066', '2026-09-01 10:41:39.067', '2026-09-02 17:34:32.526'),
(86, 3, '916b553a-5685-4353-9569-a19c9030505c', 'aec5fcff04f944b5eb9a37ae8a6ad655a9872c6c7551b7d77e64c40dc88ab3ae', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:41:55.074', '2026-09-01 10:41:55.075', '2026-09-02 17:34:32.526'),
(87, 3, '916b553a-5685-4353-9569-a19c9030505c', 'ed84bdcf66e57d895c0d16b3545ce4bbbbf5c2618a0fb15e5c9305b4d7914ac5', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:42:24.811', '2026-09-01 10:42:24.812', '2026-09-02 17:34:32.526'),
(88, 3, '916b553a-5685-4353-9569-a19c9030505c', '2b2d10024c880715e732066d28c65dffd20bcfdf4355104e0096759efa94bfa8', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:45:47.426', '2026-09-01 10:45:47.427', '2026-09-02 17:34:32.526'),
(89, 3, '916b553a-5685-4353-9569-a19c9030505c', '7d93bf27640bb9c29fc168198c880436279715824469157f54f316b54e64adba', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:46:09.416', '2026-09-01 10:46:09.417', '2026-09-02 17:34:32.526'),
(90, 2, '511f81b6-0941-4aa2-9393-551649d16115', '753836c6594f9cd9c51856d5370ae122efe6a92f16aa18db802a328aac01aa63', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 10:49:02.709', '2026-09-01 10:49:02.710', '2026-09-01 10:56:03.042'),
(91, 2, '511f81b6-0941-4aa2-9393-551649d16115', '3984eea82e6b49ec388c99e0da2eb268ee2a58b5117ffdfd7a4ea71e54500912', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 10:49:21.900', '2026-09-01 10:49:21.900', '2026-09-01 10:56:03.042'),
(92, 3, '916b553a-5685-4353-9569-a19c9030505c', '34d2dfd1bf986531d4b08272fa48fe956cdb7c69c7f6a74c44dd1e83b5887191', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:51:47.059', '2026-09-01 10:51:47.060', '2026-09-02 17:34:32.526'),
(93, 3, '916b553a-5685-4353-9569-a19c9030505c', 'f9253d70c95fde1e07c2aa0f2cd08afb116714d37b3c11ddbd8ae0e46677a79b', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-08 10:51:58.074', '2026-09-01 10:51:58.075', '2026-09-02 17:34:32.526'),
(94, 2, '511f81b6-0941-4aa2-9393-551649d16115', 'b5fc25533a111a273ce1e0406c5da008580ace5dab0d874d7378157f57808414', 1, 1, 'LOGGED_OUT', '2026-09-08 10:55:35.480', '2026-09-01 10:55:35.481', '2026-09-01 10:56:05.593'),
(95, 2, '511f81b6-0941-4aa2-9393-551649d16115', '1412f89e444e6a459bde3bce1bb4f531e1aaee4ec0f96b1c57443d5511d29f40', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 10:55:54.603', '2026-09-01 10:55:54.604', '2026-09-01 10:56:03.042'),
(96, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', '4f4fd778731180c421e1dac35eaab19d00c33ef3e3b13da985d31f40ef581214', 1, 0, NULL, '2026-09-08 10:56:19.193', '2026-09-01 10:56:19.193', '2026-09-01 11:04:00.217'),
(97, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', '0319fe70bb532c3b519ba11e91df5391e3c8efe14e4a3799a514c345ef980845', 1, 0, NULL, '2026-09-08 11:04:03.840', '2026-09-01 11:04:03.841', '2026-09-01 11:07:44.215'),
(98, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', 'dfd4be78cce37415b615026e545bae1c9e92e0b1a381b0b24ece60bc2fa46fbe', 1, 0, NULL, '2026-09-08 11:07:47.899', '2026-09-01 11:07:47.900', '2026-09-01 12:07:32.560'),
(99, 2, '31271179-0ef2-4e1a-9fe9-8802592e625f', 'f12305e5e9932ddd428b30165feac414236a23850e51da20dcf086d9105ffd12', 0, 0, NULL, '2026-09-08 11:12:41.796', '2026-09-01 11:12:41.797', '2026-09-01 11:12:41.797'),
(100, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', 'e0f0ed3c1155daeb730fc07862b335c12db7e6f1dcc7f1c1a88afa4791af863d', 1, 0, NULL, '2026-09-08 12:07:36.849', '2026-09-01 12:07:36.850', '2026-09-01 12:08:04.126'),
(101, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', 'aca8502e9fca584cbdf9183e22acbc38021b37ecae5c9b7f61df214c420e39c6', 1, 0, NULL, '2026-09-08 12:08:07.962', '2026-09-01 12:08:07.963', '2026-09-01 12:09:53.892'),
(102, 3, '916b553a-5685-4353-9569-a19c9030505c', '618153c9830137ff74811a90b9e12402a0a02ef3c5d6c6a32e7fdc8adf705f22', 0, 1, 'LOGGED_OUT', '2026-09-08 12:08:54.118', '2026-09-01 12:08:54.119', '2026-09-01 12:24:49.980'),
(103, 2, '8e367f2d-32b2-445e-a993-6af4527f3bac', 'cc8e83dac5a00095fe0799c6d80a82c564917de550e13efcd710f5ab7d275510', 0, 1, 'LOGGED_OUT', '2026-09-08 12:09:57.468', '2026-09-01 12:09:57.469', '2026-09-01 12:23:00.668'),
(104, 1, '286c7523-5dfa-4b27-9032-bab5a6047956', '798ad8c757c68c87bc5528d1a7e9dfccbb7ad5e97ca157c7ee67b6a9fe3be4f7', 1, 0, NULL, '2026-09-08 12:19:23.702', '2026-09-01 12:19:23.703', '2026-09-01 13:02:51.064'),
(105, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', '58018abb3d06837076b4bf200de04aeae6c13717f3afba403487e0c0911de4c8', 1, 0, NULL, '2026-09-08 12:23:08.176', '2026-09-01 12:23:08.177', '2026-09-01 12:30:13.020'),
(106, 4, '4cc5043c-9741-466e-8599-8026bebab9e0', 'ee9637122ae079cb62dd793faa3e943c5bb410eea5fee5dda5cae1a6a3e6bbeb', 0, 1, 'LOGGED_OUT', '2026-09-08 12:24:04.787', '2026-09-01 12:24:04.788', '2026-09-01 12:27:09.864'),
(107, 3, '64b25655-977f-4fe0-9000-58d576d234e2', 'fc43d0f59f99e4a3971d23faacd2ed23b1435eedfb4a5b9d759f1d85c6457dad', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-08 12:25:07.940', '2026-09-01 12:25:07.941', '2026-09-02 06:24:48.374'),
(108, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', '099df65cf4601c93f6be68fc0b6fba57d2c6abcd33fe85d459af8d6c945d06c5', 1, 0, NULL, '2026-09-08 12:30:20.893', '2026-09-01 12:30:20.894', '2026-09-01 12:30:47.293'),
(109, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', 'd3ec0314be95a1c03a36ee67a544fa270e5a48dda81abacd41aaaddea8d20325', 1, 0, NULL, '2026-09-08 12:30:51.065', '2026-09-01 12:30:51.066', '2026-09-01 12:31:54.346'),
(110, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', 'd93939f4b9165df69bd86005ff2ec20de4bfe8468c2e05f9e43016225815c39d', 1, 0, NULL, '2026-09-08 12:31:58.011', '2026-09-01 12:31:58.012', '2026-09-02 04:21:54.978'),
(111, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', 'e6a766271133a9afeaa1f96cf8fef150c5585522df83f228710b0fed39d58c20', 1, 0, NULL, '2026-09-08 12:31:58.340', '2026-09-01 12:31:58.341', '2026-09-01 12:32:44.406'),
(112, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', '057f205d52ada7c3f49e733e66667cf7f7ea5321dfb97d262c40c21b8ee04135', 1, 0, NULL, '2026-09-08 12:32:48.296', '2026-09-01 12:32:48.297', '2026-09-02 04:19:39.894'),
(113, 1, '286c7523-5dfa-4b27-9032-bab5a6047956', '832ff33f7ab8267a394eaf62297c61641f32d606841282e528c9fbeee9ce0adf', 1, 0, NULL, '2026-09-08 13:02:54.916', '2026-09-01 13:02:54.917', '2026-09-01 13:13:56.195'),
(114, 1, '1ab73f17-c0fc-4fa0-8872-d75ca07b241d', '24c001e0a58525923ddcc6584d5d5861879b939ee995edfdae31cc761a1a221f', 1, 0, NULL, '2026-09-08 13:14:09.624', '2026-09-01 13:14:09.630', '2026-09-01 13:15:03.611'),
(115, 1, '1ab73f17-c0fc-4fa0-8872-d75ca07b241d', 'b422f5941466da51df1853651efdacede097fb428608a9352c5bff9f4b17fb1c', 1, 0, NULL, '2026-09-08 13:15:07.212', '2026-09-01 13:15:07.213', '2026-09-01 13:27:38.570'),
(116, 1, '39632261-4a96-48c9-ac7e-2c6e35a55d14', '555b9ea98227206c56f39c418621d0eb09deb924bf9b6f885f4815dda64ed85f', 1, 0, NULL, '2026-09-08 13:17:01.314', '2026-09-01 13:17:01.315', '2026-09-01 13:17:21.725'),
(117, 1, '39632261-4a96-48c9-ac7e-2c6e35a55d14', '0343c1cd43e8285f52ed7ddc1ec14a24718c58e655f27f0e044e990977dabb08', 1, 0, NULL, '2026-09-08 13:17:24.155', '2026-09-01 13:17:24.156', '2026-09-01 13:17:38.494'),
(118, 1, '39632261-4a96-48c9-ac7e-2c6e35a55d14', '9677d0a5a7e66f1c3f1e9ab93925a918ee83e0c3d46336162d856875b42e822f', 1, 0, NULL, '2026-09-08 13:17:42.361', '2026-09-01 13:17:42.361', '2026-09-01 13:17:52.530'),
(119, 1, '39632261-4a96-48c9-ac7e-2c6e35a55d14', '84b7cb3f7bbc3cf25eac561838d2205e3e5336e371967d61a527f912ae78a6d3', 0, 1, 'LOGGED_OUT', '2026-09-08 13:17:56.231', '2026-09-01 13:17:56.232', '2026-09-01 13:24:21.136'),
(120, 7, '8009b1f4-63e7-4d2e-a9b8-fa1123e50a0f', '911604811946c8799ad94c05cade5b224934a84c91664b7d7f853128eef2db52', 1, 0, NULL, '2026-09-08 13:25:16.393', '2026-09-01 13:25:16.394', '2026-09-01 13:26:16.663'),
(121, 7, '8009b1f4-63e7-4d2e-a9b8-fa1123e50a0f', '0f0607fc214c7b6fb07c4918e36b7cf42815ad179dba0651a79eebf102cb6ced', 1, 0, NULL, '2026-09-08 13:26:21.053', '2026-09-01 13:26:21.054', '2026-09-01 13:49:43.441'),
(122, 1, '1ab73f17-c0fc-4fa0-8872-d75ca07b241d', '84059b9a6f1f7fa175de73869b6529cdd15142249cf98efdc680e9a247c4d0f1', 1, 0, NULL, '2026-09-08 13:27:42.431', '2026-09-01 13:27:42.432', '2026-09-01 13:51:09.678'),
(123, 6, 'a7d471a8-1cc9-4bc3-bdbc-3538c5ad6927', '0ed0ccb519c9922e075f5e87e1776eff36b68f112d6d4f41917711d366a871da', 0, 1, 'LOGGED_OUT', '2026-09-08 13:34:27.195', '2026-09-01 13:34:27.195', '2026-09-01 13:52:19.576'),
(124, 7, '8009b1f4-63e7-4d2e-a9b8-fa1123e50a0f', '26dfe350db9c40897814d0c967dec6cbd849782397df23b8dbf982f4e417e9b8', 0, 1, 'LOGGED_OUT', '2026-09-08 13:49:47.255', '2026-09-01 13:49:47.256', '2026-09-01 13:50:57.353'),
(125, 1, '1ab73f17-c0fc-4fa0-8872-d75ca07b241d', 'bbc269b8cba66f9f8863ab3b46401805c482a63f3e50688a058e5bc99654723b', 0, 1, 'LOGGED_OUT', '2026-09-08 13:51:13.559', '2026-09-01 13:51:13.560', '2026-09-01 14:28:39.263'),
(126, 1, '6c2f682f-0c99-4d38-a223-c0baf965ef4a', '215944e456dfd06560c6a47bb36dc1de686a51c81bb471f63b0aa87a62936e0d', 1, 0, NULL, '2026-09-09 03:44:14.175', '2026-09-02 03:44:14.176', '2026-09-02 03:44:26.050'),
(127, 1, '6c2f682f-0c99-4d38-a223-c0baf965ef4a', 'b06f149c73a9b3dd68c9f3acdc845f9219b34e1c4cc765a684ac4794c3d78742', 0, 1, 'LOGGED_OUT', '2026-09-09 03:44:29.126', '2026-09-02 03:44:29.127', '2026-09-02 03:44:36.045'),
(128, 1, 'ad84860f-bcc3-4fb9-ba51-a98f5bcaeb57', '965d5283f687bfd08aa5231b21a1598df0c69082de86154588042fa2e536dd60', 1, 0, NULL, '2026-09-09 03:44:50.392', '2026-09-02 03:44:50.393', '2026-09-02 03:47:45.095'),
(129, 1, 'ad84860f-bcc3-4fb9-ba51-a98f5bcaeb57', 'e93e87511a9b1faee786c752bae127d61ed7f6608e3c11f311d3946ca149919b', 1, 0, NULL, '2026-09-09 03:47:48.797', '2026-09-02 03:47:48.798', '2026-09-02 04:31:34.431'),
(130, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', 'ea1a8dd2fcf414f9d8555d152c1577290b94e346638567aec8dc52c868019761', 1, 0, NULL, '2026-09-09 04:19:43.509', '2026-09-02 04:19:43.510', '2026-09-02 06:06:53.229'),
(131, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', '57806cde1e3baa173a5523ec1ddaf204169935232d11c9e16c66e20b14741e0a', 1, 0, NULL, '2026-09-09 04:21:58.704', '2026-09-02 04:21:58.705', '2026-09-02 04:22:13.534'),
(132, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', 'a882f8eab3a8c7c51ad8165fb1cbb9d0df8b82ad2fb04a1e03217a92e54c5eb2', 1, 0, NULL, '2026-09-09 04:22:17.323', '2026-09-02 04:22:17.324', '2026-09-02 04:53:07.465'),
(133, 1, 'ad84860f-bcc3-4fb9-ba51-a98f5bcaeb57', 'e6ea92b22d43429dc243a0370992030b7f95aaa9096108666eab11f0baa59b52', 1, 0, NULL, '2026-09-09 04:31:38.121', '2026-09-02 04:31:38.122', '2026-09-02 05:17:17.282'),
(134, 3, '64b25655-977f-4fe0-9000-58d576d234e2', 'b43aa90f6224e3b023dcf86faf428ea3b5ab682f712aff4acd35d960ff699ed3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:47:31.012', '2026-09-02 04:47:31.013', '2026-09-02 06:24:48.374'),
(135, 3, '64b25655-977f-4fe0-9000-58d576d234e2', '47c8e0706dc2259d8c932ec8acd85bd2f700580c7060aeb33fb5e3eb34283abc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:48:02.482', '2026-09-02 04:48:02.483', '2026-09-02 06:24:48.374'),
(136, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '498aa06b825dbd5cbfe0c0434e57cd05e0d83daddfa4523b9a766369e414d0f5', 1, 0, NULL, '2026-09-09 04:49:47.606', '2026-09-02 04:49:47.608', '2026-09-02 12:46:03.713'),
(137, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', 'b63fa05bab882d95b1e373e3026fdc21928c7d6cfc3a5f23d5f3b5587db20ad6', 1, 0, NULL, '2026-09-09 04:53:11.319', '2026-09-02 04:53:11.320', '2026-09-02 12:01:25.960'),
(138, 3, '64b25655-977f-4fe0-9000-58d576d234e2', '8545ecceae92c804a4b9b2b4f3105b500a24ab25bc6316241e71024dda3c6a18', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:53:31.397', '2026-09-02 04:53:31.398', '2026-09-02 06:24:48.374'),
(139, 3, '64b25655-977f-4fe0-9000-58d576d234e2', '3ed5c45974df9100f675ae94710435af31281f304b1caf4079acb14798877477', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:53:56.425', '2026-09-02 04:53:56.425', '2026-09-02 06:24:48.374'),
(140, 3, '64b25655-977f-4fe0-9000-58d576d234e2', 'c1508e2b4851d99551e5c804589c24f295c849539533ac46c16445de764f2c7b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:54:50.510', '2026-09-02 04:54:50.511', '2026-09-02 06:24:48.374'),
(141, 3, '64b25655-977f-4fe0-9000-58d576d234e2', '248bbc39efe7a78098f3599a10c2fd4e0de07451507512e067e2f3836ae81de0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:55:34.135', '2026-09-02 04:55:34.136', '2026-09-02 06:24:48.374'),
(142, 3, '64b25655-977f-4fe0-9000-58d576d234e2', '86d681279133c336483b635b8bbbc26308e937dd31a28428234ba8d2a7e392f1', 1, 1, 'LOGGED_OUT', '2026-09-09 04:55:54.041', '2026-09-02 04:55:54.042', '2026-09-02 06:24:50.877'),
(143, 3, '64b25655-977f-4fe0-9000-58d576d234e2', 'ff60f5e7e1c8efb661e210581a821f757082af23945bcf178d63c1290b734efc', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 04:56:02.454', '2026-09-02 04:56:02.455', '2026-09-02 06:24:48.374'),
(144, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '44e221bc2143efb36f9c73d3445ab6f0bb9e57708f2b969c45df6ad79d11123f', 1, 0, NULL, '2026-09-09 05:17:11.442', '2026-09-02 05:17:11.443', '2026-09-02 05:24:16.951'),
(145, 1, 'ad84860f-bcc3-4fb9-ba51-a98f5bcaeb57', 'c2ac1d338cb505b57a42f757a8265eefb1828689569aab3ec44483521faefa32', 1, 0, NULL, '2026-09-09 05:17:19.701', '2026-09-02 05:17:19.702', '2026-09-02 05:17:29.228'),
(146, 1, 'ad84860f-bcc3-4fb9-ba51-a98f5bcaeb57', '329691536168f399108ebfe38247f1e02b47d134ab24d15f4b8ced166cc1e879', 0, 1, 'LOGGED_OUT', '2026-09-09 05:17:32.243', '2026-09-02 05:17:32.244', '2026-09-02 07:23:07.499'),
(147, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '2c386eb84055df9a0055ec43c0978c2894c945b393d112a42b35aea0129a8385', 1, 0, NULL, '2026-09-09 05:24:20.639', '2026-09-02 05:24:20.641', '2026-09-02 06:06:50.976'),
(148, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '4f3c7a8d1410826c47df7ec449c74d919bf1fb8217a7f44986d94fbaaa00150a', 1, 0, NULL, '2026-09-09 06:06:54.073', '2026-09-02 06:06:54.074', '2026-09-02 06:14:28.577'),
(149, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', '825488062c1650763f2d19986812bd2a41c8d51ec728fa197c832e7486c8cd3c', 1, 0, NULL, '2026-09-09 06:06:57.042', '2026-09-02 06:06:57.043', '2026-09-02 06:07:27.471'),
(150, 2, 'c9110008-4440-40cf-a1fb-4ce9f3da6f89', '3d847b03670c5d155e378e3da79affa2084c325994f01224e8092ac5461e6f91', 0, 0, NULL, '2026-09-09 06:07:30.447', '2026-09-02 06:07:30.448', '2026-09-02 06:07:30.448'),
(151, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '3e97988e3732f6df53acbc7e5bf8b6381aee9f19be83027403157f39a2aee879', 1, 0, NULL, '2026-09-09 06:14:32.177', '2026-09-02 06:14:32.177', '2026-09-02 06:41:49.285'),
(152, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'ebe16e0dab0079728668d50c66bffd03996990fd6c4ef00f9bfdb98074822e95', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 06:24:15.631', '2026-09-02 06:24:15.632', '2026-09-04 09:05:05.741'),
(153, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '2ae3ee9bf8566b48a338d62681beaef144a2d977fb6c7f789c6bfabe0499bdfe', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 06:24:56.463', '2026-09-02 06:24:56.464', '2026-09-04 09:05:05.741'),
(154, 3, '5b467a57-8464-4fe5-acea-98f9061defe1', 'a5a49cec8b18c3e35a15d553849db95d84105fd2de240199c1c60cf46dac5181', 0, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 06:24:57.989', '2026-09-02 06:24:57.990', '2026-09-02 17:34:32.526'),
(155, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', '34c6aacd34dc3e018a81b51898dbefc0ccb82aa7c8b996c87a9938937353bb91', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 06:26:06.949', '2026-09-02 06:26:06.950', '2026-09-02 17:34:32.526'),
(156, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '806daa5b9b5eda1dbbf467ed0ad474967773e4c0fa32430d6f3ae9ade0455237', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 06:41:00.101', '2026-09-02 06:41:00.102', '2026-09-04 09:05:05.741'),
(157, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', 'abbf6494e23095c809521fc7b4ff4c3e486d9d2d971a8cd5bdfb52b266e05fa4', 1, 0, NULL, '2026-09-09 06:41:53.030', '2026-09-02 06:41:53.031', '2026-09-02 06:54:51.632'),
(158, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '575ab8aadd971bd72cc3d07d926b8dbdd0f73accecb6d2f426a89f4fbe917a92', 1, 0, NULL, '2026-09-09 06:54:55.714', '2026-09-02 06:54:55.715', '2026-09-02 07:06:47.615'),
(159, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', 'f9d772e2ec6eca9189357b73cb8e4e2d4af0bdba3d3ddf07580b085e2e0b93a3', 1, 0, NULL, '2026-09-09 07:06:51.420', '2026-09-02 07:06:51.421', '2026-09-02 07:08:32.249'),
(160, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '66885f1bf766004fa02f125c4302e14c8b455b0a692c3bbc1186f6909774710b', 1, 0, NULL, '2026-09-09 07:08:36.033', '2026-09-02 07:08:36.034', '2026-09-02 07:08:47.564'),
(161, 1, 'eebb05e8-2666-40d4-bc01-cbcd85dae2f3', '5a0ef15e37105ea49a2c24e148ca72d662e8e6cfdc6c3ea3f3aa2bc73754eac0', 0, 1, 'LOGGED_OUT', '2026-09-09 07:08:51.491', '2026-09-02 07:08:51.492', '2026-09-02 08:07:13.277'),
(162, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '467e0eb558f6dc8d26e63515aad7f65bda4502844a6fc5460a6072975fceab20', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 07:10:42.301', '2026-09-02 07:10:42.302', '2026-09-04 09:05:05.741'),
(163, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'f3cc5727a6bccda822ce2ff75644c4f5b6e7ad6556174876b4f958c743355827', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 07:10:58.271', '2026-09-02 07:10:58.272', '2026-09-04 09:05:05.741'),
(164, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '1e524cb5f17e8d6affddc6941f6e2584c71ea3838963ebed090f270c5d929da8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 07:11:18.512', '2026-09-02 07:11:18.513', '2026-09-04 09:05:05.741'),
(165, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '1a539ae1e8900421710dfa0a869b9d3b86e980f6312de87ef01d0787346a69a3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 07:12:36.263', '2026-09-02 07:12:36.264', '2026-09-04 09:05:05.741'),
(166, 1, '54ae894e-3652-4614-8a95-7a2889e0d8e4', 'ff316bbec5047fadac8d14bb22defbf2603ad6fec1cb1a43f15ad73b2577dd2a', 1, 0, NULL, '2026-09-09 07:36:29.289', '2026-09-02 07:36:29.292', '2026-09-02 07:36:41.921'),
(167, 1, '54ae894e-3652-4614-8a95-7a2889e0d8e4', '8dbd0b1f7350be145b722aca6a630b0411b6a068113e9e214660d37b5399bc40', 1, 0, NULL, '2026-09-09 07:36:45.587', '2026-09-02 07:36:45.588', '2026-09-02 07:43:45.103'),
(168, 1, '54ae894e-3652-4614-8a95-7a2889e0d8e4', '540b94eb9ca40af21312bce954575295849bdb0a7355928d6678ed43d1d7e3b4', 1, 0, NULL, '2026-09-09 07:43:48.819', '2026-09-02 07:43:48.820', '2026-09-02 07:43:56.802'),
(169, 1, '54ae894e-3652-4614-8a95-7a2889e0d8e4', 'fdd93122e823109fa675afede5817c559c55edbfeb4fc4a613edd79523141487', 1, 0, NULL, '2026-09-09 07:44:00.601', '2026-09-02 07:44:00.602', '2026-09-02 08:08:23.139'),
(170, 1, '54ae894e-3652-4614-8a95-7a2889e0d8e4', 'b931b1f294c7adc816b3084eb2a4e1fc1d3384909c4acd8770798b516d5f00aa', 0, 1, 'LOGGED_OUT', '2026-09-09 08:08:26.801', '2026-09-02 08:08:26.802', '2026-09-02 08:26:43.074'),
(171, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', 'f4ea1b334fdc4d144b7883cf0c8ae8cd796134c962ce6517dc278e2937d9f7ce', 1, 0, NULL, '2026-09-09 08:26:50.642', '2026-09-02 08:26:50.646', '2026-09-02 08:26:59.972'),
(172, 1, 'c6d3eab2-7a20-4bb6-8125-8f49ef9abe8c', 'b87ed9b785eafb12921f74441601029481cb0e77be3e176bf2e97a3e27cf0bc8', 1, 0, NULL, '2026-09-09 08:27:00.483', '2026-09-02 08:27:00.484', '2026-09-02 08:34:48.857'),
(173, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', 'bf38d6995932c07482429d3335c4674d9726beaefab9587414193d44dec91d99', 1, 0, NULL, '2026-09-09 08:27:03.872', '2026-09-02 08:27:03.873', '2026-09-02 08:27:58.388'),
(174, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', 'ba9b6ac5f85ce3c283967e38349527e2ee89af760f39a5b7c910ee713e715a09', 1, 0, NULL, '2026-09-09 08:28:02.305', '2026-09-02 08:28:02.306', '2026-09-02 08:41:58.094'),
(175, 1, 'c6d3eab2-7a20-4bb6-8125-8f49ef9abe8c', 'c5b2daae7d2deb085f251f5bf142124f7cb2d4802d4053d2f7ccf293df649cc6', 1, 0, NULL, '2026-09-09 08:34:52.796', '2026-09-02 08:34:52.797', '2026-09-02 08:41:54.507'),
(176, 1, 'c6d3eab2-7a20-4bb6-8125-8f49ef9abe8c', '8aa502585a8063f5b0b772c4f1ecedee3b2a1dfef0ed96d497d18769e6b85fb7', 1, 0, NULL, '2026-09-09 08:41:58.311', '2026-09-02 08:41:58.312', '2026-09-02 09:54:19.306'),
(177, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', 'b0218defbe3c83a5792623a14ef0d0c951ece2556f1a3dda17b61684f9c173fe', 1, 0, NULL, '2026-09-09 08:42:01.129', '2026-09-02 08:42:01.130', '2026-09-02 08:42:12.476'),
(178, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', '701919c8f563780b19081f2ea2567524b97da08a54e16715708638dd232ca7ab', 1, 0, NULL, '2026-09-09 08:42:16.398', '2026-09-02 08:42:16.398', '2026-09-02 08:42:24.281'),
(179, 1, '41b96bbe-1782-49a2-a886-6ac8195381a2', '85d850e1a6fcf8750b192884331f5703506cb988c1680f240715583bd4f6895e', 0, 1, 'LOGGED_OUT', '2026-09-09 08:42:28.034', '2026-09-02 08:42:28.035', '2026-09-02 12:41:56.717'),
(180, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'c39a8f6c717f736110203c64df8fb0ebc7580b1ce9ce14899bcb6710c95f79f4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 08:44:04.412', '2026-09-02 08:44:04.413', '2026-09-04 09:05:05.741'),
(181, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '553fd5788b78f0a1a82d80d243bd86e169dd515885c26ee2a482779cb8d6ff64', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 08:46:10.533', '2026-09-02 08:46:10.534', '2026-09-04 09:05:05.741'),
(182, 1, '36f1c1b7-8027-4c9e-b567-846748e4660e', 'b37450f523d59258f91918de6a2e029b49b5e11855b1496ca5b5b81038c6df78', 1, 0, NULL, '2026-09-09 09:29:22.112', '2026-09-02 09:29:22.113', '2026-09-02 09:29:36.825'),
(183, 1, '36f1c1b7-8027-4c9e-b567-846748e4660e', 'dc618afef65177df9285649b54ced1904a343a61394a6f1f2bb6fdff9b102b15', 0, 1, 'LOGGED_OUT', '2026-09-09 09:29:39.440', '2026-09-02 09:29:39.441', '2026-09-02 10:00:45.558'),
(184, 1, 'c6d3eab2-7a20-4bb6-8125-8f49ef9abe8c', '0b88d019bd3d544dcdeed08e5f5e85c6b5fe89ae102269f99111f4e8bc55cafb', 1, 0, NULL, '2026-09-09 09:54:23.186', '2026-09-02 09:54:23.187', '2026-09-02 11:18:55.961'),
(185, 1, 'c6d3eab2-7a20-4bb6-8125-8f49ef9abe8c', 'ab6e94554252f0a06eb774d5f898ec067b0e217f0be08c625d84d128a1953ae9', 0, 1, 'LOGGED_OUT', '2026-09-09 11:18:59.735', '2026-09-02 11:18:59.736', '2026-09-02 11:29:06.341'),
(186, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', 'b45ffa81e7ed0f6134f59233269ca31641329bc80ef80357d979d4e37670536c', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 11:52:54.817', '2026-09-02 11:52:54.818', '2026-09-02 17:34:32.526'),
(187, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'b87aef58ccfa6ce4af888f3ba9f39318d880a230c5ec3fe4ef6c8150ed82dc7f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 11:53:22.416', '2026-09-02 11:53:22.416', '2026-09-04 09:05:05.741'),
(188, 1, 'e4e40ed3-deac-4dab-bd3a-633583872401', 'a9fc5538332edea06db161fef49bfe49e1d87808a9da6c3054048885f6c11a0f', 0, 1, 'LOGGED_OUT', '2026-09-09 11:53:28.271', '2026-09-02 11:53:28.272', '2026-09-02 12:24:57.386'),
(189, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'c7e728e6df1e5632fbc7d5bcb8effd9600e9fab8dc624b358fa7711f70ad0edf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 11:53:52.631', '2026-09-02 11:53:52.631', '2026-09-04 09:05:05.741'),
(190, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', '3fd2e850493925b3cc876360e13bfa736c9c80d561708ef221fc0182531645a8', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 11:54:26.118', '2026-09-02 11:54:26.119', '2026-09-02 17:34:32.526'),
(191, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '0a7bfaac43e333702c59b10487bf05381fba600a5195536cd67d126612658a58', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 11:55:17.200', '2026-09-02 11:55:17.201', '2026-09-04 09:05:05.741'),
(192, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'b72419fc8ef2f303c983045f3a18cbf5c8c4486c4dde3e29c934f9419990452c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:00:33.044', '2026-09-02 12:00:33.045', '2026-09-04 09:05:05.741'),
(193, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', '8217ad1d88fd5a2ee34a64bb1e05500a009dbde2e9afc9a4a9b714bc9c792774', 1, 0, NULL, '2026-09-09 12:01:29.910', '2026-09-02 12:01:29.910', '2026-09-02 12:03:07.901'),
(194, 4, 'b3def046-2412-4c90-84be-f6a19c67656c', '490142cdf886b70f690d9df1825fe79ff3b8168f91e982a5853fc299a8f564ee', 0, 1, 'LOGGED_OUT', '2026-09-09 12:03:11.834', '2026-09-02 12:03:11.835', '2026-09-02 12:15:56.914'),
(195, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', 'd460abc4c5553edcce2f232f24239433bb6d0446ecca962278c06b2618ca04a5', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 12:03:32.142', '2026-09-02 12:03:32.143', '2026-09-02 17:34:32.526'),
(196, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '40f410f469096da3a41cc2a9af705da68946dacec7d26f33ec2faa6a659ef388', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:04:42.875', '2026-09-02 12:04:42.876', '2026-09-04 09:05:05.741'),
(197, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', 'a99e62dfa197e1aa9e549dc9e127f734b4a70c533d41e1aee33417e794ecf332', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 12:07:24.779', '2026-09-02 12:07:24.780', '2026-09-02 17:34:32.526'),
(198, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'b3843a82f989235121d06e1617fd9fa8ddca527a31780b1859b39db7b9a306f2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:07:24.799', '2026-09-02 12:07:24.800', '2026-09-04 09:05:05.741'),
(199, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', 'f3dd4844a44b720872ba71a82092c3504a129e65f4f4c7f05c305664746ac58e', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 12:14:40.462', '2026-09-02 12:14:40.463', '2026-09-02 17:34:32.526'),
(200, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', '9ba21996f5bbbf1dc5e3bbbd7034d0e36da9eda1096ebf2f796914b304b20af9', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 12:15:24.558', '2026-09-02 12:15:24.559', '2026-09-02 17:34:32.526'),
(201, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', '3f266ef1a434cd049df1a29d967f96c27dbeb42aa4ed3f5e7bfde46576c28c41', 1, 1, 'AUTHORIZATION_CHANGED', '2026-09-09 12:15:59.321', '2026-09-02 12:15:59.322', '2026-09-02 17:34:32.526'),
(202, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '45655bfc68a885fbb50580ba3bf3013ac111399ac5c6ae022441c6b6347e7a0f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:16:31.559', '2026-09-02 12:16:31.568', '2026-09-04 05:46:48.442'),
(203, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '8f901d4c69d53cb4694c9c0a077350f01198f30b31c83d1f212206aae432d2ed', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:26:23.509', '2026-09-02 12:26:23.509', '2026-09-04 09:05:05.741'),
(204, 1, '3f02d27b-fd01-4e87-8171-fc772267ac3f', '726fda93f32dd34e1b7c7e8e288389040dc29c81741e519a2ed825794431f2e5', 1, 0, NULL, '2026-09-09 12:27:22.145', '2026-09-02 12:27:22.148', '2026-09-02 12:27:22.442'),
(205, 1, '3f02d27b-fd01-4e87-8171-fc772267ac3f', '30bace776a33cc4ac77f381fdf965b9bc531ed49267245810a9580c03801075d', 0, 1, 'LOGGED_OUT', '2026-09-09 12:27:22.763', '2026-09-02 12:27:22.765', '2026-09-02 12:27:22.886'),
(206, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', 'a85677c18a7d88885e70078ebfae4aa0dbadff8880744e0e94a201f0ce846f11', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:29:48.592', '2026-09-02 12:29:48.593', '2026-09-04 05:46:48.442'),
(207, 3, 'd18a52e2-6d2b-4e6a-b5d1-0828b2f214a9', 'fcc2c234841efe07fd36f6526026359c03d9927554734ee87ad3283214f96a31', 0, 1, 'LOGGED_OUT', '2026-09-09 12:30:03.088', '2026-09-02 12:30:03.089', '2026-09-02 12:30:10.425'),
(208, 3, '5919959d-4612-49c4-8ca6-5d30c8a9e1f2', '915b19ee9e9648912c4b37b09fbbcdaf383e2291847bf8ec9f59727730db9f63', 0, 1, 'LOGGED_OUT', '2026-09-09 12:30:17.830', '2026-09-02 12:30:17.831', '2026-09-02 12:30:25.555'),
(209, 3, '5e314189-c596-4cf7-a6c1-6634546ea2e8', '415224979575e6f5712711217821ad0981734134e7532aecae2fdb207782d93f', 0, 1, 'LOGGED_OUT', '2026-09-09 12:30:34.466', '2026-09-02 12:30:34.467', '2026-09-02 12:31:04.115'),
(210, 3, '92d9b348-153a-4387-96c6-dd650bbb6032', '90861820dad4a8c3b65e12b6d7ccbc42c7e8448f3a2567c6da65593102766f3b', 0, 1, 'LOGGED_OUT', '2026-09-09 12:31:12.925', '2026-09-02 12:31:12.926', '2026-09-03 04:39:54.053'),
(211, 1, '77a5d9ef-a1c6-4c0c-8b9c-aee7affa130a', 'e69ecca40bc287b6b821af1482d5a793c7322873dc2eefebabbf53737576c5bb', 0, 1, 'LOGGED_OUT', '2026-09-09 12:37:44.187', '2026-09-02 12:37:44.187', '2026-09-02 13:12:01.371'),
(212, 1, 'c874f147-f909-40f3-b622-0270e27d73a3', 'b90988b307d2df5967d1c87a1696db876a36a13c40c12405eea5923991725c65', 1, 0, NULL, '2026-09-09 12:43:10.319', '2026-09-02 12:43:10.320', '2026-09-02 12:55:58.134'),
(214, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '464cdbdb2eb54cd09e297c12268c9ac415583f1bb343c3260763aa4660ac85e1', 1, 0, NULL, '2026-09-09 12:46:07.466', '2026-09-02 12:46:07.466', '2026-09-02 12:46:33.744'),
(215, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '86c8e0206fdf44e7103d387867f9717e0d41812ed105d3e0b534db2c122b2004', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 12:46:22.869', '2026-09-02 12:46:22.870', '2026-09-04 09:05:05.741'),
(216, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '8f96a64d48b8234faed3daa43bb184d4a0a9098b97ba988ff676591f4c2ee389', 1, 0, NULL, '2026-09-09 12:46:37.431', '2026-09-02 12:46:37.432', '2026-09-02 12:47:16.106'),
(217, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '4b3383fefa12d91545955b944c3fd8d85febb4e09c1c7e005974a9446107e5e9', 1, 0, NULL, '2026-09-09 12:47:18.331', '2026-09-02 12:47:18.331', '2026-09-02 12:51:40.270'),
(219, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', 'eff968e6c2e4603c490d70c3eb84c861fefd4100396cf0a259ba141a9598c140', 1, 0, NULL, '2026-09-09 12:51:44.006', '2026-09-02 12:51:44.007', '2026-09-02 12:51:47.907'),
(220, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '47324783603c147faca6b0f2e4ac4ab76e8e1a0bdbb2abb7bc04882eb584c0bb', 1, 0, NULL, '2026-09-09 12:51:51.684', '2026-09-02 12:51:51.685', '2026-09-02 12:53:25.970'),
(221, 7, '860be906-ef81-40bc-a2bd-07e1b469e02f', '7ee6e0c7384f2b4eb9dd8dd18cb18d57b3792795af90ab47e88c56564daf62ba', 0, 1, 'LOGGED_OUT', '2026-09-09 12:53:29.808', '2026-09-02 12:53:29.809', '2026-09-02 15:28:58.836'),
(222, 1, 'c874f147-f909-40f3-b622-0270e27d73a3', '951b9fdf24d07632473c7e0cf03381b4141b827455e6a4a71fd6e654450e9e32', 0, 1, 'LOGGED_OUT', '2026-09-09 12:56:02.135', '2026-09-02 12:56:02.136', '2026-09-02 13:27:05.307'),
(226, 1, '0b574d43-2a99-4780-93be-3ba7f737a441', '4436e04e7e55e916ffc5872edf644e22fc731b800bb4b3aad9b766a35502c0e6', 0, 1, 'LOGGED_OUT', '2026-09-09 14:53:53.364', '2026-09-02 14:53:53.365', '2026-09-02 15:37:43.195'),
(227, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', '0efec7e2c3948c65e2fd8fbe3d154f317e3fa4f5777096e43d6c40b91f70930f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:07:23.724', '2026-09-02 15:07:23.725', '2026-09-02 15:34:01.549'),
(228, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', '2153c00164e0164e613aa78ae3c947d4d32ce71567feb395f8aebb5cbeb77e4b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:09:59.441', '2026-09-02 15:09:59.442', '2026-09-02 15:34:01.549'),
(229, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'e01fb4d0b0e0900141a037ec8d8c79b37536238f6e3c06d9673991598ac6a09e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:11:55.399', '2026-09-02 15:11:55.400', '2026-09-02 15:34:01.549'),
(230, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'de19b8fc325c72cabb322c1238f9f50c5f230a88187c7d2eb8269b0a3d7ba255', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:13:14.359', '2026-09-02 15:13:14.360', '2026-09-02 15:34:01.549'),
(231, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', '039af175879f2c628525ea822ebb668ae097b8cb06795f17437a99ba6b89d17a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:20:43.925', '2026-09-02 15:20:43.926', '2026-09-02 15:34:01.549'),
(232, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'aded2fbe9f5dc1f33bfbec17d4c3a7e89bd5dc013a77c7592050738c3e4c6423', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:21:12.507', '2026-09-02 15:21:12.508', '2026-09-02 15:34:01.549'),
(233, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', '4e48447c53f7cf278185169c2f5d62bd4e7752f649ba46f974511344b76fba63', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:23:15.521', '2026-09-02 15:23:15.522', '2026-09-02 15:34:01.549');
INSERT INTO `AuthSession` (`id`, `employee_id`, `family_token`, `refresh_token_hash`, `consumed`, `revoked`, `revocation_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(234, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'a75af5ce2d9eb146268d972425684ccbb36b5997c36ff09ccd5f9a8b95fdda58', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:24:34.339', '2026-09-02 15:24:34.340', '2026-09-02 15:34:01.549'),
(235, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'f64c8634c134d03caba97026ed56abf4f24367197f4e6ead6ae571c21bc9d453', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:30:17.036', '2026-09-02 15:30:17.037', '2026-09-02 15:34:01.549'),
(236, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'fdd1a0b92360bf30858fcebbe371c132e22e9c10cf49c673cc3ff07322f960db', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:31:36.326', '2026-09-02 15:31:36.327', '2026-09-02 15:34:01.549'),
(237, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', '29c23c7791ce0c8830d0592c0851f6f9b4f90207eab973d1c3a8d2b9d8bff70b', 1, 1, 'LOGGED_OUT', '2026-09-09 15:31:47.809', '2026-09-02 15:31:47.810', '2026-09-02 15:34:04.334'),
(238, 1, '81998704-52b3-4ea9-99dd-3b2f1d6a206c', 'f3edd4b2bede600c2223092b474c44ac50149b639bfe13e7ec932b815ac7b9c7', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 15:34:00.988', '2026-09-02 15:34:00.989', '2026-09-02 15:34:01.549'),
(239, 1, '10875ba3-0ef4-40a5-bc15-6774bf1bc1f2', '05737bc75527912669d39a698064334a70282ba6f3254c9d3c9f3f0025f4d75e', 1, 1, 'LOGGED_OUT', '2026-09-09 15:35:50.839', '2026-09-02 15:35:50.840', '2026-09-02 15:37:26.324'),
(240, 1, '10875ba3-0ef4-40a5-bc15-6774bf1bc1f2', '7429629e99a1aec729e1f462ef0a643f157e5317d7d0cfe94fda83b665a87997', 0, 0, NULL, '2026-09-09 15:37:25.464', '2026-09-02 15:37:25.465', '2026-09-02 15:37:25.465'),
(241, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', '5b74b69e548a3efc9f45e99de0cf6bf92cf057794d3c97c10558524de7fbdb8d', 1, 0, NULL, '2026-09-09 15:37:38.978', '2026-09-02 15:37:38.979', '2026-09-02 15:38:01.871'),
(242, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', 'c03abc0535e1ce904b659a3d19cc9d710c3ed54a4ffec58029f005d41023bcad', 1, 0, NULL, '2026-09-09 15:38:05.797', '2026-09-02 15:38:05.798', '2026-09-02 15:39:50.647'),
(243, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', 'ee3acc6f3b56c923a54b1fec4f16027ec67ff0def48a94d1be6a6d77f0300ccb', 1, 0, NULL, '2026-09-09 15:39:54.327', '2026-09-02 15:39:54.328', '2026-09-02 15:42:02.973'),
(244, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', '2b66cae45dbedf240a267bb6348ef69e35e6250194ac573333c090019217fbda', 1, 0, NULL, '2026-09-09 15:42:06.602', '2026-09-02 15:42:06.603', '2026-09-02 15:43:53.681'),
(245, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', 'd205d40c725ba531bc091c8864a1be9466dfeec0fc78b68f27b7fe119346490c', 1, 0, NULL, '2026-09-09 15:43:57.596', '2026-09-02 15:43:57.597', '2026-09-02 15:48:02.941'),
(246, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', '2f797853729214f5fe7c0ea6df9b76f74a861fd78ef46a54574331011cce5800', 1, 0, NULL, '2026-09-09 15:48:06.880', '2026-09-02 15:48:06.881', '2026-09-02 15:54:50.005'),
(247, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', 'e46e9bb1c124f350a0a8f2e7cbda4d94fd6061f3d4c47720a9e7b16e626e7ff8', 1, 0, NULL, '2026-09-09 15:54:53.810', '2026-09-02 15:54:53.811', '2026-09-02 15:56:44.975'),
(248, 1, '97d4f97a-19a2-4034-b5b9-ad5d4a5eb4f1', '8475c80a39584583890031902ccfdf6190ef9870fd0b70b6873effc5d570afbe', 0, 1, 'LOGGED_OUT', '2026-09-09 15:56:48.853', '2026-09-02 15:56:48.854', '2026-09-02 16:02:32.901'),
(249, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '4a1311db28f25a084e48c2e25ca87fd746749471e25e7a9b96b10f38f90918e1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:08:02.361', '2026-09-02 16:08:02.362', '2026-09-02 16:51:27.514'),
(250, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', 'd510cbc4fe29c391657c44eba73c50dc018869007e722ff7f77f8a946a687be5', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:08:45.069', '2026-09-02 16:08:45.069', '2026-09-02 16:51:27.514'),
(251, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '696d6d94c09973683a1aaf63bd0acc500fde04dc462a26d549b644e97f944004', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:23:01.548', '2026-09-02 16:23:01.548', '2026-09-02 16:51:27.514'),
(252, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '5ff894409cae6adaf551cd3303d1da8dc5be1c831cb0c9fd376d0cdc423c3fcb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:24:03.297', '2026-09-02 16:24:03.298', '2026-09-02 16:51:27.514'),
(253, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '1a54727c8e6087a46f40dfd4084233732900550d22bab3e75aa905ea00a36936', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:29:45.979', '2026-09-02 16:29:45.980', '2026-09-02 16:51:27.514'),
(254, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '300c3cc2d7e5e966a5ee3d9e1bc40890f151309a6e3e8a534ef2985cf6e2cc13', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:30:23.083', '2026-09-02 16:30:23.084', '2026-09-02 16:51:27.514'),
(255, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', 'a411dffebffc22d07044e19233248d8a2f473ec74f52dfd1a2d10b2a24fc0ba2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:31:05.775', '2026-09-02 16:31:05.776', '2026-09-02 16:51:27.514'),
(256, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '1962de912a24911009e27061c6cdf970c960f4671e5cd59ec602cb261355b0f4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:36:16.806', '2026-09-02 16:36:16.806', '2026-09-02 16:51:27.514'),
(257, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', 'f4c4d0cebf705dd3b0221fb9ad32985c609b507d6b770d50131feec01a0922a2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:37:01.471', '2026-09-02 16:37:01.472', '2026-09-02 16:51:27.514'),
(258, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', 'a3c14ddce9f7ab4edee8a337ed711a847b36bea9b89ffad542b546a7650f4166', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 16:49:38.499', '2026-09-02 16:49:38.500', '2026-09-02 16:51:27.514'),
(259, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', '497caeeb54bad4c9deb59043bb88d4c4d06b72c5bf467b4195427701fde3ef21', 1, 1, 'LOGGED_OUT', '2026-09-09 16:49:50.383', '2026-09-02 16:49:50.384', '2026-09-02 16:51:29.845'),
(260, 1, '91a82f04-03f4-4374-b50e-d0a92d538d0a', 'ea42c0c6ebd50c2425eaf44833e89b05fe08c5c7dd655f40093cfb93128ef044', 0, 0, NULL, '2026-09-09 16:51:28.929', '2026-09-02 16:51:28.930', '2026-09-02 16:51:28.930'),
(261, 1, '4c963079-b3e8-418a-8623-3a6b889b8939', '1ec01702e6c059efff365040f2be0411e6b9d569c0fe77c0adf82e337cebc2fe', 0, 1, 'LOGGED_OUT', '2026-09-09 16:52:22.398', '2026-09-02 16:52:22.407', '2026-09-02 17:23:55.966'),
(262, 1, '3e3f29b4-fc98-4188-b9e7-feca784dbe79', 'd2346e72d0a6b27e98d2200eb7eb3568036b91f51a09bbc87331703416f4de98', 1, 0, NULL, '2026-09-09 17:31:35.417', '2026-09-02 17:31:35.418', '2026-09-02 18:11:49.374'),
(263, 1, '706c7a90-0c87-44ed-8368-0d2cc4241ef2', '3d3166559d5d6ef1f130cdc89d8741d9a2dc61417eb0878d9d67c7585fb3d7a7', 0, 0, NULL, '2026-09-09 17:50:02.070', '2026-09-02 17:50:02.071', '2026-09-02 17:50:02.071'),
(264, 1, 'ee081b7e-3262-4e4a-bcd2-93751dae9f8d', '61d6a1974e68f01043df1c30186aa3b06e45de96f0ae6ceaccb55d7a6e2fbbe9', 1, 0, NULL, '2026-09-09 17:51:30.290', '2026-09-02 17:51:30.291', '2026-09-02 18:05:59.211'),
(265, 1, 'd2579363-016b-4191-bdb2-344b0dbe9243', 'e4cb12ae4bb65454d90a57023e21d962d4fef1e1812beb049197bce931156eae', 1, 0, NULL, '2026-09-09 17:58:45.289', '2026-09-02 17:58:45.289', '2026-09-02 17:59:02.756'),
(266, 1, 'd2579363-016b-4191-bdb2-344b0dbe9243', '6b002ddc591b937c9607c40de2b2aa8f6e560f430bb5f240f7084291894f55d2', 0, 1, 'LOGGED_OUT', '2026-09-09 17:59:06.423', '2026-09-02 17:59:06.424', '2026-09-02 17:59:10.710'),
(267, 1, '317890ea-c12b-46aa-9345-73e71d67c5be', 'ad63ed89d5aac54ff68b0725a40f57de28d53f361ad568189a560d54a97fb1dc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 17:59:20.279', '2026-09-02 17:59:20.280', '2026-09-03 02:16:46.472'),
(268, 1, '317890ea-c12b-46aa-9345-73e71d67c5be', 'f0120bf3aa7f187a7cb0a2e1080852e48efcf6843de61f5da6ba0674975e338b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 17:59:37.998', '2026-09-02 17:59:37.999', '2026-09-03 02:16:46.472'),
(269, 1, '317890ea-c12b-46aa-9345-73e71d67c5be', '97a27434ccfa06dab19f05a4c847e3c7f3a38c399e0b579dc0bab67054e88b25', 1, 1, 'LOGGED_OUT', '2026-09-09 18:00:10.349', '2026-09-02 18:00:10.349', '2026-09-03 02:16:48.874'),
(270, 1, 'ee081b7e-3262-4e4a-bcd2-93751dae9f8d', '9ed9ba329e77375647466b6365c5f40db20ce520fe6382b2a07fd231539cd439', 1, 0, NULL, '2026-09-09 18:06:02.842', '2026-09-02 18:06:02.843', '2026-09-02 18:12:55.937'),
(271, 1, '317890ea-c12b-46aa-9345-73e71d67c5be', '236e6176e931add2685f9e36508f8d6af92f9e8707afae988f386d66e2fb7388', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-09 18:09:22.310', '2026-09-02 18:09:22.312', '2026-09-03 02:16:46.472'),
(272, 1, '3e3f29b4-fc98-4188-b9e7-feca784dbe79', '8ba1cbfef3df6dde527d1ac87fdf33c19d4c0337a23ab6be0f5dd7d1553c77ee', 1, 0, NULL, '2026-09-09 18:11:51.438', '2026-09-02 18:11:51.439', '2026-09-02 18:15:24.451'),
(273, 1, 'ee081b7e-3262-4e4a-bcd2-93751dae9f8d', '4a978e029c8e66d5efe4544a9eaf11145e72615f0a3b1be0c0e53901ab2bfb9f', 1, 0, NULL, '2026-09-09 18:12:59.585', '2026-09-02 18:12:59.586', '2026-09-02 18:13:16.581'),
(274, 1, 'ee081b7e-3262-4e4a-bcd2-93751dae9f8d', '403a4b13c865400c5265eecdf936054736e7ad34525389d26d22499576c76407', 0, 0, NULL, '2026-09-09 18:13:20.382', '2026-09-02 18:13:20.383', '2026-09-02 18:13:20.383'),
(275, 1, '3e3f29b4-fc98-4188-b9e7-feca784dbe79', 'b6d62b72e661bfb417089117f9c7668e573926b657a3808a1df5e9ecb3f60ee9', 1, 0, NULL, '2026-09-09 18:15:28.198', '2026-09-02 18:15:28.199', '2026-09-02 18:15:35.049'),
(276, 1, '3e3f29b4-fc98-4188-b9e7-feca784dbe79', '9bb792ae14c931e1477b65cdab77f3857488a47f16e6cf9ba7e07c15f161a51a', 0, 0, NULL, '2026-09-09 18:15:38.718', '2026-09-02 18:15:38.718', '2026-09-02 18:15:38.718'),
(277, 1, '2e42220b-d4b3-4ad5-b6e7-891230cfcb4b', 'cf5614f3bb27cb20040004b4fab6e9bf9cabc37f68f19b0c162f4deb63ecb1db', 1, 0, NULL, '2026-09-10 02:16:55.948', '2026-09-03 02:16:55.949', '2026-09-03 03:02:10.419'),
(278, 1, '50b94301-c21c-40ee-be8d-634896105eae', 'd9e6ee155b8332ec24ad0dec5a134e43567b748b9c95048883733d70c2feaf5f', 0, 1, 'LOGGED_OUT', '2026-09-10 02:25:12.420', '2026-09-03 02:25:12.421', '2026-09-03 02:55:55.988'),
(279, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '5659b9352813add5c8efe9fe598cb8de139e0fe54d7943e20c4eb25e35f29c56', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:45:04.005', '2026-09-03 02:45:04.007', '2026-09-03 03:18:55.233'),
(280, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '81863b9b5cf641e2ba444c727af58f33e9696c931024be1d084fc9d92aa18233', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:57:27.405', '2026-09-03 02:57:27.406', '2026-09-03 03:18:55.233'),
(281, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'e8ee73c8de100df060f185976fc444fd29d0f5a45fb1c2ebcee8f4a840e6634f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:57:39.016', '2026-09-03 02:57:39.017', '2026-09-03 03:18:55.233'),
(282, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '94e2cca7d39944cad420e2e7bbe0b3553a3605108cd72de4eee838825b85ce85', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:57:50.785', '2026-09-03 02:57:50.786', '2026-09-03 03:18:55.233'),
(283, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '0697a6cc0947c3e1484c78e0f396be77f35534b75fcb2303bf71f532b5bb1a8f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:57:58.616', '2026-09-03 02:57:58.617', '2026-09-03 03:18:55.233'),
(284, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '5a2a9ddf563842745b238a385d2c10d65c46aff23f364b58ad0907cd33bd6999', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:10.227', '2026-09-03 02:58:10.228', '2026-09-03 03:18:55.233'),
(285, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'c8b0143d406306a4853b9b3bf15fc7f1c0d42a77fc17f5604f164c9862e75ee4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:19.687', '2026-09-03 02:58:19.689', '2026-09-03 03:18:55.233'),
(286, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '8d75741fe8c6da9fe09fd5ab0b11d76ecd959d202ccd4c7a162dd6a35689adab', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:27.620', '2026-09-03 02:58:27.621', '2026-09-03 03:18:55.233'),
(287, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '2595045d9cd4626814a85ae2aecea36fa39ad181cb454ab92dcafe30ed9ecbbb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:36.626', '2026-09-03 02:58:36.627', '2026-09-03 03:18:55.233'),
(288, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '424b5d0dd1c1f287bf623a06a2bf0dcbbf67b0df739920e03643f61c1e78829f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:48.893', '2026-09-03 02:58:48.894', '2026-09-03 03:18:55.233'),
(289, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '7fc19c5ebbc927148176071d2640b77a5399d8175fccb44b604757bc7bc5a2ad', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:58:59.074', '2026-09-03 02:58:59.075', '2026-09-03 03:18:55.233'),
(290, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '66a47838899ea0228900dc81fa0b7520b5673d65de653e3ec549d6341e125401', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:59:10.601', '2026-09-03 02:59:10.602', '2026-09-03 03:18:55.233'),
(291, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'effcc4cd24107e06a5b768124dbc27d0308e63aff9c1010ed3cf2617bfc82fb0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:59:22.338', '2026-09-03 02:59:22.338', '2026-09-03 03:18:55.233'),
(292, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'ba1aa1b1812bc4c4d92ff3d979fb8eb1e6930206363449c2820a397d181a2531', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 02:59:45.432', '2026-09-03 02:59:45.433', '2026-09-03 03:18:55.233'),
(293, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '51601ece549ac22256d98b47d9a2fde2706d68f860dd881056aab4a91050f964', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:00:46.933', '2026-09-03 03:00:46.934', '2026-09-03 03:18:55.233'),
(294, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'd17d1b295ef51ef9afe6744c5b813fa36aad041d20df699c17fcb97bd3fb3e4f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:01:46.053', '2026-09-03 03:01:46.054', '2026-09-03 03:18:55.233'),
(295, 1, '2e42220b-d4b3-4ad5-b6e7-891230cfcb4b', '64a02fb763a0c99ac45ec3a7881634fa7a6ee2c46849bafb75e626087441beb8', 1, 0, NULL, '2026-09-10 03:02:14.229', '2026-09-03 03:02:14.230', '2026-09-03 04:53:00.688'),
(296, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'c6d54eecd4cffe1f0ffee84b3ab1d58f98a3438059c20542cd0be91e74fa1e0d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:02:45.875', '2026-09-03 03:02:45.876', '2026-09-03 03:18:55.233'),
(297, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'abf88cca8c31bc83cc3dc434b0fe9ce1e59d5123cf94114a98671c0389db6e9e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:03:45.693', '2026-09-03 03:03:45.694', '2026-09-03 03:18:55.233'),
(298, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'ada0b5c6fa0f60003b41b865cc154dc06365e81f6ba15356a7a9448b481aa465', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:04:46.716', '2026-09-03 03:04:46.717', '2026-09-03 03:18:55.233'),
(299, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '287f968a1ac4186d2e9930b780c65ac765847c26f6b699ea1ce6530929720de0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:05:46.502', '2026-09-03 03:05:46.503', '2026-09-03 03:18:55.233'),
(300, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '5b2b46a33134ffffbe1eeedd247d02353640cdbd7d5f277d0924f960ca4b3f61', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:06:45.679', '2026-09-03 03:06:45.680', '2026-09-03 03:18:55.233'),
(301, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'c969b06e290ab2fef78326e1384190b5dbf346e19fa47d208b38709ad120ccea', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:07:47.173', '2026-09-03 03:07:47.174', '2026-09-03 03:18:55.233'),
(302, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '25d907ca2f2678d202e541c5868a75300fe18adae3c438320bc3550071e94368', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:08:46.035', '2026-09-03 03:08:46.036', '2026-09-03 03:18:55.233'),
(303, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '76e93eb21f4449d6e36e718aa98a76a43faf6d888c50b974d723c8baef3792f9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:09:45.797', '2026-09-03 03:09:45.798', '2026-09-03 03:18:55.233'),
(304, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '2db26217815311cc973906aebb0d5597305262a5b9bc0b3012fa508ec6b6e48c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:10:45.898', '2026-09-03 03:10:45.898', '2026-09-03 03:18:55.233'),
(305, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'c6bc413bb104a179f4d123617521ba916599158f376070e31f262d80875ffcdf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:11:47.022', '2026-09-03 03:11:47.022', '2026-09-03 03:18:55.233'),
(306, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '70dc46e69ecf091ad346921bddb903728099d1f14f8be2913140e1641f2890c8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:12:46.132', '2026-09-03 03:12:46.133', '2026-09-03 03:18:55.233'),
(307, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'bfdbdb3bf75a613ac3d4bc12e8377a9b645bc45a87e00fa0aa9b4e0f7d12f334', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:13:46.644', '2026-09-03 03:13:46.645', '2026-09-03 03:18:55.233'),
(308, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '7b84aa508f6afff2cc261651b1c443140d199f49fbdd238d661046e6e570c0f3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:14:46.922', '2026-09-03 03:14:46.923', '2026-09-03 03:18:55.233'),
(309, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '0fe3a714b5c02fd679f97dcec65b82b7299cdb527d1e67c0ad31f1fa5f79b3fb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:15:46.709', '2026-09-03 03:15:46.709', '2026-09-03 03:18:55.233'),
(310, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'ac5ac8c721648092f4943f552ad10652f8803f67a86a857a468503b3378eedbf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:16:46.623', '2026-09-03 03:16:46.624', '2026-09-03 03:18:55.233'),
(311, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', '97ce9f2f7dcb16c262527d5c9ffa3d59425b984b4ce512edf74fbb8b07c8f0b6', 1, 1, 'LOGGED_OUT', '2026-09-10 03:17:47.220', '2026-09-03 03:17:47.220', '2026-09-03 03:18:58.129'),
(312, 1, '40d22f85-8205-4db2-8aa0-ed2671d482ed', 'd29af321a759377d4e6ddc642777251e8e726f39ca60fa56fb9ad246f1357827', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 03:17:58.754', '2026-09-03 03:17:58.755', '2026-09-03 03:18:55.233'),
(313, 1, 'a28c0b8a-c3ed-4271-b699-93804b9d62b5', 'e37e0a68f040788570651f62e61bf138d8b1b528e1b62efea61b65ee4ddd5a44', 0, 1, 'LOGGED_OUT', '2026-09-10 03:19:03.867', '2026-09-03 03:19:03.868', '2026-09-03 03:49:30.206'),
(314, 1, '6b23ae10-c9bf-42ba-9dc0-42d43fda1697', 'ec9257a388674134491e68ed6f508de4a691ac1b595233f5ec5691307c28e7d6', 0, 1, 'LOGGED_OUT', '2026-09-10 03:55:44.695', '2026-09-03 03:55:44.696', '2026-09-03 04:25:51.797'),
(315, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'd24ae25a50a9375cb7d70a191b431cc27a5b2aa321a5114c592bbf4b82779d09', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:14:05.767', '2026-09-03 04:14:05.768', '2026-09-04 09:05:05.741'),
(316, 3, '024cd4b1-5a8c-4863-96c5-8f1c34053838', '3f26f73851128e4903f030cdd4eb48f9ce82ae46d47796b5d1b4da2379ae8b15', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:40:01.419', '2026-09-03 04:40:01.420', '2026-09-03 04:45:32.797'),
(317, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '48c611593c4a3c8592690460ba6f58f673e74c82e23b8471f4ebeb9a53607e19', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:41:39.349', '2026-09-03 04:41:39.350', '2026-09-04 09:05:05.741'),
(318, 3, '024cd4b1-5a8c-4863-96c5-8f1c34053838', '29f1a228e313bf608e22e2c701cbe0ed6dd9cafc72c9f83af069496ebeda49fa', 1, 1, 'LOGGED_OUT', '2026-09-10 04:44:31.605', '2026-09-03 04:44:31.606', '2026-09-03 04:45:35.645'),
(319, 3, '024cd4b1-5a8c-4863-96c5-8f1c34053838', '02c0383fdca86c2b591bac48c8f36e65b62d5eb346cc65c029352626382738fd', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:45:30.117', '2026-09-03 04:45:30.119', '2026-09-03 04:45:32.797'),
(320, 3, '124e1e6c-55d8-4c66-8964-58efd703a55c', '591de6d5de12d5f6ba9c79608557b2b9c149099ee4727abce49bf841cf8d0d2b', 1, 1, 'LOGGED_OUT', '2026-09-10 04:45:42.190', '2026-09-03 04:45:42.191', '2026-09-03 06:17:30.561'),
(321, 3, '124e1e6c-55d8-4c66-8964-58efd703a55c', '026d3cc923c1331ad439a126cdbd86c537fc7c52b16c5b7acc220386aac3a0bb', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:46:44.080', '2026-09-03 04:46:44.081', '2026-09-03 06:17:27.786'),
(322, 1, 'b60b4b51-49b2-42fc-b415-b1a17630d424', '4cbbd640397824d932c25b83f9c0696c07cc3dc3dfe636bc9f66666303134922', 1, 0, NULL, '2026-09-10 04:51:27.628', '2026-09-03 04:51:27.629', '2026-09-03 04:51:55.795'),
(323, 1, 'b60b4b51-49b2-42fc-b415-b1a17630d424', '042a9e52bd5e91f65e58d111621345a77d1ab7c42655046623311c98727e0763', 0, 1, 'LOGGED_OUT', '2026-09-10 04:51:59.522', '2026-09-03 04:51:59.523', '2026-09-03 05:23:29.964'),
(324, 1, '2e42220b-d4b3-4ad5-b6e7-891230cfcb4b', '9257b1d0c908b3a5266ccfd3d8bca087572e374740c048df4532b991d4df2682', 0, 1, 'LOGGED_OUT', '2026-09-10 04:53:04.486', '2026-09-03 04:53:04.487', '2026-09-03 05:00:11.714'),
(325, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '6e7190fdfa60ba834623bd4ee6a65c0d2bce1e3995535662622ecb239fd2fc9e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 04:59:41.410', '2026-09-03 04:59:41.411', '2026-09-04 05:46:48.442'),
(326, 1, '0c0e6d14-00ff-416d-bf90-f4f0c8c0b631', '0afe1f67fb75544dbb82ecc09bee26cf9a2b34173af53fda7aa1b126fd99ab6f', 1, 0, NULL, '2026-09-10 05:13:12.690', '2026-09-03 05:13:12.692', '2026-09-03 05:44:57.832'),
(327, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', 'e7cf7a5499efdcaae4dbeda6567cc78f1f9ca62bfdab5acf7efff62b1c8432e6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 05:44:36.006', '2026-09-03 05:44:36.008', '2026-09-03 20:58:32.032'),
(328, 1, '0c0e6d14-00ff-416d-bf90-f4f0c8c0b631', 'bb7dd583ee7d85483983eceeed96782df55f40f8d9a3dbb5c007951f8c92ffff', 0, 0, NULL, '2026-09-10 05:45:01.540', '2026-09-03 05:45:01.541', '2026-09-03 05:45:01.541'),
(329, 1, 'e5d95759-9eda-4fbb-9660-bbb0450f2e6e', '6df99d56723b14deefa5a67fabc1131b8076d760407d1930f9235e0b737194bd', 0, 1, 'LOGGED_OUT', '2026-09-10 05:47:51.158', '2026-09-03 05:47:51.159', '2026-09-03 06:22:56.639'),
(330, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', 'e632a598f6c1b450c35cc4fd1999485f01564f0b8f043f3604bc3c83254f2b59', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 06:17:37.168', '2026-09-03 06:17:37.169', '2026-09-04 06:18:20.553'),
(331, 1, '962426a4-4ff3-48e7-86e0-5d25dfbecdbd', 'b3c74c9aa66fa7ae1e470a224d3973f1906e97fa583534ad653c1ad7958084d0', 0, 1, 'LOGGED_OUT', '2026-09-10 06:49:28.476', '2026-09-03 06:49:28.477', '2026-09-03 07:42:07.508'),
(332, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '981ef815cac304a5629f1481a566036f83dcc75e3150ff9fa310e20d3436998d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:11:49.717', '2026-09-03 07:11:49.718', '2026-09-04 09:05:05.741'),
(333, 1, 'c0030943-f9ab-4f3f-969e-36806bde3dc3', 'dbec287332b4111443c0f721b8066f133cff5f6589932fd1141aaaf6ac4a7635', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:14:26.148', '2026-09-03 07:14:26.149', '2026-09-03 07:16:00.548'),
(334, 1, 'c0030943-f9ab-4f3f-969e-36806bde3dc3', '26c9515195ea00884ab9b2128642dc6f6ac8aa4e230d1e20684b0ef43b56f096', 1, 1, 'LOGGED_OUT', '2026-09-10 07:15:00.592', '2026-09-03 07:15:00.593', '2026-09-03 07:16:02.622'),
(335, 1, 'c0030943-f9ab-4f3f-969e-36806bde3dc3', '0882acf0872cd7f998cf8d13e3304fa32059f7cf8b8d14dbb1f0ef87cc31a1e3', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:15:44.289', '2026-09-03 07:15:44.290', '2026-09-03 07:16:00.548'),
(336, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', '7afafce5dcc674ba07912b2fb42e309557c67a337137e22ca77b04ca48fd993f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:26:10.156', '2026-09-03 07:26:10.157', '2026-09-04 06:18:20.553'),
(337, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', '91e91518d3138c36ffb6af4df0534549a5700d38e45078c2ddf2e667cfab6907', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:26:51.402', '2026-09-03 07:26:51.403', '2026-09-04 06:18:20.553'),
(338, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', 'cf8df7ceb88c726e810dc4f5e9e524d44a1af0921cdde8e0f6a4f0778c2bd9bd', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 07:28:40.923', '2026-09-03 07:28:40.924', '2026-09-04 06:18:20.553'),
(339, 1, 'bbef84ec-2b1f-4568-8247-81b22d918a16', 'a149c25961f347351146af435649b52a9bfa0a34c5290eff2d49a3ea4b3cb725', 0, 1, 'LOGGED_OUT', '2026-09-10 08:30:24.910', '2026-09-03 08:30:24.911', '2026-09-03 09:09:01.119'),
(340, 17, 'bf3e28a7-ef1f-47bb-ac51-35e3b5d8494e', 'c16a14b20759585962409ed297c089252f95991fd46ef787455551103797d726', 0, 1, 'LOGGED_OUT', '2026-09-10 08:49:15.234', '2026-09-03 08:49:15.235', '2026-09-03 09:32:04.498'),
(341, 17, '25ee4396-7e9a-447e-9a84-3ba1b56cf67a', '633cbce86912fa8dada7403538f88d2974b374c463238ab999a7839640acc8e9', 0, 0, NULL, '2026-09-10 08:52:05.240', '2026-09-03 08:52:05.241', '2026-09-03 08:52:05.241'),
(342, 1, 'f98516fd-fbd0-4a4d-9a52-58713419ff39', 'cbb02ccd0650b12aa63654e9fb6799feaaa65e5c5d4a379ebfe104cf56b6b15c', 0, 1, 'LOGGED_OUT', '2026-09-10 09:28:18.948', '2026-09-03 09:28:18.949', '2026-09-03 09:59:04.303'),
(343, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '747048a753d255544f812f1a7ae7e0e58818ddaa4ac4cad3a1e2b1da474d671e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 09:28:25.061', '2026-09-03 09:28:25.062', '2026-09-03 20:58:32.032'),
(344, 17, 'b70091ea-51b9-47aa-b507-4a62d5b54381', '1de8a22fa157378d4e2b049132cdfa23c19c67ce8ddddf6253febe26fc32555b', 0, 1, 'LOGGED_OUT', '2026-09-10 09:32:11.444', '2026-09-03 09:32:11.445', '2026-09-03 10:40:29.824'),
(345, 17, '73dd45b5-2025-4c2e-a041-0523cfee2635', '5604159124d73ae342a2eb1523ecab8539422e184a84a26de046338fb9b0f300', 1, 0, NULL, '2026-09-10 10:40:35.066', '2026-09-03 10:40:35.067', '2026-09-03 11:22:04.138'),
(346, 1, '11769675-0178-4e3c-89e0-7075223a2c81', 'ff5a43d795484d5cf842b7cab6080609b8573fb0c633139b383bade9018e6539', 0, 1, 'LOGGED_OUT', '2026-09-10 10:47:30.700', '2026-09-03 10:47:30.701', '2026-09-03 11:17:42.260'),
(347, 17, '73dd45b5-2025-4c2e-a041-0523cfee2635', 'b662ad8164ef0450f43a11ebf7379d4cb88232f92265ab5e1ba92f174e3dbe58', 1, 0, NULL, '2026-09-10 11:22:07.770', '2026-09-03 11:22:07.771', '2026-09-03 13:15:57.349'),
(348, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', 'fd7f07868847852f999770b6785989aae2c9445e8e1be27619aa376a16b09cd2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 11:56:48.954', '2026-09-03 11:56:48.955', '2026-09-04 06:18:20.553'),
(349, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '17920509c8b3051121e7d86d28e60679df694bcc33d3da8fbb14c107ec54d1ff', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 11:57:05.632', '2026-09-03 11:57:05.633', '2026-09-04 05:46:48.442'),
(350, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '57462f374acbe72f7f6a5f860e3d0956de8b4eb7cec26231c8d6f1e76ced03b5', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 11:57:47.555', '2026-09-03 11:57:47.556', '2026-09-04 05:46:48.442'),
(351, 1, 'f1c7eb89-3ad7-40ce-a14e-4299654989f1', '7f143276f1505c27d36d5cadec587c105c6b8001bb161cc024106932808dc2a3', 0, 0, NULL, '2026-09-10 11:58:02.016', '2026-09-03 11:58:02.017', '2026-09-03 11:58:02.017'),
(352, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '03a1e0846b2ce17cd940b6ec47c71771b8f838349eb4c4384086e2d9cc2520bd', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 12:01:48.665', '2026-09-03 12:01:48.666', '2026-09-04 09:05:05.741'),
(353, 1, 'eb488194-3a12-4599-b6fb-d71a23ecf9f4', 'a0c5a6fc70fcc7ec9b88300f8b6bd4a4530042343abf194f187a6c0f4634a70c', 0, 1, 'LOGGED_OUT', '2026-09-10 12:16:47.764', '2026-09-03 12:16:47.765', '2026-09-03 12:39:10.101'),
(354, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', 'dd47b4af0049c4fe7db191772d5bb889f97016ffff190e2c8dfeb124935bc19f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 12:20:41.808', '2026-09-03 12:20:41.809', '2026-09-03 13:07:05.428'),
(355, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '27e3bdf2c4f7ff58c29f1e8a15014a65503560e599d5d0b2436f550a349297b0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 12:22:26.149', '2026-09-03 12:22:26.150', '2026-09-04 05:46:48.442'),
(356, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'd0e72dc89a8973abac52f92e7008417575d64ad40590631bad7ede001288f971', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 12:23:20.347', '2026-09-03 12:23:20.348', '2026-09-04 09:05:05.741'),
(357, 1, '6a0933ec-9be4-4870-b16a-745a1aea7830', 'c88b7df2ebb427592c9916c74d29600649f273acd01db7fe0f799aef1daece00', 0, 1, 'LOGGED_OUT', '2026-09-10 13:01:33.895', '2026-09-03 13:01:33.896', '2026-09-03 13:39:20.216'),
(358, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', 'd8661685c85643960cadcb4a237cf2b53ebf2155433855cd016598d1281c7bb0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:05:43.945', '2026-09-03 13:05:43.946', '2026-09-03 20:58:32.032'),
(359, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '6c4d8f3789a1037d3032f831ab3877f8c2e6374034eeb4ca88dd2cd559b01f1a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:05:51.805', '2026-09-03 13:05:51.806', '2026-09-03 13:07:05.428'),
(360, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '159fb0a355c69fed06f6c901e9baba5b85a65af02bb8613dc3c73f89fd8a3d0a', 1, 0, NULL, '2026-09-10 13:07:06.657', '2026-09-03 13:07:06.658', '2026-09-03 13:07:20.712'),
(361, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', 'd7c2b8324d22b2df63afc91460e50d17749a7095503c141e66448114992b29d7', 1, 0, NULL, '2026-09-10 13:07:24.273', '2026-09-03 13:07:24.274', '2026-09-04 03:32:32.407'),
(362, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '01e128deee1f4440a7bbc7479a6482eb063ac128714a3ef75348123d52031c20', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:08:49.450', '2026-09-03 13:08:49.451', '2026-09-03 20:58:32.032'),
(363, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '80c6a4b3aa2c52c2cc29d2626763e419d4b4a54bdcc161cd3d04df77b08b08b5', 1, 0, NULL, '2026-09-10 13:12:57.993', '2026-09-03 13:12:57.994', '2026-09-04 13:33:28.845'),
(364, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '027c4dab6144b06a6307831ba67779ea669e929c633ac7883ae616268cd3e71c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:14:43.475', '2026-09-03 13:14:43.476', '2026-09-04 09:05:05.741'),
(365, 17, '73dd45b5-2025-4c2e-a041-0523cfee2635', '17a9ef6da8935cc6cd9a6f2d86e3f03d566dbed17daa3a87de75a91e59d97df7', 1, 0, NULL, '2026-09-10 13:16:01.645', '2026-09-03 13:16:01.645', '2026-09-03 13:16:29.089'),
(366, 17, '73dd45b5-2025-4c2e-a041-0523cfee2635', '2bed051724357973ada9e52722a07d0e5afbe6f2e1125f25f377507baaa87ba0', 1, 0, NULL, '2026-09-10 13:16:32.899', '2026-09-03 13:16:32.900', '2026-09-04 09:37:22.834'),
(367, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '5c701c52a435b551da58f6b6fd8f77033e0e10e4181bf2d0b385c48c9c47905c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:19:57.966', '2026-09-03 13:19:57.967', '2026-09-03 20:58:32.032'),
(368, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '122dbd2c1078f699b487c570322f9fcbbb13ff90ee41c08eba10e345d79473c6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:26:37.859', '2026-09-03 13:26:37.860', '2026-09-04 09:05:05.741'),
(369, 1, '33cf84fb-8843-4f6a-9e9f-97ba7b21a4bc', 'ac4f6e2786187bb0b9a91c6395db668469a927a656c86f8321b47c8218478b13', 0, 1, 'LOGGED_OUT', '2026-09-10 13:43:24.262', '2026-09-03 13:43:24.263', '2026-09-03 14:16:01.925'),
(370, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', 'f4eb2e5ff202e4716a25dc6517a911ffd2800923591b224d96ae8be46af49ec9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 13:44:38.350', '2026-09-03 13:44:38.351', '2026-09-03 20:58:32.032'),
(371, 1, '9b764031-3da3-488b-b09e-954b094b53bd', 'd3fc6774934dcd5f85d6bb84af9589a7d501661930e3749400ab81a9e4887e34', 1, 0, NULL, '2026-09-10 19:20:05.790', '2026-09-03 19:20:05.791', '2026-09-03 19:23:20.978'),
(372, 1, '9b764031-3da3-488b-b09e-954b094b53bd', '6ea9bb8c9b10ce55cfb2de0c8a44640ba277837214a6e944269c5dd16cb65eeb', 1, 0, NULL, '2026-09-10 19:23:24.674', '2026-09-03 19:23:24.675', '2026-09-03 19:23:28.632'),
(373, 1, '9b764031-3da3-488b-b09e-954b094b53bd', '20d41c79837d1eaa2d74cc260429f21b2f90d0696029ec72ca2f703f11c4c53d', 0, 0, NULL, '2026-09-10 19:23:32.517', '2026-09-03 19:23:32.518', '2026-09-03 19:23:32.518'),
(374, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '099166240c5e307d607e0faa4a6111a5bcb6e4d4bcc1426ddc68ef00140c6dbf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 20:56:37.527', '2026-09-03 20:56:37.528', '2026-09-03 20:58:32.032'),
(375, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '64b4f7c2e0c495b31dc1a4706d3db614b78af893af1b3fa2102e21662f8a4020', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 20:57:49.027', '2026-09-03 20:57:49.028', '2026-09-03 20:58:32.032'),
(376, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '5bbed110e3d997a0eff394ca53056405dfd0de459cc7d9e2dff68c9510ca69b6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 20:57:57.482', '2026-09-03 20:57:57.482', '2026-09-03 20:58:32.032'),
(377, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', 'd9b6d49140bbf6068210ec1477742bcc4a56bb147c9eadeb09d6a9ec762fa28c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 20:58:08.027', '2026-09-03 20:58:08.028', '2026-09-03 20:58:32.032'),
(378, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '0108b116a4c8412b4ee0569b2dfe97f993070ea1012113b287163927c052c1a1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-10 20:58:16.076', '2026-09-03 20:58:16.077', '2026-09-03 20:58:32.032'),
(379, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '17c5daa4b4f37d44efcf83f45ebf271565aa41e8a23d4142c7cd3efcd659d9de', 1, 1, 'LOGGED_OUT', '2026-09-10 20:58:24.154', '2026-09-03 20:58:24.154', '2026-09-03 20:58:34.502'),
(380, 1, 'be32d87c-f60c-4e35-896e-638511c6e990', '6af02251b46e8362c125c2ac3836b84944940fc95e7f796058ac876902892374', 0, 0, NULL, '2026-09-10 20:58:33.259', '2026-09-03 20:58:33.260', '2026-09-03 20:58:33.260'),
(381, 1, 'c2c408e1-7086-432c-93a8-c25674f69667', '03cc30932ac12a7dda73729b3a2dd05441f2b7f6a5ed1b93c7b7a901aa483691', 1, 0, NULL, '2026-09-10 20:58:43.319', '2026-09-03 20:58:43.319', '2026-09-04 04:14:40.135'),
(382, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '8ce6fb91de1cb0e7b248692311f95418f30043d54904ad6eb9c1ba9137cb8de7', 1, 0, NULL, '2026-09-11 03:32:35.445', '2026-09-04 03:32:35.446', '2026-09-04 06:02:23.503'),
(383, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '3586757f961b68dc2bc81b969c79c3b9b015bb9d6553cb92cb70545725f9671a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 03:56:34.778', '2026-09-04 03:56:34.779', '2026-09-04 09:05:05.741'),
(384, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '2f81f1b35be82f51b06473ec00394ff8a2de1cf47851b9e30699f3c26688eb4b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:02:51.287', '2026-09-04 04:02:51.288', '2026-09-04 09:05:05.741'),
(385, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '4ed5f648fa2b4a34878c793d6a73be3c5584ff7a7012bb1cfebe68129ed7229b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:07:47.994', '2026-09-04 04:07:47.994', '2026-09-04 09:05:05.741'),
(386, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '128da36d1ebc55b7e75657d270be4be6d4898fdb6c7f6e8a43f4aa543946de39', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:08:06.191', '2026-09-04 04:08:06.192', '2026-09-04 09:05:05.741'),
(387, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '3f4c3e6f9192d626be17693cf77e1e3f77903fd760cc303ef3c55ee388c0f162', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:08:17.830', '2026-09-04 04:08:17.831', '2026-09-04 09:05:05.741'),
(388, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'c29217295d85cae04e806fb3ddd19ecf318f16c50f82060d43ff261b35868116', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:08:40.051', '2026-09-04 04:08:40.052', '2026-09-04 09:05:05.741'),
(389, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '565a10baafd8f03082c6f8145d5f388947b5ec0670f8873afde82dbed483da5a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:09:35.072', '2026-09-04 04:09:35.073', '2026-09-04 09:05:05.741'),
(390, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '05df0903299eea99c2e3236d8b0093a7bd9ff2078c2f6086715515c2446933db', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:09:52.634', '2026-09-04 04:09:52.634', '2026-09-04 09:05:05.741'),
(391, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'f579ddbc501d5272b6857747d69620fa81152c983de14ebb35336296e8847b79', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:10:07.307', '2026-09-04 04:10:07.308', '2026-09-04 09:05:05.741'),
(392, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'a7d8cb4b5a4c0fb341c754e0ab96105a596968b549a5dd20b306eb0fe60cae55', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:10:20.303', '2026-09-04 04:10:20.306', '2026-09-04 09:05:05.741'),
(393, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '86f56cea3ef12ce185cbd95c453e4fa325421fb31321cbc65d7ab1562acc3a4c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:10:31.455', '2026-09-04 04:10:31.456', '2026-09-04 09:05:05.741'),
(394, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'd6323d4ab25787ea85a956423889bf56eded03d970856a2447c2b87c09901710', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:10:41.747', '2026-09-04 04:10:41.748', '2026-09-04 09:05:05.741'),
(395, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'cb8116c97d00fdfa05638879c0f06b7289f209cca1d3973782d4d43918e3f17d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:10:53.792', '2026-09-04 04:10:53.792', '2026-09-04 09:05:05.741'),
(396, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'c3ccc482fa87a209dfaf3e70b184b10024690a4dda8da641a413746fa07fc9ba', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:11:08.681', '2026-09-04 04:11:08.682', '2026-09-04 09:05:05.741'),
(397, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '786362256f34fdb6178daaa3ce29d4a7df1c742082c19a63970db631253d8b84', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:11:17.189', '2026-09-04 04:11:17.189', '2026-09-04 09:05:05.741'),
(398, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '2c254447a86e3e76563d4cebdebe005b8cd9aae5db7e97d8ca454d483f171a16', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:11:27.064', '2026-09-04 04:11:27.065', '2026-09-04 09:05:05.741'),
(399, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'fdb4fb48414f8bce36d97b37d17455d19d09ad12afd9720a91f01be9cb01150c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:11:36.971', '2026-09-04 04:11:36.972', '2026-09-04 09:05:05.741'),
(400, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'd3173f3ffb3f011c7ea5f21145c48990e4f92a4bcfbd118a1fb892dc2d894157', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:11:50.615', '2026-09-04 04:11:50.616', '2026-09-04 09:05:05.741'),
(401, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '27af71c1b1efb6dc15c1c56e64e33e8615e389fbcd34b997bf02088b233ca2c4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:12:03.374', '2026-09-04 04:12:03.375', '2026-09-04 09:05:05.741'),
(402, 1, 'c2c408e1-7086-432c-93a8-c25674f69667', '51b097d754adb7079300d13c78c72d4d25b3a72d9500793ef8740027205f0e89', 0, 1, 'LOGGED_OUT', '2026-09-11 04:14:44.681', '2026-09-04 04:14:44.682', '2026-09-04 05:35:33.260'),
(403, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '14e8cc2b5fe36bb61e1e1392d7f296df6bc9c57a73b71a335f84bf6faca9e44a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:20:19.418', '2026-09-04 04:20:19.418', '2026-09-04 09:05:05.741'),
(404, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '916ee4ce3679689125b54d2896f38e54db371ecdf8370bcd54c7de2159f015a1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:20:37.223', '2026-09-04 04:20:37.224', '2026-09-04 09:05:05.741'),
(405, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', '859511a5961dff6e852492e4146375a2789aed0129611f68556e3051aeb3733f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:20:39.666', '2026-09-04 04:20:39.667', '2026-09-04 06:18:20.553'),
(406, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '78c867eb8991660fc67b145cd9df0b6a113a147e1e52c184b366c0ff7222cdad', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:25:55.155', '2026-09-04 04:25:55.155', '2026-09-04 09:05:05.741'),
(407, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '1228c9331b010c940a5a73786aee56e93f3445e9a66bfc1360954cda27b1db16', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:12.774', '2026-09-04 04:26:12.775', '2026-09-04 09:05:05.741'),
(408, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', 'd6f47ce84c9e39f4b1bcd7ca851c65e26496b94c938d0db8a47f6a504e44a40f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:20.585', '2026-09-04 04:26:20.586', '2026-09-04 06:18:20.553'),
(409, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '0fd02b3a588b5c2ee6f23b1c0031b71092a84a116e65cd5086db5c405c3545f1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:24.260', '2026-09-04 04:26:24.261', '2026-09-04 09:05:05.741'),
(410, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '7907491d8716c9845eff0f09ec94e696db332718bbaf0ee590f74fa9550f310a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:32.144', '2026-09-04 04:26:32.145', '2026-09-04 09:05:05.741'),
(411, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '907b67f1d1a34b26bd2d054512c3a0b3795b45269a42e57d1cde45b1611778cb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:43.266', '2026-09-04 04:26:43.267', '2026-09-04 09:05:05.741'),
(412, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'f39510c8277cdc1382fbb158d9f17c7e6bc0917512fe57cac27cc8c53cba7f5d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:26:54.936', '2026-09-04 04:26:54.937', '2026-09-04 09:05:05.741'),
(413, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', 'd09478ae33aaeb4131b5d5ec7e6daea186af945928b10e7e6f7e14589b40ca2a', 1, 1, 'LOGGED_OUT', '2026-09-11 04:27:09.368', '2026-09-04 04:27:09.369', '2026-09-04 09:05:08.563'),
(414, 2, 'be11ac8d-1427-445c-939f-af903cdece1b', '8e89fbac6b252bc106f0bd84cd3f73f3e82ea909408b1f923a5d80b91f919b6c', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 04:27:20.589', '2026-09-04 04:27:20.590', '2026-09-04 09:05:05.741'),
(415, 1, 'bca1100c-8aee-4e9a-bfc0-b0a3b5fa07fe', '749168b0ec50f8f4d7c5dece41e2c2e88deee7c75f8e464e715a2d81cc505dbf', 1, 0, NULL, '2026-09-11 04:29:01.101', '2026-09-04 04:29:01.102', '2026-09-04 04:32:15.609'),
(416, 1, 'bca1100c-8aee-4e9a-bfc0-b0a3b5fa07fe', '353e4eebce3850c2511783d99869e7f59a2f58388f2f84c2d679d3231a143b36', 1, 0, NULL, '2026-09-11 04:32:21.191', '2026-09-04 04:32:21.192', '2026-09-04 04:32:25.732'),
(417, 1, 'bca1100c-8aee-4e9a-bfc0-b0a3b5fa07fe', 'df23191b7a8d07ba55fcd6433f668fba3573479724f06ecd99de83db9b4ee084', 1, 0, NULL, '2026-09-11 04:32:31.277', '2026-09-04 04:32:31.278', '2026-09-04 04:42:18.205'),
(418, 1, 'bca1100c-8aee-4e9a-bfc0-b0a3b5fa07fe', 'bc231ff4156693ee6f34566ebeac45afbac073238a535242169bec4438494a78', 0, 1, 'LOGGED_OUT', '2026-09-11 04:42:22.650', '2026-09-04 04:42:22.651', '2026-09-04 04:59:14.228'),
(419, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', '7d17db13507e836b96f638c9159de4ffe7c74a17d8933bec670ec264ae2f5d81', 1, 1, 'LOGGED_OUT', '2026-09-11 05:24:59.309', '2026-09-04 05:24:59.311', '2026-09-04 05:46:51.334'),
(420, 1, 'f47e2aee-508d-44ba-896d-15f9e9f0c1a1', '3b6af45fb0fb40d48c9c2834fd252ec0f576cdc50b13ad3d6233c73af6aab82c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 05:25:32.905', '2026-09-04 05:25:32.906', '2026-09-04 05:30:27.861'),
(421, 1, 'f47e2aee-508d-44ba-896d-15f9e9f0c1a1', '3d8330fe5e794a68247a51908dff0f626627744d39ba744bfbca611bca7b6ffc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 05:27:39.736', '2026-09-04 05:27:39.737', '2026-09-04 05:30:27.861'),
(422, 1, 'f47e2aee-508d-44ba-896d-15f9e9f0c1a1', '7bbad748e6fa2fff91ce7b48e5fe4d3a640c37f03bf945503d80b6d1acc6f905', 1, 1, 'LOGGED_OUT', '2026-09-11 05:28:04.481', '2026-09-04 05:28:04.482', '2026-09-04 05:30:31.703'),
(423, 1, 'f47e2aee-508d-44ba-896d-15f9e9f0c1a1', '163962e410f924394692f171c620e2d75e01ae5ad9464ebe507b0f9a43eb9941', 0, 0, NULL, '2026-09-11 05:30:29.340', '2026-09-04 05:30:29.341', '2026-09-04 05:30:29.341'),
(424, 1, 'd366a1b7-7d9b-4fc4-83cf-7ce254f59310', '536a78575d21716db5de63d0a67bfd2221ed8760ee7ae029319a5aff7658bc09', 1, 0, NULL, '2026-09-11 05:30:48.708', '2026-09-04 05:30:48.709', '2026-09-04 05:35:37.994'),
(425, 1, 'ca83893d-79d2-4438-ab37-8bf4f2016582', '83f6bb7c550114b99a0b16a9b235ef47d4f7ad981fcd65e9bf96ea060e2f3305', 1, 1, 'LOGGED_OUT', '2026-09-11 05:35:42.912', '2026-09-04 05:35:42.913', '2026-09-04 06:01:46.838'),
(426, 1, 'd366a1b7-7d9b-4fc4-83cf-7ce254f59310', '5d7b8951088b52558d7e8f80314d7eba95428a29c1ec513e9c58b8814b251d69', 0, 1, 'LOGGED_OUT', '2026-09-11 05:35:43.008', '2026-09-04 05:35:43.009', '2026-09-04 05:58:07.265'),
(427, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', 'c3f03125d01c8b35885362ffab197f615a9a7e4264edf37e67b678e42526a519', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 05:38:20.077', '2026-09-04 05:38:20.078', '2026-09-04 06:18:20.553'),
(428, 4, 'afb0e5d0-5ec2-4420-9750-5461ce2c7dec', 'bb2043ffdf59b1e39eecb2f8f09def65e5f8b6548d3cca9b00e2864501e34bd0', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 05:46:45.513', '2026-09-04 05:46:45.514', '2026-09-04 05:46:48.442'),
(429, 4, 'b2cf0b90-54ab-41e9-9843-618339b0239e', '13a6a23a87d55942684c0239f3884bb34bf15a8d46df316ead20d38e73fe1339', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 05:47:22.006', '2026-09-04 05:47:22.007', '2026-09-04 12:06:14.859'),
(430, 1, 'ca83893d-79d2-4438-ab37-8bf4f2016582', '540462612f962bc1f80b042f0a9e5866bc1cb0503c7852acc1c008fa5cc2e0b5', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 06:01:42.627', '2026-09-04 06:01:42.628', '2026-09-04 06:01:43.402'),
(431, 1, '83a90738-e6c3-4dff-aaeb-b563c8708a96', '7a2045ef2599e0450209e021c0cc83cd0c97a691fb374b1e3a4c13d1f07aeaf0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 06:01:54.303', '2026-09-04 06:01:54.304', '2026-09-04 06:41:57.953'),
(432, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '98de9b3c4453df9ae93e677adb46377755c218fea4460bbc248653234971fcf2', 1, 0, NULL, '2026-09-11 06:02:27.895', '2026-09-04 06:02:27.896', '2026-09-04 06:35:33.616'),
(433, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', '87b174598c03be1993b8503862727d59b87044c72cfd96bf27ea688916e94bb1', 1, 1, 'LOGGED_OUT', '2026-09-11 06:17:23.299', '2026-09-04 06:17:23.300', '2026-09-04 06:18:24.007'),
(434, 3, '57d6bc21-a953-4cca-897b-f69a2081562f', '675925aa1db11639cc6694827728a1e4085ac45983cb5829df5b6faa1f32cca6', 0, 0, NULL, '2026-09-11 06:18:20.641', '2026-09-04 06:18:20.641', '2026-09-04 06:18:20.641'),
(435, 1, '83a90738-e6c3-4dff-aaeb-b563c8708a96', '990c1cd63ae111e34f2275494578f089d06cd5b6c55e77529ca23ab828908c6f', 1, 1, 'LOGGED_OUT', '2026-09-11 06:23:21.060', '2026-09-04 06:23:21.061', '2026-09-04 06:42:01.250'),
(436, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '4b881ee11a17689ce27a214731f49f6443199f5cc5b97a63113265f7ee6e9d4e', 1, 0, NULL, '2026-09-11 06:35:40.423', '2026-09-04 06:35:40.424', '2026-09-04 13:03:09.192'),
(437, 1, '83a90738-e6c3-4dff-aaeb-b563c8708a96', '2ca4f50facfea7a9b2e634eb83d0609076674fb21fbdd7d993469ababba1989a', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 06:41:57.342', '2026-09-04 06:41:57.343', '2026-09-04 06:41:57.953'),
(438, 1, '17f2e011-0343-4c97-b3ff-97db870996e3', '709ccc2f1059abcffc17ff1fc7c602b2fdc472b267d1d1481bdefe9374e99fcd', 1, 0, NULL, '2026-09-11 06:42:10.811', '2026-09-04 06:42:10.811', '2026-09-04 06:47:38.268'),
(439, 1, '17f2e011-0343-4c97-b3ff-97db870996e3', '06bc73838e41300cc5e197e520c362d75876af967dcee8b04a3dae8a67d1f5f3', 0, 1, 'LOGGED_OUT', '2026-09-11 06:47:41.973', '2026-09-04 06:47:41.974', '2026-09-04 09:04:00.310'),
(440, 1, 'df86115c-4017-42b5-a9b8-d3427951ade9', 'f452ed6522f3e10e5c0a11d1df95c558b41c33813bf6e82312918a3084f8b416', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 06:48:40.303', '2026-09-04 06:48:40.304', '2026-09-04 13:59:48.541'),
(441, 1, 'df86115c-4017-42b5-a9b8-d3427951ade9', 'f6d5254f7aa635998bf77936689d8a1a2fb98333ceee8b471aa47e7225b349af', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 06:48:50.896', '2026-09-04 06:48:50.897', '2026-09-04 13:59:48.541'),
(442, 1, '07d5f886-b763-4bbe-a2cd-b0f25c907687', '68375abbfe0b33c077526ed834519611fef99598f66d2c3d5260bc32de4d4025', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 07:00:40.614', '2026-09-04 07:00:40.614', '2026-09-04 07:03:03.893'),
(443, 1, '07d5f886-b763-4bbe-a2cd-b0f25c907687', 'ad801a491afc11bca9df2c3e869484fd2a652e2b62cc06184dee643860672e8c', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 07:03:02.095', '2026-09-04 07:03:02.096', '2026-09-04 07:03:03.893'),
(444, 1, '23b78295-a4dc-4d58-82b2-042460aa78a6', '87fa30fc5b2cedb90bc32963924790f5afbf9536494747c9cb561cdef08d6e74', 1, 0, NULL, '2026-09-11 07:03:15.105', '2026-09-04 07:03:15.106', '2026-09-04 07:06:02.116'),
(445, 1, '23b78295-a4dc-4d58-82b2-042460aa78a6', 'a493ca9fbb972743cc4b58bcc489198866e53ad1ee81baadcea964f558443e58', 1, 0, NULL, '2026-09-11 07:06:06.567', '2026-09-04 07:06:06.568', '2026-09-04 07:06:10.880'),
(446, 1, '23b78295-a4dc-4d58-82b2-042460aa78a6', '450c00bfdd5139ec6eb84e24e9bb732d6b6b98dfcb13056678c5a2b98df10c17', 0, 1, 'LOGGED_OUT', '2026-09-11 07:06:13.028', '2026-09-04 07:06:13.029', '2026-09-04 07:45:56.652'),
(447, 1, 'df86115c-4017-42b5-a9b8-d3427951ade9', 'abf77657b8d29508870b1cb7074b5a2fbef8fa11ee3b5100c7afac017517691b', 1, 1, 'LOGGED_OUT', '2026-09-11 07:08:45.321', '2026-09-04 07:08:45.322', '2026-09-04 13:59:51.279'),
(448, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '0058380600a5118770d5529db2119dc7789f7bdb744d7420015aeade61e731f8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:49:46.184', '2026-09-04 08:49:46.185', '2026-09-04 12:38:42.487'),
(449, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'a9b8ac835dd8d44184ba3d322c4ff7286ec2ce742377dcb87eb8bc5c25269dca', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:49:58.417', '2026-09-04 08:49:58.417', '2026-09-04 12:38:42.487'),
(450, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '66fd1d555f6f26a5c1a34d626da207770b8cb1b01899ef1e6fbf5e043bde37cb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:50:09.227', '2026-09-04 08:50:09.228', '2026-09-04 12:38:42.487'),
(451, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '8a2600c856f1a953f8d8a0936df3e7860362e42f86b84cdc8367f1c9bd88fa5b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:50:18.633', '2026-09-04 08:50:18.633', '2026-09-04 12:38:42.487'),
(452, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '05ef9bed98eda010340dbfb9b5ba12501fbcf6dcdb3bd11623f306cf836c58c6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:50:28.658', '2026-09-04 08:50:28.659', '2026-09-04 12:38:42.487'),
(453, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '0e2e61468a58fb528d8477d68408e953aa924097ab9afa9e7eb3f6b9de169840', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:50:37.008', '2026-09-04 08:50:37.009', '2026-09-04 12:38:42.487');
INSERT INTO `AuthSession` (`id`, `employee_id`, `family_token`, `refresh_token_hash`, `consumed`, `revoked`, `revocation_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(454, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '86c0b34574f4177b32e2f3d48088f5b7b899bb1d98441445c24b0a77d34f5b07', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:50:47.018', '2026-09-04 08:50:47.019', '2026-09-04 12:38:42.487'),
(455, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'e24a299deb3ca920c15f329746d278c74c700f509ce0d259b01a63bb0694c3f1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 08:51:38.108', '2026-09-04 08:51:38.109', '2026-09-04 12:38:42.487'),
(456, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'cc72b456f85870cfe9c6c9244e1604455cb8947208df02dc2e39bbb9b3d77154', 1, 0, NULL, '2026-09-11 09:04:11.878', '2026-09-04 09:04:11.879', '2026-09-04 09:36:53.933'),
(457, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '1ddd85019b78ba5f9d122c490ed55bf9db291bcf9c371e469ed70e0e23983d5e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:02.508', '2026-09-04 09:05:02.509', '2026-09-04 12:38:42.487'),
(458, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'cd9d68bee6ad57754085d8ade3b07921f72cae8dead0457e515d360e8d2239b9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:18.936', '2026-09-04 09:05:18.937', '2026-09-04 12:38:42.487'),
(459, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'a36aadadf624d066156bd90dcb26129a4c53a84761137f32a236257e1f2de4cc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:25.665', '2026-09-04 09:05:25.666', '2026-09-04 12:38:42.487'),
(460, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'f2cea19ea4385268eb0b066dfcf269d53d8d7fffeaa3646ccfa3aec64e128aa0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:34.021', '2026-09-04 09:05:34.022', '2026-09-04 12:38:42.487'),
(461, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '1612f01a1feda9a04f26bb38d632340af77423d55173808ad060e811934bd377', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:45.898', '2026-09-04 09:05:45.898', '2026-09-04 12:38:42.487'),
(462, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '1e9149480ea79433637a5c3da8138487fa76f214ac382428bb017116bb3cca2d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:05:55.442', '2026-09-04 09:05:55.443', '2026-09-04 12:38:42.487'),
(463, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '9a2ffac0b64401eb4521c59f526c90882b32738c1d32942995aed92cd6f01a3d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:06:05.426', '2026-09-04 09:06:05.427', '2026-09-04 12:38:42.487'),
(464, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'abb0bc72d3defd3340b4416c48060e2e4ea7b51d5688a4519237ace87aab5ac6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:06:15.157', '2026-09-04 09:06:15.158', '2026-09-04 12:38:42.487'),
(465, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '90cb0cd2a924a994e97cd35f443053ccce128ad94b9606a23a1e2dfd02e93d27', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:06:25.946', '2026-09-04 09:06:25.947', '2026-09-04 12:38:42.487'),
(466, 1, 'a7bdec26-f453-4d51-841d-e12ab5552b51', '34867c397708559d97f73e201e3e14c0d8d0dea8ae8f3f4b994b1be2887a9d9e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:12:47.877', '2026-09-04 09:12:47.878', '2026-09-04 09:34:40.285'),
(467, 1, 'a7bdec26-f453-4d51-841d-e12ab5552b51', '8bafa05057231c7ffb450f6efe5e2d50cba21da76556ee024140c813be19ac88', 1, 1, 'LOGGED_OUT', '2026-09-11 09:13:17.598', '2026-09-04 09:13:17.599', '2026-09-04 09:34:42.647'),
(468, 1, 'a7bdec26-f453-4d51-841d-e12ab5552b51', '906748c11d2f5cc87750f01eefcc9033225462ae11b496cc309cbad92a4c09f6', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:34:38.319', '2026-09-04 09:34:38.320', '2026-09-04 09:34:40.285'),
(469, 1, 'ce7f2bac-d1a4-43d6-b7de-de98f8b3b53a', '08afeb1fa21567d1d853322760f010bff71db33e6145c62d0894f34594431607', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:35:31.972', '2026-09-04 09:35:31.973', '2026-09-04 10:07:46.651'),
(470, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'cb6c8e64ee407a0037c5c15e33262ddd131aad7ee9a8426bbdc7e623b2a57d92', 1, 0, NULL, '2026-09-11 09:36:57.727', '2026-09-04 09:36:57.728', '2026-09-04 09:38:15.359'),
(471, 17, '73dd45b5-2025-4c2e-a041-0523cfee2635', 'bb2b2ddf36b14be6b2ad8fee1f6aa6c633c8e46c79f92798e4802b4a0a1f9239', 0, 1, 'LOGGED_OUT', '2026-09-11 09:37:26.951', '2026-09-04 09:37:26.952', '2026-09-04 10:22:20.559'),
(472, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', '145992011da91b22788069717d4cf46e71c508c0811181144d36027671538a3d', 1, 0, NULL, '2026-09-11 09:38:19.483', '2026-09-04 09:38:19.483', '2026-09-04 13:32:12.447'),
(473, 1, 'ce7f2bac-d1a4-43d6-b7de-de98f8b3b53a', 'e91b97bf1e5f29aff4a7c3d3e520612e3924782f6d187086803c22f3fea76758', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 09:40:04.527', '2026-09-04 09:40:04.528', '2026-09-04 10:07:46.651'),
(474, 1, 'ce7f2bac-d1a4-43d6-b7de-de98f8b3b53a', 'dce203673a928f86915bf9b7248076afba9e60dc0bf80c6b9a76159bd5be0004', 1, 1, 'LOGGED_OUT', '2026-09-11 10:01:08.602', '2026-09-04 10:01:08.603', '2026-09-04 10:07:50.912'),
(475, 1, 'ce7f2bac-d1a4-43d6-b7de-de98f8b3b53a', 'bb4edf63c01bfed518da5fa2cef8206068906b10903a6ea735af072fb6d3bfbd', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 10:07:43.684', '2026-09-04 10:07:43.685', '2026-09-04 10:07:46.651'),
(476, 1, 'c8d5dd1e-8e06-4726-8118-3edf19fb4a98', '5956d67aa5aceac50e6d84e0e025f09d4e84bc34e23627a19ba7086c5b0f6927', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 10:09:58.903', '2026-09-04 10:09:58.903', '2026-09-04 10:31:11.754'),
(477, 1, 'c8d5dd1e-8e06-4726-8118-3edf19fb4a98', '9901f605705b259799449e6e8ef20d7dfbf44ae09a602728f0c322315c1f52b8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 10:12:13.861', '2026-09-04 10:12:13.861', '2026-09-04 10:31:11.754'),
(478, 1, 'c8d5dd1e-8e06-4726-8118-3edf19fb4a98', '8d11d3077cf84b9a01dfefb39106ba2822954c5e2c68c2738e8a2fe23c2f74e9', 1, 1, 'LOGGED_OUT', '2026-09-11 10:25:06.119', '2026-09-04 10:25:06.120', '2026-09-04 10:31:14.121'),
(479, 1, 'c8d5dd1e-8e06-4726-8118-3edf19fb4a98', '38da9d9b740a4ce42c9cdd16a1bb95549612b1c479a69e5e4d47dac28edd6ead', 0, 0, NULL, '2026-09-11 10:31:13.429', '2026-09-04 10:31:13.430', '2026-09-04 10:31:13.430'),
(480, 1, 'a19fba2d-da27-4cdc-a0d2-6a336a18cde5', 'de099540e61db7df5502101271783c3d2143aeebd0cd8af384cc39a94bed1d8b', 0, 1, 'LOGGED_OUT', '2026-09-11 10:31:21.897', '2026-09-04 10:31:21.897', '2026-09-04 10:31:29.355'),
(481, 1, '244183f2-9777-4da3-a04c-e92f456137f2', '4af4b36cf211c4b27ea88e6b1f77d48d8f013f18d67ce79b780f69d8023432e9', 0, 1, 'LOGGED_OUT', '2026-09-11 10:46:46.607', '2026-09-04 10:46:46.607', '2026-09-04 10:54:17.321'),
(482, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '5fe83ba07de68a35e4aa223872ed131612042d38806d3c60eb3af761ffd28843', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:02:28.499', '2026-09-04 12:02:28.500', '2026-09-04 12:38:42.487'),
(483, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', 'ea47cb383a454d73353d4989fccaca19a1a21d3c058ce6b2d05f163916c42a2a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:03:58.425', '2026-09-04 12:03:58.426', '2026-09-04 12:28:35.754'),
(484, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', 'f2c0579ecd98bb8d169ebde7c4ac1a55407d52c488e82b75e7dfda51491132cf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:04:46.716', '2026-09-04 12:04:46.717', '2026-09-04 12:28:35.754'),
(485, 4, 'b2cf0b90-54ab-41e9-9843-618339b0239e', 'd24d0caaf4bc6b518f4c4dff401bb440542d151e681549252f398895095be813', 1, 1, 'LOGGED_OUT', '2026-09-11 12:05:31.619', '2026-09-04 12:05:31.620', '2026-09-04 12:06:19.083'),
(486, 4, 'b2cf0b90-54ab-41e9-9843-618339b0239e', '3081071b7140c1ba67617230b71d90ed7594ab204e779db680e10054c08cc94a', 0, 0, NULL, '2026-09-11 12:06:14.956', '2026-09-04 12:06:14.957', '2026-09-04 12:06:14.957'),
(487, 4, '017a9bad-d2c5-4bee-867d-10f4601b73b6', '74c33d4be16a73db6d02e7d2fda6281fba0111f50edbc4163b9ec5afd84f67cd', 1, 1, 'LOGGED_OUT', '2026-09-11 12:06:48.725', '2026-09-04 12:06:48.725', '2026-09-04 12:09:32.394'),
(488, 4, '017a9bad-d2c5-4bee-867d-10f4601b73b6', '6c3ca11d0b6459a0ca94af129db1804405df45ef23e588bbd37e29991be1d6a9', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:08:11.919', '2026-09-04 12:08:11.920', '2026-09-04 12:09:29.765'),
(489, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '0d8e2e1e7252e7940595d8a2c6a5b9312496d1675f46aa3b31e6ba03b3d557fa', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:10:05.024', '2026-09-04 12:10:05.025', '2026-09-07 05:03:48.449'),
(490, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '31d813a60bc1be79553000e044f7cb06879ba01707ebbd4df24a876677cff1b3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:12:04.800', '2026-09-04 12:12:04.801', '2026-09-04 12:38:42.487'),
(491, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', 'd0fb9bfd8068b5d3b0cb6723d4257ed6dd864fe888136dba81d6d93192ac53f1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:27:02.039', '2026-09-04 12:27:02.040', '2026-09-04 12:28:35.754'),
(492, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', '1afad3b3500bda7ae6c8fe66f454fcbd5d1e2360180abd549fcc45da148254c8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:27:12.293', '2026-09-04 12:27:12.294', '2026-09-04 12:28:35.754'),
(493, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', '162484dd8c5c57d92509267ea81a5ea51ce9d07d1c851736759c87cf62a9bd79', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:27:20.665', '2026-09-04 12:27:20.666', '2026-09-04 12:28:35.754'),
(494, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', '081a5bf0565759afd24f9d20c72133e638920314efa38c4cb66d6675b8289de2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:27:31.543', '2026-09-04 12:27:31.544', '2026-09-04 12:28:35.754'),
(495, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', 'b7cba25efea2736098b0cef2a73cb80585a6063358732a899eb3adc27f9453ed', 1, 1, 'LOGGED_OUT', '2026-09-11 12:27:40.844', '2026-09-04 12:27:40.845', '2026-09-04 12:29:06.212'),
(496, 2, '7d5db88a-c3b6-4fd8-bb5f-f0609222b153', '82e422f9c5389958ccc7899db4e6cade9419eecf7cb52e330f86a073e12cae08', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:27:49.842', '2026-09-04 12:27:49.843', '2026-09-04 12:28:35.754'),
(497, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', 'b4e055f4d293cbc2c105f59eeafe4129a4be67bb31c64a2271c16388637741f7', 1, 0, NULL, '2026-09-11 12:29:14.429', '2026-09-04 12:29:14.430', '2026-09-05 04:12:19.077'),
(498, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '41354ab8ec06a92d0742fdec9fdcb0ff519cdb4065b9a11bb631287c55092efc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:30:43.967', '2026-09-04 12:30:43.968', '2026-09-07 05:03:48.449'),
(499, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', 'a4d33a7684d2138667321730caee4e226ffd440d89f8423f67d1baae47fa21aa', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:00.484', '2026-09-04 12:31:00.484', '2026-09-07 05:03:48.449'),
(500, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '6543b40204523366bca570a316065c4346bb102c8594df3e61b6124f834fe029', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:12.097', '2026-09-04 12:31:12.098', '2026-09-04 12:38:42.487'),
(501, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '7c114c80af3b327db76b6d7d5e290ad340b3f4dc8984721ed4096f23b2f8479a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:20.183', '2026-09-04 12:31:20.184', '2026-09-04 12:38:42.487'),
(502, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', 'e23100e9fe0b0a92b123fc17fbc907002a5b333f92bb29b9a8f3f241e8279295', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:20.413', '2026-09-04 12:31:20.414', '2026-09-07 05:03:48.449'),
(503, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '2c368df965a1b87ecb73aca0f990338fcb611e88533b16f2af185d0c91dc6e31', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:32.674', '2026-09-04 12:31:32.675', '2026-09-04 12:38:42.487'),
(504, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'a341d20e1656bb5754904411f753411f22e0cf7d245d7a73ac133b678aabaebd', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:31:49.475', '2026-09-04 12:31:49.476', '2026-09-04 12:38:42.487'),
(505, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '0ae3f34030e05fecd772658852ab90f2394cda6d59d128fb7c7734e10e11cf61', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:00.692', '2026-09-04 12:32:00.692', '2026-09-07 05:03:48.449'),
(506, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '2a298c6653665ba37af00391037075248ea08a317807781cfc33f09602b4260e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:06.071', '2026-09-04 12:32:06.072', '2026-09-04 12:38:42.487'),
(507, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '209aa19ede932fd04b71e8065e77ec94946b0cad1c06b6e6f8351bfadd07706a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:13.984', '2026-09-04 12:32:13.985', '2026-09-07 05:03:48.449'),
(508, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '249063e5a39c57d15ffa6cbbeb121ead03191d04832f0480a4be16756600a970', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:20.204', '2026-09-04 12:32:20.204', '2026-09-04 12:38:42.487'),
(509, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '61c3dc377f87e1e0fbecccc1e69dcd89fe4488bdfb98f80b8f1736bb6d81d986', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:39.335', '2026-09-04 12:32:39.336', '2026-09-04 12:38:42.487'),
(510, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'da52bda154ac205919ed715820a26fc971749d637ecebd80e66f000e1c085a13', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-11 12:32:55.648', '2026-09-04 12:32:55.649', '2026-09-04 12:38:42.487'),
(511, 1, '52095982-f13c-4b7a-a94f-2d0fbdc99a7e', '005e12112b5de9ccf817c3ad21b94834d13b9daaf52e96bbfa7672fc063b2476', 1, 0, NULL, '2026-09-11 12:33:16.322', '2026-09-04 12:33:16.323', '2026-09-04 12:33:35.112'),
(512, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', '1c30e0e990ba2942a317dce307abfd1244031530bd0e555bb527d643ca11a514', 1, 1, 'LOGGED_OUT', '2026-09-11 12:33:20.563', '2026-09-04 12:33:20.564', '2026-09-05 06:21:36.851'),
(513, 1, '52095982-f13c-4b7a-a94f-2d0fbdc99a7e', '2b042af1ec4ef6ea50596df1c788ad173275ba16965a0712b368a1505f8b54ad', 1, 0, NULL, '2026-09-11 12:33:37.264', '2026-09-04 12:33:37.265', '2026-09-04 12:34:00.001'),
(514, 1, '52095982-f13c-4b7a-a94f-2d0fbdc99a7e', '67f5d5888cc9af4be75bb8241861c3ea24c4218050a030bb00949649d60ad2d8', 1, 0, NULL, '2026-09-11 12:34:03.759', '2026-09-04 12:34:03.760', '2026-09-04 12:41:27.245'),
(515, 3, '962651ec-9e5b-4aa3-ad25-ad885a826d51', 'c6fdca12b8b754834232d5285fb60ab5bee3afd0f94630648591c5e0152167f8', 0, 0, NULL, '2026-09-11 12:38:46.276', '2026-09-04 12:38:46.276', '2026-09-04 12:38:46.276'),
(516, 1, '52095982-f13c-4b7a-a94f-2d0fbdc99a7e', '50c4284a216270d0ae1852ef0151b27a4804afe0a8f1125693b7aecbd7f44cfc', 0, 0, NULL, '2026-09-11 12:41:31.111', '2026-09-04 12:41:31.112', '2026-09-04 12:41:31.112'),
(517, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', 'dfee32de8a139ac425e65508cc62c5d8475525279526aa254176659a48678294', 1, 0, NULL, '2026-09-11 13:03:12.972', '2026-09-04 13:03:12.973', '2026-09-04 13:03:41.286'),
(518, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '9a607a148e7615755ee0c7a8582495cf652533a57c954b85e1ccc42a91bca3b8', 1, 0, NULL, '2026-09-11 13:03:43.511', '2026-09-04 13:03:43.512', '2026-09-07 12:33:29.263'),
(519, 1, 'c041f7a7-832a-45a2-95b1-9392d638edc2', '53ac04e07b1636676d93893ebfc6ac054e2ba58b71e31e1f74cd4cf191f5b635', 1, 0, NULL, '2026-09-11 13:16:34.529', '2026-09-04 13:16:34.529', '2026-09-04 13:16:56.419'),
(520, 1, 'c041f7a7-832a-45a2-95b1-9392d638edc2', '3d288cdb420a5062614de1a49fa8f9b2b2a66bedf4fdb87ece2888b6791de701', 1, 0, NULL, '2026-09-11 13:17:00.374', '2026-09-04 13:17:00.375', '2026-09-04 13:17:18.846'),
(521, 1, 'c041f7a7-832a-45a2-95b1-9392d638edc2', '5f7aa4ecae57ee9b71f6ee9740af5a723af185fc9f7c73beab379fbfa9798a08', 1, 0, NULL, '2026-09-11 13:17:22.807', '2026-09-04 13:17:22.808', '2026-09-04 13:17:38.109'),
(522, 1, 'c041f7a7-832a-45a2-95b1-9392d638edc2', '665078b933298519a13adcdce07f89eb7d365d7952882dc319b0ac80e4670d40', 1, 0, NULL, '2026-09-11 13:17:40.584', '2026-09-04 13:17:40.585', '2026-09-04 13:20:31.105'),
(523, 1, 'c041f7a7-832a-45a2-95b1-9392d638edc2', '4e623dafb21b826fe991b514d4ec9cf3fb9cbeb897f3215dc4e6fd7957491bbe', 0, 1, 'LOGGED_OUT', '2026-09-11 13:20:34.795', '2026-09-04 13:20:34.795', '2026-09-04 14:32:07.480'),
(524, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'dee18398cc72403673d29bdb836b2c2916c9e1594b57b87e44008f44b159d0a3', 1, 0, NULL, '2026-09-11 13:32:16.538', '2026-09-04 13:32:16.539', '2026-09-04 14:00:43.193'),
(525, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '518cd30af1b845e78fbbe2bf786c8b6a39991a7bbb4ba66fdbbe09fb92d7fb90', 1, 0, NULL, '2026-09-11 13:33:32.623', '2026-09-04 13:33:32.624', '2026-09-04 13:35:33.098'),
(526, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '741940a52bec9af98cfbf5f1091c90afbd354e6c22b6fb0dd7f1fa658f2465b3', 1, 0, NULL, '2026-09-11 13:35:36.791', '2026-09-04 13:35:36.792', '2026-09-05 14:29:44.779'),
(527, 1, 'df86115c-4017-42b5-a9b8-d3427951ade9', 'ac64272262edebd7c6bb9c5166f285d684c2a31a8687343f0becafb3371a0516', 0, 0, NULL, '2026-09-11 13:59:48.439', '2026-09-04 13:59:48.440', '2026-09-04 13:59:48.440'),
(528, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'cd86295677e13929069a4a631c44a9db3e31514c82b1296fddad2736bac684b3', 1, 0, NULL, '2026-09-11 13:59:49.530', '2026-09-04 13:59:49.530', '2026-09-04 14:00:01.011'),
(529, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '2748cc8f078ff73dc010732383db42ea642c0fdb2368f36325708d933ab93c34', 1, 0, NULL, '2026-09-11 14:00:03.460', '2026-09-04 14:00:03.461', '2026-09-04 14:00:11.359'),
(530, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '9f838f42ffa6d9e691f10eed7b3c070a1655fcc162bb666b14531aff15e73a6f', 1, 0, NULL, '2026-09-11 14:00:13.546', '2026-09-04 14:00:13.547', '2026-09-04 14:00:21.111'),
(531, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '934d5c5e0d7b9f392c056b48e62061a885abf58d25bad5be54c456da28ed9e53', 1, 0, NULL, '2026-09-11 14:00:23.466', '2026-09-04 14:00:23.466', '2026-09-04 14:00:31.189'),
(532, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'fddbd42847389fd8d41459e52841fee561842287dbd89310fdde2300c8c17fde', 1, 0, NULL, '2026-09-11 14:00:33.285', '2026-09-04 14:00:33.285', '2026-09-04 14:00:41.093'),
(533, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'b2effde73c17a20bdc6ba23e763d44cf384a806235e1b3c3669fd01aaddb6ffc', 1, 0, NULL, '2026-09-11 14:00:43.185', '2026-09-04 14:00:43.186', '2026-09-04 14:00:51.672'),
(534, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'd167c3aea9bdae91835835d05e9755247694a193eafc0a98c7775118546760d6', 1, 0, NULL, '2026-09-11 14:00:45.382', '2026-09-04 14:00:45.383', '2026-09-04 19:53:50.428'),
(535, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'e00172d8c38c06d3d45f1113e3d4edb28337fccffe03cff8b7ed1d52db6fbbc5', 1, 0, NULL, '2026-09-11 14:00:53.618', '2026-09-04 14:00:53.619', '2026-09-04 14:01:01.677'),
(536, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '2ccf3c200e9ffbb218a2548c7242e89dfbd8c71db0466cfb7236073806bdaf89', 1, 0, NULL, '2026-09-11 14:01:03.624', '2026-09-04 14:01:03.625', '2026-09-04 14:01:11.263'),
(537, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'c02ca3f4c8cb9d88693ffcda0eb6d9d42d0422c3bb58210e8c3d49dc4cb0067d', 1, 0, NULL, '2026-09-11 14:01:14.877', '2026-09-04 14:01:14.877', '2026-09-04 14:01:21.363'),
(538, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '9549d557581dcb83a4428f886b8f34cb1b2047f0acd3d45dba21bd79c61bb949', 1, 0, NULL, '2026-09-11 14:01:23.455', '2026-09-04 14:01:23.455', '2026-09-04 14:01:31.116'),
(539, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '5a2407a7a938f9af2bd55a9af56d0980454f098cee7d68ce64a67e7033f3c7e3', 1, 0, NULL, '2026-09-11 14:01:33.072', '2026-09-04 14:01:33.073', '2026-09-04 14:01:41.047'),
(540, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'ecd1d18d8935eaa636dc9668041330f721fca664d3530e5a1179e6dada164b07', 1, 0, NULL, '2026-09-11 14:01:43.300', '2026-09-04 14:01:43.301', '2026-09-04 14:01:51.697'),
(541, 17, '70e620da-34b6-4922-99e0-598c6f81def4', '7b5753df6a0251bec747afda15d65f8b002cb2e852baebd0c2c24deafef2e598', 1, 0, NULL, '2026-09-11 14:01:59.243', '2026-09-04 14:01:59.243', '2026-09-04 14:02:12.146'),
(542, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'c1b5ae8f5b19bf525368ed912d50799bd7be56392a27eebe02ecbf7aadb00732', 1, 1, 'LOGGED_OUT', '2026-09-11 14:02:14.164', '2026-09-04 14:02:14.165', '2026-09-10 07:22:40.486'),
(543, 1, 'ca00c233-675c-48fe-9689-baad1e12ffb6', '3223a2336eaaac09423ab056b14c8c1a76789e65dc6b54f337221de85661420b', 1, 0, NULL, '2026-09-11 16:55:22.222', '2026-09-04 16:55:22.223', '2026-09-04 16:56:32.227'),
(544, 1, 'ca00c233-675c-48fe-9689-baad1e12ffb6', 'a44e99e3b0d932160f8a01d8ef7ac6ca8a0da5e3ea1290595a65dbc81204a688', 0, 0, NULL, '2026-09-11 16:56:36.077', '2026-09-04 16:56:36.078', '2026-09-04 16:56:36.078'),
(545, 1, '7e38df77-99b0-47b0-9dfd-b1debb9de1ef', 'a13b85188dd76798e79e05f168d352c46faad34112318ef36d9faa0e319191e4', 1, 0, NULL, '2026-09-11 16:56:41.116', '2026-09-04 16:56:41.117', '2026-09-04 16:57:47.256'),
(546, 1, '7e38df77-99b0-47b0-9dfd-b1debb9de1ef', 'b7867ce16c486b0c04382dca16f4515ecaa56e29acb679e806a908e8cbce5e50', 1, 0, NULL, '2026-09-11 16:57:50.993', '2026-09-04 16:57:50.993', '2026-09-04 16:59:26.577'),
(547, 1, '7e38df77-99b0-47b0-9dfd-b1debb9de1ef', 'e8c6e6ec53f23569fe4e51f6a74315a0c2bb81ae995428589c706ede7859191b', 0, 1, 'LOGGED_OUT', '2026-09-11 16:59:30.321', '2026-09-04 16:59:30.322', '2026-09-04 17:28:05.350'),
(548, 1, '6a43fc9c-486e-4551-b23f-1c641e9b8ac5', '954640b12d887db5fa85c902ee1294fd69354c5966fbc2f2de8c7f44d28889dc', 1, 0, NULL, '2026-09-11 17:29:58.688', '2026-09-04 17:29:58.689', '2026-09-04 17:32:24.445'),
(549, 1, '6a43fc9c-486e-4551-b23f-1c641e9b8ac5', '9d3604777056cbb0ceed17cbf01e68ff88a08ac61702c8968ac5aadcaea51956', 0, 1, 'LOGGED_OUT', '2026-09-11 17:32:28.313', '2026-09-04 17:32:28.314', '2026-09-04 18:03:26.704'),
(550, 1, '52ff47b3-d6dc-4a29-9489-c37c17641771', '57a9af609d7cdd9aac93ad44960b0b2650e844b77a66b3eef1e032f11dfec88e', 0, 1, 'LOGGED_OUT', '2026-09-11 18:46:05.150', '2026-09-04 18:46:05.150', '2026-09-04 19:20:42.080'),
(551, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'c4da88d4e1ca908de56a2c6d73eafdc8846e42cf364dc05df8247547658809b4', 1, 0, NULL, '2026-09-11 19:48:01.597', '2026-09-04 19:48:01.598', '2026-09-04 19:55:42.712'),
(552, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'ad63c55cfefe129d5339850878290afd77f0a12971460845e7a0da5fadf25242', 1, 0, NULL, '2026-09-11 19:53:54.624', '2026-09-04 19:53:54.624', '2026-09-05 04:38:26.103'),
(553, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'd42313b4d85140555f20323fdfb6f2d9a53b9d8dd508fd684676f50c4a438a71', 1, 0, NULL, '2026-09-11 19:55:46.322', '2026-09-04 19:55:46.323', '2026-09-04 19:56:08.909'),
(554, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '9b52be65f4ae1b8c8f3f59ad06299d7a44ab10ebc85977a8f2dc9c9df92eef9a', 1, 0, NULL, '2026-09-11 19:56:12.747', '2026-09-04 19:56:12.748', '2026-09-04 19:58:37.410'),
(555, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '815e179c58795296c1d44c541f38811260ec335585871316ca9a4daaacc75fd0', 1, 0, NULL, '2026-09-11 19:58:41.040', '2026-09-04 19:58:41.040', '2026-09-04 20:03:47.402'),
(556, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'b5b6bd1659265da9dcbee56dbd41333dcf00c78311f977cb0726a97daf955011', 1, 0, NULL, '2026-09-11 20:03:51.264', '2026-09-04 20:03:51.264', '2026-09-04 20:25:40.849'),
(557, 1, 'dc40a512-0a0c-45ff-8b9b-3bb5609f85f8', 'a65ee5a16f5436873f480a7936ccc2be5bdaee721b653fdda81850dd1dec9a67', 1, 0, NULL, '2026-09-11 20:23:00.891', '2026-09-04 20:23:00.892', '2026-09-04 20:24:51.418'),
(558, 1, 'dc40a512-0a0c-45ff-8b9b-3bb5609f85f8', '757b0e8bbeae6662dc7e917712ac2084b39f6f8d91a5ea999802a5463ccd9045', 1, 0, NULL, '2026-09-11 20:24:56.974', '2026-09-04 20:24:56.975', '2026-09-04 20:25:40.399'),
(559, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'a906d3ce55700af17cabd83d0049fe7953b1c8b2ae5a0ef0e85ffb58a03f1787', 1, 0, NULL, '2026-09-11 20:25:43.593', '2026-09-04 20:25:43.594', '2026-09-04 20:30:25.622'),
(560, 1, 'dc40a512-0a0c-45ff-8b9b-3bb5609f85f8', '8a4415f09956e405b58f85d279ae9dab0dbbae6c997afd8d999f0810536bb1f1', 1, 0, NULL, '2026-09-11 20:25:45.629', '2026-09-04 20:25:45.630', '2026-09-04 20:25:49.735'),
(561, 1, 'dc40a512-0a0c-45ff-8b9b-3bb5609f85f8', '09656772a231d664d4a2b5e878b145e9b7d568662a803177c67725d3a4580348', 0, 1, 'LOGGED_OUT', '2026-09-11 20:25:54.163', '2026-09-04 20:25:54.163', '2026-09-04 20:55:56.961'),
(562, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '875ce6a581e7023a912e93c8c2815512692e965ee16f9b370b383e1eadb12f7f', 1, 0, NULL, '2026-09-11 20:30:29.990', '2026-09-04 20:30:29.991', '2026-09-04 20:31:46.279'),
(563, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '25e6428cb33cd1c99fb177c62b39a18b28ce288d2c3feb588116781f0339bd34', 1, 0, NULL, '2026-09-11 20:31:50.655', '2026-09-04 20:31:50.656', '2026-09-04 20:35:38.018'),
(564, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'a8f0ba279675af19099691d0971f0fc2f1c371702de152e39146bc9c06ea13a6', 1, 0, NULL, '2026-09-11 20:35:42.383', '2026-09-04 20:35:42.384', '2026-09-04 20:42:53.252'),
(565, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'e84e9bf9726cbe49fd8005709be302c7e7331d65b473b597a98b560e5f88ee51', 1, 0, NULL, '2026-09-11 20:42:57.627', '2026-09-04 20:42:57.628', '2026-09-04 21:03:46.366'),
(566, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '0143498e328a68a5cfad0db9d85cf5f20d3ca375d36d14f288c51e3814262356', 1, 0, NULL, '2026-09-11 21:03:50.749', '2026-09-04 21:03:50.750', '2026-09-04 21:07:03.902'),
(567, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'b23177c37a3dc3f333c811fb7f5a55ebb69050e6c6d13848cda0f582e4d630d8', 1, 0, NULL, '2026-09-11 21:07:08.394', '2026-09-04 21:07:08.395', '2026-09-04 21:20:20.894'),
(568, 1, '9396d310-b58f-4c90-950e-108b3768f5db', 'f14f644332f80c015eab4ce2b62ed848ea744f65ac3f30e38f335a276f3da5f3', 1, 0, NULL, '2026-09-11 21:20:25.396', '2026-09-04 21:20:25.397', '2026-09-04 21:22:36.777'),
(569, 1, '9396d310-b58f-4c90-950e-108b3768f5db', '796359d74f352cffe6b2b3947fc0749d616650cac5c8df501f0808c3928005b1', 0, 0, NULL, '2026-09-11 21:22:41.265', '2026-09-04 21:22:41.266', '2026-09-04 21:22:41.266'),
(570, 1, '9fc4e024-9d78-469c-a37d-3c323e179e31', '771a25aa5471ef5e784510b84e291dceea2a58a27c1fdbb1d264ce5167327e3a', 1, 0, NULL, '2026-09-11 22:06:18.736', '2026-09-04 22:06:18.737', '2026-09-04 22:07:41.084'),
(571, 1, '9fc4e024-9d78-469c-a37d-3c323e179e31', 'b6d81b8fa369b2432bb9e1ceb2f5afdcb6acc8a837688b8ffdc229fd5a7e035e', 1, 0, NULL, '2026-09-11 22:07:44.098', '2026-09-04 22:07:44.099', '2026-09-04 22:37:22.750'),
(572, 1, '9fc4e024-9d78-469c-a37d-3c323e179e31', 'deaf7ef6c61fcf23730d9f92fb14032c2f29510f819c9bf44b40d72a00d199d4', 1, 0, NULL, '2026-09-11 22:37:25.752', '2026-09-04 22:37:25.753', '2026-09-04 22:50:11.620'),
(573, 1, '9fc4e024-9d78-469c-a37d-3c323e179e31', '626eb4b18998f9002f010f856b2d497d7654ba9de1d07105e22af39aee480c96', 1, 0, NULL, '2026-09-11 22:50:14.854', '2026-09-04 22:50:14.855', '2026-09-04 22:54:47.084'),
(574, 1, '9fc4e024-9d78-469c-a37d-3c323e179e31', 'eccb3a86505f9dfc524cf60cfaffcda640e989b8dce5a600de64dc9c663b4c68', 0, 1, 'LOGGED_OUT', '2026-09-11 22:54:50.023', '2026-09-04 22:54:50.023', '2026-09-04 23:25:05.256'),
(575, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '13113b1a5a4883eba35eb5456dba342cf580c53ba3c4fd2420a9e7325059a8c4', 1, 0, NULL, '2026-09-12 04:12:22.780', '2026-09-05 04:12:22.781', '2026-09-05 04:12:39.268'),
(576, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', 'd3c7969cacc2990aca934e2cf2b6ce327e727b742fd9004bb16cc46144f57d26', 1, 0, NULL, '2026-09-12 04:12:42.916', '2026-09-05 04:12:42.917', '2026-09-05 04:13:12.835'),
(577, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', 'd0070616bfdfbcfc4789ab6bc19c0f904679ccb85e31a687e50d9286eab31aeb', 1, 0, NULL, '2026-09-12 04:13:16.568', '2026-09-05 04:13:16.568', '2026-09-05 04:13:49.582'),
(578, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '598f09d96821ddfe2d73b75e451c820c19c898af698a17f39248a5fd02bc18bc', 1, 0, NULL, '2026-09-12 04:13:53.349', '2026-09-05 04:13:53.349', '2026-09-05 04:14:04.230'),
(579, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '3a92a2456b80fda0ac97d9695f68f9d09a9c1d69a535e26940f1443eed43dfcb', 1, 0, NULL, '2026-09-12 04:14:08.340', '2026-09-05 04:14:08.341', '2026-09-05 04:14:17.871'),
(580, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '21aa3bb7185e43a60f8709d18652837a5f04fa660be286d6124ed2fb596a38d3', 1, 0, NULL, '2026-09-12 04:14:22.293', '2026-09-05 04:14:22.294', '2026-09-05 04:14:31.932'),
(581, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '9ef818c8b87b752de4fd64c9cb67c014103fcbd6cf583fdfe71879f66009594f', 1, 0, NULL, '2026-09-12 04:14:35.986', '2026-09-05 04:14:35.987', '2026-09-05 04:15:03.539'),
(582, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '9981d3ba2fa9b6675ab2f184e783b2bf030b69b73a0fbb9d0b581858b836b35d', 1, 0, NULL, '2026-09-12 04:15:05.606', '2026-09-05 04:15:05.606', '2026-09-05 04:15:20.448'),
(583, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '1938b5b24df6403d440170c318536f7a2e0bbbbb571f95062172be0b1b988f68', 1, 0, NULL, '2026-09-12 04:15:22.477', '2026-09-05 04:15:22.478', '2026-09-05 12:50:20.614'),
(584, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', '58db5b5d735ccd1c51ebc45a0cfef3a55f2bed2b8ed34228f1dbb6173e928358', 1, 0, NULL, '2026-09-12 04:38:29.976', '2026-09-05 04:38:29.977', '2026-09-05 04:38:35.426'),
(585, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'b83b1b304e4cf114475e5602389f7dad39fb616e9f5746acffb23384f6e54977', 1, 0, NULL, '2026-09-12 04:38:39.198', '2026-09-05 04:38:39.199', '2026-09-05 05:06:45.540'),
(586, 1, '157f09b9-4369-497b-90e8-a82eee45300f', '2a7a481adae12d44756272ca740498881cf20a9fd906f44c7cd14b1870671ba1', 1, 0, NULL, '2026-09-12 04:48:28.607', '2026-09-05 04:48:28.608', '2026-09-05 04:59:19.694'),
(587, 1, '157f09b9-4369-497b-90e8-a82eee45300f', '0a819484e1bc179fa65fcc0be535c93531aa5de6ae0ca8d73b863f9668893033', 1, 0, NULL, '2026-09-12 04:59:24.414', '2026-09-05 04:59:24.415', '2026-09-05 05:00:59.025'),
(588, 1, '157f09b9-4369-497b-90e8-a82eee45300f', 'dedc17f480903a8da0337d7515b0af08f5b1f8f1e1d1dffd5cf7cea54db970f2', 1, 0, NULL, '2026-09-12 05:01:02.832', '2026-09-05 05:01:02.833', '2026-09-05 05:53:42.544'),
(589, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '218f5e51efca75eec9bc4d259851dceaf15d0fd7be859ff732ebfd249e79eb2c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 05:05:12.609', '2026-09-05 05:05:12.610', '2026-09-07 05:03:48.449'),
(590, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '9951fd145cbbf078ce40c3cd2d7e16d84fe6f4cfe8ebec71a77cb3732c4e3c98', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 05:05:20.658', '2026-09-05 05:05:20.659', '2026-09-07 05:03:48.449'),
(591, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '2fa06de010d59718b23168a10fce1fd59bc1e1ee923d1f775b0cd0b342252ef6', 1, 1, 'LOGGED_OUT', '2026-09-12 05:05:31.613', '2026-09-05 05:05:31.613', '2026-09-07 05:03:50.854'),
(592, 4, '6b8e8c75-d99a-4f93-ab20-0f169d9337b7', '7321bc12f2d08d3498c59a7b37b349bd67b4be846f15b610269d5fd2b150ae05', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 05:05:40.235', '2026-09-05 05:05:40.236', '2026-09-07 05:03:48.449'),
(593, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', '5ea98400303ef6f2ba0e92d2911e3b54d070023dc69c9fdad40ab420049331dc', 1, 0, NULL, '2026-09-12 05:06:49.335', '2026-09-05 05:06:49.336', '2026-09-05 05:08:02.270'),
(594, 1, '9c163f36-8ed5-47c2-83ae-4dab950182e7', 'd1abab8ec5e7da0ecde44a6a2d02467477322fb042c64735cc3941d0d35f83b7', 0, 1, 'LOGGED_OUT', '2026-09-12 05:08:06.166', '2026-09-05 05:08:06.167', '2026-09-05 08:12:45.453'),
(595, 1, '157f09b9-4369-497b-90e8-a82eee45300f', 'b29c31e67543b01e43434199ff2b6ee9842369c797fafbc29f3da3998b503fe4', 0, 1, 'LOGGED_OUT', '2026-09-12 05:53:46.156', '2026-09-05 05:53:46.157', '2026-09-05 06:23:48.673'),
(596, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '82aeb976f164a1ae277b098a31e12a191e0bde96100cfddc69d327d216bf014e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 06:21:46.858', '2026-09-05 06:21:46.859', '2026-09-07 06:54:40.230'),
(597, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', 'c36baddbfbadbc739c95fa41db911927045293c22c1d813829ea4de41944addf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 08:02:21.144', '2026-09-05 08:02:21.145', '2026-09-07 06:54:40.230'),
(598, 1, '89110163-e1bd-4085-ba70-c2723ad625c6', '0b0a7dce8f71ed2811bb5479d62482468831c9536ec234fd07bde130e062b730', 1, 0, NULL, '2026-09-12 08:08:37.342', '2026-09-05 08:08:37.343', '2026-09-05 08:09:04.483'),
(599, 1, '89110163-e1bd-4085-ba70-c2723ad625c6', 'ccda323c750813a84d331d6321d9466e717bb534d8eb75167117e3760b859b04', 0, 1, 'LOGGED_OUT', '2026-09-12 08:09:08.291', '2026-09-05 08:09:08.292', '2026-09-05 08:39:10.589'),
(600, 1, 'fd2fb992-db21-4d37-96f7-028b8ceb8b5b', '8206a11d9b6c483f55825a6f4b80c5edaeea187499ba40b9c05972d4e65059be', 0, 1, 'LOGGED_OUT', '2026-09-12 08:11:13.979', '2026-09-05 08:11:13.980', '2026-09-05 08:46:01.987'),
(601, 1, '59bdc222-f57a-462c-a83e-10f6158be333', '45847f5211ff7c134f082feb085b195c53072987091dd848a13934e6c5f42189', 1, 0, NULL, '2026-09-12 12:38:27.729', '2026-09-05 12:38:27.730', '2026-09-05 12:43:06.817'),
(602, 1, '59bdc222-f57a-462c-a83e-10f6158be333', '9dbfbfdbbbe7f6dd71f87e6095295fc79a5f9ecbad3cc5d069e7fb62a9bcae1c', 1, 0, NULL, '2026-09-12 12:43:09.935', '2026-09-05 12:43:09.936', '2026-09-05 12:43:55.580'),
(603, 1, '59bdc222-f57a-462c-a83e-10f6158be333', '8043d70a64ec2f274613f325fe9703e693e817876466dad540601f034720910f', 1, 0, NULL, '2026-09-12 12:43:59.211', '2026-09-05 12:43:59.211', '2026-09-05 12:49:43.019'),
(604, 1, '59bdc222-f57a-462c-a83e-10f6158be333', '496d11c9a722c65f98768678dd0ba26bbd1f069b47ed68eecd937eebbc46f090', 1, 0, NULL, '2026-09-12 12:49:46.754', '2026-09-05 12:49:46.755', '2026-09-05 12:52:45.276'),
(605, 2, 'a5118a72-3b04-470d-8ad1-e77e6ee44704', '1d1d1f2bb9f213cb78c45c421df012b507f40287a27d2ba5eb5a1c18e5bcac26', 0, 1, 'LOGGED_OUT', '2026-09-12 12:50:24.460', '2026-09-05 12:50:24.460', '2026-09-05 12:52:03.498'),
(606, 1, '59bdc222-f57a-462c-a83e-10f6158be333', 'c77503869be6f0ca97e4a3e2291339968afec85208808329a2a47af4fb0dbc02', 1, 0, NULL, '2026-09-12 12:52:50.898', '2026-09-05 12:52:50.899', '2026-09-05 12:56:16.680'),
(607, 1, 'ef8f3344-877f-4aeb-97f1-4eadab4f4187', '2e55cd768f04264b57fb2b7c7b6478b6a44d72bcf2337964fb16e3f54c6cbf62', 1, 1, 'LOGGED_OUT', '2026-09-12 12:54:47.560', '2026-09-05 12:54:47.561', '2026-09-05 12:56:47.727'),
(608, 1, '59bdc222-f57a-462c-a83e-10f6158be333', 'a76136b3876ca8b86f0afaff292749ec94bc7d19d060d74495a2bb31c06697c3', 0, 0, NULL, '2026-09-12 12:56:20.368', '2026-09-05 12:56:20.369', '2026-09-05 12:56:20.369'),
(609, 1, 'ef8f3344-877f-4aeb-97f1-4eadab4f4187', '87459f2706085a966f6a605b30555d8a688141fcdccf1f5c58ed92dd20ecfca5', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 12:56:44.772', '2026-09-05 12:56:44.773', '2026-09-05 12:56:44.797'),
(610, 1, 'b7f5481f-63eb-44b9-8ecd-46f4801d3d0a', 'b8c5b7ba1fba3a2c4824618acf0de613801730a2e3c0961712c3d935c081d210', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 13:02:09.592', '2026-09-05 13:02:09.593', '2026-09-07 04:24:36.689'),
(611, 1, '21cb6557-1648-4343-a4f9-72264433dd04', '4fdfb74c21629c1a3fe07ecc09b17e02dae67122ba6977891ee25aa9b5f6cbef', 1, 0, NULL, '2026-09-12 13:57:07.585', '2026-09-05 13:57:07.586', '2026-09-05 13:57:26.491'),
(612, 1, '21cb6557-1648-4343-a4f9-72264433dd04', '9995c4f914557c0ff68329ab0c1d0a028a7efb6cdd6aa044d6f539712cc46680', 1, 0, NULL, '2026-09-12 13:57:30.552', '2026-09-05 13:57:30.553', '2026-09-05 16:04:39.055'),
(613, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '4c9bfac9385c2cc0bad48083a38bb81ffa01a988340708080de4c7fd65acc840', 1, 0, NULL, '2026-09-12 14:29:49.548', '2026-09-05 14:29:49.549', '2026-09-07 04:10:36.314'),
(614, 1, 'b7f5481f-63eb-44b9-8ecd-46f4801d3d0a', '0b0f910c4c3744b3a126c0e0097db93fee73341e7476990740795e2eea6d8150', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 14:30:25.813', '2026-09-05 14:30:25.814', '2026-09-07 04:24:36.689'),
(615, 1, 'b7f5481f-63eb-44b9-8ecd-46f4801d3d0a', '053e319f8d2f8acf4b2007a2d5da9245aec8438216cf34f99a8764609b5e7c1a', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 14:52:43.858', '2026-09-05 14:52:43.859', '2026-09-07 04:24:36.689'),
(616, 1, '21cb6557-1648-4343-a4f9-72264433dd04', '37ee663b976f603772186d6291a0591393e847d371981b4627a8ede84a2285bc', 0, 1, 'LOGGED_OUT', '2026-09-12 16:04:42.770', '2026-09-05 16:04:42.771', '2026-09-05 16:35:42.943'),
(617, 1, '8aa1cab3-b2bb-4bf9-b590-919935402338', '47763d6186ead3de991f2e5f4ccbf876b8127112d9a756da66fb7b07b6e221d1', 0, 1, 'LOGGED_OUT', '2026-09-12 16:12:02.642', '2026-09-05 16:12:02.643', '2026-09-05 16:42:38.523'),
(618, 1, 'c4f97198-0ae5-4106-927e-78482140859b', '196ad44ed2523acf07b805cabf0a9c356175e04d9a5aabebbbf23eaa2f775d50', 1, 0, NULL, '2026-09-12 18:01:09.028', '2026-09-05 18:01:09.029', '2026-09-05 18:04:56.524'),
(619, 1, 'c4f97198-0ae5-4106-927e-78482140859b', '4cd65612932c7d6390fe9a73080fc34c1a64936e2d0d87040e7e79c22551033c', 0, 1, 'LOGGED_OUT', '2026-09-12 18:04:59.595', '2026-09-05 18:04:59.596', '2026-09-05 19:23:24.579'),
(620, 1, '9d751982-f2b8-4a55-92bc-a9c3ff17cd29', '31c81de609d7597d4c4b39e7919315a1fdfa3985e059828f97ce6ea0c0821b84', 0, 1, 'LOGGED_OUT', '2026-09-12 23:07:08.890', '2026-09-05 23:07:08.891', '2026-09-06 00:02:15.981'),
(621, 30, 'e6c09567-79b8-467c-bf46-42d8996376fd', '2bac2f255c4c94f15003a88e7e0171c81fc5fdf9b67968ac5c44503bf42578f1', 0, 1, 'LOGGED_OUT', '2026-09-12 23:12:28.733', '2026-09-05 23:12:28.734', '2026-09-05 23:14:52.311'),
(622, 30, '51c740ba-da6b-4d7e-87b3-5e07adc20601', '42120dac5c633264a92f3321a63c1b03e850175e74da9d06505004f0fe275378', 0, 0, NULL, '2026-09-12 23:12:58.102', '2026-09-05 23:12:58.103', '2026-09-05 23:12:58.103'),
(623, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'fcd0440866f426db916bf418a6812dd004d9b89f5fe87ecf4d35d8e60239fd4c', 1, 0, NULL, '2026-09-12 23:15:13.878', '2026-09-05 23:15:13.879', '2026-09-05 23:18:37.491'),
(624, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '8e2a0d00cac261222ce5f6a043dd9d4565c239d5ba3163eabe44e371d8d1adc9', 1, 0, NULL, '2026-09-12 23:18:41.225', '2026-09-05 23:18:41.226', '2026-09-05 23:18:47.820'),
(625, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'aae21f0314524fe2b424a5a98f173a37b70575dabc3c185c7aa49603ed2425d5', 1, 0, NULL, '2026-09-12 23:18:51.593', '2026-09-05 23:18:51.594', '2026-09-05 23:18:58.890'),
(626, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'e2df8076ea70b98144cc064c46d089118dd83cb7bacd8dbb3b3a80bf2edff397', 1, 0, NULL, '2026-09-12 23:19:02.077', '2026-09-05 23:19:02.078', '2026-09-05 23:19:07.671'),
(627, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '269bb8f773927875c0c6b95f5f3db042cb85e24c5a518d3982d689b3d5b7e8cd', 1, 0, NULL, '2026-09-12 23:19:11.283', '2026-09-05 23:19:11.284', '2026-09-05 23:19:19.160'),
(628, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '632818f6697952eb2e23dcfb22b4624122d937609e1f471fc6374499e2b9470b', 1, 0, NULL, '2026-09-12 23:19:22.883', '2026-09-05 23:19:22.884', '2026-09-05 23:19:29.885'),
(629, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '6d1802ffc3bbe20963c65d7ecf80e6df71f24570580e30aa12f97f0a5cdbe305', 1, 0, NULL, '2026-09-12 23:19:33.565', '2026-09-05 23:19:33.566', '2026-09-05 23:19:39.275'),
(630, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'a9663f2933ec903b4633e49bef2bbca1312bc04444f36388029cae72264b5ce7', 1, 0, NULL, '2026-09-12 23:19:41.562', '2026-09-05 23:19:41.562', '2026-09-05 23:19:46.581'),
(631, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '93d4898176ff34200318e67632bcfcee5f12491dd2a36a6e2604748863d532d2', 1, 0, NULL, '2026-09-12 23:19:48.651', '2026-09-05 23:19:48.652', '2026-09-05 23:19:56.544'),
(632, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '648802820e539bed29b7214537304ea0c4fa712a23be0b2741ba03683f4a4eae', 1, 0, NULL, '2026-09-12 23:19:58.552', '2026-09-05 23:19:58.553', '2026-09-05 23:20:06.772'),
(633, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '47029d896d9b97fdd4f09a349b398de23b00be9b81a86c4f21794a97c6466c75', 1, 0, NULL, '2026-09-12 23:20:10.526', '2026-09-05 23:20:10.527', '2026-09-05 23:20:16.513'),
(634, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '4db7c911ec46ebec1edbe80bf44ba65afbfd7b3a60fdd6568a408bda0b0ce7c1', 1, 0, NULL, '2026-09-12 23:20:18.769', '2026-09-05 23:20:18.769', '2026-09-05 23:20:26.631'),
(635, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'f40252992e3f4dd7b04fe886ad0916399656cbcfd746c60008adda1ec61891f3', 1, 0, NULL, '2026-09-12 23:20:29.664', '2026-09-05 23:20:29.665', '2026-09-05 23:20:36.513'),
(636, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '1d184b9c9298fad9477dd239fb56ff2a12234be5f379152268c998e19d8ce835', 1, 0, NULL, '2026-09-12 23:20:38.497', '2026-09-05 23:20:38.498', '2026-09-05 23:20:46.764'),
(637, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '2fce5a39c729e778f4abfa2a5da0156371834ac5d07dc32f177aea8d7ecc69c8', 1, 0, NULL, '2026-09-12 23:20:50.453', '2026-09-05 23:20:50.454', '2026-09-05 23:20:57.417'),
(638, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '641c1f8ac4ac5eeebb6431f906bc012edfd1ee0a71b24914ff2f6900b282bcba', 1, 0, NULL, '2026-09-12 23:21:00.454', '2026-09-05 23:21:00.455', '2026-09-05 23:21:06.514'),
(639, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'b533a6f8f97d65f7f2eb98377600d8590438af55d426107e5a9a3b1b7dbc2f4a', 1, 0, NULL, '2026-09-12 23:21:08.496', '2026-09-05 23:21:08.497', '2026-09-05 23:21:16.802'),
(640, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'b5baceb35df01234323814f57817cf4d28eaab512e1c80c1152e0499b360e15e', 1, 0, NULL, '2026-09-12 23:21:20.599', '2026-09-05 23:21:20.600', '2026-09-05 23:21:26.529'),
(641, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'd3ef1709a035da13bf1b574fc52284f02df177caea75ee2f2f1999bb0bb76b45', 1, 0, NULL, '2026-09-12 23:21:28.551', '2026-09-05 23:21:28.552', '2026-09-05 23:21:36.771'),
(642, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'a8ce7ddc8e56938e15eb067d0219f436b706a1064c454a353247564098d113ef', 1, 0, NULL, '2026-09-12 23:21:40.508', '2026-09-05 23:21:40.509', '2026-09-05 23:21:46.508'),
(643, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', '8120f00a06f02417f071761b07b26e24c91c2def8b02c00979c8d6ec7ca45cf4', 1, 0, NULL, '2026-09-12 23:21:48.749', '2026-09-05 23:21:48.750', '2026-09-05 23:21:56.803'),
(644, 30, '7b9d1fa0-5e36-48f8-b9d1-de64325bf112', 'fa6f280356b3d0c550446cfa18929c05256c5a8056a996f5d99580fd00abe33f', 0, 1, 'LOGGED_OUT', '2026-09-12 23:22:00.650', '2026-09-05 23:22:00.650', '2026-09-06 00:21:30.061'),
(645, 30, '536f198e-e192-4d43-a84b-39f810d30ded', 'b9f08754232817d0a2c632235fd2bd7096f9cd4b433fef3880b729bfec2ce7f4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 23:48:29.003', '2026-09-05 23:48:29.005', '2026-09-06 00:27:55.754'),
(646, 30, '536f198e-e192-4d43-a84b-39f810d30ded', 'cea8ea132c1cd94c191d89db76bd74c237decddcc602f2e6c97a610dc5711050', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 23:53:01.348', '2026-09-05 23:53:01.349', '2026-09-06 00:27:55.754'),
(647, 30, '536f198e-e192-4d43-a84b-39f810d30ded', 'cbc6b23fc7f9217cfb4a41dffbf82d2f87c694f8a837ad322100142ff5fcd7f4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-12 23:57:11.521', '2026-09-05 23:57:11.522', '2026-09-06 00:27:55.754'),
(648, 30, '536f198e-e192-4d43-a84b-39f810d30ded', '8339bd95dffdfc75d51c521e9c3461cd7fddbb358829045dc14d5e75f8931f17', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 00:13:02.933', '2026-09-06 00:13:02.934', '2026-09-06 00:27:55.754'),
(649, 30, '536f198e-e192-4d43-a84b-39f810d30ded', 'd46eb3606404e02a7f98cd3bf4f11384b0b5ce6ff9c77494151e61864dbbc7b7', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 00:17:26.926', '2026-09-06 00:17:26.927', '2026-09-06 00:27:55.754'),
(650, 30, '536f198e-e192-4d43-a84b-39f810d30ded', 'a3ebb70a321be5904defa17ec5f3db8ba643c72e306183756faa320635954733', 1, 1, 'LOGGED_OUT', '2026-09-13 00:26:08.090', '2026-09-06 00:26:08.091', '2026-09-06 00:27:58.618'),
(651, 1, '71734853-83be-4fc8-b2e6-f66a9a09c26f', '4e293297c23ef4afe23205962fa99efe68c2fae25f4156624f1f9ff7730bb73d', 1, 0, NULL, '2026-09-13 00:26:48.859', '2026-09-06 00:26:48.860', '2026-09-06 01:05:55.980'),
(652, 30, '536f198e-e192-4d43-a84b-39f810d30ded', '8b9916d46c57eb52f42f5b7ae2899cea83bb9ff7734ddf302e0b9f660d626cea', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 00:27:55.416', '2026-09-06 00:27:55.417', '2026-09-06 00:27:55.754'),
(653, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', '8fb6d53fc52483f9c8da9cadb81a12ad9fb758226ad8d8d0c01e6ebca366e74d', 1, 0, NULL, '2026-09-13 00:28:20.477', '2026-09-06 00:28:20.478', '2026-09-06 00:30:18.173'),
(654, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', '194082c68f4c6269beda5d281ba14d53348d80b060df30328904e056cb3baef2', 1, 0, NULL, '2026-09-13 00:30:21.366', '2026-09-06 00:30:21.366', '2026-09-06 00:58:08.071'),
(655, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', '47631541ec760566d4c40013842a6a0a4755a19f5234bd8fe8e39297059bcfea', 1, 0, NULL, '2026-09-13 00:58:11.778', '2026-09-06 00:58:11.779', '2026-09-06 01:05:19.411'),
(656, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', '0cc1a4a37138ef9426ac45e63c6007b07acf3a8c5b6034e6ce5c13d30ed72629', 1, 0, NULL, '2026-09-13 01:05:23.126', '2026-09-06 01:05:23.127', '2026-09-06 01:07:50.342'),
(657, 1, '71734853-83be-4fc8-b2e6-f66a9a09c26f', 'acc75e83fb69be82c8e413fddabcde5e9b1d2cdb9cc6b4a2c92a4109ca7e905a', 0, 1, 'LOGGED_OUT', '2026-09-13 01:05:59.767', '2026-09-06 01:05:59.768', '2026-09-06 02:05:45.025'),
(658, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', '198d58cccd437c9135a5d3937bd4104857d06409866ac6816bf00f466046acf3', 1, 0, NULL, '2026-09-13 01:07:55.728', '2026-09-06 01:07:55.728', '2026-09-06 01:15:51.129'),
(659, 30, 'd3492124-e94d-48b5-8181-39965ba218cb', 'c2fc9a4c7033acc3d04f87c86a594253d416f253dd6ad8a6da48e0c5c6d94220', 0, 1, 'LOGGED_OUT', '2026-09-13 01:15:54.937', '2026-09-06 01:15:54.938', '2026-09-06 01:53:48.517'),
(660, 1, '77dc072a-7755-47ba-aee9-c41999caa0ee', '21c1488594448ba2d23e81981babf697ae6d30addf7b10dfce6b3c4c4ac232d2', 1, 0, NULL, '2026-09-13 01:54:10.346', '2026-09-06 01:54:10.346', '2026-09-06 02:32:56.335'),
(661, 1, '77dc072a-7755-47ba-aee9-c41999caa0ee', '89f256777283b5dd6e90bc93c0ad5bdbc15de7728a6d7338cc2d60cbda35368f', 0, 1, 'LOGGED_OUT', '2026-09-13 02:33:01.517', '2026-09-06 02:33:01.518', '2026-09-06 03:03:06.105'),
(662, 1, '7755ab66-2cf4-4c1a-8d81-4c1eab9b7d15', '6a8c4d79d26c9d08ba6f19b3e208faeb0e391aafdc5aeab6888479aba03b79c4', 1, 0, NULL, '2026-09-13 07:22:12.835', '2026-09-06 07:22:12.836', '2026-09-06 07:35:47.037'),
(663, 1, '7755ab66-2cf4-4c1a-8d81-4c1eab9b7d15', 'c78b5b8ed2a8ee587c68d57c93eb55c99193116dacb4a2e5c968c76f811592bc', 1, 0, NULL, '2026-09-13 07:35:50.710', '2026-09-06 07:35:50.711', '2026-09-06 07:36:52.128'),
(664, 1, '7755ab66-2cf4-4c1a-8d81-4c1eab9b7d15', 'b21c6bb95497c928a1e9febfe35ddf7d88964df3a2169561239fcca5421e1a4f', 0, 1, 'LOGGED_OUT', '2026-09-13 07:36:56.030', '2026-09-06 07:36:56.031', '2026-09-06 08:30:28.488'),
(665, 1, 'baec5f53-2f55-49ea-8da5-583222db06de', 'ce0a4789d6a18bb61a3a6da460335991ec1c2551d8c8c287c9ecd5e16c954aaf', 1, 0, NULL, '2026-09-13 08:35:01.527', '2026-09-06 08:35:01.528', '2026-09-06 08:37:02.764'),
(666, 1, 'baec5f53-2f55-49ea-8da5-583222db06de', '869cb083ec311086fd6e49919f11ba750251e55eafd6897ef7804740ff08a106', 1, 0, NULL, '2026-09-13 08:37:06.614', '2026-09-06 08:37:06.615', '2026-09-06 08:37:09.455'),
(667, 1, 'baec5f53-2f55-49ea-8da5-583222db06de', 'dc15b31db80f531c16bd1daca879e6f58a9a70e95ef5d39bbcb26073c43c19f5', 1, 0, NULL, '2026-09-13 08:37:13.223', '2026-09-06 08:37:13.224', '2026-09-06 08:38:31.113'),
(668, 1, 'baec5f53-2f55-49ea-8da5-583222db06de', '905fd9ea56c4790bd56e5a6c0e92c3f6340a4575470392f267c2a8656dd055de', 0, 1, 'LOGGED_OUT', '2026-09-13 08:38:34.981', '2026-09-06 08:38:34.981', '2026-09-06 09:27:17.214'),
(669, 1, 'cabc3e43-fa5a-450f-a24f-53a17834fb42', '54b2de22c4e61d07febc206ad1a954afd5906e2d73b3093fb41e8c244d92a8a7', 1, 0, NULL, '2026-09-13 12:00:44.268', '2026-09-06 12:00:44.269', '2026-09-10 10:02:01.157'),
(670, 31, '237d6235-ffe3-4aa8-a9f1-1343dc8c68fa', '3c3706813c25e07b9e7dd883995c94bc129bb1d4ba788c6867783fcba74e7705', 0, 1, 'LOGGED_OUT', '2026-09-13 12:22:06.020', '2026-09-06 12:22:06.021', '2026-09-06 12:23:47.417'),
(671, 31, '48e03a36-546e-459a-926b-e3dbe9555b6a', 'e58f1352787638faa265eb7ba663f469e747ee4ac9ea3dc6c58c85b0eeae5243', 0, 0, NULL, '2026-09-13 12:23:20.777', '2026-09-06 12:23:20.778', '2026-09-06 12:23:20.778'),
(672, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'afa81110d52fdd9078a124eff3c98718d69bcf8889d9a47f541aa442d7ddcb88', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:24:21.144', '2026-09-06 12:24:21.145', '2026-09-06 12:30:16.638'),
(673, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '6d5e99805739407f6549f84e72bf76e6b4ec8a5bbbe15a73fd16c29cd77c89d6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:25:20.069', '2026-09-06 12:25:20.070', '2026-09-06 12:30:16.638'),
(674, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '7355576e3a8aff83f3757c649009d5843d799e45bd60bd19694324e65909f773', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:25:33.053', '2026-09-06 12:25:33.054', '2026-09-06 12:30:16.638'),
(675, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '984d1a33b5548ca8f704f0812ff00b167e304e950ba0fbee04d90db4eac8f62a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:25:49.572', '2026-09-06 12:25:49.573', '2026-09-06 12:30:16.638'),
(676, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'be6680246c318164afd5e175749e5965dfd48ba1f3dab3afbf67a2a820eaa19d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:26:01.899', '2026-09-06 12:26:01.900', '2026-09-06 12:30:16.638'),
(677, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '459f080e863c24e142717c2e665f2eb8e9bc50303b2dd40df706df875d6669b6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:26:13.518', '2026-09-06 12:26:13.519', '2026-09-06 12:30:16.638'),
(678, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '2da2db5025f0c82b2c45e42eb2bb9ade6f6831a837de258f8b5933a9db7991d8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:26:29.512', '2026-09-06 12:26:29.513', '2026-09-06 12:30:16.638'),
(679, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '5b6611a7e30bee13804889cc8f53d4e11964655385236460bc008d51f0d6b860', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:26:41.410', '2026-09-06 12:26:41.410', '2026-09-06 12:30:16.638'),
(680, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '723ad491ae80aaf443b7d4d60087f508f0b64823c8285a5b90bd6f2ef18f9e49', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:26:52.321', '2026-09-06 12:26:52.322', '2026-09-06 12:30:16.638'),
(681, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '0219345d47e6e2f8d7ee6d43894ae4a9e3b549a171639304f627bde5d65da8d0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:02.933', '2026-09-06 12:27:02.934', '2026-09-06 12:30:16.638');
INSERT INTO `AuthSession` (`id`, `employee_id`, `family_token`, `refresh_token_hash`, `consumed`, `revoked`, `revocation_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(682, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '262535ed47758e0875a5645997ba935c4a26de81234741bb90f86e5ce8c88c23', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:10.445', '2026-09-06 12:27:10.446', '2026-09-06 12:30:16.638'),
(683, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '352506fa08170667134749d2a1e5c0ebe7eeaaac6d17655cd2f9cdb53ed5cadb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:22.685', '2026-09-06 12:27:22.686', '2026-09-06 12:30:16.638'),
(684, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '49f389c7a6d3ab42bd901f3a835c931f858c7115fea3c01b7366b35c9907a5da', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:30.709', '2026-09-06 12:27:30.709', '2026-09-06 12:30:16.638'),
(685, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '53dea917265dad4061da6141811840f2d13c79348557d5b647cf6a648f288912', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:40.942', '2026-09-06 12:27:40.943', '2026-09-06 12:30:16.638'),
(686, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'ceea741bca236882ac764784cc4beec6ed003ab2699d917fe0e8b725338c5e67', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:27:50.689', '2026-09-06 12:27:50.690', '2026-09-06 12:30:16.638'),
(687, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'd760d59d35f5b6c71e443b18f464daaae5142dc1866c8384fbc3d10229920146', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:02.523', '2026-09-06 12:28:02.524', '2026-09-06 12:30:16.638'),
(688, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '454db0f0b748659a40b25de879e5b340d3a5206703c3cb85a8fda1cccc801686', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:10.516', '2026-09-06 12:28:10.516', '2026-09-06 12:30:16.638'),
(689, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '60ec86c935c76fff6222fc8b19ba9b8a3bf70b6d2fbcf6e067ee524adf647776', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:22.365', '2026-09-06 12:28:22.366', '2026-09-06 12:30:16.638'),
(690, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'ca686089d251a2fd964ada7aacd1b60b5f97e90a77656ea7da30ed74fecf9b87', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:34.066', '2026-09-06 12:28:34.067', '2026-09-06 12:30:16.638'),
(691, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', 'd999d5d98de5630a7dba48efff50b8187108d3a76020cc44e7bafaae92259b1d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:47.494', '2026-09-06 12:28:47.495', '2026-09-06 12:30:16.638'),
(692, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '4b88b93528e424d7dead10578780cfa4a392a9bbe297186e4a415695a479189a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:28:59.429', '2026-09-06 12:28:59.430', '2026-09-06 12:30:16.638'),
(693, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '0afe0a2eaba13300f89408f4b1caf0e4a2b3c1fb1422c6b3a2982c6b485ee2a2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:29:11.263', '2026-09-06 12:29:11.264', '2026-09-06 12:30:16.638'),
(694, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '9078c5cf4fcd9f9b207c778f75d4f7aba57ee1a2f7da026d9704b7a36bf5da92', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:29:23.722', '2026-09-06 12:29:23.723', '2026-09-06 12:30:16.638'),
(695, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '20be21ef66fffe53b4a827f53131d29920a874aa58dbecf5214bcde48c343d3d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:29:39.585', '2026-09-06 12:29:39.586', '2026-09-06 12:30:16.638'),
(696, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '2ffae0f5228a3950ad9d8da184b2d9d2a180244c3c544ab32e40896e527e5c41', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:29:47.586', '2026-09-06 12:29:47.587', '2026-09-06 12:30:16.638'),
(697, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '5148f9d2f3637abb6e75e0e3e5946c65d9b7cbb6a70314e116be0d77a3dcdf47', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:29:59.566', '2026-09-06 12:29:59.567', '2026-09-06 12:30:16.638'),
(698, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '8dd8ed7120a541b8466dfdf37729ec5c23a71a6d52e94f959a60968056232cb5', 1, 1, 'LOGGED_OUT', '2026-09-13 12:30:07.762', '2026-09-06 12:30:07.763', '2026-09-06 12:30:18.252'),
(699, 31, '79cc5ea8-c7da-4870-851c-82055c05aedb', '8a56429ae523a903ebd1a827b7fb6c1e82b74078c90d32f316c65eae40516886', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-13 12:30:17.211', '2026-09-06 12:30:17.212', '2026-09-06 12:30:16.638'),
(700, 31, 'ee6b1fd5-3c3a-4914-ba82-9f40b9adf806', '1b47826c213d6f1db0667fefd1ae90a2144bd10b946bf0b34559341868ef2ab5', 1, 0, NULL, '2026-09-13 12:30:26.209', '2026-09-06 12:30:26.210', '2026-09-06 12:49:48.445'),
(701, 31, 'ee6b1fd5-3c3a-4914-ba82-9f40b9adf806', 'ff974f0ebf6a43e17793e5f6d0130f79c9bbb5e59ff86d0faba0803eacf4907f', 1, 0, NULL, '2026-09-13 12:49:52.169', '2026-09-06 12:49:52.170', '2026-09-06 12:49:59.901'),
(702, 31, 'ee6b1fd5-3c3a-4914-ba82-9f40b9adf806', 'c08ca1ee883a21c192adcfdc31568050f20c390f54e45cfe2a477349d20c0a9f', 1, 0, NULL, '2026-09-13 12:50:03.637', '2026-09-06 12:50:03.638', '2026-09-08 06:17:34.407'),
(703, 1, '9477df0c-eab4-4a48-8cf4-58e57a24b086', 'c1bda5157648eaed6c66346a9f1c198e3995bc2dd5de1d3615924805650730e3', 0, 1, 'LOGGED_OUT', '2026-09-13 16:12:16.352', '2026-09-06 16:12:16.353', '2026-09-06 16:42:25.903'),
(704, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '7e6f876037eb9da2838976b1568f27f72c97b044fbf27b54af1701f289f36eca', 1, 0, NULL, '2026-09-14 04:10:40.111', '2026-09-07 04:10:40.112', '2026-09-07 04:10:46.920'),
(705, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '29c7996874f676f4b6bafff71e20f70e968f23e19ff7b09d96a11e11887e40b1', 1, 0, NULL, '2026-09-14 04:10:50.028', '2026-09-07 04:10:50.029', '2026-09-08 16:41:45.179'),
(706, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', '4dbb13d8e0091a4d177d418a03ed3dab2288847acc20ce460bacf8d0101fafb0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:17:34.445', '2026-09-07 04:17:34.446', '2026-09-07 04:23:48.379'),
(707, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', 'd8970dec9139b2b3e2368f00e87e57b3e964513d8233c440b67c37512f711672', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:17:49.403', '2026-09-07 04:17:49.404', '2026-09-07 04:23:48.379'),
(708, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', '0c38d1c6c2d17bc755dbf0eaa17009f52b5aa693f26a23f5f14efb69885edc95', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:18:00.841', '2026-09-07 04:18:00.842', '2026-09-07 04:23:48.379'),
(709, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', 'a5246df0bb36563df20d21d6138e15abcf9bf947ae33b2d3464e59dfb0055600', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:18:12.240', '2026-09-07 04:18:12.241', '2026-09-07 04:23:48.379'),
(710, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', 'e4543bea390f8b5edc411c5865e8c0e08faa27c3c7de6e3716d9e1dca56276e3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:18:17.471', '2026-09-07 04:18:17.472', '2026-09-07 04:23:48.379'),
(711, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', '57b9b26817d509e77d11407fd62c1853edf52fe95ecf77e9dc392228d33d4486', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:18:27.761', '2026-09-07 04:18:27.761', '2026-09-07 04:23:48.379'),
(712, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', '979d96e8dd8e2ee9f2f5b47520b129849597cf353cad828c1797b783f6c15bea', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:18:58.048', '2026-09-07 04:18:58.048', '2026-09-07 04:23:48.379'),
(713, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', 'e25935f15f0e20ed967c398cfd1645d7cf515a0db723e406e050d4297c168051', 1, 1, 'LOGGED_OUT', '2026-09-14 04:19:10.058', '2026-09-07 04:19:10.059', '2026-09-07 04:23:50.737'),
(714, 2, '1dc7d5fc-5a4c-4ebb-8375-edd1ecc97aa3', '90ff1693e941afa075df52c39a76910e2455281d286d60f5b9479eac38d8bcc8', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:19:26.499', '2026-09-07 04:19:26.500', '2026-09-07 04:23:48.379'),
(715, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '176b60e89f54a23d01cf743868527abeaff850714acb6910d0b54c18b8c099d8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 04:24:02.010', '2026-09-07 04:24:02.011', '2026-09-07 05:06:35.315'),
(716, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '87e3052bd9141d3df5505f4f6bde7c018d2cc5a18fd7cbd490dba911480e876a', 1, 0, NULL, '2026-09-14 04:25:58.813', '2026-09-07 04:25:58.813', '2026-09-07 04:26:21.376'),
(717, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '59600ae9f23d05b599959f3e67f48ff4c2e91851a831632c76ba7d76cd8a2e13', 1, 0, NULL, '2026-09-14 04:26:23.625', '2026-09-07 04:26:23.625', '2026-09-07 04:26:49.969'),
(718, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '85deb85921df7c3edf639f030630d718b6626f1c8f913107bed9e5d685c79d61', 1, 0, NULL, '2026-09-14 04:26:53.750', '2026-09-07 04:26:53.751', '2026-09-07 04:32:48.836'),
(719, 1, 'cef6d02d-eb92-4cf2-9de9-1ef261ad4e22', '44fa5fab88895c1a64901a9dc4a82eda230424b2227ad5e87f5eb7d58a8b2123', 1, 0, NULL, '2026-09-14 04:27:22.714', '2026-09-07 04:27:22.715', '2026-09-07 05:09:58.799'),
(720, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '4aece4df6f983f78ba576433afb7e788401f4129ac68ad208dc76db9fe285837', 1, 0, NULL, '2026-09-14 04:32:52.571', '2026-09-07 04:32:52.572', '2026-09-07 04:33:02.464'),
(721, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', 'ff7220e99672d230c5a05c59ffa6f38b609537db1d2060cb3234812dd31eaa80', 1, 0, NULL, '2026-09-14 04:33:06.207', '2026-09-07 04:33:06.208', '2026-09-07 04:33:55.892'),
(722, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '4ffe964be70b5778a002885894a9a6cc00606eb191dfcd1cddae8b10aa19a176', 1, 0, NULL, '2026-09-14 04:33:59.460', '2026-09-07 04:33:59.461', '2026-09-07 04:59:05.348'),
(723, 1, '85b59309-c902-4351-8eb7-0583a4c88ccc', 'a1c9aeb33f95120f92f952690cdbc0d7640144c5ac7ad8125d7de1200cb21acf', 1, 0, NULL, '2026-09-14 04:51:59.954', '2026-09-07 04:51:59.955', '2026-09-07 05:07:03.192'),
(724, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '3ca3d4d6956c804f7d4575617ac957c54ad13f6f2ea08a211364668c38727939', 1, 0, NULL, '2026-09-14 04:59:09.152', '2026-09-07 04:59:09.153', '2026-09-07 05:10:23.226'),
(725, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '599c8a9112802cbfd0ade00106176d6427dd019d055d0ebec66c87a3347c7665', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:00.327', '2026-09-07 05:01:00.328', '2026-09-07 06:54:40.230'),
(726, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '4f83edc90169fc52f3e84a098acadb4002c867b4c99f34356157f13727701fa4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:11.511', '2026-09-07 05:01:11.512', '2026-09-07 06:54:40.230'),
(727, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', 'c683f4fc2b9a96a6329f42c5d88729cd97cb5c9912ba9a2016b217d38393a4ec', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:20.335', '2026-09-07 05:01:20.336', '2026-09-07 06:54:40.230'),
(728, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '0afbd1c69fbfd67d1d0e50ca4468fc0c91326d52ca09b0ead73923610673facb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:29.360', '2026-09-07 05:01:29.361', '2026-09-07 06:54:40.230'),
(729, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '67405db3ebb496276f80220e94e5d57fdfc546aad61eab49c81e64b1ae047e47', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:37.593', '2026-09-07 05:01:37.593', '2026-09-07 06:54:40.230'),
(730, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', 'db84e88b94262cb2dc0055ffaa693d7943ccbfda4cd27a616b154620c64d9109', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:01:51.674', '2026-09-07 05:01:51.675', '2026-09-07 05:06:35.315'),
(731, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '22ba199d119d29d0af2b24889944ab6e4c0f46308f97267a2a7d24c78457719d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:02:07.088', '2026-09-07 05:02:07.089', '2026-09-07 05:06:35.315'),
(732, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '4aa2af8b32034ce6312430854c6461a4ba6bea80d1a605458a015e8f8d7b2378', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:02:18.663', '2026-09-07 05:02:18.663', '2026-09-07 05:06:35.315'),
(733, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '32f410566cfa6276133b0e951a458daa0253c3684a4ea80198f906cb01ef4a20', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:02:30.017', '2026-09-07 05:02:30.018', '2026-09-07 05:06:35.315'),
(734, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '2532d0df239d92599ce9944b07589cd4c4272ffbb48fb9fc1e98e280d4fedac1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:02:49.253', '2026-09-07 05:02:49.254', '2026-09-07 05:06:35.315'),
(735, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '40c0fa1b46166c6d7974f0e4d2c4d6efa71fde264bfe2859593aa42f8c7c4b5b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:03:42.925', '2026-09-07 05:03:42.926', '2026-09-07 05:06:35.315'),
(736, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '23dc1de4c76aecdbf0d410b6ab3f235749d4655eee4b8f52f720d2a93fdbe702', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:03:56.682', '2026-09-07 05:03:56.683', '2026-09-07 05:06:35.315'),
(737, 4, 'b12b5f03-d779-4184-90c5-30038c2a453a', '412bd285fa54b02e52d8cd837e6a7a866f515587f017d892255087ccb59a999f', 1, 1, 'LOGGED_OUT', '2026-09-14 05:04:15.515', '2026-09-07 05:04:15.516', '2026-09-07 05:04:43.371'),
(738, 4, 'b12b5f03-d779-4184-90c5-30038c2a453a', 'a2ff46042e8983106b8ed1def2fe31ec9bc89b2b281fc8c4d11f29602d6f8d6e', 0, 0, NULL, '2026-09-14 05:04:44.926', '2026-09-07 05:04:44.927', '2026-09-07 05:04:44.927'),
(739, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '4d4ed1e2ec5af9fe82b7b9f9f1f39dd58c0a4e414989c3139a71ce02cf3aa70e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:05:17.489', '2026-09-07 05:05:17.490', '2026-09-08 06:48:15.980'),
(740, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'a422aa8b425111031e9756f542711dac6ab087099c25e07126e9828153e67817', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:05:49.379', '2026-09-07 05:05:49.380', '2026-09-08 06:48:15.980'),
(741, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '500fcee35a8653ddbd9dc5dc777aefbe7be4f2ea613f1d4ce82293184e91cd1c', 1, 1, 'LOGGED_OUT', '2026-09-14 05:06:08.776', '2026-09-07 05:06:08.777', '2026-09-07 05:07:26.269'),
(742, 2, '1af3d7b1-faf4-42e7-8a33-0d40204bd9b7', '646e26f0da7c6c6b3e6924481e74b29a4a7ed25f8250fc19cc5288413a9f2183', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:06:24.641', '2026-09-07 05:06:24.642', '2026-09-07 05:06:35.315'),
(743, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'ba0cfc84bb49eba65c2fd381b04261519aa0c29789daf67acc02fbaa8a0ef131', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:06:52.864', '2026-09-07 05:06:52.865', '2026-09-08 06:48:15.980'),
(744, 1, '85b59309-c902-4351-8eb7-0583a4c88ccc', '68299c3ba0c024a55f99614f4540aea15e02a9debc5d9e70cc71d65571eede4f', 0, 1, 'LOGGED_OUT', '2026-09-14 05:07:07.201', '2026-09-07 05:07:07.202', '2026-09-07 05:37:32.615'),
(745, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '3287910fa91a434a2a38e7894857c01b2d7b9547eae603ff10802f228206087d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:07:22.858', '2026-09-07 05:07:22.859', '2026-09-08 06:48:15.980'),
(746, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', '209787ff7739f1bfaec64620de53e7d6c71f085dabd69bbf1c8b94c03922c4b2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:07:32.260', '2026-09-07 05:07:32.261', '2026-09-08 04:28:29.311'),
(747, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'c08922b66763de88621bbfe625cd9f104936adfd9b09da6bdd111084ea94a067', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:07:34.948', '2026-09-07 05:07:34.949', '2026-09-08 06:48:15.980'),
(748, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'a632d4d87d56220e3e0ca55b3ca92e2a5d92b54c6dbf33bb9e696daaf766514c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:07:53.554', '2026-09-07 05:07:53.555', '2026-09-08 06:48:15.980'),
(749, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '98853657d89c989cafc0e5f13fa29c71249280dcfe5900397302641e97626dd2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:08.542', '2026-09-07 05:08:08.543', '2026-09-08 06:48:15.980'),
(750, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', 'ee0fa150d382e41ea9ed4499a14e33095e62134ae733b2c84b28ae86e400cf5b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:14.335', '2026-09-07 05:08:14.336', '2026-09-07 06:54:40.230'),
(751, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'b1a4110e4a5bce37608bf0cd8af778a859908e7035f261f23f41872d48f3e63a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:18.068', '2026-09-07 05:08:18.068', '2026-09-08 06:48:15.980'),
(752, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'a1c61c9dfcdd5c76a44bcc755beb66376484ec5c2e7e3288dda88661e1e4c9fb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:26.262', '2026-09-07 05:08:26.263', '2026-09-08 06:48:15.980'),
(753, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '4b5f70772857b0a38ce53d51c09b8405c8d3a8a2a39bef034fa904b037a0c604', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:38.835', '2026-09-07 05:08:38.836', '2026-09-08 06:48:15.980'),
(754, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '764074c1e7cb14be54a5702fccfc6daf7f899028acb4f3b71efc3acf553b5ea7', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:46.265', '2026-09-07 05:08:46.265', '2026-09-08 06:48:15.980'),
(755, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '9af2c4cb1052ef4ead2080e717b512757a2ed61114ae072f79698b35cf2d72fd', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:08:57.868', '2026-09-07 05:08:57.868', '2026-09-08 06:48:15.980'),
(756, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'fa36cd8616fdcb2acb831c69cc3bc98ed0f2e30aa5a111eaf6e76b61f427e076', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:09:10.359', '2026-09-07 05:09:10.360', '2026-09-08 06:48:15.980'),
(757, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '9f665a9672417a19b7b6a8fcb6d0575db151a125d64e38713c214873658d3672', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:09:10.465', '2026-09-07 05:09:10.466', '2026-09-07 06:54:40.230'),
(758, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '0ff89798035cb4744ad24441a41191687eaa08bb4bfeb5cef5419f51e805ef72', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:09:20.820', '2026-09-07 05:09:20.821', '2026-09-08 06:48:15.980'),
(759, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '33289e233270217eebe6a905dcd921303269689e14b50b246488b3b25db7764c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:09:35.516', '2026-09-07 05:09:35.517', '2026-09-07 06:54:40.230'),
(760, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '475ec0d5fe5ccae7bbbb489304194c092b5365d508e605244d212586f637a2e1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:09:35.551', '2026-09-07 05:09:35.552', '2026-09-08 06:48:15.980'),
(761, 1, 'cef6d02d-eb92-4cf2-9de9-1ef261ad4e22', '1ac3a76a194e4ebedca33bf9103d1c17f185cac4386ed3aa8faa62868763d7e3', 1, 0, NULL, '2026-09-14 05:10:01.062', '2026-09-07 05:10:01.063', '2026-09-07 05:12:18.219'),
(762, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '446f576852f22a28462d7d14cf2de54ae03446a80dce28728fb1ff8cfecb501b', 1, 0, NULL, '2026-09-14 05:10:27.124', '2026-09-07 05:10:27.125', '2026-09-07 05:45:53.615'),
(763, 1, 'cef6d02d-eb92-4cf2-9de9-1ef261ad4e22', '82b4a32a249f89f280dc544439e12a5d59f24afaf76f0e9ac61c916975681ba2', 1, 0, NULL, '2026-09-14 05:12:21.981', '2026-09-07 05:12:21.982', '2026-09-07 05:13:38.518'),
(764, 1, 'cef6d02d-eb92-4cf2-9de9-1ef261ad4e22', 'ad458334f9625a7d875653a64ecf8472e6e7e954589e10cf5e4329551022c657', 1, 0, NULL, '2026-09-14 05:13:42.332', '2026-09-07 05:13:42.333', '2026-09-07 05:14:26.676'),
(765, 1, 'cef6d02d-eb92-4cf2-9de9-1ef261ad4e22', '019d5b6b74436a7711a8b39d2dee370bfe10bbf024c27cc8c88ef267e0cfe99c', 0, 1, 'LOGGED_OUT', '2026-09-14 05:14:30.406', '2026-09-07 05:14:30.407', '2026-09-07 06:16:54.554'),
(766, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', 'aae4d7608ac2c447be7f60ba43cdaa43a8fc2ca5327f9efd57364e62dde3e440', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 05:21:23.977', '2026-09-07 05:21:23.978', '2026-09-08 04:28:29.311'),
(767, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '28c9ad890227e21f0faa9881f0f4093560514dd433293f30d4ecfa1b67f9e92a', 1, 0, NULL, '2026-09-14 05:45:56.935', '2026-09-07 05:45:56.935', '2026-09-07 06:18:32.113'),
(768, 1, '25c86ec7-6ea5-4422-bba6-ac0c52cd684b', '3bac707baa082de4ee14665ee29a87a8b2f016f79b5b17139d86ae278648de41', 0, 1, 'LOGGED_OUT', '2026-09-14 06:18:21.663', '2026-09-07 06:18:21.664', '2026-09-07 06:49:49.880'),
(769, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', 'ecbda902fbe630f9c065b0a5723a6ee69152e651ba44d7b94ab91281a46b8a24', 1, 0, NULL, '2026-09-14 06:18:35.156', '2026-09-07 06:18:35.157', '2026-09-07 08:13:04.919'),
(770, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', 'f5c35acafa9c09f60361153cf226839c8195d46fb06660728f36423b40f47316', 1, 1, 'LOGGED_OUT', '2026-09-14 06:54:27.026', '2026-09-07 06:54:27.027', '2026-09-07 06:54:46.703'),
(771, 3, '80e8a8df-f7cb-433c-9f08-38c65eb10376', '2a5254ee112866c61d303e14e5af47c3d2aca21249e5b6c27ea87122694504b0', 0, 0, NULL, '2026-09-14 06:54:41.501', '2026-09-07 06:54:41.502', '2026-09-07 06:54:41.502'),
(772, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '147b3df2cc982007731402902ed0f0f5d3995b1ab3288c4ca2341259be3c453e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 06:54:52.890', '2026-09-07 06:54:52.891', '2026-09-10 05:00:46.887'),
(773, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '9964c81c1025d21c9373974286ea71b6494cdab7b116f4c8ef8cecb328f3610c', 1, 0, NULL, '2026-09-14 08:13:08.642', '2026-09-07 08:13:08.643', '2026-09-08 05:16:11.774'),
(774, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '8b330f285c3e8fb0be72684abded0984e193e68106ee9c1629d59ef751a23e8b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:05:22.766', '2026-09-07 12:05:22.767', '2026-09-10 05:00:46.887'),
(775, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '08319471ed883cca4ccbf52bc17e8a159b1b5de4ef9617560c1c893422f58150', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:08:03.258', '2026-09-07 12:08:03.259', '2026-09-10 05:00:46.887'),
(776, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '98dbd61eda6bfba1882a3e4409aefa826d606c9184dd19d0f4082f470decc91b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:11:48.342', '2026-09-07 12:11:48.343', '2026-09-10 05:00:46.887'),
(777, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '9dc7cc81d131462aae81af7c3dc03a349fe3aed6eadef10eff0c1ac3212f199a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:12:50.998', '2026-09-07 12:12:50.999', '2026-09-08 06:48:15.980'),
(778, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', 'c01e78a60b0414988d6a37160b948fe1f84b488e199c2365186b09feb70215ba', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:18:01.353', '2026-09-07 12:18:01.354', '2026-09-08 04:28:29.311'),
(779, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'e5bd1720b1130dba7200f1c5bef3c568be6d9609a1ca3af5e95f7ba61b283ce2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:30:23.760', '2026-09-07 12:30:23.761', '2026-09-08 06:48:15.980'),
(780, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '17120dd8659496282d7641e6d27b3f2763141f04b3a0729804365c48105d9bc1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:30:34.516', '2026-09-07 12:30:34.516', '2026-09-08 06:48:15.980'),
(781, 6, 'c67d2da4-671c-4bfe-9ac0-01d80ab8e45e', '03a90cc92a3ba8e07e2c4934c5b07ad8fee5d92c3f83c304d2bb020a0ed680ef', 0, 1, 'LOGGED_OUT', '2026-09-14 12:33:32.948', '2026-09-07 12:33:32.949', '2026-09-07 12:34:52.388'),
(782, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '7d099c7bb7a045e477ef68bb0fd474bc3674487092a97cde96d110118204bfd0', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-14 12:33:40.155', '2026-09-07 12:33:40.156', '2026-09-10 05:00:46.887'),
(783, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', '8fa9ede5a1da7b1b6e090062e2a6ef111de847cb89f8d5642227cbf397cf22ea', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:27:07.289', '2026-09-08 04:27:07.290', '2026-09-08 04:28:29.311'),
(784, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', 'c948565061f29e4ccf3be941b74352aaad95a1ac5bcb9c8ddbab587b23c86ac3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:27:20.527', '2026-09-08 04:27:20.528', '2026-09-08 04:28:29.311'),
(785, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', '99005915e56e4ef8bced612533a5207f77e38c095bbd2d14b2488867b8d5378e', 1, 1, 'LOGGED_OUT', '2026-09-15 04:27:31.162', '2026-09-08 04:27:31.163', '2026-09-08 12:08:28.179'),
(786, 2, '88180197-b694-427c-969e-2d6f6ee01bd8', '8f09e650f6789ba39628236fb818fb389e60621449e96b4ac50c0ceb919fe223', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:27:42.871', '2026-09-08 04:27:42.872', '2026-09-08 04:28:29.311'),
(787, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '1b840cc86879c702a3515434265d3e2dc999d8c3b69d9b62faca88a1a6b23d91', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:34:58.556', '2026-09-08 04:34:58.556', '2026-09-08 06:48:15.980'),
(788, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '9de1cc8bcad571240d47152c4d1959c4e40871e931c37d34087f96bf90155447', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:35:09.318', '2026-09-08 04:35:09.319', '2026-09-08 06:48:15.980'),
(789, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '47417f709c8bd1dcc7fc312d51bcdbea5151e7cbcaa6eaed0518f07afe14e42b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:41:39.507', '2026-09-08 04:41:39.507', '2026-09-08 06:48:15.980'),
(790, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '5660ab76cd616c1ce00ae18424b72ec6190a446d0fe9108b61b8ed58dea8d659', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:41:55.439', '2026-09-08 04:41:55.440', '2026-09-08 06:48:15.980'),
(791, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '9bc100629d0f6cc6ff585e14f703a7be633b4cf158c1f137776e3068157f608d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:42:05.459', '2026-09-08 04:42:05.460', '2026-09-08 06:48:15.980'),
(792, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '974bd712990e65b1cea316216c7ef8aaecd93ff7c4c4557a3af212b8118f28f7', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:42:13.344', '2026-09-08 04:42:13.345', '2026-09-08 06:48:15.980'),
(793, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'b0ff8b6e535bd397e5924e28d5e7813ec412b3c0a11d7ea1f23acea38034f15c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:42:25.121', '2026-09-08 04:42:25.122', '2026-09-08 06:48:15.980'),
(794, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'fd3ee6225f391e1cf3bba82f8cc7cea87e7a9c45d18db9b3a23311522f63dd33', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:42:36.134', '2026-09-08 04:42:36.135', '2026-09-08 06:48:15.980'),
(795, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'fe3fd577e3b448e0737eccbb454b4f8eb2b8e25b6b4b8fc6875d31b0e160a0a6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:42:48.010', '2026-09-08 04:42:48.011', '2026-09-08 06:48:15.980'),
(796, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '3a5d4fa4b93098010956f39b32f864bab400861c44f7b2b3912b4d4d5bd5c4b9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:43:00.327', '2026-09-08 04:43:00.328', '2026-09-08 06:48:15.980'),
(797, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '40e2123b6189d87e848557c20903a404d12f504dfa7153443ebeb83eebe4fb4e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:43:15.178', '2026-09-08 04:43:15.179', '2026-09-08 06:48:15.980'),
(798, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '172b16278d231b1547667d6c0527e2e68fc3e6111b8e3ef5f8060524b7879289', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 04:53:48.023', '2026-09-08 04:53:48.024', '2026-09-10 05:00:46.887'),
(799, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '94274b0c080bb0e6657f27ce0bb56c9f6ed7adca582c9381704597202ce19a18', 1, 0, NULL, '2026-09-15 05:16:14.797', '2026-09-08 05:16:14.798', '2026-09-08 06:29:11.798'),
(800, 31, 'ee6b1fd5-3c3a-4914-ba82-9f40b9adf806', '5ddd64c3a6f34d7977428ae95a1dcebd03a4e0a0cf5441d2f9abea6cb59d5fd4', 0, 0, NULL, '2026-09-15 06:17:37.492', '2026-09-08 06:17:37.494', '2026-09-08 06:17:37.494'),
(801, 1, 'f8f58522-0b5e-49eb-a7c6-9045a9c6c5de', 'a0afddd4e97fcdb0f381907d0292325e378ca156d199fdcc7d3c42304b36e02e', 1, 0, NULL, '2026-09-15 06:23:08.142', '2026-09-08 06:23:08.143', '2026-09-08 06:28:08.446'),
(802, 1, 'f8f58522-0b5e-49eb-a7c6-9045a9c6c5de', 'b754cf7bcf620757186bc0c2a1a75315a999fb4ad092b200200381317170e2c1', 0, 1, 'LOGGED_OUT', '2026-09-15 06:28:12.115', '2026-09-08 06:28:12.116', '2026-09-08 07:02:38.367'),
(803, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', '8d653f7880dd541eb7848b858f7707bd0ad95583f79a9f27d62c8eb8e8a1ca1a', 1, 0, NULL, '2026-09-15 06:29:15.478', '2026-09-08 06:29:15.479', '2026-09-08 09:55:26.981'),
(804, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '26c590af20c6b43687d1a22f63e2682748e8a48697fd5c0af891eb64b2137910', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:42:49.058', '2026-09-08 06:42:49.059', '2026-09-10 05:00:46.887'),
(805, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'd627c87cae7eb2f05793938dd3729d8c2e22a6cde1b5fc6829b1132ca85f44fb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:43:10.336', '2026-09-08 06:43:10.337', '2026-09-08 06:48:15.980'),
(806, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '803878becb107ffeab8a6532d805243d43ba5d1cc93b030a261ef472ef39d919', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:43:22.822', '2026-09-08 06:43:22.823', '2026-09-08 06:48:15.980'),
(807, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'c53c87f594cb188974c9be53117c529ea4a857518188cdabda6799daae0d6a72', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:43:33.461', '2026-09-08 06:43:33.462', '2026-09-08 06:48:15.980'),
(808, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '89fc3c2d1cfb50f59cb8081526ea68bcc72e5993911f6eff80cdd54910e3abcc', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:43:41.752', '2026-09-08 06:43:41.753', '2026-09-08 06:48:15.980'),
(809, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '23ebeec1579585d57929262ed7b0acb797315474b5660c0c9bd790a5ff5366ef', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:43:53.794', '2026-09-08 06:43:53.795', '2026-09-08 06:48:15.980'),
(810, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '38ba92e3a87abf66eae893d14d32cc13be591fdc8ee897965b4a00415846aa7c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:44:06.892', '2026-09-08 06:44:06.892', '2026-09-08 06:48:15.980'),
(811, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '696092130aad462d00cf0b2128aea53e925f157afaee113a2dc9a738c89a9132', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:44:17.923', '2026-09-08 06:44:17.924', '2026-09-08 06:48:15.980'),
(812, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', '0db048d299ee2738dfdf6d2021298e9d59a9a93fa55255e12b56168d21f21b5d', 1, 1, 'LOGGED_OUT', '2026-09-15 06:44:29.223', '2026-09-08 06:44:29.224', '2026-09-08 06:48:18.321'),
(813, 4, '2610b4d6-adb4-4e11-b2a7-fc27399f3573', 'f520fefa42547cc5977eb8e0c63fdc6e05f0eef947fc618992419f5588047140', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:44:38.559', '2026-09-08 06:44:38.560', '2026-09-08 06:48:15.980'),
(814, 4, 'b63c2e5f-acb5-4a07-a22a-399e63708baf', '2dd26785fc19cdf709da730a8ab724a9517a307cc8b5c3224308587072ded126', 1, 1, 'LOGGED_OUT', '2026-09-15 06:48:51.319', '2026-09-08 06:48:51.326', '2026-09-08 10:54:24.753'),
(815, 4, 'b63c2e5f-acb5-4a07-a22a-399e63708baf', 'a73a710dea3b43307b677f2c536a6b05d814dd2cfaf0c08db03e26c5e5add077', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 06:50:08.391', '2026-09-08 06:50:08.391', '2026-09-08 10:54:22.359'),
(816, 1, 'dff040f8-1b21-49d4-aff8-c2b426c4679f', 'e9cb14d4d4c981bd92d040dbdacfb190aaedcdcafe5e64deba66de5e6e2249c6', 1, 0, NULL, '2026-09-15 08:06:49.082', '2026-09-08 08:06:49.083', '2026-09-08 08:18:58.776'),
(817, 1, 'dff040f8-1b21-49d4-aff8-c2b426c4679f', '264f02207deb91bc4a30a9d0b9f203a0539b3893faa3e2a645e9a45cda7b7ec5', 0, 1, 'LOGGED_OUT', '2026-09-15 08:19:02.727', '2026-09-08 08:19:02.728', '2026-09-08 08:19:06.822'),
(818, 1, '41833b50-a537-464a-b91b-a5bf7c462063', '44c6ccbd38baacebda0663cbd1dc5a03540fcc05130d4470a533efafce0fad5b', 1, 0, NULL, '2026-09-15 08:21:59.024', '2026-09-08 08:21:59.025', '2026-09-08 08:39:38.904'),
(819, 1, '41833b50-a537-464a-b91b-a5bf7c462063', '28614b3df60bc2704b931832d66e0fe7a614ca6ee3a253a644e801cd5b4c6ce9', 1, 0, NULL, '2026-09-15 08:39:42.815', '2026-09-08 08:39:42.815', '2026-09-08 08:39:57.230'),
(820, 1, '41833b50-a537-464a-b91b-a5bf7c462063', '96fbec5e7e39ef47f36ab674138999fbf7d0837c4e3bc94d2b45e86ab82fe65a', 0, 0, NULL, '2026-09-15 08:39:59.311', '2026-09-08 08:39:59.312', '2026-09-08 08:39:59.312'),
(821, 1, '45f5cfd8-7732-41cc-90ff-214160d3814a', '609c5dac3abd7321415254effe5c2053b38decd261bfd72dc433a09629dc85ca', 0, 0, NULL, '2026-09-15 09:45:04.049', '2026-09-08 09:45:04.051', '2026-09-08 09:45:04.051'),
(822, 1, '3082268d-22b4-4f8f-9081-5fbadcc55ef0', 'b0cee20d69ea507536006ba3637544bda622c591f99920da4ba62323db9c3276', 0, 1, 'LOGGED_OUT', '2026-09-15 09:55:30.763', '2026-09-08 09:55:30.764', '2026-09-08 11:12:09.706'),
(823, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '30cc496ea63b05b84b8a860d686ece740513a3a8da5fac0a58ae071d84307b1d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 10:50:40.543', '2026-09-08 10:50:40.544', '2026-09-10 05:00:46.887'),
(824, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '40d129c31aa6bdaec457e846fa548af0a5128c3b8a984396f9322cd7151f5251', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 10:51:55.366', '2026-09-08 10:51:55.367', '2026-09-10 05:00:46.887'),
(825, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '3db60cf06c09da30bd0a789ce8f6c87914336a65effbf0be196d4b0348025ba5', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 10:54:54.931', '2026-09-08 10:54:54.932', '2026-09-08 12:34:52.228'),
(826, 1, '60be834e-361c-4cf0-9329-06cd0ad0ee30', '6e32b57e63e2d54a91dd823c47c3935d529899a17e4c18eb5471e9159179e17e', 1, 0, NULL, '2026-09-15 11:12:17.145', '2026-09-08 11:12:17.146', '2026-09-08 11:17:40.232'),
(827, 1, '60be834e-361c-4cf0-9329-06cd0ad0ee30', 'aced5b538edefca969b9b8cec45fa73aacedb96d95a50cd37e17d3c9df3f56da', 1, 0, NULL, '2026-09-15 11:17:44.033', '2026-09-08 11:17:44.034', '2026-09-08 11:18:57.483'),
(828, 1, '60be834e-361c-4cf0-9329-06cd0ad0ee30', '8edf72d19fcc84d7c25b2aea1bfa3dc6cbe4d38a1c64f0f3d2f22952f69590b1', 0, 1, 'LOGGED_OUT', '2026-09-15 11:19:01.266', '2026-09-08 11:19:01.267', '2026-09-08 11:25:52.314'),
(829, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', 'd4add3305792dbf28e93798b701d713b7e0ed121c9fb29d60980c5dc22efb6cf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:08:36.741', '2026-09-08 12:08:36.742', '2026-09-09 12:26:50.425'),
(830, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'acf0361b3a236e755096e1e219571e06421b7c05ac805f50ed55b8ab52c3d34d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:14:39.693', '2026-09-08 12:14:39.694', '2026-09-10 05:00:46.887'),
(831, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '6206a16dfca6e9f648def49d0de72272a6982c7c9065cb15ad6f69f488778fe9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:15:35.750', '2026-09-08 12:15:35.751', '2026-09-10 05:00:46.887'),
(832, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', 'a9dd34dfdc11eb429c3a689589f2b7e5dfa2e77edd10e3ddcefe9108a8dd8b32', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:19:38.068', '2026-09-08 12:19:38.069', '2026-09-09 12:26:50.425'),
(833, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'c5ade598cb00b5803715d7e86902cb29cd961f4c122a2eaf21b3f5067c367704', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:28:21.177', '2026-09-08 12:28:21.178', '2026-09-10 05:00:46.887'),
(834, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '99a1f3b78298f83b70f42c20e90af94456ec58c3fdb823e22341bd9cc341e642', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:28:39.426', '2026-09-08 12:28:39.427', '2026-09-08 12:34:52.228'),
(835, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', 'ad906af3e11ee5b29d0873a82a3d6f2e208532289bf83f896ad3a508152cb6bf', 1, 0, NULL, '2026-09-15 12:29:45.454', '2026-09-08 12:29:45.455', '2026-09-09 12:05:53.791'),
(836, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', 'ade7c652bc4739c854be5e7d6131c026fd29c6aad924eabd61a3f90c94cdbc2c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:30:22.462', '2026-09-08 12:30:22.463', '2026-09-09 12:26:50.425'),
(837, 1, '0b3eaabf-e1be-4a33-94df-1dc71368880d', 'b3da95286640914654b204a256eb0d2ca85f3f34a0f9c5417a5c4429b3ce9468', 1, 0, NULL, '2026-09-15 12:32:31.727', '2026-09-08 12:32:31.728', '2026-09-08 13:02:41.715'),
(838, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '8fd15d23795eef2ff8012da7f9fa30dff5ff0ff0a390ac851677b8e3f40d9440', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:32:58.987', '2026-09-08 12:32:58.988', '2026-09-08 12:34:52.228'),
(839, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', 'b1d086da350b39e1ba7df30be7e12b4b952069a6756e78460269239b66e9bf1c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:33:14.367', '2026-09-08 12:33:14.368', '2026-09-08 12:34:52.228'),
(840, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '913976d023fef4c64c0ff235b3ac7d42af1f8fbe577c915e93caeb0bc58367c2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:33:24.926', '2026-09-08 12:33:24.927', '2026-09-08 12:34:52.228'),
(841, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '42b235965c246dbe577d44690875472cffacefdf6ebf83ef436ebf4113b6e073', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:33:32.470', '2026-09-08 12:33:32.471', '2026-09-08 12:34:52.228'),
(842, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', 'e5ce647a71256a2df3fadcfd7e2241ba9ef6579dabd7edefde3ce337ffef0956', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:33:40.209', '2026-09-08 12:33:40.209', '2026-09-08 12:34:52.228'),
(843, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '94d9810ddcdcab3e8fa7973d5efc3e785230b22dfe34fb366497bafdb6062944', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:33:50.299', '2026-09-08 12:33:50.300', '2026-09-08 12:34:52.228'),
(844, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '56e8c56b5351489853ba600369892c8e98fc85b0ce4c787f89c6c71dc4dcfdea', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:34:02.236', '2026-09-08 12:34:02.237', '2026-09-08 12:34:52.228'),
(845, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', 'ebc53cb2e98b909bce794007255eb742a552efc20fd8093bbb5a510239122b7b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:34:12.771', '2026-09-08 12:34:12.772', '2026-09-08 12:34:52.228'),
(846, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', 'a93350c4a6708c339c777cc1488e2ffe2fcf70bc1e32352f9fca8c9fb6b28baa', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:34:22.157', '2026-09-08 12:34:22.158', '2026-09-08 12:34:52.228'),
(847, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '84169c1f02284b8ac83a8e2585edfca8c82b16ba0fd1a43858feaae2bf1f7c12', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:34:32.329', '2026-09-08 12:34:32.330', '2026-09-08 12:34:52.228'),
(848, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '1152617db1f0d182fa8dc0804760bb5396d2f83ef91b40007679c8f041609e9b', 1, 1, 'LOGGED_OUT', '2026-09-15 12:34:45.050', '2026-09-08 12:34:45.051', '2026-09-08 12:34:54.519'),
(849, 4, '66955407-ba57-496b-8abb-8b19f7cc5fbf', '805b9c3cebfa2c07a390a758dde32834a1e020cb52c4926ea761ab88d3a9654e', 0, 0, NULL, '2026-09-15 12:34:52.775', '2026-09-08 12:34:52.776', '2026-09-08 12:34:52.776'),
(850, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', 'fedf8a1b14167f8b00aa1c67ba11edd0585d98ebbb87ab8904e78c99741eae2b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:35:24.911', '2026-09-08 12:35:24.912', '2026-09-10 04:25:21.489'),
(851, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '5aa1cba92dfdafa86c21f9c8009eeacb9f4d9bfdfa5e82bb2465715f95ef1252', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-15 12:35:39.195', '2026-09-08 12:35:39.196', '2026-09-10 05:00:46.887'),
(852, 1, '024d15b8-6572-4d68-b9db-5d49bddef88e', 'c6907a7ffc06674715950321ba44fb6e9557d16d6151c5f820c4373ca4d36858', 1, 0, NULL, '2026-09-15 12:56:03.084', '2026-09-08 12:56:03.085', '2026-09-08 13:03:03.346'),
(853, 1, '0b3eaabf-e1be-4a33-94df-1dc71368880d', '59823701fe5ceaadd1b6f971a6904c6eb4a705bc0f1cba96f86a36a581c06d9f', 0, 1, 'LOGGED_OUT', '2026-09-15 13:02:45.580', '2026-09-08 13:02:45.581', '2026-09-08 13:33:42.856'),
(854, 1, '024d15b8-6572-4d68-b9db-5d49bddef88e', 'dfc5a2def3be262a5c147d9efce0f7f773f991a380621269dd5274989f307cae', 1, 0, NULL, '2026-09-15 13:03:07.460', '2026-09-08 13:03:07.461', '2026-09-09 03:50:52.471'),
(855, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '92d068030ae299168a8d29aa040b5aa728bb9652c8a019872e05a9d4a44b8265', 1, 0, NULL, '2026-09-15 16:41:48.772', '2026-09-08 16:41:48.773', '2026-09-08 16:42:07.786'),
(856, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '9991acc72ed9582471ac97bf0f7d4cc544e537075a7fbec5f47ee8216d1a6932', 1, 0, NULL, '2026-09-15 16:42:11.749', '2026-09-08 16:42:11.749', '2026-09-08 16:42:22.937'),
(857, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', '385d0bbe5582a026065cc8ae20c8f060904a49dc9a3b5a1e4c48bc893cb9a386', 1, 0, NULL, '2026-09-15 16:42:25.932', '2026-09-08 16:42:25.933', '2026-09-08 18:13:53.590'),
(858, 7, 'e4d9d432-1441-4ad4-84de-8b3bd0f74980', 'defce88c96f8631ed0a735efeaa7ed14255d39b239aa1a5ec26481e80a498794', 0, 0, NULL, '2026-09-15 18:13:56.644', '2026-09-08 18:13:56.645', '2026-09-08 18:13:56.645'),
(859, 1, '024d15b8-6572-4d68-b9db-5d49bddef88e', 'c740bed9c7db238e1c322b8a41d7fe20d4c95a2e0afb8c9e1e6453b45dbf7732', 0, 1, 'LOGGED_OUT', '2026-09-16 03:50:56.171', '2026-09-09 03:50:56.172', '2026-09-09 05:45:11.830'),
(860, 1, '427a0ae1-233b-46a5-b60c-996c23dc61ee', '7529ee05d75c2daae32201a4b8a64f99ec1fbf5d713f7b00047854bba59a3c27', 0, 0, NULL, '2026-09-16 03:54:54.328', '2026-09-09 03:54:54.329', '2026-09-09 03:54:54.329'),
(861, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '1fc88a98d1710cfaedc169a5b4fd85cb848b439649cd3d7cfc8bc63672f6bf94', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:09:31.323', '2026-09-09 04:09:31.324', '2026-09-09 12:26:50.425'),
(862, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '4c7624b93f1013fda2e4154b39bd3265790cf9f23d3112bbfbbba9ff8ea6736d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:09:45.232', '2026-09-09 04:09:45.233', '2026-09-09 12:26:50.425'),
(863, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', 'd36ba8add55fdde7c95fbc4b1427571c0d56813271b6fef72d347daf6f29fbd2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:09:54.400', '2026-09-09 04:09:54.402', '2026-09-09 12:26:50.425'),
(864, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', 'd5158ceb3ab3b343f112f73fae131ea61059f8a5f3b7025e250784a36483d49c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:10:06.503', '2026-09-09 04:10:06.504', '2026-09-09 12:26:50.425'),
(865, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '48a35eae7e9a309a61fdd7d8e9e464e4633bfe3c8cf38aa60fcad9c15c50ffed', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:10:17.990', '2026-09-09 04:10:17.991', '2026-09-09 12:26:50.425'),
(866, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '85000f31cb440392fb04a3e5c7353e4d25468db9491798ffdbe9c902c82431bb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:10:30.516', '2026-09-09 04:10:30.517', '2026-09-09 12:26:50.425'),
(867, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '583e32fd238457e0ba86da4891b250e27d583cf8dd678af368e7b3a53eaba0f6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:10:42.421', '2026-09-09 04:10:42.422', '2026-09-09 12:26:50.425'),
(868, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '68885c3577e6896812daf6e2a0857a9bb5ebaadce025e27699761bf414867a12', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:10:54.608', '2026-09-09 04:10:54.609', '2026-09-09 12:26:50.425'),
(869, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '70bdb88bf6d1ea01ddbd82901e141fd7c00adc99c1ba140fadff13f925900f37', 1, 1, 'LOGGED_OUT', '2026-09-16 04:11:29.699', '2026-09-09 04:11:29.700', '2026-09-09 12:26:52.813'),
(870, 2, '9443ce99-dbbd-4614-97d0-278adab3580f', '997498705baf1b9f46e95a13cb86b602d7ca4b94ba1833b77418ea263883de91', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:12:14.731', '2026-09-09 04:12:14.732', '2026-09-09 12:26:50.425'),
(871, 1, 'a7b03571-b35b-4b41-9b3f-636183da1df1', 'c75388a90923904c22dd3ea8c015f56a57cd3d1b9892ae67ae8763648150a7da', 0, 0, NULL, '2026-09-16 04:25:52.527', '2026-09-09 04:25:52.528', '2026-09-09 04:25:52.528'),
(872, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '33cf207ff4267e3cf4de646a42427d2d8bfbad212a6bf94a1d6dae17670062b2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:42:07.621', '2026-09-09 04:42:07.622', '2026-09-10 04:25:21.489'),
(873, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '4eab5413abbe9ddcbe4f3ba4892a2d1dcf440fb3263b48acf2e441d6a688a355', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:42:23.411', '2026-09-09 04:42:23.412', '2026-09-10 04:25:21.489'),
(874, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '99cf3547e3c092d999428afb426c04539c5ac3f5117b412c5fcd88fd9e5c658f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 04:50:26.829', '2026-09-09 04:50:26.830', '2026-09-10 05:00:46.887'),
(875, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', '182bb9a5af7db6a49e2b382cf1eb8b58458ba79d8769e5b62cfae52aa5b74458', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 05:45:17.403', '2026-09-09 05:45:17.404', '2026-09-09 18:47:25.350'),
(876, 1, '4b791265-33a8-4047-8df1-05bec716f2e8', '2aa1b8e3186b5dc3de89a18eeef1a230124ce974d6035194d49dc1415c76dfc6', 1, 0, NULL, '2026-09-16 07:02:41.804', '2026-09-09 07:02:41.805', '2026-09-09 07:10:08.242'),
(877, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', 'a5404513912997d58240fa54d06e4e25e19955cf9ae6fbeab8f6b26fcf5652e4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 07:03:48.986', '2026-09-09 07:03:48.987', '2026-09-09 18:47:25.350'),
(878, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', '08e2b41accecab3698e29428922067ffd46d8316ec4a3e01803a4ba025c0bfa8', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 07:07:06.168', '2026-09-09 07:07:06.169', '2026-09-09 18:47:25.350'),
(879, 1, '4b791265-33a8-4047-8df1-05bec716f2e8', '86a8558b82199e275485b1c36975beaf7ada1b8c559fd955685d7f9527064c82', 1, 0, NULL, '2026-09-16 07:10:12.026', '2026-09-09 07:10:12.027', '2026-09-09 07:11:23.079'),
(880, 1, '4b791265-33a8-4047-8df1-05bec716f2e8', 'bd93ce6e54332d9a62a918010502460ca91570043dd3bb78c9d8ea035d8eeab1', 0, 1, 'LOGGED_OUT', '2026-09-16 07:11:26.807', '2026-09-09 07:11:26.808', '2026-09-09 07:50:37.714'),
(881, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', '7f4de95a12951c01b33b72f34ed3c82a003d474204f8c814d726a514fa1e5625', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 08:40:25.813', '2026-09-09 08:40:25.814', '2026-09-09 18:47:25.350'),
(882, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'eb5c3ee55511e5ce63d9ad92f3368ad2fe4d58368aee6b6b8a83356f8365739d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 10:00:46.244', '2026-09-09 10:00:46.245', '2026-09-10 05:00:46.887'),
(883, 1, '1fa4a481-f40c-403f-b9a6-2afd9a3fccc9', 'e50cac70aa1662b2d3a5bf05e19cf58f03104c5652df5e9ccc4bb618f0641835', 0, 1, 'LOGGED_OUT', '2026-09-16 10:22:26.451', '2026-09-09 10:22:26.452', '2026-09-09 11:15:58.317'),
(884, 7, '1a8f36be-d2e9-4f8e-8b3a-4c68219d43dc', 'af0443b64b62c4b528c66c2d0cd82125b46fd1b1ebb35e445fd8f435b457ab9d', 1, 0, NULL, '2026-09-16 10:26:57.520', '2026-09-09 10:26:57.521', '2026-09-09 12:21:11.458'),
(885, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', 'f13e6df161e942bab9ea4e1b2aedabf416ae64f09221916504a1f08a77cf627d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 10:50:45.000', '2026-09-09 10:50:45.001', '2026-09-09 18:47:25.350'),
(886, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', '3a3b3f3a3fc9ccfb6ec161b8c037c6c3cec8b236897416c7904d5a4efeb7e3d5', 1, 0, NULL, '2026-09-16 12:05:57.694', '2026-09-09 12:05:57.695', '2026-09-10 05:47:30.913'),
(887, 7, '1a8f36be-d2e9-4f8e-8b3a-4c68219d43dc', 'c6c5b6b723912f6332e270349a242c886765fc232a814f320f683291075cade5', 0, 0, NULL, '2026-09-16 12:21:15.275', '2026-09-09 12:21:15.276', '2026-09-09 12:21:15.276'),
(888, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', '4f7cc80d873848f35580c613b8466469450e2ac996e1369c8bcf81dcdc2b2c1e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:21:31.686', '2026-09-09 12:21:31.687', '2026-09-09 18:47:25.350'),
(889, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'd5d46754c162568653a666cb37b4269c6a8bc666bc775c5e155a4ab375e717f4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:25:16.146', '2026-09-09 12:25:16.147', '2026-09-10 05:00:46.887'),
(890, 2, '68c71dff-a232-4a59-a676-f3e9c5ca7aa4', 'd73f287210a9a3b369f07157571ae7052be1f7b62c18701044932f01bc95b71f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:27:03.704', '2026-09-09 12:27:03.705', '2026-09-09 12:31:01.449'),
(891, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '2070448ef50129efe15e9e1e51ecd87fa137c9d0931f535ab4b1711dd48a7cd4', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:28:30.856', '2026-09-09 12:28:30.857', '2026-09-10 04:25:21.489'),
(892, 1, '52d7992e-fc41-48c4-bc3d-7403f8701359', '6e51eda8d6aed0c5f1fb5eb4dffa2943e25d62d5a7cf1d5b00d218b33089897f', 1, 0, NULL, '2026-09-16 12:29:59.155', '2026-09-09 12:29:59.156', '2026-09-09 12:30:30.798'),
(893, 2, '68c71dff-a232-4a59-a676-f3e9c5ca7aa4', 'c7fa04fbc17cca9e5ce7edc7d1366363a962655ee4eab985b75992f08915dc51', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:30:11.846', '2026-09-09 12:30:11.846', '2026-09-09 12:31:01.449'),
(894, 2, '68c71dff-a232-4a59-a676-f3e9c5ca7aa4', '3815ff6fa705384634f4c4ca5d4841fb2c346738492937d329de82045ad91c0e', 1, 1, 'LOGGED_OUT', '2026-09-16 12:30:23.152', '2026-09-09 12:30:23.153', '2026-09-09 12:31:03.902'),
(895, 1, '52d7992e-fc41-48c4-bc3d-7403f8701359', '723e2cf5242263fe213328b67b39134c5ac71056892410e828c684c8c96ac6f8', 1, 0, NULL, '2026-09-16 12:30:34.308', '2026-09-09 12:30:34.309', '2026-09-09 12:31:54.381'),
(896, 2, '68c71dff-a232-4a59-a676-f3e9c5ca7aa4', 'f1e38d71d05058f0c4cbea5e9d596a2eb5285db4aa9fff12bf1facb2a4e407eb', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 12:30:34.901', '2026-09-09 12:30:34.902', '2026-09-09 12:31:01.449'),
(897, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', '11a17214f0596c938e560717e8db458bc347385e27f8efbb72b050152416a2d1', 1, 1, 'LOGGED_OUT', '2026-09-16 12:31:06.961', '2026-09-09 12:31:06.962', '2026-09-09 18:47:28.802'),
(898, 2, '9f4471f0-a140-49b3-8a3e-86ed709b4965', 'c5b54614330af1ba3a5ff50e0031f49b31e8a0c31683924bc21cb8ef391a40b3', 0, 0, NULL, '2026-09-16 12:31:16.575', '2026-09-09 12:31:16.576', '2026-09-09 12:31:16.576'),
(899, 1, '52d7992e-fc41-48c4-bc3d-7403f8701359', '90f4130a99d0bdb1413c401fe32b40b06ee809a8d6efd669553c6df46c5b720f', 0, 1, 'LOGGED_OUT', '2026-09-16 12:31:57.972', '2026-09-09 12:31:57.973', '2026-09-09 13:02:13.813'),
(900, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '529cb75dc6cd4c93e7d7134af3939c005330ef71806ecd130c6e51706e1c3a91', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 15:08:21.415', '2026-09-09 15:08:21.416', '2026-09-10 05:00:46.887');
INSERT INTO `AuthSession` (`id`, `employee_id`, `family_token`, `refresh_token_hash`, `consumed`, `revoked`, `revocation_reason`, `expires_at`, `created_at`, `updated_at`) VALUES
(901, 1, 'c3e98b6d-4115-4911-81c4-cf7ed0358659', 'dce644a2e79f1ec00c23215fb9a14ef336b7cb50b52f2b0e9e2f9db66e9e23f7', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-16 18:47:24.511', '2026-09-09 18:47:24.512', '2026-09-09 18:47:25.350'),
(902, 2, '92a099ff-78cb-4e82-b4e6-bea600b1471e', '3a411842a1af5f71bde339248db10034e0f34a7e6a0282c5cf77acbf86a1ab4c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:21:54.292', '2026-09-10 04:21:54.293', '2026-09-10 12:05:36.393'),
(903, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '5bb729cb785f3e706b26f9544bd5473ec394c0e06d38b6d8b82cf58bed6827d5', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:22:40.329', '2026-09-10 04:22:40.329', '2026-09-10 04:25:21.489'),
(904, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', 'cbc73f25f49175325f42289bbdce458dac813d2fd05fd1a342a1d4a467a1906d', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:22:57.554', '2026-09-10 04:22:57.554', '2026-09-10 04:25:21.489'),
(905, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', 'da000a1e3090f4a451be0e8c4dddd27fbdecf06f6e28a25cf9b002f6d4fedee2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:23:12.350', '2026-09-10 04:23:12.351', '2026-09-10 04:25:21.489'),
(906, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '0de8ebff8adf17d88348dc4bb52d4eba9c601370edb534df07115ff6711fe4a2', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:23:24.055', '2026-09-10 04:23:24.056', '2026-09-10 04:25:21.489'),
(907, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '27ff2f244ff646e8cbe80a9dc810a5929feaf2c87489cc7eabaec8037984074b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:23:35.068', '2026-09-10 04:23:35.069', '2026-09-10 04:25:21.489'),
(908, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '5859748fde8355ba61523c973a65bccde84adb44d524f8ccd32f680a3d3f4792', 1, 1, 'LOGGED_OUT', '2026-09-17 04:23:47.174', '2026-09-10 04:23:47.175', '2026-09-10 04:25:23.824'),
(909, 4, 'a7b591c7-d7fc-4cfb-b845-eb692c754a7c', '2115ee33aa557ba3b87ab0a14b31484cc424710393d2e02ae883e1a4aa030b7b', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:24:03.707', '2026-09-10 04:24:03.708', '2026-09-10 04:25:21.489'),
(910, 4, 'c9145892-915b-423f-84a3-c69480809607', 'ab279a3c7e1099f6848d69e26f9b1aff0870dc3b3713ff5593fe438ed5d4a794', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:25:50.893', '2026-09-10 04:25:50.894', '2026-09-10 12:30:33.784'),
(911, 4, 'c9145892-915b-423f-84a3-c69480809607', '718f2cba187a95039a3e8845b987d8ce57fbc1833b9e50c83ceb0e444135f1e7', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:30:54.787', '2026-09-10 04:30:54.788', '2026-09-10 12:30:33.784'),
(912, 4, 'c9145892-915b-423f-84a3-c69480809607', '06fb41f2c9632728febcd3c8c0c9862e86f130af163c3078ef628b992320e797', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:31:58.980', '2026-09-10 04:31:58.981', '2026-09-10 12:30:33.784'),
(913, 4, 'c9145892-915b-423f-84a3-c69480809607', 'e388a231c9a2cf673356ab104f42cacbe3eb581f15d14272c2afae70862acae3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:32:10.478', '2026-09-10 04:32:10.479', '2026-09-10 12:30:33.784'),
(914, 4, 'c9145892-915b-423f-84a3-c69480809607', 'f83b7c105fd5401549f57d486c60f5b7debfb77db58ffdc9290eaf826e80390f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:32:20.293', '2026-09-10 04:32:20.294', '2026-09-10 12:30:33.784'),
(915, 1, '065656ea-1868-435f-9d0a-2ff82c17b645', '3aa0bfe634e57db4580e0da192f7cdae16ae9fbfba82e08515a510418cd411e9', 0, 1, 'LOGGED_OUT', '2026-09-17 04:39:12.343', '2026-09-10 04:39:12.344', '2026-09-10 05:27:54.269'),
(916, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'fee0257f29ecce51085077e8c643c88e4e267538aba38f282036321080d59a30', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:53:31.532', '2026-09-10 04:53:31.533', '2026-09-10 05:00:46.887'),
(917, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', 'dec55be4db38651c75c6412c450149030c2157ba7f1043153ccdddf26166f59f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:53:45.629', '2026-09-10 04:53:45.630', '2026-09-10 05:00:46.887'),
(918, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '29d6a5c0207caafa99e94c748299972d7c2429766e30f825a93f128a649353fb', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:53:57.437', '2026-09-10 04:53:57.438', '2026-09-10 05:00:46.887'),
(919, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '761d27243e1b0fd368e8a1e936250427ac498dd3efa57a8b1dc736b558b84132', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:54:08.738', '2026-09-10 04:54:08.738', '2026-09-10 05:00:46.887'),
(920, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '679487d404661df34649c80d273715e9bf1dcc670b6fd3d715ad169d649e28c6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:54:17.722', '2026-09-10 04:54:17.723', '2026-09-10 05:00:46.887'),
(921, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '93b963c19ea3a486c963371d1a264e2135f8795beb13ebd5f21dac065d477d92', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:54:29.347', '2026-09-10 04:54:29.347', '2026-09-10 05:00:46.887'),
(922, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '3fc3688eef5fc8be13c19e3d3eecfce359974cd0916a93ac0ecb8baa372fd93d', 1, 1, 'LOGGED_OUT', '2026-09-17 04:54:48.454', '2026-09-10 04:54:48.454', '2026-09-10 10:28:58.235'),
(923, 3, 'dfcb9a4e-a7fc-4cf9-b861-f3d0b709a7e5', '6e2dfcb1b9fa7e4a867c816c730601083e2cd1d7e68c2736cd9222b67720606d', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 04:56:03.525', '2026-09-10 04:56:03.526', '2026-09-10 05:00:46.887'),
(924, 1, '2be20702-dace-4e7b-8e2e-835324cd654e', 'c0c6948a76a6f69fc2ebee7e383e36dffb9f93c891703ef7c86f95b601101f6e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 05:30:51.035', '2026-09-10 05:30:51.036', '2026-09-10 09:58:30.906'),
(925, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', '5096d636712feeefc4aea55f0a96e5d502f71927aacc1499733569a603aa877b', 1, 0, NULL, '2026-09-17 05:47:34.651', '2026-09-10 05:47:34.652', '2026-09-10 12:24:16.798'),
(926, 1, 'fd7fcd2d-a6a2-4ba7-82e3-4eb124b6e832', '03b855bffad183e7a61976ec2f36c0478e2176880f387662d09068994edbca98', 1, 0, NULL, '2026-09-17 05:49:20.137', '2026-09-10 05:49:20.138', '2026-09-10 06:14:00.886'),
(927, 1, '2be20702-dace-4e7b-8e2e-835324cd654e', '88b9db998e6a8f55bf155da9ed6fdea2193495f2e175ac38889bdbf884484dcf', 1, 1, 'LOGGED_OUT', '2026-09-17 05:50:33.810', '2026-09-10 05:50:33.811', '2026-09-10 09:58:33.812'),
(928, 1, 'fd7fcd2d-a6a2-4ba7-82e3-4eb124b6e832', '26814349285b9743585df604d8fcdc172df4d946b922679d97712548612b0890', 0, 0, NULL, '2026-09-17 06:14:04.695', '2026-09-10 06:14:04.696', '2026-09-10 06:14:04.696'),
(929, 1, 'faa88669-b9fe-43cd-9e75-a60393a1dd14', 'b855aeb7bf7834a4f2d42923d5c1e82539e624d5fed3d966ee9da899c6348af1', 0, 1, 'LOGGED_OUT', '2026-09-17 06:19:14.814', '2026-09-10 06:19:14.815', '2026-09-10 06:24:20.244'),
(930, 4, 'c9145892-915b-423f-84a3-c69480809607', '2e2c9f9d012db4659439695175efd186766cdc7b3c7d997fae27ccfd006e8aab', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 06:59:39.958', '2026-09-10 06:59:39.959', '2026-09-10 12:30:33.784'),
(931, 4, 'c9145892-915b-423f-84a3-c69480809607', '8e80c07a7bce6be9194977c84fadcfa8a202128d379fbe5cf076b9a332a0bb3f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 06:59:51.139', '2026-09-10 06:59:51.139', '2026-09-10 12:30:33.784'),
(932, 4, 'c9145892-915b-423f-84a3-c69480809607', '82f596f526a5a9e1f6535fc7f35415c89f43e3e1f288d882458576cc75b1d073', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 06:59:58.556', '2026-09-10 06:59:58.556', '2026-09-10 12:30:33.784'),
(933, 4, 'c9145892-915b-423f-84a3-c69480809607', '23801b95d2b7a6739b1bd7179b51e0994251f70e02ceff3226bc38df4850fa6b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:00:06.908', '2026-09-10 07:00:06.909', '2026-09-10 12:30:33.784'),
(934, 4, 'c9145892-915b-423f-84a3-c69480809607', '2a448056e6948e241b10b5c0b5d1fc69a7f33bed766d785198f76360f945500c', 1, 1, 'LOGGED_OUT', '2026-09-17 07:00:18.684', '2026-09-10 07:00:18.685', '2026-09-10 12:30:36.055'),
(935, 4, 'c9145892-915b-423f-84a3-c69480809607', 'd9dbe166186ffa44450bd94f12e40f41ea5e06f9b008b5ad5fe1afec8c3cdfb4', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:00:29.873', '2026-09-10 07:00:29.874', '2026-09-10 12:30:33.784'),
(936, 17, '70e620da-34b6-4922-99e0-598c6f81def4', 'a3fbfbb2eb9da5b8b98f8a18c0e4eb49e848ddcd2047eb67b9d466897236cf5a', 0, 1, 'LOGGED_OUT', '2026-09-17 07:22:44.256', '2026-09-10 07:22:44.257', '2026-09-10 07:22:46.400'),
(937, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '84a946a5ac591ad9761a092dc72fae7122ef0ce2e436ce5bcdc2f78c819b8f23', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:23:01.439', '2026-09-10 07:23:01.441', '2026-09-10 07:25:54.739'),
(938, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '457634f4520e9225ad7803ec41e38fd4b23da1e0eb2daf0eaf6ef7332db9d427', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:23:38.337', '2026-09-10 07:23:38.338', '2026-09-10 07:25:54.739'),
(939, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '62531d4ad179cbcaef6e74cf1c9ab0b3587b30285909b3e462dd1350757644c3', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:23:47.461', '2026-09-10 07:23:47.461', '2026-09-10 07:25:54.739'),
(940, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '6fc8a84945e19fd84e5d87619618f985e11a1668453be7010e5138d84d93181e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:23:55.962', '2026-09-10 07:23:55.963', '2026-09-10 07:25:54.739'),
(941, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', 'e70bb0c96d7824c8bf17bdee706c412de5d78b9f958447e768b358762524c50c', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:24:05.545', '2026-09-10 07:24:05.545', '2026-09-10 07:25:54.739'),
(942, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', 'afbee4d7fa99b668bbff84bab2db4dabdd00ae7e4f182bf4a07f318c60e2bb84', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:24:17.503', '2026-09-10 07:24:17.504', '2026-09-10 07:25:54.739'),
(943, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '87d4f886fa29019e83cbd56aa5c90d48371d1215c220e52ce9cbeb177e77d013', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:24:26.726', '2026-09-10 07:24:26.727', '2026-09-10 07:25:54.739'),
(944, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', 'd2976c1a3a1f4145b98d137023078e65603885b9e47caba640e84962edee343e', 1, 1, 'LOGGED_OUT', '2026-09-17 07:25:42.739', '2026-09-10 07:25:42.740', '2026-09-10 07:25:56.879'),
(945, 17, 'd8b97a79-67bb-4d1f-b180-d6bf9b14cdb6', '5e43f0231b6076fdd070aed9075c8051ed1a5876a2ebec489d9333c9f476031a', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 07:25:51.968', '2026-09-10 07:25:51.969', '2026-09-10 07:25:54.739'),
(946, 1, '2be20702-dace-4e7b-8e2e-835324cd654e', '7b6446d472b7b8c01583d81bd7e75a5cac2e50e63081904b120706522f358837', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 09:57:33.043', '2026-09-10 09:57:33.044', '2026-09-10 09:58:30.906'),
(947, 1, 'cabc3e43-fa5a-450f-a24f-53a17834fb42', '05036559f681db03897e6d1471730b7e9ccf2592fdffba169e641e9308bbaff2', 0, 0, NULL, '2026-09-17 10:02:05.003', '2026-09-10 10:02:05.004', '2026-09-10 10:02:05.004'),
(948, 3, '057d68dc-4bcc-4ea8-896c-edd40df52113', 'ed87fd4ad8e4e65505fedc0c9f2e749d5cfd585e21bf98c46b5657acbe723119', 1, 0, NULL, '2026-09-17 10:29:19.137', '2026-09-10 10:29:19.138', '2026-09-10 12:01:14.773'),
(949, 2, '92a099ff-78cb-4e82-b4e6-bea600b1471e', '3e6cee1bffd5a2d2490785972414e1551e08cd8cf6d6221517e638c27ce76dcf', 1, 1, 'LOGGED_OUT', '2026-09-17 11:17:46.595', '2026-09-10 11:17:46.596', '2026-09-10 12:05:38.852'),
(950, 2, '92a099ff-78cb-4e82-b4e6-bea600b1471e', '9eeffaa2f03ae28b1f0c7ae9a1610243bb6ac12c2ddfcb530292ec32b5bec328', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 11:30:07.807', '2026-09-10 11:30:07.808', '2026-09-10 12:05:36.393'),
(951, 1, '580111a2-addc-45a9-88f5-04d70e7f7b70', '06763856c2bdf1faf3e8d668aa6a6cfcdb99a7beab1d85685914339cedfb62bf', 1, 0, NULL, '2026-09-17 11:57:42.964', '2026-09-10 11:57:42.965', '2026-09-10 12:37:07.282'),
(952, 3, '057d68dc-4bcc-4ea8-896c-edd40df52113', '65ea1bf6dfd19191214a0a9bce0d49623c457034b951858ec8f72f2573a060f7', 1, 0, NULL, '2026-09-17 12:01:18.523', '2026-09-10 12:01:18.524', '2026-09-10 12:06:18.198'),
(953, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '7d11f89504e8397542e0f7caa5d538fdb59a57df00425c676e2b85497847cc0f', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:05:50.750', '2026-09-10 12:05:50.751', '2026-09-10 12:31:27.360'),
(954, 3, '057d68dc-4bcc-4ea8-896c-edd40df52113', '24fb2611d169d751921edf7419a8e391ac9a400598408d8da93037b1615ab461', 1, 0, NULL, '2026-09-17 12:06:21.885', '2026-09-10 12:06:21.885', '2026-09-10 12:30:19.256'),
(955, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '800ca5d44652922766ef48926ef829d3722f5eb9e9c54f1b5a80d0daaebdf9b9', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:12:40.273', '2026-09-10 12:12:40.274', '2026-09-10 12:31:27.360'),
(956, 6, 'a7b73789-9196-465a-b2f2-ea4692f1003f', '9f3eb2ae35b93b6ed1ee1800fec9fc402a049b6d6168598931396ab36e75abb9', 0, 0, NULL, '2026-09-17 12:13:44.880', '2026-09-10 12:13:44.880', '2026-09-10 12:13:44.880'),
(957, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'ee539baa3fe83ae9f6cc9e9550fcf21c72138cceaf2f6ae0b0df419f5f942094', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:14:09.454', '2026-09-10 12:14:09.455', '2026-09-10 12:31:27.360'),
(958, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', '29a73bda9a1d71c03dba940311ab70cb6d957679a8f2eceb1a02ab2f328eb8d1', 1, 0, NULL, '2026-09-17 12:24:20.612', '2026-09-10 12:24:20.613', '2026-09-10 13:09:22.024'),
(959, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'a2ffedb23eff80f1108e67eb7ed60ac72edc473c1d85435697cbb49d6907dd5a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:28:23.263', '2026-09-10 12:28:23.264', '2026-09-10 12:31:27.360'),
(960, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'eb5f091cfe7a377ea9c05db6e8eb4409143eab93ea482eb44e95705cefb4bba1', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:28:36.827', '2026-09-10 12:28:36.828', '2026-09-10 12:31:27.360'),
(961, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'faabea10f4cbe340015fc5a86418839fa4d0034e8b1cbe457540e168d0543f43', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:28:49.479', '2026-09-10 12:28:49.480', '2026-09-10 12:31:27.360'),
(962, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '962951f337786a939ec16f5bc1a57dd7199b7483a61a7aa668def291d89a5461', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:29:06.738', '2026-09-10 12:29:06.739', '2026-09-10 12:31:27.360'),
(963, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '74ed08b828477693a640ab7cac6df61f372f977bd580b4931ce8b0e7648cc486', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:29:18.815', '2026-09-10 12:29:18.816', '2026-09-10 12:31:27.360'),
(964, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'ea40cd97b7ae70c2813de9e14b65f64007ab31101c36773726abd79b59e42275', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:29:31.685', '2026-09-10 12:29:31.686', '2026-09-10 12:31:27.360'),
(965, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'e8f2f4cf8c03a5f68eea140170357f3c892515f703dd6d7ee3707b03b06784ac', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:10.384', '2026-09-10 12:30:10.385', '2026-09-10 12:31:27.360'),
(966, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '29c0132fb59d4067d9231d45df6ed209be4f226da1fedb6d7760e27eb38409a7', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:18.295', '2026-09-10 12:30:18.296', '2026-09-10 12:31:27.360'),
(967, 3, '057d68dc-4bcc-4ea8-896c-edd40df52113', '981048bd146879224efaca6baa326dd9d2b52efcd90083e1837b4d02a561c808', 1, 0, NULL, '2026-09-17 12:30:21.244', '2026-09-10 12:30:21.244', '2026-09-11 04:49:25.462'),
(968, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '85e663ee6e8a2bf3d6917103b637c2ebd6e63e043f8a9825633c80bfea9d366e', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:29.218', '2026-09-10 12:30:29.219', '2026-09-10 12:31:27.360'),
(969, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'b02e178bec8b24c374fb031e262d37f6993814cbc5a4e13649fc624d3dd3b754', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:39.624', '2026-09-10 12:30:39.625', '2026-09-10 12:31:27.360'),
(970, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'b5dcdaef7ab45adb9c574e5727ab1405debd317272c465e3ed860eff39e0c6cf', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:47.584', '2026-09-10 12:30:47.585', '2026-09-10 12:31:27.360'),
(971, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '8d32240e7d3afc5c840c3a337e8fe1b40ca8ce8ff9c829b7366ec99d55e12792', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:30:55.564', '2026-09-10 12:30:55.565', '2026-09-10 12:31:27.360'),
(972, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'b33bd7760c81478e139e92e26b907cff117a147b55c3256bc0eb4b3eef0ff3c7', 1, 0, NULL, '2026-09-17 12:31:04.359', '2026-09-10 12:31:04.360', '2026-09-11 04:45:25.819'),
(973, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'ac476c14990ca512684a051c51145e45b5a6d1d802f4da719e5c8c17b2c39676', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-17 12:31:05.515', '2026-09-10 12:31:05.516', '2026-09-10 12:31:27.360'),
(974, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', '528963de847837b7cb167d33b2257e04fb0f5f23d780d7e05cacf7c0e996d88c', 1, 1, 'LOGGED_OUT', '2026-09-17 12:31:18.322', '2026-09-10 12:31:18.323', '2026-09-11 04:10:20.237'),
(975, 2, 'a7d84385-d4a4-4da8-aa24-26f9e4035e90', 'f3db86427308a65471d59ef9fa8c8bdf064ee340e70937ee83296e0b969ffd4e', 0, 0, NULL, '2026-09-17 12:31:29.661', '2026-09-10 12:31:29.662', '2026-09-10 12:31:29.662'),
(976, 1, '580111a2-addc-45a9-88f5-04d70e7f7b70', '4146bb3095764b0cb64cf7a4bcdc3a4faf14954e3bfd55eabf2d1e254e475e7b', 0, 0, NULL, '2026-09-17 12:37:11.116', '2026-09-10 12:37:11.117', '2026-09-10 12:37:11.117'),
(977, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', 'b10e9915769d464de304eb809f47033ff03253e852c932207d7f8eceb971ced6', 1, 0, NULL, '2026-09-17 13:09:24.956', '2026-09-10 13:09:24.957', '2026-09-10 13:09:29.742'),
(978, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', '3da09ff40dd77ca8f6bad592218aa57aac91e03f7858a98616209446136df570', 1, 0, NULL, '2026-09-17 13:09:31.303', '2026-09-10 13:09:31.304', '2026-09-10 13:24:43.569'),
(979, 6, 'a690b88f-129b-4248-b3a7-1a7ee6847052', 'bebeee5e59170dbe29d29900e33b9531df6497287a2525e3c2266c0aded61513', 0, 0, NULL, '2026-09-17 13:24:46.627', '2026-09-10 13:24:46.628', '2026-09-10 13:24:46.628'),
(980, 2, '3f06b94f-2b38-4511-a035-56b05815a873', '3335e9a9ec4c4bbb038904c7cea258371c297abbe85b7f5d43611a973a33ca13', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:10:26.360', '2026-09-11 04:10:26.361', '2026-09-11 04:16:06.851'),
(981, 2, '3f06b94f-2b38-4511-a035-56b05815a873', 'b230d1cbf415e1bd75639997229f74cd0c6eeab088b7dac88b2475af7fa85de5', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:15:25.460', '2026-09-11 04:15:25.461', '2026-09-11 04:16:06.851'),
(982, 2, '3f06b94f-2b38-4511-a035-56b05815a873', '7e32b8fa91c24e2721eb4351d458a39a4bc354aa24171c23f8759db7ccf3fa7a', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:15:36.585', '2026-09-11 04:15:36.586', '2026-09-11 04:16:06.851'),
(983, 2, '3f06b94f-2b38-4511-a035-56b05815a873', '8ef24e233d0794f4268c4f0d990bd94d17b976f7fc941828bf85428a28d6d9db', 1, 1, 'LOGGED_OUT', '2026-09-18 04:15:48.283', '2026-09-11 04:15:48.284', '2026-09-11 04:16:09.289'),
(984, 2, '3f06b94f-2b38-4511-a035-56b05815a873', '2631354bde5697ecb89e7dea7ce3fcc05bb6cf696449995509e739100fc82417', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:16:04.986', '2026-09-11 04:16:04.987', '2026-09-11 04:16:06.851'),
(985, 1, 'db493777-7b72-4353-8a16-c2021e4f13cf', '664603b5706554b939eb545e0228110e8b61d20a07954b85b03524e56e08733b', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:17:30.091', '2026-09-11 04:17:30.092', '2026-09-11 07:28:57.443'),
(986, 1, '1661e5e9-3b1b-4ab7-a976-e234c80c00ec', '4aecfec1f75f5318a9ac98ce28718c32f155760f5e07837655609725a632d758', 0, 1, 'LOGGED_OUT', '2026-09-18 04:22:59.619', '2026-09-11 04:22:59.619', '2026-09-11 05:52:54.853'),
(987, 1, 'db493777-7b72-4353-8a16-c2021e4f13cf', '8e7a48dbe6874bae0debc4d73541472ce67adad513a5aeb47d642f90d5dcd6a6', 1, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 04:23:32.962', '2026-09-11 04:23:32.962', '2026-09-11 07:28:57.443'),
(988, 1, 'db493777-7b72-4353-8a16-c2021e4f13cf', 'cc66f5a856a7faefb21831d31905f525fab46a318fb0ba39eaf5ffdf4f486d22', 1, 1, 'LOGGED_OUT', '2026-09-18 04:23:55.497', '2026-09-11 04:23:55.498', '2026-09-11 07:28:59.836'),
(989, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '998f2b53e7c257ad076b2e29a9f8fc80aed385867a6f0bd291d5e9fb5d7fa80c', 1, 0, NULL, '2026-09-18 04:45:29.638', '2026-09-11 04:45:29.639', '2026-09-11 04:45:40.207'),
(990, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '372db80152ee14f72dfe109cfdbaa3724ec1c751d438960d29e9d92a26cf9427', 1, 0, NULL, '2026-09-18 04:45:43.824', '2026-09-11 04:45:43.825', '2026-09-11 04:45:50.674'),
(991, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '2e6c8806899107f7a24ba0c456ff2fd63c7b1318c0f7391de9b6c19d6696f47f', 1, 0, NULL, '2026-09-18 04:45:54.672', '2026-09-11 04:45:54.673', '2026-09-11 04:46:00.358'),
(992, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'bfd998f26c15312d69f46753aeffd90cb00fa291feca0c31734bb9e5313bcf64', 1, 0, NULL, '2026-09-18 04:46:02.355', '2026-09-11 04:46:02.356', '2026-09-11 04:46:09.446'),
(993, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'cb22b53b8d6ae9a0bf03a7bf73fbe8e136c13a40956d63f7a62aff98c2abe01a', 1, 0, NULL, '2026-09-18 04:46:13.316', '2026-09-11 04:46:13.317', '2026-09-11 04:46:20.686'),
(994, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'b1e31234f46802515477549f69694ce10e3767b8dbdbdb5865e5d7c4fa6bc6e0', 1, 0, NULL, '2026-09-18 04:46:24.459', '2026-09-11 04:46:24.460', '2026-09-11 06:32:06.499'),
(995, 3, '057d68dc-4bcc-4ea8-896c-edd40df52113', '2fdb4ccb8a94c66c3871fc6a3509aebd66f2c4b79839814a8d4ff6774605cb1c', 0, 0, NULL, '2026-09-18 04:49:29.085', '2026-09-11 04:49:29.086', '2026-09-11 04:49:29.086'),
(996, 1, 'fcc81dc7-cf8f-4581-985c-a12d6deef7e1', '1590fb5e607fc0cd57dbb09d3d5c34794fb8ef1752deb431cc71b1cbb5c23c2f', 0, 1, 'LOGGED_OUT', '2026-09-18 05:58:40.432', '2026-09-11 05:58:40.433', '2026-09-11 06:28:50.753'),
(997, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '31c7e16e8a2f0ec3f067cc5f7efaae9081807fbc573dbecea13d1bea0264d9e6', 1, 0, NULL, '2026-09-18 06:32:10.383', '2026-09-11 06:32:10.384', '2026-09-11 06:32:22.759'),
(998, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '06295cbbd0de781ddde8264bd2b3b7cd8ba2b91afecc9c15be45ffb7112427d4', 1, 0, NULL, '2026-09-18 06:32:26.724', '2026-09-11 06:32:26.725', '2026-09-11 06:32:39.179'),
(999, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'e2e77b46fc0103616c9ad5d71feb8f0e50b9030eb2f2327b7091a44803a977e2', 1, 0, NULL, '2026-09-18 06:32:43.016', '2026-09-11 06:32:43.017', '2026-09-11 06:32:51.338'),
(1000, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'aa3bfc9e46318d4dd017c72dbddee53a0811e5ca685af01ccd6330b3d306233d', 1, 0, NULL, '2026-09-18 06:32:55.113', '2026-09-11 06:32:55.114', '2026-09-11 06:33:02.200'),
(1001, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '4d05238eeb603410165768e73db9bbbe9c6672b7b0c4eed4a813e4e84f275e58', 1, 0, NULL, '2026-09-18 06:33:05.988', '2026-09-11 06:33:05.989', '2026-09-11 06:33:09.909'),
(1002, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', '1f425608d294166ee43c9f61d374fad196108ab40280639fc3ee62d9e94454f3', 1, 0, NULL, '2026-09-18 06:33:13.664', '2026-09-11 06:33:13.665', '2026-09-11 06:33:21.956'),
(1003, 4, '591c2abe-015e-47c9-ba2b-cf3023e5ecf1', 'ceeadd20f46b0e56c93b528dd9c3840027c9b6789fa27c42db0265c7145824ce', 0, 0, NULL, '2026-09-18 06:33:25.743', '2026-09-11 06:33:25.744', '2026-09-11 06:33:25.744'),
(1004, 1, 'ac11e34f-42e1-4a98-bf76-1bc909cba97d', '6cd5723c837a8ea299dc735a1547b345ca3cd8da444092a137f6b4fb685670af', 0, 1, 'LOGGED_OUT', '2026-09-18 06:41:44.280', '2026-09-11 06:41:44.281', '2026-09-11 07:17:57.945'),
(1005, 17, '5503aa78-652e-45b6-9cc9-e46b446812da', 'b2e59ee90281796eba212aad782b21884e2f14d4beb86accaf52fbff026fbf95', 0, 1, 'LOGGED_OUT', '2026-09-18 07:26:39.522', '2026-09-11 07:26:39.523', '2026-09-11 07:29:58.465'),
(1006, 1, 'db493777-7b72-4353-8a16-c2021e4f13cf', 'fefc1afac0131ece2ed0617a96e39344e891964deed4075bcb95b451da4e1368', 0, 1, 'REFRESH_TOKEN_REUSE_DETECTED', '2026-09-18 07:27:29.752', '2026-09-11 07:27:29.753', '2026-09-11 07:28:57.443'),
(1007, 1, 'bc558293-6785-4407-971c-dd20a492f84f', 'e528f76459dd0a9dba6368dc364f2f9d79e9212981845a33a2b1893281aa4720', 1, 0, NULL, '2026-09-18 07:29:50.213', '2026-09-11 07:29:50.213', '2026-09-11 07:32:08.607'),
(1008, 17, '9fa41199-a9e4-4abe-a1cf-a5a507bc27b6', '898479b670bf6eb44c7c1e4b059d4f87eaf1463f74c8bdc02f81fe0c2de56e06', 1, 0, NULL, '2026-09-18 07:32:08.109', '2026-09-11 07:32:08.110', '2026-09-11 07:32:14.245'),
(1009, 1, 'bc558293-6785-4407-971c-dd20a492f84f', 'e636a1aa92292099ddb1e22d3ff77efcf3a03900edad3d15fb5f96a83d79b60e', 1, 0, NULL, '2026-09-18 07:32:12.490', '2026-09-11 07:32:12.491', '2026-09-11 07:39:03.510'),
(1010, 17, '9fa41199-a9e4-4abe-a1cf-a5a507bc27b6', '0de6549afcadf684ae04f5de6213b0cb226aa02e7a64ab8602bde7d3baae59bc', 0, 1, 'LOGGED_OUT', '2026-09-18 07:32:17.868', '2026-09-11 07:32:17.869', '2026-09-11 07:33:40.536'),
(1011, 17, '870f5a27-168f-47d8-8ae0-922a4592ac65', '555e9c185b0e7a3a4acd441722e32b7c222042fbe466627a3cee84d9fd219efd', 1, 0, NULL, '2026-09-18 07:34:05.401', '2026-09-11 07:34:05.402', '2026-09-11 09:05:44.132'),
(1012, 1, 'bc558293-6785-4407-971c-dd20a492f84f', 'b648485f126cac1eeff470d153270a4de86005247fc110b3868f77cb6f8f9bdc', 1, 0, NULL, '2026-09-18 07:39:07.246', '2026-09-11 07:39:07.247', '2026-09-11 07:40:51.145'),
(1013, 1, 'bc558293-6785-4407-971c-dd20a492f84f', '73bca0741c8e10fcf01dd74d67e785014d252f962f82b2df91440c6d836c25c6', 1, 0, NULL, '2026-09-18 07:40:54.893', '2026-09-11 07:40:54.894', '2026-09-11 07:41:21.784'),
(1014, 1, 'bc558293-6785-4407-971c-dd20a492f84f', '95e61ec8092cbcf215e7f9f01711daeb3dc42cd6ab33d244c8d0c03bd60a064f', 0, 1, 'LOGGED_OUT', '2026-09-18 07:41:25.794', '2026-09-11 07:41:25.794', '2026-09-11 08:12:16.665'),
(1015, 17, '870f5a27-168f-47d8-8ae0-922a4592ac65', '39fb2b0ef874cd17c370d1f8e9d6c0623aaed6c3b82600a42c1439b72f81d2bb', 0, 0, NULL, '2026-09-18 09:05:47.879', '2026-09-11 09:05:47.880', '2026-09-11 09:05:47.880'),
(1016, 31, 'cfdcfd48-13ea-423c-83ed-d0a7fddf9397', '1f6ac65116727a3f3c23b42c801c8a446309aa391695f89eaaafc1462f1968db', 0, 1, 'LOGGED_OUT', '2026-09-18 09:58:08.488', '2026-09-11 09:58:08.489', '2026-09-11 10:28:51.456');

-- --------------------------------------------------------

--
-- Table structure for table `Booking`
--

CREATE TABLE `Booking` (
  `id` int(11) NOT NULL,
  `booking_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `assigned_employee_id` int(11) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `agreed_price` double NOT NULL,
  `booking_amount` double NOT NULL,
  `balance_amount` double NOT NULL,
  `booking_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `source` varchar(191) DEFAULT NULL,
  `campaign` varchar(191) DEFAULT NULL,
  `utm_source` varchar(191) DEFAULT NULL,
  `utm_medium` varchar(191) DEFAULT NULL,
  `utm_campaign` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `BookingPortalMapping`
--

CREATE TABLE `BookingPortalMapping` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `crms_booking_id` int(11) NOT NULL,
  `crms_customer_id` int(11) NOT NULL,
  `portal_customer_id` varchar(191) DEFAULT NULL,
  `portal_booking_id` varchar(191) DEFAULT NULL,
  `handoff_status` varchar(191) NOT NULL DEFAULT 'CREATED',
  `last_sync_at` datetime(3) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Branch`
--

CREATE TABLE `Branch` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Branch`
--

INSERT INTO `Branch` (`id`, `company_id`, `name`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'Miyapur (Main Branch)', '2026-08-31 22:59:03.610', '2026-08-31 22:59:03.610', NULL),
(2, 1, 'Tarnaka Branch', '2026-08-31 22:59:03.785', '2026-08-31 22:59:03.785', NULL),
(6, 15, 'Perf Branch', '2026-09-03 15:51:18.437', '2026-09-03 15:51:18.437', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `Company`
--

CREATE TABLE `Company` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `property_type_group` varchar(191) NOT NULL DEFAULT 'RADHA_REAL_HOMES',
  `announcement_image_url` text DEFAULT NULL,
  `announcement_active` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Company`
--

INSERT INTO `Company` (`id`, `name`, `code`, `property_type_group`, `announcement_image_url`, `announcement_active`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'Radha Real Homes', 'RRH', 'RADHA_REAL_HOMES', NULL, 0, '2026-08-31 22:59:03.327', '2026-09-10 12:12:37.928', NULL),
(15, 'Perf Metrics Test Co', 'PERFTEST', 'RADHA_REAL_HOMES', NULL, 0, '2026-09-03 15:51:18.281', '2026-09-03 15:51:18.281', NULL),
(17, 'Sonthillu Constructions', 'SONTHILLU', 'SONTHILLU', NULL, 0, '2026-09-04 19:43:36.559', '2026-09-04 19:43:36.559', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `CompanyHoliday`
--

CREATE TABLE `CompanyHoliday` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `name` varchar(191) NOT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Complaint`
--

CREATE TABLE `Complaint` (
  `id` int(11) NOT NULL,
  `complaint_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `property_id` int(11) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `category` varchar(191) DEFAULT NULL,
  `priority` varchar(191) NOT NULL DEFAULT 'MEDIUM',
  `status` varchar(191) NOT NULL DEFAULT 'OPEN',
  `assigned_employee_id` int(11) DEFAULT NULL,
  `resolution_description` varchar(191) DEFAULT NULL,
  `resolved_by` int(11) DEFAULT NULL,
  `resolved_at` datetime(3) DEFAULT NULL,
  `closed_at` datetime(3) DEFAULT NULL,
  `closure_reason` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Customer`
--

CREATE TABLE `Customer` (
  `id` int(11) NOT NULL,
  `customer_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `first_name` varchar(191) NOT NULL,
  `last_name` varchar(191) DEFAULT NULL,
  `phone` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `source` varchar(191) NOT NULL DEFAULT 'MANUAL_ENTRY',
  `campaign` varchar(191) DEFAULT NULL,
  `utm_source` varchar(191) DEFAULT NULL,
  `utm_medium` varchar(191) DEFAULT NULL,
  `utm_campaign` varchar(191) DEFAULT NULL,
  `assigned_to_id` int(11) DEFAULT NULL,
  `origin_lead_id` int(11) DEFAULT NULL,
  `pan_number` varchar(191) DEFAULT NULL,
  `aadhaar_number` varchar(191) DEFAULT NULL,
  `kyc_status` varchar(191) DEFAULT NULL,
  `kyc_verified_at` datetime(3) DEFAULT NULL,
  `kyc_rejected_reason` text DEFAULT NULL,
  `kyc_submission_status` varchar(191) DEFAULT NULL,
  `kyc_submitted_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `avatar_url` varchar(191) DEFAULT NULL,
  `force_password_reset` tinyint(1) NOT NULL DEFAULT 0,
  `temp_password_expiry` datetime(3) DEFAULT NULL,
  `password_hash` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `CustomerNotification`
--

CREATE TABLE `CustomerNotification` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` varchar(191) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `DailyReport`
--

CREATE TABLE `DailyReport` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `submitted_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `summary` varchar(191) NOT NULL,
  `call_count` int(11) NOT NULL DEFAULT 0,
  `site_visit_count` int(11) NOT NULL DEFAULT 0,
  `closed_deal_count` int(11) NOT NULL DEFAULT 0,
  `target_met` tinyint(1) NOT NULL DEFAULT 1,
  `below_target_reason` varchar(191) DEFAULT NULL,
  `metrics_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metrics_json`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `DailyReport`
--

INSERT INTO `DailyReport` (`id`, `employee_id`, `submitted_at`, `summary`, `call_count`, `site_visit_count`, `closed_deal_count`, `target_met`, `below_target_reason`, `metrics_json`) VALUES
(1, 2, '2026-09-01 12:22:54.992', 'Today, in the morning session, we learned about the CRM process and worked on it. After lunch, we focused on follow-ups, regular calls, and new calls. Overall, we had a productive day and gai', 35, 0, 3, 1, NULL, '{\"callsMade\":35,\"leadsQualified\":3,\"followupsDone\":\"22\",\"feedback\":\"In the morning session, we learned about the CRM process and how to  work on it. After lunch, we focused on follow-ups,  and new calls.\"}'),
(2, 3, '2026-09-01 12:24:44.343', 'Today, I worked on housing leads by calling customers back and understanding their requirements. I explained the property details, updated customer feedback, downloaded the housing lead\'s  an', 1, 0, 0, 1, NULL, '{\"leadsProcessed\":\"03\",\"telecallerAssignments\":\"01\",\"feedback\":\"Today, 3 housing leads were generated. I contacted the customers, discussed their requirements and explained the property details. One customer from RC Puram Apartments is planning a site visit tomorrow. The Bollaram Apartments lead was shared with Ramesh Sir for further follow-up. Another customer is not answering the call.\",\"callsMade\":1}'),
(3, 4, '2026-09-01 12:27:04.244', 'Calls: 20 Associates• Office Visits: 3 Associates• Site Visit: 1 customer confirmed\"', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(4, 7, '2026-09-01 13:50:51.119', 'Meeting with management ', 0, 1, 0, 1, NULL, '{\"siteVisits\":1,\"propertyVerifications\":\"1\",\"feedback\":\"\"}'),
(5, 6, '2026-09-01 13:52:13.851', '**Date: 31 August 2026**\n\nGood evening Sir,\n\n**Today’s Work Update:**\n\n• Completed today’s motivational social media post.\n• Completed and uploaded the **My Home Garden** real-estate reel on ', 0, 0, 0, 1, NULL, '{\"feedback\":\"**Date: 01 September 2026**\\n\\nGood evening Sir,\\n\\n**Today’s Work Update:**\\n\\n• Completed today’s motivational social media post.\\n• Completed and uploaded the **My Home Garden** real-estate reel on Facebook & Instagram.\\n• Worked on the **Sonthillu social media post**Facebook only today completed the required updates.\\n\\nThank you, Sir.\"}'),
(6, 2, '2026-09-02 12:07:02.517', 'Today I completed 25 new calls. Among them, 6 members showed interest, and I explained about venture details to them. Further follow-ups will be done with the interested leads.', 25, 0, 6, 1, NULL, '{\"callsMade\":25,\"leadsQualified\":6,\"followupsDone\":\"0\",\"feedback\":\"• New Calls Made: 25\\n• Total Calls: 25\\n• Follow-ups: 0\\n\"}'),
(7, 4, '2026-09-02 12:15:29.124', 'I spoke with 25 Associate members regarding their follow-ups. Tomorrow, the site visits for my home garden and Nagadhara are confirmed..', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(8, 3, '2026-09-02 12:21:12.425', 'Good evening sir,\nI have created a Google Sheet with all the Housing Leads and updated the previous follow-ups in the existing follow-up sheets.\nI have also completed some follow-ups for both', 0, 0, 0, 1, NULL, '{\"leadsProcessed\":\"0\",\"telecallerAssignments\":\"0\",\"feedback\":\"• Housing Leads Generated: 0\\n• New Calls: 16\\n• Old Calls Follow-up: 35\\n• Ad Postings Done: 3\\n• Prospects (Old & New): 1\\n• Site Visits: 0\",\"callsMade\":0}'),
(9, 7, '2026-09-02 12:55:10.496', 'Registration recieved at sadashipet ', 0, 1, 0, 1, NULL, '{\"siteVisits\":1,\"propertyVerifications\":\"2\",\"feedback\":\"Registration recieved at sadashipet \"}'),
(10, 3, '2026-09-03 12:03:51.916', 'Good evening, Sir.\nToday’s Updates. Housing leads follow-up calls completed,Housing posts rechecked and updated.', 21, 0, 2, 1, NULL, '{\"callsMade\":21,\"leadsQualified\":2,\"followupsDone\":\"10\",\"feedback\":\"• Housing Leads Generated: 1\\n• New Calls: 9\\n• Old Calls Follow-up: 12\\n• Ad Postings Done: 2\\n• Prospects (Old & New): 2\\n• Site Visits: 1\"}'),
(11, 2, '2026-09-03 12:05:09.656', 'Daily Report Summary – 03/09/2026\n\nToday, I completed 49 new calls. Out of these, 5leads showed interest in the venture. I explained the venture details to the interested leads and will follo', 49, 0, 5, 1, NULL, '{\"callsMade\":49,\"leadsQualified\":5,\"followupsDone\":\"0\",\"feedback\":\"DAILY REPORT – 02/09/2026\\n\\n• New Calls Made: 49\\n• Total Calls: 49\\n• Follow-ups: 0\\n•watt\'s up: 5\\n• Updates: Completed 49 new calls today.\"}'),
(12, 4, '2026-09-03 12:23:08.361', '\nI will follow up with the team to get their customer site visit updates...', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(13, 6, '2026-09-03 13:06:45.435', 'To day work update 03/09/2026\n  I did Meta ads, for speed senaralli project, and facebook post s for sonthillu and Radha Real Home Properties ki Insta post s also upload today', 0, 0, 0, 1, NULL, '{\"feedback\":\"To day work update 03/09/2026\\n  I did Meta ads, for speed senaralli project, and facebook post s for sonthillu and Radha Real Home Properties ki Insta post s also upload today\"}'),
(14, 7, '2026-09-03 13:18:40.622', 'I gave the registration documents to the customer.', 0, 0, 0, 1, NULL, '{\"siteVisits\":0,\"propertyVerifications\":\"0\",\"feedback\":\"I gave the registration documents to the customer.\"}'),
(15, 17, '2026-09-03 13:57:35.133', 'Reposted a reel, because I think it has potential and last time it was only pushed in feeds tab rather than reels tab, let\'s see. And content research for tomorrow\'s reel and overall, content', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(16, 3, '2026-09-04 12:07:24.163', 'Good evening, sir.\nToday’s work update: • Saturday & Sunday housing leads follow-up calls completed. • Total assigned calls and follow-ups completed.', 57, 0, 1, 1, NULL, '{\"callsMade\":57,\"leadsQualified\":1,\"followupsDone\":\"57\",\"feedback\":\"• Housing Leads Generated: 1\\n• New Calls: 1\\n• Old Calls Follow-up: 56\\n• Ad Postings Done: 1\\n• Prospects (Old & New): 1\\n• Site Visits: 0\"}'),
(17, 4, '2026-09-04 12:18:58.354', '\nWeekend Site Visits & Follow-up Updates', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(18, 2, '2026-09-04 12:20:24.866', 'Daily Report Summary – 04/09/2026\n\nToday, I completed 37 calls in total. Out of these, 8 members showed interest, and I shared the venture details with all 8 interested members via WhatsApp.', 37, 0, 8, 1, NULL, '{\"callsMade\":37,\"leadsQualified\":8,\"followupsDone\":\"0\",\"feedback\":\"DAILY REPORT – 04/09/2026\\n\\n• New Calls Made: 37\\n• Total Calls: 37\\n• Follow-ups: —\\n•watt\'s up :--08\"}'),
(19, 6, '2026-09-04 13:08:22.008', 'Today work update 04/09/2026\nDaily post for Facebook nd instagram 7 posts today and one post ready for Facebook ad run   middle in the work lo vundi thats it to day work ', 0, 0, 0, 1, NULL, '{\"feedback\":\"Today work update 04/09/2026\\nDaily post for Facebook nd instagram 7 posts today and one post ready for Facebook ad run  middle ofthe the work lo vundi thats it to day work \"}'),
(20, 7, '2026-09-04 13:36:50.825', 'followed call backs a site visit has been scheduled for tomorrow, and also visited a new project.', 0, 1, 0, 1, NULL, '{\"siteVisits\":1,\"propertyVerifications\":\"1\",\"feedback\":\"followed call backs a site visit has been scheduled for tomorrow, and also visited a new project.\"}'),
(21, 7, '2026-09-04 13:36:59.743', 'followed call backs a site visit has been scheduled for tomorrow, and also visited a new project.', 0, 1, 0, 1, NULL, '{\"siteVisits\":1,\"propertyVerifications\":\"1\",\"feedback\":\"followed call backs a site visit has been scheduled for tomorrow, and also visited a new project.\"}'),
(22, 17, '2026-09-04 14:03:03.249', 'Posted a reel in sonthillu insta page', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(23, 2, '2026-09-05 12:51:47.364', 'Daily Report Summary – 04/09/2026\n\nToday, I completed 41 calls in total. Out of these, 02 members showed interest, and I shared the venture details with all 02 interested members via WhatsApp', 33, 0, 2, 1, NULL, '{\"callsMade\":33,\"leadsQualified\":2,\"followupsDone\":\"8\",\"feedback\":\"DAILY REPORT – 05/09/2026\\n\\n• New Calls Made: 33\\n• Follow-ups: 08\\n•Total Calls:41\\n•watt\'s up : 02\"}'),
(24, 7, '2026-09-05 14:30:41.667', 'Followuped my call backs & visited speed sanarelli site ', 0, 0, 0, 1, NULL, '{\"siteVisits\":0,\"propertyVerifications\":\"1\",\"feedback\":\"Followuped my call backs & visited speed sanarelli site \"}'),
(25, 3, '2026-09-07 12:15:23.349', '• Good evening sir.\n• Housing add-postings completed:\n 3\n• Leads generated: 1\n• Lead callback completed ', 17, 0, 1, 1, NULL, '{\"callsMade\":17,\"leadsQualified\":1,\"followupsDone\":\"17\",\"feedback\":\"• Housing Leads Generated: 1\\n• New Calls: 1\\n• Old Calls Follow-up: 16\\n• Ad Postings Done: 3\\n• Prospects (Old & New): 0\\n• Site Visits: 0\"}'),
(26, 4, '2026-09-07 12:15:43.894', '\n\nNo.of existing prospects followup:29\nNo.of New Calls:9\nTotal Calls Made:38\nNo.of New Prospects:7\n', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(27, 2, '2026-09-07 12:25:04.815', 'Today, 46 calls were completed, including 37 new calls and 9 follow-ups. Venture details were shared with 4 members via WhatsApp.', 37, 0, 4, 1, NULL, '{\"callsMade\":37,\"leadsQualified\":4,\"followupsDone\":\"9\",\"feedback\":\"Date: 07 September 2026\\n\\n- New Calls: 37\\n- Follow-ups: 9\\n- Total Calls: 46\\n- WhatsApp Details Shared: 4\"}'),
(28, 6, '2026-09-07 12:34:33.579', 'Today’s Work Update:07/09/2026\n\nPrepared the Sonthaillu Facebook post.\nPrepared a new Reel script.\nCreated one motivational quote/post.\nWorked on Radha Real Home  face book and insta Pinteres', 0, 0, 0, 1, NULL, '{\"feedback\":\"Today’s Work Update:07/09/2026\\n\\nPrepared the Sonthaillu Facebook post.\\nPrepared a new Reel script.\\nCreated one motivational quote/post.\\nWorked on Radha Real Home  face book and insta Pinterest post.\\nWorked on Radha Real Home Facebook follower growth through the Invite People option.\"}'),
(29, 4, '2026-09-08 12:29:33.210', '\nNo.of existing prospects followup:30\nNo.of New Calls:11\nTotal Calls Made:41\nNo.of New Prospects:5\nNo.of Associate’s office Visits:0\nNo.of Enrollments:5\nNo.of associate site visits:0', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(30, 2, '2026-09-08 12:30:01.586', 'Date: 08 September 2026\nReporting Period: Daily\n\nToday, a total of 43 calls were handled, including 42 new calls and 1 follow-up. 4 WhatsApp details were shared with clients.', 42, 0, 4, 1, NULL, '{\"callsMade\":42,\"leadsQualified\":4,\"followupsDone\":\"1\",\"feedback\":\"Date: 08 September 2026\\nReporting Period: Daily\\n\\n- New Calls: 42\\n- Follow-ups: 01\\n- WhatsApp Shared: 04\\n- Total Calls: 43\"}'),
(31, 3, '2026-09-08 12:30:28.199', 'Good evening sir \n\n• Housing non-postings completed: 5\n• Leads generated: 1\n• Lead callback completed: 3', 18, 0, 1, 1, NULL, '{\"callsMade\":18,\"leadsQualified\":1,\"followupsDone\":\"15\",\"feedback\":\"• Housing Leads Generated: 1\\n• New Calls: 3\\n• Old Calls Follow-up: 15\\n• Ad Postings Done: 5\\n• Prospects (Old & New): 1\\n• Site Visits: 0\"}'),
(32, 6, '2026-09-08 12:30:47.709', 'To day work update;  Prepared Sonthaillu Facebook post.\nCreated a new Reel script for Radha Real Home.\nCreated one motivational quote/post.\nWorked on Radha Real Home Pinterest post.\nWorked on', 0, 0, 0, 1, NULL, '{\"feedback\":\"To day work update;  Prepared Sonthaillu Facebook post.\\nCreated a new Reel script for Radha Real Home.\\nCreated one motivational quote/post.\\nWorked on Radha Real Home Pinterest post.\\nWorked on Radha Real Home Facebook follower growth using the Invite People option.\"}'),
(33, 7, '2026-09-08 16:43:35.791', 'Followuped call backs ', 0, 0, 0, 1, NULL, '{\"siteVisits\":0,\"propertyVerifications\":\"0\",\"feedback\":\"Followuped call backs\"}'),
(34, 6, '2026-09-09 12:06:41.918', 'Today’s Work Update:\n\nPrepared 2 Facebook posts &insta– Sonthaillu & Radha Real Home.\nCreated 1 motivational post, pinterest post', 0, 0, 0, 1, NULL, '{\"feedback\":\"Today’s Work Update:\\n\\nPrepared 2 Facebook posts &insta– Sonthaillu & Radha Real Home.\\nCreated 1 motivational post, pinterest post\"}'),
(35, 7, '2026-09-09 12:23:04.392', 'Followuped my call backs ', 0, 0, 0, 1, NULL, '{\"siteVisits\":0,\"propertyVerifications\":\"0\",\"feedback\":\"Followuped my call backs \"}'),
(36, 3, '2026-09-09 12:28:49.421', 'Good evening sir \n• Housing non-postings completed: 2\n• Leads generated: 0\n• Lead callback completed: ', 9, 0, 0, 1, NULL, '{\"callsMade\":9,\"leadsQualified\":0,\"followupsDone\":\"14\",\"feedback\":\"• Housing Leads Generated: 0\\n• New Calls: 9\\n• Old Calls Follow-up: 14\\n• Ad Postings Done: 2\\n• Prospects (Old & New): 0\\n• Site Visits: 0\"}'),
(37, 4, '2026-09-09 12:28:55.411', '\nFollow up on customer site visits and new Associate’s joining..', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}'),
(38, 2, '2026-09-09 12:29:22.604', 'Completed 44 calls today, including 39 new calls and 5 follow-ups. WhatsApp details were shared with 4 prospects.', 39, 0, 4, 1, NULL, '{\"callsMade\":39,\"leadsQualified\":4,\"followupsDone\":\"5\",\"feedback\":\"Date: 09 September 2026\\n\\n- New Calls: 39\\n- Follow-ups: 05\\n- WhatsApp Details Shared: 04\\n- Total Calls: 44\"}'),
(39, 3, '2026-09-10 12:09:43.533', 'Good evening sir \n• Housing non-postings completed: 2\n• Leads generated: 1\n• Lead callback completed: ', 15, 0, 1, 1, NULL, '{\"callsMade\":15,\"leadsQualified\":1,\"followupsDone\":\"10\",\"feedback\":\"• Housing Leads Generated: 1\\n• New Calls: 5\\n• Old Calls Follow-up: 10\\n• Ad Postings Done: 2\\n• Prospects (Old & New): 1\\n• Site Visits: 0\"}'),
(40, 2, '2026-09-10 12:13:51.264', 'Today, I made 42 total calls, including 34 new calls and 8 follow-ups. I also shared WhatsApp details with 3 members.', 34, 0, 3, 1, NULL, '{\"callsMade\":34,\"leadsQualified\":3,\"followupsDone\":\"8\",\"feedback\":\"Date: 10 September 2026\\n- New Calls: 34\\n- Follow-ups: 08\\n- WhatsApp Details Shared: 03\\n- Total Calls: 42\"}'),
(41, 6, '2026-09-10 12:27:52.362', '**Today’s Work Update – 10 September 2026**\n\n• Radha Real Home Properties – Social media content/posts\n• Sonthillu – Social media \n• Motivational quote\n• Upcoming social media content plannin', 0, 0, 0, 1, NULL, '{\"feedback\":\"**Today’s Work Update – 10 September 2026**\\n\\n• Radha Real Home Properties – Social media content/posts\\n• Sonthillu – Social media \\n• Motivational quote\\n• Upcoming social media content planning \"}'),
(42, 4, '2026-09-10 12:31:55.357', '\nNo.of existing prospects followup:0\nNo.of New Calls:47\nTotal Calls Made:47\nNo.of New Prospects:8\nNo.of Associate’s office Visits:\nNo.of Enrollments:2\nNo.of associate site visits:0', 0, 0, 0, 1, NULL, '{\"feedback\":\"\"}');

-- --------------------------------------------------------

--
-- Table structure for table `DailyTarget`
--

CREATE TABLE `DailyTarget` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `role_name` varchar(191) NOT NULL,
  `employee_id` int(11) DEFAULT NULL,
  `target_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `calls_target` int(11) NOT NULL DEFAULT 0,
  `site_visits_target` int(11) NOT NULL DEFAULT 0,
  `closed_deals_target` int(11) NOT NULL DEFAULT 0,
  `form_schema_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`form_schema_json`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Demo`
--

CREATE TABLE `Demo` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `handler_id` int(11) NOT NULL,
  `scheduled_at` datetime(3) NOT NULL,
  `summary` text NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Demo`
--

INSERT INTO `Demo` (`id`, `lead_id`, `handler_id`, `scheduled_at`, `summary`, `created_at`, `updated_at`) VALUES
(3, 29, 30, '2026-09-06 03:30:00.000', 'Demo Scheduled', '2026-09-06 00:18:04.263', '2026-09-06 00:18:04.263'),
(6, 14, 1, '2026-09-06 00:27:03.484', 'Demo Scheduled', '2026-09-06 00:27:03.639', '2026-09-06 00:27:03.639');

-- --------------------------------------------------------

--
-- Table structure for table `DemoInterestedProperty`
--

CREATE TABLE `DemoInterestedProperty` (
  `id` int(11) NOT NULL,
  `demo_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Employee`
--

CREATE TABLE `Employee` (
  `id` int(11) NOT NULL,
  `employee_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `password_hash` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'ACTIVE',
  `token_version` int(11) NOT NULL DEFAULT 1,
  `attendance_required` tinyint(1) NOT NULL DEFAULT 1,
  `first_login_done` tinyint(1) NOT NULL DEFAULT 0,
  `report_required` tinyint(1) NOT NULL DEFAULT 1,
  `full_name` varchar(191) DEFAULT NULL,
  `phone` varchar(191) DEFAULT NULL,
  `secondary_phone` varchar(191) DEFAULT NULL,
  `whatsapp_number` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `blood_group` varchar(191) DEFAULT NULL,
  `social_links` varchar(191) DEFAULT NULL,
  `profile_image_url` varchar(191) DEFAULT NULL,
  `current_address` varchar(191) DEFAULT NULL,
  `permanent_address` varchar(191) DEFAULT NULL,
  `emergency_contact_name` varchar(191) DEFAULT NULL,
  `emergency_contact_relation` varchar(191) DEFAULT NULL,
  `emergency_contact_phone` varchar(191) DEFAULT NULL,
  `pan_number` varchar(191) DEFAULT NULL,
  `aadhaar_number` varchar(191) DEFAULT NULL,
  `bank_name` varchar(191) DEFAULT NULL,
  `bank_account_number` varchar(191) DEFAULT NULL,
  `bank_ifsc` varchar(191) DEFAULT NULL,
  `bank_branch` varchar(191) DEFAULT NULL,
  `job_title` varchar(191) DEFAULT NULL,
  `department` varchar(191) DEFAULT NULL,
  `employment_type` varchar(191) DEFAULT 'FULL_TIME',
  `reporting_manager_id` int(11) DEFAULT NULL,
  `date_of_joining` datetime(3) DEFAULT NULL,
  `salary_ctc` double DEFAULT NULL,
  `background_education` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Employee`
--

INSERT INTO `Employee` (`id`, `employee_code`, `company_id`, `branch_id`, `password_hash`, `status`, `token_version`, `attendance_required`, `first_login_done`, `report_required`, `full_name`, `phone`, `secondary_phone`, `whatsapp_number`, `email`, `blood_group`, `social_links`, `profile_image_url`, `current_address`, `permanent_address`, `emergency_contact_name`, `emergency_contact_relation`, `emergency_contact_phone`, `pan_number`, `aadhaar_number`, `bank_name`, `bank_account_number`, `bank_ifsc`, `bank_branch`, `job_title`, `department`, `employment_type`, `reporting_manager_id`, `date_of_joining`, `salary_ctc`, `background_education`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 'RRH-ADMIN-001', 1, 1, '$2a$12$xZxtr0m3fffu8S7cLWmdSuxPu0xUoq656RZXN9GLCY3r5.myROz0a', 'ACTIVE', 1, 0, 1, 1, 'Admin', '7075196267', '', '', 'vyasthratechnicalteam@gmail.com', '', '', NULL, '1-185, BESIDE VINAYAKA TEMPLE, CHEEDIGA, KAKINADA', '', '', '', '', 'c91a1c1b29ac706f6cdae9d2aede20c4:06559cac1422be56088642ce93965e36', 'd610b75fe9ebb18af36efcfe120e40d1:e9b8faf0148561cbb4a7013cb9661579', '8952fd62287724366bd4e95d544426f8:ee48ec0e11cbec05e531f8010a53a920', '7db4b2dd2245e445a4278c57a65c4b1d:9aa0ee4539f1751c857ff13e1ed616c4', 'bf81dead1dffff5ec69413e64bf4c621:5c378549ed2fa27b5ea5ad4bfce33d16', '022162cc2539a0ad5d24cdafb178ee74:852bebfac0a13c0e1eb3ae0855b43019', NULL, NULL, 'FULL_TIME', NULL, NULL, NULL, NULL, '2026-08-31 23:03:11.276', '2026-09-03 06:23:41.110', NULL),
(2, 'RRH-SL-8736', 1, 1, '$2a$12$IeOrvpsclTwbYGZm6qkGW.lZzZHV9UfR/NicCT2.EqlKBJV09RrO2', 'ACTIVE', 3, 1, 1, 1, 'Deepa Shanagonda', '7285904060', '8328347187', '7285984060', '', '', '', NULL, 'New ram nagar colony,Chilkanagr ', 'Uppal, Hyderabad ', 'D.badrinath chary', 'Brother ', '9391709329', 'a1abf2ae4e741de1da5df10204b916d2:228194ec78905724353d101fbf1e9f0b', 'f2f03d6b2b921e6d46da8367bbf62039:616ab689211148bc0a8754d6728e450b', '317a25b0de894948f0b9f0a470286bd1:da6b54ddbd14e6804bd652da04b063573a628e94f15590e7c75ba067213ece09', '849027e0fad2ee89f6daa19eac2cdde6:72588887ca1fb96d880a71775beb2ce3', 'da33a078769e7b73321406f85c99de02:aab9202c9797acfdf27bc5a3f73650dd', 'b5b5d5df2b9bdd722d1c9e242559e635:4f8563e9a0d639c963a7e71194c3b123', 'telecallers', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 04:47:33.062', '2026-09-03 06:23:41.603', NULL),
(3, 'RRH-MK-8486', 1, 1, '$2a$12$XpF7BSLTSv3DpoAUgH2stODbtmyy4L1U8ljCsAmSXR.GP8MS7kq8W', 'ACTIVE', 3, 1, 1, 1, 'vasantha', '+91 630 5497853', '8919776059', '6305497853', '', '', '', NULL, '', '', 'Vittal ', 'Father ', '9381954876', '0d9ed499ca72921f0d8b4c738997d432:f05468c139c3c7d4870b3f3dcf6b3a51', '', 'a4f2ff1e37f3198ade8906ad6acc4671:f886f88bea16ff585e4c942430722c707c58732759ccb963933898b32d36baa1', '753f07871a32062ef5fe14bcc10aca6f:0daa0ddaf308e0096ab6efbb79628c2d', 'b781f561687391fae2b2099909987e2f:e3b707b8d165287af5aad27eae21a0a6', '0d3cad572eb8028ab0df05579669a53a:2ab16936f1c790457786c0ec4d56054b', 'telecallers', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 04:52:37.389', '2026-09-03 06:23:41.855', NULL),
(4, 'RRH-CP-5867', 1, 1, '$2a$12$e9XhcJMxRMNoMV1AdEmv2uVC6dtwI3BKXVnqkmcunmHqbZGUH2cIy', 'ACTIVE', 2, 1, 1, 1, 'siri', '8096483984', NULL, '8096483984', '', 'O+', NULL, NULL, '', '', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'Channel partner manager', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 05:07:39.500', '2026-09-01 05:16:08.184', NULL),
(5, 'RRH-EX-3504', 1, 1, '$2a$12$cr871rnhltEeBbBzrTmymOpndDC3iiiRecOoLd.E.hEnRWKlVt2iW', 'ACTIVE', 4, 0, 0, 1, 'Ramesh CH', '9030666627', NULL, '9030666627', '', 'O+', NULL, NULL, '', '', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'Managing director', 'Executive', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 07:12:43.271', '2026-09-06 12:07:50.942', NULL),
(6, 'RRH-MK-9873', 1, 1, '$2a$12$GxGOGF9lvySDk2XIuY1LhuRd3wFBS71jnecbDd0wdHxJq0Z1PX5EK', 'ACTIVE', 2, 1, 1, 1, 'ANITHA SP', '8826519777', NULL, '8826519777', '', 'O+', NULL, NULL, '', '', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'digital marketing executive', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 10:02:22.558', '2026-09-01 10:07:04.641', NULL),
(7, 'RRH-OP-3901', 1, 1, '$2a$12$wTWEgZLytTZL8Mge5BGy.enAkrhMuWfpsziVSiMkD6vYv7mXpcgNO', 'ACTIVE', 2, 1, 1, 1, 'DINESH V', '7732068669', '', '', '', '', '', NULL, '1-185 Ganesh Templega, Indrapalem, East Godavari, Kakinada Rural, Andhra Pradesh, India, 533006.', '1-185 Ganesh Templega, Indrapalem, East Godavari, Kakinada Rural, Andhra Pradesh, India, 533006.', '', '', '', '', '', '', '', '', '', 'project managers', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-01 00:00:00.000', 35000, '', '2026-09-01 10:05:18.876', '2026-09-01 10:37:59.398', NULL),
(16, 'RRH-OP-3514', 1, 1, '$2a$12$BLAHViB4iwCb2CIOluRN5.RU8s4WnJXrOZhSRrFT6a1Jy5ndCJ2fq', 'ACTIVE', 1, 1, 0, 1, 'Ruhan', '9542279927', NULL, '9542279927', 'example@gmail.com', 'O+', NULL, NULL, '', '', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'Project Manager', 'Marketing', 'FULL_TIME', 5, '2026-09-03 00:00:00.000', 35000, '', '2026-09-01 06:57:37.793', '2026-09-03 06:57:37.793', NULL),
(17, 'RRH-MK-5052', 1, 1, '$2a$12$IzYyBTyLg6vb6Z0HWsLhiu87DyohxLjrzlBRzt8QabBZ5DHsudM0W', 'ACTIVE', 2, 1, 1, 0, 'satish', '7013249695', NULL, '7013249695', 'example@gmail.com', 'B+', NULL, NULL, '', '', '', '', '', NULL, NULL, NULL, NULL, NULL, NULL, 'Digital Marketing executive', 'Sales & Leads', 'PART_TIME', 5, '2026-09-01 00:00:00.000', 35000, '', '2026-09-03 08:33:45.974', '2026-09-03 08:51:59.242', NULL),
(30, 'RRH-SL-4126', 1, 1, '$2a$12$AJXqCtCUEhfgd2ISw3zfDOl9z19RBSe6tCZ35mFN4qKyaDQQkYlUS', 'ACTIVE', 2, 1, 1, 1, 'test tele caller', '9876543210', NULL, '9876543210', 'example@gmail.com', 'O+', NULL, NULL, '', '', '', '', '', '7e3d1dbe813f0b3d4fb1f2d516453ae9:9126e2f4b9835683db279187b100212d', 'dd7b781f8e4117a1c025dd219047e3f2:a8c39a134aca9cdb6b2673ccd9993714', 'e5245f7df851fe0cea985bad30422700:034194aa6adb275cfcb8cca3d491745f', '0e63a346583473136907ee0a52f6e163:945b86fd06d00cf757ea5312e0153f88', '0458e1edd2f1fe2fa8be24cde4c28142:9c97441c93065100fdad52f712d39eb1', NULL, 'Tele caller', 'Sales & Leads', 'FULL_TIME', NULL, '2026-09-05 00:00:00.000', 35000, '', '2026-09-05 23:11:46.779', '2026-09-05 23:12:53.851', NULL),
(31, 'RRH-EX-27369', 1, 1, '$2a$12$h5shNooNPuO1AZYH1fUCaOC49S6UG/9P6OJVpTqR1mLs5qYRTa/fO', 'ACTIVE', 2, 0, 1, 1, 'Ramesh Cheekatla', '8374569056', NULL, '8374569056', 'amruthswaroopvasamsetti@gmail.com', 'O+', NULL, NULL, '', '', '', '', '', '3a0b923b585f4c1bc60841aa1a6be0cd:df902ca35301d872b8a9331240f56ebb', 'fbed5758a65b09c28be0e79e9c72b1fa:ddc9608acfe7d79cdc0f66666b72586d', NULL, NULL, 'f51d04de5ab68072596369291ed6ae93:7b83fe93f75abe2b658c783f452065e8', NULL, 'Managing director', 'Executive', 'FULL_TIME', NULL, '2026-09-06 00:00:00.000', 35000, '', '2026-09-06 12:20:58.655', '2026-09-06 12:23:14.881', NULL),
(33, 'RRH-SL-4770', 1, 1, '$2a$12$mYCKmvwXiYEIo0o.gG6QD.vhCn9QT9bk6tS9g5K6HpSGLSIUQBgJ2', 'ACTIVE', 1, 1, 0, 1, 'Padma ', '9988776655', NULL, '9988776655', 'example@gmail.com', 'O+', NULL, NULL, '', '', '', '', '', '582636b3c32973470be8c34d39ea333e:4fad5fbe8bc09026c5742a2afd5074d1', '977b9542d009854dad56ff328777c448:a8715270229ea9f70161095798c5d37d', 'c5afb1400529838acfb58eee2d9a6340:a8edd53fdf1a0c9db141ea3385c9ab77', '360c421c13e65c862b260e4c43baa094:6272a0f9e4ebe9ee86f1bf04c95fbfe5', '0ec52c57fec0d0c7b2dd93a3e28cd19e:2e4725a91eb3df335d05591d636c61ce', '58c12bec395b5e87a27c541e0a9008a7:6d67a5b74d5c389c1699a4d18e6347ed', 'House keeping', 'Sales & Leads', 'FULL_TIME', 5, '2026-09-11 00:00:00.000', 35000, '', '2026-09-11 04:20:20.057', '2026-09-11 04:20:20.057', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `EmployeeBranch`
--

CREATE TABLE `EmployeeBranch` (
  `employee_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `EmployeePermissionOverride`
--

CREATE TABLE `EmployeePermissionOverride` (
  `employee_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `is_granted` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `EmployeeQrCode`
--

CREATE TABLE `EmployeeQrCode` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `qr_token` varchar(191) NOT NULL,
  `generated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expires_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `EmployeeQrCode`
--

INSERT INTO `EmployeeQrCode` (`id`, `employee_id`, `qr_token`, `generated_at`, `expires_at`) VALUES
(1, 2, 'f1785a13bd54e011f9a61160fb5edf2f8ff0f7bff2e3b533ced5dad43fcef108', '2026-09-01 04:55:38.295', NULL),
(2, 1, '134903b63c42a848d080f28ce34a693bb58bd3c4177fef11421d598d9faca29d', '2026-09-01 04:57:15.327', NULL),
(3, 3, '729b0725f6a19aa657296ee2c3ef982b97c29bb31c5e7cb395cb62d2b726dc47', '2026-09-01 05:00:11.589', NULL),
(4, 4, 'b8964563075b6a095f4fb489491ee293f660c54ae30fef02013de0e645789f37', '2026-09-01 05:17:04.393', NULL),
(5, 7, '6b0b8dd876212f2127338a25d30a82c2df43ad5a5874b10743069d7f4cbd6ffb', '2026-09-01 10:13:04.965', NULL),
(6, 6, 'e28f842a5ee07775f503a29d617959bbeee4ff731d92f1db5759a340386d8071', '2026-09-01 10:13:06.327', NULL),
(7, 5, 'e72c65e949a08f3e13a7a4a319a570ae317af52ab55918705a200d1e0ad9ff4c', '2026-09-01 13:03:19.403', NULL),
(8, 17, 'b65f693068b16cd1101bff4e550b347f86428fba68d4afc57a82f868db3143e6', '2026-09-03 09:28:31.593', NULL),
(9, 31, '15b28f72876151c3b811904c07173b5a62463ed0e7e31f7889943a167d173e89', '2026-09-06 12:25:04.319', NULL),
(10, 16, '38e73c2f10f5155479f92f9afd1c067acad1e71e78cc6b72369528c511f3f2ce', '2026-09-08 08:09:02.454', NULL),
(12, 33, '9a32ed0967139099a681d501c01e490cfa2d4231defee0ca4691fa92e3941537', '2026-09-11 04:20:36.598', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `EmployeeRole`
--

CREATE TABLE `EmployeeRole` (
  `employee_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `EmployeeRole`
--

INSERT INTO `EmployeeRole` (`employee_id`, `role_id`) VALUES
(5, 1),
(31, 1),
(1, 2),
(7, 5),
(16, 5),
(2, 7),
(3, 7),
(30, 7),
(33, 10),
(6, 11),
(17, 11),
(4, 13);

-- --------------------------------------------------------

--
-- Table structure for table `ExpenseRefund`
--

CREATE TABLE `ExpenseRefund` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `purpose` text NOT NULL,
  `amount` double NOT NULL,
  `proof_image_url` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `accountant_id` int(11) DEFAULT NULL,
  `accountant_note` varchar(191) DEFAULT NULL,
  `accountant_reviewed_at` datetime(3) DEFAULT NULL,
  `md_id` int(11) DEFAULT NULL,
  `md_note` varchar(191) DEFAULT NULL,
  `md_reviewed_at` datetime(3) DEFAULT NULL,
  `refunded_at` datetime(3) DEFAULT NULL,
  `refunded_by` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Installment`
--

CREATE TABLE `Installment` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `installment_number` int(11) NOT NULL,
  `expected_amount` double NOT NULL,
  `received_amount` double NOT NULL DEFAULT 0,
  `due_date` datetime(3) NOT NULL,
  `received_date` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `recorded_by_id` int(11) DEFAULT NULL,
  `remarks` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `IntegrationEvent`
--

CREATE TABLE `IntegrationEvent` (
  `id` int(11) NOT NULL,
  `event_type` varchar(191) NOT NULL,
  `payload` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'CREATED',
  `company_id` int(11) NOT NULL,
  `crms_booking_id` int(11) DEFAULT NULL,
  `crms_customer_id` int(11) DEFAULT NULL,
  `retry_count` int(11) NOT NULL DEFAULT 0,
  `max_retries` int(11) NOT NULL DEFAULT 3,
  `error_message` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `processed_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `KioskCredential`
--

CREATE TABLE `KioskCredential` (
  `id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `label` varchar(191) NOT NULL,
  `username` varchar(191) NOT NULL,
  `password_hash` varchar(191) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `credential_version` int(11) NOT NULL DEFAULT 1,
  `created_by_id` int(11) NOT NULL,
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `KioskCredential`
--

INSERT INTO `KioskCredential` (`id`, `company_id`, `branch_id`, `label`, `username`, `password_hash`, `is_active`, `credential_version`, `created_by_id`, `updated_at`, `created_at`) VALUES
(1, 1, 1, 'Attendance portal', 'Attendance-001', '$2a$12$/OUeMqlYG5.R93itI0uXZuwk6WLh8FrNeEHOQ5paPWnmhdUkvmDN2', 1, 1, 1, '2026-09-01 04:12:31.325', '2026-09-01 04:12:31.325');

-- --------------------------------------------------------

--
-- Table structure for table `Lead`
--

CREATE TABLE `Lead` (
  `id` int(11) NOT NULL,
  `lead_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `customer_name` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'MANUAL_ENTRY',
  `status` varchar(191) NOT NULL DEFAULT 'NEW',
  `assigned_to_id` int(11) DEFAULT NULL,
  `assigned_at` datetime(3) DEFAULT NULL,
  `assignment_type` varchar(191) DEFAULT NULL,
  `property_type_preference` varchar(191) DEFAULT NULL,
  `budget_min` double DEFAULT NULL,
  `budget_max` double DEFAULT NULL,
  `preferred_location` varchar(191) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by_id` int(11) DEFAULT NULL,
  `last_contacted_at` datetime(3) DEFAULT NULL,
  `campaign` varchar(191) DEFAULT NULL,
  `utm_source` varchar(191) DEFAULT NULL,
  `utm_medium` varchar(191) DEFAULT NULL,
  `utm_campaign` varchar(191) DEFAULT NULL,
  `lead_score` int(11) NOT NULL DEFAULT 0,
  `sla_breach_at` datetime(3) DEFAULT NULL,
  `referral_person_name` varchar(191) DEFAULT NULL,
  `referral_employee_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `enquiry_type` varchar(191) DEFAULT NULL,
  `preferred_contact_time` varchar(191) DEFAULT NULL,
  `property_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`property_ids`)),
  `exit_reason` enum('NO_MATCHING_INVENTORY','CHOSE_COMPETITOR','BUDGET_MISMATCH','NOT_READY','DO_NOT_CONTACT','OTHER') DEFAULT NULL,
  `exited_from_status` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `introduced_by_id` int(11) DEFAULT NULL,
  `ownership_type` enum('POOL','DIRECT') NOT NULL DEFAULT 'POOL',
  `previous_lead_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Lead`
--

INSERT INTO `Lead` (`id`, `lead_code`, `company_id`, `branch_id`, `customer_name`, `phone`, `email`, `source`, `status`, `assigned_to_id`, `assigned_at`, `assignment_type`, `property_type_preference`, `budget_min`, `budget_max`, `preferred_location`, `notes`, `created_by_id`, `last_contacted_at`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign`, `lead_score`, `sla_breach_at`, `referral_person_name`, `referral_employee_id`, `project_id`, `enquiry_type`, `preferred_contact_time`, `property_ids`, `exit_reason`, `exited_from_status`, `created_at`, `updated_at`, `introduced_by_id`, `ownership_type`, `previous_lead_id`) VALUES
(14, 'RRH-LD-2026-0001', 1, 1, 'sandeep', '7075196267', NULL, 'SOCIAL_MEDIA', 'QUALIFIED', 1, '2026-09-04 20:40:18.455', 'MANUAL_OVERRIDE', 'Villa', 100, 200, 'Hyderabad', NULL, 1, '2026-09-06 00:27:03.637', NULL, NULL, NULL, NULL, 0, '2026-09-04 22:40:18.161', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-04 20:40:18.456', '2026-09-06 00:47:33.276', NULL, 'DIRECT', NULL),
(15, 'RRH-LD-2026-0002', 17, NULL, 'LC-Verify-Consultation-1788557462698', '9876541205', 'lc-Consultation@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Consultation', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'consultation', NULL, NULL, NULL, NULL, '2026-09-04 21:31:06.463', '2026-09-04 21:31:06.463', NULL, 'POOL', NULL),
(16, 'RRH-LD-2026-0003', 17, NULL, 'LC-property', '9876512370', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Property Enquiry', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'property', NULL, NULL, NULL, NULL, '2026-09-04 21:32:01.055', '2026-09-04 21:32:01.055', NULL, 'POOL', NULL),
(17, 'RRH-LD-2026-0004', 17, NULL, 'LC-call', '9876584545', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Callback Request', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'call', NULL, NULL, NULL, NULL, '2026-09-04 21:32:03.960', '2026-09-04 21:32:03.960', NULL, 'POOL', NULL),
(18, 'RRH-LD-2026-0005', 17, NULL, 'LC-other', '9876599247', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - General Enquiry', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'other', NULL, NULL, NULL, NULL, '2026-09-04 21:32:06.695', '2026-09-04 21:32:06.695', NULL, 'POOL', NULL),
(19, 'RRH-LD-2026-0006', 17, NULL, 'LC-appraisal', '9876538733', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Seller Enquiry', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'appraisal', NULL, NULL, NULL, NULL, '2026-09-04 21:32:09.004', '2026-09-04 21:32:09.004', NULL, 'POOL', NULL),
(20, 'RRH-LD-2026-0007', 17, NULL, 'LC-project', '9876566178', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Project Enquiry', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'project', NULL, NULL, NULL, NULL, '2026-09-04 21:32:11.825', '2026-09-04 21:32:11.825', NULL, 'POOL', NULL),
(21, 'RRH-LD-2026-0008', 17, NULL, 'LC-consultation', '9876545183', 'lc1788557518071@testmail.in', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Consultation', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'consultation', NULL, NULL, NULL, NULL, '2026-09-04 21:32:14.925', '2026-09-04 21:32:14.925', NULL, 'POOL', NULL),
(22, 'RRH-LD-2026-0009', 17, NULL, 'LC-1788561385050-Property', '9876541234', 'lc-1788561385050@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Property', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'property', 'immediate', '[1]', NULL, NULL, '2026-09-04 22:36:28.019', '2026-09-04 22:36:28.019', NULL, 'POOL', NULL),
(24, 'RRH-LD-2026-0010', 17, NULL, 'LC-1788561385050-Callback', '9876541236', 'lc-1788561385050@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Callback', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'call', 'anytime', NULL, NULL, NULL, '2026-09-04 22:36:33.288', '2026-09-04 22:36:33.288', NULL, 'POOL', NULL),
(25, 'RRH-LD-2026-0011', 17, NULL, 'LC-1788561385050-General', '9876541237', 'lc-1788561385050@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - General', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'other', 'after_hours', NULL, NULL, NULL, '2026-09-04 22:36:36.316', '2026-09-04 22:36:36.316', NULL, 'POOL', NULL),
(26, 'RRH-LD-2026-0012', 17, NULL, 'LC-1788561385050-Seller', '9876541238', 'lc-1788561385050@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Seller', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'appraisal', 'immediate', NULL, NULL, NULL, '2026-09-04 22:36:38.628', '2026-09-04 22:36:38.628', NULL, 'POOL', NULL),
(27, 'RRH-LD-2026-0013', 17, NULL, 'LC-1788561385050-Consultation', '9876541239', 'lc-1788561385050@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Phase 5 lead lifecycle verification - Consultation', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'consultation', 'immediate', NULL, NULL, NULL, '2026-09-04 22:36:40.926', '2026-09-04 22:36:40.926', NULL, 'POOL', NULL),
(28, 'RRH-LD-2026-0014', 17, NULL, 'LC-Verify-1788561423934', '9876549999', 'lc-verify-1788561423934@local.test', 'WEBSITE', 'NEW', NULL, NULL, NULL, 'APARTMENT', NULL, NULL, NULL, 'Lead verification test - checking CRM storage', NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, 'other', 'anytime', NULL, NULL, NULL, '2026-09-04 22:37:07.367', '2026-09-04 22:37:07.367', NULL, 'POOL', NULL),
(29, 'RRH-LD-2026-0015', 1, 1, 'sandy', '7075196268', NULL, 'ORGANIC_SEARCH', 'DEMO_COMPLETED', 30, '2026-09-05 23:17:42.032', 'MANUAL_OVERRIDE', 'RESIDENTIAL_APARTMENT', 100000, 200000, 'tarnaka, hyderabad', NULL, 30, '2026-09-06 00:31:34.069', NULL, NULL, NULL, NULL, 0, '2026-09-06 01:17:41.777', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-09-05 23:17:42.033', '2026-09-06 00:31:34.071', NULL, 'DIRECT', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `LeadActivity`
--

CREATE TABLE `LeadActivity` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `activity_type` varchar(191) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `LeadActivity`
--

INSERT INTO `LeadActivity` (`id`, `lead_id`, `actor_id`, `activity_type`, `notes`, `created_at`) VALUES
(24, 14, 1, 'LEAD_CREATED', 'Lead RRH-LD-2026-0001 registered via SOCIAL_MEDIA', '2026-09-04 20:40:19.665'),
(25, 14, 30, 'NOTE_ADDED', 'Duplicate entry attempt via ORGANIC_SEARCH. Customer re-inquired.', '2026-09-05 23:15:44.345'),
(26, 29, 30, 'LEAD_CREATED', 'Lead RRH-LD-2026-0015 registered via ORGANIC_SEARCH', '2026-09-05 23:17:43.295'),
(27, 29, 30, 'STATUS_CHANGED', 'Status updated from ASSIGNED to CONTACTED: Updated directly from Daily Calling List', '2026-09-05 23:57:29.168'),
(28, 29, 30, 'STATUS_CHANGED', 'Status updated from CONTACTED to QUALIFIED: Updated directly from Daily Calling List', '2026-09-05 23:58:48.359'),
(29, 29, 30, 'DEMO_SCHEDULED', 'Status updated from QUALIFIED to DEMO_SCHEDULED', '2026-09-06 00:18:07.676'),
(30, 14, 1, 'DEMO_SCHEDULED', 'Status updated from QUALIFIED to DEMO_SCHEDULED', '2026-09-06 00:27:03.876'),
(31, 29, 30, 'QUALIFIED', 'Lead qualification details updated manually.', '2026-09-06 00:31:30.269'),
(32, 29, 30, 'DEMO_COMPLETED', 'Status updated from DEMO_SCHEDULED to DEMO_COMPLETED: not intrested', '2026-09-06 00:31:35.090');

-- --------------------------------------------------------

--
-- Table structure for table `LeadMatchingRequirement`
--

CREATE TABLE `LeadMatchingRequirement` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `property_type` varchar(191) NOT NULL,
  `location` varchar(191) NOT NULL,
  `max_budget` double NOT NULL,
  `min_bedrooms` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `LeadPropertyInterest`
--

CREATE TABLE `LeadPropertyInterest` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `MessageTemplate`
--

CREATE TABLE `MessageTemplate` (
  `id` int(11) NOT NULL,
  `template_key` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `body_text` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Notification`
--

CREATE TABLE `Notification` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `type` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `message` varchar(191) NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Notification`
--

INSERT INTO `Notification` (`id`, `employee_id`, `type`, `title`, `message`, `is_read`, `created_at`) VALUES
(2, 3, 'ROLE_CHANGED', '🏷️ Your Roles Have Been Updated', 'Your system roles have been updated by an administrator. Please log in again to apply changes.', 1, '2026-09-02 17:34:33.311'),
(3, 2, 'SYSTEM', 'Proposal Rejected', 'Your leave request for 9/2/2026 has been rejected.', 1, '2026-09-03 07:11:05.532'),
(4, 6, 'SYSTEM', 'Proposal Approved', 'Your late request for 9/4/2026 has been approved.', 1, '2026-09-04 09:15:17.068'),
(5, 6, 'SYSTEM', 'Proposal Approved', 'Your late request for 9/4/2026 has been approved.', 1, '2026-09-04 10:12:32.963'),
(6, 6, 'SYSTEM', 'Proposal Approved', 'Your late request for 9/4/2026 has been approved.', 1, '2026-09-04 10:12:35.890'),
(7, 5, 'SYSTEM_ALERT', 'Property Requires PM Assignment', 'Property RRH-PR-2026-0001 (SAMPLE — PLOT ) was created without an assigned PM. Location: K.V.Rangareddy', 0, '2026-09-04 20:15:35.488'),
(9, 5, 'SYSTEM_ALERT', 'Property Requires PM Assignment', 'Property RRH-PR-2026-0002 (Test Property) was created without an assigned PM. Location: Hyderabad', 0, '2026-09-05 05:13:32.178'),
(10, 5, 'SYSTEM_ALERT', 'Property Requires PM Assignment', 'Property RRH-PR-2026-0003 (Test Property) was created without an assigned PM. Location: Hyderabad', 0, '2026-09-05 05:15:28.009'),
(11, 5, 'SYSTEM_ALERT', 'Property Requires PM Assignment', 'Property RRH-PR-2026-0004 (Test Property Minimal) was created without an assigned PM. Location: Unknown', 0, '2026-09-05 05:21:48.505'),
(12, 5, 'SYSTEM_ALERT', 'Property Requires PM Assignment', 'Property RRH-PR-2026-0005 (nagadara grands) was created without an assigned PM. Location: Hyderabad', 0, '2026-09-05 05:35:55.676'),
(13, 1, 'SYSTEM_ALERT', 'Active Lead Re-Inquiry', 'Your active lead RRH-LD-2026-0001 (sandeep) submitted a new inquiry via ORGANIC_SEARCH.', 1, '2026-09-05 23:15:45.794'),
(14, 5, 'PASSWORD_RESET', '🔐 Your Password Has Been Reset', 'An administrator has reset your password to the default. Please log in and change it immediately.', 0, '2026-09-06 12:03:27.734'),
(15, 5, 'PASSWORD_RESET', '🔐 Your Password Has Been Reset', 'An administrator has reset your password to the default. Please log in and change it immediately.', 0, '2026-09-06 12:07:53.132'),
(16, 3, 'SYSTEM', 'Proposal Approved', 'Your leave request for 9/4/2026 has been approved.', 1, '2026-09-08 09:46:39.804');

-- --------------------------------------------------------

--
-- Table structure for table `Opportunity`
--

CREATE TABLE `Opportunity` (
  `id` int(11) NOT NULL,
  `opportunity_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `lead_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `property_id` int(11) DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `expected_value` double DEFAULT NULL,
  `probability` double DEFAULT 10,
  `budget_min` double DEFAULT NULL,
  `budget_max` double DEFAULT NULL,
  `expected_close_date` datetime(3) DEFAULT NULL,
  `drop_reason` text DEFAULT NULL,
  `owner_id` int(11) NOT NULL,
  `source` varchar(191) DEFAULT NULL,
  `campaign` varchar(191) DEFAULT NULL,
  `utm_source` varchar(191) DEFAULT NULL,
  `utm_medium` varchar(191) DEFAULT NULL,
  `utm_campaign` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Opportunity`
--

INSERT INTO `Opportunity` (`id`, `opportunity_code`, `company_id`, `branch_id`, `lead_id`, `project_id`, `property_id`, `booking_id`, `expected_value`, `probability`, `budget_min`, `budget_max`, `expected_close_date`, `drop_reason`, `owner_id`, `source`, `campaign`, `utm_source`, `utm_medium`, `utm_campaign`, `created_at`, `updated_at`) VALUES
(1, 'OPP-1788652333952-925', 1, NULL, 29, NULL, NULL, NULL, NULL, 10, NULL, NULL, NULL, NULL, 30, 'ORGANIC_SEARCH', NULL, NULL, NULL, NULL, '2026-09-05 23:52:13.953', '2026-09-05 23:52:13.953'),
(2, 'OPP-1788652336651-872', 1, NULL, 29, NULL, NULL, NULL, NULL, 10, NULL, NULL, NULL, NULL, 30, 'ORGANIC_SEARCH', NULL, NULL, NULL, NULL, '2026-09-05 23:52:16.652', '2026-09-05 23:52:16.652');

-- --------------------------------------------------------

--
-- Table structure for table `Payment`
--

CREATE TABLE `Payment` (
  `id` int(11) NOT NULL,
  `payment_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `installment_id` int(11) DEFAULT NULL,
  `amount` double NOT NULL,
  `payment_method` varchar(191) NOT NULL,
  `reference_number` varchar(191) DEFAULT NULL,
  `payment_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `notes` text DEFAULT NULL,
  `portal_payment_id` varchar(191) DEFAULT NULL,
  `external_transaction_id` varchar(191) DEFAULT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'CRM',
  `sync_status` varchar(191) NOT NULL DEFAULT 'LOCAL',
  `recorded_by_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PerformanceSnapshot`
--

CREATE TABLE `PerformanceSnapshot` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `snapshot_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `score` double NOT NULL DEFAULT 50,
  `tasks_completed` int(11) NOT NULL DEFAULT 0,
  `on_time_logins` int(11) NOT NULL DEFAULT 0,
  `late_logins` int(11) NOT NULL DEFAULT 0,
  `sub_target_reports` int(11) NOT NULL DEFAULT 0,
  `uninformed_absences` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Permission`
--

CREATE TABLE `Permission` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Permission`
--

INSERT INTO `Permission` (`id`, `name`, `description`) VALUES
(1, 'employees.create', NULL),
(2, 'employees.read', NULL),
(3, 'employees.update', NULL),
(4, 'employees.delete', NULL),
(5, 'employees.view_sensitive', NULL),
(6, 'employees.manage_default:all', NULL),
(7, 'employees.reset_password', NULL),
(8, 'leads.create', NULL),
(9, 'leads.read', NULL),
(10, 'leads.update', NULL),
(11, 'leads.delete', NULL),
(12, 'leads.assign', NULL),
(13, 'leads.bulk_upload', NULL),
(14, 'leads.distribution_monitor', NULL),
(15, 'leads.whatsapp_proposal', NULL),
(16, 'customers.create', NULL),
(17, 'customers.read', NULL),
(18, 'customers.update', NULL),
(19, 'customers.delete', NULL),
(20, 'customers.convert', NULL),
(21, 'customers.kyc_write', NULL),
(22, 'properties.create', NULL),
(23, 'properties.read', NULL),
(24, 'properties.update', NULL),
(25, 'properties.delete', NULL),
(26, 'properties.verify', NULL),
(27, 'properties.dm_polish', NULL),
(28, 'properties.md_approve', NULL),
(29, 'site_visits.create', NULL),
(30, 'site_visits.read', NULL),
(31, 'site_visits.verify', NULL),
(32, 'site_visits.assign_agent', NULL),
(33, 'site_visits.complete', NULL),
(34, 'projects.create', NULL),
(35, 'projects.read', NULL),
(36, 'projects.update', NULL),
(37, 'projects.delete', NULL),
(38, 'bookings.create', NULL),
(39, 'bookings.read', NULL),
(40, 'bookings.update', NULL),
(41, 'bookings.cancel', NULL),
(42, 'bookings.confirm', NULL),
(43, 'payments.create', NULL),
(44, 'payments.read', NULL),
(45, 'payments.update', NULL),
(46, 'payments.cancel', NULL),
(47, 'tasks.create', NULL),
(48, 'tasks.read', NULL),
(49, 'tasks.update', NULL),
(50, 'tasks.assign', NULL),
(51, 'attendance.read_own', NULL),
(52, 'attendance.scan', NULL),
(53, 'attendance.late_proposal', NULL),
(54, 'attendance.leave_proposal', NULL),
(55, 'attendance.proposals_queue', NULL),
(56, 'attendance.live_monitor', NULL),
(57, 'reports.create', NULL),
(58, 'reports.read_own', NULL),
(59, 'reports.read_team', NULL),
(60, 'reports.targets.configure', NULL),
(61, 'expenses.create', NULL),
(62, 'expenses.read_own', NULL),
(63, 'expenses.review', NULL),
(64, 'expenses.md_approve', NULL),
(65, 'expenses.mark_refunded', NULL),
(66, 'performance.read_own', NULL),
(67, 'performance.read_team', NULL),
(68, 'performance.history', NULL),
(69, 'admin.system_metrics', NULL),
(70, 'admin.audit_logs', NULL),
(71, 'admin.security_alerts', NULL),
(72, 'admin.emergency_lockdown', NULL),
(73, 'message_templates.manage', NULL),
(74, 'public.properties.read', NULL),
(75, 'public.leads.create', NULL),
(76, 'ai.search', NULL),
(77, 'documents.create', NULL),
(78, 'documents.read', NULL),
(79, 'documents.verify', NULL),
(80, 'documents.delete', NULL),
(81, 'complaints.create', NULL),
(82, 'complaints.read', NULL),
(83, 'complaints.update', NULL),
(84, 'complaints.assign', NULL),
(85, 'complaints.resolve', NULL),
(86, 'complaints.close', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `PMLocationAssignment`
--

CREATE TABLE `PMLocationAssignment` (
  `id` int(11) NOT NULL,
  `pm_id` int(11) NOT NULL,
  `location` varchar(191) NOT NULL,
  `level` varchar(191) NOT NULL DEFAULT 'CITY',
  `company_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PMReassignmentHistory`
--

CREATE TABLE `PMReassignmentHistory` (
  `id` int(11) NOT NULL,
  `site_visit_booking_id` int(11) NOT NULL,
  `reassigned_by_pm_id` int(11) NOT NULL,
  `reassigned_to_pm_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Project`
--

CREATE TABLE `Project` (
  `id` int(11) NOT NULL,
  `project_code` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(191) NOT NULL,
  `total_area` varchar(191) DEFAULT NULL,
  `launch_date` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PLANNING',
  `amenities` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`amenities`)),
  `assigned_pm_id` int(11) DEFAULT NULL,
  `slug` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `project_phase` varchar(191) DEFAULT NULL,
  `rera_number` varchar(191) DEFAULT NULL,
  `total_units` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Property`
--

CREATE TABLE `Property` (
  `id` int(11) NOT NULL,
  `property_code` varchar(191) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `title` varchar(191) NOT NULL,
  `description` text DEFAULT NULL,
  `brand_type` varchar(191) NOT NULL DEFAULT 'SONTHILLU',
  `category` varchar(191) NOT NULL DEFAULT 'VILLA',
  `price` double NOT NULL,
  `area_sqft` double NOT NULL,
  `location` varchar(191) NOT NULL,
  `address` text DEFAULT NULL,
  `bedrooms` int(11) DEFAULT NULL,
  `bathrooms` int(11) DEFAULT NULL,
  `facing` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  `assigned_pm_id` int(11) DEFAULT NULL,
  `digital_marketing_executive_id` int(11) DEFAULT NULL,
  `created_by_id` int(11) DEFAULT NULL,
  `verified_by_pm_at` datetime(3) DEFAULT NULL,
  `location_confirmed_by_pm` tinyint(1) NOT NULL DEFAULT 0,
  `dm_polished_at` datetime(3) DEFAULT NULL,
  `md_approved_at` datetime(3) DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `seo_title` varchar(191) DEFAULT NULL,
  `seo_keywords` varchar(191) DEFAULT NULL,
  `amenities` text DEFAULT NULL,
  `state` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  `locality` varchar(191) DEFAULT NULL,
  `pincode` varchar(191) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `listing_type` varchar(191) DEFAULT 'NEW',
  `possession_status` varchar(191) DEFAULT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `source` varchar(191) NOT NULL DEFAULT 'INTERNAL',
  `locked_until` datetime(3) DEFAULT NULL,
  `locked_by_booking_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Property`
--

INSERT INTO `Property` (`id`, `property_code`, `project_id`, `company_id`, `branch_id`, `title`, `description`, `brand_type`, `category`, `price`, `area_sqft`, `location`, `address`, `bedrooms`, `bathrooms`, `facing`, `status`, `assigned_pm_id`, `digital_marketing_executive_id`, `created_by_id`, `verified_by_pm_at`, `location_confirmed_by_pm`, `dm_polished_at`, `md_approved_at`, `rejection_reason`, `seo_title`, `seo_keywords`, `amenities`, `state`, `city`, `locality`, `pincode`, `latitude`, `longitude`, `listing_type`, `possession_status`, `slug`, `source`, `locked_until`, `locked_by_booking_id`, `created_at`, `updated_at`) VALUES
(4, 'RRH-PR-2026-0001', NULL, 1, 1, 'SAMPLE — PLOT ', NULL, 'SONTHILLU', 'APARTMENT', 10000, 250, 'Mathrusri Nagar, K.V.Rangareddy', NULL, NULL, 1, 'EAST', 'PENDING_VERIFICATION', NULL, NULL, 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, '24/7 Security, Lift / Elevator, Vastu Compliant, Jogging Track, Rainwater Harvesting, Broadband Ready', 'Telangana', 'K.V.Rangareddy', 'Mathrusri Nagar', '500049', NULL, NULL, 'RESALE', NULL, 'sample-plot-mathrusri-nagar-kvrangareddy-apartment', 'INTERNAL', NULL, NULL, '2026-09-04 20:15:32.534', '2026-09-04 20:15:32.534'),
(6, 'RRH-PR-2026-0002', NULL, 1, 1, 'Test Property', 'test', 'SONTHILLU', 'APARTMENT', 5000000, 1200, 'KPHB', 'KPHB Colony', 2, 2, 'East', 'PENDING_VERIFICATION', NULL, NULL, 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Telangana', 'Hyderabad', NULL, NULL, NULL, NULL, 'NEW', NULL, 'test-property-kphb-apartment', 'INTERNAL', NULL, NULL, '2026-09-05 05:13:31.783', '2026-09-05 05:13:31.783'),
(7, 'RRH-PR-2026-0003', NULL, 1, 1, 'Test Property', 'test', 'SONTHILLU', 'APARTMENT', 5000000, 1200, 'KPHB', 'KPHB Colony', 2, 2, 'East', 'PENDING_VERIFICATION', NULL, NULL, 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Telangana', 'Hyderabad', NULL, NULL, NULL, NULL, 'NEW', NULL, 'test-property-kphb-apartment-1', 'INTERNAL', NULL, NULL, '2026-09-05 05:15:27.393', '2026-09-05 05:15:27.393'),
(8, 'RRH-PR-2026-0004', NULL, 1, 1, 'Test Property Minimal', NULL, 'SONTHILLU', 'APARTMENT', 5000000, 1200, 'KPHB', NULL, NULL, NULL, NULL, 'PENDING_VERIFICATION', NULL, NULL, 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'NEW', NULL, 'test-property-minimal-kphb-apartment', 'INTERNAL', NULL, NULL, '2026-09-05 05:21:45.837', '2026-09-05 05:21:45.837'),
(9, 'RRH-PR-2026-0005', NULL, 1, 1, 'nagadara grands', NULL, 'SONTHILLU', 'APARTMENT', 750000, 150, 'Ibrahim Bagh Lines, Hyderabad', NULL, NULL, 2, 'EAST', 'PENDING_VERIFICATION', NULL, NULL, 1, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 'Telangana', 'Hyderabad', 'Ibrahim Bagh Lines', '500031', NULL, NULL, 'RESALE', NULL, 'nagadara-grands-ibrahim-bagh-lines-hyderabad-apartment', 'INTERNAL', NULL, NULL, '2026-09-05 05:35:52.079', '2026-09-05 05:35:52.079');

-- --------------------------------------------------------

--
-- Table structure for table `PropertyApartmentDetails`
--

CREATE TABLE `PropertyApartmentDetails` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `tower` varchar(191) DEFAULT NULL,
  `block` varchar(191) DEFAULT NULL,
  `floor` varchar(191) DEFAULT NULL,
  `unit_number` varchar(191) DEFAULT NULL,
  `flat_number` varchar(191) DEFAULT NULL,
  `bhk` varchar(191) DEFAULT NULL,
  `balcony_count` int(11) DEFAULT NULL,
  `has_study_room` tinyint(1) DEFAULT 0,
  `has_servant_room` tinyint(1) DEFAULT 0,
  `carpet_area` double DEFAULT NULL,
  `built_up_area` double DEFAULT NULL,
  `super_built_up_area` double DEFAULT NULL,
  `parking_included` tinyint(1) DEFAULT 0,
  `parking_type` varchar(191) DEFAULT NULL,
  `parking_slots` int(11) DEFAULT NULL,
  `structure_type` varchar(191) DEFAULT NULL,
  `flooring` varchar(191) DEFAULT NULL,
  `kitchen_type` varchar(191) DEFAULT NULL,
  `windows` varchar(191) DEFAULT NULL,
  `doors` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PropertyApartmentDetails`
--

INSERT INTO `PropertyApartmentDetails` (`id`, `property_id`, `tower`, `block`, `floor`, `unit_number`, `flat_number`, `bhk`, `balcony_count`, `has_study_room`, `has_servant_room`, `carpet_area`, `built_up_area`, `super_built_up_area`, `parking_included`, `parking_type`, `parking_slots`, `structure_type`, `flooring`, `kitchen_type`, `windows`, `doors`) VALUES
(2, 6, 'A', NULL, '2', NULL, NULL, '2', NULL, 0, 0, 1000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(3, 7, 'A', NULL, '2', NULL, NULL, '2', NULL, 0, 0, 1000, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 9, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 0, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `PropertyImage`
--

CREATE TABLE `PropertyImage` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `image_url` varchar(191) NOT NULL,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `uploaded_by_id` int(11) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `alt_text` varchar(191) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PropertyImage`
--

INSERT INTO `PropertyImage` (`id`, `property_id`, `image_url`, `is_primary`, `uploaded_by_id`, `sort_order`, `alt_text`, `status`, `created_at`) VALUES
(2, 4, '/uploads/properties/4/images/8cc11899-f9ba-4122-a4a0-09dd8a6af8f2.webp', 0, 1, 1, 'SAMPLE — PLOT  - Photo 2', 'PENDING', '2026-09-04 20:15:45.077'),
(3, 4, '/uploads/properties/4/images/0182a418-8b5d-4286-8cd4-f42f4ecf0345.webp', 0, 1, 2, 'SAMPLE — PLOT  - Photo 3', 'PENDING', '2026-09-04 20:15:52.585'),
(4, 4, '/uploads/properties/4/images/4bed0292-f21b-403f-aaf0-0d8ad4b9aa11.webp', 0, 1, 3, 'SAMPLE — PLOT  - Photo 4', 'PENDING', '2026-09-04 20:15:55.580'),
(5, 4, '/uploads/properties/4/images/f97ef9dd-4752-4977-9b40-d674ebab1a91.webp', 0, 1, 4, 'SAMPLE — PLOT  - Photo 5', 'PENDING', '2026-09-04 20:15:58.779'),
(6, 4, '/uploads/properties/4/images/a37925d3-094d-4a35-ab4c-7e9a10a33463.webp', 0, 1, 5, 'SAMPLE — PLOT  - Photo 6', 'PENDING', '2026-09-04 20:16:02.286'),
(7, 4, '/uploads/properties/4/images/8106da7f-c609-43f7-b49f-97a65e0156eb.webp', 0, 1, 6, 'SAMPLE — PLOT  - Photo 7', 'PENDING', '2026-09-04 20:16:05.288'),
(8, 4, '/uploads/properties/4/images/4ad0c409-3d5b-4368-be68-8272a63bbd25.webp', 0, 1, 7, 'SAMPLE — PLOT  - Photo 8', 'PENDING', '2026-09-04 20:16:09.379'),
(9, 4, '/uploads/properties/4/images/657a4750-575e-4758-b5ed-4cb4a37efe3d.webp', 0, 1, 8, 'SAMPLE — PLOT  - Photo 9', 'PENDING', '2026-09-04 20:16:12.776'),
(10, 4, '/uploads/properties/4/images/39539622-7912-4df1-bd1f-d9753f37c840.webp', 0, 1, 9, 'SAMPLE — PLOT  - Photo 10', 'PENDING', '2026-09-04 20:16:15.238'),
(11, 4, '/uploads/properties/4/images/9d433710-8588-4bf1-b102-3cba9ad93850.webp', 0, 1, 10, 'SAMPLE — PLOT  - Photo 11', 'PENDING', '2026-09-04 20:16:18.986'),
(12, 4, '/uploads/properties/4/images/bc9539b8-1881-42ae-ad98-0489003b73a7.webp', 0, 1, 11, 'SAMPLE — PLOT  - Photo 12', 'PENDING', '2026-09-04 20:16:22.980'),
(13, 4, '/uploads/properties/4/images/f65b403f-ec56-483c-9480-71e18fb0f2a4.webp', 0, 1, 12, 'SAMPLE — PLOT  - Photo 13', 'PENDING', '2026-09-04 20:16:25.288'),
(14, 4, '/uploads/properties/4/images/7dd50a59-ccdc-422a-88c4-d2526808c46f.webp', 0, 1, 13, 'SAMPLE — PLOT  - Photo 14', 'PENDING', '2026-09-04 20:16:29.279'),
(15, 4, '/uploads/properties/4/images/65393e60-db06-4976-8060-502d190dc8c2.webp', 0, 1, 14, 'SAMPLE — PLOT  - Photo 15', 'PENDING', '2026-09-04 20:16:31.494'),
(16, 4, '/uploads/properties/4/images/085fad0b-a3df-4512-99b8-a70e09ed0e0c.webp', 0, 1, 15, 'SAMPLE — PLOT  - Photo 16', 'PENDING', '2026-09-04 20:16:33.878');

-- --------------------------------------------------------

--
-- Table structure for table `PropertyPlotDetails`
--

CREATE TABLE `PropertyPlotDetails` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `plot_number` varchar(191) DEFAULT NULL,
  `phase` varchar(191) DEFAULT NULL,
  `sector_block` varchar(191) DEFAULT NULL,
  `survey_number` varchar(191) DEFAULT NULL,
  `subdivision_number` varchar(191) DEFAULT NULL,
  `length` double DEFAULT NULL,
  `width` double DEFAULT NULL,
  `frontage` double DEFAULT NULL,
  `dimension_string` varchar(191) DEFAULT NULL,
  `north_boundary` varchar(191) DEFAULT NULL,
  `south_boundary` varchar(191) DEFAULT NULL,
  `east_boundary` varchar(191) DEFAULT NULL,
  `west_boundary` varchar(191) DEFAULT NULL,
  `road_width` double DEFAULT NULL,
  `number_of_roads` int(11) DEFAULT NULL,
  `is_corner` tinyint(1) DEFAULT 0,
  `is_park_facing` tinyint(1) DEFAULT 0,
  `is_main_road_facing` tinyint(1) DEFAULT 0,
  `near_entrance` tinyint(1) DEFAULT 0,
  `near_clubhouse` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PropertyPricing`
--

CREATE TABLE `PropertyPricing` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `base_price_per_unit` double DEFAULT NULL,
  `base_price` double NOT NULL DEFAULT 0,
  `facing_premium` double DEFAULT 0,
  `corner_premium` double DEFAULT 0,
  `park_facing_premium` double DEFAULT 0,
  `road_facing_premium` double DEFAULT 0,
  `floor_rise_charge` double DEFAULT 0,
  `development_charges` double DEFAULT 0,
  `maintenance_charges` double DEFAULT 0,
  `documentation_charges` double DEFAULT 0,
  `registration_charges` double DEFAULT 0,
  `other_charges` double DEFAULT 0,
  `discount` double DEFAULT 0,
  `final_price` double NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PropertyPricing`
--

INSERT INTO `PropertyPricing` (`id`, `property_id`, `base_price_per_unit`, `base_price`, `facing_premium`, `corner_premium`, `park_facing_premium`, `road_facing_premium`, `floor_rise_charge`, `development_charges`, `maintenance_charges`, `documentation_charges`, `registration_charges`, `other_charges`, `discount`, `final_price`) VALUES
(2, 6, NULL, 4500000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5000000),
(3, 7, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(4, 8, NULL, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(5, 9, 5000, 750000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 750000);

-- --------------------------------------------------------

--
-- Table structure for table `PropertyPublication`
--

CREATE TABLE `PropertyPublication` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT 0,
  `published_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `PropertyVerificationLog`
--

CREATE TABLE `PropertyVerificationLog` (
  `id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `actor_id` int(11) NOT NULL,
  `from_status` varchar(191) NOT NULL,
  `to_status` varchar(191) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PropertyVerificationLog`
--

INSERT INTO `PropertyVerificationLog` (`id`, `property_id`, `actor_id`, `from_status`, `to_status`, `notes`, `created_at`) VALUES
(1, 4, 1, 'DRAFT', 'PENDING_VERIFICATION', 'Property RRH-PR-2026-0001 submitted. Assigned to PM ID Queue for On-Site Verification.', '2026-09-04 20:15:33.737'),
(3, 6, 1, 'DRAFT', 'PENDING_VERIFICATION', 'Property RRH-PR-2026-0002 submitted. Assigned to PM ID Queue for On-Site Verification.', '2026-09-05 05:13:32.012'),
(4, 7, 1, 'DRAFT', 'PENDING_VERIFICATION', 'Property RRH-PR-2026-0003 submitted. Assigned to PM ID Queue for On-Site Verification.', '2026-09-05 05:15:27.827'),
(5, 8, 1, 'DRAFT', 'PENDING_VERIFICATION', 'Property RRH-PR-2026-0004 submitted. Assigned to PM ID Queue for On-Site Verification.', '2026-09-05 05:21:47.206'),
(6, 9, 1, 'DRAFT', 'PENDING_VERIFICATION', 'Property RRH-PR-2026-0005 submitted. Assigned to PM ID Queue for On-Site Verification.', '2026-09-05 05:35:54.145');

-- --------------------------------------------------------

--
-- Table structure for table `PublicApiKey`
--

CREATE TABLE `PublicApiKey` (
  `id` int(11) NOT NULL,
  `api_key` varchar(191) NOT NULL,
  `company_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PublicApiKey`
--

INSERT INTO `PublicApiKey` (`id`, `api_key`, `company_id`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'sk_pro_llu_0d78fcb987f772be80338ddc0649b69e', 17, 1, '2026-09-04 19:43:36.781', '2026-09-04 19:43:36.781');

-- --------------------------------------------------------

--
-- Table structure for table `PushSubscription`
--

CREATE TABLE `PushSubscription` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth` varchar(191) NOT NULL,
  `user_agent` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `PushSubscription`
--

INSERT INTO `PushSubscription` (`id`, `employee_id`, `endpoint`, `p256dh`, `auth`, `user_agent`, `created_at`) VALUES
(1, 1, 'https://fcm.googleapis.com/fcm/send/emzEF8oeJ3s:APA91bFxtX1ju16QoOBI13qoF_Z7DxrAr03B4oIUfMqyVUAoTanBpVE_VdK6YzSua13sUCpeDwCQhwccGkDmNRBqRjX0MCMPJwhchOnfg-qpZIZx1D9WS5gQZ84cFbntq9xU93aBKOoE', 'BPx0ZHpoMaUOQnFEEgTEii7YXqjrs-rv7MOI1-Hv_Qbx5i8819ecghQ20awvpwJQUWtaKnNN8Lby5MU5zPv1n-w', 'P6V4sei-5RJw1v4MswXGRg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-01 01:40:48.822'),
(2, 1, 'https://fcm.googleapis.com/fcm/send/dmz8QhC_cr4:APA91bFPZZB7IUvaHsvWWSAEJnjYwrfVMff1im0DY5CnkYOlvxO7zwN0EdWtwFiIJX5FZW22SqUG4Py89p3wHgz6tcRsqBAdgpjkoJJuRYDm3jZirck8y0Fqsf6kIlFP7PLGA4hwOX5b', 'BBduND1xKSZhL-CoTxGPewj_Zw2pJLUhAe_SqHCGSB-FgvIwe6Qq083d1WRWxd9QM9aZ0ivKbke3W0gniXVFyco', '89dcZLMwyECtcxCq3BOJ7A', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-01 01:43:20.891'),
(4, 2, 'https://fcm.googleapis.com/fcm/send/dvVQID5oKLE:APA91bEjC9c8lfbQ6PYnFkv5TXpaHVQRFyIZeSYgtEhW_MEEPtUOk-nHCV3bgp37Hf4EqMji1v-eG9S8NMBsu3tjqkN2TptWh6c1vgXfMHW4_evxYHRhOM2oPEUpAIQGZLVKeWVpruNO', 'BAqBwxjqvDm0tdVO6lUcJVjfEzl61kd83p6kz-6qHtHgTCumAT9BgDrzZmsjNVaETfSBKyDP2IRFYYOeWb1GUS8', 'fHARAv0SWbKu8hf02rmWQQ', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-01 05:09:14.055'),
(5, 4, 'https://fcm.googleapis.com/fcm/send/fMElTCzTkDk:APA91bEIUWKh1HiQzzBlYwEEss95ii3zcV9sc60-KXV5C29YiIk1Ao3gHka_OnF6YpeoOP3EkB0JPlxDq8AbpYjHECdMTC79hLIX3sXEHW6qJBH_s5l51ttwQ6ps2_UBRPoJKQYUc-rX', 'BIjwBOU2XJCeFCA9jcvjcgHjwmEW7vnQohNYUxkQ9Wq7IQk7n7bvjg4rnEmzWM8WbV7jd0z1yyD0FggTIynd8nQ', 'VhZUnY6KD-E5qqHwsI4Oxw', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36', '2026-09-01 05:12:45.848'),
(6, 4, 'https://fcm.googleapis.com/fcm/send/cbQeTLb5AJQ:APA91bFwYKcjdUXogq2GhKvMPteDFKNtriItkGqvtNLuHWncUb29G7iMnoi12xwdb5hOC1iBEY2pCJ6JjU8dGx6tw2xIxBpU26lIlsSYKlJ8CPofqAX7pBLdWUtllxPpldtvMtXzOF4G', 'BKS0gGNoK12vI5t5yJdk2OMawROdDCqBhS-XWe-fr3gn39xn53MpqGIoOsqUuw25ev00oQF7fjTrpWFGos6E--Y', 'IaMxtMaIoTzym-kWHIE7wA', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-09-01 05:56:25.471'),
(9, 7, 'https://fcm.googleapis.com/fcm/send/c6WJ-EcnAWY:APA91bH9WqYARqc3qTPzjVf3XawR0fn7Y7GOcPeJID99N2KZ9A2-jXoYxjtyO_rbqzoWuW-BimdFI9LIP2hIv7fI8LCic-e42-iG9HPNE4XJvfVAcpOXLREhP2VyVfBNdQejYXkgMBiz', 'BM38_K89CGEt2S9mqQjs6IwFgHSsTpwbV1by85OsDh8ATdVkq67hY2oS4cdw-weXP1O51mXhc40wYGjqN-oLaXw', '3rniUmaz0e7RwpmFHfeLKA', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-01 10:12:11.204'),
(11, 7, 'https://fcm.googleapis.com/fcm/send/cmRNBxWDzyM:APA91bHUSOCJ6LjstqbEjZTolfL3GLHFdBhZusCwPhs6B8QlbFRJx_NkP4-QGXGVil6J-5p-TkTKzQ6S4MEtHKTW0QyFVVKMcRkKZ_Q5Xdqs1EGiHto3wOMzfOno2XKuFrnAIII6c2G9', 'BHnPxeyffr3MYwClWPARmWHz3jmkOWCktIdif12CXiiRN-5fg_t8fOe5U4b5vihM-tcEne-q7D0SfGDhXUex_FM', 'n5k5gd1_dgsQuA49rQA9Mw', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-02 04:49:58.734'),
(12, 1, 'https://fcm.googleapis.com/fcm/send/dp9foODjF2U:APA91bGZT9OBHPvVIBpcFZlwoLSx0rUoQjc-lBNOs9rLSiy1C73kLCUozHEpAnk8Y25B0CzQ0LqZrfsdZ46aCI29B4hHOPkpSJju1VS4QxrNdqMaYZM8ckuwYEV2n7dCK_TOMCDGUTDN', 'BH8ym2YyXO-jFFUB7ycg8MmR4hr1YGFPvslAcA94ChKjrOrYvRW7nGliOURjNUwO8bHD1Lr16QrX8TF6vrAeHoI', 'UuExnFC9NhRg1TXGs18tLw', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-02 07:44:14.767'),
(13, 2, 'https://fcm.googleapis.com/fcm/send/f3EDni3UL34:APA91bETxQgxVJ7DLUWAoglVbyYaQ4YJHomz8S38fOcPhFY3_n7rZXMBTzE8aa8Znhc_cYtll8NwPQe3a7LOFZLCSfA5usq8sF7_TlysHfOx3WYC7gDIdomPf8KBGZRWSYijgZ8aVHZs', 'BPO_DPHSC2T1TefNbXnK5dyRMBx8YJZkYLTtVQIcCqIbEsep5rq9Q7MAyEcS-OxQB0xGb9KSPIilu3K4r9Q9g_8', '0rR4dUl6jgRWiNbQZe2DpA', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-02 08:46:19.108'),
(14, 7, 'https://fcm.googleapis.com/fcm/send/fqpYdUkr9oY:APA91bHkrHZzbiWf_hvWBg7OKXfFzyw_VdUIKWW5a1dAoReWBWi6e6JacpiZZQnIAsZ4ZloPC8HaZnLS5ieH_ZOTopljQgpWCJmoQ6oFCbU4fshsSeWlKtAOQNP_vBHXeapZvy-dO5qi', 'BPsK2eA5p994lk-OQt2NFrnmmSf9GcxXnhZUhZmVxuDUTrzU5N-iToN74RxeH7GsCO6Ct2PMqLdFB3eq18Sgnpw', '9D_bDACSPWIdEGfsQolixQ', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-02 12:47:27.256'),
(15, 1, 'https://fcm.googleapis.com/fcm/send/cqwVazAznjk:APA91bHToP5F8K_asMWXTEbr1jWsPcL326tcl8IQThRNvABv2yl_w1fPR3CpAr1OzbotmG6kUEX1Q0PxriVR-_F9EHs077cLF0yIGPLb-cE9F-iWHXfp1np9Jb4r__T4FcxSwZWf95L9', 'BBTF-b4nPqD8sl90fNvSlcpdV8W0XgeDBiBWB8sZkT15RlrahYJvn1w8aNncKLw7mdobM-1zskWue089ir0iYIY', 'K_q1wvk0VHKWULTVgG3xnA', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-02 17:59:00.041'),
(16, 1, 'https://fcm.googleapis.com/fcm/send/doRaKdGYJTo:APA91bFeIvjbZgTbU22hR9oJjiYtxYc8uWHD1aM4E2kHYrk7wPbmbeR5tqXONLxDTjx3dF1DZ9N_j08-YexK_HmhYCl36X3SWLsRQlRNT5pi0aCSvJn8R03LMFpTvqKonii99rPVgE_p', 'BKsSBQOmXkEhhdBRI95xtzNM3kYeTqbSEatifFZndIBCHIrWhTxd1cLWwcT61-NzbCCzj90T3MC3AyGJRKAHYXQ', 'GyDcFYU893Xf2kfXsg1NoQ', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-03 02:17:04.464'),
(17, 1, 'https://fcm.googleapis.com/fcm/send/cdHMAtANKUw:APA91bFGhyu9Q2EvBTpDuw91rApjeMbTIzw1E8csOAPioLn8yeZJQ9lEEw3zLoVplq5j0xEPjjK7IstKor07kqGMD5WukNcABGhSgJyDlrlj2W_v34Z3LY2CB9A3MmVc9eM1hOMAguFT', 'BP5U7NO9GyIl9myPcdNMd8ty_3t6w_CImtjetPMsXTg2IMBUelyB9nDMvCwvV22V-Ya2Gc0e21pQB1bL6DTWUPc', 'Cep85WlsOY0oAG8ROs6X8g', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-03 04:51:40.016'),
(18, 1, 'https://fcm.googleapis.com/fcm/send/eAql5OKkdsM:APA91bHYot5CUtorw8c5d6CzW9__ZbNjC5K6EoO38wE7mbZdyvo5T6T_qOWwNa9wTDP7UGMC_gc7Li5aZGjtuUvLD1IQp0OTNph5v7ZJxiPvnFz3g-NAcAnsjqdaVWRFZSnJN7-rMNB-', 'BN65Oora36UALJWIUx9zUVa0ClLiODgnz-PWQ_GvVwRZzzrLdVmJ0ZMP-M-v-2ktPOrP6cODJ6bOAP4HE0nigmE', 'evHGrAniHkwJQPv3QwXL7w', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36', '2026-09-03 05:45:08.436'),
(19, 1, 'https://fcm.googleapis.com/fcm/send/f8YJ4vN9PZ0:APA91bFzBZVS68k_WOKYFLqBV794addPUpggz7IgcD-RJRoIDw149lZ1muQVLAIz6dv0jcKUtyl_wp3weDsoYWtwK4j5Ja7Wj8fv4BZ2WXRAq61d3iuL-QoOX8973wCVZhjCdMKYXTcS', 'BEMqmKDdeQwYHQ_-0F0upXaamPo5zcDivkoqAl-ZziLI8pjt17b_nImEdzipUFBjBP6ByeoBcTNi8d_DGtu99S8', 'zpNfAq8_pKOdScASATnRGA', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-03 07:14:37.090'),
(20, 1, 'https://fcm.googleapis.com/fcm/send/cAEqEgtD6dQ:APA91bHZ3vxWyRXT1xtc9wMFUeFs3vvBAZCxoz7s4_5a8W8lqLN_jzuhJ0FJLK477g25jqeM7RlJ-P1Qus-EYiv6SacClItBahWRDPHUP0kJ18pTeiPnnMH9SrQ0-mn_wqlOyyjZ-ibN', 'BI3_AzX9HPb1RTQlCDNJSWlWwn8oo1CZqFp7VIG11r8BG_bykgkLKoo-eEhPA01d51MHVQI-uu4Y3jXqerz5bmo', '378udigALXfhKf-o1FbnIg', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-03 07:15:10.182'),
(21, 6, 'https://fcm.googleapis.com/fcm/send/fHDU_wnLEno:APA91bG0OzfKA9XnG_i5QYjquBaKbB9ayxQOTy-f9qi63igx5fJ682l47w6n3Kw-MkHoabkuGDTHA1pKn-BDoK6nJLETztNYJJzX_sKrYP9o4SS6R_Uu1oLOhez9iapIeTXYY7WG-fI9', 'BAVaHmZrKqovYdnRlQoxNTJF96QjrcK6DGGPvsibykTOtPJAqqLe8c487gG0YXh1bFNRv3JXkhNgICfqOn3BdBU', 'c0rFLusxA5-EqYYe--3sMw', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-03 12:20:52.460'),
(22, 1, 'https://fcm.googleapis.com/fcm/send/eFC_1191Q6Y:APA91bFAttzb2OIiLhcw_26USvOfzepr21N9pOu_uLqGOpXlrh67bZkDL9AMot26ihX47gDBF09QM58-AZwBd7J3dMYzvhuI6bf0Eb9NQxXvZ8L0vW-voPAhSX8m-zr4Jxl6LuKk31Oh', 'BEy979C_EJmiYqLnN7_-TtRrCPszD-7YW6YLOetD3YBd70YwmT69JvCIr4oh2YVcxenr9TNCYGKHHgmJxp0khHg', 'eyOE6Bq8w103GTR2YQ662Q', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-04 06:48:54.306'),
(23, 1, 'https://fcm.googleapis.com/fcm/send/dVnL8qT_42g:APA91bFdZIcvTs9-m3Qj0RAeNHavOJxX29-IFAEbUhlj1RYWXYPDDqAYDm9OsOYBdbMcpWjM_kk7RZfGEuwxee-sM7I6OOBbI8itxVyoVc68U4M0ZlEWj1kucTdz82gqR95oWaj0qBKL', 'BICS2St3Jd18J7fWtdiScJOKvOXNH_tprKPZPAvJCodxvUx-qRrLt5I2TDF81X3hyjflwBRAxDulm6GeEmXACV0', '1Z9Fq7xGKZomPzzXER3O6Q', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Mobile Safari/537.36', '2026-09-04 06:48:56.846'),
(24, 1, 'https://fcm.googleapis.com/fcm/send/foMzfvOC5oA:APA91bHB1afo0scOINnqNWs0kqKQRDrgr5BEMdOIxGM1Gl-SEUAjwJS9oKWK-17HGLKzEVHigzG2J_lu7mWbyMoDJzuoPKBFikUozD6sGr02lzA4CXNcYsLuajLW1vAq6hGciDF0HAKc', 'BPc1YwM8mB3qHLrnR4qJiStlq0Gbh0ESVWjPRFOkjGbjR41CoqlLhBIQez3WSpuHblm7YVa2o9atVwGDSKtiUJU', 'Oq7ROGgpcIqNisKiu_lSaQ', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-09 04:26:12.502'),
(25, 6, 'https://fcm.googleapis.com/fcm/send/eZjUcYlC0Ic:APA91bFBpueabxRAOJNGjhziNHinNoTt4w8Va-nR6Ag39PtphovAfxtwGpm4Ao6myGN6EmVp2O2JmpP1KbrLx7er-JI4DhCjrOYmhNs37WKKntL7k5pZtZQSB7MiQXRwd8ixgdLxcDUq', 'BA_x5mX7B-uldKsBN8K-EQjTNdGYBSLvACvv_GjsRchj2z66j9ugBIbp6ad_GYPQ76XG2h78YpCNxbH2T-M0uUM', '9NgaHIClnm7zRpqjA7sGTg', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36', '2026-09-10 12:16:15.301');

-- --------------------------------------------------------

--
-- Table structure for table `Role`
--

CREATE TABLE `Role` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `is_invisible` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Role`
--

INSERT INTO `Role` (`id`, `name`, `is_system`, `is_invisible`) VALUES
(1, 'Managing director', 1, 0),
(2, 'Admin (Technical)', 1, 1),
(3, 'HR', 0, 0),
(4, 'marketing director', 0, 0),
(5, 'project managers', 0, 0),
(6, 'Digital lead operator', 0, 0),
(7, 'telecallers', 0, 0),
(8, 'Digital Marketing head(manager)', 0, 0),
(9, 'accountant', 0, 0),
(10, 'Agent', 0, 0),
(11, 'digital marketing executive', 0, 0),
(12, 'Sales manager', 0, 0),
(13, 'Channel partner manager', 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `RolePermission`
--

CREATE TABLE `RolePermission` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `RolePermission`
--

INSERT INTO `RolePermission` (`role_id`, `permission_id`) VALUES
(1, 1),
(2, 1),
(3, 1),
(1, 2),
(2, 2),
(3, 2),
(1, 3),
(2, 3),
(3, 3),
(1, 4),
(1, 5),
(3, 5),
(9, 5),
(1, 6),
(1, 7),
(2, 7),
(3, 7),
(1, 8),
(4, 8),
(6, 8),
(7, 8),
(13, 8),
(1, 9),
(4, 9),
(5, 9),
(6, 9),
(7, 9),
(8, 9),
(11, 9),
(12, 9),
(13, 9),
(1, 10),
(4, 10),
(6, 10),
(7, 10),
(11, 10),
(12, 10),
(13, 10),
(1, 11),
(4, 11),
(1, 12),
(4, 12),
(6, 12),
(12, 12),
(1, 13),
(4, 13),
(6, 13),
(1, 14),
(6, 14),
(12, 14),
(1, 15),
(7, 15),
(12, 15),
(1, 16),
(2, 16),
(4, 16),
(6, 16),
(1, 17),
(2, 17),
(4, 17),
(5, 17),
(6, 17),
(7, 17),
(10, 17),
(12, 17),
(13, 17),
(1, 18),
(2, 18),
(4, 18),
(5, 18),
(6, 18),
(7, 18),
(10, 18),
(12, 18),
(13, 18),
(1, 19),
(2, 19),
(4, 19),
(6, 19),
(1, 20),
(2, 20),
(4, 20),
(6, 20),
(7, 20),
(10, 20),
(1, 21),
(2, 21),
(3, 21),
(9, 21),
(1, 22),
(2, 22),
(5, 22),
(1, 23),
(2, 23),
(5, 23),
(8, 23),
(13, 23),
(1, 24),
(2, 24),
(5, 24),
(1, 25),
(2, 25),
(1, 26),
(2, 26),
(5, 26),
(1, 27),
(2, 27),
(4, 27),
(8, 27),
(1, 28),
(2, 28),
(4, 28),
(1, 29),
(6, 29),
(7, 29),
(13, 29),
(1, 30),
(4, 30),
(5, 30),
(7, 30),
(10, 30),
(11, 30),
(12, 30),
(13, 30),
(1, 31),
(6, 31),
(1, 32),
(5, 32),
(12, 32),
(1, 33),
(10, 33),
(13, 33),
(1, 34),
(2, 34),
(5, 34),
(1, 35),
(2, 35),
(5, 35),
(7, 35),
(13, 35),
(1, 36),
(2, 36),
(5, 36),
(1, 37),
(2, 37),
(5, 37),
(1, 38),
(2, 38),
(6, 38),
(1, 39),
(2, 39),
(4, 39),
(5, 39),
(6, 39),
(7, 39),
(9, 39),
(10, 39),
(12, 39),
(1, 40),
(2, 40),
(6, 40),
(9, 40),
(1, 41),
(1, 42),
(1, 43),
(2, 43),
(6, 43),
(9, 43),
(1, 44),
(2, 44),
(4, 44),
(5, 44),
(6, 44),
(7, 44),
(9, 44),
(10, 44),
(1, 45),
(2, 45),
(9, 45),
(1, 46),
(2, 46),
(9, 46),
(1, 47),
(3, 47),
(4, 47),
(5, 47),
(12, 47),
(1, 48),
(3, 48),
(5, 48),
(7, 48),
(10, 48),
(11, 48),
(12, 48),
(13, 48),
(1, 49),
(3, 49),
(5, 49),
(7, 49),
(10, 49),
(11, 49),
(12, 49),
(13, 49),
(1, 50),
(3, 50),
(5, 50),
(12, 50),
(1, 51),
(7, 51),
(10, 51),
(11, 51),
(13, 51),
(1, 52),
(7, 52),
(10, 52),
(11, 52),
(13, 52),
(1, 53),
(7, 53),
(1, 54),
(7, 54),
(1, 55),
(3, 55),
(1, 56),
(3, 56),
(1, 57),
(7, 57),
(10, 57),
(11, 57),
(1, 58),
(5, 58),
(7, 58),
(10, 58),
(11, 58),
(13, 58),
(1, 59),
(3, 59),
(4, 59),
(12, 59),
(1, 60),
(4, 60),
(6, 60),
(8, 60),
(12, 60),
(1, 61),
(1, 62),
(1, 63),
(9, 63),
(1, 64),
(1, 65),
(9, 65),
(1, 66),
(7, 66),
(10, 66),
(11, 66),
(13, 66),
(1, 67),
(3, 67),
(4, 67),
(8, 67),
(12, 67),
(1, 68),
(1, 69),
(2, 69),
(1, 70),
(2, 70),
(1, 71),
(2, 71),
(1, 72),
(2, 72),
(1, 73),
(1, 74),
(1, 75),
(1, 76),
(2, 76),
(1, 77),
(2, 77),
(3, 77),
(4, 77),
(5, 77),
(6, 77),
(9, 77),
(1, 78),
(2, 78),
(3, 78),
(4, 78),
(5, 78),
(6, 78),
(7, 78),
(9, 78),
(10, 78),
(1, 79),
(2, 79),
(9, 79),
(1, 80),
(2, 80),
(1, 81),
(2, 81),
(5, 81),
(10, 81),
(1, 82),
(2, 82),
(5, 82),
(6, 82),
(9, 82),
(10, 82),
(1, 83),
(2, 83),
(5, 83),
(6, 83),
(10, 83),
(1, 84),
(2, 84),
(5, 84),
(10, 84),
(1, 85),
(2, 85),
(5, 85),
(10, 85),
(1, 86),
(2, 86),
(5, 86),
(10, 86);

-- --------------------------------------------------------

--
-- Table structure for table `SiteVisitBooking`
--

CREATE TABLE `SiteVisitBooking` (
  `id` int(11) NOT NULL,
  `booking_code` varchar(191) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `property_id` int(11) DEFAULT NULL,
  `telecaller_id` int(11) NOT NULL,
  `project_manager_id` int(11) DEFAULT NULL,
  `assigned_agent_id` int(11) DEFAULT NULL,
  `project_id` int(11) DEFAULT NULL,
  `scheduled_date` datetime(3) NOT NULL,
  `status` enum('REQUESTED','PENDING_ACCEPTANCE','REASSIGNED','ESCALATED_TO_MARKETING_DIRECTOR','ACCEPTED','PENDING_CUSTOMER_RECONFIRMATION','RESCHEDULE_REQUESTED','PENDING_PM_RECONFIRMATION','CONFIRMED','ACTIVE','COMPLETED','CANCELLED','ON_HOLD','CANCELLATION_PENDING_PM_CONFIRMATION') NOT NULL DEFAULT 'REQUESTED',
  `verification_call_notes` text DEFAULT NULL,
  `feedback_notes` text DEFAULT NULL,
  `rating` varchar(191) DEFAULT NULL,
  `proof_photo_url` varchar(191) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `opportunity_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `cancellation_confirmed_by_pm_id` int(11) DEFAULT NULL,
  `cancellation_reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SiteVisitEscalation`
--

CREATE TABLE `SiteVisitEscalation` (
  `id` int(11) NOT NULL,
  `site_visit_booking_id` int(11) NOT NULL,
  `marketing_director_notified_at` datetime(3) DEFAULT NULL,
  `managing_director_notified_at` datetime(3) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SiteVisitProperty`
--

CREATE TABLE `SiteVisitProperty` (
  `id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `property_id` int(11) NOT NULL,
  `outcome` varchar(191) DEFAULT NULL,
  `outcome_reason` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `SiteVisitReassignment`
--

CREATE TABLE `SiteVisitReassignment` (
  `id` int(11) NOT NULL,
  `visit_id` int(11) NOT NULL,
  `from_employee_id` int(11) DEFAULT NULL,
  `to_employee_id` int(11) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Task`
--

CREATE TABLE `Task` (
  `id` int(11) NOT NULL,
  `title` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `assignee_id` int(11) NOT NULL,
  `target_date` datetime(3) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `created_by` int(11) NOT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `opportunity_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `AttendanceLog`
--
ALTER TABLE `AttendanceLog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AttendanceLog_employee_id_idx` (`employee_id`),
  ADD KEY `AttendanceLog_employee_id_check_in_at_idx` (`employee_id`,`check_in_at`),
  ADD KEY `AttendanceLog_employee_id_check_out_at_idx` (`employee_id`,`check_out_at`);

--
-- Indexes for table `AttendanceProposal`
--
ALTER TABLE `AttendanceProposal`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `AuditEvent`
--
ALTER TABLE `AuditEvent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuditEvent_actor_id_idx` (`actor_id`);

--
-- Indexes for table `AuthSession`
--
ALTER TABLE `AuthSession`
  ADD PRIMARY KEY (`id`),
  ADD KEY `AuthSession_employee_id_idx` (`employee_id`),
  ADD KEY `AuthSession_family_token_idx` (`family_token`),
  ADD KEY `AuthSession_refresh_token_hash_idx` (`refresh_token_hash`);

--
-- Indexes for table `Booking`
--
ALTER TABLE `Booking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Booking_booking_code_key` (`booking_code`),
  ADD KEY `Booking_company_id_idx` (`company_id`),
  ADD KEY `Booking_customer_id_idx` (`customer_id`),
  ADD KEY `Booking_property_id_idx` (`property_id`),
  ADD KEY `Booking_status_idx` (`status`),
  ADD KEY `Booking_branch_id_fkey` (`branch_id`),
  ADD KEY `Booking_assigned_employee_id_fkey` (`assigned_employee_id`);

--
-- Indexes for table `BookingPortalMapping`
--
ALTER TABLE `BookingPortalMapping`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `BookingPortalMapping_crms_booking_id_key` (`crms_booking_id`),
  ADD KEY `BookingPortalMapping_company_id_idx` (`company_id`),
  ADD KEY `BookingPortalMapping_crms_booking_id_idx` (`crms_booking_id`),
  ADD KEY `BookingPortalMapping_crms_customer_id_idx` (`crms_customer_id`),
  ADD KEY `BookingPortalMapping_handoff_status_idx` (`handoff_status`);

--
-- Indexes for table `Branch`
--
ALTER TABLE `Branch`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Branch_company_id_idx` (`company_id`);

--
-- Indexes for table `Company`
--
ALTER TABLE `Company`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Company_code_key` (`code`);

--
-- Indexes for table `CompanyHoliday`
--
ALTER TABLE `CompanyHoliday`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `CompanyHoliday_company_id_date_key` (`company_id`,`date`),
  ADD KEY `CompanyHoliday_company_id_idx` (`company_id`);

--
-- Indexes for table `Complaint`
--
ALTER TABLE `Complaint`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Complaint_complaint_code_key` (`complaint_code`),
  ADD KEY `Complaint_company_id_idx` (`company_id`),
  ADD KEY `Complaint_customer_id_idx` (`customer_id`),
  ADD KEY `Complaint_booking_id_idx` (`booking_id`),
  ADD KEY `Complaint_property_id_idx` (`property_id`),
  ADD KEY `Complaint_status_idx` (`status`),
  ADD KEY `Complaint_priority_idx` (`priority`),
  ADD KEY `Complaint_assigned_employee_id_idx` (`assigned_employee_id`),
  ADD KEY `Complaint_created_at_idx` (`created_at`);

--
-- Indexes for table `Customer`
--
ALTER TABLE `Customer`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Customer_customer_code_key` (`customer_code`),
  ADD UNIQUE KEY `Customer_origin_lead_id_key` (`origin_lead_id`),
  ADD KEY `Customer_company_id_idx` (`company_id`),
  ADD KEY `Customer_branch_id_idx` (`branch_id`),
  ADD KEY `Customer_assigned_to_id_idx` (`assigned_to_id`),
  ADD KEY `Customer_kyc_status_idx` (`kyc_status`);

--
-- Indexes for table `CustomerNotification`
--
ALTER TABLE `CustomerNotification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `CustomerNotification_company_id_idx` (`company_id`),
  ADD KEY `CustomerNotification_customer_id_idx` (`customer_id`),
  ADD KEY `CustomerNotification_is_read_idx` (`is_read`),
  ADD KEY `CustomerNotification_created_at_idx` (`created_at`),
  ADD KEY `CustomerNotification_company_id_customer_id_created_at_idx` (`company_id`,`customer_id`,`created_at`),
  ADD KEY `CustomerNotification_customer_id_is_read_idx` (`customer_id`,`is_read`);

--
-- Indexes for table `DailyReport`
--
ALTER TABLE `DailyReport`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DailyReport_employee_id_idx` (`employee_id`);

--
-- Indexes for table `DailyTarget`
--
ALTER TABLE `DailyTarget`
  ADD PRIMARY KEY (`id`),
  ADD KEY `DailyTarget_role_name_idx` (`role_name`),
  ADD KEY `DailyTarget_employee_id_idx` (`employee_id`),
  ADD KEY `DailyTarget_company_id_fkey` (`company_id`);

--
-- Indexes for table `Demo`
--
ALTER TABLE `Demo`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Demo_lead_id_fkey` (`lead_id`),
  ADD KEY `Demo_handler_id_fkey` (`handler_id`);

--
-- Indexes for table `DemoInterestedProperty`
--
ALTER TABLE `DemoInterestedProperty`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `DemoInterestedProperty_demo_id_property_id_key` (`demo_id`,`property_id`),
  ADD KEY `DemoInterestedProperty_property_id_fkey` (`property_id`);

--
-- Indexes for table `Employee`
--
ALTER TABLE `Employee`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Employee_employee_code_key` (`employee_code`),
  ADD KEY `Employee_company_id_idx` (`company_id`),
  ADD KEY `Employee_branch_id_idx` (`branch_id`),
  ADD KEY `Employee_reporting_manager_id_fkey` (`reporting_manager_id`),
  ADD KEY `Employee_company_id_created_at_idx` (`company_id`,`created_at`),
  ADD KEY `Employee_phone_idx` (`phone`),
  ADD KEY `Employee_email_idx` (`email`);

--
-- Indexes for table `EmployeeBranch`
--
ALTER TABLE `EmployeeBranch`
  ADD PRIMARY KEY (`employee_id`,`branch_id`),
  ADD KEY `EmployeeBranch_branch_id_fkey` (`branch_id`);

--
-- Indexes for table `EmployeePermissionOverride`
--
ALTER TABLE `EmployeePermissionOverride`
  ADD PRIMARY KEY (`employee_id`,`permission_id`),
  ADD KEY `EmployeePermissionOverride_permission_id_fkey` (`permission_id`);

--
-- Indexes for table `EmployeeQrCode`
--
ALTER TABLE `EmployeeQrCode`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `EmployeeQrCode_qr_token_key` (`qr_token`),
  ADD KEY `EmployeeQrCode_employee_id_idx` (`employee_id`);

--
-- Indexes for table `EmployeeRole`
--
ALTER TABLE `EmployeeRole`
  ADD PRIMARY KEY (`employee_id`,`role_id`),
  ADD KEY `EmployeeRole_role_id_fkey` (`role_id`);

--
-- Indexes for table `ExpenseRefund`
--
ALTER TABLE `ExpenseRefund`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ExpenseRefund_employee_id_idx` (`employee_id`),
  ADD KEY `ExpenseRefund_status_idx` (`status`),
  ADD KEY `ExpenseRefund_company_id_idx` (`company_id`),
  ADD KEY `ExpenseRefund_accountant_id_fkey` (`accountant_id`),
  ADD KEY `ExpenseRefund_md_id_fkey` (`md_id`),
  ADD KEY `ExpenseRefund_refunded_by_fkey` (`refunded_by`);

--
-- Indexes for table `Installment`
--
ALTER TABLE `Installment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Installment_booking_id_installment_number_key` (`booking_id`,`installment_number`),
  ADD KEY `Installment_booking_id_idx` (`booking_id`),
  ADD KEY `Installment_status_idx` (`status`),
  ADD KEY `Installment_recorded_by_id_fkey` (`recorded_by_id`);

--
-- Indexes for table `IntegrationEvent`
--
ALTER TABLE `IntegrationEvent`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IntegrationEvent_company_id_idx` (`company_id`),
  ADD KEY `IntegrationEvent_status_idx` (`status`),
  ADD KEY `IntegrationEvent_crms_booking_id_idx` (`crms_booking_id`),
  ADD KEY `IntegrationEvent_crms_customer_id_idx` (`crms_customer_id`),
  ADD KEY `IntegrationEvent_created_at_idx` (`created_at`);

--
-- Indexes for table `KioskCredential`
--
ALTER TABLE `KioskCredential`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `KioskCredential_company_id_username_key` (`company_id`,`username`),
  ADD KEY `KioskCredential_company_id_idx` (`company_id`),
  ADD KEY `KioskCredential_branch_id_idx` (`branch_id`),
  ADD KEY `KioskCredential_created_by_id_idx` (`created_by_id`);

--
-- Indexes for table `Lead`
--
ALTER TABLE `Lead`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Lead_lead_code_key` (`lead_code`),
  ADD KEY `Lead_company_id_idx` (`company_id`),
  ADD KEY `Lead_branch_id_idx` (`branch_id`),
  ADD KEY `Lead_assigned_to_id_idx` (`assigned_to_id`),
  ADD KEY `Lead_status_idx` (`status`),
  ADD KEY `Lead_created_by_id_fkey` (`created_by_id`),
  ADD KEY `Lead_referral_employee_id_fkey` (`referral_employee_id`),
  ADD KEY `Lead_project_id_fkey` (`project_id`),
  ADD KEY `Lead_company_id_created_at_idx` (`company_id`,`created_at`),
  ADD KEY `Lead_phone_idx` (`phone`),
  ADD KEY `Lead_email_idx` (`email`),
  ADD KEY `Lead_introduced_by_id_fkey` (`introduced_by_id`),
  ADD KEY `Lead_previous_lead_id_fkey` (`previous_lead_id`);

--
-- Indexes for table `LeadActivity`
--
ALTER TABLE `LeadActivity`
  ADD PRIMARY KEY (`id`),
  ADD KEY `LeadActivity_lead_id_idx` (`lead_id`),
  ADD KEY `LeadActivity_actor_id_idx` (`actor_id`);

--
-- Indexes for table `LeadMatchingRequirement`
--
ALTER TABLE `LeadMatchingRequirement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `LeadMatchingRequirement_lead_id_key` (`lead_id`);

--
-- Indexes for table `LeadPropertyInterest`
--
ALTER TABLE `LeadPropertyInterest`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `LeadPropertyInterest_lead_id_property_id_key` (`lead_id`,`property_id`),
  ADD KEY `LeadPropertyInterest_property_id_idx` (`property_id`),
  ADD KEY `LeadPropertyInterest_created_by_idx` (`created_by`);

--
-- Indexes for table `MessageTemplate`
--
ALTER TABLE `MessageTemplate`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `MessageTemplate_template_key_key` (`template_key`),
  ADD KEY `MessageTemplate_template_key_idx` (`template_key`),
  ADD KEY `MessageTemplate_is_active_idx` (`is_active`);

--
-- Indexes for table `Notification`
--
ALTER TABLE `Notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Notification_employee_id_idx` (`employee_id`);

--
-- Indexes for table `Opportunity`
--
ALTER TABLE `Opportunity`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Opportunity_opportunity_code_key` (`opportunity_code`),
  ADD UNIQUE KEY `Opportunity_booking_id_key` (`booking_id`),
  ADD KEY `Opportunity_company_id_idx` (`company_id`),
  ADD KEY `Opportunity_branch_id_idx` (`branch_id`),
  ADD KEY `Opportunity_owner_id_idx` (`owner_id`),
  ADD KEY `Opportunity_lead_id_idx` (`lead_id`),
  ADD KEY `Opportunity_project_id_idx` (`project_id`),
  ADD KEY `Opportunity_property_id_idx` (`property_id`),
  ADD KEY `Opportunity_created_at_idx` (`created_at`);

--
-- Indexes for table `Payment`
--
ALTER TABLE `Payment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Payment_payment_code_key` (`payment_code`),
  ADD KEY `Payment_company_id_idx` (`company_id`),
  ADD KEY `Payment_booking_id_idx` (`booking_id`),
  ADD KEY `Payment_status_idx` (`status`),
  ADD KEY `Payment_portal_payment_id_idx` (`portal_payment_id`),
  ADD KEY `Payment_recorded_by_id_fkey` (`recorded_by_id`),
  ADD KEY `Payment_installment_id_fkey` (`installment_id`);

--
-- Indexes for table `PerformanceSnapshot`
--
ALTER TABLE `PerformanceSnapshot`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PerformanceSnapshot_employee_id_idx` (`employee_id`);

--
-- Indexes for table `Permission`
--
ALTER TABLE `Permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Permission_name_key` (`name`);

--
-- Indexes for table `PMLocationAssignment`
--
ALTER TABLE `PMLocationAssignment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PMLocationAssignment_pm_id_location_company_id_key` (`pm_id`,`location`,`company_id`),
  ADD KEY `PMLocationAssignment_company_id_fkey` (`company_id`);

--
-- Indexes for table `PMReassignmentHistory`
--
ALTER TABLE `PMReassignmentHistory`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PMReassignmentHistory_site_visit_booking_id_fkey` (`site_visit_booking_id`),
  ADD KEY `PMReassignmentHistory_reassigned_by_pm_id_fkey` (`reassigned_by_pm_id`),
  ADD KEY `PMReassignmentHistory_reassigned_to_pm_id_fkey` (`reassigned_to_pm_id`);

--
-- Indexes for table `Project`
--
ALTER TABLE `Project`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Project_project_code_key` (`project_code`),
  ADD UNIQUE KEY `Project_company_id_slug_key` (`company_id`,`slug`),
  ADD KEY `Project_company_id_idx` (`company_id`),
  ADD KEY `Project_branch_id_idx` (`branch_id`),
  ADD KEY `Project_assigned_pm_id_idx` (`assigned_pm_id`);

--
-- Indexes for table `Property`
--
ALTER TABLE `Property`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Property_property_code_key` (`property_code`),
  ADD UNIQUE KEY `Property_locked_by_booking_id_key` (`locked_by_booking_id`),
  ADD UNIQUE KEY `Property_company_id_slug_key` (`company_id`,`slug`),
  ADD KEY `Property_company_id_idx` (`company_id`),
  ADD KEY `Property_project_id_idx` (`project_id`),
  ADD KEY `Property_brand_type_idx` (`brand_type`),
  ADD KEY `Property_status_idx` (`status`),
  ADD KEY `Property_assigned_pm_id_idx` (`assigned_pm_id`),
  ADD KEY `Property_city_idx` (`city`),
  ADD KEY `Property_listing_type_idx` (`listing_type`),
  ADD KEY `Property_digital_marketing_executive_id_idx` (`digital_marketing_executive_id`),
  ADD KEY `Property_branch_id_fkey` (`branch_id`),
  ADD KEY `Property_created_by_id_fkey` (`created_by_id`),
  ADD KEY `Property_company_id_created_at_idx` (`company_id`,`created_at`),
  ADD KEY `Property_price_idx` (`price`),
  ADD KEY `Property_category_idx` (`category`);

--
-- Indexes for table `PropertyApartmentDetails`
--
ALTER TABLE `PropertyApartmentDetails`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PropertyApartmentDetails_property_id_key` (`property_id`);

--
-- Indexes for table `PropertyImage`
--
ALTER TABLE `PropertyImage`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PropertyImage_property_id_idx` (`property_id`),
  ADD KEY `PropertyImage_status_idx` (`status`),
  ADD KEY `PropertyImage_uploaded_by_id_fkey` (`uploaded_by_id`);

--
-- Indexes for table `PropertyPlotDetails`
--
ALTER TABLE `PropertyPlotDetails`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PropertyPlotDetails_property_id_key` (`property_id`);

--
-- Indexes for table `PropertyPricing`
--
ALTER TABLE `PropertyPricing`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PropertyPricing_property_id_key` (`property_id`);

--
-- Indexes for table `PropertyPublication`
--
ALTER TABLE `PropertyPublication`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PropertyPublication_property_id_company_id_key` (`property_id`,`company_id`),
  ADD KEY `PropertyPublication_company_id_idx` (`company_id`),
  ADD KEY `PropertyPublication_property_id_idx` (`property_id`);

--
-- Indexes for table `PropertyVerificationLog`
--
ALTER TABLE `PropertyVerificationLog`
  ADD PRIMARY KEY (`id`),
  ADD KEY `PropertyVerificationLog_property_id_idx` (`property_id`),
  ADD KEY `PropertyVerificationLog_actor_id_idx` (`actor_id`);

--
-- Indexes for table `PublicApiKey`
--
ALTER TABLE `PublicApiKey`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PublicApiKey_api_key_key` (`api_key`),
  ADD KEY `PublicApiKey_company_id_idx` (`company_id`),
  ADD KEY `PublicApiKey_api_key_idx` (`api_key`);

--
-- Indexes for table `PushSubscription`
--
ALTER TABLE `PushSubscription`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `PushSubscription_employee_id_endpoint_key` (`employee_id`,`endpoint`(200)),
  ADD KEY `PushSubscription_employee_id_idx` (`employee_id`);

--
-- Indexes for table `Role`
--
ALTER TABLE `Role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Role_name_key` (`name`);

--
-- Indexes for table `RolePermission`
--
ALTER TABLE `RolePermission`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `RolePermission_permission_id_fkey` (`permission_id`);

--
-- Indexes for table `SiteVisitBooking`
--
ALTER TABLE `SiteVisitBooking`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `SiteVisitBooking_booking_code_key` (`booking_code`),
  ADD KEY `SiteVisitBooking_lead_id_idx` (`lead_id`),
  ADD KEY `SiteVisitBooking_opportunity_id_idx` (`opportunity_id`),
  ADD KEY `SiteVisitBooking_telecaller_id_idx` (`telecaller_id`),
  ADD KEY `SiteVisitBooking_project_manager_id_idx` (`project_manager_id`),
  ADD KEY `SiteVisitBooking_assigned_agent_id_idx` (`assigned_agent_id`),
  ADD KEY `SiteVisitBooking_status_idx` (`status`),
  ADD KEY `SiteVisitBooking_property_id_fkey` (`property_id`),
  ADD KEY `SiteVisitBooking_project_id_fkey` (`project_id`),
  ADD KEY `SiteVisitBooking_cancellation_confirmed_by_pm_id_fkey` (`cancellation_confirmed_by_pm_id`);

--
-- Indexes for table `SiteVisitEscalation`
--
ALTER TABLE `SiteVisitEscalation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `SiteVisitEscalation_site_visit_booking_id_key` (`site_visit_booking_id`);

--
-- Indexes for table `SiteVisitProperty`
--
ALTER TABLE `SiteVisitProperty`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `SiteVisitProperty_visit_id_property_id_key` (`visit_id`,`property_id`),
  ADD KEY `SiteVisitProperty_visit_id_idx` (`visit_id`),
  ADD KEY `SiteVisitProperty_property_id_idx` (`property_id`);

--
-- Indexes for table `SiteVisitReassignment`
--
ALTER TABLE `SiteVisitReassignment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `SiteVisitReassignment_visit_id_idx` (`visit_id`),
  ADD KEY `SiteVisitReassignment_from_employee_id_idx` (`from_employee_id`),
  ADD KEY `SiteVisitReassignment_to_employee_id_idx` (`to_employee_id`);

--
-- Indexes for table `Task`
--
ALTER TABLE `Task`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Task_assignee_id_idx` (`assignee_id`),
  ADD KEY `Task_lead_id_idx` (`lead_id`),
  ADD KEY `Task_opportunity_id_idx` (`opportunity_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `AttendanceLog`
--
ALTER TABLE `AttendanceLog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT for table `AttendanceProposal`
--
ALTER TABLE `AttendanceProposal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `AuditEvent`
--
ALTER TABLE `AuditEvent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=187;

--
-- AUTO_INCREMENT for table `AuthSession`
--
ALTER TABLE `AuthSession`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1017;

--
-- AUTO_INCREMENT for table `Booking`
--
ALTER TABLE `Booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `BookingPortalMapping`
--
ALTER TABLE `BookingPortalMapping`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Branch`
--
ALTER TABLE `Branch`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Company`
--
ALTER TABLE `Company`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `CompanyHoliday`
--
ALTER TABLE `CompanyHoliday`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Complaint`
--
ALTER TABLE `Complaint`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Customer`
--
ALTER TABLE `Customer`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `CustomerNotification`
--
ALTER TABLE `CustomerNotification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `DailyReport`
--
ALTER TABLE `DailyReport`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `DailyTarget`
--
ALTER TABLE `DailyTarget`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Demo`
--
ALTER TABLE `Demo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `DemoInterestedProperty`
--
ALTER TABLE `DemoInterestedProperty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Employee`
--
ALTER TABLE `Employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `EmployeeQrCode`
--
ALTER TABLE `EmployeeQrCode`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `ExpenseRefund`
--
ALTER TABLE `ExpenseRefund`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Installment`
--
ALTER TABLE `Installment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `IntegrationEvent`
--
ALTER TABLE `IntegrationEvent`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `KioskCredential`
--
ALTER TABLE `KioskCredential`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Lead`
--
ALTER TABLE `Lead`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `LeadActivity`
--
ALTER TABLE `LeadActivity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `LeadMatchingRequirement`
--
ALTER TABLE `LeadMatchingRequirement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `LeadPropertyInterest`
--
ALTER TABLE `LeadPropertyInterest`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `MessageTemplate`
--
ALTER TABLE `MessageTemplate`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Notification`
--
ALTER TABLE `Notification`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `Opportunity`
--
ALTER TABLE `Opportunity`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `Payment`
--
ALTER TABLE `Payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `PerformanceSnapshot`
--
ALTER TABLE `PerformanceSnapshot`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Permission`
--
ALTER TABLE `Permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=87;

--
-- AUTO_INCREMENT for table `PMLocationAssignment`
--
ALTER TABLE `PMLocationAssignment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PMReassignmentHistory`
--
ALTER TABLE `PMReassignmentHistory`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Project`
--
ALTER TABLE `Project`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Property`
--
ALTER TABLE `Property`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `PropertyApartmentDetails`
--
ALTER TABLE `PropertyApartmentDetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `PropertyImage`
--
ALTER TABLE `PropertyImage`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `PropertyPlotDetails`
--
ALTER TABLE `PropertyPlotDetails`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PropertyPricing`
--
ALTER TABLE `PropertyPricing`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `PropertyPublication`
--
ALTER TABLE `PropertyPublication`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `PropertyVerificationLog`
--
ALTER TABLE `PropertyVerificationLog`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `PublicApiKey`
--
ALTER TABLE `PublicApiKey`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `PushSubscription`
--
ALTER TABLE `PushSubscription`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `Role`
--
ALTER TABLE `Role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `SiteVisitBooking`
--
ALTER TABLE `SiteVisitBooking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `SiteVisitEscalation`
--
ALTER TABLE `SiteVisitEscalation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `SiteVisitProperty`
--
ALTER TABLE `SiteVisitProperty`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `SiteVisitReassignment`
--
ALTER TABLE `SiteVisitReassignment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Task`
--
ALTER TABLE `Task`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `AttendanceLog`
--
ALTER TABLE `AttendanceLog`
  ADD CONSTRAINT `AttendanceLog_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `AuthSession`
--
ALTER TABLE `AuthSession`
  ADD CONSTRAINT `AuthSession_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Booking`
--
ALTER TABLE `Booking`
  ADD CONSTRAINT `Booking_assigned_employee_id_fkey` FOREIGN KEY (`assigned_employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Booking_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `BookingPortalMapping`
--
ALTER TABLE `BookingPortalMapping`
  ADD CONSTRAINT `BookingPortalMapping_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `Branch`
--
ALTER TABLE `Branch`
  ADD CONSTRAINT `Branch_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `CompanyHoliday`
--
ALTER TABLE `CompanyHoliday`
  ADD CONSTRAINT `CompanyHoliday_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Complaint`
--
ALTER TABLE `Complaint`
  ADD CONSTRAINT `Complaint_assigned_employee_id_fkey` FOREIGN KEY (`assigned_employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Complaint_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Customer`
--
ALTER TABLE `Customer`
  ADD CONSTRAINT `Customer_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Customer_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Customer_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Customer_origin_lead_id_fkey` FOREIGN KEY (`origin_lead_id`) REFERENCES `Lead` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `CustomerNotification`
--
ALTER TABLE `CustomerNotification`
  ADD CONSTRAINT `CustomerNotification_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `CustomerNotification_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `Customer` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `DailyReport`
--
ALTER TABLE `DailyReport`
  ADD CONSTRAINT `DailyReport_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `DailyTarget`
--
ALTER TABLE `DailyTarget`
  ADD CONSTRAINT `DailyTarget_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `DailyTarget_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Demo`
--
ALTER TABLE `Demo`
  ADD CONSTRAINT `Demo_handler_id_fkey` FOREIGN KEY (`handler_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Demo_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `DemoInterestedProperty`
--
ALTER TABLE `DemoInterestedProperty`
  ADD CONSTRAINT `DemoInterestedProperty_demo_id_fkey` FOREIGN KEY (`demo_id`) REFERENCES `Demo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `DemoInterestedProperty_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Employee`
--
ALTER TABLE `Employee`
  ADD CONSTRAINT `Employee_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Employee_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Employee_reporting_manager_id_fkey` FOREIGN KEY (`reporting_manager_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `EmployeeBranch`
--
ALTER TABLE `EmployeeBranch`
  ADD CONSTRAINT `EmployeeBranch_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `EmployeeBranch_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `EmployeePermissionOverride`
--
ALTER TABLE `EmployeePermissionOverride`
  ADD CONSTRAINT `EmployeePermissionOverride_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `EmployeePermissionOverride_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `EmployeeQrCode`
--
ALTER TABLE `EmployeeQrCode`
  ADD CONSTRAINT `EmployeeQrCode_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `EmployeeRole`
--
ALTER TABLE `EmployeeRole`
  ADD CONSTRAINT `EmployeeRole_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `EmployeeRole_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ExpenseRefund`
--
ALTER TABLE `ExpenseRefund`
  ADD CONSTRAINT `ExpenseRefund_accountant_id_fkey` FOREIGN KEY (`accountant_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ExpenseRefund_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ExpenseRefund_md_id_fkey` FOREIGN KEY (`md_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `ExpenseRefund_refunded_by_fkey` FOREIGN KEY (`refunded_by`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Installment`
--
ALTER TABLE `Installment`
  ADD CONSTRAINT `Installment_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Installment_recorded_by_id_fkey` FOREIGN KEY (`recorded_by_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `IntegrationEvent`
--
ALTER TABLE `IntegrationEvent`
  ADD CONSTRAINT `IntegrationEvent_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `KioskCredential`
--
ALTER TABLE `KioskCredential`
  ADD CONSTRAINT `KioskCredential_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `KioskCredential_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `KioskCredential_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `Lead`
--
ALTER TABLE `Lead`
  ADD CONSTRAINT `Lead_assigned_to_id_fkey` FOREIGN KEY (`assigned_to_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_introduced_by_id_fkey` FOREIGN KEY (`introduced_by_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_previous_lead_id_fkey` FOREIGN KEY (`previous_lead_id`) REFERENCES `Lead` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Lead_referral_employee_id_fkey` FOREIGN KEY (`referral_employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `LeadActivity`
--
ALTER TABLE `LeadActivity`
  ADD CONSTRAINT `LeadActivity_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `LeadActivity_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `LeadMatchingRequirement`
--
ALTER TABLE `LeadMatchingRequirement`
  ADD CONSTRAINT `LeadMatchingRequirement_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `LeadPropertyInterest`
--
ALTER TABLE `LeadPropertyInterest`
  ADD CONSTRAINT `LeadPropertyInterest_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `LeadPropertyInterest_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `LeadPropertyInterest_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Notification`
--
ALTER TABLE `Notification`
  ADD CONSTRAINT `Notification_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Opportunity`
--
ALTER TABLE `Opportunity`
  ADD CONSTRAINT `Opportunity_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Opportunity_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `Payment`
--
ALTER TABLE `Payment`
  ADD CONSTRAINT `Payment_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `Booking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_installment_id_fkey` FOREIGN KEY (`installment_id`) REFERENCES `Installment` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Payment_recorded_by_id_fkey` FOREIGN KEY (`recorded_by_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `PerformanceSnapshot`
--
ALTER TABLE `PerformanceSnapshot`
  ADD CONSTRAINT `PerformanceSnapshot_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PMLocationAssignment`
--
ALTER TABLE `PMLocationAssignment`
  ADD CONSTRAINT `PMLocationAssignment_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `PMLocationAssignment_pm_id_fkey` FOREIGN KEY (`pm_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `PMReassignmentHistory`
--
ALTER TABLE `PMReassignmentHistory`
  ADD CONSTRAINT `PMReassignmentHistory_reassigned_by_pm_id_fkey` FOREIGN KEY (`reassigned_by_pm_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `PMReassignmentHistory_reassigned_to_pm_id_fkey` FOREIGN KEY (`reassigned_to_pm_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `PMReassignmentHistory_site_visit_booking_id_fkey` FOREIGN KEY (`site_visit_booking_id`) REFERENCES `SiteVisitBooking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Project`
--
ALTER TABLE `Project`
  ADD CONSTRAINT `Project_assigned_pm_id_fkey` FOREIGN KEY (`assigned_pm_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Project_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Project_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `Property`
--
ALTER TABLE `Property`
  ADD CONSTRAINT `Property_assigned_pm_id_fkey` FOREIGN KEY (`assigned_pm_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_branch_id_fkey` FOREIGN KEY (`branch_id`) REFERENCES `Branch` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_digital_marketing_executive_id_fkey` FOREIGN KEY (`digital_marketing_executive_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_locked_by_booking_id_fkey` FOREIGN KEY (`locked_by_booking_id`) REFERENCES `Booking` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Property_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `PropertyApartmentDetails`
--
ALTER TABLE `PropertyApartmentDetails`
  ADD CONSTRAINT `PropertyApartmentDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PropertyImage`
--
ALTER TABLE `PropertyImage`
  ADD CONSTRAINT `PropertyImage_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PropertyImage_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `PropertyPlotDetails`
--
ALTER TABLE `PropertyPlotDetails`
  ADD CONSTRAINT `PropertyPlotDetails_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PropertyPricing`
--
ALTER TABLE `PropertyPricing`
  ADD CONSTRAINT `PropertyPricing_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PropertyPublication`
--
ALTER TABLE `PropertyPublication`
  ADD CONSTRAINT `PropertyPublication_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `PropertyPublication_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PropertyVerificationLog`
--
ALTER TABLE `PropertyVerificationLog`
  ADD CONSTRAINT `PropertyVerificationLog_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `PropertyVerificationLog_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PublicApiKey`
--
ALTER TABLE `PublicApiKey`
  ADD CONSTRAINT `PublicApiKey_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `Company` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `PushSubscription`
--
ALTER TABLE `PushSubscription`
  ADD CONSTRAINT `PushSubscription_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `RolePermission`
--
ALTER TABLE `RolePermission`
  ADD CONSTRAINT `RolePermission_permission_id_fkey` FOREIGN KEY (`permission_id`) REFERENCES `Permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `RolePermission_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `Role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SiteVisitBooking`
--
ALTER TABLE `SiteVisitBooking`
  ADD CONSTRAINT `SiteVisitBooking_assigned_agent_id_fkey` FOREIGN KEY (`assigned_agent_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_cancellation_confirmed_by_pm_id_fkey` FOREIGN KEY (`cancellation_confirmed_by_pm_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_opportunity_id_fkey` FOREIGN KEY (`opportunity_id`) REFERENCES `Opportunity` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_project_manager_id_fkey` FOREIGN KEY (`project_manager_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitBooking_telecaller_id_fkey` FOREIGN KEY (`telecaller_id`) REFERENCES `Employee` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `SiteVisitEscalation`
--
ALTER TABLE `SiteVisitEscalation`
  ADD CONSTRAINT `SiteVisitEscalation_site_visit_booking_id_fkey` FOREIGN KEY (`site_visit_booking_id`) REFERENCES `SiteVisitBooking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SiteVisitProperty`
--
ALTER TABLE `SiteVisitProperty`
  ADD CONSTRAINT `SiteVisitProperty_property_id_fkey` FOREIGN KEY (`property_id`) REFERENCES `Property` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitProperty_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `SiteVisitBooking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `SiteVisitReassignment`
--
ALTER TABLE `SiteVisitReassignment`
  ADD CONSTRAINT `SiteVisitReassignment_from_employee_id_fkey` FOREIGN KEY (`from_employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitReassignment_to_employee_id_fkey` FOREIGN KEY (`to_employee_id`) REFERENCES `Employee` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `SiteVisitReassignment_visit_id_fkey` FOREIGN KEY (`visit_id`) REFERENCES `SiteVisitBooking` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Task`
--
ALTER TABLE `Task`
  ADD CONSTRAINT `Task_assignee_id_fkey` FOREIGN KEY (`assignee_id`) REFERENCES `Employee` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Task_lead_id_fkey` FOREIGN KEY (`lead_id`) REFERENCES `Lead` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `Task_opportunity_id_fkey` FOREIGN KEY (`opportunity_id`) REFERENCES `Opportunity` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
