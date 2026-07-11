/**
 * Admin Functions for Makam E-commerce Platform
 * Handles all administrative operations including products, orders, users, and inventory
 */

// ============================================
// PRODUCT MANAGEMENT
// ============================================

/**
 * Create a new product
 * @param {Object} productData - Product details
 * @returns {Promise<Object>} Created product with ID
 */
export const adminCreateProduct = async (productData) => {
    try {
        const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(productData),
        });
        return response.json();
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

/**
 * Get all products with filters
 * @param {Object} filters - Filter options (category, price range, etc.)
 * @returns {Promise<Array>} List of products
 */
export const adminGetProducts = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/products?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        throw error;
    }
};

/**
 * Get single product details
 * @param {string} productId - Product ID
 * @returns {Promise<Object>} Product details payload
 */
export const adminGetProductById = async (productId) => {
    try {
        const response = await fetch(`/api/admin/products/${productId}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching product details:", error);
        throw error;
    }
};

/**
 * Place an order from checkout
 * @param {Object} payload - Checkout order payload
 * @returns {Promise<Object>} Created order response
 */
export const placeCheckoutOrder = async (payload) => {
    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        return response.json();
    } catch (error) {
        console.error("Error placing order:", error);
        throw error;
    }
};

/**
 * Get customer/public orders
 * @param {Object} filters - Query filters (email, page, limit, status, q)
 * @returns {Promise<Object>} Orders list response
 */
export const getCustomerOrders = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/orders${queryString ? `?${queryString}` : ""}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching customer orders:", error);
        throw error;
    }
};

/**
 * Get customer/public order details
 * @param {string} orderId - Order ID
 * @param {Object} filters - Optional filters (email)
 * @returns {Promise<Object>} Order details response
 */
export const getCustomerOrderDetails = async (orderId, filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/orders/${orderId}${queryString ? `?${queryString}` : ""}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching customer order details:", error);
        throw error;
    }
};

/**
 * Update product details
 * @param {string} productId - Product ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated product
 */
export const adminUpdateProduct = async (productId, updates) => {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating product:", error);
        throw error;
    }
};

/**
 * Delete a product
 * @param {string} productId - Product ID to delete
 * @returns {Promise<Object>} Success response
 */
export const adminDeleteProduct = async (productId) => {
    try {
        const response = await fetch(`/api/admin/products/${productId}`, {
            method: "DELETE",
        });
        return response.json();
    } catch (error) {
        console.error("Error deleting product:", error);
        throw error;
    }
};

/**
 * Bulk update products (e.g., price update, stock adjustment)
 * @param {Array} productIds - Array of product IDs
 * @param {Object} updates - Common updates for all products
 * @returns {Promise<Object>} Bulk update result
 */
export const adminBulkUpdateProducts = async (productIds, updates) => {
    try {
        const response = await fetch("/api/admin/products/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productIds, updates }),
        });
        return response.json();
    } catch (error) {
        console.error("Error bulk updating products:", error);
        throw error;
    }
};

// ============================================
// INVENTORY MANAGEMENT
// ============================================

/**
 * Get inventory list with filters
 * @param {Object} filters - Filter options (q, status, page, limit)
 * @returns {Promise<Object>} Inventory list + pagination
 */
export const adminGetInventory = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/inventory?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching inventory:", error);
        throw error;
    }
};

/**
 * Update product stock/inventory
 * @param {string} productId - Product ID
 * @param {number} quantity - New stock quantity
 * @returns {Promise<Object>} Updated inventory
 */
export const adminUpdateInventory = async (productId, quantity) => {
    try {
        const response = await fetch(`/api/admin/inventory/${productId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity }),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating inventory:", error);
        throw error;
    }
};

/**
 * Get low stock alerts
 * @param {number} threshold - Stock level threshold
 * @returns {Promise<Array>} Products below threshold
 */
