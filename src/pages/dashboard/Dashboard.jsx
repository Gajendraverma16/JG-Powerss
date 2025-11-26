import React, { useEffect, useState, useRef } from "react";

import {
   BsBarChartFill,
   BsFillPersonLinesFill,
   BsMapFill,
   BsAwardFill,
   BsBagFill,
   BsLightningChargeFill,
   // New Icons for the UI improvements
   BsGraphUp,
   BsCurrencyRupee,
   BsPercent
} from "react-icons/bs";

import api from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import TopProductSale from "./TopProductSale";
import ContainerShopOwner from "./ContainerShopOwner";
import ContainerVillages from "./ContainerVillages";
import ContainerOrders from "./ContainerOrders";
import ContainerPoints from "./ContainerPoints";
import ContainerActions from "./ContainerActions";
import AreaChart from "./AreaChart";


const LEAD_STATUS_CARDS = [];

const Dashboard = () => {
  const [leads, setLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [leadStatuses, setLeadStatuses] = useState([]);
  const [isItemsPerPageDropdownOpen, setIsItemsPerPageDropdownOpen] =
    useState(false);
  const itemsPerPageDropdownRef = useRef(null);

  const [leadCounts, setLeadCounts] = useState({});
  const [users, setUsers] = useState([]);
  const [userTodayLeads, setUserTodayLeads] = useState({});
  const [userUpdatedLeads, setUserUpdatedLeads] = useState({});

  const { user, rolePermissions } = useAuth();
  const navigate = useNavigate();

 

  // Fetch Leads
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await api.get("/customeren/1");
        const data = response.data;
        if (data.success && Array.isArray(data.result)) {
          setLeads(data.result);
        }
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      }
    };
    fetchLeads();
  }, []);

  // Fetch Status counts
  useEffect(() => {
    const fetchLeadCounts = async () => {
      try {
        const results = await Promise.all(
          LEAD_STATUS_CARDS.map((status) => api.get(`/leadscount/${status.id}`))
        );
        const counts = {};
        results.forEach((res, idx) => {
          counts[LEAD_STATUS_CARDS[idx].id] = res.data?.total_leads || 0;
        });
        setLeadCounts(counts);
      } catch (err) {
        console.error("Error fetching lead counts:", err);
      }
    };
    fetchLeadCounts();
  }, []);

  // Fetch Lead Status Names
  useEffect(() => {
    const fetchLeadStatuses = async () => {
      try {
        const response = await api.get("/showleadstatus");
        const data = response.data;

        if (data.success && Array.isArray(data.data)) {
          setLeadStatuses(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      }
    };

    fetchLeadStatuses();
  }, []);

  const [dashboardData, setDashboardData] = useState({});
  const [error, setError] = useState(null);

  // Fetch Total Leads
  const fetchAllData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No token found. Please login.");
        return;
      }

      const [leadsByStatusRes] = await Promise.all([
        api.get("/totalleads", {}),
      ]);

      setDashboardData({
        leadsByStatus: leadsByStatusRes.data,
      });
    } catch (err) {
      console.error("❌ Error fetching dashboard data:", err);
      setError("Failed to load dashboard data.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

// Dummy Data (Fallback)
const [dummy, setDummy] = useState({
  villageCount: 0,
  totalOrders:0,
  totalPointes: 0,
  totalAmount: 0,
  newOrders: 0,
  returnOrders: 0,
  exchangeOrders: 0,
});

const [villageAPI, setVillageAPI] = useState(null);
const [ordersAPI, setOrdersAPI] = useState(null);
const [pointsAPI, setPointsAPI] = useState(null);
const [amountAPI, setAmountAPI] = useState(null);

// New state for order summary data
const [orderSummary, setOrderSummary] = useState(null);

useEffect(() => {
  fetchDashboard();
  fetchOrderSummary();
}, []);

const fetchDashboard = async () => {
  try {
    const res = await api.get("/orders/ordersummary");
    
    if (res.data && res.data.success) {
      const data = res.data.data;
      
      // Use daily data for big cards
      const dailyData = data.daily || {};
      
      // Set API data from daily summary
      setVillageAPI(dailyData.total_villages_assigned || null);
      setOrdersAPI({
        totalOrders: dailyData.total_new_orders || null,
        newOrders: dailyData.total_new_orders || null,
        returnOrders: 0, // Not in API response
        exchangeOrders: 0, // Not in API response
      });
      setPointsAPI(dailyData.total_points || null);
      setAmountAPI(dailyData.grand_total || null);
    } else {
      // API response not successful, use dummy data
      setVillageAPI(null);
      setOrdersAPI(null);
      setPointsAPI(null);
      setAmountAPI(null);
    }
  } catch (e) {
    console.error("Error fetching dashboard data:", e);
    // API failed, use dummy data
    setVillageAPI(null);
    setOrdersAPI(null);
    setPointsAPI(null);
    setAmountAPI(null);
  }
};

// Fetch order summary data
const fetchOrderSummary = async () => {
  try {
    const res = await api.get("/orders/ordersummary");
    
    if (res.data && res.data.success) {
      setOrderSummary(res.data.data);
    } else {
      setOrderSummary(null);
    }
  } catch (e) {
    console.error("Error fetching order summary:", e);
    setOrderSummary(null);
  }
};

  // Admin Dashboard Data with Dummy Values
  const [adminStats, setAdminStats] = useState({
    totalShopOwners: 80,
    totalBranches: 12,
    totalRoutes: 48,
    totalAreas: 156,
    totalVillages: 320,
    totalProducts: 40,
    totalOrders: 1250,
    newOrders: 85,
    returnOrders: 23,
    exchangeOrders: 15,
    totalUsers: 42,
    totalRevenue: 125000,
  });

  const [topUsers, setTopUsers] = useState([
    { id: 1, name: "Rajesh Kumar", orders: 145, revenue: 25200, avatar: "/dummyavatar.jpeg" },
    { id: 2, name: "Priya Sharma", orders: 128, revenue: 21800, avatar: "/dummyavatar.jpeg" },
    { id: 3, name: "Amit Patel", orders: 112, revenue: 19200, avatar: "/dummyavatar.jpeg" },
    { id: 4, name: "Sneha Gupta", orders: 98, revenue: 16800, avatar: "/dummyavatar.jpeg" },
    { id: 5, name: "Vikram Singh", orders: 85, revenue: 14500, avatar: "/dummyavatar.jpeg" },
  ]);

  useEffect(() => {
    const normalizedRole = user.role?.toLowerCase().replace(/\s+/g, '');
    if (user.role === "admin" || normalizedRole === "salesman") {
      fetchAdminDashboardData();
    }
  }, [user.role]);

  const fetchAdminDashboardData = async () => {
    try {
      // Fetch all admin stats - API Integration Ready
      const [shopOwnersRes, branchesRes, usersRes] = await Promise.all([
        api.get("/totalleads").catch(() => null),
        api.get("/branch-hierarchy").catch(() => null),
        // api.get("/products/count").catch(() => null),
        // api.get("/orders/stats").catch(() => null),
        api.get("/userlist").catch(() => null),
        // api.get("/revenue/total").catch(() => null),
        // api.get("/users/top").catch(() => null),
      ]);

      // Calculate counts from branch hierarchy
      const branches = branchesRes?.data?.data || [];
      let routeCount = 0;
      let areaCount = 0;
      let villageCount = 0;

      branches.forEach(branch => {
        routeCount += branch.routes?.length || 0;
        branch.routes?.forEach(route => {
          areaCount += route.areas?.length || 0;
          route.areas?.forEach(area => {
            villageCount += area.villages?.length || 0;
          });
        });
      });

      // Update stats with API data or keep dummy values
      setAdminStats(prev => ({
        totalShopOwners: shopOwnersRes?.data?.total_leads || prev.totalShopOwners,
        totalBranches: branches.length || prev.totalBranches,
        totalRoutes: routeCount || prev.totalRoutes,
        totalAreas: areaCount || prev.totalAreas,
        totalVillages: villageCount || prev.totalVillages,
        totalProducts: prev.totalProducts, // Replace with: productsRes?.data?.count
        totalOrders: prev.totalOrders, // Replace with: ordersRes?.data?.total
        newOrders: prev.newOrders, // Replace with: ordersRes?.data?.new
        returnOrders: prev.returnOrders, // Replace with: ordersRes?.data?.return
        exchangeOrders: prev.exchangeOrders, // Replace with: ordersRes?.data?.exchange
        totalUsers: usersRes?.data?.result?.length || prev.totalUsers,
        totalRevenue: prev.totalRevenue, // Replace with: revenueRes?.data?.total
      }));

    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      // Keep dummy data on error
    }
  };

  // --- NEW HELPERS FOR UI IMPROVEMENTS ---

  // Simple Revenue Chart Component
  const RevenueTrendChart = ({ data }) => {
    if (!data) return null;
    const daily = parseFloat(data.daily?.grand_total || 0);
    const weekly = parseFloat(data.weekly?.grand_total || 0);
    const monthly = parseFloat(data.monthly?.grand_total || 0);
    const max = Math.max(daily, weekly, monthly, 100) * 1.2;
    const getHeight = (val) => `${(val / max) * 100}%`;

    return (
      <div className="w-full h-48 flex items-end justify-around gap-4 pt-8">
        {/* Daily Bar */}
        <div className="flex flex-col items-center w-1/4 h-full justify-end group">
          <div className="relative w-full bg-blue-100 rounded-t-lg transition-all duration-500 hover:bg-blue-200" style={{ height: getHeight(daily) }}>
             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#003A72] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ₹ {daily.toFixed(0)}
             </div>
          </div>
          <span className="text-xs text-gray-500 mt-2 font-medium">Today</span>
        </div>
        {/* Weekly Bar */}
        <div className="flex flex-col items-center w-1/4 h-full justify-end group">
          <div className="relative w-full bg-green-100 rounded-t-lg transition-all duration-500 hover:bg-green-200" style={{ height: getHeight(weekly) }}>
             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#27AE60] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ₹ {weekly.toFixed(0)}
             </div>
          </div>
          <span className="text-xs text-gray-500 mt-2 font-medium">This Week</span>
        </div>
        {/* Monthly Bar */}
        <div className="flex flex-col items-center w-1/4 h-full justify-end group">
          <div className="relative w-full bg-yellow-100 rounded-t-lg transition-all duration-500 hover:bg-yellow-200" style={{ height: getHeight(monthly) }}>
             <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#F1C40F] text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                ₹ {monthly.toFixed(0)}
             </div>
          </div>
          <span className="text-xs text-gray-500 mt-2 font-medium">This Month</span>
        </div>
      </div>
    );
  };

  // Calculate KPIs
  const getKPIs = (data) => {
    if (!data) return { aov: 0, pointsRate: 0 };
    const totalAmount = parseFloat(data.total?.grand_total || 0);
    const totalOrders = parseInt(data.total?.total_new_orders || 0);
    const totalPoints = parseInt(data.total?.total_points || 0);
    const aov = totalOrders > 0 ? (totalAmount / totalOrders).toFixed(0) : 0;
    const pointsRate = totalOrders > 0 ? (totalPoints / totalOrders).toFixed(1) : 0;
    return { aov, pointsRate };
  };

  const kpis = getKPIs(orderSummary);

  return (
  
  <div className="box-border max-w-7xl w-full md:w-[95vw] lg:max-w-[1180px] mx-auto px-2 sm:px-4 lg:px-0 overflow-x-hidden">
  
  {/* ADMIN & SALESMAN DASHBOARD - SAME LAYOUT */}
  {user.role === "admin" || user.role?.toLowerCase().replace(/\s+/g, '') === "salesman" ? (
    <>
      {/* Welcome Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semi-bold text-[#1F2837] mt-1 ml-2 ">
          Welcome back, {user?.username || user?.name || (user?.role === 'admin' ? 'Admin' : 'User')}!
        </h1>
        <p className="text-[#727A90] mt-1 ml-2">Here's your performance overview</p>
      </div>

      {/* Today Summary Section */}
      <h3 className="text-lg font-semibold text-[#1F2837] mb-4">Today's Summary</h3>
      
      {/* Stats Cards Row 1 */}
      <div className="flex flex-wrap justify-start gap-4 md:gap-6 mb-6">
        {/* Total Shop Owners */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px] group cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(0,58,114,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {dashboardData?.leadsByStatus?.total_leads || 0}
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Customers
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsFillPersonLinesFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px] group cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(0,58,114,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {ordersAPI?.totalOrders ?? dummy.totalOrders}
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Orders
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsBagFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Amount */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px] group cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(0,58,114,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  ₹ {amountAPI ?? dummy.totalAmount}
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Amount
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-[#003A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Stats Cards Row 2 */}
      <div className="flex flex-wrap justify-start gap-4 md:gap-6 mb-6">
        {/* Total Points */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px] group cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(0,58,114,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {pointsAPI ?? dummy.totalPointes}
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Points
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsAwardFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Villages Assigned */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px] group cursor-pointer"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(0,58,114,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {villageAPI ?? 0}
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Villages Assigned
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-[#003A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[30%] min-w-[280px]"
          style={{
            backgroundImage: `linear-gradient(to top right, transparent 70%, #003A72)`,
          }}
        >
          <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#003A72] rounded-full blur-[30px]" />
          <div
            className="relative z-10 rounded-[14px] min-h-[150px] h-full
                       px-5 pt-5 pb-3 flex flex-col justify-between
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            style={{ background: "linear-gradient(45deg, white, #e6f4fb)" }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="text-black font-semibold text-[15px]">
                Quick Actions
              </div>
              <div className="bg-[#003A7233] rounded-full w-[50px] h-[50px] flex justify-center items-center">
                <BsLightningChargeFill className="text-[#003A72] text-[24px]" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => navigate('/leads/all')} className="flex-1 bg-[#0e4053] hover:bg-[#0d3847] text-white text-xs py-2 px-3 rounded-lg transition-colors duration-200 font-medium">
                View Customer
              </button>
              <button onClick={() => navigate('/Order/new')} className="flex-1 bg-[#003A72] hover:bg-[#003A72] text-white text-xs py-2 px-3 rounded-lg transition-colors duration-200 font-medium">
                Create Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary Section - NEW */}
      {orderSummary && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-[#1F2837] mb-4">Order Summary</h3>
          
          {/* Daily, Weekly, Monthly, Total Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Daily Summary */}
            <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-xl shadow-md p-5 border border-[#E9EAEA]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#727A90]">Daily</h4>
                <div className="w-10 h-10 bg-[#003A7233] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#003A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">New Orders</span>
                  <span className="text-lg font-bold text-[#003A72]">{orderSummary.daily?.total_new_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Customers</span>
                  <span className="text-sm font-semibold text-[#1F2837]">{orderSummary.daily?.total_customers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Amount</span>
                  <span className="text-sm font-semibold text-green-600">₹ {orderSummary.daily?.grand_total || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Points</span>
                  <span className="text-sm font-semibold text-[#003A72]">{orderSummary.daily?.total_points || 0}</span>
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-xl shadow-md p-5 border border-[#E9EAEA]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#727A90]">Weekly</h4>
                <div className="w-10 h-10 bg-[#27AE6033] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#27AE60]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">New Orders</span>
                  <span className="text-lg font-bold text-[#27AE60]">{orderSummary.weekly?.total_new_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Customers</span>
                  <span className="text-sm font-semibold text-[#1F2837]">{orderSummary.weekly?.total_customers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Amount</span>
                  <span className="text-sm font-semibold text-green-600">₹ {orderSummary.weekly?.grand_total || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Points</span>
                  <span className="text-sm font-semibold text-[#27AE60]">{orderSummary.weekly?.total_points || 0}</span>
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-xl shadow-md p-5 border border-[#E9EAEA]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[#727A90]">Monthly</h4>
                <div className="w-10 h-10 bg-[#F1C40F33] rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#F1C40F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">New Orders</span>
                  <span className="text-lg font-bold text-[#F1C40F]">{orderSummary.monthly?.total_new_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Customers</span>
                  <span className="text-sm font-semibold text-[#1F2837]">{orderSummary.monthly?.total_customers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Amount</span>
                  <span className="text-sm font-semibold text-green-600">₹ {orderSummary.monthly?.grand_total || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[#727A90]">Points</span>
                  <span className="text-sm font-semibold text-[#F1C40F]">{orderSummary.monthly?.total_points || 0}</span>
                </div>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-gradient-to-br from-[#003A72] to-[#0e4053] rounded-xl shadow-md p-5 border border-[#003A72] text-white">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold">Total</h4>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/80">New Orders</span>
                  <span className="text-lg font-bold">{orderSummary.total?.total_new_orders || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/80">Customers</span>
                  <span className="text-sm font-semibold">{orderSummary.total?.total_customers || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/80">Amount</span>
                  <span className="text-sm font-semibold text-green-300">₹ {orderSummary.total?.grand_total || '0.00'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/80">Points</span>
                  <span className="text-sm font-semibold">{orderSummary.total?.total_points || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- NEW SECTION: REVENUE GRAPH AND KPIS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* REVENUE TRENDS CHART */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
                <h3 className="text-lg font-bold text-[#1F2837]">Revenue Analytics</h3>
                <p className="text-xs text-gray-500">Daily vs Weekly vs Monthly Performance</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-lg text-[#003A72]">
                <BsGraphUp size={20} />
            </div>
          </div>
          {/* Using the Custom SVG Chart Component */}
          <RevenueTrendChart data={orderSummary} />
        </div>

        {/* EFFICIENCY METRICS (KPIS) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Metric 1: Avg Order Value */}
          <div className="bg-[#003A72] text-white rounded-xl p-5 relative overflow-hidden shadow-md">
            <div className="relative z-10">
                <p className="text-blue-200 text-xs font-medium uppercase tracking-wider">Avg. Order Value</p>
                <h4 className="text-3xl font-bold mt-1">₹ {kpis.aov}</h4>
                <div className="mt-3 flex items-center gap-2 text-xs bg-white/10 w-fit px-2 py-1 rounded">
                  <BsCurrencyRupee /> Revenue per order
                </div>
            </div>
            <div className="absolute -bottom-4 -right-4 text-white/10">
                <BsBagFill size={80} />
            </div>
          </div>

          {/* Metric 2: Points Efficiency */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs font-medium uppercase">Points Efficiency</p>
                  <h4 className="text-2xl font-bold text-[#1F2837] mt-1">{kpis.pointsRate} <span className="text-sm font-normal text-gray-400">pts/order</span></h4>
                </div>
                <div className="bg-green-50 text-green-600 p-3 rounded-full">
                  <BsAwardFill size={20} />
                </div>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-4">
                <div className="bg-green-500 h-1.5 rounded-full" style={{width: '65%'}}></div>
            </div>
          </div>
          
        </div>
      </div>

      {/* --- IMPROVED SECTION: CUSTOMER PIPELINE --- */}
      <div className="mb-8">
          {/* <h3 className="text-lg font-semibold text-[#1F2837] mb-4 pl-2 border-l-4 border-[#003A72]">Customer Pipeline</h3> */}
          
          {/* Horizontal Scrollable Container */}
          {/* <div className="flex flex-nowrap overflow-x-auto pb-4 gap-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {leadStatuses.map((item) => {
              const count = leadCounts[item.status_id] || 0;
              return (
                <div
                  key={item.status_id}
                  onClick={() => navigate(`/leads/${item.status_id}/${item.status_name}`, { state: { assignedTo: user.id, updatedBy: user.id } })}
                  className="flex-none w-40 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#003A72] transition-all duration-200 cursor-pointer p-4 flex flex-col items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#003A72] to-transparent opacity-50"></div>
                  
                  <div className="w-10 h-10 rounded-full bg-[#e6f4fb] flex items-center justify-center text-[#003A72] mb-3">
                    <span className="font-bold text-lg">{item.status_name.charAt(0)}</span>
                  </div>
                  
                  <h5 className="text-sm font-medium text-gray-700 text-center line-clamp-1 mb-1">{item.status_name}</h5>
                  
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-2xl font-bold text-[#1F2837]">{count}</span>
                    <span className="text-[10px] text-gray-400 uppercase">Leads</span>
                  </div>
                </div>
              );
            })}
          </div> */}
      </div>
      
    </>
  ) : null}

  <div className="w-[30%] flex justify-center"></div>

  </div> 
  );
};

export default Dashboard;