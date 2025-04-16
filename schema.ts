import { pgTable, text, serial, integer, boolean, timestamp, foreignKey, doublePrecision, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema with role
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("buyer"),
  name: text("name"),
  phone: text("phone"),
  address: text("address"),
  approved: boolean("approved").notNull().default(false), // Sellers need admin approval
  rejected: boolean("rejected").notNull().default(false), // For rejected sellers
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  role: true,
  name: true,
  phone: true,
  address: true,
  approved: true,
  rejected: true,
});

// Product schema
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  specifications: text("specifications"), // Technical specifications
  sku: text("sku"), // Stock Keeping Unit (unique product identifier)
  mrp: integer("mrp"), // Maximum Retail Price (original price before discount)
  purchasePrice: integer("purchase_price"), // Purchase Price (cost price)
  price: integer("price").notNull(),
  category: text("category").notNull(),
  color: text("color"), // Product color
  size: text("size"), // Product size
  imageUrl: text("image_url").notNull(),
  images: text("images"), // Additional images as JSON string
  sellerId: integer("seller_id").notNull().references(() => users.id),
  stock: integer("stock").notNull().default(0),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  description: true,
  specifications: true,
  sku: true,
  mrp: true,
  purchasePrice: true,
  price: true,
  category: true,
  color: true,
  size: true,
  imageUrl: true,
  images: true,
  sellerId: true,
  stock: true,
  approved: true,
});

// Cart schema
export const carts = pgTable("carts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
});

export const insertCartSchema = createInsertSchema(carts).pick({
  userId: true,
  productId: true,
  quantity: true,
});

// Order schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  total: integer("total").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  shippingDetails: text("shipping_details"), // Stored as JSON string
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentId: text("payment_id"), // For Razorpay paymentId
  orderId: text("order_id"), // For Razorpay orderId
  addressId: integer("address_id").references(() => userAddresses.id), // Optional reference to saved address
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  total: true,
  date: true,
  shippingDetails: true,
  paymentMethod: true,
  paymentId: true,
  orderId: true,
  addressId: true,
});

// OrderItem schema
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: integer("price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  price: true,
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  products: many(products),
  carts: many(carts),
  orders: many(orders),
  reviews: many(reviews),
  reviewHelpfulVotes: many(reviewHelpful),
  wishlists: many(wishlists),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  seller: one(users, {
    fields: [products.sellerId],
    references: [users.id],
  }),
  cartItems: many(carts),
  orderItems: many(orderItems),
  reviews: many(reviews),
  wishlists: many(wishlists),
}));

export const cartsRelations = relations(carts, ({ one }) => ({
  user: one(users, {
    fields: [carts.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [carts.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  address: one(userAddresses, {
    fields: [orders.addressId],
    references: [userAddresses.id],
  }),
  items: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

// User OTP table for passwordless authentication
export const userOtps = pgTable("user_otps", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserOtpSchema = createInsertSchema(userOtps).pick({
  email: true,
  otp: true,
  expiresAt: true,
  verified: true,
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  image: text("image").notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  image: true,
  displayOrder: true,
});

// Reviews table
export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  orderId: integer("order_id").references(() => orders.id), // Optional - to verify purchase
  rating: integer("rating").notNull(), // 1-5 star rating
  review: text("review"), // Text review (optional)
  title: text("title"), // Review title/headline (optional)
  verifiedPurchase: boolean("verified_purchase").notNull().default(false),
  status: text("status").notNull().default("published"), // published, pending, rejected
  helpfulCount: integer("helpful_count").notNull().default(0), // Number of users who found this helpful
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertReviewSchema = createInsertSchema(reviews).pick({
  userId: true,
  productId: true,
  orderId: true,
  rating: true,
  review: true,
  title: true,
  verifiedPurchase: true,
  status: true,
});

// Review Images table (for photo reviews)
export const reviewImages = pgTable("review_images", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  imageUrl: text("image_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewImageSchema = createInsertSchema(reviewImages).pick({
  reviewId: true,
  imageUrl: true,
});

// Review Helpful Votes (to track which users found which reviews helpful)
export const reviewHelpful = pgTable("review_helpful", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => reviews.id),
  userId: integer("user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewHelpfulSchema = createInsertSchema(reviewHelpful).pick({
  reviewId: true,
  userId: true,
});

// Relations for reviews
export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [reviews.productId],
    references: [products.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
  images: many(reviewImages),
  helpfulVotes: many(reviewHelpful),
}));

export const reviewImagesRelations = relations(reviewImages, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewImages.reviewId],
    references: [reviews.id],
  }),
}));

