import React, { useState, useEffect, useContext } from "react";
import api from "../../api";
import Swal from "sweetalert2";
import { SidebarContext } from "../../components/Layout";
import { Menu } from "@headlessui/react";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

const CategoriesView = () => {
  const { isCollapsed } = useContext(SidebarContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search / responsive state
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      if (res.data?.success) {
        setCategories(res.data.data || []);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Search filter
  const filteredCategories = categories.filter(
    (cat) =>
      !searchTerm ||
      cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(cat.id).includes(searchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const paginatedCategories = filteredCategories.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  // Delete category
  const handleDelete = async (id, name) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}" permanently?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DD6B55",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/categories/${id}`);
      if (res.data?.success) {
        Swal.fire("Deleted!", "Category deleted successfully.", "success");
        fetchCategories();
      } else {
        throw new Error(res.data?.message || "Failed to delete category");
      }
    } catch (err) {
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

  // Add category
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const newCategory = {
      category_name: form.category_name.value.trim(),
      description: form.description.value.trim(),
      is_active: form.is_active.checked,
    };

    if (!newCategory.category_name)
      return Swal.fire("Error", "Category name is required", "warning");

    const loadingAlert = Swal.fire({
      title: "Adding Category...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await api.post("/categories", newCategory);
      await loadingAlert.close();

      if (res.data?.success) {
        Swal.fire("Success", "Category added successfully", "success");
        form.reset();
        setIsAddModalOpen(false);
        fetchCategories();
      } else {
        throw new Error(res.data?.message || "Failed to add category");
      }
    } catch (err) {
      await loadingAlert.close();
      Swal.fire("Error", err.message || "Something went wrong", "error");
    }
  };

 // ✅ Update category (using PATCH)
const handleUpdateSubmit = async (e) => {
  e.preventDefault();
  const form = e.target;
  const updatedCategory = {
    category_name: form.category_name.value.trim(),
    description: form.description.value.trim(),
    is_active: form.is_active.checked,
  };

  const loadingAlert = Swal.fire({
    title: "Updating Category...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  try {
    const res = await api.patch(
      `/categories/${editingCategory.id}`,
      updatedCategory
    );
    await loadingAlert.close();

    if (res.data?.success) {
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Category updated successfully.",
        confirmButtonColor: "#0e4053",
      });
      setEditingCategory(null);
      fetchCategories();
    } else {
      throw new Error(res.data?.message || "Failed to update category");
    }
  } catch (err) {
    await loadingAlert.close();
    Swal.fire("Error", err.message || "Something went wrong", "error");
  }
};


  return (
    <div
      className={`min-h-screen p-2 sm:p-4 md:p-6 relative bg-gradient-to-br from-white to-[#E7F4FF]
        rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full ${
          isCollapsed ? "lg:max-w-[85vw] md:w-[85vw]" : "lg:max-w-[75vw] md:w-[80vw]"
        } mx-auto`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center  justify-between mb-6 gap-6">
        <h1 className="text-[22px] font-medium text-[#1F2837]">All Product Categories</h1>

        {/* Add & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-end items-center gap-6 w-full sm:w-auto">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#ef7e1b]  text-white px-6 py-2 rounded-lg hover:bg-[#ee7f1b] w-full sm:w-auto"
          >
            Create Categories
          </button>

          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
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
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Table */}
      <div className="bg-white rounded-2xl shadow-md">
        {loading ? (
          <p className="text-center text-gray-500 p-6">Loading product categories...</p>
        ) : filteredCategories.length === 0 ? (
          <p className="text-center text-gray-500 p-6">No product categories found.</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm text-left border-collapse">
                <thead className="bg-[#ef7e1b] text-white">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCategories.map((cat) => (
                    <tr key={cat.id} className="hover:bg-[#E7EFF8] transition">
                      <td className="px-4 py-3">{cat.id}</td>
                      <td className="px-4 py-3">{cat.category_name}</td>
                      <td className="px-4 py-3">{cat.description || "—"}</td>
                      <td className="px-4 py-3">
                        {cat.is_active ? "Active" : "Inactive"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Menu as="div" className="relative inline-block">
                          <Menu.Button className="p-2 rounded hover:bg-gray-100">
                            <EllipsisVerticalIcon className="w-6 h-6 text-gray-600" />
                          </Menu.Button>
                          <Menu.Items className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md py-1 z-50">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={() => setEditingCategory(cat)}
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
                                  onClick={() => handleDelete(cat.id, cat.category_name)}
                                  className={`${
                                    active ? "bg-gray-100" : ""
                                  } block w-full text-left px-4 py-2 text-sm text-gray-700 `}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </Menu.Items>
                        </Menu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
          {paginatedCategories.map((cat) => (
                <div
                  key={cat.id}
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
                              onClick={() => setEditingCategory(cat)}
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
                              onClick={() => handleDelete(cat.id, cat.category_name)}
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
                  <h3 className="text-lg font-semibold">{cat.category_name}</h3>
                  <p className="text-sm text-gray-500">{cat.description || "—"}</p>
                  <p
                    className={`text-sm ${
                      cat.is_active ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Inactive"}
                  </p>
                </div>
                
              ))}
                          
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!loading && categories.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
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

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 sm:p-4">
          <div  className="w-11/12 max-w-[600px] max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#FFFFFF] to-[#E6F4FF] shadow-lg relative z-10">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
             >
              ✕
            </button>
            <h1 className="text-[22px] font-medium text-[#1F2837] mb-6">
              Create Categories 
            </h1>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-[#4B5563] mb-1">Categories Name</label>
                <input
                  type="text"
                  name="category_name"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4B5563] mb-1">Description</label>
                <textarea
                  name="description"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" defaultChecked />
                <label>Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#ef7e1b] text-white py-2 rounded-xl hover:bg-[#ee7f1b] transition"
              >
                Create Categories
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 w-full max-w-[calc(100%-2rem)] sm:max-w-md mx-auto relative">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white bg-red-500 w-8 h-8 rounded-full flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
            <h1 className="text-[22px] font-medium text-[#1F2837] mb-6">
              Edit Categories
            </h1>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="block text-[#4B5563] mb-1">Categories Name</label>
                <input
                  type="text"
                  name="category_name"
                  defaultValue={editingCategory.category_name}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                />
              </div>
              <div>
                <label className="block text-[#4B5563] mb-1">Description</label>
                <textarea
                  name="description"
                  defaultValue={editingCategory.description}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0e4053] outline-none"
                ></textarea>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editingCategory.is_active}
                />
                <label>Active</label>
              </div>
              <button
                type="submit"
                className="w-full bg-[#ef7e1b] text-white py-2 rounded-xl hover:bg-[#ee7f1b] transition"
              >
                Update Categories
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesView;
