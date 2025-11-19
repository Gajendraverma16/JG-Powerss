import api from "@/api";
import React, { useState, useEffect, useRef, useMemo, useContext } from "react";
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
import { useLocation } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";

import { useAuth } from "../../auth/AuthContext";
import { SidebarContext } from "../../components/Layout";

// PDF Styles (pixel-perfect, Tailwind-inspired)

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

const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    // Try to parse "YYYY-MM-DD"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }
    // Try to parse "DD MM YYYY"
    if (/^\d{2} \d{2} \d{4}$/.test(dateString)) {
      const [day, month, year] = dateString.split(" ");
      return `${day}/${month}/${year}`;
    }
    // Fallback: try Date parsing
    const date = new Date(dateString);
    if (!isNaN(date)) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return dateString;
  } catch (e) {
    console.error("Error formatting date:", e);
    return dateString;
  }
};

const parseDateToISO = (dateString) => {
  if (!dateString) return "";
  const parts = dateString.split(" ");
  if (parts.length === 3) {
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateString;
};

const InvoicePDF = ({
  invoiceData,
  serviceItems,
  organizationEmail,
  user,
  isGstEnabled,
  subTotal,
  cgstTotal,
  sgstTotal,
  igstTotal,
  totalGstPayable,
  grandTotal,
  balance,
  roundOffDecimal, // Pass this prop to PDF
}) => {
  // Calculate totalRowsCount for dynamic rowSpan in PDF, mirroring HTML logic
  let totalRowsCount = 1; // SUB TOTAL
  if (isGstEnabled) totalRowsCount += 4; // CGST, SGST, IGST, TOTAL GST PAYABLE
  totalRowsCount += 3; // GRAND TOTAL, Received Amount, Balance

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
      marginTop: 5,
    },
    logo: {
      width: 158, // smaller logo
      height: 70,

      marginRight: 18, // tighter spacing
      objectFit: "cover",
    },
    companyInfo: {
      flexDirection: "column",
      flexGrow: 1,
    },
    companyName: {
      fontSize: 28, // smaller title
      fontWeight: "bold",
      color: "#0e4053", // text-[rgb(39,152,255)]
      marginBottom: 4,
    },
    address: {
      fontSize: 11,
      color: "#1F2937", // text-[rgb(31,41,55)]
      marginBottom: 1,
    },
    contactRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 1,
      marginTop: 4,
    },
    contact: {
      fontSize: 11,
      color: "#1F2937",
      marginRight: 8,
    },
    invoiceTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: "#0e4053",
      textAlign: "right",
      marginTop: 15,
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
      marginBottom: 2,
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
      marginTop: 10,
    },
    partyBlockRight: {
      flex: 1,
      paddingLeft: 8,
      paddingRight: 0,
      marginTop: 10,
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
      marginBottom: 4,
    },
    partyAddress: {
      fontSize: 9,
      color: "#545454",
      marginBottom: 3,
    },
    partyContact: {
      fontSize: 9,
      color: "#545454",
      marginBottom: 3,
    },
    table: {
      width: "100%",
      marginTop: 0,
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      overflow: "hidden",
      marginBottom: 0,
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#E7EFF8",
      color: "#4B5563",
      fontWeight: "bold",
      fontSize: 10,
      borderBottomWidth: 0,
      overflow: "hidden",
      marginTop: -1, // Overlap border with previous table
      marginBottom: 0, // Changed from 12 to 0 to remove gap with items
      borderTopWidth: 0, // No top border
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
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
    thRate: { width: isGstEnabled ? "17%" : "27%", textAlign: "center" },
    thGst: { width: "10%", textAlign: "center" },
    thAmt: {
      width: "50%",
      textAlign: "right",
      // Remove border on the right to avoid double border with table outer border
      borderRightWidth: 0,
      alignItems: "flex-end", // <-- Add this
      display: "flex", // <-- And this
    },
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
      // Add flex properties for vertical alignment.
      justifyContent: "center",
    },
    tdDesc: { width: "50%", textAlign: "left" },
    tdQty: { width: "10%", textAlign: "center" },
    tdRate: { width: isGstEnabled ? "17%" : "27%", textAlign: "center" },
    tdGst: { width: "10%", textAlign: "center" },
    tdAmt: {
      width: "50%",
      textAlign: "right",
      // Remove border on the right to avoid double border with table outer border
      borderRightWidth: 0,
    },
    tableRow: {
      flexDirection: "row",
      // Remove bottom border
      borderBottomWidth: 0,
      borderColor: "#E5E7EB",
      marginBottom: 0, // Reduce vertical gap between rows
      paddingTop: 0, // Remove any top padding
      paddingBottom: 0, // Remove any bottom padding
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
      fontSize: 10,
      color: "#4B5563",
      width: "50%",
      paddingRight: 5,
    },
    bankBlockRight: {
      marginTop: 0,
      fontSize: 10,
      color: "#4B5563",
      width: "50%",
      textAlign: "right",
      paddingLeft: 0,
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
      width: 96,
      height: 96,
      margin: "0 auto 0 auto",
      objectFit: "contain",
    },
    signatory: {
      fontWeight: "bold",
      fontSize: 9,
      color: "#1F2837",
      textAlign: "center",
      marginTop: 0,
    },
    tableBody: {
      // New style for the table body container
      flexGrow: 1,
      flexDirection: "column",
    },
    totalsTable: {
      width: "100%",
      borderWidth: 1,
      borderColor: "#E5E7EB",
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      overflow: "hidden",
      marginTop: -1, // Overlap border with previous table
      marginBottom: 12,
      borderTopWidth: 0, // No top border
    },
    totalsTableRow: {
      flexDirection: "row",

      // Remove borderTopWidth here as it will be applied to specific cells
      flexGrow: 1,
      minHeight: 28,
      alignItems: "stretch",
    },
    // New style for the label column when it spans Rate and GST
    totalsLabelColSpan: {
      width: "27%", // Combined width of RATE (16.6%) and GST (10%)
      textAlign: "right", // Align the text to the right
      borderRightWidth: 1, // Keep right border to separate from Amount
      borderColor: "#E5E7EB",
      padding: 4, // Match other cell padding
      borderLeftWidth: 1, // Add left border
      borderBottomWidth: 1, // Add bottom border here
    },

    // Existing totalsTdAmt (Amount column)
    totalsTdAmt: {
      width: "13.4%", // Matches amount column width
      textAlign: "right",
      borderRightWidth: 0,
      // Inherits padding and font from pdfStyles.td where applied
      borderBottomWidth: 1, // Add bottom border here
    },
    // Updated styles for the terms and conditions section
    termsColumn: {
      width: "50%",
      paddingRight: 8,
      fontSize: 8,
      color: "#4B5563",
      flexDirection: "column",
      justifyContent: "flex-start",
    },
    emptySpacerColumn: {
      // New style for the empty column between terms and totals
      width: "10%",
      backgroundColor: "#fff", // Explicitly white background for clarity in PDF
      borderColor: "#E5E7EB",
      borderLeftWidth: 0, // Remove left border
      borderRightWidth: 0, // Remove right border
      borderTopWidth: 0, // Add top border for visual separation from items table
    },
    totalsColumn: {
      width: "100%",
      borderLeftWidth: 0, // Keep left border to separate from empty column
      borderColor: "#E5E7EB",
      flexDirection: "column", // For individual total rows
      borderTopWidth: 0, // Add top border for visual separation from items table
    },
    // Redefine existing totals styles relative to their new parent (totalsColumn)
    // These will be percentages of 45% of the page. Original combined totals was 40% of page (26.6% label, 13.4% amount)
    // Now totalsColumn is 45% of page. So percentages are: label (26.6/40)*100 = 66.5%, amount (13.4/40)*100 = 33.5%
    totalsLabelRelativeWidth: { width: "70.5%" },
    totalsAmountRelativeWidth: { width: "40.5%" },
  });

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <PDFView
          style={{ width: "100%", alignItems: "flex-end", marginBottom: 4 }}
        >
          <PDFImage
            src={"/invoice-text.png"}
            style={{ width: 60, height: 15 }}
            cache={false}
          />
        </PDFView>

        <PDFView style={pdfStyles.headerSection}>
          <PDFView style={{ flexDirection: "row", alignItems: "center" }}>
            {user?.profile_pic && user.profile_pic !== "" && (
              <PDFImage
                src={convertImageUrlForPdf(user.profile_pic)}
                style={pdfStyles.logo}
                cache={false}
              />
            )}
            <PDFView style={pdfStyles.companyInfo}>
              <Text style={pdfStyles.companyName}>
                {invoiceData.companyName}
              </Text>
              {/* Address block: match view mode */}
              {invoiceData.addressLine1 && (
                <Text style={pdfStyles.address}>
                  {invoiceData.addressLine1}
                </Text>
              )}
              {/* Combine City, State, Country, Pincode into one line */}
              {(invoiceData.addressLine2 ||
                invoiceData.companyPincode ||
                invoiceData.companyCountry) && (
                <Text style={pdfStyles.address}>
                  {invoiceData.addressLine2}
                  {invoiceData.addressLine2 &&
                    (invoiceData.companyCountry ||
                      invoiceData.companyPincode) &&
                    ", "}
                  {invoiceData.companyCountry}
                  {invoiceData.companyCountry && invoiceData.companyPincode
                    ? ", "
                    : ""}
                  {invoiceData.companyPincode}
                </Text>
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
          {/* <Text style={pdfStyles.invoiceTitle}>Invoice</Text> */}
        </PDFView>
        <PDFView style={pdfStyles.divider} />
        {/* Invoice Details */}
        <PDFView style={pdfStyles.detailsRow}>
          <Text>Invoice No.: {invoiceData.invoiceNo}</Text>
          <Text>Invoice Date: {formatDate(invoiceData.invoiceDate)}</Text>
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

            marginBottom: 0,
          }}
        >
          <PDFView style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.th, pdfStyles.thDesc]}>ITEMS</Text>
            <Text style={[pdfStyles.th, pdfStyles.thQty]}>QTY</Text>
            <Text style={[pdfStyles.th, pdfStyles.thRate]}>RATE</Text>
            {/* GST Column - Only show if GST breakdown is enabled */}
            {isGstEnabled && (
              <Text style={[pdfStyles.th, pdfStyles.thGst]}>GST</Text>
            )}
            <Text style={[pdfStyles.th, pdfStyles.thAmt]}>AMOUNT</Text>
          </PDFView>
          <PDFView style={pdfStyles.tableBody}>
            {/* Wrap rows in a new flex container */}
            {serviceItems.map((item, idx) => (
              <PDFView
                style={{
                  ...pdfStyles.tableRow,
                  flexGrow: undefined,
                  marginBottom: 0,
                  paddingTop: 0,
                  paddingBottom: 0,
                }}
                key={idx}
              >
                <Text style={[pdfStyles.td, pdfStyles.tdDesc]}>
                  {item.description}
                </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdQty]}>
                  {item.quantity}
                </Text>
                <Text style={[pdfStyles.td, pdfStyles.tdRate]}>
                  {(isNaN(parseFloat(item.rate))
                    ? 0
                    : parseFloat(item.rate)
                  ).toFixed(roundOffDecimal)}
                </Text>
                {/* GST Column - Only show if GST breakdown is enabled */}
                {isGstEnabled && (
                  <Text style={[pdfStyles.td, pdfStyles.tdGst]}>
                    {isNaN(parseFloat(item.taxRate))
                      ? 0
                      : parseFloat(item.taxRate)}
                  </Text>
                )}
                <Text
                  style={[
                    pdfStyles.td,
                    pdfStyles.tdAmt,
                    { alignSelf: "flex-end" },
                  ]}
                >
                  {(isNaN(parseFloat(item.amount))
                    ? 0
                    : parseFloat(item.amount)
                  ).toFixed(roundOffDecimal)}
                </Text>
              </PDFView>
            ))}
            {/* Add empty rows to visually extend the table if there are few items */}
            {Array.from({ length: Math.max(0, 5 - serviceItems.length) }).map(
              (_, idx) => (
                <PDFView
                  style={{
                    ...pdfStyles.tableRow,
                    flexGrow: undefined,
                    marginBottom: 0,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  key={`empty-${idx}`}
                >
                  <Text style={[pdfStyles.td, pdfStyles.tdDesc]}>
                    {"\u00A0"}{" "}
                  </Text>
                  <Text style={[pdfStyles.td, pdfStyles.tdQty]}>
                    {"\u00A0"}{" "}
                  </Text>
                  <Text style={[pdfStyles.td, pdfStyles.tdRate]}>
                    {"\u00A0"}{" "}
                  </Text>
                  {/* GST Column - Only show if GST breakdown is enabled */}
                  {isGstEnabled && (
                    <Text style={[pdfStyles.td, pdfStyles.tdGst]}>
                      {"\u00A0"}{" "}
                    </Text>
                  )}
                  <Text style={[pdfStyles.td, pdfStyles.tdAmt]}>
                    {"\u00A0"}{" "}
                  </Text>
                </PDFView>
              )
            )}
          </PDFView>{" "}
          {/* End of new flex container */}
        </PDFView>
        {/* Combined Terms and Conditions and Totals Table */}
        <PDFView
          style={[
            pdfStyles.totalsTable,
            {
              flexDirection: "row",
              marginTop: 0,
              marginBottom: 12,
              borderTopWidth: 0, // Remove top border for the entire combined block
            },
          ]}
        >
          {/* Right Column: Totals */}
          <PDFView style={pdfStyles.totalsColumn}>
            {/* Subtotal */}
            <PDFView style={pdfStyles.totalsTableRow}>
              <PDFView
                style={[
                  pdfStyles.td,
                  pdfStyles.totalsLabelRelativeWidth,
                  { borderTopWidth: 0 }, // Added borderBottomWidth
                ]}
              >
                <Text style={{ fontWeight: "bold", textAlign: "right" }}>
                  SUB TOTAL
                </Text>
              </PDFView>
              <PDFView
                style={[
                  pdfStyles.td,
                  pdfStyles.totalsAmountRelativeWidth,
                  {
                    borderRightWidth: 0,
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                  }, // Added borderBottomWidth
                ]}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    textAlign: "right",
                    borderTopWidth: 0,
                  }}
                >
                  {subTotal.toFixed(roundOffDecimal)}
                </Text>
              </PDFView>
            </PDFView>

            {/* CGST */}
            {isGstEnabled && (
              <PDFView style={[pdfStyles.totalsTableRow, { minHeight: 18 }]}>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsLabelRelativeWidth,
                    { borderBottomWidth: 1, borderTopWidth: 1 }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    CGST AMOUNT
                  </Text>
                </PDFView>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsAmountRelativeWidth,
                    {
                      borderRightWidth: 0,
                      borderBottomWidth: 1,
                      borderTopWidth: 1,
                    }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    {cgstTotal.toFixed(roundOffDecimal)}
                  </Text>
                </PDFView>
              </PDFView>
            )}

            {/* SGST */}
            {isGstEnabled && (
              <PDFView style={[pdfStyles.totalsTableRow, { minHeight: 18 }]}>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsLabelRelativeWidth,
                    { borderBottomWidth: 1 }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    SGST AMOUNT
                  </Text>
                </PDFView>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsAmountRelativeWidth,
                    { borderRightWidth: 0, borderBottomWidth: 1 }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    {sgstTotal.toFixed(roundOffDecimal)}
                  </Text>
                </PDFView>
              </PDFView>
            )}

            {/* IGST */}
            {isGstEnabled && (
              <PDFView style={[pdfStyles.totalsTableRow, { minHeight: 18 }]}>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsLabelRelativeWidth,
                    { borderBottomWidth: 1 }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    IGST AMOUNT
                  </Text>
                </PDFView>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsAmountRelativeWidth,
                    { borderRightWidth: 0, borderBottomWidth: 1 }, // Added borderBottomWidth
                  ]}
                >
                  <Text style={{ fontSize: 5, textAlign: "right" }}>
                    {igstTotal.toFixed(roundOffDecimal)}
                  </Text>
                </PDFView>
              </PDFView>
            )}

            {/* Total GST Payable - New Row */}
            {isGstEnabled && (
              <PDFView style={[pdfStyles.totalsTableRow, { minHeight: 18 }]}>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsLabelRelativeWidth,
                    { borderBottomWidth: 0, minHeight: 18 }, // Changed from 0 to 1
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "normal",
                      fontSize: 5,
                      textAlign: "right",
                    }}
                  >
                    TOTAL GST PAYABLE
                  </Text>
                </PDFView>
                <PDFView
                  style={[
                    pdfStyles.td,
                    pdfStyles.totalsAmountRelativeWidth,
                    { borderBottomWidth: 0, borderRightWidth: 0 }, // Changed from 0 to 1
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: "normal",
                      fontSize: 5,
                      textAlign: "right",
                    }}
                  >
                    {totalGstPayable.toFixed(roundOffDecimal)}
                  </Text>
                </PDFView>
              </PDFView>
            )}
          </PDFView>
        </PDFView>
        {/* Bank Details and Totals */}
        <PDFView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 32,
            marginTop: 32, // Add some top margin to separate from the combined totals table
          }}
        >
          {/* Left Column: Bank Details */}
          <PDFView style={[pdfStyles.bankBlock, {marginLeft:5}]}>
            {/* Bank details with clear separation */}
            <PDFView style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", width: 80 }}>Bank Name:</Text>
              <Text style={{ color: "#545454" }}>{invoiceData.bankName}</Text>
            </PDFView>
            <PDFView style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", width: 80 }}>
                Account Name:
              </Text>
              <Text style={{ color: "#545454" }}>
                {invoiceData.accountName}
              </Text>
            </PDFView>
            <PDFView style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", width: 80 }}>IFSC Code:</Text>
              <Text style={{ color: "#545454" }}>{invoiceData.ifscCode}</Text>
            </PDFView>
            <PDFView style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", width: 80 }}>Account No:</Text>
              <Text style={{ color: "#545454" }}>{invoiceData.accountNo}</Text>
            </PDFView>
            <PDFView style={{ flexDirection: "row", marginBottom: 8 }}>
              <Text style={{ fontWeight: "bold", width: 80 }}>
                Bank Branch:
              </Text>
              <Text style={{ color: "#545454" }}>{invoiceData.bankBranch}</Text>
            </PDFView>
          </PDFView>

          {/* Right Column: Totals */}
          <PDFView style={[pdfStyles.bankBlockRight, {marginRight:5}]}>
            {/* GRAND TOTAL */}
            <PDFView
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 15,
              }}
            >
              <Text style={{ fontWeight: "bold", marginRight: 8 }}>
                GRAND TOTAL:
              </Text>
              <Text style={{ fontWeight: "bold", borderBottomWidth: 1, borderColor: "#E5E7EB", width: 80, }}>
                {grandTotal.toFixed(roundOffDecimal)}
              </Text>
            </PDFView>
            {/* Received Amount */}
            <PDFView
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 15,
              }}
            >
              <Text style={{ fontWeight: "bold", marginRight: 8 }}>
                Received Amount:
              </Text>
              <Text style={{ borderBottomWidth: 1, borderColor: "#E5E7EB",width: 80, }}>
                {(invoiceData.receivedAmount || 0).toFixed(roundOffDecimal)}
              </Text>
            </PDFView>
            {/* Balance */}
            <PDFView
              style={{
                flexDirection: "row",
                justifyContent: "flex-end",
                marginBottom: 15,
              }}
            >
              <Text style={{ fontWeight: "bold", marginRight: 10 }}>
                Balance:
              </Text>
              <Text style={{ borderBottomWidth: 1, borderColor: "#E5E7EB", width: 80, }}>
                {balance.toFixed(roundOffDecimal)}
              </Text>
            </PDFView>
          </PDFView>
        </PDFView>

        {/* Terms and Conditions and Authorised Signatory */}
        <PDFView
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 32,
            marginTop: 16,
          }}
        >
          {/* Left Column: Terms and Conditions */}
          <PDFView style={[pdfStyles.termsColumn, {marginLeft: 5}]}>
            <Text style={{ fontWeight: "bold", marginBottom: 8, fontSize: 11 }}>
              TERMS AND CONDITIONS:
            </Text>
            <PDFView>
              {invoiceData.termsAndConditions?.map((term, idx) => (
                <PDFView
                  key={idx}
                  style={{ flexDirection: "row", marginBottom: 2 }}
                >
                  <Text
                    style={{
                      width: 8,
                      textAlign: "right",
                      marginRight: 1,
                      fontSize: 10,
                      marginBottom: 3,
                    }}
                  >{`${idx + 1}.`}</Text>
                  <Text style={{ flexGrow: 1, marginBottom: 3, fontSize: 10 }}>
                    {term}
                  </Text>
                </PDFView>
              ))}
            </PDFView>
          </PDFView>

          {/* Right Column: Authorised Signatory */}
          <PDFView style={[pdfStyles.bankBlockRight, {paddingLeft: 100}, {marginTop:-30}, {marginRight:5}]}>
            <PDFView
              style={{
                width: "100%",
                textAlign: "center",
                marginTop: 0,
                marginBottom: 0,
              }}
            >
              {invoiceData.upload_seal && invoiceData.upload_seal !== "" && (
                <PDFImage
                  src={convertImageUrlForPdf(invoiceData.upload_seal)}
                  style={pdfStyles.seal}
                  cache={false}
                />
              )}
              <Text style={pdfStyles.signatory}>AUTHORISED SIGNATORY FOR</Text>
              <Text
                style={{ color: "#545454", fontSize: 12, textAlign: "center" }}
              >
                {invoiceData.authorisedSignatory}
              </Text>
            </PDFView>
          </PDFView>
        </PDFView>
      </Page>
    </Document>
  );
};

