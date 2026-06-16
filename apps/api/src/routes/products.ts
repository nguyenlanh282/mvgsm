import type { AuthContext } from '../index';
import { Hono } from 'hono';
import { db, schema } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import { requireAdminOrManager } from '../utils/roles';

export const productRoutes = new Hono<AuthContext>();

// Get all products
productRoutes.get('/', async (c) => {
  try {
    const companyId = c.get('companyId');
    const { year } = c.req.query();

    let whereCondition = and(
      eq(schema.products.companyId, companyId),
      eq(schema.products.isActive, 1)
    );

    if (year) {
      whereCondition = and(
        eq(schema.products.companyId, companyId),
        eq(schema.products.isActive, 1),
        eq(schema.products.year, parseInt(year))
      );
    }

    const products = await db.query.products.findMany({
      where: whereCondition,
      orderBy: desc(schema.products.revenue),
    });

    return c.json({ success: true, data: products });
  } catch (err) {
    console.error('Get products error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create product
productRoutes.post('/', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const data = await c.req.json();

    if (!data.name || !data.year) {
      return c.json({ success: false, error: 'Thông tin không đầy đủ' }, 400);
    }

    // Calculate BCG category based on growth rate and relative market share
    // This is a simplified calculation - in production would use actual market data
    let bcgCategory: 'star' | 'cow' | 'question' | 'dog' = 'question';
    if (data.growthRate !== undefined && data.revenue !== undefined) {
      if (data.growthRate > 10 && data.revenue > 1000000000) {
        bcgCategory = 'star';
      } else if (data.growthRate > 0 && data.revenue > 500000000) {
        bcgCategory = 'cow';
      } else if (data.growthRate < 0) {
        bcgCategory = 'dog';
      }
    }

    const productId = crypto.randomUUID();

    await db.insert(schema.products).values({
      id: productId,
      companyId,
      name: data.name,
      year: data.year,
      quantitySold: data.quantitySold ?? null,
      unitPrice: data.unitPrice ?? null,
      revenue: data.revenue ?? null,
      profitMargin: data.profitMargin ?? null,
      growthRate: data.growthRate ?? null,
      bcgCategory: data.bcgCategory ?? bcgCategory,
      isActive: 1,
    });

    const product = await db.query.products.findFirst({
      where: eq(schema.products.id, productId)
    });

    return c.json({ success: true, data: product }, 201);
  } catch (err) {
    console.error('Create product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update product
productRoutes.put('/:id', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const productId = c.req.param('id');
    const data = await c.req.json();

    const existing = await db.query.products.findFirst({
      where: and(eq(schema.products.id, productId), eq(schema.products.companyId, companyId))
    });

    if (!existing) {
      return c.json({ success: false, error: 'Sản phẩm không tồn tại' }, 404);
    }

    const updateData: Partial<{
      name: string;
      year: number;
      quantitySold: number | null;
      unitPrice: number | null;
      revenue: number | null;
      profitMargin: number | null;
      growthRate: number | null;
      bcgCategory: 'star' | 'cow' | 'question' | 'dog';
      isActive: number;
    }> = {};

    const allowedFields = ['name', 'year', 'quantitySold', 'unitPrice', 'revenue', 'profitMargin', 'growthRate', 'bcgCategory', 'isActive'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    await db.update(schema.products)
      .set(updateData)
      .where(eq(schema.products.id, productId));

    const updated = await db.query.products.findFirst({
      where: eq(schema.products.id, productId)
    });

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Delete product (soft delete)
productRoutes.delete('/:id', requireAdminOrManager(), async (c) => {
  try {
    const companyId = c.get('companyId');
    const productId = c.req.param('id');

    await db.update(schema.products)
      .set({ isActive: 0 })
      .where(and(eq(schema.products.id, productId), eq(schema.products.companyId, companyId)));

    return c.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
