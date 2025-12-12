import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdminToken(request);

    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      username: admin.username,
      userId: admin.userId
    });
  } catch (error) {
    console.error('Get admin info error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
