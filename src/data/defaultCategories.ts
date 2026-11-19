import type { Category } from '../types/finance';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'exp-food', name: 'Food & Dining', type: 'expense', icon: 'Utensils', color: '#D9822B', isDefault: true },
  { id: 'exp-groceries', name: 'Groceries', type: 'expense', icon: 'ShoppingBasket', color: '#4E8B63', isDefault: true },
  { id: 'exp-transport', name: 'Transportation', type: 'expense', icon: 'Car', color: '#3B7A8C', isDefault: true },
  { id: 'exp-shopping', name: 'Shopping', type: 'expense', icon: 'ShoppingBag', color: '#7D67A8', isDefault: true },
  { id: 'exp-bills', name: 'Bills & Utilities', type: 'expense', icon: 'Zap', color: '#C49A45', isDefault: true },
  { id: 'exp-rent', name: 'Rent', type: 'expense', icon: 'Home', color: '#245C45', isDefault: true },
  { id: 'exp-education', name: 'Education', type: 'expense', icon: 'GraduationCap', color: '#506FA8', isDefault: true },
  { id: 'exp-entertainment', name: 'Entertainment', type: 'expense', icon: 'Film', color: '#B55B75', isDefault: true },
  { id: 'exp-healthcare', name: 'Healthcare', type: 'expense', icon: 'HeartPulse', color: '#C94D4D', isDefault: true },
  { id: 'exp-travel', name: 'Travel', type: 'expense', icon: 'Plane', color: '#2F8886', isDefault: true },
  { id: 'exp-personal', name: 'Personal Care', type: 'expense', icon: 'Sparkles', color: '#A36B8E', isDefault: true },
  { id: 'exp-subscriptions', name: 'Subscriptions', type: 'expense', icon: 'Tv', color: '#5E6873', isDefault: true },
  { id: 'exp-other', name: 'Other', type: 'expense', icon: 'MoreHorizontal', color: '#89918B', isDefault: true },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'inc-salary', name: 'Salary', type: 'income', icon: 'Briefcase', color: '#245C45', isDefault: true },
  { id: 'inc-freelance', name: 'Freelancing', type: 'income', icon: 'Laptop', color: '#4E8B63', isDefault: true },
  { id: 'inc-business', name: 'Business', type: 'income', icon: 'Building2', color: '#3B7A8C', isDefault: true },
  { id: 'inc-investments', name: 'Investments', type: 'income', icon: 'TrendingUp', color: '#75977F', isDefault: true },
  { id: 'inc-gifts', name: 'Gifts', type: 'income', icon: 'Gift', color: '#D9B98C', isDefault: true },
  { id: 'inc-other', name: 'Other', type: 'income', icon: 'PlusCircle', color: '#89918B', isDefault: true },
];

export const ALL_DEFAULT_CATEGORIES: Category[] = [
  ...DEFAULT_EXPENSE_CATEGORIES,
  ...DEFAULT_INCOME_CATEGORIES,
];
