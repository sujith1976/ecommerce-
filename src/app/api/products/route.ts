import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const subcategoryId = searchParams.get('subcategoryId');
    const partNumber = searchParams.get('partNumber');

    let query: any = {
      include: {
        subcategory: {
          include: {
            category: true
          }
        }
      }
    };

    if (partNumber) {
      query.where = { partNumber };
    } else if (subcategoryId) {
      query.where = { subcategoryId };
    } else if (categoryId) {
      query = {
        include: {
          subcategory: {
            include: {
              category: true,
              products: true
            },
            where: {
              categoryId
            }
          }
        }
      };
    }

    const products = await prisma.product.findMany(query);
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
} 