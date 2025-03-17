# Product Catalog with CSV Import

A semi-ecommerce website that allows importing product details from CSV files and displays them in an organized manner. Built with Next.js, PostgreSQL (NeonDB), and Prisma.

## Features

- CSV file upload and import
- Hierarchical product display (Category > Subcategory > Products)
- Support for special CSV rules (filled cells, empty cells, and dashes)
- Datasheet URL integration
- Responsive and modern UI
- PostgreSQL database with Prisma ORM

## Prerequisites

- Node.js 18.x or later
- PostgreSQL database (NeonDB recommended)
- npm or yarn package manager

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your NeonDB connection string

4. Initialize the database:
```bash
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## CSV Format

The CSV file should follow these rules:
- Each row represents a product
- Required columns:
  - Category
  - Subcategory
  - PartNumber
  - DatasheetURL (optional)
- Additional columns represent product attributes
- Cell values:
  - Filled cell: Product is associated with that attribute
  - Empty cell: Product is not associated with that attribute
  - Dash (-): Product is associated with that attribute (alternative to filled cell)

Example CSV format:
```csv
Category,Subcategory,PartNumber,DatasheetURL,Attribute1,Attribute2,Attribute3
Category1,SubCat1,PART001,http://example.com,Yes,,Yes
Category1,SubCat1,PART002,http://example.com,-,Yes,
```

## Development

- Frontend: The application uses Next.js with TypeScript and Tailwind CSS
- Backend: Next.js API routes with Prisma for database operations
- Database: PostgreSQL hosted on NeonDB
- State Management: React hooks for local state management

## License

MIT
