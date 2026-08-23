-- Clean up legacy inventory labels so they no longer affect sequence generation.

-- Remove malformed tag numbers that do not match the supported formats.
UPDATE "Inventory"
SET "tagNo" = NULL
WHERE "tagNo" IS NOT NULL
  AND NOT (
    "tagNo" ~* '^TAG-[0-9]{6}$'
    OR "tagNo" ~* '^OLD-[0-9]{6}$'
    OR "tagNo" ~* '^BUL-[0-9]{6}$'
  );

-- Remove malformed barcode numbers that do not match the generated format.
UPDATE "Inventory"
SET "barcodeNo" = NULL
WHERE "barcodeNo" IS NOT NULL
  AND NOT ("barcodeNo" ~ '^890000[0-9]{6}$');

-- Sync each store counter to the highest valid inventory sequence already stored.
WITH store_inventory_max AS (
  SELECT
    i."storeId",
    GREATEST(
      COALESCE(MAX(CASE WHEN i."inventoryCode" ~* '^INV-[0-9]{6}$' THEN SUBSTRING(i."inventoryCode" FROM '^INV-([0-9]{6})$')::INT END), 0),
      COALESCE(MAX(CASE WHEN i."tagNo" ~* '^(TAG|OLD|BUL)-[0-9]{6}$' THEN SUBSTRING(i."tagNo" FROM '^[A-Z]+-([0-9]{6})$')::INT END), 0)
    ) AS max_seq
  FROM "Inventory" i
  GROUP BY i."storeId"
)
UPDATE "StoreCounter" sc
SET "lastInventoryNumber" = COALESCE(m.max_seq, 0)
FROM store_inventory_max m
WHERE sc."storeId" = m."storeId";

-- Ensure stores with no inventory still have a valid counter row.
UPDATE "StoreCounter"
SET "lastInventoryNumber" = GREATEST("lastInventoryNumber", 0)
WHERE "lastInventoryNumber" IS NULL;
