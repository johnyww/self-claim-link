import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyAdminToken } from '@/lib/auth';
import { addDays } from 'date-fns';
import { Order } from '@/lib/types';

// #region Helper Functions
async function handleAdminAuth(request: NextRequest) {
  const admin = await verifyAdminToken(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return admin;
}

function validateContentType(request: NextRequest) {
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
  }
  return null;
}

function validateProductIds(product_ids: any) {
  if (!Array.isArray(product_ids) || product_ids.length === 0) {
    return 'At least one product is required';
  }
  for (const productId of product_ids) {
    if (!Number.isInteger(productId) || productId < 1) {
      return 'All product IDs must be positive integers';
    }
  }
  return null;
}

function validateExpiration(expiration_days: any) {
  if (expiration_days !== undefined && expiration_days !== null) {
    const days = parseInt(expiration_days.toString(), 10);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return 'Expiration days must be between 1 and 3650';
    }
    return addDays(new Date(), days).toISOString();
  }
  return null;
}

async function getOrderWithProducts(db: any, orderId: number) {
  const order = await db.get(`
    SELECT o.*,
           GROUP_CONCAT(p.name ORDER BY p.id) as product_names,
           GROUP_CONCAT(p.id ORDER BY p.id) as product_ids
    FROM orders o
    LEFT JOIN order_products op ON o.id = op.order_id
    LEFT JOIN products p ON op.product_id = p.id
    WHERE o.id = ?
    GROUP BY o.id
  `, [orderId]);

  if (order) {
    return {
      ...order,
      product_names: order.product_names ? order.product_names.split(',') : [],
      product_ids: order.product_ids ? order.product_ids.split(',').map(Number) : []
    };
  }
  return null;
}

// #endregion



