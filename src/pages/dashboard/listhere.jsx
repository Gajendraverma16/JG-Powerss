import React, { useEffect, useState } from "react";
import axios from "axios";
import Container1 from "./Container1";
import Container2 from "./Container2";
import Container3 from "./Container3";
import Container4 from "./Container4";
// import AvgLeads from "./AvgLeads";
// import Quotation from "./Quotation";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please login.");
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [leadsByStatusRes, followUpRes, newTodayRes, quotationRes] =
        await Promise.all([
          axios.get("https://inquiry.questdigiflex.in/public/api/totalleads", {
            headers,
          }),
          axios.get(
            "https://inquiry.questdigiflex.in/public/api/leadscountperweek/2",
            { headers }
          ),
          axios.get("https://inquiry.questdigiflex.in/public/api/todayleads", {
            headers,
          }),
          axios.get(
            "https://inquiry.questdigiflex.in/public/api/totalleadslw",
            { headers }
          ),
        ]);

      console.log("➡ leadsByStatus:", leadsByStatusRes.data);
      console.log("➡ Follow Ups:", followUpRes.data);
      console.log("➡ Today Leads:", newTodayRes.data);
      console.log(
        "➡ Quotation Last Week %:",
        quotationRes.data?.percentage_last_week
      );

      setDashboardData({
        leadsByStatus: leadsByStatusRes.data,
        followUp: followUpRes.data,
        newToday: newTodayRes.data,
        quotationData: quotationRes.data,
      });
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      setError("Failed to load dashboard data.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="px-5">
      {error && <div className="text-red-500">{error}</div>}

      {/* Top Lead Status Cards */}
      <div className="flex flex-wrap justify-between">
        <Container1
          leads={dashboardData?.leadsByStatus?.total_leads || 0}
          newToday={dashboardData?.newToday?.today_leads || 0}
          increasePercent={
            dashboardData?.quotationData?.percentage_last_week || "0%"
          }
        />

        <Container2 />

        <Container3
          followUpRes={dashboardData?.followUpRes?.total_leads || 0}
        />

        <Container4
        // You can include customer enquiry count here when added back
        />
      </div>

      {/* Bottom Section (Optional) */}
      {/*
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        <AvgLeads leads={dashboardData?.followUp?.average || 0} />
        <Quotation data={dashboardData?.quotationData} />
      </div>
      */}
    </div>
  );
};

export default Dashboard;
//dashboard backup
