SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '86fa945c-1ec6-433f-bd2a-0050d506a0c6', '{"action":"user_signedup","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2025-07-20 19:43:35.366141+00', ''),
	('00000000-0000-0000-0000-000000000000', '94d0e884-8fce-4420-91cc-82f1974dca32', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-20 19:43:36.053643+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c9db57d0-0a72-4c85-b68e-413a275266bc', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-20 19:44:35.836645+00', ''),
	('00000000-0000-0000-0000-000000000000', '6529611f-fbe3-4195-946b-1aabd1202427', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-20 19:44:36.454842+00', ''),
	('00000000-0000-0000-0000-000000000000', 'fb0c39f6-d337-49ed-ac50-717586e5f2f5', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 20:43:06.072349+00', ''),
	('00000000-0000-0000-0000-000000000000', '97fa9840-f46b-430d-b4d0-ef2115fca0fd', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 20:43:06.074318+00', ''),
	('00000000-0000-0000-0000-000000000000', '1d1f2ae3-d11d-4ae8-bb73-6ab3de2bbef0', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 21:41:24.461308+00', ''),
	('00000000-0000-0000-0000-000000000000', '06162985-0c78-45c8-88bb-37cb254fc0a8', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 21:41:24.464145+00', ''),
	('00000000-0000-0000-0000-000000000000', '52642efa-a6f0-4874-99f4-d1ae994da455', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 22:39:57.774435+00', ''),
	('00000000-0000-0000-0000-000000000000', '64737d81-e153-4b45-84c0-1f4c8b947616', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 22:39:57.785685+00', ''),
	('00000000-0000-0000-0000-000000000000', '80183f3d-040e-463b-bd81-1b1eefb56724', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 23:38:05.194698+00', ''),
	('00000000-0000-0000-0000-000000000000', '2e1507e8-0c33-4b1f-a074-7f5035baf83b', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-20 23:38:05.196128+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b5e9fc9c-25ef-4a06-97de-7e4c4fa62e69', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 00:36:16.393309+00', ''),
	('00000000-0000-0000-0000-000000000000', '9610756a-9a7d-4ce4-99b9-f536188e4a50', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 00:36:16.393905+00', ''),
	('00000000-0000-0000-0000-000000000000', '1f36c2eb-7b9b-4461-9628-7d6a1ac0b2d0', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 01:34:35.795744+00', ''),
	('00000000-0000-0000-0000-000000000000', '109f30aa-1ca0-4ae7-baca-e6cbf8d7b951', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 01:34:35.798657+00', ''),
	('00000000-0000-0000-0000-000000000000', '876bb9d4-8c3d-4110-ad53-f5b16941b9cf', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 02:32:39.870914+00', ''),
	('00000000-0000-0000-0000-000000000000', '2a879de8-e4d1-4cf8-904e-f42d1457a22e', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 02:32:39.874828+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b3df4c15-a949-4793-ac30-4f9277b5c85f', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 03:30:50.284094+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd5948c02-61c7-4497-af51-51d8b1678fe5', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 03:30:50.285487+00', ''),
	('00000000-0000-0000-0000-000000000000', '717323c8-7e21-433e-a3a7-483def26c563', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 04:29:22.860812+00', ''),
	('00000000-0000-0000-0000-000000000000', '63aa861e-07c3-4550-94ef-d40ba9afcdc9', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 04:29:22.865596+00', ''),
	('00000000-0000-0000-0000-000000000000', '9e186514-3289-436e-93e3-dc1d46a0e79c', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 05:27:49.679329+00', ''),
	('00000000-0000-0000-0000-000000000000', '753d29c6-4012-4b82-9143-ad6b146c20e2', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 05:27:49.682632+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b52897ca-6277-4e2a-959a-f79baa6a9cbb', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 06:26:24.845615+00', ''),
	('00000000-0000-0000-0000-000000000000', '0fab0a75-d4b4-4f54-80e5-0f1c1d4def67', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 06:26:24.848861+00', ''),
	('00000000-0000-0000-0000-000000000000', '18096c69-7a5d-4b51-99b7-95ae6c43ccbc', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 12:11:04.012818+00', ''),
	('00000000-0000-0000-0000-000000000000', '5d9a165f-94bd-4ff9-9283-eaefb27bf176', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 12:11:04.013518+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f9cc4a3d-e316-4baa-a456-ae9b401d057d', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-21 13:02:11.2643+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a3e7500-3fba-4277-8ee1-693262a0bf90', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-21 13:02:11.993293+00', ''),
	('00000000-0000-0000-0000-000000000000', '55c4effb-b5ca-4ce9-b964-2f52a0477c9f', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 13:09:33.093256+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e1c98b6d-6eac-446b-bb06-cd38db5cee8a', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 13:09:33.099922+00', ''),
	('00000000-0000-0000-0000-000000000000', '3d41800f-82ad-4941-ba26-27b42e245523', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 14:07:47.884685+00', ''),
	('00000000-0000-0000-0000-000000000000', '0e6d7e96-daeb-4f32-a2c4-536b12e78c50', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 14:07:47.886166+00', ''),
	('00000000-0000-0000-0000-000000000000', '9d965071-c878-4e4d-8e62-943c4e7b132b', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 15:05:51.492818+00', ''),
	('00000000-0000-0000-0000-000000000000', '9a1fb3ac-512f-48ad-838f-c7642790ea69', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 15:05:51.494461+00', ''),
	('00000000-0000-0000-0000-000000000000', '6662af95-c79b-489a-8027-884a84b4f8b2', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 16:04:06.444228+00', ''),
	('00000000-0000-0000-0000-000000000000', '2ef57ae4-13d5-4b79-911b-45281fdea20f', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 16:04:06.44583+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad9051e5-cb3d-43db-aec2-aabffc97ca32', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 17:02:31.006043+00', ''),
	('00000000-0000-0000-0000-000000000000', '03b6b34a-b585-4bdc-a0e2-e369b09c1078', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 17:02:31.006934+00', ''),
	('00000000-0000-0000-0000-000000000000', '66cd77f1-6767-423e-81b9-0709b7b615f0', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 18:01:17.850282+00', ''),
	('00000000-0000-0000-0000-000000000000', '1706a3d1-ac7f-463a-ac46-a4e12dd25dce', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 18:01:17.851052+00', ''),
	('00000000-0000-0000-0000-000000000000', '8e7d0123-1c3d-4d40-af9c-1d7d976185cc', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 19:00:24.89152+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f3a9e256-601c-4592-824e-c0e5e93ef9e8', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 19:00:24.892487+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ae277d47-298f-4812-9b0e-b9167a875e47', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-21 19:52:20.939879+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd3b4b5e3-9492-485e-add0-f57aafa6e5c8', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-21 19:52:22.678319+00', ''),
	('00000000-0000-0000-0000-000000000000', '3aad4a81-43fd-44e5-a6c0-80dfc5866207', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 19:59:24.694767+00', ''),
	('00000000-0000-0000-0000-000000000000', '551c1047-575d-4a5c-b895-b67c856b5fa6', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 19:59:24.697305+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ecb6c0a1-12d0-49b8-8c61-6d3f3f51ae6c', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-21 19:59:43.136498+00', ''),
	('00000000-0000-0000-0000-000000000000', '39fd7a5f-8870-4902-9b5c-43615a68507e', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-21 19:59:43.963432+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd7801bb3-36d9-41a4-a20b-7cb82dff0c0b', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:51:24.734766+00', ''),
	('00000000-0000-0000-0000-000000000000', '11ade1c1-bced-4439-9df2-953d4d5d950c', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:51:24.737695+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ada90df1-1a75-4dbe-8cc6-f517933e79f1', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:57:43.818118+00', ''),
	('00000000-0000-0000-0000-000000000000', '6344ad37-cd10-4158-8dfc-383e3f3432bf', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:57:43.82182+00', ''),
	('00000000-0000-0000-0000-000000000000', '7539c3c2-f51a-4e5c-8508-0351ae364cbd', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:58:24.72853+00', ''),
	('00000000-0000-0000-0000-000000000000', '933ee815-9f8d-48a6-aeff-60d89e0b380c', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 20:58:24.729126+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f8f577e6-b02a-44da-b206-727c2e0e0510', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 21:50:20.480318+00', ''),
	('00000000-0000-0000-0000-000000000000', '152645fb-2cda-4361-b8ad-95400fa3e3c3', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-21 21:50:20.482666+00', ''),
	('00000000-0000-0000-0000-000000000000', 'dbffd0b8-8553-4ef3-8c3e-f876fcc3eee7', '{"action":"logout","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-21 21:50:23.710154+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f60af371-ff52-4032-ac5e-83e70c995579', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-21 21:50:25.554686+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd0b5e188-886e-48b9-8b88-361ba5223374', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-21 21:50:25.949455+00', ''),
	('00000000-0000-0000-0000-000000000000', '77f7e334-4840-4bbe-aff5-811f48c7bc16', '{"action":"logout","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account"}', '2025-07-21 21:50:30.507794+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ecbfb24-11c5-4b60-bb93-911ed328728f', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-21 21:50:32.423716+00', ''),
	('00000000-0000-0000-0000-000000000000', '3bfd7d8b-6ca5-461b-b4c9-5f7b1385954b', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-21 21:50:32.831832+00', ''),
	('00000000-0000-0000-0000-000000000000', '8f9c67c3-66ad-4f4a-b3d4-be6a8bd499d0', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-22 01:41:39.787767+00', ''),
	('00000000-0000-0000-0000-000000000000', '1d2bc3a7-afdb-4330-98ea-6d7d8c6074ac', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-22 01:41:40.678207+00', ''),
	('00000000-0000-0000-0000-000000000000', '0ea7daa2-04bc-467d-abf1-74a1f18d1090', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-22 01:42:54.109906+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f0be75b2-aa3c-4513-8296-af8c524e960a', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-22 01:42:54.828417+00', ''),
	('00000000-0000-0000-0000-000000000000', '12e1cc31-d930-43bd-8d3d-69857b00dd46', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 02:41:02.316252+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f862e901-9d5e-485f-85c0-bb66a852bac4', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 02:41:02.318067+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a889dc1a-6650-4f3a-bfe0-d1ea908a4a72', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 03:39:43.093053+00', ''),
	('00000000-0000-0000-0000-000000000000', 'b456e761-0f8b-44d2-882b-914d8a4b5972', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 03:39:43.093723+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e8ed273b-241d-482b-bd68-03cd48a0ed84', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 04:38:36.1174+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd857ec0b-4a80-4cd4-b248-adacf9eba022', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 04:38:36.117857+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ec9204bc-0603-4f3e-a511-46efb950d352', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 10:03:26.456092+00', ''),
	('00000000-0000-0000-0000-000000000000', 'c64fe6b5-09e7-4520-b198-1853bf3be434', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 10:03:26.45668+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f4285458-3644-455f-9ae7-5c5717acc6ff', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 14:04:42.051914+00', ''),
	('00000000-0000-0000-0000-000000000000', '01a63fc5-35ab-4e24-a9b9-78291f5c2f96', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 14:04:42.052831+00', ''),
	('00000000-0000-0000-0000-000000000000', 'bc69e5df-7c84-49ad-a553-5664a964d905', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 15:02:47.024356+00', ''),
	('00000000-0000-0000-0000-000000000000', '42f3d35a-8728-4def-820f-8e2ea5642d50', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 15:02:47.02634+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e3e495fe-5ac7-499b-ad4c-33e21e7958a5', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 18:09:46.701867+00', ''),
	('00000000-0000-0000-0000-000000000000', '9437ec5b-1a47-439e-ace1-1a761c6f57e0', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 18:09:46.704628+00', ''),
	('00000000-0000-0000-0000-000000000000', '3e9139ec-bfb3-4256-a4e2-be7bc61997f4', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2025-07-22 18:25:14.482467+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a7beec18-4fd0-484a-af4f-7a4f60923359', '{"action":"login","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2025-07-22 18:25:14.95351+00', ''),
	('00000000-0000-0000-0000-000000000000', '055a2ac4-52a2-4b8a-ad65-c3f95d5fd4dc', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 19:08:25.574562+00', ''),
	('00000000-0000-0000-0000-000000000000', '014985d6-9091-4108-8cbe-965a4fa5c7d1', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 19:08:25.578488+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a66f6497-d4bc-4ce3-ad60-55f05879220c', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 19:24:28.993837+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f1e24edb-2d6f-4f96-9b81-4331262c7f1a', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 19:24:28.995436+00', ''),
	('00000000-0000-0000-0000-000000000000', '3b5da4fc-1804-4aff-830d-606b231831b1', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 20:07:07.678098+00', ''),
	('00000000-0000-0000-0000-000000000000', '57277a8a-14a0-4109-8b34-8b8a6b19a73a', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 20:07:07.684256+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a856a758-22dc-44b3-a2dd-c2be6bab7601', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 20:23:25.645272+00', ''),
	('00000000-0000-0000-0000-000000000000', '28db8a53-f094-4def-9fa3-07c078fe4853', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 20:23:25.650995+00', ''),
	('00000000-0000-0000-0000-000000000000', '84fa6002-be68-4369-acf6-92ba4b8a5d27', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 21:05:58.688864+00', ''),
	('00000000-0000-0000-0000-000000000000', 'f758535c-9fee-49f0-b035-28b55a57479f', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 21:05:58.692987+00', ''),
	('00000000-0000-0000-0000-000000000000', 'de7672cb-d2c1-4437-842c-a36c2aff39e8', '{"action":"token_refreshed","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 21:22:25.671404+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e0a11cbe-cb4f-44df-a547-0e9e017a59b6', '{"action":"token_revoked","actor_id":"de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9","actor_name":"Kurt Pessa","actor_username":"kpessa@gmail.com","actor_via_sso":false,"log_type":"token"}', '2025-07-22 21:22:25.672529+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', 'authenticated', 'authenticated', 'kpessa@gmail.com', NULL, '2025-07-20 19:43:35.367905+00', NULL, '', NULL, '', NULL, '', '', NULL, '2025-07-22 18:25:14.954113+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "101444553268869787824", "name": "Kurt Pessa", "email": "kpessa@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL4HNqeTND8zjawzGM_cEXS8MA3ctMtQ2Fv5m8gqiPFXkK12de3=s96-c", "full_name": "Kurt Pessa", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL4HNqeTND8zjawzGM_cEXS8MA3ctMtQ2Fv5m8gqiPFXkK12de3=s96-c", "provider_id": "101444553268869787824", "email_verified": true, "phone_verified": false}', NULL, '2025-07-20 19:43:35.353368+00', '2025-07-22 21:22:25.678113+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('101444553268869787824', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '{"iss": "https://accounts.google.com", "sub": "101444553268869787824", "name": "Kurt Pessa", "email": "kpessa@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocL4HNqeTND8zjawzGM_cEXS8MA3ctMtQ2Fv5m8gqiPFXkK12de3=s96-c", "full_name": "Kurt Pessa", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocL4HNqeTND8zjawzGM_cEXS8MA3ctMtQ2Fv5m8gqiPFXkK12de3=s96-c", "provider_id": "101444553268869787824", "email_verified": true, "phone_verified": false}', 'google', '2025-07-20 19:43:35.359411+00', '2025-07-20 19:43:35.359465+00', '2025-07-22 18:25:14.472895+00', '43d24809-9dd5-41d0-8f55-253cf0bd0f04');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag") VALUES
	('ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '2025-07-22 01:42:54.829111+00', '2025-07-22 21:05:58.705949+00', NULL, 'aal1', NULL, '2025-07-22 21:05:58.705858', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1 Edg/138.0.0.0', '172.18.0.1', NULL),
	('65e0965e-4ff3-4bf2-966b-5e56cb458e32', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '2025-07-22 18:25:14.954188+00', '2025-07-22 21:22:25.679735+00', NULL, 'aal1', NULL, '2025-07-22 21:22:25.67965', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '172.18.0.1', NULL),
	('5d17243f-ebea-4ebf-bdc8-cc308b762c7c', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '2025-07-21 21:50:32.832594+00', '2025-07-21 21:50:32.832594+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '172.18.0.1', NULL),
	('c24dc135-bfa1-4468-94ea-f24c229cbbda', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '2025-07-22 01:41:40.679381+00', '2025-07-22 01:41:40.679381+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0', '172.18.0.1', NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('5d17243f-ebea-4ebf-bdc8-cc308b762c7c', '2025-07-21 21:50:32.834401+00', '2025-07-21 21:50:32.834401+00', 'oauth', '84f02982-b2f0-4c54-b9d2-7dedeadb2502'),
	('c24dc135-bfa1-4468-94ea-f24c229cbbda', '2025-07-22 01:41:40.68277+00', '2025-07-22 01:41:40.68277+00', 'oauth', '0cb40afb-cf70-4571-ad9f-e12e0889f339'),
	('ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6', '2025-07-22 01:42:54.83186+00', '2025-07-22 01:42:54.83186+00', 'oauth', '2f4c75b4-664f-4e37-bf77-9ce618fbd504'),
	('65e0965e-4ff3-4bf2-966b-5e56cb458e32', '2025-07-22 18:25:14.968135+00', '2025-07-22 18:25:14.968135+00', 'oauth', 'dc5dbfba-69c6-4a8c-9915-ae9cc406527d');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 35, 'roaen4somjpw', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 03:39:43.094588+00', '2025-07-22 04:38:36.118215+00', 'gxtt5ztyd3y3', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 36, 'f4yanctuozcj', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 04:38:36.118577+00', '2025-07-22 10:03:26.457108+00', 'roaen4somjpw', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 37, 'wkve72ugn3rq', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 10:03:26.457312+00', '2025-07-22 14:04:42.053954+00', 'f4yanctuozcj', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 38, '6hrs4j5zz2cw', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 14:04:42.054505+00', '2025-07-22 15:02:47.026831+00', 'wkve72ugn3rq', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 39, '7xq47akeg2mg', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 15:02:47.027842+00', '2025-07-22 18:09:46.705372+00', '6hrs4j5zz2cw', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 40, 'f6f45y5ic6w7', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 18:09:46.706906+00', '2025-07-22 19:08:25.579057+00', '7xq47akeg2mg', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 41, 'u4one5i5qj3t', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 18:25:14.960997+00', '2025-07-22 19:24:28.996304+00', NULL, '65e0965e-4ff3-4bf2-966b-5e56cb458e32'),
	('00000000-0000-0000-0000-000000000000', 42, 'bho3lqtsx5nb', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 19:08:25.580079+00', '2025-07-22 20:07:07.685729+00', 'f6f45y5ic6w7', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 43, 'wpn5ulpjqapt', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 19:24:28.99734+00', '2025-07-22 20:23:25.65188+00', 'u4one5i5qj3t', '65e0965e-4ff3-4bf2-966b-5e56cb458e32'),
	('00000000-0000-0000-0000-000000000000', 44, 'juesksay5ban', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 20:07:07.690421+00', '2025-07-22 21:05:58.693573+00', 'bho3lqtsx5nb', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 46, 'fc7smdm37gvv', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', false, '2025-07-22 21:05:58.696057+00', '2025-07-22 21:05:58.696057+00', 'juesksay5ban', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 45, 'ujugbcy6ylp6', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 20:23:25.652542+00', '2025-07-22 21:22:25.673038+00', 'wpn5ulpjqapt', '65e0965e-4ff3-4bf2-966b-5e56cb458e32'),
	('00000000-0000-0000-0000-000000000000', 47, 'rezank44uykj', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', false, '2025-07-22 21:22:25.675033+00', '2025-07-22 21:22:25.675033+00', 'ujugbcy6ylp6', '65e0965e-4ff3-4bf2-966b-5e56cb458e32'),
	('00000000-0000-0000-0000-000000000000', 31, 'mdtfbq6a2pem', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', false, '2025-07-21 21:50:32.833212+00', '2025-07-21 21:50:32.833212+00', NULL, '5d17243f-ebea-4ebf-bdc8-cc308b762c7c'),
	('00000000-0000-0000-0000-000000000000', 32, 'vh4dvbzmqld7', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', false, '2025-07-22 01:41:40.680586+00', '2025-07-22 01:41:40.680586+00', NULL, 'c24dc135-bfa1-4468-94ea-f24c229cbbda'),
	('00000000-0000-0000-0000-000000000000', 33, 'swtho3w6vdnw', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 01:42:54.830232+00', '2025-07-22 02:41:02.318801+00', NULL, 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6'),
	('00000000-0000-0000-0000-000000000000', 34, 'gxtt5ztyd3y3', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', true, '2025-07-22 02:41:02.319687+00', '2025-07-22 03:39:43.094158+00', 'swtho3w6vdnw', 'ba466e3a-96ba-472b-ba9b-b7cf23dc7ee6');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: brain_dumps; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."brain_dumps" ("id", "user_id", "title", "raw_text", "nodes", "edges", "categories", "created_at", "updated_at") VALUES
	('braindump-1753103063651', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', 'Brain Dump 7/21/2025', 'Timebox', '[{"id": "root", "data": {"label": "Brain Dump", "children": ["category-misc", "41152083-f571-46b0-9f12-a255833015b3", "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "ec2efc68-1353-46bc-a21d-c4476496d12d"], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "root", "dragging": false, "measured": {"width": 154, "height": 44}, "position": {"x": 0, "y": 275}, "selected": false}, {"id": "category-misc", "data": {"label": "ToDo", "urgency": 4.161444122211609, "category": "misc", "children": ["thought-1753103063651-0", "407a4e38-9068-424d-99ff-cee772709f3d", "72814e48-970a-4ea9-bce4-db0900b724dc", "8cc0b365-356a-41cc-8ad3-b64127e0008f"], "importance": 5.621901688502335, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "category", "dragging": false, "measured": {"width": 164, "height": 48}, "position": {"x": 200, "y": 47.86862622687345}, "selected": false}, {"id": "thought-1753103063651-0", "data": {"label": "Timebox", "urgency": 5.098426122973015, "category": "misc", "children": [], "importance": 8.115075629572491, "layoutMode": "freeform", "aiGenerated": false, "isTimedTask": true, "timeboxDate": "2025-07-22", "originalText": "Timebox", "timeboxDuration": 120, "parentLayoutMode": "freeform", "timeboxStartTime": "10:00"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 461.4882870144569, "y": 0}, "selected": false}, {"id": "41152083-f571-46b0-9f12-a255833015b3", "data": {"label": "Body", "style": {"textColor": "#065f46", "borderColor": "#10b981", "backgroundColor": "#d1fae5"}, "width": 195, "height": 49, "category": "misc", "children": ["b8850171-2f9c-4b4d-a445-063a42062fa8", "3a9a9ae7-a07e-4df1-aa9f-8f3d04117ebf"], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 49}, "position": {"x": -234.63200007357563, "y": 373.4744271236448}, "selected": false}, {"id": "b8850171-2f9c-4b4d-a445-063a42062fa8", "data": {"label": "rollerblade", "urgency": 5.781296526357758, "category": "misc", "children": [], "importance": 8.671944789536637, "layoutMode": "freeform", "isCollapsed": false, "isTimedTask": true, "timeboxDate": "2025-07-22", "timeboxDuration": 120, "parentLayoutMode": "freeform", "timeboxStartTime": "14:00"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": -497.8593817620749, "y": 393.1251995696598}, "selected": false}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "data": {"label": "Work", "width": 200, "height": 45, "category": "misc", "children": ["3f14a1da-ffa9-403e-8d1a-0d839f314350", "fbab7305-c9e9-46b0-a105-1b3594dbb430", "a46039e7-d210-45d4-9149-46a8c61853c1", "75fc30a8-6a2d-4486-81f5-adcd88028141", "e194dc25-d2d3-40a3-bb0f-86629015ac94"], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 45}, "position": {"x": 200, "y": 450}, "selected": false}, {"id": "3f14a1da-ffa9-403e-8d1a-0d839f314350", "data": {"label": "Immunizations", "urgency": 4.581569099913263, "category": "misc", "children": [], "importance": 7.472217363092142, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 457.43491774985176, "y": 419.52787203494955}, "selected": false}, {"id": "407a4e38-9068-424d-99ff-cee772709f3d", "data": {"label": "Scooter", "dueDate": "2025-07-23T14:18:37.246Z", "urgency": 9.163138199826527, "category": "misc", "children": [], "importance": 8.740877332749506, "layoutMode": "freeform", "taskStatus": "pending", "isCollapsed": false, "isTimedTask": true, "timeboxDate": "2025-07-21", "timeboxDuration": 120, "parentLayoutMode": "freeform", "timeboxStartTime": "14:00", "autoUrgencyFromDueDate": true}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 473.5186040390246, "y": 69.25585649277151}, "selected": false}, {"id": "72814e48-970a-4ea9-bce4-db0900b724dc", "data": {"label": "Best Buy - Broken TV", "urgency": 4.581569099913263, "category": "misc", "children": [], "importance": 7.472217363092142, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 462.82498890607553, "y": 167.91915460115288}, "selected": false}, {"id": "fbab7305-c9e9-46b0-a105-1b3594dbb430", "data": {"label": "Multum", "style": {"textColor": "#991b1b", "borderColor": "#ef4444", "backgroundColor": "#fee2e2"}, "urgency": 9.137963193778889, "category": "misc", "children": [], "importance": 8.941091327626493, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 459.73231445984584, "y": 491.9591115150207}, "selected": false}, {"id": "3a9a9ae7-a07e-4df1-aa9f-8f3d04117ebf", "data": {"label": "tennis wall", "category": "misc", "children": [], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "measured": {"width": 200, "height": 40}, "position": {"x": -384.24303170809384, "y": 482.9217046596982}, "selected": false}, {"id": "a46039e7-d210-45d4-9149-46a8c61853c1", "data": {"label": "bh 48 hr abx review", "category": "misc", "children": [], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 462.3978601628954, "y": 560.4226201359394}, "selected": false}, {"id": "75fc30a8-6a2d-4486-81f5-adcd88028141", "data": {"label": "Advisor Enhancements", "dueDate": "2025-07-28T15:03:35.397Z", "urgency": 5.781296526357758, "category": "misc", "children": [], "importance": 8.115075629572491, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "measured": {"width": 200, "height": 40}, "position": {"x": 366.1255070852377, "y": 625.3281189244501}, "selected": false}, {"id": "8cc0b365-356a-41cc-8ad3-b64127e0008f", "data": {"label": "Eisenhower Matrix", "category": "misc", "children": ["category-misc"], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 472.27961449545376, "y": -94.82991356450367}, "selected": false}, {"id": "ec2efc68-1353-46bc-a21d-c4476496d12d", "data": {"label": "Trips", "category": "trips", "children": ["da677ea6-a6a9-41c3-8ffb-1d02ceacfef8", "23883f38-2794-4330-891c-677af97946a6"], "thoughts": [], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "category", "dragging": false, "measured": {"width": 163, "height": 48}, "position": {"x": -171.21409966772012, "y": 101.12895408058921}, "selected": false}, {"id": "23883f38-2794-4330-891c-677af97946a6", "data": {"label": "Las Vegas\n- Magic Live", "dueDate": "2025-08-03T00:00:00.000Z", "category": "misc", "children": [], "layoutMode": "freeform", "isCollapsed": false, "priorityMode": "simple", "parentLayoutMode": "freeform"}, "type": "thought", "measured": {"width": 200, "height": 40}, "position": {"x": -397.5938751217192, "y": 127.53992788355575}, "selected": false}, {"id": "e194dc25-d2d3-40a3-bb0f-86629015ac94", "data": {"label": "Atlanta Go-Live", "dueDate": "2025-08-11T00:00:00.000Z", "category": "misc", "children": ["b9702f28-7b42-4f59-93b1-f1e2e5ec7256"], "layoutMode": "freeform", "isCollapsed": true, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 454.8715621772235, "y": 336.62136041711665}, "selected": false}, {"id": "b9702f28-7b42-4f59-93b1-f1e2e5ec7256", "data": {"label": "Super-User Training", "dueDate": "2025-07-28T00:00:00.000Z", "category": "misc", "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": 683.0440777966869, "y": 337.76222299521385}, "selected": true}, {"id": "997d3669-7776-4c3e-9800-cd317e926a67", "data": {"label": "Home", "category": "home", "thoughts": [], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "category", "dragging": true, "measured": {"width": 167, "height": 48}, "position": {"x": 25.198724795933174, "y": 126.55220006671419}, "selected": false}, {"id": "8c3e2fab-05cb-4054-9330-f24eff24c639", "data": {"label": "Lubbock", "dueDate": "2025-07-26T00:00:00.000Z", "category": "misc", "importance": 8.671944789536637, "layoutMode": "freeform", "isCollapsed": true, "parentLayoutMode": "freeform", "autoUrgencyFromDueDate": true}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 40}, "position": {"x": -469.1216955979172, "y": -119.2971288494413}, "selected": false}, {"id": "1e7f49a1-1e11-4ae8-acdc-d7a81ef30933", "data": {"label": "Haircut (optional)", "category": "misc", "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 38}, "position": {"x": -135.79081597808553, "y": -233.78507195091186}, "selected": false}, {"id": "b25d04bd-5415-43b0-afde-2d20101ab17a", "data": {"label": "Speech", "dueDate": "2025-07-23T14:17:02.857Z", "category": "misc", "importance": 8.671944789536637, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 38}, "position": {"x": -174.41158949360795, "y": -387.9999279494503}, "selected": false}, {"id": "6ce1899b-85e8-49c5-8db1-e851dec0c50d", "data": {"label": "What to wear", "dueDate": "2025-07-25T00:00:00.000Z", "category": "misc", "importance": 8.671944789536637, "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 38}, "position": {"x": -139.7706699106186, "y": -310.0069744140482}, "selected": false}, {"id": "6f222505-3173-4ef1-90db-1b989a9fbab4", "data": {"label": "Pack / Prepare", "category": "misc", "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "dragging": false, "measured": {"width": 200, "height": 38}, "position": {"x": -134.79563046110712, "y": -158.0186656990628}, "selected": false}, {"id": "a72d69e6-44b3-4585-948d-62b013e15867", "data": {"label": "Cedar Hills - Nebulizing Treatments", "category": "misc", "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "thought", "measured": {"width": 200, "height": 60}, "position": {"x": 439.0530833010216, "y": 275.26726565954135}}, {"id": "a27f18af-1f5d-4408-9419-126c094f66a2", "data": {"label": "Brain Space", "category": "brain space", "thoughts": [], "layoutMode": "freeform", "isCollapsed": false, "parentLayoutMode": "freeform"}, "type": "category", "measured": {"width": 217, "height": 48}, "position": {"x": -21.950131893287868, "y": 503.6529621156638}}, {"id": "node-1753197199258-msdof4yt3", "data": {"label": "🚙 Leo - Learning Experience - Dropoff", "width": 200, "height": 79, "attempts": [], "category": "tasks", "children": [], "taskType": "recurring", "taskStatus": "pending", "isCollapsed": false, "isTimedTask": false, "currentStreak": 0, "longestStreak": 0, "totalAttempts": 0, "timeboxDuration": 120, "timeboxStartTime": "08:00", "recurrencePattern": {"type": "daily", "frequency": 1, "startDate": "2025-07-22"}, "recurringCompletions": [{"date": "2025-07-22", "completedAt": "2025-07-22T15:32:51.750Z"}], "lastRecurringCompletionDate": "2025-07-22"}, "type": "thought", "position": {"x": 0, "y": 0}}, {"id": "node-1753207823591-yw7mb8xtf", "data": {"label": "Eisenhower Matrix", "attempts": [], "category": "tasks", "children": [], "taskStatus": "pending", "isCollapsed": false, "isTimedTask": true, "timeboxDate": "2025-07-22", "totalAttempts": 0, "timeboxDuration": 120, "timeboxStartTime": "14:00"}, "type": "thought", "position": {"x": 0, "y": 0}}]', '[{"id": "edge-root-misc", "type": "floating", "source": "root", "target": "category-misc", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "edge-category-misc-thought-1753103063651-0", "type": "floating", "source": "category-misc", "target": "thought-1753103063651-0", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "root-41152083-f571-46b0-9f12-a255833015b3", "type": "floating", "source": "root", "target": "41152083-f571-46b0-9f12-a255833015b3", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "41152083-f571-46b0-9f12-a255833015b3-b8850171-2f9c-4b4d-a445-063a42062fa8", "type": "floating", "source": "41152083-f571-46b0-9f12-a255833015b3", "target": "b8850171-2f9c-4b4d-a445-063a42062fa8", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "root-40d366ab-0fe5-4f7f-a22c-a37b195c2110", "type": "floating", "source": "root", "target": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-3f14a1da-ffa9-403e-8d1a-0d839f314350", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "3f14a1da-ffa9-403e-8d1a-0d839f314350", "animated": true, "selected": false, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "category-misc-407a4e38-9068-424d-99ff-cee772709f3d", "type": "floating", "source": "category-misc", "target": "407a4e38-9068-424d-99ff-cee772709f3d", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "category-misc-72814e48-970a-4ea9-bce4-db0900b724dc", "type": "floating", "source": "category-misc", "target": "72814e48-970a-4ea9-bce4-db0900b724dc", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-fbab7305-c9e9-46b0-a105-1b3594dbb430", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "fbab7305-c9e9-46b0-a105-1b3594dbb430", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "41152083-f571-46b0-9f12-a255833015b3-3a9a9ae7-a07e-4df1-aa9f-8f3d04117ebf", "type": "floating", "source": "41152083-f571-46b0-9f12-a255833015b3", "target": "3a9a9ae7-a07e-4df1-aa9f-8f3d04117ebf", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-a46039e7-d210-45d4-9149-46a8c61853c1", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "a46039e7-d210-45d4-9149-46a8c61853c1", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-75fc30a8-6a2d-4486-81f5-adcd88028141", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "75fc30a8-6a2d-4486-81f5-adcd88028141", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__roottop-source-ec2efc68-1353-46bc-a21d-c4476496d12dright", "type": "floating", "source": "root", "target": "ec2efc68-1353-46bc-a21d-c4476496d12d", "animated": true, "deletable": true, "sourceHandle": "top-source", "targetHandle": "right", "reconnectable": true}, {"id": "ec2efc68-1353-46bc-a21d-c4476496d12d-23883f38-2794-4330-891c-677af97946a6", "type": "floating", "source": "ec2efc68-1353-46bc-a21d-c4476496d12d", "target": "23883f38-2794-4330-891c-677af97946a6", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-e194dc25-d2d3-40a3-bb0f-86629015ac94", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "e194dc25-d2d3-40a3-bb0f-86629015ac94", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "e194dc25-d2d3-40a3-bb0f-86629015ac94-b9702f28-7b42-4f59-93b1-f1e2e5ec7256", "type": "floating", "source": "e194dc25-d2d3-40a3-bb0f-86629015ac94", "target": "b9702f28-7b42-4f59-93b1-f1e2e5ec7256", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__8cc0b365-356a-41cc-8ad3-b64127e0008fleft-category-miscright", "type": "floating", "source": "8cc0b365-356a-41cc-8ad3-b64127e0008f", "target": "category-misc", "animated": true, "deletable": true, "sourceHandle": "left-source", "targetHandle": "right", "reconnectable": true}, {"id": "xy-edge__category-miscright-source-8cc0b365-356a-41cc-8ad3-b64127e0008fleft", "type": "floating", "source": "category-misc", "target": "8cc0b365-356a-41cc-8ad3-b64127e0008f", "animated": true, "deletable": true, "sourceHandle": "right-source", "targetHandle": "left", "reconnectable": true}, {"id": "xy-edge__category-miscright-source-ec466a90-71b6-4d71-82f8-26efa52babecleft", "type": "floating", "source": "category-misc", "target": "ec466a90-71b6-4d71-82f8-26efa52babec", "animated": true, "deletable": true, "sourceHandle": "right-source", "targetHandle": "left", "reconnectable": true}, {"id": "xy-edge__category-miscright-source-912f0699-3dcd-4eed-8b55-2d32dab05dacleft", "type": "default", "source": "category-misc", "target": "912f0699-3dcd-4eed-8b55-2d32dab05dac", "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__category-miscright-source-168931df-e946-4aef-8e52-d40158b5403cleft", "type": "default", "source": "category-misc", "target": "168931df-e946-4aef-8e52-d40158b5403c", "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__roottop-source-997d3669-7776-4c3e-9800-cd317e926a67bottom", "type": "floating", "source": "root", "target": "997d3669-7776-4c3e-9800-cd317e926a67", "animated": true, "deletable": true, "sourceHandle": "top-source", "targetHandle": "bottom", "reconnectable": true}, {"id": "xy-edge__997d3669-7776-4c3e-9800-cd317e926a67right-source-ae6d7843-9629-44f6-a34e-41aa4adbdc03left", "type": "floating", "source": "997d3669-7776-4c3e-9800-cd317e926a67", "target": "ae6d7843-9629-44f6-a34e-41aa4adbdc03", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__ec2efc68-1353-46bc-a21d-c4476496d12dright-source-8c3e2fab-05cb-4054-9330-f24eff24c639left", "type": "floating", "source": "ec2efc68-1353-46bc-a21d-c4476496d12d", "target": "8c3e2fab-05cb-4054-9330-f24eff24c639", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__8c3e2fab-05cb-4054-9330-f24eff24c639right-source-1e7f49a1-1e11-4ae8-acdc-d7a81ef30933left", "type": "floating", "source": "8c3e2fab-05cb-4054-9330-f24eff24c639", "target": "1e7f49a1-1e11-4ae8-acdc-d7a81ef30933", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__8c3e2fab-05cb-4054-9330-f24eff24c639right-source-b25d04bd-5415-43b0-afde-2d20101ab17aleft", "type": "floating", "source": "8c3e2fab-05cb-4054-9330-f24eff24c639", "target": "b25d04bd-5415-43b0-afde-2d20101ab17a", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__8c3e2fab-05cb-4054-9330-f24eff24c639right-source-6ce1899b-85e8-49c5-8db1-e851dec0c50dleft", "type": "floating", "source": "8c3e2fab-05cb-4054-9330-f24eff24c639", "target": "6ce1899b-85e8-49c5-8db1-e851dec0c50d", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__8c3e2fab-05cb-4054-9330-f24eff24c639right-source-6f222505-3173-4ef1-90db-1b989a9fbab4left", "type": "floating", "source": "8c3e2fab-05cb-4054-9330-f24eff24c639", "target": "6f222505-3173-4ef1-90db-1b989a9fbab4", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "40d366ab-0fe5-4f7f-a22c-a37b195c2110-a72d69e6-44b3-4585-948d-62b013e15867", "type": "floating", "source": "40d366ab-0fe5-4f7f-a22c-a37b195c2110", "target": "a72d69e6-44b3-4585-948d-62b013e15867", "animated": true, "sourceHandle": "right-source", "targetHandle": "left"}, {"id": "xy-edge__rootbottom-source-a27f18af-1f5d-4408-9419-126c094f66a2left-source", "type": "floating", "source": "root", "target": "a27f18af-1f5d-4408-9419-126c094f66a2", "animated": true, "deletable": true, "sourceHandle": "bottom-source", "targetHandle": "left-source", "reconnectable": true}]', '[{"id": "ideas", "name": "Ideas", "color": "#3b82f6", "nodeCount": 0}, {"id": "tasks", "name": "Tasks", "color": "#10b981", "nodeCount": 0}, {"id": "questions", "name": "Questions", "color": "#f59e0b", "nodeCount": 0}, {"id": "insights", "name": "Insights", "color": "#8b5cf6", "nodeCount": 0}, {"id": "problems", "name": "Problems", "color": "#ef4444", "nodeCount": 0}, {"id": "misc", "name": "Miscellaneous", "color": "#6b7280", "nodeCount": 2}]', '2025-07-21 13:04:23.748215+00', '2025-07-22 18:40:12.968234+00');


--
-- Data for Name: journal_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."journal_entries" ("id", "user_id", "date", "gratitude", "daily_quest", "threats", "allies", "notes", "xp_earned", "created_at", "updated_at") VALUES
	('entry-1753111926628', 'de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', '2025-07-21 15:32:06.628+00', '{family,"Weverton and Jessenia",Leo,PTO,"having a job"}', 'Scooter!', '', '', '', 65, '2025-07-21 15:32:06.628+00', '2025-07-21 15:32:06.628+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "username", "avatar_url", "created_at", "updated_at") VALUES
	('de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', NULL, NULL, '2025-07-20 19:43:35.349336+00', '2025-07-20 19:43:35.349336+00');


--
-- Data for Name: user_progress; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_progress" ("user_id", "level", "current_xp", "total_xp", "current_streak", "longest_streak", "total_entries", "achievements", "last_entry_date", "created_at", "updated_at") VALUES
	('de383b20-5dc7-4cdc-bc78-3c7cec1bd8f9', 1, 65, 65, 1, 1, 1, '[]', '2025-07-21 15:32:06.628+00', '2025-07-20 19:43:35.349336+00', '2025-07-21 15:53:21.588736+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 47, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

RESET ALL;
