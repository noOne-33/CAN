
import type { ObjectId } from 'mongodb';

export type ProductColor = {
  name: string;
  hex: string;
  image: string; // URL for the color-specific image
  aiHint: string;
};

export type ProductSpecification = {
  name: string;
  value: string;
};

export type Product = {
  _id?: string | ObjectId; // MongoDB ObjectId
  id?: string; // For client-side consistency if needed, usually string version of _id
  name: string;
  description: string;
  price: number;
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  category: string; // This will be the category name (string)
  imageUrls: string[]; // Array of image URLs, first one is primary
  defaultImage?: string; // Kept for potential fallback, but imageUrls[0] is preferred
  colors: ProductColor[];
  sizes?: string[]; // Available sizes like ['S', 'M', 'L', 'XL']
  specifications?: ProductSpecification[]; // Custom specifications
  aiHint?: string; // AI hint for the primary image or product itself
  stock: number;
  createdAt?: Date | string; // Allow string for serialized dates
  updatedAt?: Date | string; // Allow string for serialized dates
};

export type Category = {
  _id?: string | ObjectId;
  id?: string; // String version of _id
  name: string;
  imageUrl?: string; // URL for the category image
  aiHint?: string;   // AI hint for the category image
  productCount?: number; // Populated for admin display
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Defines the structure of a wishlist in the database
export type WishlistDoc = {
  _id: ObjectId;
  userId: string; // Corresponds to User._id
  productIds: string[]; // Array of Product IDs
  createdAt: Date;
  updatedAt: Date;
};

// Defines the structure for wishlist data when returned by services/API, with string IDs
export type Wishlist = {
  _id: string;
  userId: string;
  productIds: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

// User type for client-side representation and JWT payload
export type User = {
  _id?: string | ObjectId; // Keep _id for flexibility with MongoDB direct types
  id: string; // Typically MongoDB ObjectId as string, ensured by service
  name?: string | null;
  email: string; // Email is usually required
  image?: string | null;
  role: 'user' | 'admin';
  createdAt?: Date | string; // Added for display on admin user page
  updatedAt?: Date | string; // Added for potential future use
};

// Extended user type for server-side/database, including hashed password
// This is not typically sent to the client.
export interface DbUser extends Omit<User, 'id' | '_id' | 'createdAt' | 'updatedAt'> {
  _id: ObjectId; // In DB, _id is ObjectId
  hashedPassword?: string; // Optional because it's not always queried or needed by client
  createdAt: Date;
  updatedAt?: Date;
}

export type CartItem = {
  productId: string;
  name: string;
  price: number; // This is the effective price the item was added at.
  originalPrice?: number; // The product's base price if a discount was applied.
  image: string;
  quantity: number;
  size?: string | null;
  color?: string | null; // Color name
  colorHex?: string | null; // Color hex
  appliedDiscountType?: 'percentage' | 'fixed';
  appliedDiscountValue?: number;
  cartKey: string; // Unique key for product variant (productId-size-color)
};

// Structure for items within an order
export type OrderItem = {
  productId: string;
  name: string;
  price: number; // Actual price paid for this item in the order.
  originalPrice?: number; // The product's base price if a discount was applied at time of order.
  image: string;
  quantity: number;
  size?: string | null;
  color?: string | null;
  appliedDiscountType?: 'percentage' | 'fixed';
  appliedDiscountValue?: number;
};

// Structure for shipping address - this will be base for Address type
export type ShippingAddress = {
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  postalCode: string;
  country: string;
};

// User Address Type
export type Address = ShippingAddress & {
  _id?: string | ObjectId;
  id?: string; // String version of _id
  userId: string; // Foreign key to User
  isDefault?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Address document structure in MongoDB
export type AddressDoc = Omit<Address, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  _id: ObjectId;
  userId: ObjectId; // Store as ObjectId in DB
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
};


// Order Status
export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled" | "Failed";


// Main Order type
export type Order = {
  _id?: string | ObjectId;
  id?: string;
  userId: string; // ID of the user who placed the order
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: ShippingAddress; // Embeds the shipping address used for this order
  paymentMethod: string; // e.g., "Cash on Delivery", "Card"
  paymentStatus?: string; // e.g., "Paid", "Unpaid" - for non-COD
  orderStatus: OrderStatus;
  transactionId?: string; // For online payments
  deliveredAt?: Date | string; // Date when the order was delivered
  appliedCouponCode?: string; // Code of the coupon used
  couponDiscountAmount?: number; // Amount discounted by the coupon
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Order document structure in MongoDB
export type OrderDoc = Omit<Order, '_id' | 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'deliveredAt'> & {
  _id: ObjectId;
  userId: string; // Keep as string or ObjectId depending on consistency, service handles conversion
  createdAt: Date;
  updatedAt: Date;
  deliveredAt?: Date;
  appliedCouponCode?: string;
  couponDiscountAmount?: number;
};

// Coupon Type
export type CouponDiscountType = 'percentage' | 'fixed';

export type Coupon = {
  _id?: string | ObjectId;
  id?: string;
  code: string; // Unique coupon code
  discountType: CouponDiscountType; // 'percentage' or 'fixed'
  discountValue: number; // Amount or percentage value
  expiryDate: Date | string;
  minPurchaseAmount?: number | null; // Optional: minimum purchase amount for the coupon to be valid
  usageLimit?: number | null; // Optional: how many times this coupon can be used in total
  usageCount?: number; // How many times this coupon has been used
  isActive: boolean; // Whether the coupon is currently active
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

// Coupon document structure in MongoDB
export type CouponDoc = Omit<Coupon, '_id' | 'id' | 'createdAt' | 'updatedAt' | 'expiryDate'> & {
  _id: ObjectId;
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  expiryDate: Date; // Store as Date in DB
  minPurchaseAmount?: number | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type HeroSlide = {
  _id?: string | ObjectId;
  id?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  buttonText?: string;
  buttonLink?: string;
  displayOrder?: number;
  isActive?: boolean;
  aiHint?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

export type HeroSlideDoc = Omit<HeroSlide, '_id' | 'id' | 'createdAt' | 'updatedAt'> & {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type FeaturedBanner = {
  _id?: string | ObjectId;
  id?: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  aiHint?: string;
  updatedAt?: Date | string;
};

export type FeaturedBannerDoc = Omit<FeaturedBanner, '_id' | 'id' | 'updatedAt'> & {
  _id: ObjectId;
  updatedAt: Date;
};

// User Cart
export type CartDoc = {
  _id: ObjectId;
  userId: ObjectId; // References User._id
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
};

export type Cart = {
  _id: string;
  userId: string;
  items: CartItem[];
  createdAt: string | Date;
  updatedAt: string | Date;
};

// Password Reset Token
export type PasswordResetTokenDoc = {
  _id: ObjectId;
  userId: ObjectId;
  token: string; // The actual token string
  expiresAt: Date;
  createdAt: Date;
};

export type PasswordResetToken = Omit<PasswordResetTokenDoc, '_id' | 'userId' | 'createdAt' | 'expiresAt'> & {
  id: string;
  userId: string;
  token: string;
  expiresAt: string | Date;
  createdAt: string | Date;
};

// Site Settings
export type SocialLinks = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
};

export type SiteSettings = {
  _id?: string | ObjectId;
  id?: string;
  socialLinks: SocialLinks;
  updatedAt?: Date | string;
};

export type SiteSettingsDoc = {
  _id: 'global_settings'; // Use a predictable string ID for this singleton document
  socialLinks: SocialLinks;
  updatedAt: Date;
};
