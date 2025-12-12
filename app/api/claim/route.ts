import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { isAfter } from 'date-fns';
import { Product } from '@/lib/types';

export async function POST(request: NextRequest) {
  const db = await getDatabase();

  try {
    const { orderId } = await request.json();

    if (typeof orderId !== 'string' || orderId.trim() === '') {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid Order ID: Must be a non-empty string.' 
      }, { status: 400 });
    }
    const sanitizedOrderId = orderId.trim();

    await db.exec('BEGIN');

    const order = await db.get(`
      SELECT o.*
      FROM orders o
      WHERE o.order_id = ?
    `, [sanitizedOrderId]);
    
    if (!order) {
      await db.exec('ROLLBACK');
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 });
    }
    
    if (order.expiration_date && isAfter(new Date(), new Date(order.expiration_date))) {
      await db.exec('ROLLBACK');
      return NextResponse.json({ 
        success: false, 
        message: 'This order has expired' 
      }, { status: 400 });
    }

    const result = await db.run(
      `
      UPDATE orders 
      SET 
        claim_status = CASE WHEN one_time_use = 1 THEN 'claimed' ELSE claim_status END,
        claim_timestamp = CURRENT_TIMESTAMP, 
        claim_count = claim_count + 1
      WHERE order_id = ? AND (
        (one_time_use = 1 AND claim_count < 1) OR
        one_time_use = 0
      )
    `, [sanitizedOrderId]);
    
    if (result.changes === 0) {
      await db.exec('ROLLBACK');
      return NextResponse.json({ 
        success: false, 
        message: 'This order has already been claimed (one-time use only)' 
      }, { status: 400 });
    }
    
    const products: Product[] = await db.all(`
      SELECT p.*
      FROM products p
      JOIN order_products op ON p.id = op.product_id
      WHERE op.order_id = ?
    `, [order.id]);
    
    await db.exec('COMMIT');
    
    const updatedOrder = await db.get('SELECT * from orders WHERE order_id = ?', [sanitizedOrderId]);

    return NextResponse.json({
      success: true,
      message: order.one_time_use
        ? `Order successfully claimed. This was a one-time use order.`
        : `Products available for claim. Total claims for this order: ${updatedOrder.claim_count}.`,
      products: products.map((product: Product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        image_url: product.image_url
      })),
      download_links: products.map((product: Product) => product.download_link),
      claim_count: updatedOrder.claim_count
    });
    
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Claim error:', error);
    return NextResponse.json({
      success: false,
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : 'Internal server error'
    }, { status: 500 });
  }
}
