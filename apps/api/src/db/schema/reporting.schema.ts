import { pgMaterializedView } from 'drizzle-orm/pg-core';
import { assets } from './asset.schema.js';

// Define a materialized view for Asset Summary (CQRS Read Model)
export const assetSummaryView = pgMaterializedView('asset_summary_view').as((qb) => 
  qb.select({
    id: assets.id,
    tenantId: assets.tenantId,
    assetCode: assets.assetCode,
    name: assets.name,
    status: assets.status,
    condition: assets.condition,
    purchasePrice: assets.purchasePrice,
    departmentId: assets.departmentId,
    locationId: assets.locationId,
    currentAssignedUserId: assets.currentAssignedUserId,
    createdAt: assets.createdAt,
    // Add computed fields in raw SQL if needed, e.g. age
    // For simplicity, we project the base fields here, and complex joins can be added
  })
  .from(assets)
);

// We can define other materialized views for Maintenance, Inventory, etc.
// For architectural demonstration, this suffices to show CQRS separation.
