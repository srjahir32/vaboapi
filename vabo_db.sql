-- phpMyAdmin SQL Dump
-- version 4.0.10deb1
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Jul 13, 2016 at 12:02 PM
-- Server version: 5.5.49-0ubuntu0.14.04.1
-- PHP Version: 5.5.9-1ubuntu4.17

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;

--
-- Database: `vabo_db`
--
CREATE DATABASE IF NOT EXISTS `vabo_db` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `vabo_db`;

-- --------------------------------------------------------

--
-- Table structure for table `appointment`
--

DROP TABLE IF EXISTS `appointment`;
CREATE TABLE IF NOT EXISTS `appointment` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `service_id` int(5) NOT NULL,
  `user_id` int(5) NOT NULL,
  `appointment_time` datetime NOT NULL,
  `recure_id` int(10) NOT NULL,
  `status` tinyint(1) NOT NULL,
  `is_approve` tinyint(1) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `service_id` (`service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_payment`
--

DROP TABLE IF EXISTS `appointment_payment`;
CREATE TABLE IF NOT EXISTS `appointment_payment` (
  `id` int(20) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `payment_type` int(11) NOT NULL,
  `transaction_id` int(11) NOT NULL,
  `payment_amount` int(7) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `countries`
--

DROP TABLE IF EXISTS `countries`;
CREATE TABLE IF NOT EXISTS `countries` (
  `country_id` int(3) NOT NULL AUTO_INCREMENT,
  `country_name` varchar(20) NOT NULL,
  PRIMARY KEY (`country_id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=3 ;

--
-- Dumping data for table `countries`
--

INSERT INTO `countries` VALUES(1, 'INDIA');
INSERT INTO `countries` VALUES(2, 'USA');

-- --------------------------------------------------------

--
-- Table structure for table `service`
--

DROP TABLE IF EXISTS `service`;
CREATE TABLE IF NOT EXISTS `service` (
  `id` int(5) NOT NULL AUTO_INCREMENT,
  `name` varchar(20) NOT NULL,
  `price` int(7) NOT NULL DEFAULT '0',
  `duration` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `gender` tinyint(1) NOT NULL,
  `service_category_id` int(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `gender` (`gender`),
  KEY `service_category_id` (`service_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `service_category`
--

DROP TABLE IF EXISTS `service_category`;
CREATE TABLE IF NOT EXISTS `service_category` (
  `id` int(3) NOT NULL AUTO_INCREMENT,
  `name` varchar(25) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `service_rating`
--

DROP TABLE IF EXISTS `service_rating`;
CREATE TABLE IF NOT EXISTS `service_rating` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(5) NOT NULL,
  `rating` int(2) NOT NULL,
  `review` text,
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `username` varchar(25) DEFAULT NULL,
  `password` varchar(25) DEFAULT NULL,
  `old_password` varchar(25) DEFAULT NULL,
  `is_social` tinyint(1) NOT NULL DEFAULT '0',
  `is_professional` tinyint(1) NOT NULL DEFAULT '0',
  `language` int(11) NOT NULL DEFAULT '0',
  `city` varchar(40) DEFAULT NULL,
  `country` int(3) NOT NULL DEFAULT '0',
  `address` text NOT NULL,
  `zip` int(8) NOT NULL DEFAULT '0',
  `img_path` varchar(200) DEFAULT NULL,
  `Q1` varchar(100) NOT NULL,
  `Q2` varchar(100) NOT NULL,
  `Q3` varchar(100) NOT NULL,
  `Q4` varchar(100) NOT NULL,
  `Q5` varchar(100) NOT NULL,
  `Q6` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id` (`id`),
  KEY `id_2` (`id`),
  KEY `country` (`country`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 COMMENT='User''s Details' AUTO_INCREMENT=13 ;

--
-- Dumping data for table `users`
--

INSERT INTO `users` VALUES(12, 'HARDIK', 'ha1ds@js.com', 'had1s', 'HA', '-', 1, 1, 0, 'SURAT', 1, 'AT Udhana,Surat', 396001, '-', '-', '-', '-', '-', '-', '-');

-- --------------------------------------------------------

--
-- Table structure for table `user_payment_details`
--

DROP TABLE IF EXISTS `user_payment_details`;
CREATE TABLE IF NOT EXISTS `user_payment_details` (
  `id` int(8) NOT NULL AUTO_INCREMENT,
  `user_id` int(7) NOT NULL,
  `card_type` tinyint(1) NOT NULL,
  `card_number` int(15) NOT NULL,
  `expiry_month` date NOT NULL,
  `expiry_year` year(4) NOT NULL,
  `card_cvv` int(5) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointment`
--
ALTER TABLE `appointment`
  ADD CONSTRAINT `appointment_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `service` (`id`),
  ADD CONSTRAINT `appointment_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Constraints for table `appointment_payment`
--
ALTER TABLE `appointment_payment`
  ADD CONSTRAINT `appointment_payment_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`);

--
-- Constraints for table `service`
--
ALTER TABLE `service`
  ADD CONSTRAINT `service_ibfk_1` FOREIGN KEY (`service_category_id`) REFERENCES `service_category` (`id`);

--
-- Constraints for table `service_rating`
--
ALTER TABLE `service_rating`
  ADD CONSTRAINT `service_rating_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointment` (`id`);

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`country`) REFERENCES `countries` (`country_id`);

--
-- Constraints for table `user_payment_details`
--
ALTER TABLE `user_payment_details`
  ADD CONSTRAINT `user_payment_details_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