export const adminGetLowStockAlerts = async (threshold = 10) => {
    try {
        const response = await fetch(`/api/admin/inventory/low-stock?threshold=${threshold}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching low stock alerts:", error);
        throw error;
    }
};

/**
 * Log inventory transaction (addition/removal)
 * @param {string} productId - Product ID
 * @param {number} quantity - Quantity changed
 * @param {string} type - 'add' or 'remove'
 * @param {string} reason - Reason for transaction
 * @returns {Promise<Object>} Transaction record
 */
export const adminLogInventoryTransaction = async (
    productId,
    quantity,
    type,
    reason
) => {
    try {
        const response = await fetch("/api/admin/inventory/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity, type, reason }),
        });
        return response.json();
    } catch (error) {
        console.error("Error logging inventory transaction:", error);
        throw error;
    }
};

// ============================================
// ORDER MANAGEMENT
// ============================================

/**
 * Get all orders (with optional filters)
 * @param {Object} filters - Order filters (status, date range, customer, etc.)
 * @returns {Promise<Array>} List of orders
 */
export const adminGetOrders = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/orders?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching orders:", error);
        throw error;
    }
};

/**
 * Get single order details
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} Order details
 */
export const adminGetOrderDetails = async (orderId) => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching order details:", error);
        throw error;
    }
};

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status (pending, shipped, delivered, cancelled, etc.)
 * @returns {Promise<Object>} Updated order
 */
export const adminUpdateOrderStatus = async (orderId, status) => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating order status:", error);
        throw error;
    }
};

/**
 * Cancel an order
 * @param {string} orderId - Order ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} Cancelled order details
 */
export const adminCancelOrder = async (orderId, reason) => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
        });
        return response.json();
    } catch (error) {
        console.error("Error cancelling order:", error);
        throw error;
    }
};

/**
 * Process refund for an order
 * @param {string} orderId - Order ID
 * @param {number} amount - Refund amount
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund details
 */
export const adminProcessRefund = async (orderId, amount, reason) => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, reason }),
        });
        return response.json();
    } catch (error) {
        console.error("Error processing refund:", error);
        throw error;
    }
};

/**
 * Add tracking information to order
 * @param {string} orderId - Order ID
 * @param {Object} trackingInfo - Tracking details
 * @returns {Promise<Object>} Updated order
 */
export const adminAddTrackingInfo = async (orderId, trackingInfo) => {
    try {
        const response = await fetch(`/api/admin/orders/${orderId}/tracking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(trackingInfo),
        });
        return response.json();
    } catch (error) {
        console.error("Error adding tracking info:", error);
        throw error;
    }
};

// ============================================
// CUSTOMER/USER MANAGEMENT
// ============================================

/**
 * Get all customers
 * @param {Object} filters - Filter options (name, email, registration date, etc.)
 * @returns {Promise<Array>} List of customers
 */
export const adminGetCustomers = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/customers?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

/**
 * Get customer profile and order history
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Customer details and history
 */
export const adminGetCustomerDetails = async (customerId) => {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching customer details:", error);
        throw error;
    }
};

/**
 * Update customer information
 * @param {string} customerId - Customer ID
 * @param {Object} updates - Updated customer data
 * @returns {Promise<Object>} Updated customer
 */
export const adminUpdateCustomer = async (customerId, updates) => {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
};

/**
 * Reset customer password (send reset email)
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Success response
 */
export const adminResetCustomerPassword = async (customerId) => {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}/reset-password`, {
            method: "POST",
        });
        return response.json();
    } catch (error) {
        console.error("Error resetting customer password:", error);
        throw error;
    }
};

/**
 * Suspend or ban a customer account
 * @param {string} customerId - Customer ID
 * @param {string} action - 'suspend' or 'ban'
 * @param {string} reason - Reason for action
 * @returns {Promise<Object>} Updated customer status
 */
export const adminSuspendCustomer = async (customerId, action, reason) => {
    try {
        const response = await fetch(`/api/admin/customers/${customerId}/suspend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, reason }),
        });
        return response.json();
    } catch (error) {
        console.error("Error suspending customer:", error);
        throw error;
    }
};

// ============================================
// ANALYTICS & REPORTING
// ============================================

/**
 * Get sales dashboard data
 * @param {Object} dateRange - Date filter (startDate, endDate)
 * @returns {Promise<Object>} Sales metrics and analytics
 */
