import { Storage, StorageKeys } from './storage';
import { Product, Category } from '../types';

export const productService = {
  getAllProducts: (): Product[] => {
    return Storage.getArray<Product>(StorageKeys.PRODUCTS);
  },

  getActiveProducts: (): Product[] => {
    return productService.getAllProducts().filter(p => p.isActive);
  },

  getProductById: (id: string): Product | null => {
    const products = productService.getAllProducts();
    return products.find(p => p.id === id) || null;
  },

  getProductsByCategory: (category: string): Product[] => {
    if (category === 'all') {
      return productService.getActiveProducts();
    }
    return productService.getActiveProducts().filter(p => p.category === category);
  },

  createProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const products = productService.getAllProducts();
    const newProduct: Product = {
      ...productData,
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    products.push(newProduct);
    Storage.setArray(StorageKeys.PRODUCTS, products);
    return newProduct;
  },

  updateProduct: (id: string, updates: Partial<Product>): Product | null => {
    const products = productService.getAllProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: Date.now(),
    };
    Storage.setArray(StorageKeys.PRODUCTS, products);
    return products[index];
  },

  deleteProduct: (id: string): boolean => {
    const products = productService.getAllProducts();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    Storage.setArray(StorageKeys.PRODUCTS, filtered);
    return true;
  },
};

export const categoryService = {
  getAllCategories: (): Category[] => {
    return Storage.getArray<Category>(StorageKeys.CATEGORIES);
  },

  getCategoryById: (id: string): Category | null => {
    const categories = categoryService.getAllCategories();
    return categories.find(c => c.id === id) || null;
  },

  createCategory: (categoryData: Omit<Category, 'id'>): Category => {
    const categories = categoryService.getAllCategories();
    const newCategory: Category = {
      ...categoryData,
      id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    categories.push(newCategory);
    Storage.setArray(StorageKeys.CATEGORIES, categories);
    return newCategory;
  },

  updateCategory: (id: string, updates: Partial<Category>): Category | null => {
    const categories = categoryService.getAllCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index === -1) return null;

    categories[index] = { ...categories[index], ...updates };
    Storage.setArray(StorageKeys.CATEGORIES, categories);
    return categories[index];
  },

  deleteCategory: (id: string): boolean => {
    const categories = categoryService.getAllCategories();
    const filtered = categories.filter(c => c.id !== id);
    if (filtered.length === categories.length) return false;
    Storage.setArray(StorageKeys.CATEGORIES, filtered);
    return true;
  },

  initializeDefaultCategories: (): void => {
    const categories = categoryService.getAllCategories();
    if (categories.length > 0) return; // Already initialized

    const defaultCategories: Category[] = [
      { id: 'cat_tea', name: 'Tea', color: '#4A7C59' },
      { id: 'cat_juice', name: 'Juice', color: '#FF8C42' },
      { id: 'cat_smoothie', name: 'Smoothie', color: '#27AE60' },
      { id: 'cat_other', name: 'Other', color: '#7F8C8D' },
    ];

    Storage.setArray(StorageKeys.CATEGORIES, defaultCategories);
  },
};

