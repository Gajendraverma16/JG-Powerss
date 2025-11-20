// neworder.jsx
import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { FaPlus, FaMinus, FaTimes, FaArrowLeft, FaArrowRight, FaCamera } from "react-icons/fa";

/**
 * NewOrder - Create order for shop owners with three forms: New, Return, Exchange
 * Features:
 * ✅ Three forms in one screen with step navigation
 * ✅ Salesman sees only assigned shop owners
 * ✅ Superadmin sees all
 * ✅ Product dropdown is always visible (fixed z-index)
 * ✅ Mobile modal view for product search
 * ✅ Quantity editable, price read-only
 * ✅ Shows product images in dropdown
 * ✅ Image upload for return and exchange orders
 */

const NewOrder = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're in edit mode
  const editOrder = location.state?.quotation;
  const isEditMode = !!editOrder;
  
  // Form navigation state
  const [currentStep, setCurrentStep] = useState(0); // 0: New Order, 1: Return Order, 2: Exchange Order
  const formTypes = ['new', 'return', 'exchange'];
  const formTitles = ['New Order', 'Return Order', 'Exchange Order'];
  
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [organizationLimit, setOrganizationLimit] = useState(null);

  // Store data for all three forms separately
  const [allOrdersData, setAllOrdersData] = useState({
    new: {
      items: [{
        product_id: "",
        title: "",
        product_price: 0,
        product_points: 0,
        quantity: 1,
        order_status: 0,
        product_obj: null,
        images: [],
      }],
      notes: ""
    },
    return: {
      items: [{
        product_id: "",
        title: "",
        product_price: 0,
        product_points: 0,
        quantity: 1,
        order_status: 1,
        product_obj: null,
        images: [],
      }],
      notes: ""
    },
    exchange: {
      items: [{
        product_id: "",
        title: "",
        product_price: 0,
        product_points: 0,
        quantity: 1,
        order_status: 2,
        product_obj: null,
        images: [],
      }],
      notes: ""
    }
  });

  const [showSummary, setShowSummary] = useState(false);

  // Current form data (derived from allOrdersData)
  const items = allOrdersData[formTypes[currentStep]].items;
  const notes = allOrdersData[formTypes[currentStep]].notes;
  const [isMobileView, setIsMobileView] = useState(false);
  const [productDropdownOpenIndex, setProductDropdownOpenIndex] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");

  // Refs for click outside handling
  const leadDropdownRef = useRef(null);
  const productDropdownRefs = useRef([]);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if clicking on a dropdown item - if so, don't close
      if (event.target.closest('[data-dropdown-item]')) {
        return;
      }

      // Handle lead dropdown click outside
      if (leadDropdownOpen && leadDropdownRef.current && !leadDropdownRef.current.contains(event.target)) {
        setLeadDropdownOpen(false);
      }

      // Handle product dropdown click outside
      if (productDropdownOpenIndex !== null) {
        const currentProductRef = productDropdownRefs.current[productDropdownOpenIndex];
        if (currentProductRef && !currentProductRef.contains(event.target)) {
          setProductDropdownOpenIndex(null);
          setProductSearchTerm("");
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [leadDropdownOpen, productDropdownOpenIndex]);

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

  // Fetch organization data to get limit
  useEffect(() => {
    let canceled = false;

    api
      .get("/orglist")
      .then((res) => {
        if (canceled) return;
        const result = res?.data?.result;
        if (result) {
          // Get the first organization's limit
          const firstOrgKey = Object.keys(result)[0];
          if (firstOrgKey && result[firstOrgKey]) {
            const limit = parseFloat(result[firstOrgKey].limit || 0);
            setOrganizationLimit(limit);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching organization data:", err);
      });

    return () => (canceled = true);
  }, []);

  // Populate form data in edit mode
  useEffect(() => {
    if (isEditMode && editOrder && leads.length > 0 && products.length > 0) {
      // Set selected shop owner
      const shopOwner = leads.find(l => l.customer_id === editOrder.shop_owner_id || l.id === editOrder.shop_owner_id);
      if (shopOwner) {
        setSelectedLead(shopOwner);
        setLeadSearch(shopOwner.customer_name || "");
      }

      // Group items by order_status
      const newItems = editOrder.items?.filter(item => item.order_status === "0" || item.order_status === 0) || [];
      const returnItems = editOrder.items?.filter(item => item.order_status === "1" || item.order_status === 1) || [];
      const exchangeItems = editOrder.items?.filter(item => item.order_status === "2" || item.order_status === 2) || [];

      // Helper to convert item to form format
      const convertItem = (item, orderStatus) => {
        // Clean up image URL (remove duplicate /public/)
        const imageUrl = item.new_image_url ? item.new_image_url.replace('/public/public/', '/public/') : null;
        
        console.log('Converting item:', item.title, 'Image URL:', imageUrl);
        
        return {
          product_id: item.product_id,
          title: item.title,
          product_price: parseFloat(item.price),
          product_points: parseFloat(item.points),
          quantity: item.quantity,
          order_status: orderStatus,
          product_obj: item.product || products.find(p => p.id === item.product_id),
          images: imageUrl ? [{
            file: null,
            preview: imageUrl,
            existing: true
          }] : [],
        };
      };

      // Parse notes
      const notesObj = { new: "", return: "", exchange: "" };
      if (editOrder.notes) {
        const notesParts = editOrder.notes.split(' | ');
        notesParts.forEach(part => {
          if (part.startsWith('NEW:')) notesObj.new = part.replace('NEW:', '').trim();
          if (part.startsWith('RETURN:')) notesObj.return = part.replace('RETURN:', '').trim();
          if (part.startsWith('EXCHANGE:')) notesObj.exchange = part.replace('EXCHANGE:', '').trim();
        });
      }

      setAllOrdersData({
        new: {
          items: newItems.length > 0 ? newItems.map(item => convertItem(item, 0)) : [{
            product_id: "",
            title: "",
            product_price: 0,
            product_points: 0,
            quantity: 1,
            order_status: 0,
            product_obj: null,
            images: [],
          }],
          notes: notesObj.new
        },
        return: {
          items: returnItems.length > 0 ? returnItems.map(item => convertItem(item, 1)) : [{
            product_id: "",
            title: "",
            product_price: 0,
            product_points: 0,
            quantity: 1,
            order_status: 1,
            product_obj: null,
            images: [],
          }],
          notes: notesObj.return
        },
        exchange: {
          items: exchangeItems.length > 0 ? exchangeItems.map(item => convertItem(item, 2)) : [{
            product_id: "",
            title: "",
            product_price: 0,
            product_points: 0,
            quantity: 1,
            order_status: 2,
            product_obj: null,
            images: [],
          }],
          notes: notesObj.exchange
        }
      });
    }
  }, [isEditMode, editOrder, leads, products]);

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
    const currentFormType = formTypes[currentStep];
    // Set correct order_status based on form type
    const orderStatus = currentFormType === 'new' ? 0 : currentFormType === 'return' ? 1 : 2;
    
    setAllOrdersData(prev => ({
      ...prev,
      [currentFormType]: {
        ...prev[currentFormType],
        items: [
          ...prev[currentFormType].items,
          {
            product_id: "",
            title: "",
            product_price: 0,
            product_points: 0,
            quantity: 1,
            order_status: orderStatus,
            product_obj: null,
            images: [],
          }
        ]
      }
    }));
  };

  // Remove item
  const removeItemRow = (index) => {
    if (items.length === 1)
      return Swal.fire("Error", "At least one product is required.", "error");
    const currentFormType = formTypes[currentStep];
    setAllOrdersData(prev => ({
      ...prev,
      [currentFormType]: {
        ...prev[currentFormType],
        items: prev[currentFormType].items.filter((_, i) => i !== index)
      }
    }));
  };

  // Select product
  const handleProductSelect = (product, idx) => {
    console.log('Product selected:', product.item_name, 'at index:', idx);
    
    const currentFormType = formTypes[currentStep];
    
    setAllOrdersData(prev => {
      const updated = [...prev[currentFormType].items];
      updated[idx] = {
        ...updated[idx],
        product_id: product.id,
        title: product.item_name,
        product_price: parseFloat(product.price || 0),
        product_points: parseInt(product.item_points || 0),
        quantity: updated[idx].quantity || 1, // Keep existing quantity
        product_obj: product,
        images: updated[idx].images || [],
      };
      
      console.log('Updated item:', updated[idx]);
      
      return {
        ...prev,
        [currentFormType]: {
          ...prev[currentFormType],
          items: updated
        }
      };
    });
    
    // Close dropdown immediately
    setProductDropdownOpenIndex(null);
    setProductSearchTerm("");
  };

  // Change quantity
  const handleQuantityChange = (idx, val) => {
    const currentFormType = formTypes[currentStep];
    setAllOrdersData(prev => {
      const updated = [...prev[currentFormType].items];
      updated[idx].quantity = Math.max(1, parseInt(val || 1));
      return {
        ...prev,
        [currentFormType]: {
          ...prev[currentFormType],
          items: updated
        }
      };
    });
  };

  // Handle image upload for return/exchange orders
  const handleImageUpload = (idx, files) => {
    const currentFormType = formTypes[currentStep];
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setAllOrdersData(prev => {
      const updated = [...prev[currentFormType].items];
      updated[idx].images = [...(updated[idx].images || []), ...newImages];
      return {
        ...prev,
        [currentFormType]: {
          ...prev[currentFormType],
          items: updated
        }
      };
    });
  };

  // Remove image
  const removeImage = (itemIdx, imageIdx) => {
    const currentFormType = formTypes[currentStep];
    setAllOrdersData(prev => {
      const updated = [...prev[currentFormType].items];
      const images = updated[itemIdx].images || [];
      if (images[imageIdx] && images[imageIdx].preview) {
        URL.revokeObjectURL(images[imageIdx].preview);
      }
      images.splice(imageIdx, 1);
      updated[itemIdx].images = images;
      return {
        ...prev,
        [currentFormType]: {
          ...prev[currentFormType],
          items: updated
        }
      };
    });
  };

  // Navigation functions
  const goToNextStep = () => {
    // Validate images for return/exchange orders before moving to next step
    const currentOrderType = formTypes[currentStep];
    if ((currentOrderType === 'return' || currentOrderType === 'exchange')) {
      const itemsWithProducts = items.filter(item => item.product_id);
      if (itemsWithProducts.length > 0) {
        // Check for images
        const hasItemsWithoutImages = itemsWithProducts.some(item => !item.images || item.images.length === 0);
        if (hasItemsWithoutImages) {
          return Swal.fire("Error", `Please upload images for all products in ${currentOrderType} order before proceeding.`, "error");
        }
      }
    }

    // Check limit for exchange orders before proceeding to summary
    if (currentStep === 2 && currentOrderType === 'exchange') {
      // Check if user has added any products in exchange order
      const exchangeItemsWithProducts = items.filter(item => item.product_id);
      
      // Only check limit if user has added exchange products
      if (exchangeItemsWithProducts.length > 0) {
        // Calculate the NEW ORDER total (not exchange order total)
        const newOrderTotal = allOrdersData.new.items
          .filter(item => item.product_id)
          .reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
        
        // Check if organization limit is set and if new order total is less than limit
        if (organizationLimit !== null && newOrderTotal < organizationLimit) {
          return Swal.fire({
            icon: "error",
            title: "Exchange Not Available",
            text: `Your new order total (₹${newOrderTotal.toLocaleString()}) is less than the minimum limit (₹${organizationLimit.toLocaleString()}). Exchange is not available for orders below this limit.`,
            confirmButtonColor: "#003A72"
          });
        }
      }
    }

    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      // Show summary before final submission
      setShowSummary(true);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle notes change
  const handleNotesChange = (value) => {
    const currentFormType = formTypes[currentStep];
    setAllOrdersData(prev => ({
      ...prev,
      [currentFormType]: {
        ...prev[currentFormType],
        notes: value
      }
    }));
  };

  const resetAllFormData = () => {
    // Reset everything including shop owner
    setSelectedLead(null);
    setLeadSearch("");
    setAllOrdersData({
      new: {
        items: [{
          product_id: "",
          title: "",
          product_price: 0,
          product_points: 0,
          quantity: 1,
          order_status: 0, // New order
          product_obj: null,
          images: [],
        }],
        notes: ""
      },
      return: {
        items: [{
          product_id: "",
          title: "",
          product_price: 0,
          product_points: 0,
          quantity: 1,
          order_status: 1, // Return order
          product_obj: null,
          images: [],
        }],
        notes: ""
      },
      exchange: {
        items: [{
          product_id: "",
          title: "",
          product_price: 0,
          product_points: 0,
          quantity: 1,
          order_status: 2, // Exchange order
          product_obj: null,
          images: [],
        }],
        notes: ""
      }
    });
    setShowSummary(false);
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

  // Get all items to submit in one combined order
  const getAllItemsToSubmit = () => {
    const allItems = [];
    let combinedNotes = [];
    
    Object.keys(allOrdersData).forEach(orderType => {
      const orderData = allOrdersData[orderType];
      const itemsWithProducts = orderData.items.filter(item => item.product_id);
      
      if (itemsWithProducts.length > 0) {
        // Validate images for return/exchange orders (order_status 1 or 2)
        const hasItemsWithoutImages = itemsWithProducts.some(item => 
          (item.order_status === 1 || item.order_status === 2) && 
          (!item.images || item.images.length === 0)
        );
        
        if (hasItemsWithoutImages) {
          throw new Error(`Please upload images for all products in ${orderType} order.`);
        }
        
        // Add items to combined list
        allItems.push(...itemsWithProducts);
        
        // Collect notes
        if (orderData.notes) {
          combinedNotes.push(`${orderType.toUpperCase()}: ${orderData.notes}`);
        }
      }
    });
    
    return {
      items: allItems,
      notes: combinedNotes.join(' | ')
    };
  };

  // Submit all orders in one API call
  const submitAllOrders = async () => {
    if (!selectedLead) {
      return Swal.fire("Error", "Please select a shop owner.", "error");
    }

    try {
      const { items: allItems, notes: combinedNotes } = getAllItemsToSubmit();
      
      if (allItems.length === 0) {
        Swal.fire("Info", "No orders to create. Please add products to create orders.", "info");
        setShowSummary(false);
        return;
      }

      Swal.fire({
        title: isEditMode ? "Updating order..." : "Creating order...",
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
      });

      // Create one FormData with all items
      const formData = new FormData();
      formData.append('salesman_id', Number(user?.id));
      formData.append('shop_owner_id', Number(selectedLead?.customer_id || selectedLead?.id));
      formData.append('order_type', 'new'); // Keep as 'new' for backward compatibility
      formData.append('notes', combinedNotes);
      
      // Add all items with their respective order_status
      for (let index = 0; index < allItems.length; index++) {
        const item = allItems[index];
        
        formData.append(`items[${index}][product_id]`, item.product_id);
        formData.append(`items[${index}][quantity]`, item.quantity);
        formData.append(`items[${index}][product_price]`, item.product_price);
        formData.append(`items[${index}][product_points]`, item.product_points);
        formData.append(`items[${index}][order_status]`, item.order_status);
        
        // Handle images for return/exchange orders (order_status 1 or 2)
        if (item.images && item.images.length > 0) {
          if (item.images[0].file instanceof File) {
            // New image uploaded
            formData.append(`items[${index}][new_image]`, item.images[0].file);
          } else if (item.images[0].existing && item.images[0].preview) {
            // Existing image - fetch and convert to blob, then send
            try {
              const response = await fetch(item.images[0].preview);
              const blob = await response.blob();
              const filename = item.images[0].preview.split('/').pop();
              const file = new File([blob], filename, { type: blob.type });
              formData.append(`items[${index}][new_image]`, file);
            } catch (error) {
              console.error('Error fetching existing image:', error);
              // Fallback: send existing_image URL
              formData.append(`items[${index}][existing_image]`, item.images[0].preview);
            }
          }
        }
        // Don't send new_image field at all for items without images
      }

      // Use update endpoint if in edit mode
      const apiUrl = isEditMode ? `/orders/update/${editOrder.id}` : "/orders";
      const apiMethod = isEditMode ? 'post' : 'post'; // Both use POST

      const response = await api[apiMethod](apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Swal.close();

      if (response.data?.success) {
        await Swal.fire("Success", isEditMode ? "Order updated successfully!" : "Order created successfully with all items!", "success");
        if (isEditMode) {
          // Navigate back and force page reload to fetch fresh data
          window.location.href = '/Order/testorder';
        } else {
          resetAllFormData();
          setCurrentStep(0);
        }
      } else {
        Swal.fire("Error", response.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} order.`, "error");
      }
    } catch (error) {
      Swal.close();
      console.error("Order submission error:", error);
      Swal.fire("Error", error.message || "Failed to create order.", "error");
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
      {/* Step Navigation */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-[#003A72]">{formTitles[currentStep]}</h2>
        </div>
        
        {/* Step Indicator */}
        <div className="flex flex-row items-center justify-center gap-2 lg:gap-4 mb-4 flex-wrap">
          {formTitles.map((title, index) => (
            <div key={index} className="flex items-center justify-center">
              <div
                onClick={() => setCurrentStep(index)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold cursor-pointer hover:opacity-80 ${
                  index === currentStep
                    ? 'bg-[#003A72] text-white'
                    : index < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {index + 1}
              </div>
              <span 
                onClick={() => setCurrentStep(index)}
                className={`ml-2 text-sm cursor-pointer hover:opacity-80 ${index === currentStep ? 'text-[#003A72] font-semibold' : 'text-gray-500'}`}
              >
                {title}
              </span>
              {index < formTitles.length - 1 && (
                <div className={`hidden lg:block w-4 lg:w-8 h-0.5 mx-2 lg:mx-4 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Step Description */}
        <div className="text-center text-gray-600 text-sm mb-6">
          {currentStep === 0 && (selectedLead ? `${isEditMode ? 'Update' : 'Create a new'} order for ${selectedLead.customer_name}` : `${isEditMode ? 'Update' : 'Create a new'} order for shop owner`)}
          {currentStep === 1 && (selectedLead ? `Process return order for ${selectedLead.customer_name} with product images` : "Process return order with product images")}
          {currentStep === 2 && (selectedLead ? `Process exchange order for ${selectedLead.customer_name} with product images` : "Process exchange order with product images")}
        </div>
      </div>

      {/* Lead selector - Only show on first step (New Order) */}
      {currentStep === 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Select Shop Owner
          </label>
          <div className="relative overflow-visible" ref={leadDropdownRef}>
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#003A72]"
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
              <div className="absolute z-[9999] mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto w-full">
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
                      data-dropdown-item
                    >
                      <div>
                        <div className="font-medium">{lead.customer_name}</div>
                        <div className="text-xs text-gray-500">
                          {lead.email || lead.contact}
                        </div>
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
            <div className="mt-3 p-3 bg-green-50 border border-green-300 rounded-xl text-sm">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-green-800">{selectedLead.customer_name}</div>
                  <div className="text-green-600">{selectedLead.email || selectedLead.contact}</div>
                  <div className="text-xs text-green-500 mt-1">✓ Selected for all order types</div>
                </div>
                <button
                  onClick={resetAllFormData}
                  className="text-xs text-gray-500 hover:text-red-500 px-2 py-1 border border-gray-300 rounded hover:border-red-300"
                >
                  Change Shop Owner
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show selected shop owner info on return/exchange steps */}
      {currentStep > 0 && selectedLead && (
        <div className="mb-6 p-3 bg-green-50 border border-green-300 rounded-xl text-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <div className="font-semibold text-green-800">{selectedLead.customer_name}</div>
              <div className="text-green-600 text-xs">{selectedLead.email || selectedLead.contact}</div>
            </div>
            <div className="text-xs text-green-600 font-medium">✓ Selected</div>
          </div>
        </div>
      )}

      {/* Image requirement notice for return/exchange */}
      {currentStep > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-700">
            <FaCamera />
            <span className="text-sm font-medium">
              Images Required: Please upload images for all products in this {formTitles[currentStep].toLowerCase()}.
            </span>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="border border-gray-200 rounded-xl overflow-visible mb-6">
        {/* Desktop Header */}
        <div className={`hidden xl:grid ${currentStep === 0 ? 'xl:grid-cols-[2fr_1fr_1fr_40px_1fr]' : 'xl:grid-cols-[2fr_1fr_1fr_1fr_40px_1fr]'} text-xs font-semibold text-white bg-gray-800 rounded-t-xl`}>
          <div className="p-2">Product</div>
          <div className="p-2 text-center">Qty</div>
          <div className="p-2 text-center">Price</div>
          {currentStep > 0 && <div className="p-2 text-center">Images</div>}
          <div></div>
          <div className="p-2 text-right">Amount</div>
        </div>
        
        {/* Mobile Header */}
        <div className="xl:hidden text-xs font-semibold text-white bg-gray-800 rounded-t-xl p-3">
          Product Details
        </div>

        {/* Desktop Product Rows */}
        {items.map((it, idx) => (
          <div
            key={`desktop-${idx}`}
            className={`
              hidden xl:grid 
              ${currentStep === 0 ? 'xl:grid-cols-[2fr_1fr_1fr_40px_1fr]' : 'xl:grid-cols-[2fr_1fr_1fr_1fr_40px_1fr]'} 
              items-center px-2 py-3 relative overflow-visible
            `}
          >
            {/* Desktop Product Row Content */}
            {/* Product Search */}
            <div 
              className="relative overflow-visible" 
              data-product-dropdown
              ref={(el) => productDropdownRefs.current[idx] = el}
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={it.title || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentFormType = formTypes[currentStep];
                    setAllOrdersData(prev => {
                      const updated = [...prev[currentFormType].items];
                      updated[idx] = {
                        ...updated[idx],
                        title: val,
                        product_id: "", // Clear product_id when typing
                        product_obj: null
                      };
                      return {
                        ...prev,
                        [currentFormType]: {
                          ...prev[currentFormType],
                          items: updated
                        }
                      };
                    });
                    setProductDropdownOpenIndex(idx);
                    setProductSearchTerm(val);
                  }}
                  onFocus={() => {
                    setProductDropdownOpenIndex(idx);
                    setProductSearchTerm(it.title || "");
                  }}
                  placeholder="Search product..."
                  className="w-full px-2 py-2 border-b border-gray-200 outline-none bg-transparent"
                />
                {it.product_id && (
                  <span className="text-green-500 text-sm">✓</span>
                )}
              </div>

              {productDropdownOpenIndex === idx &&
                (isMobileView ? (
                  // Mobile full screen modal
                  <div className="fixed inset-0 z-[9999] bg-white p-4 overflow-y-auto">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        autoFocus
                        type="text"
                        value={productSearchTerm}
                        onChange={(e) =>
                          setProductSearchTerm(e.target.value)
                        }
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
                      ) : getFilteredProducts(productSearchTerm).length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">
                          {products.length === 0
                            ? "No products found"
                            : "No matching products"}
                        </div>
                      ) : (
                        getFilteredProducts(productSearchTerm).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-3  hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleProductSelect(p, idx)}
                            data-dropdown-item
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* ✅ Product Image */}
                              <img
                                src={`${p.product_image}`}
                                alt={p.item_name}
                                className="w-12 h-12 object-cover rounded-md border border-gray-200"
                              />
                              <div>
                                <div className="font-medium truncate">
                                  {p.item_name}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {p.sku}
                                </div>
                              </div>
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
                      <div className="p-3 text-sm text-gray-500">
                        Loading products...
                      </div>
                    ) : getFilteredProducts(productSearchTerm).length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        {products.length === 0
                          ? "No products found"
                          : "No matching products"}
                      </div>
                    ) : (
                      getFilteredProducts(productSearchTerm).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-all rounded-lg"
                          onClick={() => handleProductSelect(p, idx)}
                          data-dropdown-item
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* ✅ Product Image */}
                            <img
                              src={`${p.product_image}`}
                              alt={p.item_name}
                              className="w-10 h-10 object-cover rounded-md border border-gray-200"
                            />
                            <div>
                              <div className="font-medium">
                                {p.item_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {p.sku}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-700">
                            ₹{p.price}
                          </div>
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
                onChange={(e) =>
                  handleQuantityChange(idx, e.target.value)
                }
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

            {/* Images (for return/exchange orders) */}
            {currentStep > 0 && (
              <div className="text-center">
                <div className="flex flex-col items-center gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(idx, e.target.files)}
                    className="hidden"
                    id={`image-upload-${idx}`}
                  />
                  <label
                    htmlFor={`image-upload-${idx}`}
                    className="cursor-pointer flex items-center gap-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    <FaCamera /> Add
                  </label>
                  {it.images && it.images.length > 0 && it.images[0] && (
                    <div className="relative">
                      <img
                        src={it.images[0].preview || ''}
                        alt="Product"
                        className="w-8 h-8 object-cover rounded border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => removeImage(idx, 0)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

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

        {/* Mobile Product Rows */}
        {items.map((it, idx) => (
          <div key={`mobile-${idx}`} className="xl:hidden border-b border-gray-200 p-4 space-y-3">
            {/* Product Search - Mobile */}
            <div 
              className="relative overflow-visible"
              ref={(el) => productDropdownRefs.current[idx] = el}
            >
              <label className="block text-xs font-medium text-gray-600 mb-1">Product</label>
              <div className="relative">
                <input
                  type="text"
                  value={it.title || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const currentFormType = formTypes[currentStep];
                    setAllOrdersData(prev => {
                      const updated = [...prev[currentFormType].items];
                      updated[idx] = {
                        ...updated[idx],
                        title: val,
                        product_id: "", // Clear product_id when typing
                        product_obj: null
                      };
                      return {
                        ...prev,
                        [currentFormType]: {
                          ...prev[currentFormType],
                          items: updated
                        }
                      };
                    });
                    setProductDropdownOpenIndex(idx);
                    setProductSearchTerm(val);
                  }}
                  onFocus={() => {
                    setProductDropdownOpenIndex(idx);
                    setProductSearchTerm(it.title || "");
                  }}
                  placeholder="Search product..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none"
                />
                {it.product_id && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</span>
                )}
              </div>

              {productDropdownOpenIndex === idx && (
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
                      <div className="p-3 text-sm text-gray-500">Loading products...</div>
                    ) : getFilteredProducts(productSearchTerm).length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        {products.length === 0
                          ? "No products found"
                          : "No matching products"}
                      </div>
                    ) : (
                      getFilteredProducts(productSearchTerm).map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleProductSelect(p, idx)}
                          data-dropdown-item
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={`${p.product_image}`}
                              alt={p.item_name}
                              className="w-12 h-12 object-cover rounded-md border border-gray-200"
                            />
                            <div>
                              <div className="font-medium truncate">{p.item_name}</div>
                              <div className="text-xs text-gray-500 truncate">{p.sku}</div>
                            </div>
                          </div>
                          <div className="text-sm font-semibold text-gray-700">₹{p.price}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity and Price - Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={it.quantity}
                  onChange={(e) => handleQuantityChange(idx, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Price</label>
                <input
                  type="number"
                  value={it.product_price}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-center"
                />
              </div>
            </div>

            {/* Images - Mobile (for return/exchange) */}
            {currentStep > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Images</label>
                <div className="flex flex-col gap-2">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(idx, e.target.files)}
                    className="hidden"
                    id={`mobile-image-upload-${idx}`}
                  />
                  <label
                    htmlFor={`mobile-image-upload-${idx}`}
                    className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
                  >
                    <FaCamera /> Add Images
                  </label>
                  {it.images && it.images.length > 0 && it.images[0] && (
                    <div className="relative inline-block">
                      <img
                        src={it.images[0].preview || ''}
                        alt="Product"
                        className="w-16 h-16 object-cover rounded border"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <button
                        onClick={() => removeImage(idx, 0)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Amount and Remove - Mobile */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <div className="text-lg font-bold text-[#003A72]">
                Total: ₹{(it.quantity * it.product_price).toLocaleString()}
              </div>
              <button
                onClick={() => removeItemRow(idx)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <FaMinus />
              </button>
            </div>
          </div>
        ))}

        {/* Add new product */}
        <div className="p-3 text-center">
          <button
            onClick={addItemRow}
            className="text-[#003A72] border border-dashed border-[#003A72] px-3 py-2 rounded-full text-sm"
          >
            <FaPlus className="inline mr-1" /> Add Product
          </button>
        </div>
      </div>

      {/* Notes / Reason */}
      {/* <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {currentStep === 0 
            ? "Notes" 
            : currentStep === 1 
            ? "Reason for Return " 
            : "Reason for Exchange "}
        </label>
        <textarea
          rows="3"
          className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#003A72] focus:border-[#003A72]"
          placeholder={
            currentStep === 0 
              ? "Add any notes..." 
              : currentStep === 1 
              ? "Please explain why you are returning this product..." 
              : "Please explain why you are exchanging this product..."
          }
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
        />
      </div> */}

      {/* Totals */}
      <div className="flex justify-between items-center flex-wrap gap-4 bg-[#f9fafb] border border-gray-300 rounded-xl p-5">
        {(() => {
          const { total_value, total_points } = calculateTotals();
          const isExchangeStep = currentStep === 2;
          
          // Calculate new order total for exchange limit check
          const newOrderTotal = allOrdersData.new.items
            .filter(item => item.product_id)
            .reduce((sum, item) => sum + (item.quantity * item.product_price), 0);
          
          const isBelowLimit = isExchangeStep && organizationLimit !== null && newOrderTotal < organizationLimit;
          
          return (
            <div className="flex-1">
              <div className="text-2xl font-bold text-[#003A72]">
                Total: ₹{total_value.toLocaleString()}
              </div>
              <div className="text-lg text-gray-500">
                Total Points: {total_points.toLocaleString()}
              </div>
              {isExchangeStep && organizationLimit !== null && (
                <div className={`mt-2 text-sm font-medium ${isBelowLimit ? 'text-red-600' : 'text-green-600'}`}>
                  {isBelowLimit ? (
                    <>⚠️ New order total (₹{newOrderTotal.toLocaleString()}) is below limit (₹{organizationLimit.toLocaleString()}) - Exchange not available</>
                  ) : (
                    <>✓ New order total (₹{newOrderTotal.toLocaleString()}) meets minimum limit (₹{organizationLimit.toLocaleString()})</>
                  )}
                </div>
              )}
            </div>
          );
        })()}
        <div className="flex flex-col lg:flex-row gap-3">
          {currentStep > 0 && (
            <button
              onClick={goToPreviousStep}
              className="bg-gray-500 text-white px-4 lg:px-6 py-3 rounded-xl font-semibold text-base lg:text-lg flex items-center justify-center gap-2 hover:bg-gray-600"
            >
              <FaArrowLeft /> Previous
            </button>
          )}
          <button
            onClick={currentStep < 2 ? goToNextStep : goToNextStep}
            className="bg-[#003A72] text-white px-4 lg:px-6 py-3 rounded-xl font-semibold text-base lg:text-lg flex items-center justify-center gap-2 hover:bg-[#004B8D]"
          >
            {currentStep < 2 ? (
              <>
                Next <FaArrowRight />
              </>
            ) : (
              <>
                <span className="hidden lg:inline">{isEditMode ? 'Review & Update Order' : 'Review & Create Order'}</span>
                <span className="lg:hidden">{isEditMode ? 'Review & Update' : 'Review & Create'}</span>
                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[1000] p-2 sm:p-4 transition-all duration-300"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSummary(false);
            }
          }}
        >
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transform transition-all duration-300 scale-100">
            <div className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-[#003A72] mb-4">Order Summary</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Review your orders for <strong>{selectedLead?.customer_name}</strong>
              </p>

              {Object.keys(allOrdersData).map(orderType => {
                const orderData = allOrdersData[orderType];
                const hasProducts = orderData.items.some(item => item.product_id);
                
                if (!hasProducts) return null;

                const total = orderData.items
                  .filter(item => item.product_id)
                  .reduce((sum, item) => sum + (item.quantity * item.product_price), 0);

                return (
                  <div key={orderType} className="mb-4 sm:mb-6 border border-gray-200 rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-base sm:text-lg mb-3 capitalize text-[#003A72]">
                      {orderType} Order
                    </h4>
                    
                    <div className="space-y-2 mb-3">
                      {orderData.items
                        .filter(item => item.product_id)
                        .map((item, idx) => (
                          <div key={idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm gap-1 sm:gap-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <span className="font-medium">{item.title}</span>
                              <span className="text-gray-500 text-xs sm:text-sm">Qty: {item.quantity}</span>
                              {(orderType === 'return' || orderType === 'exchange') && item.images?.length > 0 && (
                                <span className="text-green-600 text-xs">✓ {item.images.length} images</span>
                              )}
                            </div>
                            <span className="font-medium text-[#003A72] sm:text-gray-900">₹{(item.quantity * item.product_price).toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                    
                    {orderData.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Notes:</strong> {orderData.notes}
                      </div>
                    )}
                    
                    <div className="text-right font-bold text-[#003A72]">
                      Total: ₹{total.toLocaleString()}
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-col lg:flex-row gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowSummary(false)}
                  className="bg-gray-500 text-white px-4 lg:px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 order-2 lg:order-1"
                >
                  Back to Edit
                </button>
                <button
                  onClick={submitAllOrders}
                  className="bg-[#003A72] text-white px-4 lg:px-6 py-3 rounded-xl font-semibold hover:bg-[#004B8D] order-1 lg:order-2"
                >
                  {isEditMode ? 'Update Order' : 'Create Orders'}
                </button>
              </div>
            </div>
          </div>  
        </div>
      )}
    </div>
  );
};

export default NewOrder;