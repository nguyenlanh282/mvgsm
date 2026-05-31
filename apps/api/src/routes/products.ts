import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { requireAdminOrManager } from '../middleware/roles';
import type { Env } from '../types';

export const productRoutes = new Hono<{ Bindings: Env }>();

// Get all products
productRoutes.get('/', async (c) => {
  try {
    const { companyId } = getUser(c);
    const { year } = c.req.query();

    let query = `
      SELECT * FROM products WHERE company_id = ? AND is_active = 1
    `;
    const params: (string | number)[] = [companyId];

    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }

    query += ' ORDER BY revenue DESC';

    const products = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({ success: true, data: products.results });
  } catch (err) {
    console.error('Get products error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Create product
productRoutes.post('/', requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const data = await c.req.json();

    if (!data.name || !data.year) {
      return c.json({ success: false, error: 'Thông tin không đầy đủ' }, 400);
    }

    // Calculate BCG category based on growth rate and relative market share
    // This is a simplified calculation - in production would use actual market data
    let bcgCategory = 'question';
    if (data.growth_rate !== undefined && data.revenue !== undefined) {
      if (data.growth_rate > 10 && data.revenue > 1000000000) {
        bcgCategory = 'star';
      } else if (data.growth_rate > 0 && data.revenue > 500000000) {
        bcgCategory = 'cow';
      } else if (data.growth_rate < 0) {
        bcgCategory = 'dog';
      }
    }

    const productId = crypto.randomUUID();

    await c.env.DB.prepare(`
      INSERT INTO products (id, company_id, name, year, quantity_sold, unit_price, revenue, profit_margin, growth_rate, bcg_category, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      productId, companyId, data.name, data.year,
      data.quantity_sold || null, data.unit_price || null,
      data.revenue || null, data.profit_margin || null,
      data.growth_rate || null, data.bcg_category || bcgCategory
    ).run();

    const product = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();

    return c.json({ success: true, data: product }, 201);
  } catch (err) {
    console.error('Create product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Update product
productRoutes.put('/:id', requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const productId = c.req.param('id');
    const data = await c.req.json();

    const existing = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ? AND company_id = ?'
    ).bind(productId, companyId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Sản phẩm không tồn tại' }, 404);
    }

    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    const allowedFields = ['name', 'year', 'quantity_sold', 'unit_price', 'revenue', 'profit_margin', 'growth_rate', 'bcg_category', 'is_active'];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field] as string | number | null);
      }
    }

    if (fields.length === 0) {
      return c.json({ success: false, error: 'Không có gì để cập nhật' }, 400);
    }

    values.push(productId);

    await c.env.DB.prepare(`
      UPDATE products SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    const updated = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(productId).first();

    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error('Update product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});

// Delete product (soft delete)
productRoutes.delete('/:id', requireAdminOrManager(), async (c) => {
  try {
    const { companyId } = getUser(c);
    const productId = c.req.param('id');

    await c.env.DB.prepare(`
      UPDATE products SET is_active = 0 WHERE id = ? AND company_id = ?
    `).bind(productId, companyId).run();

    return c.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    return c.json({ success: false, error: 'Lỗi server' }, 500);
  }
});
