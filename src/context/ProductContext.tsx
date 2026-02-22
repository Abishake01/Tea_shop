import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Category } from '../types';
import { productService, categoryService } from '../services/productService';

interface ProductContextType {
  products: Product[];
  categories: Category[];
  activeProducts: Product[];
  fetchProducts: () => void;
  fetchCategories: () => void;
  refreshAll: () => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, product: Partial<Product>) => Product | null;
  deleteProduct: (id: string) => boolean;
  getProductsByCategory: (category: string) => Product[];
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => Category | null;
  deleteCategory: (id: string) => boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Initialize default categories
    categoryService.initializeDefaultCategories();
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = () => {
    const allProducts = productService.getAllProducts();
    setProducts(allProducts);
  };

  const fetchCategories = () => {
    const allCategories = categoryService.getAllCategories();
    setCategories(allCategories);
  };

  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const newProduct = productService.createProduct(productData);
    fetchProducts();
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>): Product | null => {
    const updated = productService.updateProduct(id, updates);
    if (updated) {
      fetchProducts();
    }
    return updated;
  };

  const deleteProduct = (id: string): boolean => {
    const success = productService.deleteProduct(id);
    if (success) {
      fetchProducts();
    }
    return success;
  };

  const getProductsByCategory = (category: string): Product[] => {
    return productService.getProductsByCategory(category);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>): Category => {
    const newCategory = categoryService.createCategory(categoryData);
    fetchCategories();
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>): Category | null => {
    const updated = categoryService.updateCategory(id, updates);
    if (updated) {
      fetchCategories();
    }
    return updated;
  };

  const deleteCategory = (id: string): boolean => {
    const success = categoryService.deleteCategory(id);
    if (success) {
      fetchCategories();
    }
    return success;
  };

  const refreshAll = (): void => {
    fetchProducts();
    fetchCategories();
  };

  const value: ProductContextType = {
    products,
    categories,
    activeProducts: products.filter(p => p.isActive),
    fetchProducts,
    fetchCategories,
    refreshAll,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    addCategory,
    updateCategory,
    deleteCategory,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = (): ProductContextType => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};

