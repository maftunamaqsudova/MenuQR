export type AuthUser = {
  userId: number;
  name: string;
  email: string;
  restaurantId: number;
  restaurantName: string;
  restaurantSlug: string;
};

export type AuthResponse = AuthUser & { token: string };

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  restaurantName: string;
};

export type Restaurant = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phone: string | null;
};

export type Category = {
  id: number;
  name: string;
  sortOrder: number;
  itemCount: number;
};

export type MenuItem = {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type OrderStatus = "New" | "Preparing" | "Ready" | "Served" | "Cancelled";

export type OrderItem = {
  id: number;
  menuItemId: number;
  name: string;
  quantity: number;
  priceAtOrderTime: number;
  note: string | null;
};

export type Order = {
  id: number;
  publicId: string;
  customerName: string;
  tableNumber: string | null;
  status: OrderStatus;
  totalPrice: number;
  note: string | null;
  createdAt: string;
  items: OrderItem[];
};

export type PagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type PublicRestaurant = {
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phone: string | null;
};

export type PublicMenuItem = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
};

export type PublicCategory = {
  id: number;
  name: string;
  items: PublicMenuItem[];
};

export type PublicMenu = {
  restaurant: PublicRestaurant;
  categories: PublicCategory[];
};

export type PublicOrderItem = {
  name: string;
  quantity: number;
  price: number;
  note: string | null;
};

export type PublicOrder = {
  publicId: string;
  restaurantName: string;
  customerName: string;
  tableNumber: string | null;
  status: OrderStatus;
  totalPrice: number;
  note: string | null;
  createdAt: string;
  items: PublicOrderItem[];
};