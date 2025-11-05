import api from "@/api";
import React, { useState, useEffect, useRef } from "react";
import Swal from "sweetalert2"; // Import SweetAlert2
import { Country, State, City } from "country-state-city";
import {
  Document,
  Page,
  Text,
  View as PDFView,
  StyleSheet,
  PDFDownloadLink,
  Image as PDFImage,
} from "@react-pdf/renderer";

// PDF Styles (pixel-perfect, Tailwind-inspired)
const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 16, // reduce padding for more content
    minHeight: "100vh",
    borderRadius: 16, // matches rounded-2xl
    fontFamily: "Helvetica",
    fontSize: 10, // base font size smaller
    maxHeight: 842, // A4 height in pt
    maxWidth: 595, // A4 width in pt
  },
  headerSection: {
    flexDirection: "row",
    marginBottom: 16, // reduce spacing
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logo: {
    width: 64, // smaller logo
    height: 64,
    borderRadius: 9999,
    marginRight: 12, // tighter spacing
    objectFit: "cover",
  },
  companyInfo: {
    flexDirection: "column",
    flexGrow: 1,
  },
  companyName: {
    fontSize: 20, // smaller title
    fontWeight: "bold",
    color: "#0e4053", // text-[rgb(39,152,255)]
    marginBottom: 2,
  },
  address: {
    fontSize: 9,
    color: "#1F2937", // text-[rgb(31,41,55)]
    marginBottom: 1,
  },
  contactRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 1,
  },
  contact: {
    fontSize: 9,
    color: "#1F2937",
    marginRight: 8,
  },
  invoiceTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0e4053",
    textAlign: "right",
  },
  divider: {
    width: "100%",
    height: 1, // thinner divider
    backgroundColor: "#0e4053",
    marginVertical: 6,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 9,
    color: "#4B5563",
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
  partyBlock: {
    flex: 1,
    paddingRight: 8, // tighter
    paddingLeft: 0,
  },
  partyBlockRight: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 0,
  },
  partyLabel: {
    fontWeight: "bold",
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 4,
  },
  partyField: {
    fontSize: 10,
    color: "#1F2837",
    fontWeight: "600",
    marginBottom: 1,
  },
  partyAddress: {
    fontSize: 9,
    color: "#545454",
    marginBottom: 1,
  },
  partyContact: {
    fontSize: 9,
    color: "#545454",
    marginBottom: 1,
  },
  table: {
    width: "100%",
    marginTop: 0,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#E7EFF8",
    color: "#4B5563",
    fontWeight: "bold",
    fontSize: 10,
  },
  th: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 9,
    // Remove any top/bottom border
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  thDesc: { width: "50%", textAlign: "left" },
  thQty: { width: "10%", textAlign: "center" },
  thRate: { width: "16.6%", textAlign: "right" },
  thGst: { width: "10%", textAlign: "center" },
  thAmt: { width: "13.4%", textAlign: "right" },
  td: {
    padding: 4,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
    fontSize: 9,
    color: "#545454",
    textAlign: "center",
    // Remove any top/bottom border
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  tdDesc: { width: "50%", textAlign: "left" },
  tdQty: { width: "10%", textAlign: "center" },
  tdRate: { width: "16.6%", textAlign: "right" },
  tdGst: { width: "10%", textAlign: "center" },
  tdAmt: { width: "13.4%", textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    // Remove bottom border
    borderBottomWidth: 0,
    borderColor: "#E5E7EB",
    flexGrow: 1, // Make each row grow to fill available vertical space
  },
  totalsBlock: {
    marginTop: 0,
    alignItems: "flex-end",
    flexDirection: "column",
    gap: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    fontSize: 9,
    color: "#1F2837",
  },
  totalLabel: { fontWeight: "bold" },
  totalValue: { fontWeight: "bold" },
  bankBlock: {
    marginTop: 0,
    fontSize: 9,
    color: "#4B5563",
    width: "50%",
    paddingRight: 8,
  },
  bankBlockRight: {
    marginTop: 0,
    fontSize: 9,
    color: "#4B5563",
    width: "50%",
    textAlign: "right",
    paddingLeft: 8,
  },
  termsBlock: {
    marginTop: 0,
    fontSize: 8,
    color: "#4B5563",
    width: "50%",
    paddingRight: 8,
  },
  signBlock: {
    width: "50%",
    textAlign: "center",
    paddingLeft: 8,
  },
  seal: {
    width: 48,
    height: 48,
    margin: "0 auto 4px auto",
    objectFit: "contain",
  },
  signatory: {
    fontWeight: "bold",
    fontSize: 9,
    color: "#1F2837",
    textAlign: "center",
    marginTop: 4,
  },
  tableBody: {
    // New style for the table body container
    flexGrow: 1,
    flexDirection: "column",
  },
});