export const adminGetSalesDashboard = async (dateRange = {}) => {
    try {
        const queryString = new URLSearchParams(dateRange).toString();
        const response = await fetch(`/api/admin/analytics/sales?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching sales dashboard:", error);
        throw error;
    }
};

/**
 * Get revenue report
 * @param {Object} filters - Period and category filters
 * @returns {Promise<Object>} Revenue data
 */
export const adminGetRevenueReport = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/reports/revenue?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching revenue report:", error);
        throw error;
    }
};

/**
 * Get top selling products
 * @param {number} limit - Number of top products to return
 * @param {string} period - Time period (daily, weekly, monthly, yearly)
 * @returns {Promise<Array>} Top products
 */
export const adminGetTopProducts = async (limit = 10, period = "monthly") => {
    try {
        const response = await fetch(
            `/api/admin/analytics/top-products?limit=${limit}&period=${period}`
        );
        return response.json();
    } catch (error) {
        console.error("Error fetching top products:", error);
        throw error;
    }
};

/**
 * Get monthly item sales report
 * @param {Object} filters - Year filter
 * @returns {Promise<Object>} Monthly item sales rows
 */
export const adminGetMonthlyItemSalesReport = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(
            `/api/admin/analytics/monthly-item-sales${queryString ? `?${queryString}` : ""}`
        );
        return response.json();
    } catch (error) {
        console.error("Error fetching monthly item sales report:", error);
        throw error;
    }
};

/**
 * Get customer analytics
 * @param {Object} filters - Analytics filters
 * @returns {Promise<Object>} Customer insights
 */
export const adminGetCustomerAnalytics = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/analytics/customers?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching customer analytics:", error);
        throw error;
    }
};

// ============================================
// PROMOTIONS & DISCOUNTS
// ============================================

/**
 * Create promotional code
 * @param {Object} promoData - Promo code details
 * @returns {Promise<Object>} Created promo code
 */
export const adminCreatePromoCode = async (promoData) => {
    try {
        const response = await fetch("/api/admin/promos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(promoData),
        });
        return response.json();
    } catch (error) {
        console.error("Error creating promo code:", error);
        throw error;
    }
};

/**
 * Get all promotional codes
 * @param {Object} filters - Query filters (q, status)
 * @returns {Promise<Array>} List of promo codes
 */
export const adminGetPromoCodes = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/promos${queryString ? `?${queryString}` : ""}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching promo codes:", error);
        throw error;
    }
};

/**
 * Disable or enable promo code
 * @param {string} promoId - Promo code ID
 * @param {boolean} isActive - Active status
 * @returns {Promise<Object>} Updated promo code
 */
export const adminTogglePromoCode = async (promoId, isActive) => {
    try {
        const response = await fetch(`/api/admin/promos/${promoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isActive }),
        });
        return response.json();
    } catch (error) {
        console.error("Error toggling promo code:", error);
        throw error;
    }
};

/**
 * Update promotional code details
 * @param {string} promoId - Promo code ID
 * @param {Object} updates - Promotion fields to update
 * @returns {Promise<Object>} Updated promo response
 */
export const adminUpdatePromoCode = async (promoId, updates) => {
    try {
        const response = await fetch(`/api/admin/promos/${promoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating promo code:", error);
        throw error;
    }
};

/**
 * Delete promotional code
 * @param {string} promoId - Promo code ID
 * @returns {Promise<Object>} Delete response
 */
export const adminDeletePromoCode = async (promoId) => {
    try {
        const response = await fetch(`/api/admin/promos/${promoId}`, {
            method: "DELETE",
        });
        return response.json();
    } catch (error) {
        console.error("Error deleting promo code:", error);
        throw error;
    }
};

// ============================================
// CATEGORIES & COLLECTIONS
// ============================================

/**
 * Create a new product category
 * @param {Object} categoryData - Category details
 * @returns {Promise<Object>} Created category
 */
export const adminCreateCategory = async (categoryData) => {
    try {
        const response = await fetch("/api/admin/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(categoryData),
        });
        return response.json();
    } catch (error) {
        console.error("Error creating category:", error);
        throw error;
    }
};

/**
 * Get all categories
 * @returns {Promise<Array>} List of categories
 */
export const adminGetCategories = async () => {
    try {
        const response = await fetch("/api/admin/categories");
        return response.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};

/**
 * Get product types (optionally filtered by category)
 * @param {Object} filters - Filter options (categoryId)
 * @returns {Promise<Array>} List of product types
 */
export const adminGetProductTypes = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/product-types${queryString ? `?${queryString}` : ""}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching product types:", error);
        throw error;
    }
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} updates - Updated category data
 * @returns {Promise<Object>} Updated category
 */
export const adminUpdateCategory = async (categoryId, updates) => {
    try {
        const response = await fetch(`/api/admin/categories/${categoryId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating category:", error);
        throw error;
    }
};

/**
 * Delete category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Success response
 */
export const adminDeleteCategory = async (categoryId) => {
    try {
        const response = await fetch(`/api/admin/categories/${categoryId}`, {
            method: "DELETE",
        });
        return response.json();
    } catch (error) {
        console.error("Error deleting category:", error);
        throw error;
    }
};

// ============================================
// ADMIN SETTINGS & CONFIGURATION
// ============================================

/**
 * Get admin settings
 * @returns {Promise<Object>} Admin settings
 */
export const adminGetSettings = async () => {
    try {
        const response = await fetch("/api/admin/settings");
        return response.json();
    } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
    }
};

/**
 * Update admin settings
 * @param {Object} settings - Updated settings
 * @returns {Promise<Object>} Updated settings
 */
export const adminUpdateSettings = async (settings) => {
    try {
        const response = await fetch("/api/admin/settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(settings),
        });
        return response.json();
    } catch (error) {
        console.error("Error updating settings:", error);
        throw error;
    }
};

