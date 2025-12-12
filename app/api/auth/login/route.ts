import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDatabase } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const db = await getDatabase();
    const admin = await db.get('SELECT * FROM admins WHERE username = ?', [username]);
    
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables.');
      }
      const token = jwt.sign(
        { userId: admin.id, username: admin.username },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
    
    return NextResponse.json({ token, username: admin.username });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: process.env.NODE_ENV !== 'production' ? (error as Error).message : 'Internal server error' },
      { status: 500 }
    );
  }
}
