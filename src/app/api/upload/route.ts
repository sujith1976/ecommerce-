import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync'; // Using sync version for simplicity
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CsvRecord {
  [key: string]: string | undefined;
  Category?: string;
  Subcategory?: string;
  PartNumber?: string;
  DatasheetURL?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to text
    const fileContent = await file.text();
    
    // Parse CSV synchronously
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    }) as CsvRecord[];
    
    console.log('Parsed records:', records);
    
    // Process each record
    for (const record of records) {
      const categoryName = record.Category;
      const subcategoryName = record.Subcategory;
      const partNumber = record.PartNumber;
      const datasheetUrl = record.DatasheetURL;
      
      // Skip if missing required fields
      if (!categoryName || !subcategoryName || !partNumber) {
        console.error('Missing required fields:', { categoryName, subcategoryName, partNumber });
        continue;
      }
      
      // Create a copy of the record for attributes
      const attributeRecord = { ...record };
      delete attributeRecord.Category;
      delete attributeRecord.Subcategory;
      delete attributeRecord.PartNumber;
      delete attributeRecord.DatasheetURL;
      
      // Process attributes according to CSV rules
      const attributes: { [key: string]: boolean } = {};
      for (const [key, value] of Object.entries(attributeRecord)) {
        attributes[key] = value === '-' || Boolean(value);
      }
      
      try {
        // Create or find category
        let category = await prisma.category.findUnique({
          where: { name: categoryName }
        });
        
        if (!category) {
          category = await prisma.category.create({
            data: { name: categoryName }
          });
        }
        
        // Create or find subcategory
        let subcategory = await prisma.subcategory.findFirst({
          where: {
            name: subcategoryName,
            categoryId: category.id
          }
        });
        
        if (!subcategory) {
          subcategory = await prisma.subcategory.create({
            data: {
              name: subcategoryName,
              categoryId: category.id
            }
          });
        }
        
        // Create or update product
        const existingProduct = await prisma.product.findUnique({
          where: { partNumber }
        });
        
        if (existingProduct) {
          await prisma.product.update({
            where: { id: existingProduct.id },
            data: {
              datasheetUrl,
              attributes,
              subcategoryId: subcategory.id
            }
          });
        } else {
          await prisma.product.create({
            data: {
              partNumber,
              datasheetUrl,
              attributes,
              subcategoryId: subcategory.id
            }
          });
        }
        
        console.log(`Successfully processed product: ${partNumber}`);
      } catch (error) {
        console.error(`Error processing product ${partNumber}:`, error);
      }
    }
    
    return NextResponse.json({ message: 'CSV processed successfully' });
  } catch (error: unknown) {
    console.error('Error processing CSV:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process CSV file', details: errorMessage },
      { status: 500 }
    );
  }
} 