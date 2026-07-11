const express = require("express");
const router = express.Router();
const { requireAuth, requireAdmin } = require("../helpers/requireAuth.jsx");

const {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getMyProfile,
  updateMyProfile,
} = require("../controllers/userController.jsx");

const {
  signUpAdmin,
  loginAdmin,
} = require("../controllers/adminContoller.jsx");

const {
  getCategories,
  createCategory,
  getProductTypes,
  createProductType,
  updateCategory,
  deleteCategory,
  updateProductType,
  deleteProductType,
} = require("../controllers/categoriesController.jsx");

const {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProducts,
} = require("../controllers/productsController.jsx");

const {
  createOrder,
  getPublicOrders,
  getPublicOrderById,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  processOrderRefund,
  addOrderTracking,
} = require("../controllers/ordersContoller.jsx");

const {
  getCustomers,
  getCustomerById,
  updateCustomer,
  resetCustomerPassword,
  suspendCustomer,
} = require("../controllers/customersContorller.jsx");

const {
  getInventory,
  updateInventory,
  getLowStockAlerts,
  logInventoryTransaction,
} = require("../controllers/inventoryContorller.jsx");

const {
  getSalesDashboard,
  getTopProducts,
  getMonthlyItemSalesReport,
  getCustomerAnalytics,
} = require("../controllers/analyticsController.jsx");

const {
  getPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} = require("../controllers/promotionsContorller.jsx");

const {
  getSettings,
  updateSettings,
  clearCache,
  resetSettings,
} = require("../controllers/settingsContollers.jsx");

const { uploadProductImages } = require("../controllers/imageUpload.jsx");

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistItem,
} = require("../controllers/wishlistController.jsx");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(logoutUser);
router
  .route("/me")
  .get(requireAuth, getMyProfile)
  .patch(requireAuth, updateMyProfile);
router.route("/profile/:userId").get(getUserProfile);
router.route("/profile/:userId").patch(requireAuth, updateUserProfile);
router.route("/profile/:userId").delete(requireAuth, deleteUserProfile);

router
  .route("/wishlist")
  .get(requireAuth, getWishlist)
  .post(requireAuth, addToWishlist);
router.route("/wishlist/check").get(requireAuth, checkWishlistItem);
router
  .route("/wishlist/:wishlistItemId")
  .delete(requireAuth, removeFromWishlist);

router.route("/admin/register").post(signUpAdmin);
router.route("/admin/login").post(loginAdmin);
router.route("/admin/logout").post(logoutUser);

router
  .route("/admin/categories")
  .get(getCategories)
  .post(requireAdmin, createCategory);
router
  .route("/admin/categories/:categoryId")
  .patch(requireAdmin, updateCategory)
  .delete(requireAdmin, deleteCategory);
router
  .route("/admin/product-types")
  .get(getProductTypes)
  .post(requireAdmin, createProductType);
router
  .route("/admin/product-types/:productTypeId")
  .patch(requireAdmin, updateProductType)
  .delete(requireAdmin, deleteProductType);
router
  .route("/admin/products")
  .get(getProducts)
  .post(requireAdmin, createProduct);
router.route("/admin/products/all").get(getAllProducts);
router
  .route("/admin/products/:productId")
  .get(getProductById)
  .patch(requireAdmin, updateProduct)
  .delete(requireAdmin, deleteProduct);
router.route("/admin/orders").get(requireAdmin, getOrders);
router.route("/orders").get(getPublicOrders).post(createOrder);
router.route("/orders/:orderId").get(getPublicOrderById);
router
  .route("/admin/orders/:orderId/status")
  .put(requireAdmin, updateOrderStatus);
router.route("/admin/orders/:orderId/cancel").post(requireAdmin, cancelOrder);
router
  .route("/admin/orders/:orderId/refund")
  .post(requireAdmin, processOrderRefund);
router
  .route("/admin/orders/:orderId/tracking")
  .post(requireAdmin, addOrderTracking);
router.route("/admin/orders/:orderId").get(requireAdmin, getOrderById);
router.route("/admin/customers").get(requireAdmin, getCustomers);
router
  .route("/admin/customers/:customerId")
  .get(requireAdmin, getCustomerById)
  .put(requireAdmin, updateCustomer);
router
  .route("/admin/customers/:customerId/suspend")
  .post(requireAdmin, suspendCustomer);
router
  .route("/admin/customers/:customerId/reset-password")
  .post(requireAdmin, resetCustomerPassword);
router.route("/admin/inventory").get(requireAdmin, getInventory);
router.route("/admin/inventory/low-stock").get(requireAdmin, getLowStockAlerts);
router
  .route("/admin/inventory/transactions")
  .post(requireAdmin, logInventoryTransaction);
router.route("/admin/inventory/:productId").put(requireAdmin, updateInventory);
router.route("/admin/analytics/sales").get(requireAdmin, getSalesDashboard);
router.route("/admin/analytics/top-products").get(requireAdmin, getTopProducts);
router
  .route("/admin/analytics/monthly-item-sales")
  .get(requireAdmin, getMonthlyItemSalesReport);
router
  .route("/admin/analytics/customers")
  .get(requireAdmin, getCustomerAnalytics);
router
  .route("/admin/promos")
  .get(getPromotions)
  .post(requireAdmin, createPromotion);
router
  .route("/admin/promos/:promoId")
  .put(requireAdmin, updatePromotion)
  .delete(requireAdmin, deletePromotion);
router
  .route("/admin/settings")
  .get(requireAdmin, getSettings)
  .put(requireAdmin, updateSettings);
router.route("/admin/settings/clear-cache").post(requireAdmin, clearCache);
router.route("/admin/settings/reset").post(requireAdmin, resetSettings);
router.route("/admin/upload-images").post(requireAdmin, uploadProductImages);

module.exports = router;