/**
 * Clear system cache
 * @returns {Promise<Object>} Action result
 */
export const adminClearCache = async () => {
    try {
        const response = await fetch("/api/admin/settings/clear-cache", {
            method: "POST",
        });
        return response.json();
    } catch (error) {
        console.error("Error clearing cache:", error);
        throw error;
    }
};

/**
 * Reset settings to defaults
 * @returns {Promise<Object>} Action result with updated settings
 */
export const adminResetSettings = async () => {
    try {
        const response = await fetch("/api/admin/settings/reset", {
            method: "POST",
        });
        return response.json();
    } catch (error) {
        console.error("Error resetting settings:", error);
        throw error;
    }
};

// ============================================
// WISHLIST MANAGEMENT
// ============================================

/**
 * Get user's wishlist
 * @param {Object} filters - Filter and pagination options
 * @returns {Promise<Object>} Wishlist items with pagination
 */
export const getWishlist = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/wishlist?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching wishlist:", error);
        throw error;
    }
};

/**
 * Add product to wishlist
 * @param {string} productId - Product ID
 * @param {string} variantId - Optional variant ID
 * @returns {Promise<Object>} Created wishlist item
 */
export const addToWishlist = async (productId, variantId = null) => {
    try {
        const response = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, variantId }),
        });
        return response.json();
    } catch (error) {
        console.error("Error adding to wishlist:", error);
        throw error;
    }
};

/**
 * Remove product from wishlist
 * @param {string} wishlistItemId - Wishlist item ID
 * @returns {Promise<Object>} Deletion result
 */
export const removeFromWishlist = async (wishlistItemId) => {
    try {
        const response = await fetch(`/api/wishlist/${wishlistItemId}`, {
            method: "DELETE",
        });
        return response.json();
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        throw error;
    }
};

/**
 * Check if product is in wishlist
 * @param {string} productId - Product ID
 * @param {string} variantId - Optional variant ID
 * @returns {Promise<Object>} Wishlist status
 */
export const checkWishlistItem = async (productId, variantId = null) => {
    try {
        const params = new URLSearchParams({ productId, ...(variantId && { variantId }) });
        const response = await fetch(`/api/wishlist/check?${params.toString()}`);
        return response.json();
    } catch (error) {
        console.error("Error checking wishlist:", error);
        throw error;
    }
};

/**
 * Logout current session
 * @returns {Promise<Object>} Logout response
 */
export const logoutSession = async () => {
    try {
        const response = await fetch("/api/logout", {
            method: "POST",
            credentials: "include",
        });
        return response.json();
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
};

/**
 * Get admin audit logs
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Audit logs
 */
export const adminGetAuditLogs = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/logs?${queryString}`);
        return response.json();
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        throw error;
    }
};

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Export products to CSV
 * @param {Array} productIds - Product IDs to export (null for all)
 * @returns {Promise<Blob>} CSV file blob
 */
export const adminExportProducts = async (productIds = null) => {
    try {
        const params = productIds ? `?ids=${productIds.join(",")}` : "";
        const response = await fetch(`/api/admin/exports/products${params}`);
        return response.blob();
    } catch (error) {
        console.error("Error exporting products:", error);
        throw error;
    }
};

/**
 * Export orders to CSV
 * @param {Object} filters - Filter options
 * @returns {Promise<Blob>} CSV file blob
 */
export const adminExportOrders = async (filters = {}) => {
    try {
        const queryString = new URLSearchParams(filters).toString();
        const response = await fetch(`/api/admin/exports/orders?${queryString}`);
        return response.blob();
    } catch (error) {
        console.error("Error exporting orders:", error);
        throw error;
    }
};