export const reviewHelpfulRelations = relations(reviewHelpful, ({ one }) => ({
  review: one(reviews, {
    fields: [reviewHelpful.reviewId],
    references: [reviews.id],
  }),
  user: one(users, {
    fields: [reviewHelpful.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type UserOtp = typeof userOtps.$inferSelect;
export type InsertUserOtp = z.infer<typeof insertUserOtpSchema>;

export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type ReviewImage = typeof reviewImages.$inferSelect;
export type InsertReviewImage = z.infer<typeof insertReviewImageSchema>;

export type ReviewHelpful = typeof reviewHelpful.$inferSelect;
export type InsertReviewHelpful = z.infer<typeof insertReviewHelpfulSchema>;

// User Activity Tracking for AI Assistant
export const userActivities = pgTable("user_activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Can be null for anonymous sessions
  sessionId: text("session_id").notNull(), // For tracking anonymous users
  activityType: text("activity_type").notNull(), // view, search, add_to_cart, purchase, etc.
  productId: integer("product_id").references(() => products.id),
  categoryId: integer("category_id").references(() => categories.id),
  searchQuery: text("search_query"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  additionalData: text("additional_data"), // JSON string with additional context
});

export const insertUserActivitySchema = createInsertSchema(userActivities).pick({
  userId: true,
  sessionId: true,
  activityType: true,
  productId: true,
  categoryId: true,
  searchQuery: true,
  additionalData: true,
});

// Product Relationships for Complementary Products
export const productRelationships = pgTable("product_relationships", {
  id: serial("id").primaryKey(),
  sourceProductId: integer("source_product_id").notNull().references(() => products.id),
  relatedProductId: integer("related_product_id").notNull().references(() => products.id),
  relationshipType: text("relationship_type").notNull(), // complementary, similar, bundle, etc.
  strength: doublePrecision("strength").notNull().default(1.0), // Relation strength (higher = stronger relationship)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductRelationshipSchema = createInsertSchema(productRelationships).pick({
  sourceProductId: true,
  relatedProductId: true,
  relationshipType: true,
  strength: true,
});

// AI Assistant Conversations
export const aiAssistantConversations = pgTable("ai_assistant_conversations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(),
  productId: integer("product_id").references(() => products.id), // Optional - if about a specific product
  categoryId: integer("category_id").references(() => categories.id), // Optional - if about a specific category
  conversationHistory: text("conversation_history").notNull(), // JSON string of messages
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiAssistantConversationSchema = createInsertSchema(aiAssistantConversations).pick({
  userId: true,
  sessionId: true,
  productId: true,
  categoryId: true,
  conversationHistory: true,
});

// Size Preferences for Size Recommendations
export const userSizePreferences = pgTable("user_size_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  category: text("category").notNull(), // clothing, shoes, etc.
  size: text("size").notNull(), // S, M, L, 42, etc.
  fit: text("fit"), // slim, regular, loose, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSizePreferenceSchema = createInsertSchema(userSizePreferences).pick({
  userId: true,
  category: true,
  size: true,
  fit: true,
});

// Relations for new tables
export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
  user: one(users, {
    fields: [userActivities.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [userActivities.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [userActivities.categoryId],
    references: [categories.id],
  }),
}));

export const productRelationshipsRelations = relations(productRelationships, ({ one }) => ({
  sourceProduct: one(products, {
    fields: [productRelationships.sourceProductId],
    references: [products.id],
  }),
  relatedProduct: one(products, {
    fields: [productRelationships.relatedProductId],
    references: [products.id],
  }),
}));

export const aiAssistantConversationsRelations = relations(aiAssistantConversations, ({ one }) => ({
  user: one(users, {
    fields: [aiAssistantConversations.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [aiAssistantConversations.productId],
    references: [products.id],
  }),
  category: one(categories, {
    fields: [aiAssistantConversations.categoryId],
    references: [categories.id],
  }),
}));

export const userSizePreferencesRelations = relations(userSizePreferences, ({ one }) => ({
  user: one(users, {
    fields: [userSizePreferences.userId],
    references: [users.id],
  }),
}));

// Add relationships to existing tables
export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;

export type ProductRelationship = typeof productRelationships.$inferSelect;
export type InsertProductRelationship = z.infer<typeof insertProductRelationshipSchema>;

export type AiAssistantConversation = typeof aiAssistantConversations.$inferSelect;
export type InsertAiAssistantConversation = z.infer<typeof insertAiAssistantConversationSchema>;

export type UserSizePreference = typeof userSizePreferences.$inferSelect;
export type InsertUserSizePreference = z.infer<typeof insertUserSizePreferenceSchema>;

export type UserAddress = typeof userAddresses.$inferSelect;
export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;

// ----------- User Addresses Feature -----------

// User Addresses table
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  addressName: text("address_name").notNull(), // Home, Work, etc.
  fullName: text("full_name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  pincode: text("pincode").notNull(),
  phone: text("phone").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserAddressSchema = createInsertSchema(userAddresses).pick({
  userId: true,
  addressName: true,
  fullName: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  phone: true,
  isDefault: true,
});

// User Address Relations
export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
}));

// ----------- Wishlist Feature -----------

// Wishlist table
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
});

export const insertWishlistSchema = createInsertSchema(wishlists).pick({
  userId: true,
  productId: true,
});

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
}));

