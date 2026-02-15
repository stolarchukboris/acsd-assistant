CREATE DATABASE  IF NOT EXISTS `acsd` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `acsd`;
-- MySQL dump 10.13  Distrib 8.0.31, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: acsd
-- ------------------------------------------------------
-- Server version	8.0.31

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activemshifts`
--

DROP TABLE IF EXISTS `activemshifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activemshifts` (
  `shiftId` varchar(36) NOT NULL,
  `discordId` varchar(20) NOT NULL,
  `robloxId` varchar(20) NOT NULL,
  `robloxUsername` varchar(20) NOT NULL,
  `startedTimestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`shiftId`),
  UNIQUE KEY `robloxId` (`robloxId`),
  UNIQUE KEY `robloxUsername` (`robloxUsername`),
  UNIQUE KEY `discordId` (`discordId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `activeshifts`
--

DROP TABLE IF EXISTS `activeshifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activeshifts` (
  `jobId` varchar(36) NOT NULL,
  `whMessageId` varchar(20) NOT NULL,
  `fwMessageId` varchar(20) NOT NULL,
  `robloxId` varchar(20) NOT NULL,
  `startedTimestamp` varchar(10) NOT NULL,
  UNIQUE KEY `whMessageId` (`whMessageId`),
  UNIQUE KEY `fwMessageId` (`fwMessageId`),
  UNIQUE KEY `robloxId` (`robloxId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `botsettings`
--

DROP TABLE IF EXISTS `botsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `botsettings` (
  `settingName` varchar(30) NOT NULL,
  `settingDesc` text NOT NULL,
  `settingValue` varchar(20) NOT NULL,
  `lastUpdatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastUpdatedBy` varchar(20) DEFAULT '597084523338924063',
  PRIMARY KEY (`settingName`),
  UNIQUE KEY `settingValue` (`settingValue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credits`
--

DROP TABLE IF EXISTS `credits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credits` (
  `robloxId` varchar(20) NOT NULL,
  `amount` smallint NOT NULL,
  PRIMARY KEY (`robloxId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `credittransactions`
--

DROP TABLE IF EXISTS `credittransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credittransactions` (
  `transactionId` varchar(36) NOT NULL,
  `execRbxId` varchar(20) NOT NULL,
  `targetRbxId` varchar(20) NOT NULL,
  `balanceBefore` smallint NOT NULL,
  `balanceAfter` smallint NOT NULL,
  `reason` text NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `loggedshifts`
--

DROP TABLE IF EXISTS `loggedshifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loggedshifts` (
  `shiftId` varchar(36) NOT NULL,
  `robloxId` varchar(20) NOT NULL,
  `startedTimestamp` varchar(10) NOT NULL,
  `endedTimestamp` varchar(10) NOT NULL,
  `lenMinutes` smallint unsigned NOT NULL,
  `proof` text NOT NULL,
  PRIMARY KEY (`shiftId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pendingregs`
--

DROP TABLE IF EXISTS `pendingregs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pendingregs` (
  `robloxId` varchar(20) NOT NULL,
  `discordId` varchar(20) NOT NULL,
  `robloxUsername` varchar(20) NOT NULL,
  `acsdRank` varchar(50) NOT NULL,
  `adminMessageId` varchar(20) DEFAULT NULL,
  `entryCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`robloxId`),
  UNIQUE KEY `discordId` (`discordId`),
  UNIQUE KEY `robloxUsername` (`robloxUsername`),
  UNIQUE KEY `adminMessageId` (`adminMessageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `pendingshiftlogs`
--

DROP TABLE IF EXISTS `pendingshiftlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pendingshiftlogs` (
  `jobId` varchar(36) NOT NULL,
  `whMessageId` varchar(20) NOT NULL,
  `fwMessageId` varchar(20) NOT NULL,
  `robloxId` varchar(20) NOT NULL,
  `startedTimestamp` varchar(10) NOT NULL,
  `endedTimestamp` varchar(10) NOT NULL,
  `lenMinutes` smallint unsigned NOT NULL,
  UNIQUE KEY `whMessageId` (`whMessageId`),
  UNIQUE KEY `fwMessageId` (`fwMessageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personnel`
--

DROP TABLE IF EXISTS `personnel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel` (
  `robloxId` varchar(20) NOT NULL,
  `discordId` varchar(20) NOT NULL,
  `robloxUsername` varchar(20) NOT NULL,
  `acsdRank` varchar(50) NOT NULL,
  `regApprovedBy` varchar(20) NOT NULL,
  `entryCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `entryUpdated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`robloxId`),
  UNIQUE KEY `robloxUsername` (`robloxUsername`),
  UNIQUE KEY `discordId` (`discordId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `personnelpartial`
--

DROP TABLE IF EXISTS `personnelpartial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnelpartial` (
  `robloxId` varchar(20) NOT NULL,
  `robloxUsername` varchar(20) NOT NULL,
  `entryCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`robloxId`),
  UNIQUE KEY `robloxUsername` (`robloxUsername`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `punishments`
--

DROP TABLE IF EXISTS `punishments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `punishments` (
  `punishmentId` varchar(36) NOT NULL,
  `targetRbxId` varchar(20) NOT NULL,
  `execRbxId` varchar(20) NOT NULL,
  `punishmentType` varchar(6) NOT NULL,
  `reason` text NOT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`punishmentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trainings`
--

DROP TABLE IF EXISTS `trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trainings` (
  `trainingId` varchar(36) NOT NULL,
  `hostDiscordId` varchar(20) NOT NULL,
  `hostRobloxUsername` varchar(20) NOT NULL,
  `messageId` varchar(20) DEFAULT NULL,
  `trainingTimestamp` varchar(20) NOT NULL,
  `isReminded` tinyint(1) DEFAULT '0',
  `isStarted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`trainingId`),
  UNIQUE KEY `trainingTimestamp` (`trainingTimestamp`),
  UNIQUE KEY `messageId` (`messageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-13 17:29:30
