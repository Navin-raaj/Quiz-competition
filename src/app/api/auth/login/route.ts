import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { name, email, password, isAdmin, type } = await req.json(); // type: 'login' | 'signup'

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Check if user exists
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (isAdmin) {
            // Admin Login Flow
            if (!user) {
                // Admin does not exist in DB
                return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            } else {
                if (user.role !== 'ADMIN') {
                    return NextResponse.json({ error: 'Not authorized as admin' }, { status: 403 });
                }
                if (!password || !user.password) {
                    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
                }
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) {
                    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
                }
            }
        } else {
            // User Flow
            if (type === 'signup') {
                if (user) {
                    return NextResponse.json({ error: 'User already exists. Please login.' }, { status: 400 });
                }
                if (!name) {
                    return NextResponse.json({ error: 'Name is required for signup' }, { status: 400 });
                }
                user = await prisma.user.create({
                    data: { name, email, role: 'USER' },
                });
            } else {
                // Login
                if (!user) {
                    return NextResponse.json({ error: 'User not found. Please sign up first.' }, { status: 404 });
                }
                // For this contest app without passwords for users, "Login" is just email verification.
                // If we want strict "Login", we'd need passwords. 
                // But the user said: "only the people who have already signed up should be able to login".
                // This check (!user) statisfies that.
            }
        }

        return NextResponse.json(user);

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
