  import React, { useState, useEffect, useRef } from "react";
  import Swal from "sweetalert2";
  import api from "../../api";
  import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    PDFDownloadLink,
    Image,
    Svg,
    Path,
  } from "@react-pdf/renderer";

  import { useAuth } from "../../auth/AuthContext";
  import { SidebarContext } from "../../components/Layout";
  import dummyAvatar from "/Avatar2.png";
  // import SimpleEditor from '../../components/TinyTapEditor';
  import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
  import { FaPlus, FaMinus, FaTimes } from "react-icons/fa";
  import { useLocation } from "react-router-dom"; // Import useLocation
  import { useState as useLocalState } from "react";

  const styles = StyleSheet.create({
    page: {
      flexDirection: "column",
      backgroundColor: "#ffffff",
      padding: 23,
      minHeight: "100vh",
      borderRadius: 16,
    },
    headerSection: {
      flexDirection: "row",
      marginBottom: 24,
      alignItems: "flex-start",
    },
    headerContentLeft: {
      flexDirection: "column",
      alignItems: "flex-start",
      flexGrow: 2,
    },
    organizationNameContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    organizationNameText: {
      fontSize: 18,
      fontWeight: "bold",
      color: "#0e4053",
      marginLeft: 8,
    },
    officeAddressContainer: {
      flexDirection: "column",
      alignItems: "flex-start",
      flexGrow: 1,
    },
    officeAddressText: {
      fontSize: 12,
      color: "#1F2937",
      marginBottom: 2,
    },
    pdfIconMobile: {
      width: 0,
      height: 0,
      position: "absolute",
    },
    profileImageContainer: {
      width: 86,
      height: 86,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: "#0e4053",
      marginBottom: 0,
      marginRight: 16,
      overflow: "hidden",
    },
    contactInfoContainer: {
      flexDirection: "column",
      alignItems: "flex-start",
      marginLeft: 0,
      flexGrow: 1,
    },
    contactItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    contactIcon: {
      width: 18,
      height: 18,
      marginRight: 5,
      color: "#0e4053",
    },
    contactText: {
      fontSize: 12,
      color: "#1F2937",
    },
    quotationTitleContainer: {
      flexGrow: 1,
      textAlign: "right",
      alignSelf: "flex-start",
    },
    quotationTitleText: {
      color: "#0e4053",
      fontSize: 32,
      fontWeight: "bold",
    },
    section: {
      marginBottom: 24,
    },
    customerInfoSection: {
      flexDirection: "column",
      marginBottom: 32,
    },
    displayFieldContainer: {
      width: "100%",
      height: 33,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7EFF8",
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    displayFieldText: {
      fontSize: 12,
      color: "#545454",
    },
    customerNameDisplay: {
      fontSize: 12,
      color: "#0e4053",
      fontWeight: "semibold",
    },
    addressBlock: {
      width: "100%",
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7EFF8",
      flexDirection: "column",
      overflow: "hidden",
      marginBottom: 16,
    },
    addressLine: {
      width: "100%",
      paddingHorizontal: 12,
      paddingVertical: 4,
      flexDirection: "row",
      alignItems: "center",
      color: "#545454",
      fontSize: 12,
    },
    addressLineBorder: {
      borderBottomWidth: 1,
      borderColor: "#E7EFF8",
    },
    phoneEmailContainer: {
      flexDirection: "row",
      gap: 8,
      justifyContent: "flex-start",
    },
    phoneEmailField: {
      flex: 1,
      height: 33,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#E7EFF8",
      backgroundColor: "#FFFFFF",
      flexDirection: "row",
      alignItems: "center",
      fontSize: 12,
      color: "#545454",
    },
    phoneEmailIcon: {
      width: 18,
      height: 18,
      marginRight: 5,
      color: "#727A90",
    },
    tableHeadersContainer: {
      flexDirection: "row",
      marginBottom: 4,
    },
    tableHeaderCell: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#8B8B8B",
      padding: 4,
    },
    tableColHeaderSrNo: {
      width: "7.4%",
      textAlign: "left",
    },
    tableColHeaderService: {
      width: "55.5%",
      textAlign: "left",
    },
    tableColHeaderQuantity: {
      width: "18.5%",
      textAlign: "right",
      whiteSpace: "nowrap",
    },
    tableColHeaderTotalPrice: {
      width: "18.5%",
      textAlign: "right",
      whiteSpace: "nowrap",
    },
    divider: {
      width: "100%",
      height: 1,
      backgroundColor: "#E5E7EB",
      marginVertical: 16,
    },
    tableRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 10,
    },
    tableCell: {
      fontSize: 12,
      color: "#545454",
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#E7EFF8",
      flexDirection: "row",
      height: 33,
    },
    tableCellSrNo: {
      width: "7.4%",
      textAlign: "left",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    tableCellService: {
      width: "55.5%",
      textAlign: "left",
      wordWrap: "break-word",
      justifyContent: "flex-start",
      alignItems: "center",
    },
    tableCellQuantity: {
      width: "18.5%",
      textAlign: "right",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    tableCellTotalPrice: {
      width: "18.5%",
      textAlign: "right",
      justifyContent: "flex-end",
      alignItems: "center",
    },
    totalSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      alignItems: "center",
      marginBottom: 128,
      marginTop: "auto",
    },
    totalLabel: {
      color: "#0e4053",
      fontSize: 15,
      fontWeight: "bold",
      marginRight: 168,
    },
    totalValue: {
      color: "#0e4053",
      fontSize: 15,
      fontWeight: "bold",
    },
    footerButtonsContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
    },
    buttonGroup: {
      flexDirection: "row",
      gap: 8,
    },
    button: {
      width: 100,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      fontSize: 12,
      fontWeight: "semibold",
    },
    editModeButton: {
      borderColor: "#0e4053",
      borderWidth: 1,
      color: "#0e4053",
    },
    saveSubmitButton: {
      backgroundColor: "#0e4053",
      color: "#FFFFFF",
    },
    heading: {
      fontSize: 16,
      marginBottom: 10,
      color: "#4B5563",
      fontWeight: "bold",
    },
    text: {
      fontSize: 12,
      marginBottom: 5,
      color: "#545454",
    },
  });

  const QuotationCreate = () => {
    const [organisationInfo, setOrganisationInfo] = useState(null);
    const location = useLocation(); // Initialize useLocation
    const { quotation: editQuotation, lead_id: stateLeadId } =
      location.state || {}; // Get quotation data from navigation state

    const pdfDownloadLinkRef = useRef(null); // Ref for hidden PDFDownloadLink

    useEffect(() => {
      // Step 1: Fetch organisation info and set it
      const fetchOrganisationInfo = async () => {
        try {
          const response = await api.get("/orglist");
          // Pick the first org (or change logic as needed)
          const orgs = response.data.result;
          const firstOrg = orgs[Object.keys(orgs)[0]];
          setOrganisationInfo(firstOrg);
        } catch (error) {
          console.error("Error fetching organisation info:", error);
        }
      };
      fetchOrganisationInfo();

      // Step 2: If editing, pre-populate form with existing quotation data
      if (editQuotation) {
        setIsEditMode(true);

        // Set formData
        setFormData({
          userName: editQuotation.client_name || "",
          organizationAddress: {
            blockUnitStreetName: editQuotation.client_address || "", // Assuming client_address might contain this
            cityState: "", // Not directly available in quotation, keep as is or try to parse
            country: "", // Not directly available
          },
          customerPhone: editQuotation.client_contact_number || "", // Assuming this exists
          customerEmail: editQuotation.client_email || "", // Assuming this exists
        });

        // Set serviceItems (assuming items in quotation map to serviceItems)
        setServiceItems(
          editQuotation.items && editQuotation.items.length > 0
            ? editQuotation.items.map((item) => ({
                serviceName: item.item_name || "",
                quantity: item.qty || 1,
                totalItemPrice: parseFloat(item.amount) || 0,
                item_id: item.item_id || "", // Use existing item_id if present
              }))
            : [{ serviceName: "", quantity: 1, totalItemPrice: 0 }]
        );
        setOriginalServiceItems(
    editQuotation.items && editQuotation.items.length > 0
      ? editQuotation.items.map((item) => ({
          serviceName: item.item_name || "",
          quantity: item.qty || 1,
          price: parseFloat(item.points) || 0,
          item_id: 2 || "", // Use existing item_id if present
        }))
      : [{ serviceName: "", quantity: 1,  points: 0 }]
  );


        // Set quotationDetails
        setQuotationDetails((prev) => ({
          ...prev,
          quoteNumber: editQuotation.quote_no || prev.quoteNumber,
          quoteDate: editQuotation.date || prev.quoteDate,
          validUntil: editQuotation.valid_until || prev.validUntil,
          customerName: editQuotation.client_name || prev.customerName,
          customerAddressLine1:
            editQuotation.client_address || prev.customerAddressLine1, // Need to parse if complex
          customerAddressLine2: "", // Needs parsing or separate field in backend
          customerAddressLine3: "", // Needs parsing or separate field in backend
          dearSirMessage: editQuotation.introduction || prev.dearSirMessage,
          projectType: editQuotation.project_type || prev.projectType,
          plotSize: editQuotation.plot_size || prev.plotSize,
          packageType: editQuotation.package_type || prev.packageType,
          accountName:
            editQuotation.payment_info?.account_name || prev.accountName,
          bankName: editQuotation.payment_info?.bank_name || prev.bankName,
          accountNumber:
            editQuotation.payment_info?.account_number || prev.accountNumber,
          ifscCode: editQuotation.payment_info?.ifsc_code || prev.ifscCode,
          gstin: editQuotation.payment_info?.gstin || prev.gstin,
          branch: editQuotation.payment_info?.branch || prev.branch,
        }));

        // Set servicesIncluded
        setServicesIncluded(
          editQuotation.services && editQuotation.services.length > 0
            ? editQuotation.services.map((service, index) => ({
                id: (index + 1).toString(),
                title: service.title || "",
                mainDescription: service.description || "",
                bulletPoints: parseBulletpoints(service.bulletpoints), // Use helper here
              }))
            : [
                {
                  id: "1",
                  title: "Floor Plan Design",
                  mainDescription: "",
                  bulletPoints: [],
                },
              ] // Default if no services
        );

        // Set budgetItems
        setBudgetItems(
          editQuotation.items && editQuotation.items.length > 0
            ? editQuotation.items.map((item) => ({
                description: item.item_name || "",
                qty: item.qty || 1,
                rate: parseFloat(item.rate) || 0,
                item_id: item.item_id || "",
              }))
            : [
                {
                  description: "Concept of Design & Prototype",
                  qty: 1,
                  rate: 4000,
                },
              ]
        );

        // Set deliveryTerms and scopeModifications
        setDeliveryTerms(
          editQuotation.conditions?.delivery_terms
            ?.split("\n")
            .filter(Boolean) || [
            "Drawing delivery time is subject to timely comments from client and payments as per agreed terms",
          ]
        );
        setScopeModifications(
          editQuotation.conditions?.scope_conditions
            ?.split("\n")
            .filter(Boolean) || [
            "If requirements change from initially provided specifications (plot size, number of floors, dimensions, direction etc.), additional charges will apply",
          ]
        );

        // Set original states for exit edit mode
        setOriginalFormData({
          userName: editQuotation.client_name || "",
          organizationAddress: {
            blockUnitStreetName: editQuotation.client_address || "",
            cityState: "",
            country: "",
          },
          customerPhone: editQuotation.client_contact_number || "",
          customerEmail: editQuotation.client_email || "",
        });
        setOriginalServiceItems(
          editQuotation.items && editQuotation.items.length > 0
            ? editQuotation.items.map((item) => ({
                serviceName: item.item_name || "",
                quantity: item.qty || 1,
                totalItemPrice: parseFloat(item.amount) || 0,
              }))
            : [{ serviceName: "", quantity: 1, totalItemPrice: 0 }]
        );
        
        setOriginalQuotationDetails((prev) => ({
          ...prev,
          quoteNumber: editQuotation.quote_no || prev.quoteNumber,
          quoteDate: editQuotation.date || prev.quoteDate,
          validUntil: editQuotation.valid_until || prev.validUntil,
          customerName: editQuotation.client_name || prev.customerName,
          customerAddressLine1:
            editQuotation.client_address || prev.customerAddressLine1,
          dearSirMessage: editQuotation.introduction || prev.dearSirMessage,
          projectType: editQuotation.project_type || prev.projectType,
          plotSize: editQuotation.plot_size || prev.plotSize,
          packageType: editQuotation.package_type || prev.packageType,
          accountName:
            editQuotation.payment_info?.account_name || prev.accountName,
          bankName: editQuotation.payment_info?.bank_name || prev.bankName,
          accountNumber:
            editQuotation.payment_info?.account_number || prev.accountNumber,
          ifscCode: editQuotation.payment_info?.ifsc_code || prev.ifscCode,
          gstin: editQuotation.payment_info?.gstin || prev.gstin,
          branch: editQuotation.payment_info?.branch || prev.branch,
        }));
        setOriginalServicesIncluded(
          editQuotation.services && editQuotation.services.length > 0
            ? editQuotation.services.map((service, index) => ({
                id: (index + 1).toString(),
                title: service.title || "",
                mainDescription: service.description || "",
                bulletPoints: parseBulletpoints(service.bulletpoints), // Use helper here
              }))
            : [
                {
                  id: "1",
                  title: "Floor Plan Design",
                  mainDescription: "",
                  bulletPoints: [],
                },
              ]
        );
      } else {
        // Not editing: fetch latest quotation number from API
        const fetchLatestQuotationNumber = async () => {
          try {
            const response = await api.get("/getquoteno");
            if (response.data.success && response.data.invoice_no) {
              setQuotationDetails((prev) => ({
                ...prev,
                quoteNumber: response.data.invoice_no,
              }));
            } else {
              // Fallback to random number if API fails
              setQuotationDetails((prev) => {
                if (!prev.quoteNumber) {
                  return {
                    ...prev,
                    quoteNumber: Math.floor(
                      10000 + Math.random() * 90000
                    ).toString(),
                  };
                }
                return prev;
              });
            }
          } catch (error) {
            console.error("Error fetching latest :", error);
            // Fallback to random number if API fails
            setQuotationDetails((prev) => {
              if (!prev.quoteNumber) {
                return {
                  ...prev,
                  quoteNumber: Math.floor(
                    10000 + Math.random() * 90000
                  ).toString(),
                };
              }
              return prev;
            });
          }
        };
        fetchLatestQuotationNumber();
      }
    }, [editQuotation]);

    const [isEditMode, setIsEditMode] = useState(true);
    const [formData, setFormData] = useState({
      userName: "",
      organizationAddress: {
        blockUnitStreetName: "",
        cityState: "",
        country: "",
      },
      customerPhone: "",
      customerEmail: "",
    });
    const [serviceItems, setServiceItems] = useState([
      {
        serviceName: "",
        quantity: 1,
        totalItemPrice: 0,
      },
    ]);

    const [quotationDetails, setQuotationDetails] = useState({
      quoteNumber: "",
      quoteDate: "June 23, 2025",
      validUntil: "July 23, 2025",
      customerName: "Mr. John Doe",
      customerAddressLine1: "123 Main Street",
      customerAddressLine2: "Near Landmark A",
      customerAddressLine3: "City, State",
      dearSirMessage: ``,
      projectType: "Complete Designing - G+1",
      plotSize: "1,065 sq ft",
      packageType: "shop owners",
      accountName: "JG POWERS",
      bankName: "AXIS BANK",
      accountNumber: "924020037304194",
      ifscCode: "UTIB0004446",
      gstin: "29AAACD1234E1Z5",
      branch: "SANCHAR NAGAR INDORE",
      from: "", // New field
      printName: "", // New field
      position: "", // New field
      signApprove: "", // New field
      acceptanceDate: "", // New field
    });

    const [servicesIncluded, setServicesIncluded] = useState([
      {
        id: "1",
        title: "Floor Plan Design",
        mainDescription:
          "Customized floor plans with furniture layout designed as per client's plot, requirements, and bylaws",
        bulletPoints: [
          "2D Floor Plan with accurate dimensions",
          "Vastu compliant design principles",
          "Basic furniture layout planning",
          "Door and window location mapping",
          "Unlimited revisions until satisfaction",
        ],
      },
      {
        id: "2",
        title: "3D Elevation Design",
        mainDescription:
          "Stunning 3D front elevation with technical 2D working details for construction",
        bulletPoints: [
          "3D Front Elevation with day view",
          "2D Technical working details with dimensions",
          "Exclusive and customized design approach",
          "Color combinations and material specifications",
          "Balcony and boundary wall design",
          "Unlimited revisions for perfect results",
        ],
      },
      {
        id: "3",
        title: "Structural Drawings",
        mainDescription:
          "Complete set of detailed and certified structural drawings required for building construction",
        bulletPoints: [
          "Central line plan and excavation drawing",
          "Foundation and footing details",
          "Columns layout and detailed specifications",
          "Plinth and slab level beam layouts",
          "Roof plan with comprehensive details",
          "Stairs RCC construction details",
          "Boundary wall structural specifications",
          "Complete material schedules",
        ],
      },
      {
        id: "4",
        title: "Working Drawings",
        mainDescription:
          "Detailed working drawings with all specifications required for construction execution",
        bulletPoints: [
          "Comprehensive working plans",
          "Wall construction details",
          "Door and window sizing specifications",
          "Section drawings for clarity",
          "Kitchen section details",
          "Toilet details and fixture specifications",
          "Door and window section details",
          "Staircase construction details",
        ],
      },
      {
        id: "5",
        title: "Electrical Drawings",
        mainDescription:
          "Complete electrical layout planning with modern automation considerations",
        bulletPoints: [
          "Fan and switch board positioning",
          "Tube light and fixture locations",
          "CCTV system layout planning",
          "Electrical automation drawing",
          "Complete power distribution layout",
        ],
      },
      {
        id: "6",
        title: "Plumbing & Drainage",
        mainDescription:
          "Comprehensive water supply and drainage system design with sustainable solutions",
        bulletPoints: [
          "Complete pipeline routing details",
          "Water tank specifications and positioning",
          "Waste water management system",
          "Rainy season water outlet planning",
          "Rain water harvesting system",
          "Septic tank and bore well details",
          "Chamber and sewage system design",
          "Pipe circulation and water management",
        ],
      },
    ]);

    const [originalFormData, setOriginalFormData] = useState({
      userName: "",
      organizationAddress: {
        blockUnitStreetName: "",
        cityState: "",
        country: "",
      },
      customerPhone: "",
      customerEmail: "",
    });
    const [originalServiceItems, setOriginalServiceItems] = useState([]);
    const [originalQuotationDetails, setOriginalQuotationDetails] = useState({
      quoteNumber: "RHD-2025-001",
      quoteDate: "June 23, 2025",
      validUntil: "July 23, 2025",
      customerName: "Mr. John Doe",
      customerAddressLine1: "123 Main Street",
      customerAddressLine2: "Near Landmark A",
      customerAddressLine3: "City, State",
      dearSirMessage: ` `,
      projectType: "Complete Designing - G+1",
      plotSize: "1,065 sq ft",
      packageType: "Shop name",
      accountName: "JG POWERS",
      bankName: "AXIS BANK",
      accountNumber: "924020037304194",
      ifscCode: "UTIB0004446",
      gstin: "29AAACD1234E1Z5",
      branch: "SANCHAR NAGAR INDORE",
      from: "", // New field
      printName: "", // New field
      position: "", // New field
      signApprove: "", // New field
      acceptanceDate: "", // New field
    });

    const [originalServicesIncluded, setOriginalServicesIncluded] = useState([]);

    const { user, rolePermissions } = useAuth();
    const { isCollapsed } = React.useContext(SidebarContext);
    const [isTabletView, setIsTabletView] = useState(false);
    const [isMobileView, setIsMobileView] = useState(false);
    // Products state (add near leads / budgetItems state)
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productDropdownOpenIndex, setProductDropdownOpenIndex] = useState(null);


  // Fetch all products automatically (no button)
  useEffect(() => {
    let cancel = false;
    setProductsLoading(true);

    api
      .get("/products") // 👈 your working endpoint
      .then((res) => {
        if (!cancel && res.data.success) {
          // your data is inside res.data.data
          setProducts(res.data.data || []);
        }
      })
      .catch((err) => {
        console.error("Product fetch error:", err);
        if (!cancel) setProducts([]);
      })
      .finally(() => {
        if (!cancel) setProductsLoading(false);
      });

    return () => {
      cancel = true;
    };
  }, []);



  const getFilteredProducts = (term) => {
    if (!term) return products;
    const t = term.toLowerCase();
    return products.filter((p) =>
      (p.item_name && p.item_name.toLowerCase().includes(t)) ||
      (p.name && p.name.toLowerCase().includes(t)) ||
      (p.sku && p.sku.toLowerCase().includes(t)) ||
      (p.price && String(p.price).toLowerCase().includes(t)) ||
      String(p.id) === term
    );
  };
  const handleProductSelect = (product, rowIndex) => {
    setBudgetItems((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        description: product.item_name,
        rate: parseFloat(product.price || 0),
        points: product.item_points || 0,
        qty: 1,
        item_id: product.id,
      };
      return updated;
    });
    setProductDropdownOpenIndex(null);
  };





    const canEditQuotationNumber = rolePermissions === "ALL";

    useEffect(() => {
      const checkTabletView = () => {
        setIsTabletView(window.innerWidth >= 768 && window.innerWidth < 1024);
        setIsMobileView(window.innerWidth < 768);
      };

      checkTabletView();
      window.addEventListener("resize", checkTabletView);

      return () => window.removeEventListener("resize", checkTabletView);
    }, []);

    // Close product dropdown when clicking outside or pressing Escape
    useEffect(() => {
      const handleDocClick = (e) => {
        try {
          // if click is inside any product-dropdown area, keep it open
          if (e.target.closest && e.target.closest('[data-product-dropdown]')) return;
        } catch (err) {
          // ignore
        }
        setProductDropdownOpenIndex(null);
      };

      const handleKey = (e) => {
        if (e.key === "Escape") setProductDropdownOpenIndex(null);
      };

      document.addEventListener("click", handleDocClick);
      document.addEventListener("keydown", handleKey);
      return () => {
        document.removeEventListener("click", handleDocClick);
        document.removeEventListener("keydown", handleKey);
      };
    }, []);

    const handleInputChange = (field, value) => {
      setFormData((prev) => {
        if (field.includes(".")) {
          const [parentField, nestedField] = field.split(".");
          return {
            ...prev,
            [parentField]: {
              ...prev[parentField],
              [nestedField]: value,
            },
          };
        } else {
          return {
            ...prev,
            [field]: value,
          };
        }
      });
    };

    const handleQuotationDetailsChange = (field, value) => {
      setQuotationDetails((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

    const handleBulletPointChange = (serviceId, bulletIndex, value) => {
      setServicesIncluded((prev) =>
        prev.map((item) =>
          item.id === serviceId
            ? {
                ...item,
                bulletPoints: item.bulletPoints.map((bullet, idx) =>
                  idx === bulletIndex ? value : bullet
                ),
              }
            : item
        )
      );
    };

    const handleServiceItemChange = (index, field, value) => {
      const newServiceItems = [...serviceItems];
      if (field === "quantity" || field === "totalItemPrice") {
        newServiceItems[index][field] =
          value === "" ? "" : parseFloat(value) || 0;
      } else {
        newServiceItems[index][field] = value;
      }
      setServiceItems(newServiceItems);
    };

    const addServiceItem = () => {
      setServiceItems([
        ...serviceItems,
        {
          serviceName: "",
          quantity: 1,
          totalItemPrice: 0,
        },
      ]);
    };

    const calculateTotalServiceCharge = () => {
      return serviceItems.reduce((total, item) => {
        const itemPrice = parseFloat(item.totalItemPrice) || 0;
        return total + itemPrice;
      }, 0);
    };

    const validateForm = () => {
      if (!formData.userName.trim()) {
        Swal.fire("Validation Error", "Customer Name is required.", "error");
        return false;
      }
      if (!formData.organizationAddress.blockUnitStreetName.trim()) {
        Swal.fire(
          "Validation Error",
          "Block/Unit/Street Name is required.",
          "error"
        );
        return false;
      }
      if (!formData.organizationAddress.cityState.trim()) {
        Swal.fire("Validation Error", "City, State is required.", "error");
        return false;
      }
      if (!formData.organizationAddress.country.trim()) {
        Swal.fire("Validation Error", "Country is required.", "error");
        return false;
      }
      if (!formData.customerPhone.trim()) {
        Swal.fire(
          "Validation Error",
          "Customer Phone Number is required.",
          "error"
        );
        return false;
      }
      if (!formData.customerEmail.trim()) {
        Swal.fire(
          "Validation Error",
          "Customer Email Address is required.",
          "error"
        );
        return false;
      }
      if (
        !/^[\w-]+(?:\.[\w-]+)*@(?:[\w-]+\.)+[a-zA-Z]{2,7}$/.test(
          formData.customerEmail
        )
      ) {
        Swal.fire(
          "Validation Error",
          "Invalid Customer Email Address format.",
          "error"
        );
        return false;
      }

      if (serviceItems.length === 0) {
        Swal.fire(
          "Validation Error",
          "At least one service item is required.",
          "error"
        );
        return false;
      }

      for (const item of serviceItems) {
        if (!item.serviceName.trim()) {
          Swal.fire(
            "Validation Error",
            "Service Description is required for all items.",
            "error"
          );
          return false;
        }
        if (!item.quantity || item.quantity <= 0) {
          Swal.fire(
            "Validation Error",
            "Quantity must be a positive number for all service items.",
            "error"
          );
          return false;
        }
        if (!item.totalItemPrice || item.totalItemPrice <= 0) {
          Swal.fire(
            "Validation Error",
            "Total Price must be a positive number for all service items.",
            "error"
          );
          return false;
        }
      }

      // Validate new quotationDetails fields
      if (!quotationDetails.quoteNumber.trim()) {
        Swal.fire("Validation Error", "Quote Number is required.", "error");
        return false;
      }
      if (!quotationDetails.quoteDate.trim()) {
        Swal.fire("Validation Error", "Quote Date is required.", "error");
        return false;
      }
      if (!quotationDetails.validUntil.trim()) {
        Swal.fire("Validation Error", "Valid Until date is required.", "error");
        return false;
      }
      if (!quotationDetails.customerName.trim()) {
        Swal.fire("Validation Error", "Customer Name (To) is required.", "error");
        return false;
      }
      if (!quotationDetails.customerAddressLine1.trim()) {
        Swal.fire(
          "Validation Error",
          "Customer Address Line 1 is required.",
          "error"
        );
        return false;
      }
      if (!quotationDetails.customerAddressLine3.trim()) {
        Swal.fire(
          "Validation Error",
          "Customer Address Line 3 is required.",
          "error"
        );
        return false;
      }
      if (!quotationDetails.dearSirMessage.trim()) {
        Swal.fire(
          "Validation Error",
          "Introduction message is required.",
          "error"
        );
        return false;
      }
      // New validations for project overview fields
      if (!quotationDetails.projectType.trim()) {
        Swal.fire("Validation Error", "Project Type is required.", "error");
        return false;
      }
      if (!quotationDetails.plotSize.trim()) {
        Swal.fire("Validation Error", "Plot Size is required.", "error");
        return false;
      }
      if (!quotationDetails.packageType.trim()) {
        Swal.fire("Validation Error", "Package is required.", "error");
        return false;
      }

      // Validate services included
      if (servicesIncluded.length === 0) {
        Swal.fire(
          "Validation Error",
          "At least one included service is required.",
          "error"
        );
        return false;
      }

      for (const service of servicesIncluded) {
        if (!service.title.trim()) {
          Swal.fire(
            "Validation Error",
            "Service title is required for all included services.",
            "error"
          );
          return false;
        }
        if (!service.mainDescription.trim()) {
          Swal.fire(
            "Validation Error",
            "Service main description is required for all included services.",
            "error"
          );
          return false;
        }
        if (service.bulletPoints.length === 0) {
          Swal.fire(
            "Validation Error",
            `At least one bullet point is required for service '${service.title}'.`,
            "error"
          );
          return false;
        }
        for (const bullet of service.bulletPoints) {
          if (!bullet.trim()) {
            Swal.fire(
              "Validation Error",
              `All bullet points must have content for service '${service.title}'.`,
              "error"
            );
            return false;
          }
        }
      }

      return true;
    };

    const toggleMode = () => {
      if (isEditMode) {
        Swal.fire({
          title: "Are you sure?",
          text: "All unsaved changes will be lost!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Yes, exit!",
        }).then((result) => {
          if (result.isConfirmed) {
            setFormData(originalFormData);
            setServiceItems(
              originalServiceItems.length === 0
                ? [{ serviceName: "", quantity: 1, totalItemPrice: 0 }]
                : originalServiceItems
            );
            setQuotationDetails(originalQuotationDetails);
            setServicesIncluded(originalServicesIncluded);
            setIsEditMode(false);
          }
        });
      } else {
        setOriginalFormData(formData);
        setOriginalServiceItems(
          serviceItems.length === 0
            ? [{ serviceName: "", quantity: 1, totalItemPrice: 0 }]
            : serviceItems
        );
        setOriginalQuotationDetails(quotationDetails);
        setOriginalServicesIncluded(servicesIncluded);
        setIsEditMode(true);
      }
    };

    const submitQuotation = async () => {
      // if (!validateForm()) {
      //   return;
      // }

      // Helper to format date to YYYY-MM-DD
      const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // Try to parse as Date
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr; // fallback to original if parse fails
        return d.toISOString().slice(0, 10);
      };

      // Helper to strip HTML tags
      const stripHtmlTags = (html) => {
        if (!html) return "";
        const doc = new window.DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || "";
      };

      // Office address as string
      let officeAddress = "145 Sai Bagh Colony, Khandwa Road, Indore";
      if (organisationInfo?.address) {
        try {
          const addr = JSON.parse(organisationInfo.address);
          officeAddress = [
            addr.blockUnitStreetName,
            addr.city,
            addr.state,
            addr.country,
            addr.pincode,
          ]
            .filter(Boolean)
            .join(", ");
        } catch (e) {}
      }

      // Client address as string
      const clientAddress = [
        quotationDetails.customerAddressLine1,
        quotationDetails.customerAddressLine2,
        quotationDetails.customerAddressLine3,
      ]
        .filter(Boolean)
        .join(", ");

      // Services array
      const services = servicesIncluded.map((s) => ({
        title: s.title,
        description: s.mainDescription,
        bulletPoints: s.bulletPoints || [],
      }));

      // Budget items array
      const budget_items = budgetItems.map((b) => ({
        description: b.description,
        amount: parseFloat(b.qty) * parseFloat(b.rate) || 0,
        points: parseFloat(b.points) * parseFloat(b.points) || 0,
        item_id: b.item_id || "",
      }));


      // Payment info
      const payment_info = {
        account_name: quotationDetails.accountName,
        bank_name: quotationDetails.bankName,
        account_number: quotationDetails.accountNumber,
        ifsc_code: quotationDetails.ifscCode,
        gstin: quotationDetails.gstin,
        branch: quotationDetails.branch,
      };

      // Conditions
      const conditions = {
        delivery_terms: deliveryTerms.join("\n"),
        scope_conditions: scopeModifications.join("\n"),
      };

      // Items (budgetItems mapped, filter out empty descriptions)
      const items = budgetItems
        .filter((item) => item.description && item.description.trim() !== "")
        .map((item) => ({
          item_name: item.description,
          qty: item.qty,
          rate: item.rate,
          gst: 0, // Dummy GST
          points: item.points,
          order_status: 1, // Default status
          item_id: item.item_id || "", // Ensure item_id is dynamically populated
        }));

      // Calculate totals
      const sub_total = calculateBudgetSubtotal();
      const grand_total = sub_total; // No extra charges for now

      // Dummy closing remarks
      const closing_remarks =
        "Thank you for the opportunity to serve you. We look forward to further communication with you after you have reviewed this proposal.";

      const formatData = {
        quote_no: quotationDetails.quoteNumber,
        lead_id: leadId || "0", // Use selected leadId if present
        date: formatDate(quotationDetails.quoteDate),
        valid_until: formatDate(quotationDetails.validUntil),
        office_address: officeAddress,
        client_name: quotationDetails.customerName,
        client_address: clientAddress,
        project_type: quotationDetails.projectType,
        plot_size: quotationDetails.plotSize,
        package_type: quotationDetails.packageType,
        introduction: stripHtmlTags(quotationDetails.dearSirMessage),
        closing_remarks,
        sub_total,
        grand_total,
        received_amount: "0", // Dummy for now
        points:"0",
        balance: "0",
        price:"0", // Dummy for now
        order_status:1, 
      item_id:"",
        services,
        payment_info,
        conditions,
        items,
      };

      console.log("Quotation submitted:", formatData);

      try {
        const endpoint = editQuotation
          ? `/updatequotation/${editQuotation.id}`
          : "/addquotation";
        const response = await api.post(endpoint, formatData);
        Swal.fire({
          icon: "success",
          title: "Success!",
          text:  " submitted successfully!",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        console.error("Error submitting :", error);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text:  "Failed to submit .",
          confirmButtonColor: "#d33",
        });
      }
    };

    const saveChangesAndExitEditMode = () => {
      // if (!validateForm()) {
      //   return;
      // }
      console.log("Changes saved:", { formData, serviceItems, quotationDetails });
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Changes saved successfully!",
        confirmButtonColor: "#3085d6",
      });
      setOriginalFormData(formData);
      setOriginalServiceItems(
        serviceItems.length === 0
          ? [{ serviceName: "", quantity: 1, totalItemPrice: 0 }]
          : serviceItems
      );
      setOriginalQuotationDetails(quotationDetails);
      setOriginalServicesIncluded(servicesIncluded);
      setIsEditMode(false);
    };

    const removeServiceItem = (index) => {
      if (serviceItems.length === 1) {
        Swal.fire(
          "Cannot Delete Last Item",
          "At least one service item is required.",
          "error"
        );
        return;
      }

      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then((result) => {
        if (result.isConfirmed) {
          const newServiceItems = serviceItems.filter((_, i) => i !== index);
          setServiceItems(newServiceItems);
          Swal.fire("Deleted!", "Your service item has been deleted.", "success");
        }
      });
    };

    const handleServiceTitleChange = (id, value) => {
      setServicesIncluded((prev) =>
        prev.map((item) => (item.id === id ? { ...item, title: value } : item))
      );
    };

    const handleServiceMainDescriptionChange = (id, value) => {
      setServicesIncluded((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, mainDescription: value } : item
        )
      );
    };

    const addBulletPoint = (id) => {
      setServicesIncluded((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, bulletPoints: [...item.bulletPoints, ""] }
            : item
        )
      );
    };

    const removeBulletPoint = (id, index) => {
      console.log("button clicked", id, index);
      setServicesIncluded((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                bulletPoints: item.bulletPoints.filter((_, i) => i !== index),
              }
            : item
        )
      );
    };

    const addIncludedService = () => {
      setServicesIncluded((prev) => [
        ...prev,
        {
          id: (prev.length + 1).toString(), // Simple ID generation
          title: "",
          mainDescription: "",
          bulletPoints: [],
        },
      ]);
    };

    const removeIncludedService = (idToRemove) => {
      setServicesIncluded((prev) =>
        prev.filter((item) => item.id !== idToRemove)
      );
    };

    const [budgetItems, setBudgetItems] = useState([
      { description: "", qty: 0, rate: 0, points: 0, item_id: ""  },
    ]);

    const handleBudgetItemChange = (index, field, value) => {
      setBudgetItems((prev) => {
        const updated = [...prev];
        if (field === "qty" || field === "rate") {
          updated[index][field] = value === "" ? "" : parseFloat(value) || 0;
        } else {
          updated[index][field] = value;
        }
        return updated;
      });
    };

    const addBudgetItem = () => {
      setBudgetItems((prev) => [...prev, { description: "", qty: 0, rate: 0 , points:0, item_id: "" }]);
    };

    const removeBudgetItem = (index) => {
      if (budgetItems.length === 1) {
        Swal.fire(
          "Cannot Delete Last Item",
          "At least one budget item is required.",
          "error"
        );
        return;
      }
      setBudgetItems((prev) => prev.filter((_, i) => i !== index));
    };

    const calculateBudgetSubtotal = () => {
      return budgetItems.reduce(
        (total, item) =>
          total + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0),
        0
      );
    };
    const calculatepoints = () => {
      return budgetItems.reduce(
        (total, item) =>
          total + (parseFloat(item.qty) || 0) * (parseFloat(item.points) || 0),
        0
      );
    };

    // Editable Delivery & Payment Terms and Scope & Modifications
    const [deliveryTerms, setDeliveryTerms] = useState([
      "Drawing delivery time is subject to timely comments from client and payments as per agreed terms",
      "All drawings will be designed as per requirements, plot details, and bylaws provided by the client",
    ]);
    const [scopeModifications, setScopeModifications] = useState([
      "If requirements change from initially provided specifications (plot size, number of floors, dimensions, direction etc.), additional charges will apply",
      "Time required to complete all services will depend entirely on client satisfaction and approval process",
    ]);

    const handleDeliveryTermChange = (idx, value) => {
      setDeliveryTerms((prev) =>
        prev.map((item, i) => (i === idx ? value : item))
      );
    };
    const addDeliveryTerm = () => setDeliveryTerms((prev) => [...prev, ""]);
    const removeDeliveryTerm = (idx) => {
      if (deliveryTerms.length === 1) return;
      setDeliveryTerms((prev) => prev.filter((_, i) => i !== idx));
    };

    const handleScopeModificationChange = (idx, value) => {
      setScopeModifications((prev) =>
        prev.map((item, i) => (i === idx ? value : item))
      );
    };
    const addScopeModification = () =>
      setScopeModifications((prev) => [...prev, ""]);
    const removeScopeModification = (idx) => {
      if (scopeModifications.length === 1) return;
      setScopeModifications((prev) => prev.filter((_, i) => i !== idx));
    };

    // Lead dropdown state
    const [leads, setLeads] = useState([]);
    const [leadSearchTerm, setLeadSearchTerm] = useState("");
    const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
    const [leadsLoading, setLeadsLoading] = useState(false);
    const [selectedLead, setSelectedLead] = useState(null);
    const [leadId, setLeadId] = useState("");
    const leadDropdownRef = useRef(null);

    // Extract lead_id from either location.state or editQuotation
    const editLeadId = editQuotation?.lead_id || stateLeadId;

    // Always fetch leads if editLeadId is present and leads are empty
    useEffect(() => {
      if (isEditMode && leads.length === 0 && !leadsLoading) {
        setLeadsLoading(true);
        api
          .get("/showlead")
          .then((res) => {
            if (res.data.success) {
              setLeads(res.data.result);
            }
          })
          .catch(() => {})
          .finally(() => setLeadsLoading(false));
      }
    }, [isEditMode, leads.length, leadsLoading]);

    // Pre-select lead if editLeadId is present and leads are loaded
    useEffect(() => {
      if (editLeadId && leads.length > 0) {
        const foundLead = leads.find((lead) => lead.customer_id === editLeadId);
        if (foundLead) {
          handleLeadSelect(foundLead);
        }
      }
    }, [leads, editLeadId]);

    // Close dropdown on outside click
    useEffect(() => {
      function handleClickOutside(event) {
        if (
          leadDropdownRef.current &&
          !leadDropdownRef.current.contains(event.target)
        ) {
          setLeadDropdownOpen(false);
        }
      }
      if (leadDropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
      } else {
        document.removeEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [leadDropdownOpen]);

    // Filtered leads
    const filteredLeads = leads.filter((lead) => {
      const term = leadSearchTerm.toLowerCase();
      return (
        lead.customer_name.toLowerCase().includes(term) ||
        (lead.email && lead.email.toLowerCase().includes(term)) ||
        (lead.contact && lead.contact.toLowerCase().includes(term))
      );
    });

    // Helper: parse address from lead.city (may be JSON)
    function parseLeadAddress(addressString) {
      let parsedAddress = {
        line1: "",
        line2: "",
        line3: "",
      };
      if (addressString && typeof addressString === "string") {
        try {
          const addressObj = JSON.parse(addressString);
          parsedAddress.line1 =
            addressObj.blockUnitStreetName || addressObj.name || "";
          parsedAddress.line2 = addressObj.city || "";
          parsedAddress.line3 = [
            addressObj.state,
            addressObj.country,
            addressObj.pincode,
          ]
            .filter(Boolean)
            .join(", ");
        } catch (e) {
          parsedAddress.line2 = addressString;
        }
      }
      return parsedAddress;
    }

    // Autofill on lead select
    const handleLeadSelect = (lead) => {
      setSelectedLead(lead);
      setLeadId(lead.customer_id);
      setLeadDropdownOpen(false);
      setLeadSearchTerm(lead.customer_name);
      // Fill customer fields
      setQuotationDetails((prev) => ({
        ...prev,
        customerName: lead.customer_name || prev.customerName,
        customerAddressLine1:
          parseLeadAddress(lead.city).line1 || prev.customerAddressLine1,
        customerAddressLine2:
          parseLeadAddress(lead.city).line2 || prev.customerAddressLine2,
        customerAddressLine3:
          parseLeadAddress(lead.city).line3 || prev.customerAddressLine3,
      }));
      setFormData((prev) => ({
        ...prev,
        customerEmail: lead.email || prev.customerEmail,
        customerPhone: lead.contact || prev.customerPhone,
      }));
    };

    // Clear lead selection
    const clearLeadSelection = () => {
      setSelectedLead(null);
      setLeadId("");
      setLeadSearchTerm("");
    };

    // Add state for Dear Sir heading
    const [dearSirHeading, setDearSirHeading] = useState("");

    return (
      <div
        className={` w-[90vw] md:w-[85vw]  lg:w-[90%] xl:w-[100%]  h-auto bg-white p-4 sm:p-6 lg:p-[23px] min-h-screen rounded-2xl flex flex-col relative`}
      >
        {/* Header Section */}
        <div className="grid grid-cols-3 gap-4 mb-8 px-4 sm:px-6 lg:px-[20px] mt-8">
          <div className="col-span-2 flex flex-col items-start justify-start">
            {/* Profile Picture and Organization Name */}
            <div className="flex items-start flex-col lg:mr-8">
              <div
               className="w-[65px] h-[28px] md:w-[90px] md:h-[40px] lg:w-[130px] lg:h-[55px] bg-contain bg-center bg-no-repeat"

                style={{
                  backgroundImage: `url(${
                    organisationInfo?.profile_image ||
                    user?.profile_pic ||
                    "src/assets/dummyavatar.jpeg"
                  })`,
                }}
              ></div>
              <span className=" text-md md:text-xl lg:text-2xl xl:text-3xl whitespace-nowrap">
                {organisationInfo?.organizationname || "JG POWERS"}
              </span>
            </div>

            {/* Office Address */}
            {/* <div className="flex flex-col items-start mt-3">
              <span className="text-[rgb(31,41,55)] text-xs sm:text-base lg:text-[12px] font-medium"></span>
              <span className="text-[rgb(31,41,55)] text-xs sm:text-base lg:text-[12px]">
                <h4>
                  <b>Quote #:</b>{" "}
                  {isEditMode && canEditQuotationNumber ? (
                    <input
                      type="text"
                      value={quotationDetails.quoteNumber}
                      onChange={(e) =>
                        handleQuotationDetailsChange(
                          "quoteNumber",
                          e.target.value
                        )
                      }
                      className="border-b border-gray-300 outline-none px-1 w-28 sm:w-auto"
                    />
                  ) : (
                    quotationDetails.quoteNumber
                  )}
                </h4>

                <h4>
                  <b>Date:</b>{" "}
                  {isEditMode ? (
                    <input
                      type="text"
                      value={quotationDetails.quoteDate}
                      onChange={(e) =>
                        handleQuotationDetailsChange("quoteDate", e.target.value)
                      }
                      className="border-b border-gray-300 outline-none px-1 w-28 sm:w-auto"
                    />
                  ) : (
                    quotationDetails.quoteDate
                  )}
                </h4>
                <h4>
                  <b>Valid Until:</b>{" "}
                  {isEditMode ? (
                    <input
                      type="text"
                      value={quotationDetails.validUntil}
                      onChange={(e) =>
                        handleQuotationDetailsChange("validUntil", e.target.value)
                      }
                      className="border-b border-gray-300 outline-none px-1 w-28 sm:w-auto"
                    />
                  ) : (
                    quotationDetails.validUntil
                  )}
                </h4>
              </span>
            </div> */}
          </div>

          <div className="col-span-1 flex items-end justify-end">
            <div className="text-right">
              <div className=" text-[#ef7e1b] text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-quicksand font-bold ">
                New Order
              </div>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="flex flex-col mb-8 w-full bg-gray-50 py-4 sm:py-6 px-[20px] lg:px-[20px] ">
          <div className="flex justify-between mb-10">


            {/* <div className="lg:w-auto">
              <h3 className="font-semibold text-xs sm:text-base">
                To:{" "}
                {isEditMode ? (
                  <input
                    type="text"
                    value={quotationDetails.customerName}
                    onChange={(e) =>
                      handleQuotationDetailsChange("customerName", e.target.value)
                    }
                    className="border-b border-gray-300 outline-none px-1 w-auto"
                  />
                ) : (
                  quotationDetails.customerName
                )}
              </h3>
              {isEditMode ? (
                <div className="flex flex-col max-w-xs">
                  <input
                    type="text"
                    value={quotationDetails.customerAddressLine1}
                    onChange={(e) =>
                      handleQuotationDetailsChange(
                        "customerAddressLine1",
                        e.target.value
                      )
                    }
                    className="text-xs border-b border-gray-300 outline-none px-1 w-full"
                  />
                  <input
                    type="text"
                    value={quotationDetails.customerAddressLine2}
                    onChange={(e) =>
                      handleQuotationDetailsChange(
                        "customerAddressLine2",
                        e.target.value
                      )
                    }
                    className="text-xs border-b border-gray-300 outline-none px-1 w-full"
                  />
                  <input
                    type="text"
                    value={quotationDetails.customerAddressLine3}
                    onChange={(e) =>
                      handleQuotationDetailsChange(
                        "customerAddressLine3",
                        e.target.value
                      )
                    }
                    className="text-xs border-b border-gray-300 outline-none px-1 w-full"
                  />
                </div>
              ) : (
                <>
                  <p className="text-xs">
                    {quotationDetails.customerAddressLine1}
                  </p>
                  <p className="text-xs">
                    {quotationDetails.customerAddressLine2}
                  </p>
                  <p className="text-xs">
                    {quotationDetails.customerAddressLine3}
                  </p>
                </>
              )}
            </div> */}
          </div>

          <div className="flex flex-col w-full"></div>

          <div className="font-sans mx-auto w-full">
            {/* Lead Dropdown Section - above Dear Sir, only in edit mode */}
            {isEditMode && (
              <div
                className="flex flex-col items-first  w-full"
                ref={leadDropdownRef}
              >
                <label className="block text-[#4B5563] text-sm font-medium mb-2">
                  Search
                </label>
                <div className="relative w-full mb-10">
                  <input
                    type="text"
                    placeholder="Search customer by name, email, or phone..."
                    value={leadSearchTerm}
                    onChange={(e) => {
                      setLeadSearchTerm(e.target.value);
                      setLeadDropdownOpen(true);
                    }}
                    onFocus={() => setLeadDropdownOpen(true)}
                    className="w-full px-3 py-2 rounded-[12px] border border-[#E7EFF8] bg-[#F8FAFC] text-[#545454] focus:ring-2 focus:ring-[#0e4053] outline-none mb-1"
                  />
                  {selectedLead && (
                    <button
                      type="button"
                      onClick={clearLeadSelection}
                      className="absolute right-2 top-3 text-gray-400 hover:text-red-500"
                      title="Clear selection"
                    >
                      <FaTimes size={16} />
                    </button>
                  )}
                  {leadDropdownOpen && (
                    <div className="absolute z-20 w-full custom-scrollbar bg-white rounded-xl shadow-2xl border border-gray-200 mt-1 max-h-72 overflow-y-auto animate-fade-in">
                      {leadsLoading ? (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-500">
                          <svg
                            className="animate-spin h-6 w-6 mb-2 text-Duskwood-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            ></path>
                          </svg>
                          Loading...
                        </div>
                      ) : filteredLeads.length > 0 ? (
                        filteredLeads.map((lead, idx) => (
                          <div
                            key={lead.customer_id}
                            className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-Duskwood-50/80 group"
                            style={{
                              borderBottom:
                                idx !== filteredLeads.length - 1
                                  ? "1px solid #F1F5F9"
                                  : "none",
                            }}
                            onClick={() => handleLeadSelect(lead)}
                          >
                            <img
                              src={lead.profile_pic}
                              alt="pic"
                              className="h-9 w-9 rounded-full object-cover border border-gray-200 shadow-sm"
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="font-semibold text-gray-800 truncate group-hover:text-Duskwood-700">
                                {lead.customer_name}
                              </span>
                              <span className="text-xs text-gray-500 truncate">
                                {lead.email}
                              </span>
                              <span className="text-xs text-gray-400 truncate">
                                {lead.contact}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-gray-400">
                          <svg
                            className="h-8 w-8 mb-2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-3A2.25 2.25 0 008.25 5.25V9m10.5 0A2.25 2.25 0 0121 11.25v7.5A2.25 2.25 0 0118.75 21H5.25A2.25 2.25 0 013 18.75v-7.5A2.25 2.25 0 015.25 9m13.5 0h-13.5"
                            />
                          </svg>
                          No Shop Owners found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {/* Main content grid */}
           <div className="grid grid-cols-[0.5fr_0.5fr_3fr] md:grid-cols-[1fr_auto_3fr]  md:gap-x-10 lg:gap-x-5  xl:gap-x-10  md:gap-y-8 gap-y-4 items-start min-w-0 overflow-visible">
                       {/* Budget Breakdown Row */}
                       <div className="xl:pr-5 pr-1 flex flex-col justify-start items-start text-left ">
                         {/* <div className="text-[8px] md:text-xl font-bold text-gray-800 mb-1">
                           ORDER <br /> BREAKDOWN
                         </div> */}
                       </div>
                       {/* <div className="relative self-stretch mb-5  md:mb-0">
                         <div className="bg-[#ef7e1b] text-white rounded-full md:w-12 md:h-12 h-6 w-6 flex justify-center items-center text-[10px] md:text-lg font-bold z-10 absolute top-0 left-1/2 -translate-x-1/2 flex-shrink-0">
                           01.
                         </div>
                         <div className="w-0.5 bg-[#ef7e1b] absolute left-1/2 -translate-x-1/2 top-8 bottom-0 z-0"></div>
                         <div className="bg-[#ef7e1b] rounded-full w-2 h-2 absolute bottom-0 left-1/2 -translate-x-1/2 z-10"></div>
                       </div> */}
                       <div className=" ">
                         {/* Updated: Two-row header for Description, Qty, Rate, empty, Amount */}
                         <div className="mb-5">
                           {/* First header row: Description (colSpan=3), empty, Amount */}
                           <div className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr]  text-white text-sm font-bold">
                             <div></div>
                           </div>
                           {/* Second header row: Description, Qty, Rate, empty, Amount */}
                           <div className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr] text-white text-[10px] md:text-xs font-semibold">
             <div className="p-1 md:p-2.5 bg-gray-700 border-t border-[#0e4053]">
               Product Name 
             </div>
           
             <div className="p-1 md:p-2.5 bg-gray-700 border-t border-[#0e4053] text-center">
               Qty
             </div>
           
             <div className="p-1 md:p-2.5 bg-gray-700 border-t border-[#0e4053] text-center">
               Price
             </div>
           
             <div className="bg-gray-50 border-t border-gray-50"></div>
           
             {/* Amount + Points side by side */}
             <div className="flex justify-between items-center text-right p-1 md:p-2.5 bg-gray-700 border-t border-gray-700">
               <span>Amount</span>
             </div>
                        </div>
           
                           {/* Data rows: Editable in edit mode, static otherwise */}
                           {isEditMode ? (
                             <>
                               {budgetItems.map((item, idx) => (
                                 <div
                                   key={idx}
                                   className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr] py-2 text-[10px] md:text-sm text-gray-700 items-center"
                                 >
                                   <div className="flex items-start md:items-center justify-between min-w-0 w-full">
                                     <svg
                                       xmlns="http://www.w3.org/2000/svg"
                                       width="1em"
                                       height="1em"
                                       viewBox="0 0 24 24"
                                       className="flex-shrink-0 mr-1 text-xs md:text-xl"
                                     >
                                       <path
                                         fill="#0e4053"
                                         d="m10.537 12l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354zm6.1 0l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354z"
                                       />
                                     </svg>
                                    {/* Description & product-search column (inside your map over budgetItems) */}
           <div className="relative w-full" data-product-dropdown>
             <input
               type="text"
               value={item.description || ""}
               onChange={(e) => {
                 const val = e.target.value;
                 setBudgetItems((prev) => {
                   const updated = [...prev];
                   updated[idx] = { ...updated[idx], description: val };
                   return updated;
                 });
                 setProductSearchTerm(val);
                 setProductDropdownOpenIndex(idx);
               }}
               placeholder="Search product..."
               onFocus={() => setProductDropdownOpenIndex(idx)}
               className="border-b border-gray-300 outline-none px-1 flex-grow bg-transparent w-full"
             />
           
             {/* Dropdown: full-screen modal on mobile, inline on desktop */}
             {productDropdownOpenIndex === idx && (
               isMobileView ? (
                 <div className="fixed inset-0 z-50 bg-white p-4 overflow-auto max-h-[calc(100vh-4rem)]" role="dialog" aria-modal="true">
                   <div className="flex items-center justify-between mb-4">
                     <div className="flex-1 pr-2">
                       <input
                         type="text"
                         value={productSearchTerm}
                         onChange={(e) => setProductSearchTerm(e.target.value)}
                         placeholder="Search product..."
                         className="w-full px-3 py-2 rounded-[8px] border border-gray-200 focus:ring-2 focus:ring-[#0e4053] outline-none"
                         autoFocus
                       />
                     </div>
                     <button
                       onClick={() => setProductDropdownOpenIndex(null)}
                       className="ml-3 text-gray-600"
                       aria-label="Close product search"
                     >
                       <FaTimes size={20} />
                     </button>
                   </div>
                   <div className="space-y-1">
                     {productsLoading ? (
                       <div className="p-3 text-sm text-gray-500">Loading products...</div>
                     ) : (
                       getFilteredProducts(productSearchTerm).map((p) => (
                         <div
                           key={p.id}
                           onClick={() => { handleProductSelect(p, idx); }}
                           className="px-3 py-3 hover:bg-gray-100 cursor-pointer flex justify-between items-center border-b border-gray-100"
                         >
                           <div className="flex items-center gap-3">
                             <img
                               src={p.product_image}
                               alt={p.item_name}
                               className="w-10 h-10 rounded object-cover"
                             />
                             <div className="min-w-0">
                               <div className="font-medium text-sm truncate">{p.item_name}</div>
                               <div className="text-xs text-gray-500 truncate">{p.sku}</div>
                             </div>
                           </div>
                           <div className="text-sm text-gray-700">₹{p.price}</div>
                         </div>
                       ))
                     )}
                     {!productsLoading && getFilteredProducts(productSearchTerm).length === 0 && (
                       <div className="p-3 text-xs text-gray-500">No product found.</div>
                     )}
                   </div>
                 </div>
               ) : (
                 <div className="absolute z-30 top-full left-0 w-full bg-white  rounded-lg mt-1 max-h-56 overflow-y-auto shadow-lg">
                   {productsLoading ? (
                     <div className="p-3 text-sm text-gray-500">Loading products...</div>
                   ) : (
                     getFilteredProducts(productSearchTerm)
                       .map((p) => (
                         <div
                           key={p.id}
                           onClick={() => handleProductSelect(p, idx)}
                           className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                         >
                           <div className="flex items-center gap-2">
                             <img
                               src={p.product_image}
                               alt={p.item_name}
                               className="w-8 h-8 rounded object-cover"
                             />
                             <div>
                               <div className="font-medium text-sm">{p.item_name}</div>
                               <div className="text-xs text-gray-500">{p.sku}</div>
                             </div>
                           </div>
                           <div className="text-sm text-gray-700">₹{p.price}</div>
                         </div>
                       ))
                   )}
                   {!productsLoading && getFilteredProducts(productSearchTerm).length === 0 && (
                     <div className="p-3 text-xs text-gray-500">No product found.</div>
                   )}
                 </div>
               )
             )}
           </div>
                                   </div>
                                   <div className="flex justify-center">
                                     <input
                                       type="number"
                                       min="1"
                                       value={item.qty}
                                       onChange={(e) =>
                                         handleBudgetItemChange(idx, "qty", e.target.value)
                                       }
                                       className="text-center border-b border-gray-300 outline-none px-1 bg-transparent md:w-16 w-full"
                                       placeholder="Qty"
                                     />
                                   </div>
                                   <div className="flex justify-center">
                         <input
             type="number"
             min="0"
             value={item.rate ?? 0}
             readOnly
             className="text-center border-b border-gray-300 outline-none px-1 bg-transparent w-full md:w-20"
           />
           
           
                                   </div>
                                   <div className="flex justify-center">
                                     <button
                                       onClick={() => removeBudgetItem(idx)}
                                       className="ml-2 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold text-green-500"
                                       title="Remove row"
                                       style={{ minWidth: "16px" }}
                                     >
                                       <FaMinus size={10} />
                                     </button>
                                   </div>
                                   <div className="whitespace-nowrap pr-0  text-gray-700 flex gap-25">
                                      <span>
               Rs { (parseFloat(item.qty) * parseFloat(item.rate) || 0).toLocaleString() }
             </span>
             <span>
             </span>
                                   </div>
                                 </div>
                               ))}
                               <div className="flex justify-center mt-2">
                                 <button
                                   onClick={addBudgetItem}
                                   className="rounded-full w-8 h-8 flex items-center justify-center text-2xl font-bold text-[#ef7e1b]"
                                   title="Add row"
                                 >
                                   <FaPlus size={18} />
                                 </button>
                               </div>
                             </>
                           ) : (
                             <>
                               {budgetItems.map((item, idx) => (
                                 <div
                                   key={idx}
                                   className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr] py-1 md:py-2 text-sm text-gray-700"
                                 >
                                   <div className="flex items-start md:items-center justify-between min-w-0 w-full md:text-base text-[8px]">
                                     <svg
                                       xmlns="http://www.w3.org/2000/svg"
                                       width="1em"
                                       height="1em"
                                       viewBox="0 0 24 24"
                                       className="flex-shrink-0 mr-1 text-xs md:text-xl"
                                     >
                                       <path
                                         fill="#0e4053"
                                         d="m10.537 12l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354zm6.1 0l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354z"
                                       />
                                     </svg>
                                     {item.description}
                                   </div>
                                   <div className="text-center md:text-base text-[8px]">
                                     {item.qty}
                                   </div>
                                   <div className="text-center md:text-base text-[8px]">
                                     {item.rate}
                                   </div>
                                   <div></div>
                                   <div className="pr-0 md:text-base text-[8px] flex gap-35">
                                      <span>
               Rs { (parseFloat(item.qty) * parseFloat(item.rate) || 0).toLocaleString() }
             </span>
             <span>
                { (parseFloat(item.qty) * parseFloat(item.points) || 0).toLocaleString() }
             </span>
                                   </div>
                                    
                                 </div>
                               ))}
                             </>
                           )}
                           {/* Subtotal and Total rows */}
                           <div className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr] text-[8px] md:text-sm font-bold bg-gray-100 text-gray-700  whitespace-nowrap">
                             <div className="md:p-2.5 p-1  ">Sub total</div>
                             <div></div>
                             <div></div>
                                       <div className="whitespace-nowrap pl-50  pt-2.5 flex gap-4">
             <span>
               Rs{" "}
               {calculateBudgetSubtotal().toLocaleString(undefined, {
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
               })}
             </span>
           </div>
                           </div>
                           <div className="grid grid-cols-[1.5fr_0.5fr_0.5fr_0.1fr_1fr] font-bold text-[8px] md:text-base">
                             <div className="pl-1 md:pl-4 border-t-2 border-[#0e4053] pt-2.5 text-gray-700 ">
                               TOTAL
                             </div>
                             <div className="border-t-2 border-[#0e4053]"></div>
                             <div className="border-t-2 border-[#0e4053]"></div>
                             <div></div>
                           <div className="whitespace-nowrap pr-0 text-gray-700  border-t-2 border-[#0e4053] pt-2.5 flex gap-25">
             <span>
               Rs{" "}
               {calculateBudgetSubtotal().toLocaleString(undefined, {
                 minimumFractionDigits: 2,
                 maximumFractionDigits: 2,
               })}
             </span>
            
           </div>
           
                             
                           </div>
                         </div>
                       </div>
           
                       {/* Contact & Payment Information Row (Duplicated Payment Info Row) */}
                       <div className="xl:pr-5 pr-1 flex flex-col justify-start items-start text-left">
                         {/* <div className="text-[8px] md:text-xl font-bold text-gray-800 mb-1">
                           PAYMENT <br /> INFORMATION
                         </div> */}
                       </div>
                       <div className="relative self-stretch mb-5  md:mb-0">
                         {/* <div className="bg-gray-100 rounded-full md:w-12 md:h-12 h-6 w-6 flex justify-center items-center z-10 absolute top-0 left-1/2 -translate-x-1/2 flex-shrink-0">
                           <svg
                             xmlns="http://www.w3.org/2000/svg"
                             width="33"
                             height="33"
                             viewBox="0 0 24 24"
                           >
                             <g fill="none" fillRule="evenodd" clipRule="evenodd">
                               <path
                                 fill="#0c6fff"
                                 d="m14.022 16.483l-3.568 2.649c-.21.16-.52.48-.85.71a.7.7 0 0 1-.4.19a1.8 1.8 0 0 1-1.06-.55a14.5 14.5 0 0 1-1.448-1.69c-.79-1-1.56-1.999-2.3-2.999s-1.419-2.049-2.069-3.118c-1.349-2.18-1.269-1.41-.75-1.97q.47-.53 1-.999t1.11-.87l1.999-1.589l.66-.51c.16 0 .33.18.51.34q.372.349.7.74l.999 1.2l3.278 4.387a.361.361 0 1 0 .58-.43L9.254 7.488l-.95-1.26a7 7 0 0 0-1.119-1.16a1.48 1.48 0 0 0-.94-.32a1.4 1.4 0 0 0-.509.2q-.348.222-.66.49l-1.999 1.48c-.43.29-.84.59-1.24.91q-.6.497-1.139 1.059a4.6 4.6 0 0 0-.64.78a.7.7 0 0 0 0 .56q.144.381.36.73c.28.469.65.929.91 1.349c.65 1.089 1.34 2.168 2.119 3.208s1.6 2 2.449 2.999a11.5 11.5 0 0 0 1.999 1.999c.384.28.844.44 1.32.46a1.4 1.4 0 0 0 .76-.27q.526-.41.999-.88c.68-.56 1.36-1.14 1.999-1.689q.68-.549 1.38-1.08a.32.32 0 0 0-.36-.52z"
                               />
                               <path
                                 fill="#0c6fff"
                                 d="M8.914 11.175a2.38 2.38 0 0 0-2.998-.27a2.45 2.45 0 0 0-.89 1.74a2.15 2.15 0 0 0 .74 1.809c.396.308.887.47 1.39.46c.467.007.928-.117 1.329-.36a.33.33 0 0 0 .12-.44a.35.35 0 0 0 .27-.1a1.83 1.83 0 0 0 .04-2.839m-.58 2.309a.35.35 0 0 0 0 .47h-.12a1.76 1.76 0 0 1-.999.12a1.27 1.27 0 0 1-.77-.39a1.14 1.14 0 0 1-.23-1a1.33 1.33 0 0 1 .46-.89a1.24 1.24 0 0 1 1.55.07a1 1 0 0 1 .11 1.62m9.014-7.077a14 14 0 0 0-.379-1.55a7 7 0 0 0-.54-1.229a1.77 1.77 0 0 0-.81-.75a1.6 1.6 0 0 0-.74-.08q-.646.12-1.268.33a.324.324 0 0 0 .15.63q.495-.099.999-.13a.86.86 0 0 1 .45.09c.14.08.2.26.28.43q.215.518.32 1.07c.19.56.32 1.13.46 1.699s.33 1.17.49 1.75s.249.819.249.829c.08.42.62.08.66-.53c-.2-1.03-.12-1.53-.32-2.559"
                               />
                               <path
                                 fill="#4a5565"
                                 d="M23.968 16.523a7.7 7.7 0 0 0-.51-2.12a6.7 6.7 0 0 0-1.12-1.889a8.18 8.18 0 0 0-4.367-2.598c-.36-.17-.63.09-.62.52a5.7 5.7 0 0 1-.71 1.579a2.71 2.71 0 0 1-2.759.38a1.35 1.35 0 0 0-.83.09a1.54 1.54 0 0 0-1.079 1.529a2 2 0 0 0 .8 1.609c.13.07.4.2.74.34c.77.32 1.999.74 2.469 1c-.08.2.21.73.26.88a5.5 5.5 0 0 0 1.069 1.808a1.81 1.81 0 0 0 1.44.62a.36.36 0 1 0 0-.72a1.1 1.1 0 0 1-.82-.45a4.3 4.3 0 0 1-.76-1.559c-.05-.18-.07-.75-.15-1a.6.6 0 0 0-.24-.34a5.6 5.6 0 0 0-.74-.399c-.87-.4-2.288-1-2.618-1.2a.77.77 0 0 1-.21-.57a.41.41 0 0 1 .25-.42a1 1 0 0 1 .35 0q.732.074 1.469.06a3 3 0 0 0 2.209-1.289a3.26 3.26 0 0 0 .48-1.709a7.6 7.6 0 0 1 3.448 2.56c.37.497.672 1.042.9 1.618c.234.583.402 1.19.5 1.81c.23 1.504.161 3.04-.2 4.518a.37.37 0 0 0 .25.45a.36.36 0 0 0 .44-.25c.556-1.556.78-3.21.66-4.858"
                               />
                               <path
                                 fill="#0c6fff"
                                 d="M14.852 10.066c-.29-1-.55-2-.83-3c-.18-.669-.39-1.329-.58-1.998a7.7 7.7 0 0 0-.75-2a1.45 1.45 0 0 0-1.079-.71a.87.87 0 0 0-.46.1q-.383.23-.74.5l-2.438 1.55a.32.32 0 1 0 .27.57l2.639-1.26c.45-.23.58-.89 1 .3c.18.48.29 1 .37 1.29c.389 1.189.769 2.368 1.189 3.548s.69 1.61 1.14 2.669c.199.58.719.72.719.29c-.21-.7-.24-1.15-.45-1.85"
                               />
                             </g>
                           </svg>
                         </div> */}
                         {/* <div className="w-0.5 bg-[#ef7e1b] absolute left-1/2 -translate-x-1/2 top-8 bottom-0 z-0"></div>
                         <div className="bg-[#ef7e1b] rounded-full w-2 h-2 absolute bottom-0 left-1/2 -translate-x-1/2 z-10"></div> */}
                       </div>
                       {/* <div className="pl-5">
                         <div className="grid grid-cols-2 gap-1">
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 md:p-6 flex flex-col justify-items-start">
                             <strong className="md:text-xs text-[8px] text-gray-600 uppercase md:mb-1 block">
                               Account Name
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.accountName}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange(
                                     "accountName",
                                     e.target.value
                                   )
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.accountName}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 md:p-6 flex flex-col justify-items-start">
                             <strong className="text-[8px] md:text-xs text-gray-600 uppercase md:mb-1 block">
                               Bank Name
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.bankName}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange("bankName", e.target.value)
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.bankName}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 md:p-6 flex flex-col justify-items-start">
                             <strong className="text-[8px] md:text-xs text-gray-600 uppercase md:mb-1 block">
                               Account Number
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.accountNumber}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange(
                                     "accountNumber",
                                     e.target.value
                                   )
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.accountNumber}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 md:p-6 flex flex-col justify-items-start">
                             <strong className="text-[8px] md:text-xs text-gray-600 uppercase md:mb-1 block">
                               IFSC Code
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.ifscCode}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange("ifscCode", e.target.value)
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.ifscCode}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 flex flex-col justify-items-start md:p-6">
                             <strong className="text-[8px] md:text-xs text-gray-600 uppercase md:mb-1 block">
                               GSTIN
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.gstin}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange("gstin", e.target.value)
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.gstin}
                               </span>
                             )}
                           </div>
                           <div className="bg-gray-100 border border-gray-100 rounded-lg p-2 flex flex-col justify-items-start  md:p-6">
                             <strong className="text-[8px] md:text-xs text-gray-600 uppercase md:mb-1   block">
                               Branch
                             </strong>
                             {isEditMode ? (
                               <input
                                 type="text"
                                 value={quotationDetails.branch}
                                 onChange={(e) =>
                                   handleQuotationDetailsChange("branch", e.target.value)
                                 }
                                 className="text-[8px] md:text-sm text-gray-900 font-medium border-b border-gray-300 outline-none px-1 w-full bg-gray-100"
                               />
                             ) : (
                               <span className="text-[8px] md:text-sm text-gray-900 font-medium">
                                 {quotationDetails.branch}
                               </span>
                             )}
                           </div>
                         </div>
                       </div> */}
           
                       
                     </div>
                   </div>
                 </div>

        {/* <div className=" bg-white px-2 md:px-12  text-center">
          <p className=" text-gray-500 text-xs md:text-base leading-relaxed max-w-xl mx-auto mb-5">
            Thank you for the opportunity to serve you. We look forward to further
            communication with you after you have reviewed this proposal.
          </p>
          <p className="text-sm md:text-xl font-bold text-Duskwood-900 uppercase tracking-wide mb-7 ">
            Your positive reply awaiting!
          </p>
        </div> */}

        {/* Edit/Save/Submit Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8 px-4 sm:px-6 lg:px-[20px] mb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-[10px] w-full sm:w-auto">
            {isEditMode ? (
              <>
                <button
                  onClick={toggleMode}
                  className="w-full sm:w-[150px] h-[40px] border border-[#0e4053] rounded-[10px] text-gray-700 text-[16px] font-semibold flex items-center justify-center hover:text-white hover:bg-[#ee7f1b]"
                >
                  Exit Edit Mode
                </button>
                <button
                  onClick={saveChangesAndExitEditMode}
                  className="w-full sm:w-[150px] h-[40px] bg-gray-700 rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#ee7f1b]"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={toggleMode}
                  className="w-full sm:w-[150px] h-[40px] border border-[#0e4053] rounded-[10px] text-gray-700 text-[16px] font-semibold flex items-center justify-center hover:text-white hover:bg-[#ee7f1b]"
                >
                  Enter Edit Mode
                </button>
                <button
                  onClick={submitQuotation}
                  className="w-full sm:w-[150px] p-3 h-[40px] bg-[#ef7e1b] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#ee7f1b]"
                >
                  Submit Orders
                </button>
                <div className="flex sm:hidden justify-center items-center w-full mt-2">
                  <button
                    className="w-full text-[#8B8B8B] text-xs rounded-[10px] py-2 px-4 flex items-center justify-center  gap-2"
                    onClick={() => {
                      if (pdfDownloadLinkRef.current) {
                        pdfDownloadLinkRef.current.click();
                      }
                    }}
                    type="button"
                  >
                    <span className="mr-2">Export to PDF</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 100 100"
                      fill="#727A90"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12.5 90.625H21.875V100H12.5C5.60547 100 0 94.3945 0 87.5V12.5C0 5.60547 5.60547 0 12.5 0H44.8242C48.1445 0 51.3281 1.30859 53.6719 3.65234L71.3477 21.3281C73.6914 23.6719 75 26.8555 75 30.1758V59.375H65.625V31.25H50C46.543 31.25 43.75 28.457 43.75 25V9.375H12.5C10.7812 9.375 9.375 10.7812 9.375 12.5V87.5C9.375 89.2188 10.7812 90.625 12.5 90.625ZM34.375 68.75H40.625C46.6602 68.75 51.5625 73.6523 51.5625 79.6875C51.5625 85.7227 46.6602 90.625 40.625 90.625H37.5V96.875C37.5 98.5938 36.0938 100 34.375 100C32.6562 100 31.25 98.5938 31.25 96.875V71.875C31.25 70.1562 32.6562 68.75 34.375 68.75ZM40.625 84.375C43.2227 84.375 45.3125 82.2852 45.3125 79.6875C45.3125 77.0898 43.2227 75 40.625 75H37.5V84.375H40.625ZM59.375 68.75H65.625C70.8008 68.75 75 72.9492 75 78.125V90.625C75 95.8008 70.8008 100 65.625 100H59.375C57.6562 100 56.25 98.5938 56.25 96.875V71.875C56.25 70.1562 57.6562 68.75 59.375 68.75ZM65.625 93.75C67.3438 93.75 68.75 92.3438 68.75 90.625V78.125C68.75 76.4062 67.3438 75 65.625 75H62.5V93.75H65.625ZM81.25 71.875C81.25 70.1562 82.6562 68.75 84.375 68.75H93.75C95.4688 68.75 96.875 70.1562 96.875 71.875C96.875 73.5938 95.4688 75 93.75 75H87.5V81.25H93.75C95.4688 81.25 96.875 82.6562 96.875 84.375C96.875 86.0938 95.4688 87.5 93.75 87.5H87.5V96.875C87.5 98.5938 86.0938 100 84.375 100C82.6562 100 81.25 98.5938 81.25 96.875V71.875Z"
                        fill="#727A90"
                      />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Export to PDF button (visible), triggers hidden PDFDownloadLink */}
          {!isEditMode && (
            <>
              {/* <button
                className="hidden sm:flex justify-end items-center hover:bg-gray-100 p-4 rounded-full text-[#8B8B8B] text-sm"
                onClick={() => {
                  if (pdfDownloadLinkRef.current) {
                    pdfDownloadLinkRef.current.click();
                  }
                }}
                type="button"
              >
                <span className="mr-4">Export to PDF</span>
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 100 100"
                  fill="#727A90"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.5 90.625H21.875V100H12.5C5.60547 100 0 94.3945 0 87.5V12.5C0 5.60547 5.60547 0 12.5 0H44.8242C48.1445 0 51.3281 1.30859 53.6719 3.65234L71.3477 21.3281C73.6914 23.6719 75 26.8555 75 30.1758V59.375H65.625V31.25H50C46.543 31.25 43.75 28.457 43.75 25V9.375H12.5C10.7812 9.375 9.375 10.7812 9.375 12.5V87.5C9.375 89.2188 10.7812 90.625 12.5 90.625ZM34.375 68.75H40.625C46.6602 68.75 51.5625 73.6523 51.5625 79.6875C51.5625 85.7227 46.6602 90.625 40.625 90.625H37.5V96.875C37.5 98.5938 36.0938 100 34.375 100C32.6562 100 31.25 98.5938 31.25 96.875V71.875C31.25 70.1562 32.6562 68.75 34.375 68.75ZM40.625 84.375C43.2227 84.375 45.3125 82.2852 45.3125 79.6875C45.3125 77.0898 43.2227 75 40.625 75H37.5V84.375H40.625ZM59.375 68.75H65.625C70.8008 68.75 75 72.9492 75 78.125V90.625C75 95.8008 70.8008 100 65.625 100H59.375C57.6562 100 56.25 98.5938 56.25 96.875V71.875C56.25 70.1562 57.6562 68.75 59.375 68.75ZM65.625 93.75C67.3438 93.75 68.75 92.3438 68.75 90.625V78.125C68.75 76.4062 67.3438 75 65.625 75H62.5V93.75H65.625ZM81.25 71.875C81.25 70.1562 82.6562 68.75 84.375 68.75H93.75C95.4688 68.75 96.875 70.1562 96.875 71.875C96.875 73.5938 95.4688 75 93.75 75H87.5V81.25H93.75C95.4688 81.25 96.875 82.6562 96.875 84.375C96.875 86.0938 95.4688 87.5 93.75 87.5H87.5V96.875C87.5 98.5938 86.0938 100 84.375 100C82.6562 100 81.25 98.5938 81.25 96.875V71.875Z"
                    fill="#727A90"
                  />
                </svg>
              </button> */}
              {/* Hidden PDFDownloadLink for programmatic click */}
              {/* <div style={{ display: "none" }}>
                <PDFDownloadLink
                  document={
                    <QuotationPDF
                      organisationInfo={organisationInfo}
                      formData={formData}
                      serviceItems={serviceItems}
                      calculateTotalServiceCharge={calculateTotalServiceCharge}
                      user={user}
                      dummyAvatar={dummyAvatar}
                      quotationDetails={quotationDetails}
                      servicesIncluded={servicesIncluded}
                      budgetItems={budgetItems}
                      calculateBudgetSubtotal={calculateBudgetSubtotal}
                      deliveryTerms={deliveryTerms}
                      scopeModifications={scopeModifications}
                    />
                  }
                  fileName={`Quotation-${quotationDetails.quoteNumber}.pdf`}
                  ref={pdfDownloadLinkRef}
                >
                  Download PDF
                </PDFDownloadLink>
              </div> */}
            </>
          )}
        </div>
      </div>
    );
  };

  const stripHtmlTags = (html) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const convertImageUrlForPdf = (url) => {
    if (typeof url === "string" && url.includes("/public/")) {
      const filename = url.substring(url.lastIndexOf("/") + 1);
      const publicIndex = url.indexOf("/public/");
      if (publicIndex !== -1) {
        const baseUrl = url.substring(0, publicIndex);
        return `${baseUrl}/public/api/image-proxy/${filename}`;
      }
    }
    return url;
  };

  const QuotationPDF = ({
    organisationInfo,
    formData,
    serviceItems,
    calculateTotalServiceCharge,
    user,
    dummyAvatar,
    quotationDetails,
    servicesIncluded,
    budgetItems = [],
    deliveryTerms = [],
    scopeModifications = [],
    calculateBudgetSubtotal = () => 0,
  }) => {
    const firstPageServices = servicesIncluded.slice(0, 2);
    const remainingServices = servicesIncluded.slice(2);
    const hasRemainingServices = remainingServices.length > 0;

    const paymentConditionsItems = Math.max(
      deliveryTerms.length,
      scopeModifications.length
    );
    const paymentConditionsHeight = Math.max(40, paymentConditionsItems * 38 + 2); // 45 is an estimated row height
    console.log(
      "PDF Payment Conditions Height:",
      paymentConditionsHeight,
      "Items:",
      paymentConditionsItems
    );

    // Helper for comma-separated numbers
    const formatNumber = (num) => {
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    };

    // Profile image logic
    let imageUrl = null;
    const profilePicUrl = organisationInfo?.profile_image || user?.profile_pic;
    if (
      profilePicUrl &&
      typeof profilePicUrl === "string" &&
      profilePicUrl.trim() !== "" &&
      (profilePicUrl.startsWith("http://") ||
        profilePicUrl.startsWith("https://"))
    ) {
      imageUrl = convertImageUrlForPdf(profilePicUrl);
    }

    // Office address logic
    let officeAddressLines = [
      "145 Sai Bagh Colony,",
      "Khandwa Road,",
      "Indore, Madhya Pradesh",
    ];
    const orgAddress =
      organisationInfo?.address || user?.organisationInfo?.address;
    if (orgAddress) {
      try {
        const addr = JSON.parse(orgAddress);
        officeAddressLines = [
          addr.blockUnitStreetName,
          [addr.city, addr.state].filter(Boolean).join(", "),
          [addr.country, addr.pincode].filter(Boolean).join(", "),
        ].filter(Boolean);
      } catch (e) {}
    }

    // Customer address logic
    const customerAddressLines = [
      quotationDetails.customerAddressLine1,
      quotationDetails.customerAddressLine2,
      quotationDetails.customerAddressLine3,
    ].filter(Boolean);

    // Main color palette
    const Duskwood = "#0e4053";
    const gray700 = "#4B5563";
    const gray600 = "#545454";
    const gray100 = "#F3F4F6";
    const gray50 = "#F8FAFC";
    const white = "#FFFFFF";
    const dark = "#364153";
    const gray900 = "#1F2937";
    const gray800 = "#4B5563";
    const gray400 = "#8B8B8B";
    const gray200 = "#E5E7EB";
    const gray300 = "#E7EFF8";
    const grayText = "#545454";
    const DuskwoodDark = "#0e4053";
    const Duskwood700 = "#0e4053";

    // PDF styles (translated from Tailwind/CSS)
    const pdfStyles = StyleSheet.create({
      page: {
        backgroundColor: white,
        minHeight: "100vh",
        borderRadius: 16,
        padding: 0,
        fontFamily: "Helvetica",
      },
      container: {
        width: "100%",
        minHeight: "100vh",
        borderRadius: 16,
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      },
      headerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 32,
        marginTop: 5,
        paddingHorizontal: 25,
        gap: 24,
      },
      headerLeft: {
        flexDirection: "column",
        flexGrow: 2,
        marginTop: 32,
      },
      profileRow: {
        flexDirection: "column",
        alignItems: "flex-start",
        marginBottom: 16,
      },
      profileImage: {
        width: 120,
        height: 50,
        marginBottom: 8,
        objectFit: "contain",
      },
      orgName: {
        fontSize: 24,
        color: gray900,
      },
      headerDetails: {
        flexDirection: "column",
        alignItems: "flex-start",
        marginTop: 12,
      },
      headerDetailText: {
        fontSize: 12,
        color: gray700,
        marginBottom: 2,
      },
      headerRight: {
        flex: 1,
        alignItems: "flex-end",
        justifyContent: "flex-end",
        position: "relative",
        marginTop: 150,
      },
      quotationTitle: {
        color: Duskwood,
        fontSize: 32,
        fontWeight: "bold",
        fontFamily: "Helvetica-Bold",
        textAlign: "right",
      },
      addressSection: {
        backgroundColor: gray50,
        paddingVertical: 24,
        paddingHorizontal: 25,
        marginBottom: 10,
        flexDirection: "column",
      },
      addressRow: {
        flexDirection: "row",
        justifyContent: "space-between",
      },
      addressBlock: {
        flexDirection: "column",
        alignItems: "flex-start",
      },
      addressTitle: {
        fontWeight: "bold",
        fontSize: 14,
        color: gray700,
        marginBottom: 2,
      },
      addressLine: {
        fontSize: 10,
        color: gray700,
        marginBottom: 2,
      },
      toBlock: {
        flexDirection: "column",
        alignItems: "flex-start",
      },
      toTitle: {
        fontWeight: "bold",
        fontSize: 14,
        color: gray700,
        marginBottom: 2,
      },
      toLine: {
        fontSize: 10,
        color: gray700,
        marginBottom: 2,
      },
      dearSirSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
      },
      dearSirHeading: {
        fontSize: 20,
        fontWeight: "bold",
        color: Duskwood,
        marginBottom: 8,
      },
      dearSirText: {
        fontSize: 12,
        color: gray600,
        lineHeight: 1.5,
      },
      projectOverviewRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 24,
        paddingHorizontal: 25,
      },
      projectOverviewLeft: {
        width: 120,
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 20,
      },
      projectOverviewIconWrap: {
        backgroundColor: gray100,
        borderRadius: 24,
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
      },
      projectOverviewCenter: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      projectOverviewRight: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
      projectOverviewTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: gray800,
        marginBottom: 4,
      },
      projectOverviewGrid: {
        flexDirection: "row",
        backgroundColor: gray100,
        borderRadius: 8,
        padding: 12,
        justifyContent: "space-between",
        width: "100%",
      },
      projectOverviewCol: {
        flex: 1,
        paddingHorizontal: 4,
        alignItems: "flex-start",
      },
      projectOverviewLabel: {
        fontWeight: "bold",
        fontSize: 10,
        color: gray800,
        marginBottom: 2,
      },
      projectOverviewValue: {
        fontSize: 10,
        color: gray700,
        whiteSpace: "nowrap",
      },
      sectionTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 24,
        paddingHorizontal: 25,
      },
      sectionTitleLeft: {
        width: 120,
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 20,
      },
      sectionTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: gray800,
        marginBottom: 4,
      },
      sectionTitleCenter: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      sectionTitleRight: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
      servicesGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 24,
        paddingHorizontal: 25,
        marginBottom: 24,
      },
      serviceCard: {
        width: "48%",
        backgroundColor: white,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        borderWidth: 1,
        borderColor: gray200,
      },
      serviceIndex: {
        fontWeight: "bold",
        fontSize: 18,
        color: Duskwood,
        marginRight: 8,
        flexShrink: 0,
      },
      serviceContent: {
        flex: 1,
        flexDirection: "column",
      },
      serviceTitle: {
        fontWeight: "bold",
        fontSize: 16,
        color: Duskwood,
        marginBottom: 2,
      },
      serviceDesc: {
        fontSize: 10,
        color: gray700,
        marginBottom: 4,
      },
      serviceBullets: {
        flexDirection: "column",
        marginLeft: 8,
      },
      serviceBulletRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 2,
      },
      serviceBulletIcon: {
        marginRight: 4,
        width: 8,
        height: 8,
      },
      serviceBulletText: {
        fontSize: 10,
        color: gray700,
      },
      budgetSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
      },
      budgetTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
      },
      budgetTitleLeft: {
        width: 120,
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 20,
      },
      budgetTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: gray800,
        marginBottom: 2,
      },
      budgetTitleCenter: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      budgetTitleRight: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
      budgetDate: {
        fontSize: 10,
        color: gray600,
        marginBottom: 2,
      },
      budgetTable: {
        flexDirection: "column",
        width: "100%",
        marginTop: 8,
        marginBottom: 8,
      },
      budgetTableHeaderRow: {
        flexDirection: "row",
      },
      budgetTableHeaderCell: {
        fontSize: 10,
        fontWeight: "bold",
        color: white,
        padding: 8,
        textAlign: "center",
        flex: 1,
      },
      budgetTableHeaderCellDesc: {
        flex: 3,
        textAlign: "left",
      },
      budgetTableHeaderCellAmount: {
        backgroundColor: gray700,
        color: white,
        textAlign: "right",
        flex: 2,
      },
      budgetTableRow: {
        flexDirection: "row",
        alignItems: "center",

        minHeight: 32,
      },
      budgetTableCell: {
        fontSize: 10,
        color: gray700,
        padding: 8,
        textAlign: "center",
      },
      budgetTableCellDesc: {
        flex: 3,
        textAlign: "left",
        flexDirection: "row",
        alignItems: "center",
      },
      budgetTableCellAmount: {
        color: gray700,
        textAlign: "right",
        flex: 2,
      },
      budgetSubtotalRow: {
        flexDirection: "row",
        backgroundColor: gray100,
        alignItems: "center",
        fontWeight: "bold",
      },
      budgetSubtotalCell: {
        fontSize: 10,
        color: Duskwood,
        padding: 8,
        textAlign: "left",
        flex: 3,
        fontWeight: "bold",
      },
      budgetSubtotalCellAmount: {
        fontSize: 10,
        color: Duskwood,
        padding: 8,
        textAlign: "right",
        flex: 2,
        fontWeight: "bold",
      },
      budgetTotalRow: {
        flexDirection: "row",
        alignItems: "center",
        fontWeight: "bold",
      },
      budgetTotalCell: {
        fontSize: 12,
        color: Duskwood,
        padding: 8,
        textAlign: "left",
        flex: 3,
        fontWeight: "bold",
      },
      budgetTotalCellAmount: {
        fontSize: 12,
        color: Duskwood,
        padding: 8,
        textAlign: "right",
        flex: 2,
        fontWeight: "bold",
      },
      paymentSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
      },
      paymentTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
      },
      paymentTitleLeft: {
        width: 120,
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 20,
      },
      paymentTitle: {
        fontSize: 14,
        fontWeight: "bold",
        color: gray800,
        marginBottom: 2,
      },
      paymentTitleCenter: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      paymentTitleRight: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
      paymentGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginTop: 4,
      },
      paymentCard: {
        width: "48%",
        backgroundColor: gray100,
        borderRadius: 8,
        padding: 16,

        borderWidth: 1,
        borderColor: gray100,
      },
      paymentLabel: {
        fontSize: 8,
        color: gray600,
        fontWeight: "bold",
        textTransform: "uppercase",
        marginBottom: 2,
      },
      paymentValue: {
        fontSize: 10,
        color: gray900,
        fontWeight: "medium",
      },
      conditionsSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
      },
      conditionsTitleRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
      },
      conditionsTitleLeft: {
        width: 120,
        flexDirection: "column",
        alignItems: "flex-start",
        marginRight: 20,
      },
      conditionsTitle: {
        fontSize: 15,
        fontWeight: "bold",
        color: gray800,
        marginBottom: 2,
      },
      conditionsTitleCenter: {
        width: 48,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      },
      conditionsTitleRight: {
        flex: 1,
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
      conditionsGrid: {
        flexDirection: "row",
        gap: 24,
        marginTop: 8,
      },
      conditionsCol: {
        flex: 1,
        flexDirection: "column",
        marginRight: 16,
      },
      conditionsColTitle: {
        fontWeight: "bold",
        fontSize: 11,
        color: gray700,
        marginBottom: 4,
      },
      conditionsList: {
        flexDirection: "column",
      },
      conditionsListItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 4,
      },
      conditionsBulletIcon: {
        marginRight: 4,
        width: 8,
        height: 8,
      },
      conditionsBulletText: {
        fontSize: 10,
        color: gray700,
      },
      closingSection: {
        paddingHorizontal: 25,
        marginBottom: 24,
        marginTop: 20,
        alignItems: "center",
        justifyContent: "center",
      },
      closingText: {
        fontSize: 12,
        color: gray600,
        textAlign: "center",
        marginBottom: 8,
        maxWidth: 400,
      },
      closingTitle: {
        fontSize: 16,
        fontWeight: "bold",
        color: DuskwoodDark,
        textTransform: "uppercase",
        textAlign: "center",
        marginBottom: 8,
      },
    });

    // --- PDF Layout ---
    return (
      <Document>
        <Page size="A4" style={pdfStyles.page}>
          <View style={pdfStyles.container}>
            {/* Header Section */}
            <View style={pdfStyles.headerRow}>
              <View style={pdfStyles.headerLeft}>
                <View style={pdfStyles.profileRow}>
                  {imageUrl && (
                    <Image src={imageUrl} style={pdfStyles.profileImage} />
                  )}
                  <Text style={pdfStyles.orgName}>
                    {organisationInfo?.organizationname ||
                      user?.organisationInfo?.organizationname ||
                      "JG POWERS"}
                  </Text>
                </View>
                <View style={pdfStyles.headerDetails}>
                  <Text style={pdfStyles.headerDetailText}>
                    <Text style={{ fontWeight: "bold" }}>Quote #:</Text>{" "}
                    {quotationDetails.quoteNumber}
                  </Text>
                  <Text style={pdfStyles.headerDetailText}>
                    <Text style={{ fontWeight: "bold" }}>Date:</Text>{" "}
                    {quotationDetails.quoteDate}
                  </Text>
                  <Text style={pdfStyles.headerDetailText}>
                    <Text style={{ fontWeight: "bold" }}>Valid Until:</Text>{" "}
                    {quotationDetails.validUntil}
                  </Text>
                </View>
              </View>
              <View style={pdfStyles.headerRight}>
                {/* <Image
                  src={"/quotation-text.png"}
                  style={{ width: 150, height: 40, marginBottom: 0 }}
                  cache={false}
                /> */}
                <Text style={pdfStyles.orgName}>
                    {organisationInfo?.organizationname ||
                      user?.organisationInfo?.organizationname ||
                      "ORDER"}
                  </Text>
              </View> 
            </View>
            <View
              style={{
                backgroundColor: gray50,
              }}
            >
              {/* Address Section */}
              <View style={pdfStyles.addressSection}>
                <View style={pdfStyles.addressRow}>
                  <View style={pdfStyles.addressBlock}>
                    <Text style={pdfStyles.addressTitle}>Office</Text>
                    {officeAddressLines.map((line, idx) => (
                      <Text key={idx} style={pdfStyles.addressLine}>
                        {line}
                      </Text>
                    ))}
                  </View>
                  <View style={pdfStyles.toBlock}>
                    <Text style={pdfStyles.toTitle}>
                      To: {quotationDetails.customerName}
                    </Text>
                    {customerAddressLines.map((line, idx) => (
                      <Text key={idx} style={pdfStyles.toLine}>
                        {line}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>

              {/* Main Content Grid (Stepper Sections) */}
              {/* 1. Dear Sir Section (spans all columns) */}

              <View
                style={{
                  flexDirection: "row",
                  paddingHorizontal: 25,
                  marginBottom: 26,
                }}
              >
                <View style={{ flex: 1, paddingRight: 20, marginBottom: 15 }}>
                  <Text style={pdfStyles.dearSirHeading}>Dear Sir,</Text>
                  <Text style={pdfStyles.dearSirText}>
                    {stripHtmlTags(quotationDetails.dearSirMessage)}
                  </Text>
                </View>
              </View>
              {/* 4. Budget Breakdown Section */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 24,
                  paddingHorizontal: 25,
                }}
              >
                {/* Left: Title and date */}
                <View
                  style={{
                    flex: 1,
                    paddingRight: 20,
                    justifyContent: "flex-start",
                  }}
                >
                  <Text style={pdfStyles.budgetTitle}>
                    ORDER {"\n"}BREAKDOWN
                  </Text>
                </View>
                {/* Center: Stepper */}
                <View
                  style={{
                    width: 48,
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Top vertical line */}

                  {/* Circle with number */}
                  <View
                    style={{
                      backgroundColor: Duskwood,
                      borderRadius: 24,
                      width: 40,
                      height: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    <Text
                      style={{ color: white, fontWeight: "bold", fontSize: 12 }}
                    >
                      01.
                    </Text>
                  </View>
                  {/* Bottom vertical line */}
                  <View
                    style={{
                      width: 2,
                      height: Math.max(80, budgetItems.length * 45), // 32px per budget row, min 80
                      backgroundColor: Duskwood,
                      position: "absolute",
                      top: 40,
                      left: 23,
                      zIndex: 0,
                    }}
                  />
                  {/* Bottom dot */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: Duskwood,
                      position: "absolute",
                      top: Math.max(80, budgetItems.length * 45) + 40, // 48 = top:48 + circle radius
                      left: 20,
                    }}
                  />
                </View>
                {/* Right: Content */}
                <View style={{ flex: 3, paddingLeft: 20 }}>
                  <View style={pdfStyles.budgetTable}>
                    {/* Header */}
                    <View style={pdfStyles.budgetTableHeaderRow}>
                      <Text
                        style={[
                          pdfStyles.budgetTableHeaderCell,
                          pdfStyles.budgetTableHeaderCellDesc,
                          { backgroundColor: Duskwood },
                        ]}
                      >
                        Description
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTableHeaderCell,
                          { flex: 0.5, backgroundColor: Duskwood },
                        ]}
                      >
                        Qty
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTableHeaderCell,
                          { flex: 0.5, backgroundColor: Duskwood },
                        ]}
                      >
                        Rate
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTableHeaderCell,
                          { flex: 0.1, backgroundColor: gray50 },
                        ]}
                      >
                        {" "}
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTableHeaderCell,
                          pdfStyles.budgetTableHeaderCellAmount,
                          { flex: 1.5 },
                        ]}
                      >
                        Amount
                      </Text>
                    </View>
                    {/* Rows */}
                    {budgetItems.map((item, idx) => (
                      <View key={idx} style={pdfStyles.budgetTableRow}>
                        <View
                          style={[
                            pdfStyles.budgetTableCell,
                            { flex: 3, textAlign: "left" },
                          ]}
                        >
                          <View
                            style={{ flexDirection: "row", alignItems: "center" }}
                          >
                            <Svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              style={{ marginRight: 4 }}
                            >
                              <Path
                                fill={Duskwood}
                                d="m10.537 12l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354zm6.1 0l-4.24-4.246q-.141-.14-.154-.341t.153-.367q.16-.16.354-.16t.354.16l4.388 4.389q.131.13.184.267t.053.298t-.053.298t-.184.268l-4.388 4.388q-.14.14-.341.153t-.367-.153q-.16-.16-.16-.354t.16-.354z"
                              />
                            </Svg>
                            <Text style={{ fontSize: 10 }}>
                              {item.description}
                            </Text>
                          </View>
                        </View>
                        <Text style={[pdfStyles.budgetTableCell, { flex: 0.5 }]}>
                          {item.qty}
                        </Text>
                        <Text style={[pdfStyles.budgetTableCell, { flex: 0.5 }]}>
                          {item.rate}
                        </Text>
                        <Text style={[pdfStyles.budgetTableCell, { flex: 0.1 }]}>
                          {" "}
                        </Text>
                        <Text
                          style={[
                            pdfStyles.budgetTableCell,
                            { flex: 1.5, textAlign: "left" },
                          ]}
                        >
                          Rs{" "}
                          {formatNumber(
                            parseFloat(item.qty) * parseFloat(item.rate) || 0
                          )}
                        </Text>
                      </View>
                    ))}
                    {/* Subtotal */}
                    <View style={pdfStyles.budgetSubtotalRow}>
                      <Text style={[pdfStyles.budgetSubtotalCell, { flex: 4 }]}>
                        Sub total
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTableCell,
                          { flex: 0.1, backgroundColor: gray50 },
                        ]}
                      >
                        {" "}
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetSubtotalCellAmount,
                          { flex: 1.5, textAlign: "right" },
                        ]}
                      >
                        Rs {formatNumber(calculateBudgetSubtotal())}
                      </Text>
                    </View>
                    {/* Total */}
                    <View style={pdfStyles.budgetTotalRow}>
                      <Text
                        style={[
                          pdfStyles.budgetTotalCell,
                          { flex: 4, borderTopWidth: 2, borderTopColor: Duskwood },
                        ]}
                      >
                        TOTAL
                      </Text>
                      <Text style={[pdfStyles.budgetTableCell, { flex: 0.1 }]}>
                        {" "}
                      </Text>
                      <Text
                        style={[
                          pdfStyles.budgetTotalCellAmount,
                          {
                            flex: 1.5,
                            textAlign: "right",
                            borderTopWidth: 2,
                            borderTopColor: Duskwood,
                          },
                        ]}
                      >
                        Rs {formatNumber(calculateBudgetSubtotal())}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 2. Project Overview Section */}
              {/* 3. Services Included Section */}
            </View>
          </View>
        </Page>

        <Page size="A4" style={[pdfStyles.page, { backgroundColor: gray50 }]}>
          <View style={pdfStyles.container}>
            <View
              style={{
                backgroundColor: gray50,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  marginBottom: 24,
                  paddingHorizontal: 25,
                  marginTop: 20,
                }}
              >
                {/* Left: Title */}
                <View
                  style={{
                    flex: 1,
                    paddingRight: 20,
                    justifyContent: "flex-start",
                  }}
                >
                  <Text style={pdfStyles.paymentTitle}>
                    PAYMENT {"\n"}INFORMATION
                  </Text>
                </View>
                {/* Center: Stepper */}
                <View
                  style={{
                    width: 48,
                    alignItems: "center",
                    position: "relative",
                  }}
                >
                  {/* Top vertical line */}

                  {/* Circle with number */}
                  <View
                    style={{
                      backgroundColor: gray100,
                      borderRadius: 24,
                      width: 44,
                      height: 44,
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    <Svg width="43" height="43" viewBox="-8 -8 40 40">
                      <Path
                        fill={Duskwood}
                        d="m14.022 16.483l-3.568 2.649c-.21.16-.52.48-.85.71a.7.7 0 0 1-.4.19a1.8 1.8 0 0 1-1.06-.55a14.5 14.5 0 0 1-1.448-1.69c-.79-1-1.56-1.999-2.3-2.999s-1.419-2.049-2.069-3.118c-1.349-2.18-1.269-1.41-.75-1.97q.47-.53 1-.999t1.11-.87l1.999-1.589l.66-.51c.16 0 .33.18.51.34q.372.349.7.74l.999 1.2l3.278 4.387a.361.361 0 1 0 .58-.43L9.254 7.488l-.95-1.26a7 7 0 0 0-1.119-1.16a1.48 1.48 0 0 0-.94-.32a1.4 1.4 0 0 0-.509.2q-.348.222-.66.49l-1.999 1.48c-.43.29-.84.59-1.24.91q-.6.497-1.139 1.059a4.6 4.6 0 0 0-.64.78a.7.7 0 0 0 0 .56q.144.381.36.73c.28.469.65.929.91 1.349c.65 1.089 1.34 2.168 2.119 3.208s1.6 2 2.449 2.999a11.5 11.5 0 0 0 1.999 1.999c.384.28.844.44 1.32.46a1.4 1.4 0 0 0 .76-.27q.526-.41.999-.88c.68-.56 1.36-1.14 1.999-1.689q.68-.549 1.38-1.08a.32.32 0 0 0-.36-.52z"
                      />
                      <Path
                        fill={Duskwood}
                        d="m14.022 16.483l-3.568 2.649c-.21.16-.52.48-.85.71a.7.7 0 0 1-.4.19a1.8 1.8 0 0 1-1.06-.55a14.5 14.5 0 0 1-1.448-1.69c-.79-1-1.56-1.999-2.3-2.999s-1.419-2.049-2.069-3.118c-1.349-2.18-1.269-1.41-.75-1.97q.47-.53 1-.999t1.11-.87l1.999-1.589l.66-.51c.16 0 .33.18.51.34q.372.349.7.74l.999 1.2l3.278 4.387a.361.361 0 1 0 .58-.43L9.254 7.488l-.95-1.26a7 7 0 0 0-1.119-1.16a1.48 1.48 0 0 0-.94-.32a1.4 1.4 0 0 0-.509.2q-.348.222-.66.49l-1.999 1.48c-.43.29-.84.59-1.24.91q-.6.497-1.139 1.059a4.6 4.6 0 0 0-.64.78a.7.7 0 0 0 0 .56q.144.381.36.73c.28.469.65.929.91 1.349c.65 1.089 1.34 2.168 2.119 3.208s1.6 2 2.449 2.999a11.5 11.5 0 0 0 1.999 1.999c.384.28.844.44 1.32.46a1.4 1.4 0 0 0 .76-.27q.526-.41.999-.88c.68-.56 1.36-1.14 1.999-1.689q.68-.549 1.38-1.08a.32.32 0 0 0-.36-.52z"
                      />
                      <Path
                        fill={Duskwood}
                        d="M8.914 11.175a2.38 2.38 0 0 0-2.998-.27a2.45 2.45 0 0 0-.89 1.74a2.15 2.15 0 0 0 .74 1.809c.396.308.887.47 1.39.46c.467.007.928-.117 1.329-.36a.33.33 0 0 0 .12-.44a.35.35 0 0 0 .27-.1a1.83 1.83 0 0 0 .04-2.839m-.58 2.309a.35.35 0 0 0 0 .47h-.12a1.76 1.76 0 0 1-.999.12a1.27 1.27 0 0 1-.77-.39a1.14 1.14 0 0 1-.23-1a1.33 1.33 0 0 1 .46-.89a1.24 1.24 0 0 1 1.55.07a1 1 0 0 1 .11 1.62m9.014-7.077a14 14 0 0 0-.379-1.55a7 7 0 0 0-.54-1.229a1.77 1.77 0 0 0-.81-.75a1.6 1.6 0 0 0-.74-.08q-.646.12-1.268.33a.324.324 0 0 0 .15.63q.495-.099.999-.13a.86.86 0 0 1 .45.09c.14.08.2.26.28.43q.215.518.32 1.07c.19.56.32 1.13.46 1.699s.33 1.17.49 1.75s.249.819.249.829c.08.42.62.08.66-.53c-.2-1.03-.12-1.53-.32-2.559"
                      />
                      <Path
                        fill={dark}
                        d="M23.968 16.523a7.7 7.7 0 0 0-.51-2.12a6.7 6.7 0 0 0-1.12-1.889a8.18 8.18 0 0 0-4.367-2.598c-.36-.17-.63.09-.62.52a5.7 5.7 0 0 1-.71 1.579a2.71 2.71 0 0 1-2.759.38a1.35 1.35 0 0 0-.83.09a1.54 1.54 0 0 0-1.079 1.529a2 2 0 0 0 .8 1.609c.13.07.4.2.74.34c.77.32 1.999.74 2.469 1c-.08.2.21.73.26.88a5.5 5.5 0 0 0 1.069 1.808a1.81 1.81 0 0 0 1.44.62a.36.36 0 1 0 0-.72a1.1 1.1 0 0 1-.82-.45a4.3 4.3 0 0 1-.76-1.559c-.05-.18-.07-.75-.15-1a.6.6 0 0 0-.24-.34a5.6 5.6 0 0 0-.74-.399c-.87-.4-2.288-1-2.618-1.2a.77.77 0 0 1-.21-.57a.41.41 0 0 1 .25-.42a1 1 0 0 1 .35 0q.732.074 1.469.06a3 3 0 0 0 2.209-1.289a3.26 3.26 0 0 0 .48-1.709a7.6 7.6 0 0 1 3.448 2.56c.37.497.672 1.042.9 1.618c.234.583.402 1.19.5 1.81c.23 1.504.161 3.04-.2 4.518a.37.37 0 0 0 .25.45a.36.36 0 0 0 .44-.25c.556-1.556.78-3.21.66-4.858"
                      />
                      <Path
                        fill={Duskwood}
                        d="M14.852 10.066c-.29-1-.55-2-.83-3c-.18-.669-.39-1.329-.58-1.998a7.7 7.7 0 0 0-.75-2a1.45 1.45 0 0 0-1.079-.71a.87.87 0 0 0-.46.1q-.383.23-.74.5l-2.438 1.55a.32.32 0 1 0 .27.57l2.639-1.26c.45-.23.58-.89 1 .3c.18.48.29 1 .37 1.29c.389 1.189.769 2.368 1.189 3.548s.69 1.61 1.14 2.669c.199.58.719.72.719.29c-.21-.7-.24-1.15-.45-1.85"
                      />
                    </Svg>
                  </View>
                  {/* Bottom vertical line */}
                  <View
                    style={{
                      width: 2,
                      height: 135,
                      backgroundColor: Duskwood,
                      position: "absolute",
                      top: 42,
                      left: 23,
                      zIndex: 0,
                    }}
                  />
                  {/* Bottom dot */}
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: Duskwood,
                      position: "absolute",
                      top: 175,
                      left: 20,
                    }}
                  />
                </View>
                {/* Right: Content */}
                <View style={{ flex: 3, paddingLeft: 20 }}>
                  <View style={pdfStyles.paymentGrid}>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>Account Name</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.accountName}
                      </Text>
                    </View>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>Bank Name</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.bankName}
                      </Text>
                    </View>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>Account Number</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.accountNumber}
                      </Text>
                    </View>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>IFSC Code</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.ifscCode}
                      </Text>
                    </View>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>GSTIN</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.gstin}
                      </Text>
                    </View>
                    <View style={pdfStyles.paymentCard}>
                      <Text style={pdfStyles.paymentLabel}>Branch</Text>
                      <Text style={pdfStyles.paymentValue}>
                        {quotationDetails.branch}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* 4. Budget Breakdown Section */}

              <View style={pdfStyles.closingSection}>
              <Text style={pdfStyles.closingText}>
                Thank you for the opportunity to serve you. We look forward to
                further communication with you after you have reviewed this
                proposal.
              </Text>
              <Text style={pdfStyles.closingTitle}>
              </Text>
            </View>
            </View>
          </View>
        </Page>
      </Document>
    );
  };

  // Helper to parse bulletpoints JSON string to array
  const parseBulletpoints = (bulletpoints) => {
    if (!bulletpoints) return [];
    try {
      const obj =
        typeof bulletpoints === "string"
          ? JSON.parse(bulletpoints)
          : bulletpoints;
      // Get values sorted by key (bulletpoint1, bulletpoint2, ...)
      return Object.keys(obj)
        .sort((a, b) => {
          // Extract numbers for sorting
          const numA = parseInt(a.replace(/\D/g, ""));
          const numB = parseInt(b.replace(/\D/g, ""));
          return numA - numB;
        })
        .map((key) => obj[key]);
    } catch (e) {
      return [];
    }
  };

  export default QuotationCreate;
