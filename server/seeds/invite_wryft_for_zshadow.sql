-- PostgreSQL-compatible seed for a reusable invite code
-- Prisma creates the table with quoted CamelCase name and columns
INSERT INTO "InviteCode" ("id", "code", "maxUses", "uses", "expiresAt", "createdAt", "disabled")
VALUES ('seed-invite-1', 'wryft-for-zshadow', 10, 0, NULL, NOW(), false)
ON CONFLICT ("code") DO NOTHING;