const InvoicePDF = ({ invoiceData, serviceItems, organizationEmail, user }) => (
  <Document>
    <Page size="A4" style={pdfStyles.page}>
      {/* Header */}
      <PDFView style={pdfStyles.headerSection}>
        <PDFView style={{ flexDirection: "row", alignItems: "center" }}>
          {user?.profile_pic && (
            <PDFImage src={user.profile_pic} style={pdfStyles.logo} />
          )}
          <PDFView style={pdfStyles.companyInfo}>
            <Text style={pdfStyles.companyName}>{invoiceData.companyName}</Text>
            {/* Address block: match view mode */}
            {invoiceData.addressLine1 && (
              <Text style={pdfStyles.address}>{invoiceData.addressLine1}</Text>
            )}
            {invoiceData.addressLine2 && (
              <Text style={pdfStyles.address}>{invoiceData.addressLine2}</Text>
            )}
            <PDFView style={pdfStyles.contactRow}>
              {organizationEmail && (
                <Text style={pdfStyles.contact}>
                  Email: {organizationEmail}
                </Text>
              )}
              <Text style={pdfStyles.contact}>
                Mobile: {invoiceData.mobile}
              </Text>
            </PDFView>
          </PDFView>
        </PDFView>
        <Text style={pdfStyles.invoiceTitle}>INVOICE</Text>
      </PDFView>
      <PDFView style={pdfStyles.divider} />
      {/* Invoice Details */}
      <PDFView style={pdfStyles.detailsRow}>
        <Text>Invoice No.: {invoiceData.invoiceNo}</Text>
        <Text>Invoice Date: {invoiceData.invoiceDate}</Text>
      </PDFView>
      <PDFView style={pdfStyles.divider} />
      {/* Bill To / Ship To */}
      <PDFView
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 32, // mb-8
        }}
      >
        {/* Bill To */}
        <PDFView style={pdfStyles.partyBlock}>
          <Text style={pdfStyles.partyLabel}>BILL TO</Text>
          <Text style={pdfStyles.partyField}>{invoiceData.billToName}</Text>
          {invoiceData.billToAddress?.blockUnitStreetName && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.billToAddress.blockUnitStreetName}
            </Text>
          )}
          {(invoiceData.billToAddress?.state ||
            invoiceData.billToAddress?.city) && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.billToAddress?.state}
              {invoiceData.billToAddress?.state &&
              invoiceData.billToAddress?.city
                ? ", "
                : ""}
              {invoiceData.billToAddress?.city}
            </Text>
          )}
          {(invoiceData.billToAddress?.pincode ||
            invoiceData.billToAddress?.country) && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.billToAddress?.pincode}
              {invoiceData.billToAddress?.pincode &&
              invoiceData.billToAddress?.country
                ? ", "
                : ""}
              {invoiceData.billToAddress?.country}
            </Text>
          )}
          {invoiceData.billToEmail && (
            <Text style={pdfStyles.partyContact}>
              Email: {invoiceData.billToEmail}
            </Text>
          )}
          {invoiceData.billToPhone && (
            <Text style={pdfStyles.partyContact}>
              Mobile: {invoiceData.billToPhone}
            </Text>
          )}
          {invoiceData.billToAddress?.gstin && (
            <Text style={pdfStyles.partyContact}>
              GSTIN: {invoiceData.billToAddress.gstin}
            </Text>
          )}
        </PDFView>
        {/* Ship To */}
        <PDFView style={pdfStyles.partyBlockRight}>
          <Text style={pdfStyles.partyLabel}>SHIP TO</Text>
          <Text style={pdfStyles.partyField}>{invoiceData.shipToName}</Text>
          {invoiceData.shipToAddress?.blockUnitStreetName && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.shipToAddress.blockUnitStreetName}
            </Text>
          )}
          {(invoiceData.shipToAddress?.state ||
            invoiceData.shipToAddress?.city) && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.shipToAddress?.state}
              {invoiceData.shipToAddress?.state &&
              invoiceData.shipToAddress?.city
                ? ", "
                : ""}
              {invoiceData.shipToAddress?.city}
            </Text>
          )}
          {(invoiceData.shipToAddress?.pincode ||
            invoiceData.shipToAddress?.country) && (
            <Text style={pdfStyles.partyAddress}>
              {invoiceData.shipToAddress?.pincode}
              {invoiceData.shipToAddress?.pincode &&
              invoiceData.shipToAddress?.country
                ? ", "
                : ""}
              {invoiceData.shipToAddress?.country}
            </Text>
          )}
          {invoiceData.shipToEmail && (
            <Text style={pdfStyles.partyContact}>
              Email: {invoiceData.shipToEmail}
            </Text>
          )}
          {invoiceData.shipToPhone && (
            <Text style={pdfStyles.partyContact}>
              Mobile: {invoiceData.shipToPhone}
            </Text>
          )}
          {invoiceData.shipToAddress?.gstin && (
            <Text style={pdfStyles.partyContact}>
              GSTIN: {invoiceData.shipToAddress.gstin}
            </Text>
          )}
        </PDFView>
      </PDFView>
      {/* Items Table - EXTENDED */}
      <PDFView
        style={{
          ...pdfStyles.table,
          minHeight: 320,
          flexGrow: 1,
          marginBottom: 24,
        }}
      >
        <PDFView style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.th, pdfStyles.thDesc]}>ITEMS</Text>
          <Text style={[pdfStyles.th, pdfStyles.thQty]}>QTY</Text>
          <Text style={[pdfStyles.th, pdfStyles.thRate]}>RATE</Text>
          <Text style={[pdfStyles.th, pdfStyles.thGst]}>GST</Text>
          <Text style={[pdfStyles.th, pdfStyles.thAmt]}>AMOUNT</Text>
        </PDFView>
        <PDFView style={pdfStyles.tableBody}>
          {" "}
          {/* Wrap rows in a new flex container */}
          {serviceItems.map((item, idx) => (
            <PDFView style={pdfStyles.tableRow} key={idx}>
              <Text style={[pdfStyles.td, pdfStyles.tdDesc]}>
                {item.description}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.tdQty]}>
                {item.quantity}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.tdRate]}>{item.rate}</Text>
              <Text style={[pdfStyles.td, pdfStyles.tdGst]}>
                {item.taxRate}
              </Text>
              <Text style={[pdfStyles.td, pdfStyles.tdAmt]}>{item.amount}</Text>
            </PDFView>
          ))}
          {/* Add empty rows to visually extend the table if there are few items */}
          {Array.from({ length: Math.max(0, 8 - serviceItems.length) }).map(
            (_, idx) => (
              <PDFView style={pdfStyles.tableRow} key={`empty-${idx}`}>
                <Text style={[pdfStyles.td, pdfStyles.tdDesc]}> </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdQty]}> </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdRate]}> </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdGst]}> </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdAmt]}> </Text>
              </PDFView>
            )
          )}
          {/* Subtotal and GST rows */}
          <PDFView style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.td,
                textAlign: "right",
                fontWeight: "bold",
                width: "100%",
                paddingRight: 0,
                paddingLeft: 0,
                marginRight: 4, // right margin-1
              }}
              colSpan={4}
            >
              SUB TOTAL
            </Text>
            <Text
              style={{
                ...pdfStyles.td,
                ...pdfStyles.tdAmt,
                fontWeight: "bold",
                textAlign: "right",

              }}
            >
              {serviceItems.reduce(
                (sum, item) => sum + item.amount - item.taxAmount,
                0
              )}
            </Text>
          </PDFView>
          <PDFView style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.td,
                textAlign: "right",
                fontSize: 8, // smaller text
                width: "100%",
                paddingRight: 0,
                paddingLeft: 0,
                marginRight: 4, // right margin-1

              }}
              colSpan={4}
            >
              CGST AMOUNT
            </Text>
            <Text
              style={{
                ...pdfStyles.td,
                ...pdfStyles.tdAmt,
                textAlign: "right",

              }}
            >
              {serviceItems.reduce(
                (sum, item) => sum + (item.cgstAmount || 0),
                0
              )}
            </Text>
          </PDFView>
          <PDFView style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.td,
                textAlign: "right",
                fontSize: 8, // smaller text
                width: "100%",
                paddingRight: 0,
                paddingLeft: 0,
                marginRight: 4, // right margin-1

              }}
              colSpan={4}
            >
              SGST AMOUNT
            </Text>
            <Text
              style={{
                ...pdfStyles.td,
                ...pdfStyles.tdAmt,
                textAlign: "right",

              }}
            >
              {serviceItems.reduce(
                (sum, item) => sum + (item.sgstAmount || 0),
                0
              )}
            </Text>
          </PDFView>
          <PDFView style={pdfStyles.tableRow}>
            <Text
              style={{
                ...pdfStyles.td,
                textAlign: "right",
                fontSize: 8, // smaller text
                width: "100%",
                paddingRight: 0,
                paddingLeft: 0,
                marginRight: 4, // right margin-1

              }}
              colSpan={4}
            >
              IGST AMOUNT
            </Text>
            <Text
              style={{
                ...pdfStyles.td,
                ...pdfStyles.tdAmt,
                textAlign: "right",

              }}
            >
              {serviceItems.reduce(
                (sum, item) => sum + (item.igstAmount || 0),
                0
              )}
            </Text>
          </PDFView>
        </PDFView>{" "}
        {/* End of new flex container */}
      </PDFView>
      {/* Bank Details and Totals */}
      <PDFView
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <PDFView style={pdfStyles.bankBlock}>
          {/* Bank details with clear separation */}
          <PDFView style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontWeight: "bold", width: 80 }}>Bank Name:</Text>
            <Text style={{ color: "#545454" }}>{invoiceData.bankName}</Text>
          </PDFView>
          <PDFView style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontWeight: "bold", width: 80 }}>Account Name:</Text>
            <Text style={{ color: "#545454" }}>{invoiceData.accountName}</Text>
          </PDFView>
          <PDFView style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontWeight: "bold", width: 80 }}>IFSC Code:</Text>
            <Text style={{ color: "#545454" }}>{invoiceData.ifscCode}</Text>
          </PDFView>
          <PDFView style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontWeight: "bold", width: 80 }}>Account No:</Text>
            <Text style={{ color: "#545454" }}>{invoiceData.accountNo}</Text>
          </PDFView>
          <PDFView style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ fontWeight: "bold", width: 80 }}>Bank Branch:</Text>
            <Text style={{ color: "#545454" }}>{invoiceData.bankBranch}</Text>
          </PDFView>
        </PDFView>
        <PDFView style={pdfStyles.bankBlockRight}>
          <PDFView
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{ fontWeight: "bold", marginRight: 16, color: "#1F2837" }}
            >
              GRAND TOTAL
            </Text>
            <Text
              style={{
                borderBottomWidth: 1,
                borderColor: "#E5E7EB",
                fontWeight: "bold",
                width: 64,
                textAlign: "right",
                color: "#1F2837",
              }}
            >
              {serviceItems.reduce((sum, item) => sum + (item.amount || 0), 0)}
            </Text>
          </PDFView>
          <PDFView
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Text
              style={{ fontWeight: "bold", marginRight: 16, color: "#1F2837" }}
            >
              Received Amount
            </Text>
            <Text
              style={{
                borderBottomWidth: 1,
                borderColor: "#E5E7EB",
                width: 64,
                textAlign: "right",
                color: "#545454",
              }}
            >
              {invoiceData.receivedAmount || 0}
            </Text>
          </PDFView>
          <PDFView
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              alignItems: "center",
            }}
          >
            <Text
              style={{ fontWeight: "bold", marginRight: 16, color: "#1F2837" }}
            >
              Balance
            </Text>
            <Text
              style={{
                borderBottomWidth: 1,
                borderColor: "#E5E7EB",
                width: 64,
                textAlign: "right",
                color: "#545454",
              }}
            >
              {serviceItems.reduce((sum, item) => sum + (item.amount || 0), 0) -
                (invoiceData.receivedAmount || 0)}
            </Text>
          </PDFView>
        </PDFView>
      </PDFView>
      {/* Move Terms and Conditions and Signature to the very bottom */}
      <PDFView
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginTop: 24,
        }}
      >
        <PDFView style={pdfStyles.termsBlock}>
          <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 12 }}>
            TERMS AND CONDITIONS:
          </Text>
          <PDFView>
            {invoiceData.termsAndConditions?.map((term, idx) => (
              <Text key={idx} style={{ marginBottom: 2 }}>{`${
                idx + 1
              }. ${term}`}</Text>
            ))}
          </PDFView>
        </PDFView>
        <PDFView style={pdfStyles.signBlock}>
          {invoiceData.upload_seal && (
            <PDFImage src={invoiceData.upload_seal} style={pdfStyles.seal} />
          )}
          <Text style={pdfStyles.signatory}>AUTHORISED SIGNATORY FOR</Text>
          <Text style={{ color: "#545454", fontSize: 12, textAlign: "center" }}>
            {invoiceData.authorisedSignatory}
          </Text>
        </PDFView>
      </PDFView>
    </Page>
  </Document>
);

