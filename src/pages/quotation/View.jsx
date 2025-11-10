import React, { useState, useEffect, useContext } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import { SidebarContext } from "../../components/Layout";
import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const ViewProducts = () => {
  const { isCollapsed } = useContext(SidebarContext);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  // Search / responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data.data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
const fetchCategories = async () => {
  try {
    const res = await api.get("/categories");
    if (res.data?.success) {
      setCategories(res.data.data || []);
    } else {
      setCategories([]);
      console.error("Failed to fetch categories:", res.data?.message);
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    setCategories([]);
  }
};


  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Search Handlers
  const handleSearchToggle = () => setIsSearchExpanded(!isSearchExpanded);
  const handleSearchBlur = () => setIsSearchExpanded(false);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  // Delete product
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/products/${id}`);
        setProducts((prev) => prev.filter((product) => product.id !== id));
        Swal.fire("Deleted!", "Product has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting product:", error);
        Swal.fire("Error!", "Failed to delete product.", "error");
      }
    }
  };

  // Update product
  const handleUpdateProduct = async (data, id, isFormData = false) => {
    try {
      await api.post(`/products/update/${id}`, data, {
        headers: {
          "Content-Type": isFormData ? "multipart/form-data" : "application/json",
        },
      });

      Swal.fire({
        icon: "success",
        title: "Product Updated!",
        text: "Your product has been updated successfully.",
        timer: 1500,
        showConfirmButton: false,
      });

      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error("Update failed:", error.response?.data || error.message);
      Swal.fire("Error!", "Failed to update product.", "error");
    }
  };

  // Filter products by search + category
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchTerm ||
      String(p.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.item_name &&
        p.item_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      !selectedCategory || String(p.category_id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, itemsPerPage]);

  return (
    <div
      className={`min-h-screen p-2 sm:p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF]
        rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full ${
          isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
        } mx-auto`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <h1 className="text-[22px] font-medium text-[#1F2837]">All Products</h1>

        {/* Category + Search Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 focus:ring-2 focus:ring-[#ef7e1b] outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="w-full sm:w-80">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Search by name, SKU or ID..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#ef7e1b] outline-none"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.5 15.5L19 19M5 11a6 6 0 1112 0 6 6 0 01-12 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 p-1"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Product Table / Grid */}
      <div className="bg-white rounded-2xl shadow-md">
        {loading ? (
          <p className="text-center text-gray-500 p-6">Loading products...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 p-6">No products found.</p>
        ) : (
          <>
            {/* Table (Desktop) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#ef7e1b] text-white">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Image</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Points</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product) => {
                    const categoryName =
                      categories.find(
                        (cat) => cat.id === product.category_id
                      )?.category_name || "—";
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-[#E7EFF8] transition"
                      >
                        <td className="px-4 py-3">{product.id}</td>
                        <td className="px-4 py-3">
                          {product.product_image ? (
                            <img
                              src={product.product_image}
                              alt={product.item_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <span className="text-gray-400">No Image</span>
                          )}
                        </td>
                        <td className="px-4 py-3">{product.item_name}</td>
                        <td className="px-4 py-3">{categoryName}</td>
                        <td className="px-4 py-3">
                          ₹{product.sale_price || product.regular_price}
                        </td>
                        <td className="px-4 py-3">{product.quantity}</td>
                        <td className="px-4 py-3">{product.item_points}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <Menu as="div" className="relative inline-block">
                              <Menu.Button className="p-2 rounded hover:bg-gray-100">
                                <EllipsisVerticalIcon className="w-6 h-6 text-gray-600" />
                              </Menu.Button>
                              <Menu.Items className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md py-1 z-50">
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        setEditingProduct(product)
                                      }
                                      className={`${
                                        active ? "bg-gray-100" : ""
                                      } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                                    >
                                      Edit
                                    </button>
                                  )}
                                </Menu.Item>
                                <Menu.Item>
                                  {({ active }) => (
                                    <button
                                      onClick={() =>
                                        handleDelete(product.id)
                                      }
                                      className={`${
                                        active ? "bg-gray-100" : ""
                                      } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                                    >
                                      Delete
                                    </button>
                                  )}
                                </Menu.Item>
                              </Menu.Items>
                            </Menu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grid (Mobile) */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
              {paginatedProducts.map((product) => {
                const categoryName =
                  categories.find(
                    (cat) => cat.id === product.category_id
                  )?.category_name || "—";
                return (
                  <div
                    key={product.id}
                    className="bg-white rounded-lg shadow p-4 space-y-3"
                  >
                    <div className="flex justify-end">
                      <Menu as="div" className="relative">
                        <Menu.Button className="p-1.5 rounded-full hover:bg-gray-100">
                          <EllipsisVerticalIcon className="w-5 h-5 text-gray-600" />
                        </Menu.Button>
                        <Menu.Items className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md py-1 z-50">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => setEditingProduct(product)}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                              >
                                Edit
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => handleDelete(product.id)}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                              >
                                Delete
                              </button>
                            )}
                          </Menu.Item>
                        </Menu.Items>
                      </Menu>
                    </div>

                    <div className="flex space-x-3">
                      {product.product_image ? (
                        <img
                          src={product.product_image}
                          alt={product.item_name}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.item_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          ₹{product.sale_price || product.regular_price}
                        </p>
                        <p className="text-xs text-gray-500">
                          Category: {categoryName}
                        </p>
                        <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                          <span>Stock: {product.quantity}</span>
                          <span>•</span>
                          <span>Points: {product.item_points}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && products.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          {/* Items per page */}
          <div>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:ring-2 focus:ring-[#ef7e1b] outline-none"
            >
              {[5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>
                  Show {num}
                </option>
              ))}
            </select>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === 1
                  ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                  : "text-[#ef7e1b] border-[#ef7e1b] hover:bg-[#ef7e1b] hover:text-white"
              } transition`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) =>
                  prev < totalPages ? prev + 1 : totalPages
                )
              }
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-lg border ${
                currentPage === totalPages
                  ? "text-gray-400 border-gray-200 bg-gray-100 cursor-not-allowed"
                  : "text-[#ef7e1b] border-[#ef7e1b] hover:bg-[#ef7e1b] hover:text-white"
              } transition`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal (No Category Edit) */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-md mx-auto relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingProduct(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>

            <h1 className="text-[22px] font-medium text-[#1F2837] mb-6">
              Edit Product
            </h1>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const payload = {
                  item_name: e.target.item_name.value,
                  sku: e.target.sku.value,
                  regular_price: parseFloat(e.target.regular_price.value),
                  sale_price: parseFloat(e.target.sale_price.value),
                  quantity: parseInt(e.target.quantity.value),
                  item_points: parseInt(e.target.item_points.value),
                  slug: e.target.slug.value,
                  is_refundable: editingProduct.is_refundable ? 1 : 0,
                  is_exchangeable: editingProduct.is_exchangeable ? 1 : 0,
                  is_active: editingProduct.is_active ? 1 : 0,
                };

                if (e.target.product_image.files[0]) {
                  const formData = new FormData();
                  formData.append("product_image", e.target.product_image.files[0]);
                  Object.keys(payload).forEach((key) =>
                    formData.append(key, payload[key])
                  );
                  await handleUpdateProduct(formData, editingProduct.id, true);
                } else {
                  await handleUpdateProduct(payload, editingProduct.id, false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-[#4B5563] mb-1">Item Name</label>
                <input
                  type="text"
                  name="item_name"
                  defaultValue={editingProduct.item_name}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#4B5563] mb-1">SKU</label>
                <input
                  type="text"
                  name="sku"
                  defaultValue={editingProduct.sku}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#4B5563] mb-1">Regular Price</label>
                  <input
                    type="number"
                    name="regular_price"
                    defaultValue={editingProduct.regular_price}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#4B5563] mb-1">Sale Price</label>
                  <input
                    type="number"
                    name="sale_price"
                    defaultValue={editingProduct.sale_price}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#4B5563] mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    defaultValue={editingProduct.quantity}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#4B5563] mb-1">Points</label>
                  <input
                    type="number"
                    name="item_points"
                    defaultValue={editingProduct.item_points}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#4B5563] mb-1">Upload Product Image</label>
                <input
                  type="file"
                  name="product_image"
                  accept="image/*"
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[#4B5563] mb-1">Slug</label>
                <input
                  type="text"
                  name="slug"
                  defaultValue={editingProduct.slug}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#ef7e1b] text-white py-2 rounded-xl hover:bg-[#ee7f1b] transition"
              >
                Update Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewProducts;