export async function GET(request: NextRequest) {
  try {
    const admin = await handleAdminAuth(request);
    if (admin instanceof NextResponse) return admin;

    const db = await getDatabase();
    const orders: Order[] = await db.all(`
      SELECT o.id, o.order_id, o.claim_status, o.claim_timestamp, o.claim_count, o.expiration_date, o.one_time_use, o.created_by, o.created_at,
             GROUP_CONCAT(p.name ORDER BY p.id) as product_names
      FROM orders o
      LEFT JOIN order_products op ON o.id = op.order_id
      LEFT JOIN products p ON op.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const ordersWithProducts = orders.map((order) => ({
      ...order,
      product_names: order.product_names ? order.product_names.split(',') : [],
    }));

    return NextResponse.json(ordersWithProducts);
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  const db = await getDatabase();
  try {
    const admin = await handleAdminAuth(request);
    if (admin instanceof NextResponse) return admin;

    const contentTypeError = validateContentType(request);
    if (contentTypeError) return contentTypeError;

    const { order_id, product_ids, expiration_days, one_time_use, created_by } = await request.json();

    if (!order_id || typeof order_id !== 'string' || order_id.trim().length === 0) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }
    
    const productIdsError = validateProductIds(product_ids);
    if (productIdsError) return NextResponse.json({ error: productIdsError }, { status: 400 });

    const expirationDateOrError = validateExpiration(expiration_days);
    if (typeof expirationDateOrError === 'string') return NextResponse.json({ error: expirationDateOrError }, { status: 400 });

    await db.exec('BEGIN');

    const existingOrder = await db.get('SELECT id FROM orders WHERE order_id = ?', [order_id.trim()]);
    if (existingOrder) {
      await db.exec('ROLLBACK');
      return NextResponse.json({ error: 'Order ID already exists' }, { status: 409 });
    }

    for (const productId of product_ids) {
      const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
      if (!product) {
        await db.exec('ROLLBACK');
        return NextResponse.json({ error: `Product with ID ${productId} not found` }, { status: 404 });
      }
    }

    const orderResult = await db.run(`
      INSERT INTO orders (order_id, expiration_date, one_time_use, created_by)
      VALUES (?, ?, ?, ?)
    `, [order_id.trim(), expirationDateOrError, one_time_use ?? true, created_by || admin.username]);

    const newOrderId = orderResult.lastID;
    for (const productId of product_ids) {
      await db.run('INSERT INTO order_products (order_id, product_id) VALUES (?, ?)', [newOrderId, productId]);
    }

    await db.exec('COMMIT');

    const newOrder = await getOrderWithProducts(db, newOrderId);
    return NextResponse.json(newOrder, { status: 201 });

  } catch (error) {
    await db.exec('ROLLBACK').catch(() => {});
    console.error('Create order error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
    const db = await getDatabase();
    try {
      const admin = await handleAdminAuth(request);
      if (admin instanceof NextResponse) return admin;
  
      const contentTypeError = validateContentType(request);
      if (contentTypeError) return contentTypeError;
  
      const { id, order_id, product_ids, expiration_days, one_time_use } = await request.json();
  
      const orderId = parseInt(id, 10);
      if (!orderId || !Number.isInteger(orderId)) {
        return NextResponse.json({ error: 'Valid numeric order ID is required' }, { status: 400 });
      }
  
      if (!order_id || typeof order_id !== 'string' || order_id.trim().length === 0) {
        return NextResponse.json({ error: 'Order ID string is required' }, { status: 400 });
      }
      
      const productIdsError = validateProductIds(product_ids);
      if (productIdsError) return NextResponse.json({ error: productIdsError }, { status: 400 });
  
      const expirationDateOrError = validateExpiration(expiration_days);
      if (typeof expirationDateOrError === 'string') return NextResponse.json({ error: expirationDateOrError }, { status: 400 });
  
      await db.exec('BEGIN');
  
      const existingOrder = await db.get('SELECT one_time_use FROM orders WHERE id = ?', [orderId]);
      if (!existingOrder) {
        await db.exec('ROLLBACK');
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
  
      for (const productId of product_ids) {
        const product = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
        if (!product) {
          await db.exec('ROLLBACK');
          return NextResponse.json({ error: `Product with ID ${productId} not found` }, { status: 404 });
        }
      }
      
      await db.run(
        'UPDATE orders SET order_id = ?, expiration_date = ?, one_time_use = ? WHERE id = ?',
        [order_id.trim(), expirationDateOrError, one_time_use ?? true, orderId]
      );
  
      await db.run('DELETE FROM order_products WHERE order_id = ?', [orderId]);
      for (const productId of product_ids) {
        await db.run('INSERT INTO order_products (order_id, product_id) VALUES (?, ?)', [orderId, productId]);
      }
  
      await db.exec('COMMIT');
  
      const updatedOrder = await getOrderWithProducts(db, orderId);
      return NextResponse.json(updatedOrder);
  
    } catch (error) {
      await db.exec('ROLLBACK').catch(() => {});
      console.error('Update order error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
  
export async function DELETE(request: NextRequest) {
    const db = await getDatabase();
    try {
      const admin = await handleAdminAuth(request);
      if (admin instanceof NextResponse) return admin;
  
      const { searchParams } = new URL(request.url);
      const id = searchParams.get('id');
      const orderId = parseInt(id || '', 10);
  
      if (!orderId || !Number.isInteger(orderId)) {
        return NextResponse.json({ error: 'Valid numeric order ID is required' }, { status: 400 });
      }
  
      await db.exec('BEGIN');
  
      const existingOrder = await db.get('SELECT id FROM orders WHERE id = ?', [orderId]);
      if (!existingOrder) {
        await db.exec('ROLLBACK');
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
  
      await db.run('DELETE FROM orders WHERE id = ?', [orderId]);
      
      await db.exec('COMMIT');
  
      return NextResponse.json({ message: 'Order deleted successfully' });
  
    } catch (error) {
      await db.exec('ROLLBACK').catch(() => {});
      console.error('Delete order error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