export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

// ----------- Smart Inventory & Price Management Features -----------

// Sales Data table - for historical sales data used in demand forecasting
export const salesHistory = pgTable("sales_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  quantity: integer("quantity").notNull(),
  revenue: integer("revenue").notNull(), // in cents
  costPrice: integer("cost_price").notNull(), // in cents
  profitMargin: doublePrecision("profit_margin"), // percentage
  channel: text("channel"), // e.g., "marketplace", "direct", etc.
  promotionApplied: boolean("promotion_applied").default(false),
  seasonality: text("seasonality"), // e.g., "holiday", "summer", "back-to-school"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSalesHistorySchema = createInsertSchema(salesHistory).pick({
  productId: true,
  sellerId: true,
  date: true,
  quantity: true,
  revenue: true,
  costPrice: true,
  profitMargin: true,
  channel: true,
  promotionApplied: true,
  seasonality: true,
});

// Demand Forecasts table - stores ML-generated demand predictions
export const demandForecasts = pgTable("demand_forecasts", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  forecastDate: timestamp("forecast_date").notNull(),
  predictedDemand: integer("predicted_demand").notNull(),
  confidenceScore: doublePrecision("confidence_score").notNull(), // 0.0 to 1.0
  forecastPeriod: text("forecast_period").notNull(), // "daily", "weekly", "monthly"
  factorsConsidered: jsonb("factors_considered"), // JSON with factors that influenced the prediction
  actualDemand: integer("actual_demand"), // Filled in later for model evaluation
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts).pick({
  productId: true,
  sellerId: true,
  forecastDate: true,
  predictedDemand: true,
  confidenceScore: true,
  forecastPeriod: true,
  factorsConsidered: true,
  actualDemand: true,
});

