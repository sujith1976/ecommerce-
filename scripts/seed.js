import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Read and parse the CSV file
    const fileContent = fs.readFileSync('./sample-products.csv', 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    console.log(`Found ${records.length} products in CSV file`);
    
    // Process each record
    for (const record of records) {
      const categoryName = record.Category;
      const subcategoryName = record.Subcategory;
      const partNumber = record.PartNumber;
      const datasheetUrl = record.DatasheetURL;
      
      // Remove known fields and process remaining as attributes
      delete record.Category;
      delete record.Subcategory;
      delete record.PartNumber;
      delete record.DatasheetURL;
      
      // Process attributes according to CSV rules
      const attributes = Object.entries(record).reduce((acc, [key, value]) => {
        acc[key] = value === '-' || Boolean(value);
        return acc;
      }, {});
      
      // Upsert category
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: { name: categoryName }
      });
      
      // Upsert subcategory
      const subcategory = await prisma.subcategory.upsert({
        where: {
          name_categoryId: {
            name: subcategoryName,
            categoryId: category.id
          }
        },
        update: {},
        create: {
          name: subcategoryName,
          categoryId: category.id
        }
      });
      
      // Upsert product
      await prisma.product.upsert({
        where: { partNumber },
        update: {
          datasheetUrl,
          attributes,
          subcategoryId: subcategory.id
        },
        create: {
          partNumber,
          datasheetUrl,
          attributes,
          subcategoryId: subcategory.id
        }
      });
      
      console.log(`Processed product: ${partNumber}`);
    }
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 