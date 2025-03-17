'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface Product {
  id: string;
  partNumber: string;
  datasheetUrl: string | null;
  attributes: Record<string, boolean>;
  subcategory: {
    id: string;
    name: string;
    category: {
      id: string;
      name: string;
    };
  };
}

interface Category {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    products: Product[];
  }[];
}

export default function ProductList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const products: Product[] = await response.json();
      
      // Group products by category and subcategory
      const categoriesMap = new Map<string, Category>();
      
      products.forEach(product => {
        const categoryId = product.subcategory.category.id;
        const subcategoryId = product.subcategory.id;
        
        if (!categoriesMap.has(categoryId)) {
          categoriesMap.set(categoryId, {
            id: categoryId,
            name: product.subcategory.category.name,
            subcategories: []
          });
        }
        
        const category = categoriesMap.get(categoryId)!;
        let subcategory = category.subcategories.find(s => s.id === subcategoryId);
        
        if (!subcategory) {
          subcategory = {
            id: subcategoryId,
            name: product.subcategory.name,
            products: []
          };
          category.subcategories.push(subcategory);
        }
        
        subcategory.products.push(product);
      });
      
      setCategories(Array.from(categoriesMap.values()));
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleSubcategory = (subcategoryId: string) => {
    setExpandedSubcategories(prev => {
      const next = new Set(prev);
      if (next.has(subcategoryId)) {
        next.delete(subcategoryId);
      } else {
        next.add(subcategoryId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="text-center py-4">Loading products...</div>;
  }

  if (error) {
    return <div className="text-red-600 py-4">{error}</div>;
  }

  if (categories.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No products found. Upload a CSV file to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category.id} className="border rounded-lg overflow-hidden">
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 text-left"
          >
            <span className="font-medium">{category.name}</span>
            {expandedCategories.has(category.id) ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
          
          {expandedCategories.has(category.id) && (
            <div className="pl-6">
              {category.subcategories.map(subcategory => (
                <div key={subcategory.id} className="border-t">
                  <button
                    onClick={() => toggleSubcategory(subcategory.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left"
                  >
                    <span>{subcategory.name}</span>
                    {expandedSubcategories.has(subcategory.id) ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>
                  
                  {expandedSubcategories.has(subcategory.id) && (
                    <div className="pl-6 pb-4">
                      {subcategory.products.map(product => (
                        <div key={product.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{product.partNumber}</span>
                            {product.datasheetUrl && (
                              <a
                                href={product.datasheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <FileText className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                          <div className="mt-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {Object.entries(product.attributes).map(([key, value]) => (
                              <div
                                key={key}
                                className={`text-xs px-2 py-1 rounded ${
                                  value
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {key}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 