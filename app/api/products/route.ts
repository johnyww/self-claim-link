import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyAdminToken } from '@/lib/auth';
import { ProductInput } from '@/lib/types';

// Helper function to validate URL format
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Helper function to validate product input
function validateProductInput(data: ProductInput): { isValid: boolean; error?: string } {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return { isValid: false, error: 'Product name is required' };
  }

  if (data.name.length > 255) {
    return { isValid: false, error: 'Product name must be less than 255 characters' };
  }

  if (data.description && data.description.length > 1000) {
    return { isValid: false, error: 'Description must be less than 1000 characters' };
  }

  if (!data.download_link || !isValidUrl(data.download_link)) {
    return { isValid: false, error: 'Valid download link URL is required' };
  }

  if (data.image_url && !isValidUrl(data.image_url)) {
    return { isValid: false, error: 'Image URL must be a valid URL if provided' };
  }

  return { isValid: true };
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = await getDatabase();
    const products = await db.all('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    const data = await request.json();

    // Validate input
    const validation = validateProductInput(data);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description, download_link, image_url } = data;

    const db = await getDatabase();
    const result = await db.run(`
      INSERT INTO products (name, description, download_link, image_url)
      VALUES (?, ?, ?, ?)
    `, [name.trim(), description?.trim() || null, download_link, image_url || null]);

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', [result.lastID]);
    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Content-Type must be application/json' }, { status: 415 });
    }

    const data = await request.json();

    // Validate ID
    const productId = parseInt(data.id, 10);
    if (!productId || productId < 1 || !Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Valid product ID is required' }, { status: 400 });
    }

    // Validate input
    const validation = validateProductInput(data);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, description, download_link, image_url } = data;

    const db = await getDatabase();

    // Check if product exists
    const existingProduct = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.run(`
      UPDATE products
      SET name = ?, description = ?, download_link = ?, image_url = ?
      WHERE id = ?
    `, [name.trim(), description?.trim() || null, download_link, image_url || null, productId]);

    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', [productId]);

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Validate ID
    const productId = parseInt(id || '', 10);
    if (!productId || productId < 1 || !Number.isInteger(productId)) {
      return NextResponse.json({ error: 'Valid product ID is required' }, { status: 400 });
    }

    const db = await getDatabase();

    // Check if product is used in any orders
    const usageCount = await db.get(
      'SELECT COUNT(*) as count FROM order_products WHERE product_id = ?',
      [productId]
    );

    if (usageCount.count > 0) {
      return NextResponse.json({
        error: `Cannot delete product: it is used in ${usageCount.count} order(s)`
      }, { status: 409 });
    }

    // Check if product exists
    const existingProduct = await db.get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await db.run('DELETE FROM products WHERE id = ?', [productId]);

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
