export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePrice = (price: number): boolean => {
  return price > 0 && price < 1000000;
};

export const validateTax = (tax: number): boolean => {
  return tax >= 0 && tax <= 100;
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateSKU = (sku: string): boolean => {
  return sku.trim().length > 0 && sku.trim().length <= 50;
};

