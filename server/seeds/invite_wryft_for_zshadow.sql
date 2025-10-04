INSERT INTO InviteCode (id, code, maxUses, uses, expiresAt, createdAt, disabled)
VALUES (lower(hex(randomblob(16))), 'wryft-for-zshadow', 10, 0, NULL, datetime('now'), 0);