const invoiceComponent = () => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [organizationEmail, setOrganizationEmail] = useState(""); // New state for organization email
  const [receivedAmount, setReceivedAmount] = useState(0); // New state for received amount

  const [invoiceData, setInvoiceData] = useState({
    companyName: "Company Name",
    addressLine1: "3rd Floor, The View Building, Yeshwant Niwas Rd,",
    addressLine2: "Nehru Park, Lad Colony, Indore, Madhya Pradesh 452001",
    mobile: "9630109451",
    companyState: "Madhya Pradesh", // Added for GST compliance
    invoiceNo: "869",
    invoiceDate: new Date().toISOString().slice(0, 10),
    billToName: "Priya Sharma",
    billToPhone: "+91 98765 43210",
    billToEmail: "priya.sharma@example.com", // Changed dummy Bill To email
    billToState: "Madhya Pradesh", // Added for GST compliance
    billToAddress: {
      blockUnitStreetName: "Sunshine Apartments, 2nd Floor",
      city: "Indore",
      state: "Madhya Pradesh",
      pincode: "452001",
      country: "India",
      gstin: "22AAAAA0000A1Z5",
    },
    shipToName: "Rajesh Kumar",
    shipToPhone: "+91 91234 56789",
    shipToEmail: "rajesh.kumar@example.com", // Changed dummy Ship To email
    shipToState: "Madhya Pradesh",
    shipToAddress: {
      blockUnitStreetName: "Green Park Villas, Block B",
      city: "Bhopal",
      state: "Madhya Pradesh",
      pincode: "462001",
      country: "India",
      gstin: "23BBBBB1111B2Z6",
    },
    bankName: "HDFC BANK",
    accountName: "ARCHDESIGN WORLD",
    ifscCode: "HDFC0006170",
    accountNo: "50200096797196",
    bankBranch: "ANAJ MANDI INDORE MP",
    termsAndConditions: [
      "Clients may request unlimited changes before drawings are finalized and approved. Once work has proceeded past this stage, any further drawing changes will incur additional costs.",
      "A refund policy is not available.",
      "The plot size and dimensions used in the drawings are based solely on the measurements provided by the client. If any discrepancy is discovered after the drawings are complete, the company will not be held responsible.",
    ],
    authorisedSignatory: "Archdesignworld",
    upload_seal: "",
  });

  const [serviceItems, setServiceItems] = useState([
    {
      description: "Complete set",
      quantity: 1,
      rate: 25000,
      taxRate: 18, // Default GST rate (total GST)
      amount: 25000, // This will be updated to include tax
      taxAmount: 0, // Total GST amount for the item
      cgstAmount: 0, // CGST amount for the item
      sgstAmount: 0, // SGST amount for the item
      igstAmount: 0, // IGST amount for the item
    },
  ]);

  // State for manually edited amounts and totals
  const [editedServiceItemAmounts, setEditedServiceItemAmounts] = useState({});
  const [editedSubTotal, setEditedSubTotal] = useState(null);
  const [editedCgstTotal, setEditedCgstTotal] = useState(null);
  const [editedSgstTotal, setEditedSgstTotal] = useState(null);
  const [editedIgstTotal, setEditedIgstTotal] = useState(null);

  const [editedGrandTotal, setEditedGrandTotal] = useState(null);
  const [editedBalance, setEditedBalance] = useState(null);

  // States for manually edited GST labels and percentages
  const [editedCgstLabel, setEditedCgstLabel] = useState(null);
  const [editedSgstLabel, setEditedSgstLabel] = useState(null);
  const [editedIgstLabel, setEditedIgstLabel] = useState(null);
  const [editedCgstPercentage, setEditedCgstPercentage] = useState(null);
  const [editedSgstPercentage, setEditedSgstPercentage] = useState(null);
  const [editedIgstPercentage, setEditedIgstPercentage] = useState(null);

  // Dummy user object to simulate user context data
  const [user, setUser] = useState({
    profile_pic: "src/assets/dummyavatar.jpeg", // Placeholder image path
    phoneno: "+91 9876543210",
    email: "priya@email.com",
    address: "Indore",
  });

  // To store the original state for discarding changes
  const [originalInvoiceData, setOriginalInvoiceData] = useState(invoiceData);
  const [originalServiceItems, setOriginalServiceItems] =
    useState(serviceItems);

  // Address form state for Bill To
  const [formData, setFormData] = useState({
    blockUnitStreetName: "",
    state: "",
    city: "",
    pincode: "",
    country: "",
    gstin: "",
  });
  const [gstinError, setGstinError] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(
    Country.getAllCountries()
  );
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const leadDropdownRef = useRef(null);

  // Ship To state (mirrors Bill To)
  const [shipToFormData, setShipToFormData] = useState({
    blockUnitStreetName: "",
    state: "",
    city: "",
    pincode: "",
    country: "",
    gstin: "",
  });
  const [shipToGstinError, setShipToGstinError] = useState("");
  const [shipToLeadDropdownOpen, setShipToLeadDropdownOpen] = useState(false);
  const [shipToLeadSearchTerm, setShipToLeadSearchTerm] = useState("");
  const shipToDropdownRef = useRef(null);
  const [shipToCountryDropdownOpen, setShipToCountryDropdownOpen] =
    useState(false);
  const [shipToStateDropdownOpen, setShipToStateDropdownOpen] = useState(false);
  const [shipToCityDropdownOpen, setShipToCityDropdownOpen] = useState(false);
  const [shipToCountrySearchTerm, setShipToCountrySearchTerm] = useState("");
  const [shipToStateSearchTerm, setShipToStateSearchTerm] = useState("");
  const [shipToCitySearchTerm, setShipToCitySearchTerm] = useState("");
  const [shipToFilteredCountries, setShipToFilteredCountries] = useState(
    Country.getAllCountries()
  );
  const [shipToFilteredStates, setShipToFilteredStates] = useState([]);
  const [shipToFilteredCities, setShipToFilteredCities] = useState([]);
  const [shipToSelectedCountryObj, setShipToSelectedCountryObj] =
    useState(null);
  const [shipToSelectedStateObj, setShipToSelectedStateObj] = useState(null);
  const shipToCountryDropdownRef = useRef(null);
  const shipToStateDropdownRef = useRef(null);
  const shipToCityDropdownRef = useRef(null);

  // Function to auto-resize textarea
  const autoResizeTextarea = (eOrElement) => {
    const element = eOrElement.target || eOrElement;
    if (element) {
      element.style.height = "auto";
      element.style.height = element.scrollHeight + "px";
    }
  };

  useEffect(() => {
    const fetchOrganizationData = async () => {
      try {
        const data = await api.get("/orglist"); // Directly get data
        console.log("this is API Response: fetch", data);
        if (data.data.success && data.data.result) {
          let orgData = null;
          if (Array.isArray(data.data.result)) {
            orgData = data.data.result[0];
          } else if (typeof data.data.result === "object") {
            orgData = Object.values(data.data.result)[0];
          }
          if (orgData) {
            console.log("Organization data here");
            const addressLines = orgData.address
              ? orgData.address.split("\n")
              : ["", ""];
            // Extract state as the part after the last comma in the second line
            let parsedState = "";
            if (addressLines.length > 1) {
              // Extract state as the part after the last comma in the second line
              const stateMatch = addressLines[1].match(/,([^,]+)$/);
              if (stateMatch && stateMatch[1]) {
                parsedState = stateMatch[1].trim();
              } else {
                // fallback: if no comma, use the whole line
                parsedState = addressLines[1].trim();
              }
            }
            setInvoiceData((prev) => ({
              ...prev,
              companyName: orgData.organizationname || prev.companyName,
              addressLine1: addressLines[0] || prev.addressLine1,
              addressLine2:
                addressLines.slice(1).join("\n") || prev.addressLine2,
              mobile: orgData.phone || prev.mobile,
              companyState: parsedState || prev.companyState, // Use parsed state
              authorisedSignatory:
                orgData.organizationname || prev.authorisedSignatory,
              upload_seal: orgData.upload_seal || "",
            }));
            setOrganizationEmail(orgData.email || "");
            setUser((prev) => ({
              ...prev,
              profile_pic: orgData.profile_image || prev.profile_pic,
            }));
          }
        } else if (!data.data.success) {
          // Handle API success: false case
          console.error("API returned success: false", data.data.message);
          Swal.fire({
            icon: "error",
            title: "Error!",
            text: data.data.message || "Failed to load organization data.",
            confirmButtonColor: "#3085d6",
          });
        }
      } catch (error) {
        console.error("Error fetching organization data:", error);
        Swal.fire({
          icon: "error",
          title: "Error!",
          text: "Failed to load organization data.",
          confirmButtonColor: "#3085d6",
        });
      }
    };

    fetchOrganizationData();

    // Set default country to India for Bill To and Ship To
    const india = Country.getAllCountries().find(
      (country) => country.name === "India"
    );
    if (india) {
      setFormData((prev) => ({ ...prev, country: india.name }));
      setSelectedCountryObj(india);
      setFilteredStates(State.getStatesOfCountry(india.isoCode));

      setShipToFormData((prev) => ({ ...prev, country: india.name }));
      setShipToSelectedCountryObj(india);
      setShipToFilteredStates(State.getStatesOfCountry(india.isoCode));
    }
  }, []); // Run once on component mount

  // Effect to resize textareas when entering edit mode or terms change
  useEffect(() => {
    if (isEditMode) {
      const textareas = document.querySelectorAll(".terms-textarea");
      textareas.forEach((textarea) => {
        autoResizeTextarea(textarea);
      });
    }
  }, [isEditMode, invoiceData.termsAndConditions]);

  // Effect to recalculate GST when companyState or billToState changes
  useEffect(() => {
    const updatedServiceItems = serviceItems.map((item) => {
      const baseAmount = item.quantity * item.rate;
      const { taxAmount, cgstAmount, sgstAmount, igstAmount, amount } =
        calculateItemGST(
          baseAmount,
          item.taxRate,
          invoiceData.companyState,
          invoiceData.billToState
        );
      return {
        ...item,
        taxAmount,
        cgstAmount,
        sgstAmount,
        igstAmount,
        amount,
      };
    });
    setServiceItems(updatedServiceItems);
  }, [invoiceData.companyState, invoiceData.billToState]);

  const validateGstin = (gstin) => {
    if (!gstin) {
      // Optional field
      setGstinError("");
      return true;
    }
    const gstinRegex =
      /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstinRegex.test(gstin)) {
      setGstinError("");
      return true;
    } else {
      setGstinError("Invalid GSTIN format.");
      return false;
    }
  };

  // Handlers for address fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (
      [
        "blockUnitStreetName",
        "state",
        "city",
        "pincode",
        "country",
        "gstin",
      ].includes(name)
    ) {
      const updatedValue = name === "gstin" ? value.toUpperCase() : value;
      setFormData((prev) => ({ ...prev, [name]: updatedValue }));
      // Update invoiceData.billToState when formData.state changes
      if (name === "state") {
        setInvoiceData((prev) => ({ ...prev, billToState: updatedValue }));
        // Also try to set selectedStateObj if state is manually entered
        if (selectedCountryObj) {
          const foundState = State.getStatesOfCountry(
            selectedCountryObj.isoCode
          ).find((s) => s.name.toLowerCase() === updatedValue.toLowerCase());
          setSelectedStateObj(foundState || null);
          // Reset cities if state changes
          setFilteredCities(
            foundState
              ? City.getCitiesOfState(
                  selectedCountryObj.isoCode,
                  foundState.isoCode
                )
              : []
          );
        }
      } else if (name === "country") {
        // Try to set selectedCountryObj if country is manually entered
        const foundCountry = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === updatedValue.toLowerCase()
        );
        setSelectedCountryObj(foundCountry || null);
        // Reset states and cities if country changes
        setFilteredStates(
          foundCountry ? State.getStatesOfCountry(foundCountry.isoCode) : []
        );
        setFilteredCities([]);
        setSelectedStateObj(null);
      }

      if (name === "gstin") {
        validateGstin(updatedValue);
      }
    } else {
      setInvoiceData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Country search and select
  const handleCountrySearchChange = (e) => {
    setCountrySearchTerm(e.target.value);
    const filtered = Country.getAllCountries().filter((country) =>
      country.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setFilteredCountries(filtered);
  };
  const handleCountrySelect = (country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      state: "",
      city: "",
    }));
    setSelectedCountryObj(country);
    setCountryDropdownOpen(false);
    setFilteredStates(State.getStatesOfCountry(country.isoCode));
    setSelectedStateObj(null);
    setFilteredCities([]);
  };

  // State search and select
  const handleStateSearchChange = (e) => {
    setStateSearchTerm(e.target.value);
    if (selectedCountryObj) {
      const filtered = State.getStatesOfCountry(
        selectedCountryObj.isoCode
      ).filter((state) =>
        state.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredStates(filtered);
    }
  };
  const handleStateSelect = (state) => {
    setFormData((prev) => ({ ...prev, state: state.name, city: "" }));
    setSelectedStateObj(state);
    setStateDropdownOpen(false);
    setFilteredCities(
      City.getCitiesOfState(selectedCountryObj.isoCode, state.isoCode)
    );
    setInvoiceData((prev) => ({ ...prev, billToState: state.name }));
  };

  // City search and select
  const handleCitySearchChange = (e) => {
    setCitySearchTerm(e.target.value);
    if (selectedCountryObj && selectedStateObj) {
      const filtered = City.getCitiesOfState(
        selectedCountryObj.isoCode,
        selectedStateObj.isoCode
      ).filter((city) =>
        city.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredCities(filtered);
    }
  };
  const handleCitySelect = (city) => {
    setFormData((prev) => ({ ...prev, city: city.name }));
    setCityDropdownOpen(false);
  };

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setCountryDropdownOpen(false);
      }
      if (
        stateDropdownRef.current &&
        !stateDropdownRef.current.contains(event.target)
      ) {
        setStateDropdownOpen(false);
      }
      if (
        cityDropdownRef.current &&
        !cityDropdownRef.current.contains(event.target)
      ) {
        setCityDropdownOpen(false);
      }
      if (
        leadDropdownRef.current &&
        !leadDropdownRef.current.contains(event.target)
      ) {
        setLeadDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const calculateItemGST = (baseAmount, taxRate, companyState, billToState) => {
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const companyStateClean = companyState
      ? companyState.toLowerCase().trim()
      : "";
    const billToStateClean = billToState
      ? billToState.toLowerCase().trim()
      : "";

    if (companyStateClean === billToStateClean) {
      const halfTaxRate = taxRate / 2;
      cgstAmount = baseAmount * (halfTaxRate / 100);
      sgstAmount = baseAmount * (halfTaxRate / 100);
    } else {
      igstAmount = baseAmount * (taxRate / 100);
    }

    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const amount = baseAmount + taxAmount;

    return {
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      amount,
    };
  };

  const handleServiceItemChange = (index, field, value) => {
    const newServiceItems = [...serviceItems];
    newServiceItems[index][field] = value;

    if (field === "quantity" || field === "rate" || field === "taxRate") {
      const qty = parseFloat(newServiceItems[index].quantity) || 0;
      const rate = parseFloat(newServiceItems[index].rate) || 0;
      const taxRate = parseFloat(newServiceItems[index].taxRate) || 0;

      const baseAmount = qty * rate;
      const { taxAmount, cgstAmount, sgstAmount, igstAmount, amount } =
        calculateItemGST(
          baseAmount,
          taxRate,
          invoiceData.companyState,
          invoiceData.billToState
        );

      newServiceItems[index].taxAmount = taxAmount;
      newServiceItems[index].amount = amount;
      newServiceItems[index].cgstAmount = cgstAmount;
      newServiceItems[index].sgstAmount = sgstAmount;
      newServiceItems[index].igstAmount = igstAmount;
    }
    setServiceItems(newServiceItems);
    // Clear any manual override for this item's amount if quantity, rate, or taxRate changed
    if (field === "quantity" || field === "rate" || field === "taxRate") {
      setEditedServiceItemAmounts((prev) => {
        const newEditedAmounts = { ...prev };
        delete newEditedAmounts[index];
        return newEditedAmounts;
      });
    }
  };

  const addServiceItem = () => {
    setServiceItems([
      ...serviceItems,
      {
        description: "",
        quantity: 0,
        rate: 0,
        taxRate: 0,
        amount: 0,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
      },
    ]);
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

  const handleEditedTotalChange = (field, value) => {
    const parsedValue = parseFloat(value) || 0;
    switch (field) {
      case "subTotal":
        setEditedSubTotal(parsedValue);
        break;
      case "cgstTotal":
        setEditedCgstTotal(parsedValue);
        break;
      case "sgstTotal":
        setEditedSgstTotal(parsedValue);
        break;
      case "igstTotal":
        setEditedIgstTotal(parsedValue);
        break;
      default:
        break;
    }
  };

  const handleEditedOverallTotalChange = (field, value) => {
    const parsedValue = parseFloat(value) || 0;
    switch (field) {
      case "grandTotal":
        setEditedGrandTotal(parsedValue);
        break;
      case "balance":
        setEditedBalance(parsedValue);
        break;
      default:
        break;
    }
  };

  const calculateSubTotal = () => {
    return editedSubTotal !== null && editedSubTotal !== ""
      ? parseFloat(editedSubTotal)
      : serviceItems.reduce(
          (sum, item) => sum + item.amount - item.taxAmount,
          0
        ); // Corrected to exclude taxAmount from subtotal
  };

  const calculateGrandTotal = () => {
    // Sum the effective subtotal and effective GST totals
    const effectiveSubTotal = calculateSubTotal();
    const effectiveCgstTotal = calculateCgstTotal();
    const effectiveSgstTotal = calculateSgstTotal();
    const effectiveIgstTotal = calculateIgstTotal();

    return (
      effectiveSubTotal +
      effectiveCgstTotal +
      effectiveSgstTotal +
      effectiveIgstTotal
    );
  };

  const calculateCgstTotal = () => {
    return editedCgstTotal !== null && editedCgstTotal !== ""
      ? parseFloat(editedCgstTotal)
      : serviceItems.reduce((sum, item) => sum + item.cgstAmount, 0);
  };

  const calculateSgstTotal = () => {
    return editedSgstTotal !== null && editedSgstTotal !== ""
      ? parseFloat(editedSgstTotal)
      : serviceItems.reduce((sum, item) => sum + item.sgstAmount, 0);
  };

  const calculateIgstTotal = () => {
    return editedIgstTotal !== null && editedIgstTotal !== ""
      ? parseFloat(editedIgstTotal)
      : serviceItems.reduce((sum, item) => sum + item.igstAmount, 0);
  };

  // Derived state for grand total and balance
  const displayedGrandTotal = calculateGrandTotal();
  const displayedBalance = displayedGrandTotal - receivedAmount;

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
          setInvoiceData(originalInvoiceData);
          setServiceItems(originalServiceItems);
          setFormData(originalInvoiceData.billToAddress || formData);
          setShipToFormData(
            originalInvoiceData.shipToAddress || shipToFormData
          );
          setIsEditMode(false);
          setReceivedAmount(0); // Reset received amount on exit if not saved
        }
      });
    } else {
      setOriginalInvoiceData(invoiceData);
      setOriginalServiceItems(serviceItems);
      setFormData(invoiceData.billToAddress || formData);
      setShipToFormData(invoiceData.shipToAddress || shipToFormData);
      setIsEditMode(true);
      // setOriginalReceivedAmount(receivedAmount); // If you want to revert received amount
    }
  };

  const saveChanges = () => {
    if (formData.gstin && gstinError) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please correct the invalid GSTIN before saving.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (shipToFormData.gstin && shipToGstinError) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please correct the invalid Ship To GSTIN before saving.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    const newInvoiceData = {
      ...invoiceData,
      billToAddress: { ...formData },
      shipToAddress: { ...shipToFormData },
      receivedAmount: receivedAmount,
      grandTotal: displayedGrandTotal, // Save the calculated grand total
      balance: displayedBalance, // Save the calculated balance
    };
    setInvoiceData(newInvoiceData); // This might cause issues if invoiceData still has these keys, consider separate save data
    setOriginalInvoiceData(newInvoiceData); // Set original to the new saved state
    setOriginalServiceItems(serviceItems);
    setIsEditMode(false);
    setFormData(newInvoiceData.billToAddress);
    setShipToFormData(newInvoiceData.shipToAddress);
    console.log("Saving changes:", newInvoiceData, serviceItems);
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Changes saved successfully!",
      confirmButtonColor: "#3085d6",
    });
  };

  const submitInvoice = () => {
    if (formData.gstin && gstinError) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please correct the invalid GSTIN before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    console.log("Submitting invoice:", invoiceData, serviceItems, formData);
    Swal.fire({
      icon: "success",
      title: "Invoice Submitted!",
      text: "Your invoice has been successfully submitted.",
      confirmButtonColor: "#3085d6",
    });
  };

  // Fetch leads when dropdown is opened
  useEffect(() => {
    if (leadDropdownOpen && leads.length === 0) {
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
  }, [leadDropdownOpen]);

  // Filtered leads based on search
  const filteredLeads = leads.filter((lead) => {
    const term = leadSearchTerm.toLowerCase();
    return (
      lead.customer_name.toLowerCase().includes(term) ||
      lead.email.toLowerCase().includes(term) ||
      lead.contact.toLowerCase().includes(term)
    );
  });

  // Parse address helper
  function parseLeadAddress(addressString) {
    const lines = addressString.split(/\r?\n/);
    let blockUnitStreetName = lines[0] || "";
    let city = "";
    let state = "";
    let country = "";
    let pincode = "";

    if (lines.length > 1) {
      // Try to extract city, state from the second line
      const cityStateMatch = lines[1].match(/^(.*?),\s*([A-Za-z ]+)$/);
      if (cityStateMatch) {
        city = cityStateMatch[1].trim();
        state = cityStateMatch[2].trim();
      } else {
        // If no comma, assume it's just city or part of street
        city = lines[1].trim();
      }
    }

    if (lines.length > 2) {
      // Try to extract country and pincode from the third line
      const countryPinMatch = lines[2].match(/^(.*)\s*-\s*(\d{6})$/);
      if (countryPinMatch) {
        country = countryPinMatch[1].trim();
        pincode = countryPinMatch[2];
      } else {
        country = lines[2].trim();
      }
    }

    return { blockUnitStreetName, city, state, country, pincode };
  }

  // Autofill Bill To fields from lead
  const handleLeadSelect = (lead) => {
    const parsedAddress = parseLeadAddress(lead.city || "");
    setInvoiceData((prev) => ({
      ...prev,
      billToName: lead.customer_name || prev.billToName,
      billToPhone: lead.contact || prev.billToPhone,
      billToEmail: lead.email || prev.billToEmail,
      billToState: parsedAddress.state || prev.billToState, // Set billToState from parsed address
      shipToName: lead.customer_name || prev.shipToName,
      shipToPhone: lead.contact || prev.shipToPhone,
      shipToEmail: lead.email || prev.shipToEmail, // Add this line to populate shipToEmail
      shipToState: parsedAddress.state || prev.shipToState, // Set shipToState from parsed address
    }));
    setFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));

    // Set selectedCountryObj and selectedStateObj after autofilling from lead
    const countryFromParsed = Country.getAllCountries().find(
      (c) => c.name.toLowerCase() === parsedAddress.country.toLowerCase()
    );
    setSelectedCountryObj(countryFromParsed || null);
    if (countryFromParsed && parsedAddress.state) {
      const stateFromParsed = State.getStatesOfCountry(
        countryFromParsed.isoCode
      ).find((s) => s.name.toLowerCase() === parsedAddress.state.toLowerCase());
      setSelectedStateObj(stateFromParsed || null);
    }

    setShipToFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));
    setLeadDropdownOpen(false);
    setLeadSearchTerm("");
    setShipToLeadDropdownOpen(false);
    setShipToLeadSearchTerm("");
  };

  // Ship To lead select (independent)
  const handleShipToLeadSelect = (lead) => {
    const parsedAddress = parseLeadAddress(lead.city || "");
    setInvoiceData((prev) => ({
      ...prev,
      shipToName: lead.customer_name || prev.shipToName,
      shipToPhone: lead.contact || prev.shipToPhone,
      shipToEmail: lead.email || prev.shipToEmail, // Add this line to populate shipToEmail
      shipToState: parsedAddress.state || prev.shipToState, // Set shipToState from parsed address
    }));
    setShipToFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));
    // Set shipToSelectedCountryObj and shipToSelectedStateObj after autofilling from lead
    const countryFromParsed = Country.getAllCountries().find(
      (c) => c.name.toLowerCase() === parsedAddress.country.toLowerCase()
    );
    setShipToSelectedCountryObj(countryFromParsed || null);
    if (countryFromParsed && parsedAddress.state) {
      const stateFromParsed = State.getStatesOfCountry(
        countryFromParsed.isoCode
      ).find((s) => s.name.toLowerCase() === parsedAddress.state.toLowerCase());
      setShipToSelectedStateObj(stateFromParsed || null);
    }
    setShipToLeadDropdownOpen(false);
    setShipToLeadSearchTerm("");
  };

  // Ship To input change
  const handleShipToInputChange = (e) => {
    const { name, value } = e.target;
    if (
      [
        "blockUnitStreetName",
        "state",
        "city",
        "pincode",
        "country",
        "gstin",
      ].includes(name)
    ) {
      const updatedValue = name === "gstin" ? value.toUpperCase() : value;
      setShipToFormData((prev) => ({ ...prev, [name]: updatedValue }));
      // Update invoiceData.shipToState when shipToFormData.state changes
      if (name === "state") {
        setInvoiceData((prev) => ({ ...prev, shipToState: updatedValue }));
        // Also try to set shipToSelectedStateObj if state is manually entered
        if (shipToSelectedCountryObj) {
          const foundState = State.getStatesOfCountry(
            shipToSelectedCountryObj.isoCode
          ).find((s) => s.name.toLowerCase() === updatedValue.toLowerCase());
          setShipToSelectedStateObj(foundState || null);
          // Reset cities if state changes
          setShipToFilteredCities(
            foundState
              ? City.getCitiesOfState(
                  shipToSelectedCountryObj.isoCode,
                  foundState.isoCode
                )
              : []
          );
        }
      } else if (name === "country") {
        // Try to set shipToSelectedCountryObj if country is manually entered
        const foundCountry = Country.getAllCountries().find(
          (c) => c.name.toLowerCase() === updatedValue.toLowerCase()
        );
        setShipToSelectedCountryObj(foundCountry || null);
        // Reset states and cities if country changes
        setShipToFilteredStates(
          foundCountry ? State.getStatesOfCountry(foundCountry.isoCode) : []
        );
        setShipToFilteredCities([]);
        setShipToSelectedStateObj(null);
      }
      if (name === "gstin") {
        if (!updatedValue) {
          setShipToGstinError("");
        } else {
          const gstinRegex =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          setShipToGstinError(
            gstinRegex.test(updatedValue) ? "" : "Invalid GSTIN format."
          );
        }
      }
    } else {
      setInvoiceData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Ship To dropdown outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        shipToDropdownRef.current &&
        !shipToDropdownRef.current.contains(event.target)
      ) {
        setShipToLeadDropdownOpen(false);
      }
      if (
        shipToCountryDropdownRef.current &&
        !shipToCountryDropdownRef.current.contains(event.target)
      ) {
        setShipToCountryDropdownOpen(false);
      }
      if (
        shipToStateDropdownRef.current &&
        !shipToStateDropdownRef.current.contains(event.target)
      ) {
        setShipToStateDropdownOpen(false);
      }
      if (
        shipToCityDropdownRef.current &&
        !shipToCityDropdownRef.current.contains(event.target)
      ) {
        setShipToCityDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handlers for Ship To address fields
  const handleShipToCountrySearchChange = (e) => {
    setShipToCountrySearchTerm(e.target.value);
    const filtered = Country.getAllCountries().filter((country) =>
      country.name.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setShipToFilteredCountries(filtered);
  };
  const handleShipToCountrySelect = (country) => {
    setShipToFormData((prev) => ({
      ...prev,
      country: country.name,
      state: "",
      city: "",
    }));
    setShipToSelectedCountryObj(country);
    setShipToCountryDropdownOpen(false);
    setShipToFilteredStates(State.getStatesOfCountry(country.isoCode));
    setShipToSelectedStateObj(null);
    setShipToFilteredCities([]);
  };

  const handleShipToStateSearchChange = (e) => {
    setShipToStateSearchTerm(e.target.value);
    if (shipToSelectedCountryObj) {
      const filtered = State.getStatesOfCountry(
        shipToSelectedCountryObj.isoCode
      ).filter((state) =>
        state.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setShipToFilteredStates(filtered);
    }
  };
  const handleShipToStateSelect = (state) => {
    setShipToFormData((prev) => ({ ...prev, state: state.name, city: "" }));
    setShipToSelectedStateObj(state);
    setShipToStateDropdownOpen(false);
    setShipToFilteredCities(
      City.getCitiesOfState(shipToSelectedCountryObj.isoCode, state.isoCode)
    );
    setInvoiceData((prev) => ({ ...prev, shipToState: state.name }));
  };

  const handleShipToCitySearchChange = (e) => {
    setShipToCitySearchTerm(e.target.value);
    if (shipToSelectedCountryObj && shipToSelectedStateObj) {
      const filtered = City.getCitiesOfState(
        shipToSelectedCountryObj.isoCode,
        shipToSelectedStateObj.isoCode
      ).filter((city) =>
        city.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setShipToFilteredCities(filtered);
    }
  };
  const handleShipToCitySelect = (city) => {
    setShipToFormData((prev) => ({ ...prev, city: city.name }));
    setShipToCityDropdownOpen(false);
  };

  const handleEditedItemAmountChange = (index, value) => {
    const newServiceItems = [...serviceItems];
    const parsedValue = parseFloat(value);

    // Update the item's amount directly
    newServiceItems[index].amount = parsedValue;

    if (
      !isNaN(parsedValue) &&
      parsedValue >= 0 &&
      newServiceItems[index].taxRate > 0
    ) {
      // Calculate base amount from the edited total amount and tax rate
      const taxRate = newServiceItems[index].taxRate;
      const baseAmount = parsedValue / (1 + taxRate / 100);

      // Recalculate GST components using the base amount
      const { taxAmount, cgstAmount, sgstAmount, igstAmount } =
        calculateItemGST(
          baseAmount,
          taxRate,
          invoiceData.companyState,
          invoiceData.billToState
        );

      newServiceItems[index].taxAmount = taxAmount;
      newServiceItems[index].cgstAmount = cgstAmount;
      newServiceItems[index].sgstAmount = sgstAmount;
      newServiceItems[index].igstAmount = igstAmount;
      // Note: quantity and rate are not updated by editing the final amount
    } else if (isNaN(parsedValue) || parsedValue === null || parsedValue < 0) {
      // If the input is invalid or cleared, reset tax amounts to 0
      newServiceItems[index].amount = 0;
      newServiceItems[index].taxAmount = 0;
      newServiceItems[index].cgstAmount = 0;
      newServiceItems[index].sgstAmount = 0;
      newServiceItems[index].igstAmount = 0;
    }

    setServiceItems(newServiceItems);

    // Clear any manual override for this item's amount to allow calculated values to take over if input is cleared
    setEditedServiceItemAmounts((prev) => {
      const newEditedAmounts = { ...prev };
      if (value === "" || isNaN(parsedValue)) {
        delete newEditedAmounts[index];
      } else {
        newEditedAmounts[index] = parsedValue;
      }
      return newEditedAmounts;
    });
  };

  const handleEditedGstLabelChange = (field, value) => {
    switch (field) {
      case "cgstLabel":
        setEditedCgstLabel(value);
        break;
      case "sgstLabel":
        setEditedSgstLabel(value);
        break;
      case "igstLabel":
        setEditedIgstLabel(value);
        break;
      default:
        break;
    }
  };

  const handleEditedGstPercentageChange = (field, value) => {
    const parsedValue = parseFloat(value) || null;
    switch (field) {
      case "cgstPercentage":
        setEditedCgstPercentage(parsedValue);
        break;
      case "sgstPercentage":
        setEditedSgstPercentage(parsedValue);
        break;
      case "igstPercentage":
        setEditedIgstPercentage(parsedValue);
        break;
      default:
        break;
    }
  };

  return (
    <div className="w-full lg:w-[70%] h-auto bg-white p-4 sm:p-6 lg:p-[23px] min-h-screen rounded-2xl flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          {user?.profile_pic && ( // Conditionally render image
            <img
              src={user?.profile_pic}
              alt="Logo"
              className="h-24 w-24 mr-4"
            />
          )}{" "}
          {/* Placeholder for logo */}
          <div>
            {isEditMode ? (
              <input
                type="text"
                name="companyName"
                placeholder="Enter Company Name"
                value={invoiceData.companyName}
                onChange={handleInputChange}
                className="text-[rgb(39,152,255)] mb-1 text-2xl sm:text-3xl lg:text-[32px] font-bold w-full px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <h1 className="text-[rgb(39,152,255)] text-2xl sm:text-3xl lg:text-[32px] font-bold">
                {invoiceData.companyName}
              </h1>
            )}

            {isEditMode ? (
              <>
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="Enter Address Line 1"
                  value={invoiceData.addressLine1}
                  onChange={handleInputChange}
                  className="text-sm text-[rgb(31,41,55)] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                />
                <input
                  type="text"
                  name="addressLine2"
                  value={invoiceData.addressLine2}
                  placeholder="Enter Address Line 2"
                  onChange={handleInputChange}
                  className="text-sm text-[rgb(31,41,55)] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="organizationEmail"
                    value={organizationEmail}
                    placeholder="Enter Organization Email"
                    onChange={(e) => setOrganizationEmail(e.target.value)}
                    className="text-sm text-[rgb(31,41,55)] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                  />
                  <input
                    type="text"
                    name="mobile"
                    value={invoiceData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter Mobile Number"
                    className="text-sm text-[rgb(31,41,55)] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Display each address line separately */}
                {invoiceData.addressLine1 && (
                  <p className="text-sm text-[rgb(31,41,55)]">
                    {invoiceData.addressLine1}
                  </p>
                )}
                {invoiceData.addressLine2 &&
                  invoiceData.addressLine2.split("\n").map((line, idx) => (
                    <p className="text-sm text-[rgb(31,41,55)]" key={idx}>
                      {line}
                    </p>
                  ))}
                <div className="flex gap-2">
                  {organizationEmail && (
                    <p className="text-sm text-[rgb(31,41,55)]">
                      Email: {organizationEmail}
                    </p>
                  )}
                  <p className="text-sm text-[rgb(31,41,55)]">
                    Mobile: {invoiceData.mobile}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-[rgb(39,152,255)] text-2xl sm:text-3xl lg:text-[32px] font-bold">
            INVOICE
          </h2>
        </div>
      </div>

      <hr className="border-t-2 border-[rgb(39,152,255)] mb-6" />

      {/* Invoice Details */}
      <div className="flex justify-between mb-6 text-sm text-[#4B5563]">
        <div>
          Invoice No.:{" "}
          {isEditMode ? (
            <input
              type="text"
              name="invoiceNo"
              value={invoiceData.invoiceNo}
              onChange={handleInputChange}
              placeholder="Enter Invoice No."
              className="w-24 px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
            />
          ) : (
            invoiceData.invoiceNo
          )}
        </div>
        <div>
          Invoice Date:{" "}
          {isEditMode ? (
            <input
              type="date"
              name="invoiceDate"
              value={invoiceData.invoiceDate}
              onChange={handleInputChange}
              placeholder="Select Date"
              className="w-32 px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
            />
          ) : (
            invoiceData.invoiceDate
          )}
        </div>
      </div>

      <hr className="border-t border-[#E5E7EB] mb-6" />

      {/* Bill To / Ship To */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-lg mb-2 text-[#4B5563]">BILL TO</h3>
          {/* Lead Search & Dropdown */}
          {isEditMode && (
            <div className="mb-2 relative" ref={leadDropdownRef}>
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
              {leadDropdownOpen && (
                <div className="absolute z-20 w-full bg-white rounded-xl shadow-2xl border border-gray-200 mt-1 max-h-72 overflow-y-auto animate-fade-in">
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
          )}
          {isEditMode ? (
            <>
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Organisation
                </label>
                <div>
                  <input
                    type="text"
                    name="billToName"
                    value={invoiceData.billToName}
                    onChange={handleInputChange}
                    placeholder="Enter Bill To Name"
                    className="font-semibold text-[#1F2837] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                  />
                  <div className="flex gap-2"></div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Address
                </label>
                <div className="w-full rounded-[12px]  border border-white/20 flex flex-col">
                  <input
                    type="text"
                    name="blockUnitStreetName"
                    value={formData.blockUnitStreetName}
                    onChange={handleInputChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b  bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                    placeholder="Block/Unit/Street Name"
                  />
                  {/* State and City Dropdowns */}
                  <div className="grid grid-cols-2  w-full">
                    {/* State Dropdown */}
                    <div className="relative" ref={stateDropdownRef}>
                      <input
                        type="text"
                        name="stateSearch"
                        value={formData.state || stateSearchTerm}
                        onChange={handleStateSearchChange}
                        onFocus={() => setStateDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        placeholder="Select State"
                        disabled={!selectedCountryObj}
                        autoComplete="off"
                      />
                      {formData.state && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, state: "" }));
                            setStateSearchTerm("");
                            setSelectedStateObj(null);
                            setFilteredCities([]);
                            setInvoiceData((prev) => ({
                              ...prev,
                              billToState: "",
                            })); // Clear billToState
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {stateDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {filteredStates.length > 0 ? (
                            filteredStates.map((state) => (
                              <div
                                key={state.isoCode}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() => handleStateSelect(state)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {state.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No states found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* City Dropdown */}
                    <div className="relative" ref={cityDropdownRef}>
                      <input
                        type="text"
                        name="citySearch"
                        value={formData.city || citySearchTerm}
                        onChange={handleCitySearchChange}
                        onFocus={() => setCityDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        placeholder="Select City"
                        disabled={!selectedStateObj}
                        autoComplete="off"
                      />
                      {formData.city && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, city: "" }));
                            setCitySearchTerm("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {cityDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {filteredCities.length > 0 ? (
                            filteredCities.map((city) => (
                              <div
                                key={city.name}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() => handleCitySelect(city)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {city.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No cities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Pincode and Country */}
                  <div className="grid grid-cols-2  w-full">
                    {/* Pincode Input */}
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 rounded-bl-[12px] outline-none"
                      placeholder="Pincode"
                    />
                    {/* Country Dropdown */}
                    <div className="relative" ref={countryDropdownRef}>
                      <input
                        type="text"
                        name="countrySearch"
                        value={formData.country || countrySearchTerm}
                        onChange={handleCountrySearchChange}
                        onFocus={() => setCountryDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                        placeholder="Select Country"
                        autoComplete="off"
                      />
                      {formData.country && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              country: "",
                              state: "",
                              city: "",
                            }));
                            setCountrySearchTerm("");
                            setSelectedCountryObj(null);
                            setSelectedStateObj(null);
                            setFilteredStates([]);
                            setFilteredCities([]);
                            setInvoiceData((prev) => ({
                              ...prev,
                              billToState: "",
                            })); // Clear billToState
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {countryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {filteredCountries.length > 0 ? (
                            filteredCountries.map((country) => (
                              <div
                                key={country.isoCode}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() => handleCountrySelect(country)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {country.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Contact
                </label>
                <div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      name="billToEmail"
                      value={invoiceData.billToEmail}
                      onChange={handleInputChange}
                      placeholder="Enter Bill To Email"
                      className="text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
                    />
                    <input
                      type="text"
                      name="billToPhone"
                      value={invoiceData.billToPhone}
                      onChange={handleInputChange}
                      placeholder="Enter Bill To Phone"
                      className="text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  GST
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={formData.gstin}
                  onChange={handleInputChange}
                  placeholder="Enter GSTIN (Optional)"
                  className={`text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border ${
                    gstinError ? "border-red-500" : "border-white/20"
                  } focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]`}
                />
                {gstinError && (
                  <p className="text-red-500 text-xs mt-1">{gstinError}</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Organisation Name */}
              <p className="font-semibold text-[#1F2837]">
                {invoiceData.billToName}
              </p>
              {/* Address first line */}
              {invoiceData.billToAddress?.blockUnitStreetName && (
                <p className="text-[#545454]">
                  {invoiceData.billToAddress.blockUnitStreetName}
                </p>
              )}
              {/* State and City (comma separated) */}
              {(invoiceData.billToAddress?.state ||
                invoiceData.billToAddress?.city) && (
                <p className="text-[#545454]">
                  {invoiceData.billToAddress?.state}
                  {invoiceData.billToAddress?.state &&
                  invoiceData.billToAddress?.city
                    ? ", "
                    : ""}
                  {invoiceData.billToAddress?.city}
                </p>
              )}
              {/* Pincode and Country (comma separated) */}
              {(invoiceData.billToAddress?.pincode ||
                invoiceData.billToAddress?.country) && (
                <p className="text-[#545454]">
                  {invoiceData.billToAddress?.pincode}
                  {invoiceData.billToAddress?.pincode &&
                  invoiceData.billToAddress?.country
                    ? ", "
                    : ""}
                  {invoiceData.billToAddress?.country}
                </p>
              )}
              {/* Email and Phone (on separate lines) */}
              {invoiceData.billToEmail && (
                <p className="text-[#545454]">
                  Email: {invoiceData.billToEmail}
                </p>
              )}
              {invoiceData.billToPhone && (
                <p className="text-[#545454]">
                  Mobile: {invoiceData.billToPhone}
                </p>
              )}
              {/* GST number */}
              {invoiceData.billToAddress?.gstin && (
                <p className="text-[#545454]">
                  GSTIN: {invoiceData.billToAddress.gstin}
                </p>
              )}
            </>
          )}
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="font-bold text-lg mb-2 text-[#4B5563]">SHIP TO</h3>
          {/* Ship To Lead Search & Dropdown */}
          {isEditMode && (
            <div className="mb-2 relative" ref={shipToDropdownRef}>
              <input
                type="text"
                placeholder="Search customer by name, email, or phone..."
                value={shipToLeadSearchTerm}
                onChange={(e) => {
                  setShipToLeadSearchTerm(e.target.value);
                  setShipToLeadDropdownOpen(true);
                }}
                onFocus={() => setShipToLeadDropdownOpen(true)}
                className="w-full px-3 py-2 rounded-[12px] border border-[#E7EFF8] bg-[#F8FAFC] text-[#545454] focus:ring-2 focus:ring-[#0e4053] outline-none mb-1"
              />
              {shipToLeadDropdownOpen && (
                <div className="absolute z-20 w-full bg-white rounded-xl shadow-2xl border border-gray-200 mt-1 max-h-72 overflow-y-auto animate-fade-in">
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
                        onClick={() => handleShipToLeadSelect(lead)}
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
          )}
          {isEditMode ? (
            <>
              <div className="space-y-1">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Organisation
                </label>
                <div>
                  <input
                    type="text"
                    name="shipToName"
                    value={invoiceData.shipToName}
                    onChange={handleShipToInputChange}
                    placeholder="Enter Ship To Name"
                    className="font-semibold text-[#1F2837] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                  />
                </div>
              </div>
              {/* Address */}
              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Address
                </label>
                <div className="w-full rounded-[12px] border border-white/20 flex flex-col">
                  <input
                    type="text"
                    name="blockUnitStreetName"
                    value={shipToFormData.blockUnitStreetName}
                    onChange={handleShipToInputChange}
                    className="w-full h-[44px] px-3 flex items-center text-[#545454] border-b bg-[#E7EFF8]/60 border border-white/20 outline-none rounded-t-[12px]"
                    placeholder="Block/Unit/Street Name"
                  />
                  <div className="grid grid-cols-2 w-full">
                    {/* State Dropdown for Ship To */}
                    <div className="relative" ref={shipToStateDropdownRef}>
                      <input
                        type="text"
                        name="shipToStateSearch"
                        value={shipToFormData.state || shipToStateSearchTerm}
                        onChange={handleShipToStateSearchChange}
                        onFocus={() => setShipToStateDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        placeholder="Select State"
                        disabled={!shipToSelectedCountryObj}
                        autoComplete="off"
                      />
                      {shipToFormData.state && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setShipToFormData((prev) => ({
                              ...prev,
                              state: "",
                            }));
                            setShipToStateSearchTerm("");
                            setShipToSelectedStateObj(null);
                            setShipToFilteredCities([]);
                            setInvoiceData((prev) => ({
                              ...prev,
                              shipToState: "",
                            })); // Clear shipToState
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {shipToStateDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {shipToFilteredStates.length > 0 ? (
                            shipToFilteredStates.map((state) => (
                              <div
                                key={state.isoCode}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() => handleShipToStateSelect(state)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {state.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No states found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    {/* City Dropdown for Ship To */}
                    <div className="relative" ref={shipToCityDropdownRef}>
                      <input
                        type="text"
                        name="shipToCitySearch"
                        value={shipToFormData.city || shipToCitySearchTerm}
                        onChange={handleShipToCitySearchChange}
                        onFocus={() => setShipToCityDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px]"
                        placeholder="Select City"
                        disabled={!shipToSelectedStateObj}
                        autoComplete="off"
                      />
                      {shipToFormData.city && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setShipToFormData((prev) => ({
                              ...prev,
                              city: "",
                            }));
                            setShipToCitySearchTerm("");
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {shipToCityDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {shipToFilteredCities.length > 0 ? (
                            shipToFilteredCities.map((city) => (
                              <div
                                key={city.name}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() => handleShipToCitySelect(city)}
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {city.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No cities found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 w-full">
                    {/* Pincode Input for Ship To */}
                    <input
                      type="text"
                      name="pincode"
                      value={shipToFormData.pincode}
                      onChange={handleShipToInputChange}
                      className="w-full h-[44px] px-3 flex items-center text-[#545454] bg-[#E7EFF8]/60 border border-white/20 rounded-bl-[12px] outline-none"
                      placeholder="Pincode"
                    />
                    {/* Country Dropdown for Ship To */}
                    <div className="relative" ref={shipToCountryDropdownRef}>
                      <input
                        type="text"
                        name="shipToCountrySearch"
                        value={
                          shipToFormData.country || shipToCountrySearchTerm
                        }
                        onChange={handleShipToCountrySearchChange}
                        onFocus={() => setShipToCountryDropdownOpen(true)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20 outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                        placeholder="Select Country"
                        autoComplete="off"
                      />
                      {shipToFormData.country && isEditMode && (
                        <button
                          type="button"
                          onClick={() => {
                            setShipToFormData((prev) => ({
                              ...prev,
                              country: "",
                              state: "",
                              city: "",
                            }));
                            setShipToCountrySearchTerm("");
                            setShipToSelectedCountryObj(null);
                            setShipToSelectedStateObj(null);
                            setShipToFilteredStates([]);
                            setShipToFilteredCities([]);
                            setInvoiceData((prev) => ({
                              ...prev,
                              shipToState: "",
                            })); // Clear shipToState
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                      {shipToCountryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-[12px] shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                          {shipToFilteredCountries.length > 0 ? (
                            shipToFilteredCountries.map((country) => (
                              <div
                                key={country.isoCode}
                                className="p-3 hover:bg-[#E7EFF8]/60 cursor-pointer text-[#545454] text-sm"
                                onClick={() =>
                                  handleShipToCountrySelect(country)
                                }
                                onMouseDown={(e) => e.preventDefault()}
                              >
                                {country.name}
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-gray-500">
                              No countries found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  Contact
                </label>
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="shipToPhone"
                      value={invoiceData.shipToPhone}
                      onChange={handleShipToInputChange}
                      placeholder="Enter Ship To Phone"
                      className="text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
                    />
                    <input
                      type="email"
                      name="shipToEmail"
                      value={invoiceData.shipToEmail}
                      onChange={handleShipToInputChange}
                      placeholder="Enter Ship To Email"
                      className="text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1 mt-2">
                <label className="block text-[#4B5563] text-sm font-medium">
                  GST
                </label>
                <input
                  type="text"
                  name="gstin"
                  value={shipToFormData.gstin}
                  onChange={handleShipToInputChange}
                  placeholder="Enter GSTIN (Optional)"
                  className={`text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border ${
                    shipToGstinError ? "border-red-500" : "border-white/20"
                  } focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]`}
                />
                {shipToGstinError && (
                  <p className="text-red-500 text-xs mt-1">
                    {shipToGstinError}
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Organisation Name */}
              <p className="font-semibold text-[#1F2837]">
                {invoiceData.shipToName}
              </p>
              {/* Address first line */}
              {invoiceData.shipToAddress?.blockUnitStreetName && (
                <p className="text-[#545454]">
                  {invoiceData.shipToAddress.blockUnitStreetName}
                </p>
              )}
              {/* State and City (comma separated) */}
              {(invoiceData.shipToAddress?.state ||
                invoiceData.shipToAddress?.city) && (
                <p className="text-[#545454]">
                  {invoiceData.shipToAddress?.state}
                  {invoiceData.shipToAddress?.state &&
                  invoiceData.shipToAddress?.city
                    ? ", "
                    : ""}
                  {invoiceData.shipToAddress?.city}
                </p>
              )}
              {/* Pincode and Country (comma separated) */}
              {(invoiceData.shipToAddress?.pincode ||
                invoiceData.shipToAddress?.country) && (
                <p className="text-[#545454]">
                  {invoiceData.shipToAddress?.pincode}
                  {invoiceData.shipToAddress?.pincode &&
                  invoiceData.shipToAddress?.country
                    ? ", "
                    : ""}
                  {invoiceData.shipToAddress?.country}
                </p>
              )}
              {/* Email and Phone (on separate lines) */}
              {invoiceData.shipToEmail && (
                <p className="text-[#545454]">
                  Email: {invoiceData.shipToEmail}
                </p>
              )}
              {invoiceData.shipToPhone && (
                <p className="text-[#545454]">
                  Mobile: {invoiceData.shipToPhone}
                </p>
              )}
              {/* GST number */}
              {invoiceData.shipToAddress?.gstin && (
                <p className="text-[#545454]">
                  GSTIN: {invoiceData.shipToAddress.gstin}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse table-fixed">
          <thead>
            <tr className="bg-[#E7EFF8]/30 text-left text-[#4B5563]">
              <th className="border border-[#E5E7EB] p-2 text-left w-1/2 font-medium text-sm">
                ITEMS
              </th>
              <th
                className={`border border-[#E5E7EB] p-2 text-center font-medium text-sm ${
                  isEditMode ? "w-1/10" : ""
                }`}
              >
                QTY
              </th>
              <th
                className={`border border-[#E5E7EB] p-2 text-center font-medium text-sm ${
                  isEditMode ? "w-20" : "w-1/6"
                }`}
              >
                RATE
              </th>
              <th
                className={`border border-[#E5E7EB] p-2 text-center font-medium text-sm ${
                  isEditMode ? "w-1/10" : ""
                }`}
              >
                GST
              </th>
              <th className="border border-[#E5E7EB] p-2 text-right font-medium text-sm w-20">
                AMOUNT
              </th>
              {isEditMode && (
                <th className="border border-[#E5E7EB] p-0 text-center font-medium text-sm w-6"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {serviceItems.map((item, index) => (
              <tr key={index} className={isEditMode ? "group relative" : ""}>
                <td className="border border-[#E5E7EB] p-2 text-[#545454] align-middle">
                  {isEditMode ? (
                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        handleServiceItemChange(
                          index,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Enter Description"
                      className="w-full min-h-[44px] px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-y"
                      style={{ resize: "vertical" }}
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td
                  className={`border border-[#E5E7EB] p-2 text-center text-[#545454] align-middle ${
                    isEditMode ? "w-1/10" : ""
                  }`}
                >
                  {isEditMode ? (
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleServiceItemChange(
                          index,
                          "quantity",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="w-full text-xs px-3 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-center"
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td
                  className={`border border-[#E5E7EB] p-2 text-right text-[#545454] align-middle ${
                    isEditMode ? "w-3/20" : "w-1/6"
                  }`}
                >
                  {isEditMode ? (
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleServiceItemChange(index, "rate", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                    />
                  ) : (
                    item.rate
                  )}
                </td>
                <td
                  className={`border border-[#E5E7EB] p-2 text-center text-[#545454] align-middle ${
                    isEditMode ? "w-1/10" : ""
                  }`}
                >
                  {isEditMode ? (
                    <input
                      type="number"
                      value={item.taxRate}
                      onChange={(e) =>
                        handleServiceItemChange(
                          index,
                          "taxRate",
                          e.target.value
                        )
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-[12px] text-xs bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-center"
                    />
                  ) : (
                    item.taxRate
                  )}
                </td>
                <td className="border border-[#E5E7EB] p-2 text-right text-[#545454] align-middle w-1/12">
                  {isEditMode ? (
                    <input
                      type="number"
                      value={
                        editedServiceItemAmounts[index] !== undefined &&
                        editedServiceItemAmounts[index] !== null
                          ? editedServiceItemAmounts[index]
                          : item.amount
                      }
                      onChange={(e) =>
                        handleEditedItemAmountChange(index, e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-[12px] text-xs bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                    />
                  ) : (
                    item.amount
                  )}
                </td>
                {isEditMode && (
                  <td className="border border-[#E5E7EB] p-0 text-center align-middle w-6">
                    <button
                      onClick={() => removeServiceItem(index)}
                      className="flex items-center justify-center w-6 h-6 rounded-full hover:bg-red-100"
                      title="Delete"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-4 h-4 text-red-500 group-hover:text-red-700"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {isEditMode && (
              <tr>
                <td colSpan="6" className="p-2">
                  <button
                    onClick={addServiceItem}
                    className="h-[44px] px-10 rounded-[12px] bg-[#ef7e1b] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-white w-full"
                  >
                    Add Item
                  </button>
                </td>
              </tr>
            )}
            <tr>
              <td
                className="border border-[#E5E7EB] py-2 px-2 text-right font-bold text-[#1F2837] leading-tight h-6"
                colSpan={isEditMode ? "3" : "4"}
              >
                SUB TOTAL
              </td>
              <td
                className="border border-[#E5E7EB] py-0.5 px-2 text-right font-bold text-[#1F2837] leading-tight h-6"
                colSpan={isEditMode ? "2" : "1"}
              >
                {isEditMode ? (
                  <input
                    type="number"
                    value={
                      editedSubTotal !== null
                        ? editedSubTotal
                        : calculateSubTotal()
                    }
                    onChange={(e) =>
                      handleEditedTotalChange("subTotal", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                  />
                ) : (
                  calculateSubTotal()
                )}
              </td>
              {isEditMode && <td className="border-none"></td>}
            </tr>
            <tr>
              <td
                className="border border-[#E5E7EB] py-0.5 px-2 text-right text-[0.625rem] font-medium text-[#1F2837] leading-tight h-6"
                colSpan={isEditMode ? "4" : "4"}
              >
                {isEditMode ? (
                  <input
                    type="text"
                    value={
                      editedCgstLabel !== null ? editedCgstLabel : "CGST AMOUNT"
                    }
                    onChange={(e) =>
                      handleEditedGstLabelChange("cgstLabel", e.target.value)
                    }
                    className="text-right  bg-transparent border-none outline-none font-medium text-[0.625rem] text-[#1F2837] w-24"
                  />
                ) : (
                  <span>CGST AMOUNT</span>
                )}
                {serviceItems.length > 0 &&
                  (isEditMode ? (
                    <input
                      type="number"
                      value={
                        editedCgstPercentage !== null
                          ? editedCgstPercentage
                          : ""
                      }
                      onChange={(e) =>
                        handleEditedGstPercentageChange(
                          "cgstPercentage",
                          e.target.value
                        )
                      }
                      className="ml-1 text-right bg-transparent border-none outline-none text-[0.625rem] font-medium text-[#1F2837] w-8"
                    />
                  ) : (
                    <span className="ml-1"></span>
                  ))}
              </td>
              <td className="border border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6">
                {isEditMode ? (
                  <input
                    type="number"
                    value={
                      editedCgstTotal !== null
                        ? editedCgstTotal
                        : calculateCgstTotal()
                    }
                    onChange={(e) =>
                      handleEditedTotalChange("cgstTotal", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                  />
                ) : (
                  calculateCgstTotal()
                )}
              </td>
              {isEditMode && <td className="border-none"></td>}
            </tr>
            <tr>
              <td
                className="border border-[#E5E7EB] py-0.5 px-2 text-right text-[0.625rem] font-medium text-[#1F2837] leading-tight h-6"
                colSpan={isEditMode ? "4" : "4"}
              >
                {isEditMode ? (
                  <input
                    type="text"
                    value={
                      editedSgstLabel !== null ? editedSgstLabel : "SGST AMOUNT"
                    }
                    onChange={(e) =>
                      handleEditedGstLabelChange("sgstLabel", e.target.value)
                    }
                    className="text-right bg-transparent border-none outline-none font-medium text-[0.625rem] text-[#1F2837] w-24"
                  />
                ) : (
                  <span>SGST AMOUNT</span>
                )}
                {serviceItems.length > 0 &&
                  (isEditMode ? (
                    <input
                      type="number"
                      value={
                        editedSgstPercentage !== null
                          ? editedSgstPercentage
                          : ""
                      }
                      onChange={(e) =>
                        handleEditedGstPercentageChange(
                          "sgstPercentage",
                          e.target.value
                        )
                      }
                      className="ml-1 text-right bg-transparent border-none outline-none text-[0.625rem] font-medium text-[#1F2837] w-8"
                    />
                  ) : (
                    <span className="ml-1"></span>
                  ))}
              </td>
              <td className="border border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6">
                {isEditMode ? (
                  <input
                    type="number"
                    value={
                      editedSgstTotal !== null
                        ? editedSgstTotal
                        : calculateSgstTotal()
                    }
                    onChange={(e) =>
                      handleEditedTotalChange("sgstTotal", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                  />
                ) : (
                  calculateSgstTotal()
                )}
              </td>
              {isEditMode && <td className="border-none"></td>}
            </tr>
            <tr>
              <td
                className="border border-[#E5E7EB] py-0.5 px-2 text-right font-medium text-[0.625rem] text-[#1F2837] leading-tight h-6"
                colSpan={isEditMode ? "4" : "4"}
              >
                {isEditMode ? (
                  <input
                    type="text"
                    value={
                      editedIgstLabel !== null ? editedIgstLabel : "IGST AMOUNT"
                    }
                    onChange={(e) =>
                      handleEditedGstLabelChange("igstLabel", e.target.value)
                    }
                    className="text-right bg-transparent border-none outline-none font-medium text-[0.625rem] text-[#1F2837] w-24"
                  />
                ) : (
                  <span>IGST AMOUNT</span>
                )}
                {serviceItems.length > 0 &&
                  (isEditMode ? (
                    <input
                      type="number"
                      value={
                        editedIgstPercentage !== null
                          ? editedIgstPercentage
                          : ""
                      }
                      onChange={(e) =>
                        handleEditedGstPercentageChange(
                          "igstPercentage",
                          e.target.value
                        )
                      }
                      className="ml-1 text-right bg-transparent border-none outline-none text-[0.625rem] font-medium text-[#1F2837] w-8"
                    />
                  ) : (
                    <span className="ml-1"></span>
                  ))}
              </td>
              <td className="border border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6">
                {isEditMode ? (
                  <input
                    type="number"
                    value={
                      editedIgstTotal !== null
                        ? editedIgstTotal
                        : calculateIgstTotal()
                    }
                    onChange={(e) =>
                      handleEditedTotalChange("igstTotal", e.target.value)
                    }
                    placeholder="0"
                    className="w-full px-3 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                  />
                ) : (
                  calculateIgstTotal()
                )}
              </td>
              {isEditMode && <td className="border-none"></td>}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bank Details and Totals */}
      <div className="flex justify-between mb-8 text-sm text-[#4B5563]">
        <div className="w-1/2 pr-4">
          <div className="flex mb-1">
            <span className="w-32 font-semibold">Bank Name:</span>
            {isEditMode ? (
              <input
                type="text"
                name="bankName"
                value={invoiceData.bankName}
                onChange={handleInputChange}
                placeholder="Enter Bank Name"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="text-[#545454]">{invoiceData.bankName}</span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold">Account Name:</span>
            {isEditMode ? (
              <input
                type="text"
                name="accountName"
                value={invoiceData.accountName}
                onChange={handleInputChange}
                placeholder="Enter Account Name"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="text-[#545454]">{invoiceData.accountName}</span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold">IFSC Code:</span>
            {isEditMode ? (
              <input
                type="text"
                name="ifscCode"
                value={invoiceData.ifscCode}
                onChange={handleInputChange}
                placeholder="Enter IFSC Code"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="text-[#545454]">{invoiceData.ifscCode}</span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold">Account No:</span>
            {isEditMode ? (
              <input
                type="text"
                name="accountNo"
                value={invoiceData.accountNo}
                onChange={handleInputChange}
                placeholder="Enter Account No."
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="text-[#545454]">{invoiceData.accountNo}</span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold">Bank Branch:</span>
            {isEditMode ? (
              <input
                type="text"
                name="bankBranch"
                value={invoiceData.bankBranch}
                onChange={handleInputChange}
                placeholder="Enter Bank Branch"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="text-[#545454]">{invoiceData.bankBranch}</span>
            )}
          </div>
        </div>
        <div className="w-1/2 pl-4 text-right">
          <div className="flex justify-end items-center mb-2">
            <span className="font-bold mr-4 text-[#1F2837]">GRAND TOTAL</span>
            {isEditMode ? (
              <input
                type="number"
                value={displayedGrandTotal}
                onChange={(e) =>
                  handleEditedOverallTotalChange("grandTotal", e.target.value)
                }
                placeholder="0"
                className="border-b border-[#E5E7EB] text-xs pb-1 w-24 text-right font-bold text-[#1F2837] px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <span className="border-b border-[#E5E7EB] pb-1 w-24 text-right font-bold text-[#1F2837]">
                {displayedGrandTotal}
              </span>
            )}
          </div>
          <div className="flex justify-end items-center mb-2">
            <span className="font-bold mr-4 text-[#1F2837]">
              Received Amount
            </span>
            {isEditMode ? (
              <input
                type="number"
                name="receivedAmount"
                value={receivedAmount}
                onChange={(e) =>
                  setReceivedAmount(parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                className="border-b border-[#E5E7EB] text-xs pb-1 w-24 text-right text-[#545454] px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
              />
            ) : (
              <span className="border-b border-[#E5E7EB] pb-1 w-24 text-right text-[#545454]">
                {receivedAmount}
              </span>
            )}
          </div>
          <div className="flex justify-end items-center">
            <span className="font-bold mr-4 text-[#1F2837]">Balance</span>
            {isEditMode ? (
              <input
                type="number"
                value={displayedBalance}
                onChange={(e) =>
                  handleEditedOverallTotalChange("balance", e.target.value)
                }
                placeholder="0"
                className="border-b border-[#E5E7EB] pb-1 text-xs w-24 text-right text-[#545454] px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
              />
            ) : (
              <span className="border-b border-[#E5E7EB] pb-1 w-24 text-right text-[#545454]">
                {displayedBalance}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Terms and Conditions and Signature */}
      <div className="flex justify-between items-end">
        <div className="w-1/2 text-sm pr-4 text-[#4B5563]">
          <h3 className="font-bold mb-2">TERMS AND CONDITIONS:</h3>
          <ol className="list-decimal list-outside space-y-1 pl-5 text-xs">
            {isEditMode ? (
              <>
                {invoiceData.termsAndConditions.map((term, index) => (
                  <li key={index}>
                    <textarea
                      value={term}
                      onChange={(e) => {
                        const newTerms = [...invoiceData.termsAndConditions];
                        newTerms[index] = e.target.value;
                        setInvoiceData((prev) => ({
                          ...prev,
                          termsAndConditions: newTerms,
                        }));
                        autoResizeTextarea(e); // Call auto-resize function
                      }}
                      onInput={autoResizeTextarea} // Auto-resize on initial load and input
                      placeholder="Enter Term"
                      className="w-full px-3 py-1 overflow-y-hidden rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-y terms-textarea"
                    />
                  </li>
                ))}
                <li>
                  <button
                    onClick={() =>
                      setInvoiceData((prev) => ({
                        ...prev,
                        termsAndConditions: [...prev.termsAndConditions, ""],
                      }))
                    }
                    className="text-Duskwood-500 hover:text-Duskwood-700 mt-2"
                  >
                    Add Term
                  </button>
                </li>
              </>
            ) : (
              invoiceData.termsAndConditions.map((term, index) => (
                <li key={index}>{term}</li>
              ))
            )}
          </ol>
        </div>
        <div className="w-1/2 text-center pl-4">
          {invoiceData.upload_seal && (
            <img
              src={invoiceData.upload_seal}
              alt="Authorised Seal"
              className="mx-auto mb-2 h-20"
            />
          )}
          <p className="font-bold text-[#1F2837]">AUTHORISED SIGNATORY FOR</p>
          {isEditMode ? (
            <input
              type="text"
              name="authorisedSignatory"
              value={invoiceData.authorisedSignatory}
              onChange={handleInputChange}
              placeholder="Enter Authorised Signatory"
              className="text-[#545454] w-full block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454]"
            />
          ) : (
            <p className="text-[#545454]">{invoiceData.authorisedSignatory}</p>
          )}
        </div>
      </div>

      {/* Calculation Breakdown (Edit Mode Only) */}
      {isEditMode && (
        <div className="mt-9 p-3 bg-[#F8FAFC] rounded-xl border border-[#E7EFF8] text-xs text-[#545454]">
          <h3 className="font-bold mb-2 text-base text-[#1F2837]">
            Calculation Breakdown
          </h3>
          <div className="space-y-2">
            {serviceItems.map((item, index) => {
              const baseAmount = item.quantity * item.rate;
              const halfTaxRate = item.taxRate / 2;
              const companyStateClean = invoiceData.companyState
                ? invoiceData.companyState.toLowerCase().trim()
                : "";
              const billToStateClean = invoiceData.billToState
                ? invoiceData.billToState.toLowerCase().trim()
                : "";

              return (
                <div
                  key={index}
                  className="border-b border-[#E7EFF8] pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0"
                >
                  <p className="font-semibold mb-1 text-sm">
                    Item {index + 1}: {item.description || "New Item"}
                  </p>
                  <div className="flex justify-between items-center">
                    <span>
                      Base Amount: {item.quantity} (Qty) x {item.rate} (Rate)
                    </span>
                    <span className="font-medium">
                      = {baseAmount.toFixed(2)}
                    </span>
                  </div>
                  {companyStateClean === billToStateClean ? (
                    <>
                      <div className="flex justify-between items-center pl-4">
                        <span>
                          CGST ({halfTaxRate.toFixed(2)}%):{" "}
                          {baseAmount.toFixed(2)} x {halfTaxRate.toFixed(2)}%
                        </span>
                        <span className="font-medium">
                          = {item.cgstAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pl-4">
                        <span>
                          SGST ({halfTaxRate.toFixed(2)}%):{" "}
                          {baseAmount.toFixed(2)} x {halfTaxRate.toFixed(2)}%
                        </span>
                        <span className="font-medium">
                          = {item.sgstAmount.toFixed(2)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center pl-4">
                      <span>
                        IGST ({item.taxRate.toFixed(2)}%):{" "}
                        {baseAmount.toFixed(2)} x {item.taxRate.toFixed(2)}%
                      </span>
                      <span className="font-medium">
                        = {item.igstAmount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center font-medium mt-1 pt-1 border-t border-gray-200">
                    <span>
                      Total for item: {baseAmount.toFixed(2)} +{" "}
                      {item.taxAmount.toFixed(2)} (GST)
                    </span>
                    <span className="text-[#1F2837]">
                      = {item.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="pt-3 border-t border-[#E7EFF8] space-y-1 mt-3">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall Subtotal:</span>
                <span className="text-[#1F2837]">
                  {calculateSubTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall CGST:</span>
                <span className="text-[#1F2837]">
                  {calculateCgstTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall SGST:</span>
                <span className="text-[#1F2837]">
                  {calculateSgstTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Overall IGST:</span>
                <span className="text-[#1F2837]">
                  {calculateIgstTotal().toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                <span className="font-bold text-[#1F2837]">Grand Total:</span>
                <span className="font-bold text-[#1F2837]">
                  {displayedGrandTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-14">
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-[10px] w-full sm:w-auto">
          {isEditMode ? (
            <>
              <button
                onClick={toggleMode}
                className="w-full sm:w-[150px] h-[40px] border border-[rgb(39,152,255)] rounded-[10px] text-[rgb(39,152,255)] text-[16px] font-semibold flex items-center justify-center hover:text-white hover:bg-[rgb(39,152,255)] mb-3"
              >
                Exit Edit Mode
              </button>
              <button
                onClick={saveChanges}
                className="w-full sm:w-[150px] h-[40px] bg-[rgb(39,152,255)] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#ee7f1b]"
              >
                Save Changes
              </button>
            </>
          ) : (
            <>
              <button
                onClick={toggleMode}
                className="w-full sm:w-[150px] h-[40px] border border-[rgb(39,152,255)] rounded-[10px] text-[rgb(39,152,255)] text-[16px] font-semibold flex items-center justify-center hover:text-white hover:bg-[rgb(39,152,255)]"
              >
                Enter Edit Mode
              </button>
              <button
                onClick={submitInvoice}
                className="w-full sm:w-[150px] h-[40px] bg-[rgb(39,152,255)] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#ee7f1b]"
              >
                Submit Invoice
              </button>
            </>
          )}
        </div>

        {!isEditMode && (
          <PDFDownloadLink
            document={
              <InvoicePDF
                invoiceData={invoiceData}
                serviceItems={serviceItems}
                organizationEmail={organizationEmail}
                user={user}
              />
            }
            fileName={`invoice-${invoiceData.invoiceNo || "export"}.pdf`}
            style={{ textDecoration: "none" }}
          >
            {({ loading }) =>
              loading ? (
                <div className="hidden lg:flex justify-end items-center hover:bg-gray-100 p-4 rounded-full">
                  <p className="mr-4 text-[#8B8B8B] text-sm">
                    Generating PDF...
                  </p>
                </div>
              ) : (
                <div className="hidden lg:flex justify-end items-center hover:bg-gray-100 p-4 rounded-full">
                  <p className="mr-4 text-[#8B8B8B] text-sm">Export to</p>
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
                </div>
              )
            }
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default invoiceComponent;
