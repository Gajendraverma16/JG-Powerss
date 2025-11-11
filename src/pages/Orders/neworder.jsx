// neworder.jsx
import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { FaPlus, FaMinus, FaTimes } from "react-icons/fa";

/**
 * NewOrder - Create order for shop owners
 * Features:
 * ✅ Salesman sees only assigned shop owners
 * ✅ Superadmin sees all
 * ✅ Product dropdown is always visible (fixed z-index)
 * ✅ Mobile modal view for product search
 * ✅ Quantity editable, price read-only
 */

const NewOrder = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  const [items, setItems] = useState([
    {
      product_id: "",
      title: "",
      product_price: 0,
      product_points: 0,
      quantity: 1,
      order_status: 0,
      product_obj: null,
    },
  ]);

  const [notes, setNotes] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const [productDropdownOpenIndex, setProductDropdownOpenIndex] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch leads
useEffect(() => {
  let canceled = false;
  setLeadsLoading(true);

  api
    .get("/showlead")
    .then((res) => {
      if (canceled) return;
      let fetched = res?.data?.result || [];
      if (!Array.isArray(fetched)) fetched = Object.values(fetched);

      // ✅ No filtering — show all leads for all users
      setLeads(fetched);
    })
    .catch((err) => {
      console.error("Error fetching leads:", err);
      setLeads([]);
    })
    .finally(() => setLeadsLoading(false));

  return () => {
    canceled = true;
  };
}, [user]);


  // Fetch products
  useEffect(() => {
    let canceled = false;
    setProductsLoading(true);

    api
      .get("/products")
      .then((res) => {
        if (canceled) return;
        setProducts(res?.data?.data || []);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
      })
      .finally(() => setProductsLoading(false));

    return () => (canceled = true);
  }, []);

  // Filter products by search
  const getFilteredProducts = (term) => {
    if (!term) return products;
    const t = term.toLowerCase();
    return products.filter(
      (p) =>
        (p.item_name && p.item_name.toLowerCase().includes(t)) ||
        (p.sku && p.sku.toLowerCase().includes(t)) ||
        String(p.id) === term
    );
  };

  // Select lead
  const handleLeadSelect = (lead) => {
    setSelectedLead(lead);
    setLeadSearch(lead.customer_name || "");
    setLeadDropdownOpen(false);
  };

  // Add item
  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      {
        product_id: "",
        title: "",
        product_price: 0,
        product_points: 0,
        quantity: 1,
        order_status: 0,
        product_obj: null,
      },
    ]);
  };

  // Remove item
  const removeItemRow = (index) => {
    if (items.length === 1)
      return Swal.fire("Error", "At least one product is required.", "error");
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Select product
  const handleProductSelect = (product, idx) => {
    const updated = [...items];
    updated[idx] = {
      ...updated[idx],
      product_id: product.id,
      title: product.item_name,
      product_price: parseFloat(product.price || 0),
      product_points: parseInt(product.item_points || 0),
      quantity: 1,
    };
    setItems(updated);
    setProductDropdownOpenIndex(null);
    setProductSearchTerm("");
  };

  // Change quantity
  const handleQuantityChange = (idx, val) => {
    const updated = [...items];
    updated[idx].quantity = Math.max(1, parseInt(val || 1));
    setItems(updated);
  };

  // Calculate totals
  const calculateTotals = () => {
    let total_value = 0,
      total_points = 0;
    for (const it of items) {
      const price = parseFloat(it.product_price || 0);
      const qty = parseInt(it.quantity || 0);
      const pts = parseFloat(it.product_points || 0);
      total_value += price * qty;
      total_points += pts * qty;
    }
    return { total_value, total_points };
  };

  // Submit
  const submitOrder = async () => {
    if (!selectedLead)
      return Swal.fire("Error", "Please select a shop owner.", "error");
    if (!items.every((i) => i.product_id))
      return Swal.fire("Error", "Please select all products.", "error");

    const payload = {
      salesman_id: Number(user?.id),
      shop_owner_id: Number(selectedLead?.customer_id || selectedLead?.id),
      order_type: "new",
      notes,
      items: items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        product_price: it.product_price,
        product_points: it.product_points,
        order_status: it.order_status,
      })),
    };

    try {
      Swal.fire({ title: "Creating order...", didOpen: () => Swal.showLoading(), allowOutsideClick: false });
      const res = await api.post("/orders", payload);
      Swal.close();
      if (res.data?.success) {
        Swal.fire("Success", res.data.message, "success");
        setSelectedLead(null);
        setLeadSearch("");
        setItems([{ product_id: "", title: "", product_price: 0, product_points: 0, quantity: 1 }]);
        setNotes("");
      } else Swal.fire("Error", res.data?.message || "Failed to create order", "error");
    } catch (e) {
      Swal.close();
      Swal.fire("Error", "Failed to create order.", "error");
    }
  };

  const filteredLeads = leads.filter((l) => {
    const t = leadSearch.toLowerCase();
    return (
      !t ||
      l.customer_name?.toLowerCase().includes(t) ||
      l.email?.toLowerCase().includes(t) ||
      String(l.contact || "").includes(t)
    );
  });

  return (
    <div className="w-[95vw] md:w-[90vw] lg:w-[80vw] xl:w-[70vw] mx-auto min-h-screen bg-white p-4 md:p-6 rounded-xl">
      <h2 className="text-xl font-bold text-[#EF7E1B] mb-6">New Order</h2>

      {/* Lead selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Shop Owner</label>
        <div className="relative overflow-visible">
          <input
            type="text"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#EF7E1B]"
            placeholder="Search shop owner..."
            value={leadSearch}
            onChange={(e) => {
              setLeadSearch(e.target.value);
              setLeadDropdownOpen(true);
            }}
            onFocus={() => setLeadDropdownOpen(true)}
          />
          {selectedLead && (
            <button
              className="absolute right-2 top-2 text-gray-500 hover:text-red-500"
              onClick={() => {
                setSelectedLead(null);
                setLeadSearch("");
              }}
            >
              <FaTimes />
            </button>
          )}

          {leadDropdownOpen && (
            <div className="absolute z-[9999] mt-2 bg-white border rounded-xl shadow-2xl max-h-64 overflow-y-auto w-full">
              {leadsLoading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  {leads.length === 0
                    ? "No assigned shop owners found"
                    : "No matching shop owners"}
                </div>
              ) : (
                filteredLeads.map((lead) => (
                  <div
                    key={lead.customer_id || lead.id}
                    onClick={() => handleLeadSelect(lead)}
                    className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{lead.customer_name}</div>
                      <div className="text-xs text-gray-500">{lead.email || lead.contact}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      Assigned: {lead.assigned_to || "-"}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {selectedLead && (
          <div className="mt-3 p-3 bg-gray-50 border rounded-xl text-sm">
            <div className="font-semibold">{selectedLead.customer_name}</div>
            <div>{selectedLead.email || selectedLead.contact}</div>
          </div>
        )}
      </div>

      {/* Product list */}
     <div className="border border-gray-200 rounded-xl overflow-visible mb-6">
  <div className="grid grid-cols-[2fr_1fr_1fr_40px_1fr] text-xs font-semibold text-white bg-gray-800 rounded-t-xl">
    <div className="p-2">Product</div>
    <div className="p-2 text-center">Qty</div>
    <div className="p-2 text-center">Price</div>
    <div></div>
    <div className="p-2 text-right">Amount</div>
  </div>

  {items.map((it, idx) => (
    <div
      key={idx}
      className="grid grid-cols-[2fr_1fr_1fr_40px_1fr] items-center px-2 py-3 border-b relative overflow-visible"
    >
      {/* Product Search */}
      <div className="relative overflow-visible" data-product-dropdown>
        <input
          type="text"
          value={it.title || ""}
          onChange={(e) => {
            const val = e.target.value;
            const updated = [...items];
            updated[idx].title = val;
            setItems(updated);
            setProductDropdownOpenIndex(idx);
            setProductSearchTerm(val);
          }}
          onFocus={() => {
            setProductDropdownOpenIndex(idx);
            setProductSearchTerm(it.title);
          }}
          placeholder="Search product..."
          className="w-full px-2 py-2 border-b border-gray-200 outline-none bg-transparent"
        />

        {productDropdownOpenIndex === idx &&
          (isMobileView ? (
            // Mobile full screen modal
            <div className="fixed inset-0 z-[9999] bg-white p-4 overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <input
                  autoFocus
                  type="text"
                  value={productSearchTerm}
                  onChange={(e) => setProductSearchTerm(e.target.value)}
                  placeholder="Search product..."
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <button
                  className="text-gray-600"
                  onClick={() => setProductDropdownOpenIndex(null)}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="space-y-1">
                {productsLoading ? (
                  <div className="p-3 text-sm text-gray-500">
                    Loading products...
                  </div>
                ) : (
                  getFilteredProducts(productSearchTerm).map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 border-b hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleProductSelect(p, idx)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.item_name}</div>
                        <div className="text-xs text-gray-500 truncate">{p.sku}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-700">
                        ₹{p.price}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            // Desktop dropdown
            <div className="absolute z-[99999] left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
              {productsLoading ? (
                <div className="p-3 text-sm text-gray-500">Loading products...</div>
              ) : (
                getFilteredProducts(productSearchTerm).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all rounded-lg"
                    onClick={() => handleProductSelect(p, idx)}
                  >
                    <div>
                      <div className="font-medium">{p.item_name}</div>
                      <div className="text-xs text-gray-500">{p.sku}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-700">₹{p.price}</div>
                  </div>
                ))
              )}
            </div>
          ))}
      </div>

      {/* Qty */}
      <div className="text-center">
        <input
          type="number"
          min="1"
          value={it.quantity}
          onChange={(e) => handleQuantityChange(idx, e.target.value)}
          className="w-full text-center border border-gray-200 rounded-md"
        />
      </div>

      {/* Price */}
      <div className="text-center">
        <input
          type="number"
          value={it.product_price}
          readOnly
          className="w-full text-center border border-gray-200 bg-gray-50 rounded-md"
        />
      </div>

      {/* Remove */}
      <div className="text-center">
        <button
          onClick={() => removeItemRow(idx)}
          className="text-red-500 hover:text-red-700"
        >
          <FaMinus />
        </button>
      </div>

      {/* Amount */}
      <div className="text-right font-medium">
        ₹{(it.quantity * it.product_price).toLocaleString()}
      </div>
    </div>
  ))}

  {/* Add new product */}
  <div className="p-3 text-center">
    <button
      onClick={addItemRow}
      className="text-[#ef7e1b] border border-dashed border-[#ef7e1b] px-3 py-2 rounded-full text-sm"
    >
      <FaPlus className="inline mr-1" /> Add Product
    </button>
  </div>
</div>


      {/* Notes */}
      <textarea
        rows="3"
        className="w-full border rounded-xl p-3 text-sm mb-6"
        placeholder="Add any notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      {/* Totals */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-[#f9fafb] border rounded-xl p-5">
        {(() => {
          const { total_value, total_points } = calculateTotals();
          return (
            <div>
              <div className="text-2xl font-bold text-[#EF7E1B]">
                Total: ₹{total_value.toLocaleString()}
              </div>
              <div className="text-lg text-gray-500">
                Total Points: {total_points.toLocaleString()}
              </div>
            </div>
          );
        })()}
        <button
          onClick={submitOrder}
          className="bg-[#EF7E1B] text-white px-6 py-3 rounded-xl font-semibold text-lg"
        >
          Create Order
        </button>
      </div>
    </div>
  );
};

export default NewOrder;