const invoiceComponent = () => {
  const { user: authUser, rolePermissions } = useAuth();

  const canEditCompanyFields = rolePermissions === "ALL";
  const canEditInvoiceNumber = rolePermissions === "ALL";
  const { isCollapsed } = useContext(SidebarContext);

  const location = useLocation();
  const [isEditMode, setIsEditMode] = useState(false);
  const [organizationEmail, setOrganizationEmail] = useState(""); // New state for organization email
  const [receivedAmount, setReceivedAmount] = useState(0); // New state for received amount
  const [combinedAddressSecondLine, setCombinedAddressSecondLine] =
    useState(""); // New state for combined address line

  const [invoiceData, setInvoiceData] = useState({
    companyName: "",
    addressLine1: "",
    addressLine2: "",
    mobile: "",
    companyState: "", // Added for GST compliance
    companyPincode: "", // New field for company pincode
    companyCountry: "", // New field for company country
    invoiceNo: "",
    invoiceDate: formatDate(new Date().toISOString().slice(0, 10)),
    billToName: "",
    billToPhone: "",
    billToEmail: "",
    billToState: "",
    billToAddress: {
      blockUnitStreetName: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      gstin: "",
    },
    shipToName: "",
    shipToPhone: "",
    shipToEmail: "",
    shipToState: "",
    shipToAddress: {
      blockUnitStreetName: "",
      city: "",
      state: "",
      pincode: "",
      country: "",
      gstin: "",
    },
    bankName: "",
    accountName: "",
    ifscCode: "",
    accountNo: "",
    bankBranch: "",
    termsAndConditions: [],
    authorisedSignatory: "",
    upload_seal: "",
  });

  const [serviceItems, setServiceItems] = useState([
    {
      description: "",
      quantity: 0,
      rate: 0,
      taxRate: 0, // Default GST rate (total GST)
      amount: 0, // This will be calculated by GST logic
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

  // New state for manually edited Total GST Payable
  const [editedTotalGstPayable, setEditedTotalGstPayable] = useState(null);

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
    profile_pic: "", // Placeholder image path
    phoneno: "",
    email: "",
    address: "",
  });

  // To store the original state for discarding changes
  const [originalInvoiceData, setOriginalInvoiceData] = useState(invoiceData);
  const [originalServiceItems, setOriginalServiceItems] =
    useState(serviceItems);

  // New state for selected lead ID
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  // Address form state for Bill To
  // Initialize with the invoiceData's billToAddress to ensure existing data is shown
  const [formData, setFormData] = useState(invoiceData.billToAddress);
  const [gstinError, setGstinError] = useState("");
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [countrySearchTerm, setCountrySearchTerm] = useState("");
  const [stateSearchTerm, setStateSearchTerm] = useState("");
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [selectedCountryObj, setSelectedCountryObj] = useState(null);
  const [selectedStateObj, setSelectedStateObj] = useState(null);
  const [selectedCityObj, setSelectedCityObj] = useState(null);
  const countryDropdownRef = useRef(null);
  const stateDropdownRef = useRef(null);
  const cityDropdownRef = useRef(null);

  const [leadDropdownOpen, setLeadDropdownOpen] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState("");
  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const leadDropdownRef = useRef(null);

  // Ship To state (mirrors Bill To)
  // Initialize with the invoiceData's shipToAddress
  const [shipToFormData, setShipToFormData] = useState(
    invoiceData.shipToAddress
  );
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
  const [shipToSelectedCountryObj, setShipToSelectedCountryObj] =
    useState(null);
  const [shipToSelectedStateObj, setShipToSelectedStateObj] = useState(null);
  const [shipToSelectedCityObj, setShipToSelectedCityObj] = useState(null);
  const shipToCountryDropdownRef = useRef(null);
  const shipToStateDropdownRef = useRef(null);
  const shipToCityDropdownRef = useRef(null);

  // User options for calculations
  const [roundOffOption, setRoundOffOption] = useState("nearest"); // "nearest", "up", "down", "none"
  const [roundOffDecimal, setRoundOffDecimal] = useState(0); // 0, 1, 2, 3
  const [gstCalculationMethod, setGstCalculationMethod] = useState("inclusive"); // "inclusive", "exclusive"
  const [isGstEnabled, setIsGstEnabled] = useState(false); // Changed from showGstBreakdown and set to false
  const [applyRoundOffTo, setApplyRoundOffTo] = useState("all"); // "all", "subtotal", "gst", "grandtotal"

  // Add refs and state for Calculation Options dropdowns
  const [openCalcDropdown, setOpenCalcDropdown] = useState(null); // 'roundOff', 'decimal', 'applyTo', 'gstMethod', or null
  const roundOffRef = useRef(null);
  const decimalRef = useRef(null);
  const applyToRef = useRef(null);
  const gstMethodRef = useRef(null);

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
            let parsedAddress = {
              blockUnitStreetName: "",
              city: "",
              state: "",
              pincode: "",
              country: "",
            };

            // Attempt to parse the address if it's a JSON string
            if (orgData.address && typeof orgData.address === "string") {
              try {
                const addressObj = JSON.parse(orgData.address);
                parsedAddress = {
                  blockUnitStreetName: addressObj.blockUnitStreetName || "",
                  city: addressObj.city || "",
                  state: addressObj.state || "",
                  pincode: addressObj.pincode || "",
                  country: addressObj.country || "",
                };
              } catch (e) {
                console.error("Failed to parse address JSON:", e);
                // Fallback if JSON parsing fails, treat as plain text if needed
                // For now, it will just use empty strings from parsedAddress
              }
            }

            // Construct addressLine1 and addressLine2 based on the desired format
            // First line: blockUnitStreetName
            const addressLine1 = parsedAddress.blockUnitStreetName.replace(
              /\r$/,
              ""
            ); // Remove trailing carriage return

            // Second line: City, State
            let addressLine2Parts = [];
            if (parsedAddress.city) addressLine2Parts.push(parsedAddress.city);
            if (parsedAddress.state)
              addressLine2Parts.push(parsedAddress.state);
            const addressLine2 = addressLine2Parts.join(", ");

            // Third line for PDF: Pincode, Country (not used for addressLine1/2 but for direct PDF rendering)

            // Parse term_info (handle double-encoded JSON)
            let parsedTerms = [];
            if (orgData.term_info) {
              try {
                let termObj = orgData.term_info;
                // Step 1: Remove extra quotes if present
                if (
                  typeof termObj === "string" &&
                  termObj.startsWith('"') &&
                  termObj.endsWith('"')
                ) {
                  termObj = termObj.slice(1, -1);
                }
                // Step 2: Replace escaped quotes
                if (typeof termObj === "string") {
                  termObj = termObj.replace(/\\"/g, '"');
                }
                // Step 3: Parse first time
                if (typeof termObj === "string") {
                  termObj = JSON.parse(termObj);
                }
                // Step 4: If still a string, parse again
                if (typeof termObj === "string") {
                  termObj = JSON.parse(termObj);
                }
                // Step 5: Now termObj is an object
                parsedTerms = Object.values(termObj)
                  .map((t) => t.replace(/\\n/g, "\n"))
                  .filter((t) => t && t.trim() && t !== "N"); // Remove empty or 'N'
              } catch (e) {
                parsedTerms = [];
              }
            }

            setInvoiceData((prev) => ({
              ...prev,
              companyName: orgData.organizationname || prev.companyName,
              addressLine1: addressLine1 || prev.addressLine1,
              addressLine2: addressLine2 || prev.addressLine2, // This will now correctly combine city and state
              mobile: orgData.phone || prev.mobile,
              companyState: parsedAddress.state || prev.companyState, // Use parsed state for GST compliance
              companyPincode: parsedAddress.pincode || prev.companyPincode,
              companyCountry: parsedAddress.country || prev.companyCountry,
              authorisedSignatory:
                orgData.organizationname || prev.authorisedSignatory,
              upload_seal: orgData.upload_seal || "",
              // Autofill bank details
              bankName: orgData.bank_name || prev.bankName,
              accountName: orgData.account_name || prev.accountName,
              ifscCode: orgData.ifsc_code || prev.ifscCode,
              accountNo: orgData.account_no || prev.accountNo,
              bankBranch: orgData.bank_branch || prev.bankBranch,
              // Autofill terms and conditions
              termsAndConditions:
                parsedTerms.length > 0 ? parsedTerms : ["Terms and conditions"],
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

    const fetchInvoiceNumber = async () => {
      try {
        const response = await api.get("/getinvoiceno");
        console.log("Invoice number API response:", response);
        if (response.data.success) {
          setInvoiceData((prev) => ({
            ...prev,
            invoiceNo: response.data.invoice_no || prev.invoiceNo,
          }));
        } else {
          console.error("Failed to get invoice number:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching invoice number:", error);
        // Don't show error alert for invoice number as it's not critical
      }
    };

    fetchOrganizationData();
    if (!(location && location.state && location.state.mode === "edit" && location.state.invoice)) {
  fetchInvoiceNumber();
} else {
  console.log("Skipping invoice fetch (edit mode)");
}

    // Set default country to India for Bill To and Ship To
    const india = Country.getAllCountries().find(
      (country) => country.name === "India"
    );
    if (india) {
      setSelectedCountryObj(india);
      setCountrySearchTerm("India");
      setFormData((prev) => ({ ...prev, country: "India" }));
      setShipToSelectedCountryObj(india);
      setShipToCountrySearchTerm("India");
      setShipToFormData((prev) => ({ ...prev, country: "India" }));
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

  // Effect to update combinedAddressSecondLine when invoiceData changes
  useEffect(() => {
    const parts = [];
    if (invoiceData.addressLine2) parts.push(invoiceData.addressLine2);
    if (invoiceData.companyCountry) parts.push(invoiceData.companyCountry);
    if (invoiceData.companyPincode) parts.push(invoiceData.companyPincode);
    setCombinedAddressSecondLine(parts.join(", "));
  }, [
    invoiceData.addressLine2,
    invoiceData.companyCountry,
    invoiceData.companyPincode,
  ]);

  // Effect to recalculate GST when companyState or shipToState changes
  useEffect(() => {
    console.log("GST recalculation effect triggered:", {
      companyState: invoiceData.companyState,
      shipToState: invoiceData.shipToState,
    });

    const updatedServiceItems = serviceItems.map((item) => {
      const baseAmount = item.quantity * item.rate;
      const { taxAmount, cgstAmount, sgstAmount, igstAmount, amount } =
        calculateItemGST(
          baseAmount,
          item.taxRate,
          invoiceData.companyState,
          invoiceData.shipToState,
          isGstEnabled // Pass isGstEnabled to calculation
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
  }, [
    invoiceData.companyState,
    invoiceData.shipToState,
    gstCalculationMethod,
    roundOffOption,
    roundOffDecimal,
    applyRoundOffTo,
    isGstEnabled, // Add isGstEnabled as a dependency
  ]); // Include all calculation dependencies

  // Initial calculation effect - runs once when component mounts
  useEffect(() => {
    console.log("Initial calculation effect running");
    console.log("Initial state values:", {
      companyState: invoiceData.companyState,
      shipToState: invoiceData.shipToState,
      serviceItems: serviceItems,
    });

    const updatedServiceItems = serviceItems.map((item) => {
      const baseAmount = item.quantity * item.rate;
      const { taxAmount, cgstAmount, sgstAmount, igstAmount, amount } =
        calculateItemGST(
          baseAmount,
          item.taxRate,
          invoiceData.companyState,
          invoiceData.shipToState,
          isGstEnabled // Pass isGstEnabled to calculation
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

    // Clear any manual overrides on initial mount to ensure consistent starting state
    setEditedServiceItemAmounts({});
    setEditedSubTotal(null);
    setEditedCgstTotal(null);
    setEditedSgstTotal(null);
    setEditedIgstTotal(null);
    setEditedTotalGstPayable(null);
    setEditedGrandTotal(null);
    setEditedBalance(null);
    setEditedCgstLabel(null);
    setEditedSgstLabel(null);
    setEditedIgstLabel(null);
    setEditedCgstPercentage(null);
    setEditedSgstPercentage(null);
    setEditedIgstPercentage(null);
  }, []); // Only run once on mount

  useEffect(() => {
    if (
      location.state &&
      location.state.mode === "edit" &&
      location.state.invoice
    ) {
      // Prefill all relevant states for edit mode
      setIsEditMode(true);
      const inv = location.state.invoice;
      setInvoiceData({
        ...invoiceData,
        // Map fields from the passed invoice to CreateInvoice's state structure
        companyName: inv.company_name || inv.bill_to_name || "",
        addressLine1: inv.bill_to_address || "",
        addressLine2: inv.ship_to_address || "",
        mobile: inv.contact || "",
        invoiceNo: inv.invoice_no || (inv.id ? String(inv.id) : ""),
        invoiceDate: inv.invoice_date ? formatDate(inv.invoice_date) : "",
        billToName: inv.bill_to_name || "",
        billToPhone: inv.bill_to_phone || inv.contact || "",
        billToEmail: inv.bill_to_email || "",
        billToState: inv.bill_to_state || "",
        billToAddress:
          typeof inv.bill_to_address === "object" ? inv.bill_to_address : {},
        shipToName: inv.ship_to_name || "",
        shipToPhone: inv.ship_to_phone || "",
        shipToEmail: inv.ship_to_email || "",
        shipToState: inv.ship_to_state || "",
        shipToAddress:
          typeof inv.ship_to_address === "object" ? inv.ship_to_address : {},
        bankName: inv.bank_name || "",
        accountName: inv.account_name || "",
        ifscCode: inv.ifsc_code || "",
        accountNo: inv.account_no || "",
        bankBranch: inv.bank_branch || "",
        termsAndConditions: inv.termsAndConditions || ["Terms and conditions"],
        authorisedSignatory: inv.authorisedSignatory || "",
        upload_seal: inv.upload_seal || "",
      });
      setServiceItems(
        Array.isArray(inv.items)
          ? inv.items.map((item) => ({
              description: item.item_name || item.serviceName || "",
              quantity: parseFloat(item.qty || item.quantity || 0),
              rate: parseFloat(item.rate || item.totalItemPrice || 0),
              taxRate: parseFloat(item.gst || 0),
              amount: parseFloat(item.amount || item.totalItemPrice || 0),
              taxAmount: parseFloat(item.taxAmount || 0),
              cgstAmount: parseFloat(item.cgstAmount || 0),
              sgstAmount: parseFloat(item.sgstAmount || 0),
              igstAmount: parseFloat(item.igstAmount || 0),
            }))
          : [
              {
                description: "",
                quantity: 1,
                rate: 0,
                taxRate: 0,
                amount: 0,
                taxAmount: 0,
                cgstAmount: 0,
                sgstAmount: 0,
                igstAmount: 0,
              },
            ]
      );
      // Optionally set other states (receivedAmount, etc.)
    }
  }, []); // Only run on mount

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
        setSelectedStateObj(null);
      }

      if (name === "gstin") {
        validateGstin(updatedValue);
      }
    } else if (name === "invoiceDate") {
      // Convert the YYYY-MM-DD value from the input to DD MM YYYY for state
      const [year, month, day] = value.split("-");
      setInvoiceData((prev) => ({
        ...prev,
        [name]: `${day} ${month} ${year}`,
      }));
    } else {
      setInvoiceData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Country search and select
  const handleCountrySearchChange = (e) => {
    const value = e.target.value;
    setCountrySearchTerm(value);
    setCountryDropdownOpen(true);

    // Clear dependent selections if country changes
    if (value === "") {
      setSelectedStateObj(null);
      setSelectedCityObj(null);
      setStateSearchTerm("");
      setCitySearchTerm("");
    }
  };
  const handleCountrySelect = (country) => {
    setFormData((prev) => ({
      ...prev,
      country: country.name,
      state: "",
      city: "",
    }));
    setSelectedCountryObj(country);
    setCountrySearchTerm(country.name);
    setCountryDropdownOpen(false);

    // Clear dependent selections
    setSelectedStateObj(null);
    setSelectedCityObj(null);
    setStateSearchTerm("");
    setCitySearchTerm("");
  };

  // State search and select
  const handleStateSearchChange = (e) => {
    // Prevent state search if no country is selected
    if (!countrySearchTerm) {
      return;
    }

    const value = e.target.value;
    setStateSearchTerm(value);
    setStateDropdownOpen(true);

    // Clear dependent selections if state changes
    if (value === "") {
      setSelectedCityObj(null);
      setCitySearchTerm("");
    }
  };
  const handleStateSelect = (state) => {
    setFormData((prev) => ({ ...prev, state: state.name, city: "" }));
    setSelectedStateObj(state);
    setStateSearchTerm(state.name);
    setStateDropdownOpen(false);
    setFilteredCities(
      City.getCitiesOfState(selectedCountryObj.isoCode, state.isoCode)
    );
    setInvoiceData((prev) => ({ ...prev, billToState: state.name }));

    // Clear dependent selections
    setSelectedCityObj(null);
    setCitySearchTerm("");
  };

  // City search and select
  const handleCitySearchChange = (e) => {
    // Prevent city search if no state is selected
    if (!stateSearchTerm) {
      return;
    }

    const value = e.target.value;
    setCitySearchTerm(value);
    setCityDropdownOpen(true);
  };
  const handleCitySelect = (city) => {
    setFormData((prev) => ({ ...prev, city: city.name }));
    setSelectedCityObj(city);
    setCitySearchTerm(city.name);
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

  const calculateItemGST = (
    baseAmount,
    taxRate,
    companyState,
    shipToState,
    isGstEnabled
  ) => {
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;
    let finalAmount = 0;

    // If GST is disabled, return all zeros for GST related amounts
    if (!isGstEnabled) {
      return {
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        amount: baseAmount, // Amount is just baseAmount if no GST
      };
    }

    // Ensure inputs are numbers, default to 0 if NaN
    baseAmount = isNaN(baseAmount) ? 0 : baseAmount;
    taxRate = isNaN(taxRate) ? 0 : taxRate;

    const companyStateClean = companyState
      ? companyState.toLowerCase().trim()
      : "";
    const shipToStateClean = shipToState
      ? shipToState.toLowerCase().trim()
      : "";

    // Debug logging
    console.log("GST Calculation Debug:", {
      companyState,
      shipToState,
      companyStateClean,
      shipToStateClean,
      areEqual: companyStateClean === shipToStateClean,
      taxRate,
      gstCalculationMethod,
      baseAmount,
    });

    // Handle GST calculation method (inclusive vs exclusive)
    if (gstCalculationMethod === "exclusive") {
      // GST is added on top of base amount
      if (companyStateClean === shipToStateClean) {
        // Same state: CGST + SGST (9% + 9% = 18%)
        const halfTaxRate = taxRate / 2;
        cgstAmount = baseAmount * (halfTaxRate / 100);
        sgstAmount = baseAmount * (halfTaxRate / 100);
        console.log("Same state - CGST/SGST calculated:", {
          cgstAmount,
          sgstAmount,
          halfTaxRate,
        });
      } else {
        // Different state: IGST (18%)
        igstAmount = baseAmount * (taxRate / 100);
        console.log("Different state - IGST calculated:", { igstAmount });
      }
      finalAmount = baseAmount + cgstAmount + sgstAmount + igstAmount;
    } else {
      // GST is inclusive (base amount already includes GST)
      const taxAmountFromInclusive = baseAmount * (taxRate / (100 + taxRate));
      if (companyStateClean === shipToStateClean) {
        // Same state: CGST + SGST (9% + 9% = 18%)
        const halfTaxRate = taxRate / 2;
        cgstAmount = taxAmountFromInclusive * (halfTaxRate / taxRate);
        sgstAmount = taxAmountFromInclusive * (halfTaxRate / taxRate);
        console.log("Same state (inclusive) - CGST/SGST calculated:", {
          cgstAmount,
          sgstAmount,
          halfTaxRate,
        });
      } else {
        // Different state: IGST (18%)
        igstAmount = taxAmountFromInclusive;
        console.log("Different state (inclusive) - IGST calculated:", {
          igstAmount,
        });
      }
      finalAmount = baseAmount; // Amount stays the same, GST is extracted from it
    }

    const taxAmount = cgstAmount + sgstAmount + igstAmount;

    // Ensure all returned values are numbers, defaulting to 0 if NaN
    return {
      taxAmount: isNaN(taxAmount) ? 0 : taxAmount,
      cgstAmount: isNaN(cgstAmount) ? 0 : cgstAmount,
      sgstAmount: isNaN(sgstAmount) ? 0 : sgstAmount,
      igstAmount: isNaN(igstAmount) ? 0 : igstAmount,
      amount: isNaN(finalAmount) ? 0 : finalAmount,
    };
  };

  // Helper function to apply round off based on user options
  const applyRoundOff = (value) => {
    if (isNaN(value) || value === null) {
      return 0; // Return 0 if the value is NaN or null
    }
    if (roundOffOption === "none") {
      return value;
    }

    const multiplier = Math.pow(10, roundOffDecimal);
    let roundedValue;

    switch (roundOffOption) {
      case "nearest":
        roundedValue = Math.round(value * multiplier) / multiplier;
        break;
      case "up":
        roundedValue = Math.ceil(value * multiplier) / multiplier;
        break;
      case "down":
        roundedValue = Math.floor(value * multiplier) / multiplier;
        break;
      default:
        roundedValue = value;
    }

    return parseFloat(roundedValue.toFixed(roundOffDecimal));
  };

  const handleServiceItemChange = (index, field, value) => {
    const newServiceItems = [...serviceItems];
    // Ensure numerical fields are parsed as floats immediately upon change
    if (field === "quantity" || field === "rate" || field === "taxRate") {
      newServiceItems[index][field] = parseFloat(value) || 0;
    } else {
      newServiceItems[index][field] = value;
    }

    if (field === "quantity" || field === "rate" || field === "taxRate") {
      const qty = newServiceItems[index].quantity; // Already a number due to parsing above
      const rate = newServiceItems[index].rate; // Already a number
      const taxRate = newServiceItems[index].taxRate; // Already a number

      const baseAmount = qty * rate;
      const { taxAmount, cgstAmount, sgstAmount, igstAmount, amount } =
        calculateItemGST(
          baseAmount,
          taxRate,
          invoiceData.companyState,
          invoiceData.shipToState,
          isGstEnabled // Pass isGstEnabled to calculation
        );

      newServiceItems[index].taxAmount =
        applyRoundOffTo === "all" || applyRoundOffTo === "gst"
          ? applyRoundOff(taxAmount)
          : taxAmount;
      newServiceItems[index].amount =
        applyRoundOffTo === "all" ? applyRoundOff(amount) : amount; // Round final amount for item only if applyRoundOffTo is "all"
      newServiceItems[index].cgstAmount =
        applyRoundOffTo === "all" || applyRoundOffTo === "gst"
          ? applyRoundOff(cgstAmount)
          : cgstAmount;
      newServiceItems[index].sgstAmount =
        applyRoundOffTo === "all" || applyRoundOffTo === "gst"
          ? applyRoundOff(sgstAmount)
          : sgstAmount;
      newServiceItems[index].igstAmount =
        applyRoundOffTo === "all" || applyRoundOffTo === "gst"
          ? applyRoundOff(igstAmount)
          : igstAmount;
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
    const parsedValue = parseFloat(value);
    const roundedValue = isNaN(parsedValue) ? null : applyRoundOff(parsedValue); // Apply rounding here
    switch (field) {
      case "subTotal":
        setEditedSubTotal(roundedValue);
        break;
      case "cgstTotal":
        setEditedCgstTotal(roundedValue);
        break;
      case "sgstTotal":
        setEditedSgstTotal(roundedValue);
        break;
      case "igstTotal":
        setEditedIgstTotal(roundedValue);
        break;
      default:
        break;
    }
  };

  // Handler for Total GST Payable manual edit
  const handleEditedTotalGstPayableChange = (value) => {
    const parsedValue = parseFloat(value);
    const roundedValue = isNaN(parsedValue) ? null : applyRoundOff(parsedValue); // Apply rounding here
    setEditedTotalGstPayable(roundedValue);
  };

  const handleEditedOverallTotalChange = (field, value) => {
    const parsedValue = parseFloat(value);
    const roundedValue = isNaN(parsedValue) ? null : applyRoundOff(parsedValue); // Apply rounding here
    switch (field) {
      case "grandTotal":
        setEditedGrandTotal(roundedValue);
        break;
      case "balance":
        setEditedBalance(roundedValue);
        break;
      default:
        break;
    }
  };

  const calculateSubTotal = () => {
    const rawSubTotal =
      editedSubTotal !== null && editedSubTotal !== ""
        ? parseFloat(editedSubTotal)
        : serviceItems.reduce((sum, item) => {
            // If GST is disabled, item.amount will be equal to baseAmount (qty * rate)
            // So, no need to subtract taxAmount when GST is disabled, as taxAmount will be 0
            return sum + item.amount - (isGstEnabled ? item.taxAmount : 0); // Only subtract taxAmount if GST is enabled
          }, 0);

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "subtotal") {
      return applyRoundOff(rawSubTotal);
    }
    return rawSubTotal;
  };

  const calculateGrandTotal = () => {
    // Sum the effective subtotal and effective GST totals
    const effectiveSubTotal = calculateSubTotal();
    // Only include GST totals if GST is enabled
    const effectiveCgstTotal = isGstEnabled ? calculateCgstTotal() : 0;
    const effectiveSgstTotal = isGstEnabled ? calculateSgstTotal() : 0;
    const effectiveIgstTotal = isGstEnabled ? calculateIgstTotal() : 0;

    const rawGrandTotal =
      effectiveSubTotal +
      effectiveCgstTotal +
      effectiveSgstTotal +
      effectiveIgstTotal;

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "grandtotal") {
      return applyRoundOff(rawGrandTotal);
    }
    return rawGrandTotal;
  };

  const calculateCgstTotal = () => {
    // If GST is disabled, return 0 for CGST
    if (!isGstEnabled) return 0;
    const rawCgstTotal =
      editedCgstTotal !== null && editedCgstTotal !== ""
        ? parseFloat(editedCgstTotal)
        : serviceItems.reduce((sum, item) => sum + item.cgstAmount, 0);

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "gst") {
      return applyRoundOff(rawCgstTotal);
    }
    return rawCgstTotal;
  };

  const calculateSgstTotal = () => {
    // If GST is disabled, return 0 for SGST
    if (!isGstEnabled) return 0;

    const rawSgstTotal =
      editedSgstTotal !== null && editedSgstTotal !== ""
        ? parseFloat(editedSgstTotal)
        : serviceItems.reduce((sum, item) => sum + item.sgstAmount, 0);

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "gst") {
      return applyRoundOff(rawSgstTotal);
    }
    return rawSgstTotal;
  };

  const calculateIgstTotal = () => {
    // If GST is disabled, return 0 for IGST
    if (!isGstEnabled) return 0;

    const rawIgstTotal =
      editedIgstTotal !== null && editedIgstTotal !== ""
        ? parseFloat(editedIgstTotal)
        : serviceItems.reduce((sum, item) => sum + item.igstAmount, 0);

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "gst") {
      return applyRoundOff(rawIgstTotal);
    }
    return rawIgstTotal;
  };

  // New function to calculate Total GST Payable
  const calculateTotalGstPayable = () => {
    // If GST is disabled, return 0 for Total GST Payable
    if (!isGstEnabled) return 0;

    const rawTotalGst =
      editedTotalGstPayable !== null && editedTotalGstPayable !== ""
        ? parseFloat(editedTotalGstPayable)
        : calculateCgstTotal() + calculateSgstTotal() + calculateIgstTotal();

    // Apply round off based on user settings
    if (applyRoundOffTo === "all" || applyRoundOffTo === "gst") {
      return applyRoundOff(rawTotalGst);
    }
    return rawTotalGst;
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

  const submitInvoice = async () => {
    if (formData.gstin && gstinError) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please correct the invalid GSTIN before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }
    if (shipToFormData.gstin && shipToGstinError) {
      Swal.fire({
        icon: "error",
        title: "Invalid Input",
        text: "Please correct the invalid Ship To GSTIN before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Format invoice_date to ISO string
    let invoiceDateISO = "";
    try {
      invoiceDateISO = new Date(
        parseDateToISO(invoiceData.invoiceDate)
      ).toISOString();
    } catch (e) {
      console.error("Error formatting invoice date:", e);
      Swal.fire({
        icon: "error",
        title: "Date Error",
        text: "Could not format invoice date. Please check the date format.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    console.log("formData at submission:", formData);
    console.log("shipToFormData at submission:", shipToFormData);

    const billToAddressObject = {
      name: formData.blockUnitStreetName,
      city: formData.city,
      state: formData.state,
      country: formData.country,
      pin: formData.pincode,
    };

    const shipToAddressObject = {
      name: shipToFormData.blockUnitStreetName,
      city: shipToFormData.city,
      state: shipToFormData.state,
      country: shipToFormData.country,
      pin: shipToFormData.pincode,
    };

    // Determine GST percentage for the overall invoice (using first item's tax rate as a proxy or default to 0)
    const overallGstPercentage =
      serviceItems.length > 0 ? `${serviceItems[0].taxRate}%` : "0%";

    console.log("shipToAddressObject", shipToAddressObject);
    console.log("billToAddressObject", billToAddressObject);

    const formattedData = {
      invoice_no: invoiceData.invoiceNo,
      invoice_date: invoiceDateISO,
      lead_id: selectedLeadId,
      bill_to_name: invoiceData.billToName,
      bill_to_phone: invoiceData.billToPhone,
      bill_to_email: invoiceData.billToEmail, // Added billToEmail

      bill_to_address: JSON.stringify(billToAddressObject), // Stringify formatted billToAddress
      bill_to_gsttin: formData.gstin, // Added bill_to_gsttin
      ship_to_name: invoiceData.shipToName,
      ship_to_phone: invoiceData.shipToPhone,
      ship_to_email: invoiceData.shipToEmail, // Added shipToEmail

      ship_to_address: JSON.stringify(shipToAddressObject), // Stringify formatted shipToAddress
      ship_to_gsttin: shipToFormData.gstin, // Added ship_to_gsttin
      sub_total: calculateSubTotal().toFixed(roundOffDecimal),
      grand_total: displayedGrandTotal.toFixed(roundOffDecimal),
      received_amount: receivedAmount.toFixed(roundOffDecimal),
      balance: displayedBalance.toFixed(roundOffDecimal),
      bank_name: invoiceData.bankName,
      account_name: invoiceData.accountName,
      ifsc_code: invoiceData.ifscCode,
      account_no: invoiceData.accountNo,
      bank_branch: invoiceData.bankBranch,
      payment_mode: "manual", // Hardcoded as per example
      gst: overallGstPercentage, // This will be "0%" if GST is disabled initially
      gst_payable: isGstEnabled
        ? calculateTotalGstPayable().toFixed(roundOffDecimal)
        : "0.00", // Conditionally include GST payable
      terms: invoiceData.termsAndConditions.join("\n"), // Join terms with newline
      signatory_by: invoiceData.authorisedSignatory, // Added signatory_by
      // created_at and updated_at and id are typically generated by the backend
      items: serviceItems.map((item) => ({
        item_name: item.description,
        qty: item.quantity,
        rate: item.rate.toFixed(roundOffDecimal),
        gst: isGstEnabled ? item.taxRate : 0, // Set GST to 0 if disabled
        amount: item.amount.toFixed(roundOffDecimal), // Apply rounding here for submission
      })),
    };

    console.log("Submitting invoice payload:", formattedData);

    try {
      const response = await api.post("/addinvoice", formattedData);
      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Invoice Saved!",
          text:
            response.data.message ||
            "Your invoice has been successfully saved.",
          confirmButtonColor: "#3085d6",
        });
        // Optionally reset form or navigate away
      } else {
        const errorMessage =
          response.data.message || "Failed to save invoice. Please try again.";
        let detailedErrors = "";
        if (response.data.errors) {
          detailedErrors = Object.keys(response.data.errors)
            .map((key) => {
              const fieldErrors = response.data.errors[key];
              // Format field names to be more readable (e.g., "invoice_no" to "Invoice No")
              const readableFieldName = key
                .replace(/_/g, " ")
                .replace(/\.0\./, " item 1 ")
                .toLowerCase()
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");
              return `<li style="margin-bottom: 4px;"><strong>${readableFieldName}</strong>: <ul>${fieldErrors
                .map((err) => `<li>${err}</li>`)
                .join("")}</ul></li>`;
            })
            .join("");
        }

        Swal.fire({
          icon: "error",
          title: "Saving Failed!",
          html: `<p>${errorMessage}</p>${
            detailedErrors
              ? `<div style="text-align: left; background: #f7f7f7; padding: 10px; border-radius: 5px; margin-top: 10px; overflow-x: auto;"><ul style="list-style-type: none; padding: 0; margin: 0;">${detailedErrors}</ul></div>`
              : ""
          }`,
          confirmButtonColor: "#3085d6",
        });
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      const errorMessage =
        error.response && error.response.data && error.response.data.message
          ? error.response.data.message
          : "An error occurred while saving the invoice. Please check your network and try again.";
      let detailedErrors = "";
      if (error.response && error.response.data && error.response.data.errors) {
        detailedErrors = Object.keys(error.response.data.errors)
          .map((key) => {
            const fieldErrors = error.response.data.errors[key];
            const readableFieldName = key
              .replace(/_/g, " ")
              .replace(/\.0\./, " item 1 ")
              .toLowerCase()
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" ");
            return `<li style="margin-bottom: 4px;"><strong>${readableFieldName}</strong>: <ul>${fieldErrors
              .map((err) => `<li>${err}</li>`)
              .join("")}</ul></li>`;
          })
          .join("");
      }

      Swal.fire({
        icon: "error",
        title: "Error!",
        html: `<p>${errorMessage}</p>${
          detailedErrors
            ? `<div style="text-align: left; background: #f7f7f7; padding: 10px; border-radius: 5px; margin-top: 10px; overflow-x: auto;"><ul style="list-style-type: none; padding: 0; margin: 0;">${detailedErrors}</ul></div>`
            : ""
        }`,
        confirmButtonColor: "#3085d6",
      });
    }
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
    let parsedAddress = {
      blockUnitStreetName: "",
      city: "",
      state: "",
      country: "",
      pincode: "",
    };

    if (addressString && typeof addressString === "string") {
      try {
        const addressObj = JSON.parse(addressString);
        parsedAddress = {
          blockUnitStreetName: addressObj.name || "",
          city: addressObj.city || "",
          state: addressObj.state || "",
          country: addressObj.country || "",
          pincode: addressObj.pin || "",
        };
      } catch (e) {
        console.error("Failed to parse lead address JSON:", e);
        // Fallback if parsing fails, assume the string itself is the city
        parsedAddress.city = addressString;
      }
    }
    return parsedAddress;
  }

  // Autofill Bill To fields from lead
  const handleLeadSelect = (lead) => {
    const parsedAddress = parseLeadAddress(lead.city || "");
    setInvoiceData((prev) => ({
      ...prev,
      billToName: lead.customer_name || prev.billToName,
      billToPhone: lead.contact || prev.billToPhone,
      billToEmail: lead.email || prev.billToEmail,
      billToState: parsedAddress.state || prev.billToState,
      shipToName: lead.customer_name || prev.shipToName,
      shipToPhone: lead.contact || prev.shipToPhone,
      shipToEmail: lead.email || prev.shipToEmail,
      shipToState: parsedAddress.state || prev.shipToState,
    }));

    // Set Bill To form data
    setFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));

    // Set Bill To selected country and state objects
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

    // Set Bill To search terms for dropdowns
    setCountrySearchTerm(parsedAddress.country || "");
    setStateSearchTerm(parsedAddress.state || "");
    setCitySearchTerm(parsedAddress.city || "");

    // Set Ship To form data
    setShipToFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));

    // Set Ship To selected country and state objects
    setShipToSelectedCountryObj(countryFromParsed || null);
    if (countryFromParsed && parsedAddress.state) {
      const stateFromParsed = State.getStatesOfCountry(
        countryFromParsed.isoCode
      ).find((s) => s.name.toLowerCase() === parsedAddress.state.toLowerCase());
      setShipToSelectedStateObj(stateFromParsed || null);
    }

    // Set Ship To search terms for dropdowns
    setShipToCountrySearchTerm(parsedAddress.country || "");
    setShipToStateSearchTerm(parsedAddress.state || "");
    setShipToCitySearchTerm(parsedAddress.city || "");

    setLeadDropdownOpen(false);
    setLeadSearchTerm("");
    setShipToLeadDropdownOpen(false);
    setShipToLeadSearchTerm("");
    setSelectedLeadId(lead.customer_id); // Set selectedLeadId here
  };

  // Ship To lead select (independent)
  const handleShipToLeadSelect = (lead) => {
    const parsedAddress = parseLeadAddress(lead.city || "");
    setInvoiceData((prev) => ({
      ...prev,
      shipToName: lead.customer_name || prev.shipToName,
      shipToPhone: lead.contact || prev.shipToPhone,
      shipToEmail: lead.email || prev.shipToEmail,
      shipToState: parsedAddress.state || prev.shipToState,
    }));

    setShipToFormData((prev) => ({
      ...prev,
      ...parsedAddress,
    }));

    // Set Ship To selected country and state objects
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

    // Set Ship To search terms for dropdowns
    setShipToCountrySearchTerm(parsedAddress.country || "");
    setShipToStateSearchTerm(parsedAddress.state || "");
    setShipToCitySearchTerm(parsedAddress.city || "");

    setShipToLeadDropdownOpen(false);
    setShipToLeadSearchTerm("");
    setSelectedLeadId(lead.customer_id); // Set selectedLeadId here
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
    const value = e.target.value;
    setShipToCountrySearchTerm(value);
    setShipToCountryDropdownOpen(true);

    // Clear dependent selections if country changes
    if (value === "") {
      setShipToFormData((prev) => ({ ...prev, country: "" }));
      setShipToSelectedCountryObj(null);
      setShipToSelectedStateObj(null);
      setShipToSelectedCityObj(null);
      setShipToStateSearchTerm("");
      setShipToCitySearchTerm("");
    }
  };
  const handleShipToCountrySelect = (country) => {
    setShipToFormData((prev) => ({
      ...prev,
      country: country.name,
      state: "",
      city: "",
    }));
    setShipToSelectedCountryObj(country);
    setShipToCountrySearchTerm(country.name);
    setShipToCountryDropdownOpen(false);

    // Clear dependent selections
    setShipToSelectedStateObj(null);
    setShipToSelectedCityObj(null);
    setShipToStateSearchTerm("");
    setShipToCitySearchTerm("");
  };

  const handleShipToStateSearchChange = (e) => {
    // Prevent state search if no country is selected
    if (!shipToCountrySearchTerm) {
      return;
    }

    const value = e.target.value;
    setShipToStateSearchTerm(value);
    setShipToStateDropdownOpen(true);

    // Clear dependent selections if state changes
    if (value === "") {
      setShipToSelectedCityObj(null);
      setShipToCitySearchTerm("");
    }
  };
  const handleShipToStateSelect = (state) => {
    console.log("handleShipToStateSelect called with:", state.name);
    setShipToFormData((prev) => ({ ...prev, state: state.name, city: "" }));
    setShipToSelectedStateObj(state);
    setShipToStateSearchTerm(state.name);
    setShipToStateDropdownOpen(false);
    setInvoiceData((prev) => {
      console.log(
        "Updating shipToState from",
        prev.shipToState,
        "to",
        state.name
      );
      return { ...prev, shipToState: state.name };
    });

    // Clear dependent selections
    setShipToSelectedCityObj(null);
    setShipToCitySearchTerm("");
  };

  const handleShipToCitySearchChange = (e) => {
    // Prevent city search if no state is selected
    if (!shipToStateSearchTerm) {
      return;
    }

    const value = e.target.value;
    setShipToCitySearchTerm(value);
    setShipToCityDropdownOpen(true);
  };
  const handleShipToCitySelect = (city) => {
    setShipToFormData((prev) => ({ ...prev, city: city.name }));
    setShipToSelectedCityObj(city);
    setShipToCitySearchTerm(city.name);
    setShipToCityDropdownOpen(false);
  };

  const handleEditedItemAmountChange = (index, value) => {
    const newServiceItems = [...serviceItems];
    const parsedValue = parseFloat(value);
    const roundedValue = isNaN(parsedValue) ? null : applyRoundOff(parsedValue);

    // Update the item's amount directly
    newServiceItems[index].amount = roundedValue;

    if (
      !isNaN(parsedValue) &&
      parsedValue >= 0 &&
      newServiceItems[index].taxRate > 0
    ) {
      // Calculate base amount from the edited total amount and tax rate
      const taxRate = newServiceItems[index].taxRate;

      let baseAmount;
      if (gstCalculationMethod === "exclusive") {
        // For exclusive GST: baseAmount = totalAmount / (1 + taxRate/100)
        baseAmount = roundedValue / (1 + taxRate / 100); // Use roundedValue here
      } else {
        // For inclusive GST: baseAmount = totalAmount (since total already includes GST)
        baseAmount = roundedValue; // Use roundedValue here
      }

      // Recalculate GST components using the base amount
      const { taxAmount, cgstAmount, sgstAmount, igstAmount } =
        calculateItemGST(
          baseAmount,
          taxRate,
          invoiceData.companyState,
          invoiceData.shipToState,
          isGstEnabled // Pass isGstEnabled to calculation
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
        newEditedAmounts[index] = roundedValue; // Store rounded value
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

  // Handler for combined address second line input
  const handleCombinedAddressSecondLineChange = (e) => {
    const value = e.target.value;
    setCombinedAddressSecondLine(value);

    const parts = value.split(",").map((p) => p.trim());
    let newAddressLine2 = "";
    let newCompanyCountry = "";
    let newCompanyPincode = "";

    // Attempt to parse: expecting City, State, Country, Pincode
    // This parsing is heuristic and might need refinement based on actual data variations
    if (parts.length >= 2) {
      newAddressLine2 = parts[0] + ", " + parts[1]; // City, State
    }
    if (parts.length >= 3) {
      newCompanyCountry = parts[2]; // Country
    }
    if (parts.length >= 4) {
      newCompanyPincode = parts[3]; // Pincode
    }

    setInvoiceData((prev) => ({
      ...prev,
      addressLine2: newAddressLine2,
      companyCountry: newCompanyCountry,
      companyPincode: newCompanyPincode,
    }));
  };

  // Bill To filtered lists
  const filteredCountries = useMemo(
    () =>
      Country.getAllCountries().filter(
        (country) =>
          country.name &&
          country.name.toLowerCase().includes(countrySearchTerm.toLowerCase())
      ),
    [countrySearchTerm]
  );
  const filteredStates = useMemo(
    () =>
      selectedCountryObj
        ? State.getStatesOfCountry(selectedCountryObj.isoCode).filter(
            (state) =>
              state.name &&
              state.name.toLowerCase().includes(stateSearchTerm.toLowerCase())
          )
        : [],
    [selectedCountryObj, stateSearchTerm]
  );
  const filteredCities = useMemo(
    () =>
      selectedCountryObj && selectedStateObj
        ? City.getCitiesOfState(
            selectedCountryObj.isoCode,
            selectedStateObj.isoCode
          ).filter(
            (city) =>
              city.name &&
              city.name.toLowerCase().includes(citySearchTerm.toLowerCase())
          )
        : [],
    [selectedCountryObj, selectedStateObj, citySearchTerm]
  );
  // Ship To filtered lists
  const shipToFilteredCountries = useMemo(
    () =>
      Country.getAllCountries().filter(
        (country) =>
          country.name &&
          country.name
            .toLowerCase()
            .includes(shipToCountrySearchTerm.toLowerCase())
      ),
    [shipToCountrySearchTerm]
  );
  const shipToFilteredStates = useMemo(
    () =>
      shipToSelectedCountryObj
        ? State.getStatesOfCountry(shipToSelectedCountryObj.isoCode).filter(
            (state) =>
              state.name &&
              state.name
                .toLowerCase()
                .includes(shipToStateSearchTerm.toLowerCase())
          )
        : [],
    [shipToSelectedCountryObj, shipToStateSearchTerm]
  );
  const shipToFilteredCities = useMemo(
    () =>
      shipToSelectedCountryObj && shipToSelectedStateObj
        ? City.getCitiesOfState(
            shipToSelectedCountryObj.isoCode,
            shipToSelectedStateObj.isoCode
          ).filter(
            (city) =>
              city.name &&
              city.name
                .toLowerCase()
                .includes(shipToCitySearchTerm.toLowerCase())
          )
        : [],
    [shipToSelectedCountryObj, shipToSelectedStateObj, shipToCitySearchTerm]
  );

  const companyStateClean = invoiceData.companyState
    ? invoiceData.companyState.toLowerCase().trim()
    : "";
  const shipToStateClean = invoiceData.shipToState
    ? invoiceData.shipToState.toLowerCase().trim()
    : "";
  const isIntraState = companyStateClean === shipToStateClean;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openCalcDropdown === "roundOff" &&
        roundOffRef.current &&
        !roundOffRef.current.contains(event.target)
      ) {
        setOpenCalcDropdown(null);
      } else if (
        openCalcDropdown === "decimal" &&
        decimalRef.current &&
        !decimalRef.current.contains(event.target)
      ) {
        setOpenCalcDropdown(null);
      } else if (
        openCalcDropdown === "applyTo" &&
        applyToRef.current &&
        !applyToRef.current.contains(event.target)
      ) {
        setOpenCalcDropdown(null);
      } else if (
        openCalcDropdown === "gstMethod" &&
        gstMethodRef.current &&
        !gstMethodRef.current.contains(event.target)
      ) {
        setOpenCalcDropdown(null);
      }
    }
    if (openCalcDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openCalcDropdown]);

  // Effect to clear manually edited GST percentages when item count changes
  useEffect(() => {
    // Only clear if we are transitioning to or from multiple items context
    // Or if the GST breakdown is not shown (then percentages are irrelevant)
    if (serviceItems.length > 1 || !isGstEnabled) {
      // Changed showGstBreakdown to isGstEnabled
      setEditedCgstPercentage(null);
      setEditedSgstPercentage(null);
      setEditedIgstPercentage(null);
    }
  }, [serviceItems.length, isGstEnabled]); // Changed showGstBreakdown to isGstEnabled

  const handleRemoveTerm = (index) => {
    setInvoiceData((prev) => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index),
    }));
  };

  // Handler to copy Bill To fields to Ship To
  const copyBillToToShipTo = () => {
    setInvoiceData((prev) => ({
      ...prev,
      shipToName: prev.billToName,
      shipToPhone: prev.billToPhone,
      shipToEmail: prev.billToEmail,
      shipToState: prev.billToState,
      shipToAddress: { ...formData },
    }));
    setShipToFormData({ ...formData });
    setShipToSelectedCountryObj(selectedCountryObj);
    setShipToSelectedStateObj(selectedStateObj);
    setShipToSelectedCityObj(selectedCityObj);
    setShipToCountrySearchTerm(countrySearchTerm);
    setShipToStateSearchTerm(stateSearchTerm);
    setShipToCitySearchTerm(citySearchTerm);
  };

  // Handler to copy Ship To fields to Bill To
  const copyShipToToBillTo = () => {
    setInvoiceData((prev) => ({
      ...prev,
      billToName: prev.shipToName,
      billToPhone: prev.shipToPhone,
      billToEmail: prev.shipToEmail,
      billToState: prev.shipToState,
      billToAddress: { ...shipToFormData },
    }));
    setFormData({ ...shipToFormData });
    setSelectedCountryObj(shipToSelectedCountryObj);
    setSelectedStateObj(shipToSelectedStateObj);
    setSelectedCityObj(shipToSelectedCityObj);
    setCountrySearchTerm(shipToCountrySearchTerm);
    setStateSearchTerm(shipToStateSearchTerm);
    setCitySearchTerm(shipToCitySearchTerm);
  };

  console.log("here is collapsed", isCollapsed);

  // w-[90vw]   ${
  //       isCollapsed ? "lg:w-[70%] xl:w-[70%]" : "lg:w-[100%] xl:w-[70%]"
  //     } h-auto bg-white  p-4 sm:p-6 lg:px-[23px] lg:py-[20px] min-h-screen rounded-2xl flex flex-col relative

// Finds the max decimal places used in given numbers
// const getMaxDecimalPlaces = (values = []) => {
//   let maxDecimals = 0;
//   values.forEach(v => {
//     if (v === null || v === undefined) return;
//     // Only consider values that look like numbers
//     const num = Number(String(v).replace(/,/g, ""));
//     if (isNaN(num)) return;

//     // Use the original string so trailing zeros after decimal are preserved
//     const s = String(v);
//     const decimals = s.includes(".") ? s.split(".")[1].length : 0;
//     if (decimals > maxDecimals) maxDecimals = decimals;
//   });
//   return maxDecimals;
// };




// useEffect(() => {
//   const invoice = location?.state?.invoice;
//   if (!invoice) return;

//   console.log("running this round off effect (edit-mode):", invoice);

//   // Collect the raw invoice fields (snake_case as returned by API)
//   const numericFields = [
//     invoice?.sub_total,
//     invoice?.grand_total,
//     invoice?.gst_payable,
//     ...(invoice?.items?.map(item => item?.amount) || [])
//   ];

//   const maxDecimals = getMaxDecimalPlaces(numericFields);

//   // invoice may or may not have a round-off field.
//   // Try a few likely keys (snake_case or camelCase) and parse any leading number.
//   const rawRoundOff =
//     invoice?.round_off ?? invoice?.roundOff ?? invoice?.roundoff ?? invoice?.decimal_places ?? null;

//   let parsedDecimals = null;
//   if (typeof rawRoundOff === "number" && !isNaN(rawRoundOff)) {
//     parsedDecimals = Math.max(0, rawRoundOff);
//   } else if (typeof rawRoundOff === "string" && rawRoundOff.trim() !== "") {
//     // extract a leading number if present (handles "2", "2 Decimals", "0 Decimal Places")
//     const m = rawRoundOff.match(/^(\d+)/);
//     if (m) parsedDecimals = Math.max(0, parseInt(m[1], 10));
//     else {
//       const lower = rawRoundOff.toLowerCase();
//       if (lower.includes("0")) parsedDecimals = 0;
//       else if (lower.includes("1")) parsedDecimals = 1;
//       else if (lower.includes("2")) parsedDecimals = 2;
//       else if (lower.includes("3")) parsedDecimals = 3;
//     }
//   }


//   if (parsedDecimals !== null) {
//     setRoundOffDecimal(parsedDecimals);
//   } else {
//     // No explicit round-off in invoice — adapt to detected precision (limit to UI max 3)
//     setRoundOffDecimal(Math.min(3, Math.max(0, maxDecimals)));
//   }

// }, [location?.state?.invoice]);


  return (
    <div
      className={`w-[90vw] md:w-[85vw]  lg:w-[90%] xl:w-[70%]  h-auto bg-white p-4 sm:p-6 lg:p-[23px] min-h-screen rounded-2xl flex flex-col relative`}
    >
      <div className="text-right mb-2 mt-1">
        <h2 className="text-[rgb(39,152,255)] text-base sm:text-2xl lg:text-2xl xl:text-2xl font-bold font-quicksand">
          Invoice
        </h2>
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-1 sm:mb-5">
        <div className="flex items-center ">
          {user?.profile_pic && ( // Conditionally render image
            <img
              src={user?.profile_pic}
              alt="Logo"
              className=" h-9 w-15 sm:h-12  md:h-24 sm:w-56 xl:mr-7 lg:mr-8 mr-5  ml-1 mb-2"
            />
          )}{" "}
          {/* Placeholder for logo */}
          <div className="">
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="companyName"
                placeholder="Enter Company Name"
                value={invoiceData.companyName}
                onChange={handleInputChange}
                className="text-[rgb(39,152,255)] mb-1 text-sm sm:text-3xl lg:text-[37px] tracking-wide font-bold w-4/5 px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            ) : (
              <h1 className="text-[rgb(39,152,255)] mb-3 text-sm sm:text-3xl lg:text-[37px] tracking-wide font-bold whitespace-nowrap">
                {invoiceData.companyName}
              </h1>
            )}

            {isEditMode && canEditCompanyFields ? (
              <div className="my-1">
                <input
                  type="text"
                  name="addressLine1"
                  placeholder="Enter Address Line 1"
                  value={invoiceData.addressLine1}
                  onChange={handleInputChange}
                  className="text-[8px] sm:text-xs text-[rgb(31,41,55)] w-4/5 block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1 whitespace-nowrap"
                />
                {/* Combined input for City, State, Country, Pincode */}
                <input
                  type="text"
                  name="combinedAddressSecondLine"
                  value={combinedAddressSecondLine}
                  onChange={handleCombinedAddressSecondLineChange}
                  placeholder="City, State, Country, Pincode"
                  className="text-[8px] sm:text-xs text-[rgb(31,41,55)] w-4/5 block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1 whitespace-nowrap"
                />
                <div className="flex gap-2">
                  <input
                    type="email"
                    name="organizationEmail"
                    value={organizationEmail}
                    placeholder="Enter Organization Email"
                    onChange={(e) => setOrganizationEmail(e.target.value)}
                    className="text-[8px] sm:text-xs text-[rgb(31,41,55)] w-20 sm:w-44 block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] mb-1"
                  />
                  <input
                    type="text"
                    name="mobile"
                    value={invoiceData.mobile}
                    onChange={handleInputChange}
                    placeholder="Enter Mobile Number"
                    className="text-[8px] sm:text-xs text-[rgb(31,41,55)] w-20 sm:w-44 block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
                  />
                </div>
              </div>
            ) : (
              <div className="my-3">
                {/* Display each address line separately */}
                {invoiceData.addressLine1 && (
                  <p className="text-[8px] sm:text-sm text-[rgb(31,41,55)]">
                    {invoiceData.addressLine1}
                  </p>
                )}
                {/* Combine City, State, Country, Pincode into one line */}
                {(invoiceData.addressLine2 ||
                  invoiceData.companyPincode ||
                  invoiceData.companyCountry) && (
                  <p className="text-[8px] sm:text-sm text-[rgb(31,41,55)]">
                    {invoiceData.addressLine2}
                    {invoiceData.addressLine2 &&
                      (invoiceData.companyCountry ||
                        invoiceData.companyPincode) &&
                      ", "}
                    {invoiceData.companyCountry}
                    {invoiceData.companyCountry && invoiceData.companyPincode
                      ? ", "
                      : ""}
                    {invoiceData.companyPincode}
                  </p>
                )}
                {/* Email and Mobile will remain here as the last line */}
                <div className="flex gap-2 my-1">
                  {organizationEmail && (
                    <p className="text-[8px] sm:text-sm text-[rgb(31,41,55)] flex gap-1">
                      <p className="font-medium">Email:</p>
                      <p>{organizationEmail}</p>
                    </p>
                  )}
                  <p className="text-[8px] sm:text-sm text-[rgb(31,41,55)] flex gap-1">
                    <p className="font-medium">Mobile:</p>
                    {invoiceData.mobile}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <hr className="border-t-2 border-[rgb(39,152,255)] mb-3.5" />

      {/* Invoice Details */}
      <div className="flex justify-between mb-3.5 text-xs sm:text-sm text-[#4B5563]">
        <div>
          Invoice No.:{" "}
          {isEditMode && canEditInvoiceNumber ? (
            <input
              type="text"
              name="invoiceNo"
              value={invoiceData.invoiceNo}
              onChange={handleInputChange}
              placeholder="No."
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
              value={parseDateToISO(invoiceData.invoiceDate)}
              onChange={handleInputChange}
              placeholder="Select Date"
              className="w-32 px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
            />
          ) : (
            formatDate(invoiceData.invoiceDate)
          )}
        </div>
      </div>

      <hr className="border-t border-[#E5E7EB] mb-6" />

      {/* Bill To / Ship To */}
      <div className="flex justify-between mb-8">
        <div className="w-1/2 pr-4">
          <h3 className="font-bold text-sm sm:text-lg mb-2 text-[#4B5563]">
            BILL TO
            {isEditMode && (
              <button
                type="button"
                onClick={copyBillToToShipTo}
                className="ml-3 px-2 py-1 bg-Duskwood-50 text-[rgb(39,152,255)] rounded-2xl text-xs  hover:bg-Duskwood-100 transition"
                style={{ marginLeft: 12 }}
              >
                Copy to Ship To
              </button>
            )}
          </h3>
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
                          <span className=" text-xs sm:text-base font-semibold text-gray-800 truncate group-hover:text-Duskwood-700">
                            {lead.customer_name}
                          </span>
                          <span className="text-[10px] sm:text-xs text-gray-500 truncate">
                            {lead.email}
                          </span>
                          <span className="text-[10px]  sm:text-xs text-gray-400 truncate">
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
                      No leads found
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
                        value={stateSearchTerm}
                        onChange={handleStateSearchChange}
                        onFocus={() =>
                          countrySearchTerm && setStateDropdownOpen(true)
                        }
                        onBlur={() => setStateDropdownOpen(false)}
                        className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !countrySearchTerm
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : "bg-[#E7EFF8]/60"
                        }`}
                        placeholder="Select State"
                        disabled={!countrySearchTerm}
                        readOnly={!countrySearchTerm}
                        autoComplete="off"
                      />

                      {stateDropdownOpen && countrySearchTerm && (
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
                        value={citySearchTerm}
                        onChange={handleCitySearchChange}
                        onFocus={() =>
                          stateSearchTerm && setCityDropdownOpen(true)
                        }
                        onBlur={() => setCityDropdownOpen(false)}
                        className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !stateSearchTerm
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : "bg-[#E7EFF8]/60"
                        }`}
                        placeholder="Select City"
                        disabled={!stateSearchTerm}
                        readOnly={!stateSearchTerm}
                        autoComplete="off"
                      />

                      {cityDropdownOpen && stateSearchTerm && (
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
                        value={countrySearchTerm}
                        onChange={handleCountrySearchChange}
                        onFocus={() => setCountryDropdownOpen(true)}
                        onBlur={() => setCountryDropdownOpen(false)}
                        className="w-full h-[44px] px-4 bg-[#E7EFF8]/60 border border-white/20  outline-none text-[#545454] placeholder-[#545454] rounded-br-[12px] text-[16px]"
                        placeholder="Select Country"
                        autoComplete="off"
                      />

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
                  GSTIN
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
              <p className=" text-xs sm:text-base font-semibold text-[#1F2837]">
                {invoiceData.billToName}
              </p>
              {/* Address first line */}
              {invoiceData.billToAddress?.blockUnitStreetName && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  {invoiceData.billToAddress.blockUnitStreetName}
                </p>
              )}
              {/* State and City (comma separated) */}
              {(invoiceData.billToAddress?.state ||
                invoiceData.billToAddress?.city) && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
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
                <p className="text-[#545454] text-[10px] sm:text-xs">
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
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  Email: {invoiceData.billToEmail}
                </p>
              )}
              {invoiceData.billToPhone && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  Mobile: {invoiceData.billToPhone}
                </p>
              )}
              {/* GST number */}
              {invoiceData.billToAddress?.gstin && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  GSTIN: {invoiceData.billToAddress.gstin}
                </p>
              )}
            </>
          )}
        </div>
        <div className="w-1/2 pl-4">
          <h3 className="font-bold text-sm sm:text-lg mb-2 text-[#4B5563]">
            SHIP TO
            {isEditMode && (
              <button
                type="button"
                onClick={copyShipToToBillTo}
                className="ml-3 px-2 py-1 bg-Duskwood-50 text-[rgb(39,152,255)] rounded-2xl text-xs  hover:bg-Duskwood-100 transition"
                style={{ marginLeft: 12 }}
              >
                Copy to Bill To
              </button>
            )}
          </h3>
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
                <div className="absolute z-20 custom-scrollbar w-full bg-white rounded-xl shadow-2xl border border-gray-200 mt-1 max-h-72 overflow-y-auto animate-fade-in">
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
                      No leads found
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
                        value={shipToStateSearchTerm}
                        onChange={handleShipToStateSearchChange}
                        onFocus={() =>
                          shipToCountrySearchTerm &&
                          setShipToStateDropdownOpen(true)
                        }
                        onBlur={() => setShipToStateDropdownOpen(false)}
                        className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !shipToCountrySearchTerm
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : "bg-[#E7EFF8]/60"
                        }`}
                        placeholder="Select State"
                        disabled={!shipToCountrySearchTerm}
                        readOnly={!shipToCountrySearchTerm}
                        autoComplete="off"
                      />

                      {shipToStateDropdownOpen && shipToCountrySearchTerm && (
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
                        value={shipToCitySearchTerm}
                        onChange={handleShipToCitySearchChange}
                        onFocus={() =>
                          shipToStateSearchTerm &&
                          setShipToCityDropdownOpen(true)
                        }
                        onBlur={() => setShipToCityDropdownOpen(false)}
                        className={`w-full h-[44px] px-4 border border-white/20 outline-none text-[#545454] placeholder-[#545454] text-[16px] ${
                          !shipToStateSearchTerm
                            ? "bg-gray-300 cursor-not-allowed opacity-60"
                            : "bg-[#E7EFF8]/60"
                        }`}
                        placeholder="Select City"
                        disabled={!shipToStateSearchTerm}
                        readOnly={!shipToStateSearchTerm}
                        autoComplete="off"
                      />

                      {shipToCityDropdownOpen && shipToStateSearchTerm && (
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
                  GSTIN
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
              <p className="text-xs sm:text-base font-semibold text-[#1F2837]">
                {invoiceData.shipToName}
              </p>
              {/* Address first line */}
              {invoiceData.shipToAddress?.blockUnitStreetName && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  {invoiceData.shipToAddress.blockUnitStreetName}
                </p>
              )}
              {/* State and City (comma separated) */}
              {(invoiceData.shipToAddress?.state ||
                invoiceData.shipToAddress?.city) && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
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
                <p className="text-[#545454] text-[10px] sm:text-xs">
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
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  Email: {invoiceData.shipToEmail}
                </p>
              )}
              {invoiceData.shipToPhone && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  Mobile: {invoiceData.shipToPhone}
                </p>
              )}
              {/* GST number */}
              {invoiceData.shipToAddress?.gstin && (
                <p className="text-[#545454] text-[10px] sm:text-xs">
                  GSTIN: {invoiceData.shipToAddress.gstin}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="relative border border-[#E5E7EB] rounded-t-xl border-b-0 ">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead>
            <tr className="bg-[#E7EFF8]/30 text-left text-[#4B5563]">
              <th className="border-r border-b border-[#E5E7EB] p-2 text-left w-[50%] font-medium text-[8px] sm:text-sm">
                ITEMS
              </th>
              <th
                className={`border-r border-b border-[#E5E7EB] p-2 text-center font-medium text-[8px] sm:text-sm w-[12%]`}
              >
                QTY
              </th>
              <th
                className={`border-r border-b border-[#E5E7EB] p-2 text-center font-medium text-[8px] sm:text-sm w-[16.6%]`}
              >
                RATE
              </th>
              {/* GST Column - Only show if GST breakdown is enabled */}
              {isGstEnabled && (
                <th
                  className={`border-r border-b border-[#E5E7EB] p-2 text-center font-medium text-[8px] sm:text-sm w-[12%]`}
                >
                  GST
                </th>
              )}
              <th
                className={`border-b border-[#E5E7EB] p-2 text-right font-medium text-[8px] sm:text-sm ${
                  isGstEnabled ? "w-[13.4%]" : "w-[23.4%]"
                }`}
              >
                AMOUNT
              </th>
              {/* Removed the delete button's <th> */}
            </tr>
          </thead>
          <tbody>
            {serviceItems.map((item, index) => (
              <tr key={index} className={isEditMode ? "group" : ""}>
                <td className="border-r border-[#E5E7EB] p-2 text-[#545454] align-middle w-[50%] text-[10px] sm:text-base">
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
                      className="w-full min-h-[44px] px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-y text-[10px] sm:text-base"
                      style={{ resize: "vertical" }}
                    />
                  ) : (
                    item.description
                  )}
                </td>
                <td
                  className={`border-r  border-[#E5E7EB] p-2 text-center text-[#545454] align-middle w-[12%] text-[10px] sm:text-base`}
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
                      className="w-full sm:text-xs px-1 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-center text-[10px] "
                    />
                  ) : (
                    item.quantity
                  )}
                </td>
                <td
                  className={`border-r border-[#E5E7EB] p-2 text-center text-[#545454] align-middle w-[16.6%] text-[10px] sm:text-base`}
                >
                  {isEditMode ? (
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) =>
                        handleServiceItemChange(index, "rate", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-1 py-2 sm:text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right text-[10px] "
                    />
                  ) : (
                    (isNaN(parseFloat(item.rate))
                      ? 0
                      : parseFloat(item.rate)
                    ).toFixed(roundOffDecimal)
                  )}
                </td>
                {/* GST Column - Only show if GST breakdown is enabled */}
                {isGstEnabled && (
                  <td
                    className={`border-r  border-[#E5E7EB] p-2 text-center text-[#545454] align-middle w-[12%]`}
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
                        className="w-full px-1 py-2 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-center"
                      />
                    ) : isNaN(parseFloat(item.taxRate)) ? (
                      0
                    ) : (
                      parseFloat(item.taxRate)
                    )}
                  </td>
                )}
                <td
                  className={`border-[#E5E7EB] p-2 text-right text-[#545454] align-middle text-[10px] sm:text-base ${
                    isGstEnabled ? "w-[13.4%]" : "w-[23.4%]"
                  }`}
                  style={{ position: isEditMode ? "relative" : undefined }}
                >
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
                      className="w-full px-1 py-2 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                    />
                  ) : (
                    (isNaN(parseFloat(item.amount))
                      ? 0
                      : parseFloat(item.amount)
                    ).toFixed(roundOffDecimal)
                  )}
                  {isEditMode && (
                    <button
                      type="button"
                      onClick={() => removeServiceItem(index)}
                      className="-right-[15px]  sm:-right-[22px]"
                      style={{
                        position: "absolute",
                        top: "50%",

                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                        zIndex: 1000,
                      }}
                      title="Remove Item"
                    >
                      <RxCross2 size={15} color="#e53e3e" className=" sm:h-5" />
                    </button>
                  )}
                </td>
                {isEditMode && (
                  <button
                    onClick={() => removeServiceItem(index)}
                    className="absolute top-1/2 -translate-y-1/2 right-[-21px] flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-100"
                    title="Delete"
                  ></button>
                )}
              </tr>
            ))}
            {/* Add empty rows to visually extend the table if there are few items */}
            {Array.from({ length: Math.max(0, 4 - serviceItems.length) }).map(
              (_, idx) => (
                <tr key={`empty-${idx}`}>
                  <td className="border-r border-[#E5E7EB] p-2 text-[#545454] align-middle h-12 border-t-0 border-b-0 w-[50%]">
                    {" "}
                  </td>
                  <td className="border-r border-[#E5E7EB] p-2 text-center text-[#545454] align-middle h-12 border-t-0 border-b-0 w-[12%]">
                    {" "}
                  </td>
                  <td className="border-r border-[#E5E7EB] p-2 text-right text-[#545454] align-middle h-12 border-t-0 border-b-0 w-[16.6%]">
                    {" "}
                  </td>
                  {isGstEnabled && (
                    <td className="border-r border-[#E5E7EB] p-2 text-center text-[#545454] align-middle h-12 border-t-0 border-b-0 w-[12%]">
                      {" "}
                    </td>
                  )}
                  <td
                    className={`border-[#E5E7EB] p-2 text-right text-[#545454] align-middle h-12 border-t-0 border-b-0 ${
                      isGstEnabled ? "w-[13.4%]" : "w-[23.4%]"
                    }`}
                  >
                    {" "}
                  </td>
                  {/* Removed the delete button's <td> for empty rows */}
                </tr>
              )
            )}
            {isEditMode && (
              <tr>
                <td colSpan={isGstEnabled ? "5" : "4"} className="p-2">
                  <button
                    onClick={addServiceItem}
                    className="h-[44px] px-10 rounded-[12px] bg-[#003A72] border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-white w-full"
                  >
                    Add Item
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Cross buttons for each item, positioned outside the table */}
        {isEditMode && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: "-32px",
              height: "100%",
              zIndex: 99,
            }}
          >
            {serviceItems.map((item, index) => (
              <div
                key={index}
                style={{
                  position: "absolute",
                  top: `${index * 44}px`, // 44px is the row height, adjust as needed
                  right: 0,
                  zIndex: 10,
                }}
              ></div>
            ))}
          </div>
        )}
      </div>
      {/* Totals Section - matches PDF layout */}
      <div className="border border-[#E5E7EB] border-t-0 rounded-b-xl overflow-hidden mb-8">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="invisible h-0">
            <tr>
              <th className="w-[50%]"></th>
              <th className="w-[12%]"></th>
              <th className="w-[16.6%]"></th>
              {isGstEnabled && <th className="w-[12%]"></th>}
              <th className={isGstEnabled ? "w-[13.4%]" : "w-[23.4%]"}></th>
            </tr>
          </thead>
          <tbody>
            {/* Totals section with Terms and Conditions as a left cell spanning all total rows (view and edit mode) */}
            {(isEditMode || !isEditMode) &&
              (() => {
                // Determine how many total rows will be rendered
                let totalRowsCount = 1; // SUB TOTAL
                if (isGstEnabled) totalRowsCount += 4; // CGST, SGST, IGST, TOTAL GST PAYABLE
                totalRowsCount += 3; // GRAND TOTAL, Received Amount, Balance
                let rowIndex = 0;
                return (
                  <>
                    {/* First row: Terms and Conditions cell + SUB TOTAL */}
                    <tr>
                      {/* SUB TOTAL */}

                      <td
                        colSpan={isGstEnabled ? 4 : 3}
                        className=" border-t border-[#E5E7EB] py-2 px-3 text-[8px] sm:text-xs text-right font-bold text-[#1F2837] leading-tight h-6 align-middle"
                      >
                        SUB TOTAL
                      </td>
                      <td
                        className={`border-l border-t border-[#E5E7EB] py-2 px-2 text-xs sm:text-sm text-right font-bold text-[#1F2837] leading-tight h-6 align-middle ${
                          isGstEnabled ? "w-[13.4%]" : "w-[23.4%]"
                        }`}
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
                              handleEditedTotalChange(
                                "subTotal",
                                e.target.value
                              )
                            }
                            placeholder="0"
                            className="w-full px-1 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                          />
                        ) : (
                          calculateSubTotal().toFixed(roundOffDecimal)
                        )}
                      </td>
                    </tr>
                    {/* CGST, SGST, IGST, TOTAL GST PAYABLE (if GST breakdown) */}
                    {isGstEnabled && ( // Conditionally render this whole block
                      <>
                        <tr>
                          <td
                            colSpan={4}
                            className=" border-t border-[#E5E7EB] py-0.5 sm:px-3 text-right text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] leading-tight h-6 align-middle"
                          >
                            {isEditMode ? (
                              <input
                                type="text"
                                value={
                                  editedCgstLabel !== null
                                    ? editedCgstLabel
                                    : serviceItems.length > 1
                                    ? "AGGREGATED CGST AMOUNT"
                                    : "CGST AMOUNT"
                                }
                                onChange={(e) =>
                                  handleEditedGstLabelChange(
                                    "cgstLabel",
                                    e.target.value
                                  )
                                }
                                className=" text-left pl-1 sm:pl-0 sm:text-right  bg-transparent border-none outline-none font-medium text-[8px] sm:text-[0.625rem] text-[#1F2837] w-24"
                              />
                            ) : (
                              <span>CGST AMOUNT</span>
                            )}
                            {serviceItems.length > 0 &&
                              (isEditMode ? (
                                <span className="inline-flex items-baseline">
                                  <input
                                    type="number"
                                    value={
                                      editedCgstPercentage !== null
                                        ? editedCgstPercentage
                                        : serviceItems.length > 1
                                        ? ""
                                        : isIntraState && serviceItems[0]
                                        ? serviceItems[0].taxRate / 2
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleEditedGstPercentageChange(
                                        "cgstPercentage",
                                        e.target.value
                                      )
                                    }
                                    className="ml-1 text-right bg-transparent border-b outline-none text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] w-8"
                                    readOnly={
                                      serviceItems.length === 1 ? false : false
                                    } // Keep editable
                                  />
                                  <span className="text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837]">
                                    %
                                  </span>
                                </span>
                              ) : (
                                isIntraState &&
                                serviceItems.length === 1 && (
                                  <span className="ml-1">
                                    ({parseFloat(serviceItems[0].taxRate) / 2}%
                                    )
                                  </span>
                                )
                              ))}
                          </td>
                          <td className="border-l border-t text-xs border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6 align-middle">
                            {isEditMode ? (
                              <input
                                type="number"
                                value={
                                  editedCgstTotal !== null
                                    ? editedCgstTotal
                                    : calculateCgstTotal()
                                }
                                onChange={(e) =>
                                  handleEditedTotalChange(
                                    "cgstTotal",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full px-1  py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                              />
                            ) : (
                              calculateCgstTotal().toFixed(roundOffDecimal)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className=" border-t border-[#E5E7EB] py-0.5 sm:px-3 text-right text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] leading-tight h-6 align-middle"
                          >
                            {isEditMode ? (
                              <input
                                type="text"
                                value={
                                  editedSgstLabel !== null
                                    ? editedSgstLabel
                                    : serviceItems.length > 1
                                    ? "AGGREGATED SGST AMOUNT"
                                    : "SGST AMOUNT"
                                }
                                onChange={(e) =>
                                  handleEditedGstLabelChange(
                                    "sgstLabel",
                                    e.target.value
                                  )
                                }
                                className="text-left pl-1 sm:pl-0 sm:text-right bg-transparent border-none outline-none font-medium text-[8px] sm:text-[0.625rem] text-[#1F2837] w-24"
                              />
                            ) : (
                              <span>SGST AMOUNT</span>
                            )}
                            {serviceItems.length > 0 &&
                              (isEditMode ? (
                                <span className="inline-flex items-baseline">
                                  <input
                                    type="number"
                                    value={
                                      editedSgstPercentage !== null
                                        ? editedSgstPercentage
                                        : serviceItems.length > 1
                                        ? ""
                                        : isIntraState && serviceItems[0]
                                        ? serviceItems[0].taxRate / 2
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleEditedGstPercentageChange(
                                        "sgstPercentage",
                                        e.target.value
                                      )
                                    }
                                    className="ml-1 text-right bg-transparent border-b outline-none text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] w-8"
                                    readOnly={
                                      serviceItems.length === 1 ? false : false
                                    } // Keep editable
                                  />
                                  <span className="text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837]">
                                    %
                                  </span>
                                </span>
                              ) : (
                                isIntraState &&
                                serviceItems.length === 1 && (
                                  <span className="ml-1">
                                    ({parseFloat(serviceItems[0].taxRate) / 2}%
                                    )
                                  </span>
                                )
                              ))}
                          </td>
                          <td className="border-l border-t text-xs border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6 align-middle">
                            {isEditMode ? (
                              <input
                                type="number"
                                value={
                                  editedSgstTotal !== null
                                    ? editedSgstTotal
                                    : calculateSgstTotal()
                                }
                                onChange={(e) =>
                                  handleEditedTotalChange(
                                    "sgstTotal",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full px-1 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                              />
                            ) : (
                              calculateSgstTotal().toFixed(roundOffDecimal)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className=" border-t border-[#E5E7EB] py-0.5 sm:px-3 text-right text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] leading-tight h-6 align-middle"
                          >
                            {isEditMode ? (
                              <input
                                type="text"
                                value={
                                  editedIgstLabel !== null
                                    ? editedIgstLabel
                                    : serviceItems.length > 1
                                    ? "AGGREGATED IGST AMOUNT"
                                    : "IGST AMOUNT"
                                }
                                onChange={(e) =>
                                  handleEditedGstLabelChange(
                                    "igstLabel",
                                    e.target.value
                                  )
                                }
                                className="text-left pl-1 sm:pl-0 sm:text-right bg-transparent border-none outline-none font-medium text-[8px] sm:text-[0.625rem] text-[#1F2837] w-24"
                              />
                            ) : (
                              <span>IGST AMOUNT</span>
                            )}
                            {serviceItems.length > 0 &&
                              (isEditMode ? (
                                <span className="inline-flex items-baseline">
                                  <input
                                    type="number"
                                    value={
                                      editedIgstPercentage !== null
                                        ? editedIgstPercentage
                                        : serviceItems.length > 1
                                        ? ""
                                        : !isIntraState && serviceItems[0]
                                        ? serviceItems[0].taxRate
                                        : ""
                                    }
                                    onChange={(e) =>
                                      handleEditedGstPercentageChange(
                                        "igstPercentage",
                                        e.target.value
                                      )
                                    }
                                    className="ml-1 text-right bg-transparent border-b outline-none text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837] w-8"
                                    readOnly={
                                      serviceItems.length === 1 ? false : false
                                    } // Keep editable
                                  />
                                  <span className="text-[8px] sm:text-[0.625rem] font-medium text-[#1F2837]">
                                    %
                                  </span>
                                </span>
                              ) : (
                                !isIntraState &&
                                serviceItems.length === 1 && (
                                  <span className="ml-1">
                                    ({parseFloat(serviceItems[0].taxRate)}%)
                                  </span>
                                )
                              ))}
                          </td>
                          <td className="border-l border-t text-xs border-[#E5E7EB] py-0.5 px-2 text-right  text-[#1F2837] leading-tight h-6 align-middle">
                            {isEditMode ? (
                              <input
                                type="number"
                                value={
                                  editedIgstTotal !== null
                                    ? editedIgstTotal
                                    : calculateIgstTotal()
                                }
                                onChange={(e) =>
                                  handleEditedTotalChange(
                                    "igstTotal",
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full px-1 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                              />
                            ) : (
                              calculateIgstTotal().toFixed(roundOffDecimal)
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td
                            colSpan={4}
                            className=" border-t border-[#E5E7EB] py-0.5 px-3 text-right font-medium text-[8px] sm:text-[0.625rem] text-[#1F2837] leading-tight h-6 align-middle"
                          >
                            TOTAL GST PAYABLE
                          </td>
                          <td
                            className={`border-l border-t border-[#E5E7EB] text-xs py-0.5 px-2 text-right text-[#1F2837] leading-tight h-6 align-middle ${
                              !isEditMode ? "rounded-br-xl" : ""
                            }`}
                          >
                            {isEditMode ? (
                              <input
                                type="number"
                                value={
                                  editedTotalGstPayable !== null
                                    ? editedTotalGstPayable
                                    : calculateTotalGstPayable()
                                }
                                onChange={(e) =>
                                  handleEditedTotalGstPayableChange(
                                    e.target.value
                                  )
                                }
                                placeholder="0"
                                className="w-full px-1 py-1 text-xs rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] text-right"
                              />
                            ) : (
                              calculateTotalGstPayable().toFixed(
                                roundOffDecimal
                              )
                            )}
                          </td>
                        </tr>
                      </>
                    )}
                    {/* GRAND TOTAL */}

                    <td></td>
                  </>
                );
              })()}
          </tbody>
        </table>
      </div>

      {/* Bank Details and Totals */}
      <div className="flex justify-between mb-4 mt-4 mx-1 text-sm text-[#4B5563]">
        <div className="w-1/2 pr-4">
          <div className="flex mb-1">
            <span className="w-32 text-[8px] sm:text-sm font-semibold whitespace-nowrap">
              Bank Name:
            </span>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="bankName"
                value={invoiceData.bankName}
                onChange={handleInputChange}
                placeholder="Enter Bank Name"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] whitespace-nowrap text-[8px] sm:text-sm "
              />
            ) : (
              <span className="text-[#545454] w-1/2 whitespace-nowrap text-[8px] sm:text-sm">
                {invoiceData.bankName}
              </span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold whitespace-nowrap text-[8px] sm:text-sm">
              Account Name:
            </span>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="accountName"
                value={invoiceData.accountName}
                onChange={handleInputChange}
                placeholder="Enter Account Name"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] whitespace-nowrap text-[8px] sm:text-sm"
              />
            ) : (
              <span className="text-[#545454] whitespace-nowrap text-[8px] sm:text-sm">
                {invoiceData.accountName}
              </span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold whitespace-nowrap text-[8px] sm:text-sm">
              IFSC Code:
            </span>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="ifscCode"
                value={invoiceData.ifscCode}
                onChange={handleInputChange}
                placeholder="Enter IFSC Code"
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] whitespace-nowrap text-[8px] sm:text-sm"
              />
            ) : (
              <span className="text-[#545454] whitespace-nowrap text-[8px] sm:text-sm">
                {invoiceData.ifscCode}
              </span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold whitespace-nowrap text-[8px] sm:text-sm">
              Account No:
            </span>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="accountNo"
                value={invoiceData.accountNo}
                onChange={handleInputChange}
                placeholder="Enter Account No."
                className="flex-grow px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] whitespace-nowrap  text-[8px] sm:text-sm"
              />
            ) : (
              <span className="text-[#545454] whitespace-nowrap text-[8px] sm:text-sm">
                {invoiceData.accountNo}
              </span>
            )}
          </div>
          <div className="flex mb-1">
            <span className="w-32 font-semibold whitespace-nowrap text-[8px] sm:text-sm">
              Bank Branch:
            </span>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="bankBranch"
                value={invoiceData.bankBranch}
                onChange={handleInputChange}
                placeholder="Enter Bank Branch"
                className="flex-grow px-3 py-1  rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] whitespace-nowrap text-[8px] sm:text-sm"
              />
            ) : (
              <span className="text-[#545454] whitespace-nowrap text-[8px] sm:text-sm">
                {invoiceData.bankBranch}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          {/* GRAND TOTAL */}
          <div className="flex items-center space-x-2">
            <span className="w-32 text-[8px] sm:text-xs font-bold text-[#1F2837] text-right">
              GRAND TOTAL
            </span>
            {isEditMode ? (
              <input
                type="number"
                value={displayedGrandTotal}
                onChange={(e) =>
                  handleEditedOverallTotalChange("grandTotal", e.target.value)
                }
                placeholder="0"
                className="w-14  sm:w-20 lg:w-28 xl:w-32 px-2 py-1 font-bold text-xs bg-transparent border-b-2 border-[#0e4053] focus:outline-none text-[#545454] placeholder-[#545454] text-right"
              />
            ) : (
              <span className="w-14  sm:w-20 lg:w-28 xl:w-32 px-2 py-1 font-bold text-xs text-[#545454] text-right border-b-2 border-[#E5E7EB]">
                {displayedGrandTotal.toFixed(roundOffDecimal)}
              </span>
            )}
          </div>

          {/* Received Amount */}
          <div className="flex items-center space-x-2">
            <span className="w-32  text-[8px] sm:text-xs font-bold text-[#1F2837] text-right">
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
                className="w-32 px-2 py-1 text-xs bg-transparent border-b-2 border-[#0e4053] focus:outline-none text-[#545454] placeholder-[#545454] text-right"
              />
            ) : (
              <span className="w-14  sm:w-20 lg:w-28 xl:w-32 px-2 py-1 text-xs text-[#545454] text-right border-b-2 border-[#E5E7EB]">
                {receivedAmount.toFixed(roundOffDecimal)}
              </span>
            )}
          </div>

          {/* Balance */}
          <div className="flex items-center space-x-2">
            <span className="w-32   text-[8px] sm:text-xs font-bold text-[#1F2837] text-right">
              Balance
            </span>
            {isEditMode ? (
              <input
                type="number"
                value={displayedBalance}
                onChange={(e) =>
                  handleEditedOverallTotalChange("balance", e.target.value)
                }
                placeholder="0"
                className="w-32 px-2 py-1 text-xs bg-transparent border-b-2 border-[#0e4053] focus:outline-none text-[#545454] placeholder-[#545454] text-right"
              />
            ) : (
              <span className="w-14  sm:w-20 lg:w-28 xl:w-32 px-2 py-1 text-xs text-[#545454] text-right border-b-2 border-[#E5E7EB]">
                {displayedBalance.toFixed(roundOffDecimal)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between mb-4 mt-4 mx-1 text-sm text-[#4B5563] ">
        <div className="text-[8px] sm:text-xs text-[#4B5563] px-2 py-2 w-96">
          <span className="font-bold">TERMS AND CONDITIONS:</span>
          <ol className=" list-outside space-y-1 mt-2">
            {isEditMode && canEditCompanyFields ? (
              <>
                {invoiceData.termsAndConditions.map((term, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <span className=" text-[#545454] font-medium min-w-[20px]">
                      {index + 1}.
                    </span>
                    <textarea
                      value={term}
                      onChange={(e) => {
                        const newTerms = [...invoiceData.termsAndConditions];
                        newTerms[index] = e.target.value;
                        setInvoiceData((prev) => ({
                          ...prev,
                          termsAndConditions: newTerms,
                        }));
                        autoResizeTextarea(e);
                      }}
                      onInput={autoResizeTextarea}
                      placeholder="Enter Term"
                      className="flex-1 px-3 py-1  overflow-y-hidden rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454] resize-y terms-textarea"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTerm(index)}
                      style={{
                        marginLeft: 8,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                        display: "flex",
                        alignItems: "center",
                      }}
                      title="Remove"
                    >
                      <RxCross2 size={15} color="#e53e3e" />
                    </button>
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
                    className="text-Duskwood-500 hover:text-Duskwood-700 mt-2 ml-6"
                  >
                    Add Term
                  </button>
                </li>
              </>
            ) : (
              invoiceData.termsAndConditions?.map((term, index) => (
                <li key={index} className="mb-2 flex">
                  <span className=" mr-1 text-[#545454] font-medium">
                    {index + 1}.
                  </span>
                  <div
                    className="whitespace-pre-wrap text-[#545454]"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {term}
                  </div>
                </li>
              ))
            )}
          </ol>
        </div>
        <div className="w-1/2 pl-1 sm:pl-14  lg:pl-24 xl:pl-32 text-right">
          <div className="w-full text-center pl-4 sm:pl-0">
            {invoiceData.upload_seal && invoiceData.upload_seal !== "" && (
              <img
                src={invoiceData.upload_seal}
                alt="Authorised Seal"
                className="mx-auto mb-2 h-10 sm:h-20"
              />
            )}
            <p className=" text-[8px] sm:text-base font-bold text-[#1F2837] ">
              AUTHORISED SIGNATORY FOR
            </p>
            {isEditMode && canEditCompanyFields ? (
              <input
                type="text"
                name="authorisedSignatory"
                value={invoiceData.authorisedSignatory}
                onChange={handleInputChange}
                placeholder="Enter Authorised Signatory"
                className="text-[#545454] w-full text-center block px-3 py-1 rounded-[12px] bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none placeholder-[#545454] whitespace-nowrap text-[8px] sm:text-base"
              />
            ) : (
              <p className="text-[#545454] text-[8px] sm:text-base">
                {invoiceData.authorisedSignatory}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Breakdown (Edit Mode Only) */}
      {isEditMode &&
        isGstEnabled && ( // Only show calculation breakdown if GST is enabled
          <div className="mt-9 p-4 bg-[#F8FAFC] rounded-xl border border-[#E7EFF8] text-xs text-[#545454]">
            <h3 className="font-bold mb-3 text-base text-[#1F2837]">
              Calculation Breakdown
            </h3>
            <div className="space-y-4">
              {serviceItems.map((item, index) => {
                const preTaxAmount =
                  gstCalculationMethod === "inclusive"
                    ? item.amount - item.taxAmount
                    : item.quantity * item.rate;
                const baseAmount = item.quantity * item.rate;
                const halfTaxRate = parseFloat(item.taxRate) / 2;
                const companyStateClean = invoiceData.companyState
                  ? invoiceData.companyState.toLowerCase().trim()
                  : "";
                const shipToStateClean = invoiceData.shipToState
                  ? invoiceData.shipToState.toLowerCase().trim()
                  : "";
                const isIntraState = companyStateClean === shipToStateClean;

                return (
                  <div
                    key={index}
                    className=" pb-3 mb-3 last:border-b-0 last:pb-0 last:mb-0"
                  >
                    <p className="font-semibold mb-2 text-sm text-gray-800">
                      Item {index + 1}: {item.description || "New Item"}
                    </p>
                    <div className="flex justify-between items-center text-gray-600">
                      <span>
                        Calculation Type:{" "}
                        <span className="font-medium text-gray-700">
                          {gstCalculationMethod === "inclusive"
                            ? "GST Inclusive"
                            : "GST Exclusive"}
                        </span>
                      </span>
                    </div>

                    {gstCalculationMethod === "inclusive" ? (
                      <>
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Gross Amount (Qty x Rate)</span>
                          <span className="font-medium text-gray-700">
                            {item.quantity} x{" "}
                            {parseFloat(item.rate).toFixed(roundOffDecimal)} ={" "}
                            {parseFloat(baseAmount).toFixed(roundOffDecimal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 pl-4">
                          <span>
                            └ Pre-Tax Value (Gross / (1 + GST Rate/100))
                          </span>
                          <span className="font-medium text-gray-700">
                            {parseFloat(baseAmount).toFixed(roundOffDecimal)} /{" "}
                            {(1 + parseFloat(item.taxRate) / 100).toFixed(
                              roundOffDecimal
                            )}{" "}
                            ={" "}
                            {parseFloat(preTaxAmount).toFixed(roundOffDecimal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600 pl-4">
                          <span>└ Tax Amount (Gross - Pre-Tax)</span>
                          <span className="font-medium text-gray-700">
                            {parseFloat(baseAmount).toFixed(roundOffDecimal)} -{" "}
                            {parseFloat(preTaxAmount).toFixed(roundOffDecimal)}{" "}
                            ={" "}
                            {parseFloat(item.taxAmount).toFixed(
                              roundOffDecimal
                            )}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-gray-600">
                          <span>Base Amount (Qty x Rate)</span>
                          <span className="font-medium text-gray-700">
                            {item.quantity} x{" "}
                            {parseFloat(item.rate).toFixed(roundOffDecimal)} ={" "}
                            {parseFloat(baseAmount).toFixed(roundOffDecimal)}
                          </span>
                        </div>
                      </>
                    )}

                    {isGstEnabled && ( // Conditionally render GST logic breakdown
                      <>
                        <div className="flex justify-between items-center mt-1 text-gray-600">
                          <span>
                            GST Logic:{" "}
                            <span className="font-medium text-gray-700">
                              {isIntraState
                                ? `Intra-State (${
                                    invoiceData.companyState || "N/A"
                                  } -> ${invoiceData.shipToState || "N/A"})`
                                : `Inter-State (${
                                    invoiceData.companyState || "N/A"
                                  } -> ${invoiceData.shipToState || "N/A"})`}
                            </span>
                          </span>
                        </div>
                        {isIntraState ? (
                          <>
                            <div className="flex justify-between items-center pl-4">
                              <span>
                                CGST ({isNaN(halfTaxRate) ? 0 : halfTaxRate}% of
                                Pre-Tax)
                              </span>
                              <span className="font-medium text-gray-700">
                                ={" "}
                                {(isNaN(parseFloat(item.cgstAmount))
                                  ? 0
                                  : parseFloat(item.cgstAmount)
                                ).toFixed(roundOffDecimal)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center pl-4">
                              <span>
                                SGST ({isNaN(halfTaxRate) ? 0 : halfTaxRate}% of
                                Pre-Tax)
                              </span>
                              <span className="font-medium text-gray-700">
                                ={" "}
                                {(isNaN(parseFloat(item.sgstAmount))
                                  ? 0
                                  : parseFloat(item.sgstAmount)
                                ).toFixed(roundOffDecimal)}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between items-center pl-4">
                            <span>
                              IGST (
                              {isNaN(parseFloat(item.taxRate))
                                ? 0
                                : parseFloat(item.taxRate)}
                              % of Pre-Tax)
                            </span>
                            <span className="font-medium text-gray-700">
                              ={" "}
                              {(isNaN(parseFloat(item.igstAmount))
                                ? 0
                                : parseFloat(item.igstAmount)
                              ).toFixed(roundOffDecimal)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between items-center font-bold mt-2 pt-2 border-t border-gray-200 text-gray-800">
                      <span>
                        Total for item (
                        {gstCalculationMethod === "exclusive"
                          ? `Base + GST`
                          : `Gross Amount`}
                        )
                      </span>
                      <span className="text-[#1F2837]">
                        {gstCalculationMethod === "exclusive"
                          ? `${parseFloat(baseAmount).toFixed(
                              roundOffDecimal
                            )} + ${parseFloat(item.taxAmount).toFixed(
                              roundOffDecimal
                            )} = ${parseFloat(item.amount).toFixed(
                              roundOffDecimal
                            )}`
                          : `= ${parseFloat(item.amount).toFixed(
                              roundOffDecimal
                            )}`}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div className="  border-[#E7EFF8] space-y-2 mt-4">
                <p className="font-semibold mb-2 text-sm text-gray-800">
                  Overall Totals
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">Overall Subtotal:</span>
                    <span className="text-gray-500 text-xs pl-2">
                      (Sum of all items' pre-tax values)
                    </span>
                  </div>
                  <span className="font-medium text-[#1F2837]">
                    {calculateSubTotal().toFixed(roundOffDecimal)}
                  </span>
                </div>

                {isGstEnabled && ( // Only show overall GST totals if GST is enabled
                  <>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">Overall CGST:</span>
                        <span className="text-gray-500 text-xs pl-2">
                          (Sum of all items' CGST amounts)
                        </span>
                      </div>
                      <span className="font-medium text-[#1F2837]">
                        {calculateCgstTotal().toFixed(roundOffDecimal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">Overall SGST:</span>
                        <span className="text-gray-500 text-xs pl-2">
                          (Sum of all items' SGST amounts)
                        </span>
                      </div>
                      <span className="font-medium text-[#1F2837]">
                        {calculateSgstTotal().toFixed(roundOffDecimal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">Overall IGST:</span>
                        <span className="text-gray-500 text-xs pl-2">
                          (Sum of all items' IGST amounts)
                        </span>
                      </div>
                      <span className="font-medium text-[#1F2837]">
                        {calculateIgstTotal().toFixed(roundOffDecimal)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-semibold">
                          Overall GST PAYABLE:
                        </span>
                        <span className="text-gray-500 text-xs pl-2">
                          (CGST + SGST + IGST)
                        </span>
                      </div>
                      <span className="font-medium text-[#1F2837]">
                        {calculateTotalGstPayable().toFixed(roundOffDecimal)}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <div>
                    <span className="font-bold text-gray-800">
                      Grand Total:
                    </span>
                    <span className="text-gray-500 text-xs pl-2">
                      (Subtotal + Total GST)
                    </span>
                  </div>
                  <span className="font-bold text-[#1F2837]">
                    {displayedGrandTotal.toFixed(roundOffDecimal)}
                  </span>
                </div>
                {roundOffOption !== "none" && (
                  <div className="flex justify-between items-center text-Duskwood-600 text-xs">
                    <span>
                      Rounding Applied: "{roundOffOption}" to {roundOffDecimal}{" "}
                      decimals on "{applyRoundOffTo}"
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      {/* User Options Section (Edit Mode Only) */}
      {isEditMode && isGstEnabled && (
        <div className="mt-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#E7EFF8] text-sm text-[#545454]">
          <h3 className="font-bold mb-4 text-base text-[#1F2837]">
            Calculation Options
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Round Off Options */}
            <div className="relative" ref={roundOffRef}>
              <label className="block text-[#4B5563] text-sm font-medium mb-1">
                Round Off Method
              </label>
              <button
                type="button"
                className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
                onClick={() =>
                  setOpenCalcDropdown(
                    openCalcDropdown === "roundOff" ? null : "roundOff"
                  )
                }
              >
                {(() => {
                  switch (roundOffOption) {
                    case "nearest":
                      return "Nearest";
                    case "up":
                      return "Round Up";
                    case "down":
                      return "Round Down";
                    case "none":
                      return "No Rounding";
                    default:
                      return "";
                  }
                })()}
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {openCalcDropdown === "roundOff" && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer"
                    onClick={() => {
                      setRoundOffOption("nearest");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    Nearest
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffOption("up");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    Round Up
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffOption("down");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    Round Down
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffOption("none");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    No Rounding
                  </button>
                </div>
              )}
            </div>

            {/* Decimal Places */}
            <div className="relative" ref={decimalRef}>
              <label className="block text-[#4B5563] text-sm font-medium mb-1">
                Decimal Places
              </label>
              <button
                type="button"
                className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center"
                onClick={() =>
                  setOpenCalcDropdown(
                    openCalcDropdown === "decimal" ? null : "decimal"
                  )
                }
              >
                {(() => {
                  switch (roundOffDecimal) {
                    case 0:
                      return "0";
                    case 1:
                      return "1 Decimal";
                    case 2:
                      return "2 Decimals";
                    case 3:
                      return "3 Decimals";
                    default:
                      return "";
                  }
                })()}
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {openCalcDropdown === "decimal" && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffDecimal(0);
                      setOpenCalcDropdown(null);
                    }}
                  >
                    0
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffDecimal(1);
                      setOpenCalcDropdown(null);
                    }}
                  >
                    1 Decimal
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffDecimal(2);
                      setOpenCalcDropdown(null);
                    }}
                  >
                    2 Decimals
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setRoundOffDecimal(3);
                      setOpenCalcDropdown(null);
                    }}
                  >
                    3 Decimals
                  </button>
                </div>
              )}
            </div>

            {/* Apply Round Off To */}
            <div className="relative" ref={applyToRef}>
              <label className="block text-[#4B5563] text-sm font-medium mb-1">
                Apply Round Off To
              </label>
              <button
                type="button"
                className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center whitespace-nowrap"
                onClick={() =>
                  setOpenCalcDropdown(
                    openCalcDropdown === "applyTo" ? null : "applyTo"
                  )
                }
              >
                {(() => {
                  switch (applyRoundOffTo) {
                    case "all":
                      return "All Calculations";
                    case "subtotal":
                      return "Subtotal Only";
                    case "gst":
                      return "GST Only";
                    case "grandtotal":
                      return "Grand Total Only";
                    default:
                      return "";
                  }
                })()}
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {openCalcDropdown === "applyTo" && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setApplyRoundOffTo("all");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    All Calculations
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setApplyRoundOffTo("subtotal");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    Subtotal Only
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setApplyRoundOffTo("gst");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    GST Only
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setApplyRoundOffTo("grandtotal");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    Grand Total Only
                  </button>
                </div>
              )}
            </div>

            {/* GST Calculation Method */}
            <div className="relative" ref={gstMethodRef}>
              <label className="block text-[#4B5563] text-sm font-medium mb-1">
                GST Calculation
              </label>
              <button
                type="button"
                className="relative appearance-none h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-10 md:pr-15 lg:pr-15 w-full md:min-w-[120px] lg:min-w-[120px] bg-white border border-[#E9EAEA] rounded-[8px] cursor-pointer text-[#242729] text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center whitespace-nowrap"
                onClick={() =>
                  setOpenCalcDropdown(
                    openCalcDropdown === "gstMethod" ? null : "gstMethod"
                  )
                }
              >
                {(() => {
                  switch (gstCalculationMethod) {
                    case "inclusive":
                      return "GST Inclusive";
                    case "exclusive":
                      return "GST Exclusive";
                    default:
                      return "";
                  }
                })()}
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {openCalcDropdown === "gstMethod" && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar">
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setGstCalculationMethod("inclusive");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    GST Inclusive
                  </button>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-[#545454] cursor-pointer whitespace-nowrap"
                    onClick={() => {
                      setGstCalculationMethod("exclusive");
                      setOpenCalcDropdown(null);
                    }}
                  >
                    GST Exclusive
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GST Billing Section (Edit Mode Only) */}
      {isEditMode && (
        <div className="mt-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#E7EFF8] text-sm text-[#545454]">
          <h3 className="font-bold mb-4 text-base text-[#1F2837]">
            GST Billing
          </h3>
          <p className="mb-4 text-gray-700">
            Enable GST (Goods and Services Tax) billing for this invoice. This
            will allow you to apply GST rates to your service items and
            automatically calculate CGST, SGST, and IGST based on the supplier
            and customer's state.
          </p>
          <button
            type="button"
            className="w-full sm:w-auto px-6 py-2 bg-[#003A72] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#004B8D]"
            onClick={() => setIsGstEnabled(!isGstEnabled)} // Toggle GST state
          >
            {isGstEnabled ? "Disable GST" : "Enable GST"}
          </button>
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
                className="w-full sm:w-[150px] h-[40px] bg-[rgb(39,152,255)] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#004B8D]"
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
                className="w-full sm:w-[150px] h-[40px] bg-[rgb(39,152,255)] rounded-[10px] text-white text-[16px] font-semibold flex items-center justify-center hover:bg-[#004B8D]"
              >
                Save Invoice
              </button>
            </>
          )}
        </div>

        {!isEditMode && (
          <PDFDownloadLink
            document={
              <InvoicePDF
                invoiceData={{
                  ...invoiceData,
                  // Ensure all required fields have fallback values
                  companyName: invoiceData.companyName || "",
                  invoiceNo: invoiceData.invoiceNo || "",
                  invoiceDate: invoiceData.invoiceDate || "",
                  billToName: invoiceData.billToName || "",
                  shipToName: invoiceData.shipToName || "",
                  mobile: invoiceData.mobile || "",
                  bankName: invoiceData.bankName || "",
                  accountName: invoiceData.accountName || "",
                  ifscCode: invoiceData.ifscCode || "",
                  accountNo: invoiceData.accountNo || "",
                  bankBranch: invoiceData.bankBranch || "",
                  authorisedSignatory: invoiceData.authorisedSignatory || "",
                  termsAndConditions: invoiceData.termsAndConditions || [],
                  receivedAmount: receivedAmount || 0,
                  billToAddress: invoiceData.billToAddress || {},
                  shipToAddress: invoiceData.shipToAddress || {},
                }}
                serviceItems={serviceItems.map((item) => ({
                  ...item,
                  // Ensure all item fields have fallback values
                  description: item.description || "",
                  quantity: item.quantity || 0,
                  rate: item.rate || 0,
                  taxRate: item.taxRate || 0,
                  amount: item.amount, // Already rounded in calculateItemGST
                  taxAmount: item.taxAmount, // Already rounded in calculateItemGST
                  cgstAmount: item.cgstAmount, // Already rounded in calculateItemGST
                  sgstAmount: item.sgstAmount, // Already rounded in calculateItemGST
                  igstAmount: item.igstAmount, // Already rounded in calculateItemGST
                }))}
                organizationEmail={organizationEmail || ""}
                user={{
                  ...user,
                  profile_pic: user?.profile_pic || "",
                }}
                isGstEnabled={isGstEnabled} // Pass isGstEnabled to PDF
                subTotal={calculateSubTotal()}
                cgstTotal={calculateCgstTotal()}
                sgstTotal={calculateSgstTotal()}
                igstTotal={calculateIgstTotal()}
                totalGstPayable={calculateTotalGstPayable()}
                grandTotal={displayedGrandTotal}
                balance={displayedBalance}
                roundOffDecimal={roundOffDecimal} // Pass roundOffDecimal to PDF
              />
            }
            fileName={`invoice-${invoiceData.invoiceNo || "export"}.pdf`}
            style={{ textDecoration: "none" }}
            onClick={() => {
              // Add a small delay to ensure the PDF is ready
              setTimeout(() => {
                console.log("PDF download initiated");
              }, 100);
            }}
          >
            {({ loading, error }) => {
              if (error) {
                console.error("PDF generation error:", error);
                return (
                  <>
                    {/* Desktop */}
                    <div className="hidden lg:flex justify-end items-center hover:bg-gray-100 p-4 rounded-full">
                      <p className="mr-4 text-red-500 text-sm">PDF Error</p>
                    </div>
                    {/* Mobile/Tablet */}
                    <div className="flex lg:hidden justify-center items-center w-full mt-2">
                      <p className="mr-2 text-red-500 text-sm">PDF Error</p>
                    </div>
                  </>
                );
              }

              return loading ? (
                <>
                  {/* Desktop */}
                  <div className="hidden lg:flex justify-end items-center hover:bg-gray-100 p-4 rounded-full">
                    <p className="mr-4 text-[#8B8B8B] text-sm">
                      Generating PDF...
                    </p>
                  </div>
                  {/* Mobile/Tablet */}
                  <div className="flex lg:hidden justify-center items-center w-full mt-2">
                    <p className="mr-2 text-[#8B8B8B] text-sm">
                      Generating PDF...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Desktop */}
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
                  {/* Mobile/Tablet */}
                  <div className="flex lg:hidden justify-center items-center w-full mt-2">
                    <button
                      className="w-full text-[#8B8B8B] text-xs rounded-[10px] py-2 px-4 flex items-center justify-center  gap-2"
                      type="button"
                    >
                      Export to PDF
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
              );
            }}
          </PDFDownloadLink>
        )}
      </div>
    </div>
  );
};

export default invoiceComponent;
//before adding round off settings