// Price Optimization table - stores ML-generated pricing recommendations
export const priceOptimizations = pgTable("price_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  currentPrice: integer("current_price").notNull(), // in cents
  suggestedPrice: integer("suggested_price").notNull(), // in cents
  projectedRevenue: integer("projected_revenue"), // in cents
  projectedSales: integer("projected_sales"), 
  confidenceScore: doublePrecision("confidence_score").notNull(), // 0.0 to 1.0
  reasoningFactors: jsonb("reasoning_factors"), // JSON with factors that influenced the recommendation
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPriceOptimizationSchema = createInsertSchema(priceOptimizations).pick({
  productId: true,
  sellerId: true,
  currentPrice: true,
  suggestedPrice: true,
  projectedRevenue: true,
  projectedSales: true,
  confidenceScore: true,
  reasoningFactors: true,
  status: true,
  appliedAt: true,
});

// Inventory Optimization table - stores ML-generated inventory recommendations
export const inventoryOptimizations = pgTable("inventory_optimizations", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  currentStock: integer("current_stock").notNull(),
  recommendedStock: integer("recommended_stock").notNull(),
  reorderPoint: integer("reorder_point"), 
  maxStock: integer("max_stock"),
  safetyStock: integer("safety_stock"),
  leadTime: integer("lead_time"), // in days
  reason: text("reason"), // Explanation for the recommendation
  priorityLevel: text("priority_level").notNull().default("medium"), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventoryOptimizationSchema = createInsertSchema(inventoryOptimizations).pick({
  productId: true,
  sellerId: true,
  currentStock: true,
  recommendedStock: true,
  reorderPoint: true,
  maxStock: true,
  safetyStock: true,
  leadTime: true,
  reason: true,
  priorityLevel: true,
  status: true,
  appliedAt: true,
});

// AI Content Generation - stores ML-generated product content
export const aiGeneratedContent = pgTable("ai_generated_content", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  contentType: text("content_type").notNull(), // "description", "features", "specifications", "image"
  originalData: text("original_data"), // The input data provided for generation
  generatedContent: text("generated_content").notNull(), // The AI-generated content
  imageUrl: text("image_url"), // URL for generated images, if applicable
  promptUsed: text("prompt_used"), // The prompt used to generate the content
  status: text("status").notNull().default("pending"), // "pending", "applied", "rejected"
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiGeneratedContentSchema = createInsertSchema(aiGeneratedContent).pick({
  productId: true,
  sellerId: true,
  contentType: true,
  originalData: true,
  generatedContent: true,
  imageUrl: true,
  promptUsed: true,
  status: true,
  appliedAt: true,
});

// Relations for Smart Inventory & Price Management tables
export const salesHistoryRelations = relations(salesHistory, ({ one }) => ({
  product: one(products, {
    fields: [salesHistory.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [salesHistory.sellerId],
    references: [users.id],
  }),
}));

export const demandForecastsRelations = relations(demandForecasts, ({ one }) => ({
  product: one(products, {
    fields: [demandForecasts.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [demandForecasts.sellerId],
    references: [users.id],
  }),
}));

export const priceOptimizationsRelations = relations(priceOptimizations, ({ one }) => ({
  product: one(products, {
    fields: [priceOptimizations.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [priceOptimizations.sellerId],
    references: [users.id],
  }),
}));

export const inventoryOptimizationsRelations = relations(inventoryOptimizations, ({ one }) => ({
  product: one(products, {
    fields: [inventoryOptimizations.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [inventoryOptimizations.sellerId],
    references: [users.id],
  }),
}));

export const aiGeneratedContentRelations = relations(aiGeneratedContent, ({ one }) => ({
  product: one(products, {
    fields: [aiGeneratedContent.productId],
    references: [products.id],
  }),
  seller: one(users, {
    fields: [aiGeneratedContent.sellerId],
    references: [users.id],
  }),
}));

// Type exports for Smart Inventory & Price Management
export type SalesHistory = typeof salesHistory.$inferSelect;
export type InsertSalesHistory = z.infer<typeof insertSalesHistorySchema>;

export type DemandForecast = typeof demandForecasts.$inferSelect;
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;

export type PriceOptimization = typeof priceOptimizations.$inferSelect;
export type InsertPriceOptimization = z.infer<typeof insertPriceOptimizationSchema>;

export type InventoryOptimization = typeof inventoryOptimizations.$inferSelect;
export type InsertInventoryOptimization = z.infer<typeof insertInventoryOptimizationSchema>;

export type AIGeneratedContent = typeof aiGeneratedContent.$inferSelect;
export type InsertAIGeneratedContent = z.infer<typeof insertAiGeneratedContentSchema>;

// Seller Documents
export const sellerDocuments = pgTable("seller_documents", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  documentType: text("document_type").notNull(), // e.g., "GST Certificate", "PAN Card", etc.
  documentUrl: text("document_url").notNull(),
  documentName: text("document_name").notNull(),
  verified: boolean("verified").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verifiedAt: timestamp("verified_at"),
});

export const insertSellerDocumentSchema = createInsertSchema(sellerDocuments).omit({
  id: true,
  verified: true,
  uploadedAt: true,
  verifiedAt: true,
});

export type SellerDocument = typeof sellerDocuments.$inferSelect;
export type InsertSellerDocument = z.infer<typeof insertSellerDocumentSchema>;

// Business Details
export const businessDetails = pgTable("business_details", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id).unique(),
  businessName: text("business_name").notNull(),
  gstNumber: text("gst_number"),
  panNumber: text("pan_number"),
  businessType: text("business_type"),
  taxRegistrationDate: timestamp("tax_registration_date"),
  taxFilingStatus: text("tax_filing_status"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBusinessDetailsSchema = createInsertSchema(businessDetails).omit({
  id: true,
  updatedAt: true,
});

export type BusinessDetails = typeof businessDetails.$inferSelect;
export type InsertBusinessDetails = z.infer<typeof insertBusinessDetailsSchema>;

// Banking Information
export const bankingInformation = pgTable("banking_information", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id).unique(),
  accountHolderName: text("account_holder_name").notNull(),
  accountNumber: text("account_number").notNull(),
  bankName: text("bank_name").notNull(),
  ifscCode: text("ifsc_code").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBankingInformationSchema = createInsertSchema(bankingInformation).omit({
  id: true,
  updatedAt: true,
});

export type BankingInformation = typeof bankingInformation.$inferSelect;
export type InsertBankingInformation = z.infer<typeof insertBankingInformationSchema>;