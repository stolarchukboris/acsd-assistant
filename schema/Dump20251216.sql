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
  PRIMARY KEY (`jobId`),
  UNIQUE KEY `whMessageId` (`whMessageId`),
  UNIQUE KEY `fwMessageId` (`fwMessageId`),
  UNIQUE KEY `robloxId` (`robloxId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activeshifts`
--

LOCK TABLES `activeshifts` WRITE;
/*!40000 ALTER TABLE `activeshifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `activeshifts` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `credits`
--

LOCK TABLES `credits` WRITE;
/*!40000 ALTER TABLE `credits` DISABLE KEYS */;
INSERT INTO `credits` VALUES ('1126517653',-32768);
/*!40000 ALTER TABLE `credits` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `credittransactions`
--

LOCK TABLES `credittransactions` WRITE;
/*!40000 ALTER TABLE `credittransactions` DISABLE KEYS */;
INSERT INTO `credittransactions` VALUES ('2190ec1d-d012-4a88-bc15-0f5e7f87a7cc','1126517653','1126517653',0,10,'good boy :3','2025-12-16 20:02:27'),('2754d2e3-ca44-4d64-8a9d-8889402b12d3','1126517653','1126517653',10,67,'because we endorse six seven.','2025-12-16 20:09:41'),('3963e346-9ed9-4f1d-b87c-5c12ac78e5ea','1126517653','1126517653',0,-32768,'lol','2025-12-16 22:30:10'),('43976012-6826-4976-81f0-9c8954837c78','1126517653','1126517653',10033,14575,'cuz i can','2025-12-16 21:34:35'),('8eaa2b79-7af5-4900-9656-0d808086942d','1126517653','1126517653',34,10033,'becausei can','2025-12-16 21:23:40'),('9548b9ae-cc14-47b8-a35c-8f9a3cd70aa4','1126517653','1126517653',0,34,'rtgdfg','2025-12-16 21:23:04'),('c46e0529-5be5-4557-8233-60a6e53d1408','1126517653','1126517653',14575,0,'bebebe','2025-12-16 21:35:57'),('c71e8dbd-8a14-4fa5-b2c8-e814eff7bd0a','1126517653','1126517653',67,-9932,'<:woah:276360396372443137>','2025-12-16 20:12:17'),('f09f814b-7f3a-4ec8-b61d-84cf1a05a55c','1126517653','1126517653',-9932,0,'adios amigos','2025-12-16 20:17:23');
/*!40000 ALTER TABLE `credittransactions` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`shiftId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loggedshifts`
--

LOCK TABLES `loggedshifts` WRITE;
/*!40000 ALTER TABLE `loggedshifts` DISABLE KEYS */;
/*!40000 ALTER TABLE `loggedshifts` ENABLE KEYS */;
UNLOCK TABLES;

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
-- Dumping data for table `pendingregs`
--

LOCK TABLES `pendingregs` WRITE;
/*!40000 ALTER TABLE `pendingregs` DISABLE KEYS */;
/*!40000 ALTER TABLE `pendingregs` ENABLE KEYS */;
UNLOCK TABLES;

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
  PRIMARY KEY (`jobId`),
  UNIQUE KEY `whMessageId` (`whMessageId`),
  UNIQUE KEY `fwMessageId` (`fwMessageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pendingshiftlogs`
--

LOCK TABLES `pendingshiftlogs` WRITE;
/*!40000 ALTER TABLE `pendingshiftlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `pendingshiftlogs` ENABLE KEYS */;
UNLOCK TABLES;

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
  `entryCreated` datetime DEFAULT CURRENT_TIMESTAMP,
  `entryUpdated` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`robloxId`),
  UNIQUE KEY `robloxUsername` (`robloxUsername`),
  UNIQUE KEY `discordId` (`discordId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `personnel`
--

LOCK TABLES `personnel` WRITE;
/*!40000 ALTER TABLE `personnel` DISABLE KEYS */;
INSERT INTO `personnel` VALUES ('1126517653','597084523338924063','StolarchukBoris','Recruit','2025-12-16 20:00:49','2025-12-16 21:23:25');
/*!40000 ALTER TABLE `personnel` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-16 22:40:51
