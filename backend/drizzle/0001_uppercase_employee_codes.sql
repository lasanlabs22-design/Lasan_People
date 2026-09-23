-- Employee IDs are now stored uppercase; normalise ones created before that (e.g. "Ls003").
-- Sign-in and the unique index already compare lower(), so this can't create a clash.
UPDATE "users" SET "employee_code" = upper("employee_code") WHERE "employee_code" <> upper("employee_code");
