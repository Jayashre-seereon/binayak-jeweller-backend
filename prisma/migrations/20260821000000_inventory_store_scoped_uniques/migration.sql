-- Repair existing duplicate inventory labels within each store before adding
-- store-scoped unique constraints.
WITH inventory_sequence_base AS (
  SELECT
    "storeId",
    MAX(
      GREATEST(
        COALESCE(NULLIF(regexp_replace("inventoryCode", '\D', '', 'g'), '')::int, 0),
        COALESCE(NULLIF(regexp_replace("tagNo", '\D', '', 'g'), '')::int, 0),
        COALESCE(NULLIF(regexp_replace("barcodeNo", '\D', '', 'g'), '')::int, 0)
      )
    ) AS max_seq
  FROM "Inventory"
  GROUP BY "storeId"
),
duplicate_tags AS (
  SELECT
    i.id,
    i."storeId",
    i."tagNo",
    row_number() OVER (
      PARTITION BY i."storeId", i."tagNo"
      ORDER BY i.id
    ) AS dup_rank,
    row_number() OVER (
      PARTITION BY i."storeId"
      ORDER BY i.id
    ) AS store_rank
  FROM "Inventory" i
  WHERE i."tagNo" IS NOT NULL
),
tag_updates AS (
  SELECT
    d.id,
    CASE
      WHEN d."tagNo" LIKE 'OLD-%' THEN 'OLD'
      WHEN d."tagNo" LIKE 'BUL-%' THEN 'BUL'
      ELSE 'TAG'
    END AS prefix,
    (b.max_seq + d.store_rank) AS next_seq
  FROM duplicate_tags d
  JOIN inventory_sequence_base b
    ON b."storeId" = d."storeId"
  WHERE d.dup_rank > 1
),
duplicate_barcodes AS (
  SELECT
    i.id,
    i."storeId",
    row_number() OVER (
      PARTITION BY i."storeId", i."barcodeNo"
      ORDER BY i.id
    ) AS dup_rank,
    row_number() OVER (
      PARTITION BY i."storeId"
      ORDER BY i.id
    ) AS store_rank
  FROM "Inventory" i
  WHERE i."barcodeNo" IS NOT NULL
),
barcode_updates AS (
  SELECT
    d.id,
    (b.max_seq + d.store_rank) AS next_seq
  FROM duplicate_barcodes d
  JOIN inventory_sequence_base b
    ON b."storeId" = d."storeId"
  WHERE d.dup_rank > 1
)
UPDATE "Inventory" i
SET "tagNo" = t.prefix || '-' || LPAD(t.next_seq::text, 6, '0')
FROM tag_updates t
WHERE i.id = t.id;

WITH inventory_sequence_base AS (
  SELECT
    "storeId",
    MAX(
      GREATEST(
        COALESCE(NULLIF(regexp_replace("inventoryCode", '\D', '', 'g'), '')::int, 0),
        COALESCE(NULLIF(regexp_replace("tagNo", '\D', '', 'g'), '')::int, 0),
        COALESCE(NULLIF(regexp_replace("barcodeNo", '\D', '', 'g'), '')::int, 0)
      )
    ) AS max_seq
  FROM "Inventory"
  GROUP BY "storeId"
),
duplicate_barcodes AS (
  SELECT
    i.id,
    i."storeId",
    row_number() OVER (
      PARTITION BY i."storeId", i."barcodeNo"
      ORDER BY i.id
    ) AS dup_rank,
    row_number() OVER (
      PARTITION BY i."storeId"
      ORDER BY i.id
    ) AS store_rank
  FROM "Inventory" i
  WHERE i."barcodeNo" IS NOT NULL
),
barcode_updates AS (
  SELECT
    d.id,
    (b.max_seq + d.store_rank) AS next_seq
  FROM duplicate_barcodes d
  JOIN inventory_sequence_base b
    ON b."storeId" = d."storeId"
  WHERE d.dup_rank > 1
)
UPDATE "Inventory" i
SET "barcodeNo" = '890000' || LPAD(b.next_seq::text, 6, '0')
FROM barcode_updates b
WHERE i.id = b.id;

-- Drop existing global unique index on inventoryCode.
DROP INDEX IF EXISTS "Inventory_inventoryCode_key";

-- Add store-scoped unique constraints.
CREATE UNIQUE INDEX "Inventory_storeId_inventoryCode_key" ON "Inventory"("storeId", "inventoryCode");
CREATE UNIQUE INDEX "Inventory_storeId_tagNo_key" ON "Inventory"("storeId", "tagNo");
CREATE UNIQUE INDEX "Inventory_storeId_barcodeNo_key" ON "Inventory"("storeId", "barcodeNo");
