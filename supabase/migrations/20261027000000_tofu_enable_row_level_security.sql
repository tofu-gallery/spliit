-- Tofu (2026-10-27): Tofu's own file, not one of upstream's Prisma migrations (see TOFU.md).
-- Row-level security on, with no policy, for the eight tables the files before this one make. On a Tofu database,
-- Supabase's Data API roles (anon, authenticated and service_role) are given these tables, so without it anyone holding
-- the project's public key could read and change every group, participant and expense through the Data API. With it and
-- no policy, anon and authenticated read no row and can write none; service_role, whose key stays secret, bypasses
-- row-level security as before. Tofu applies these files with the app's own connection, which then owns the tables, so
-- the app itself is not limited (nothing here forces row-level security on the owner).
-- Never remove or edit this file. A later migration that adds a table needs the same line for that table, in a new
-- file after this one.
ALTER TABLE "Activity" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Expense" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpenseDocument" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ExpensePaidFor" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Group" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Participant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RecurringExpenseLink" ENABLE ROW LEVEL SECURITY;
