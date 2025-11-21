import React, { useEffect, useState, useRef } from "react";

import {
   BsBarChartFill,
   BsFillPersonLinesFill,
   BsMapFill ,
   BsAwardFill ,
   BsBagFill,
   BsLightningChargeFill
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

// Dummy Data
const [dummy, setDummy] = useState({
  villageCount: 45,
  totalOrders: 120,
  totalPointes: 300,
  newOrders: 30,
  returnOrders: 12,
  exchangeOrders: 8,
});

const [villageAPI, setVillageAPI] = useState(null);
const [ordersAPI, setOrdersAPI] = useState(null);
const [pointsAPI, setPointsAPI] = useState(null);



useEffect(() => {
  fetchDashboard();
}, []);

const fetchDashboard = async () => {
  try {
    const res = await axios.get("YOUR_API_URL");
     setVillageAPI(res.data?.villageCount);
    setOrdersAPI(res.data?.totalOrders);
    setPointsAPI(res.data?.totalPointes);

  } catch (e) {
    setVillageAPI(null);
    setOrdersAPI(null);
    setPointsAPI(null);
  }
};


// const [apiData, setApiData] = useState(null);

// useEffect(() => {
//   fetchData();
// }, []);

// const fetchData = async () => {
//   try {
//       const res = await api.get("/");

//     if (res.data) {
//       setApiData(res.data);
//     } else {
//       setApiData(null); // so dummy will show
//     }
//   } catch (error) {
//     setApiData(null); // API fail → dummy
//   }
// };
  
//  useEffect(() => {
//   fetchDashboard();
// }, []);

// const fetchDashboard = async () => {
//   try {
//      const res = await api.get("/");

//     if (res.data) {
//       setApiData(res.data); // API SUCCESS
//     } else {
//       setApiData(null);     // API EMPTY → Dummy
//     }
//   } catch (error) {
//     setApiData(null);       // API FAIL → Dummy
//   }
// };

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
    if (user.role === "admin") {
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

      // Update top users if API available
      // const topUsersData = topUsersRes?.data?.users;
      // if (topUsersData && topUsersData.length > 0) {
      //   setTopUsers(topUsersData);
      // }
    } catch (error) {
      console.error("Error fetching admin dashboard data:", error);
      // Keep dummy data on error
    }
  };

  return (
  
  <div className="box-border max-w-7xl w-full md:w-[95vw] lg:max-w-[1180px] mx-auto px-2 sm:px-4 lg:px-0 overflow-x-hidden">
  
  {/* ADMIN DASHBOARD */}
  {user.role === "admin" ? (
    <>
      {/* Welcome Header */}
      <div className="mb-6">
        {/* <h1 className="text-2xl md:text-3xl font-bold text-[#1F2837]">Admin Dashboard</h1>
        <p className="text-[#727A90] mt-1">Welcome back! Here's what's happening today.</p> */}
      </div>

      {/* Main Stats Grid */}
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
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(52,152,219,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #f0f9ff)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {adminStats.totalShopOwners}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Shop Owners
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsFillPersonLinesFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Total Products */}
        {/* <div
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
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(52,152,219,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #f0f9ff)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {adminStats.totalProducts}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Products
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsBarChartFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div> */}

        {/* Total Users */}
        {/* <div
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
                       shadow-[0_4px_20px_rgba(0,0,0,0.08)] group-hover:shadow-[0_8px_30px_rgba(52,152,219,0.15)] transition-all duration-300"
            style={{ background: "linear-gradient(45deg, white, #f0f9ff)" }}
          >
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand group-hover:scale-105 transition-transform duration-300">
                  {adminStats.totalUsers}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Users
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-[#003A72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Orders & Revenue Section */}
      <div className="flex flex-wrap justify-start gap-4 md:gap-6 mb-6">
        {/* Total Orders Card */}
        {/* <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[48%] min-w-[280px]"
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
            <div className="flex justify-between mb-3">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand">
                  {adminStats.totalOrders}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Orders
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5">
                <BsBagFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
            <div className="flex gap-3 text-xs font-medium">
              <span className="text-green-600">New: {adminStats.newOrders}</span>
              <span className="text-red-600">Return: {adminStats.returnOrders}</span>
              <span className="text-blue-600">Exchange: {adminStats.exchangeOrders}</span>
            </div>
          </div>
        </div> */}

        {/* Revenue Card */}
        {/* <div
          className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                     w-full sm:w-[48%] lg:w-[48%] min-w-[280px]"
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
            <div className="flex justify-between">
              <div>
                <div className="text-[#003A72] text-[32px] font-extrabold font-quicksand">
                  ₹ {(adminStats.totalRevenue / 1000).toFixed(0)}K+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Revenue
                </div>
                <div className="text-[#727A90] text-xs mt-1">
                  Recreate value (Points)
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5">
                <BsAwardFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div> */}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Orders Bar Chart */}
        {/* <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-2xl shadow-md p-6 border border-[#E9EAEA]">
          <h3 className="text-lg font-semibold text-[#1F2837] mb-6">Orders Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <div className="w-full h-full flex items-end justify-around gap-4">
              {[
                { label: "New", value: adminStats.newOrders, color: "#27AE60", max: 100 },
                { label: "Return", value: adminStats.returnOrders, color: "#E74C3C", max: 100 },
                { label: "Exchange", value: adminStats.exchangeOrders, color: "#003A72", max: 100 },
                { label: "Total", value: adminStats.totalOrders, color: "#003A72", max: 1500 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center group">
                  <div 
                    className="w-full rounded-t-xl transition-all duration-500 hover:opacity-80 cursor-pointer relative"
                    style={{ 
                      height: `${(item.value / item.max) * 100}%`,
                      backgroundColor: item.color,
                      minHeight: "30px"
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded">
                      {item.value}
                    </div>
                  </div>
                  <p className="text-xs text-[#727A90] mt-3 font-medium">{item.label}</p>
                  <p className="text-lg font-bold text-[#1F2837]">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Distribution with Icons */}
        {/* <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-2xl shadow-md p-6 border border-[#E9EAEA]">
          <h3 className="text-lg font-semibold text-[#1F2837] mb-6">Location Distribution</h3>
          <div className="space-y-4">
            {[
              { 
                label: "Branches", 
                value: adminStats.totalBranches, 
                color: "#003A72",
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              },
              { 
                label: "Routes", 
                value: adminStats.totalRoutes, 
                color: "#27AE60",
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              },
              { 
                label: "Areas", 
                value: adminStats.totalAreas, 
                color: "#003A72",
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              },
              { 
                label: "Villages", 
                value: adminStats.totalVillages, 
                color: "#9B59B6",
                icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              },
            ].map((item, idx) => {
              const total = adminStats.totalBranches + adminStats.totalRoutes + adminStats.totalAreas + adminStats.totalVillages;
              const percentage = ((item.value / total) * 100).toFixed(1);
              
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <div style={{ color: item.color }}>
                      {item.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1F2837]">{item.label}</span>
                      <span className="text-sm font-bold text-[#1F2837]">{item.value}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[#727A90] font-medium w-12 text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        </div> */}
      </div>

      {/* Top Users Section */}
      {/* <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-2xl shadow-md p-6 border border-[#E9EAEA]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#1F2837]">Top Performing Users</h3>
          <BsLightningChargeFill className="text-[#003A72] text-xl" />
        </div>
        <div className="space-y-3">
          {topUsers.map((user, idx) => (
            <div key={user.id} className="flex items-center justify-between p-4 bg-white rounded-xl hover:shadow-md transition-all duration-300 border border-gray-100 group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-gray-200 group-hover:ring-[#003A72] transition-all">
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/dummyavatar.jpeg";
                      }}
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-[#003A72] to-[#003A72] flex items-center justify-center text-white text-xs font-bold shadow-md">
                    {idx + 1}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-[#1F2837] group-hover:text-[#003A72] transition-colors">{user.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <BsBagFill className="text-[#727A90] text-xs" />
                    <p className="text-xs text-[#727A90]">{user.orders} orders</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-[#003A72] text-lg">₹ {user.revenue.toLocaleString()}</p>
                <p className="text-xs text-[#727A90]">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div> */}
    </>
  ) : (
    /* SALESMAN DASHBOARD */
    <>
      {/* Welcome Header */}
      <div className="mb-6">
        {/* <h1 className="text-2xl md:text-3xl font-bold text-[#1F2837]">Welcome back, {user?.name || 'Salesman'}!</h1>
        <p className="text-[#727A90] mt-1">Here's your performance overview</p> */}
      </div>

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
                  {dashboardData?.leadsByStatus?.total_leads || 0}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Shop Owners
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsFillPersonLinesFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Villages */}
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
                  {villageAPI ?? dummy.villageCount}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Assigned Villages
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsMapFill className="text-[#003A72] text-[30px]" />
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
                  {ordersAPI ?? dummy.totalOrders}+
                </div>
                <div className="text-black font-semibold text-[15px]">
                  Total Orders
                </div>
              </div>
              <div className="bg-[#003A7233] rounded-full w-[60px] h-[60px] flex justify-center items-center mt-1.5 group-hover:scale-110 transition-transform duration-300">
                <BsBagFill className="text-[#003A72] text-[30px]" />
              </div>
            </div>
            <div className="flex gap-3 text-xs font-medium mt-2">
              <span className="text-green-600">New: {ordersAPI?.newOrders ?? dummy.newOrders}</span>
              <span className="text-red-600">Return: {ordersAPI?.returnOrders ?? dummy.returnOrders}</span>
              <span className="text-blue-600">Exchange: {ordersAPI?.exchangeOrders ?? dummy.exchangeOrders}</span>
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
                  {pointsAPI ?? dummy.totalPointes}+
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

        {/* Top Product Sale */}
        {/* <div
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
            <div className="flex justify-between items-start mb-2">
              <div className="text-black font-semibold text-[15px]">
                Top Product Sale
              </div>
              <div className="bg-[#003A7233] rounded-full w-[50px] h-[50px] flex justify-center items-center">
                <BsBarChartFill className="text-[#003A72] text-[24px]" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#003A72" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset="75.36" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-[#003A72]">70%</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs text-[#727A90]">Vector</p>
                <p className="text-sm font-semibold text-[#1F2837]">95K Sales</p>
              </div>
            </div>
          </div>
        </div> */}

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

      {/* Performance Chart with Side Stats */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart - Takes 1 column (50%) */}
        <div className="lg:col-span-1">
          {/* <AreaChart /> */}
        </div>
        
        {/* Side Stats Card - Takes 1 column (50%) */}
        <div className="lg:col-span-1">
          <div>
            {/* <h3 className="text-base font-semibold text-[#1F2837] mb-3">Monthly Summary</h3> */}
            
            <div className="space-y-3 flex-1 overflow-y-auto">
              {/* This Month */}
              {/* <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#727A90]">This Month</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-[#003A72]">₹ 12.5K</span>
                  <span className="text-xs text-green-600 font-medium">↑ 15%</span>
                </div>
              </div> */}

              {/* Target Progress */}
              {/* <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#727A90]">Monthly Target</span>
                  <span className="text-xs font-semibold text-[#1F2837]">75%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                  <div className="bg-gradient-to-r from-[#003A72] to-[#003A72] h-2 rounded-full transition-all duration-500" style={{ width: '75%' }}></div>
                </div>
                <p className="text-[10px] text-[#727A90]">₹ 15K / ₹ 20K</p>
              </div> */}

              {/* Quick Stats */}
              {/* <div className="grid grid-cols-2 gap-2">
                <div className="bg-gradient-to-br from-[#003A72]/10 to-[#003A72]/5 rounded-lg p-2 border border-[#003A72]/20">
                  <p className="text-[10px] text-[#727A90] mb-0.5">Avg. Order</p>
                  <p className="text-lg font-bold text-[#003A72]">₹ 850</p>
                </div>
                <div className="bg-gradient-to-br from-[#27AE60]/10 to-[#27AE60]/5 rounded-lg p-2 border border-[#27AE60]/20">
                  <p className="text-[10px] text-[#727A90] mb-0.5">Conversion</p>
                  <p className="text-lg font-bold text-[#27AE60]">68%</p>
                </div>
              </div> */}

              {/* Top Achievement */}
              {/* <div className="bg-gradient-to-r from-[#0e4053] to-[#0d3847] rounded-lg p-3 text-white">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/80">Top Performer</p>
                    <p className="text-sm font-semibold">Best Sales This Week!</p>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Your Rank Section */}
      {/* <div className="bg-gradient-to-br from-white to-[#E7F4FF] rounded-xl shadow-md p-6 border border-[#E9EAEA]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#1F2837]">Your Performance Rank</h3>
          <div className="flex items-center gap-2 bg-gradient-to-r from-[#003A72] to-[#003A72] text-white px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-bold">Rank #5</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-[#727A90] mb-1">Total Sales</p>
            <p className="text-2xl font-bold text-[#003A72]">₹ 45,200</p>
            <p className="text-xs text-green-600 mt-1">↑ 12% from last month</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-[#727A90] mb-1">Orders Completed</p>
            <p className="text-2xl font-bold text-[#0e4053]">{ordersAPI ?? dummy.totalOrders}</p>
            <p className="text-xs text-green-600 mt-1">↑ 8% from last month</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-100">
            <p className="text-xs text-[#727A90] mb-1">Customer Satisfaction</p>
            <p className="text-2xl font-bold text-[#27AE60]">4.8/5.0</p>
            <p className="text-xs text-[#727A90] mt-1">Based on 120 reviews</p>
          </div>
        </div>
      </div> */}
      
    </>
  )}

  {/* RIGHT SIDE — Donut chart */}
  <div className="w-[30%] flex justify-center">
    </div>

      {/* User Activity Today Section */}
    <div>
          <div className="text-[#727A90] text-sm font-medium mb-2 ml-1">    
        {/* Categories */}
          </div>
        <div className="flex flex-wrap gap-4 w-full min-w-0 justify-center md:justify-start ">
          {leadStatuses.map((item) => (
//             <div
//                   key={item.status_id}
//                   className="flex flex-col items-center  justify-center bg-gradient-to-br from-white to-[#E7F4FF] rounded-[12px] shadow-[0_2px_8px_rgba(24,95,235,0.06)] px-2 sm:px-3 md:px-5 py-3 sm:py-4 min-w-[100px] sm:min-w-[120px] md:min-w-[150px] max-w-[120px] sm:max-w-[150px] md:max-w-[170px] border border-[#E9EAEA] cursor-pointer hover:shadow-lg transition w-full sm:w-auto mb-2 sm:mb-0 box-border overflow-hidden"
//                   onClick={() =>
//        navigate(`/leads/${item.status_id}/${item.status_name}`, {
//      state: { assignedTo: user.id, updatedBy: user.id },
//   })
// }
            
//                 >
//                   {/* Avatar */}
//                   {/* <div className="w-8 h-8 rounded-full bg-[#e3e9f7] flex items-center justify-center text-sm font-semibold text-[#003A72] mb-2 shadow-sm border border-[#d1e3fa]">
//                     {initials}
//                   </div> */}
//                   {/* Name */}
//                   <div className="text-[15px] font-semibold text-[#1F2837] mb-0.5 truncate w-full text-center max-w-full">
//                     {item.status_name}
//                   </div>
//                   {/* Role badge */}
//                   {/* <div
//                     className={`text-[11px] font-normal px-2 py-0.5 rounded-full border ${roleColor} mb-2 capitalize w-fit mx-auto`}
//                   >
//                     {formatRole(todayData.role || user.role)}
//                   </div> */}
//                   {/* Divider */}
//                   {/* <div className="w-full h-px bg-[#F0F4F8] my-1" /> */}
//                   {/* Today's Leads and Updated Leads Today */}
//                   {/* <div className="flex flex-col items-center mt-1 gap-1 w-full">
//                     <div className="flex flex-row justify-between items-center w-full"></div>
//                     <div className="flex flex-row justify-between items-center w-full">
//                       <span className="text-[10px] text-[#727A90] mt-0.5 text-left ">
//                         Today's <br></br>Updated Shop Owners
//                       </span>
//                       <span className="text-2xl font-bold text-[#003A72] leading-none text-right">
//                         {updatedData.updated_leads ?? 0}
//                       </span>
//                     </div>
//                   </div> */}
//                 </div>
          <div/>
          ))}
        </div>
    </div>

      {/* Customer Enquiry Section */}
      {/* <div
        className={`min-h-[797px] p-2 sm:p-4 md:p-6 mt-8 relative bg-gradient-to-br from-white to-[#E7F4FF] rounded-[10px] shadow-[2px_2px_6px_rgba(24,95,235,0.1)] flex flex-col w-full box-border overflow-x-auto md:w-11/12 lg:max-w-[75vw] xl:w-full  `}
      > */}
        {/* Header Section */}
        {/* <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4 mb-8 w-full min-w-0">
          <h1 className="text-[18px] sm:text-[20px] md:text-[22px] font-medium text-[#1F2837] whitespace-nowrap truncate max-w-full   ">
            Shop Owners 
          </h1>
          <div className="flex flex-wrap items-center gap-2 md:gap-3 lg:gap-4">
            <span className="text-[#727A90] text-xs sm:text-sm md:text-base lg:text-base whitespace-nowrap">
              Show
            </span>
            <div
              className="relative min-w-[56px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[88px] max-w-full"
              ref={itemsPerPageDropdownRef}
            >
              <button
                type="button"
                className="relative appearance-none h-[32px] sm:h-[36px] md:h-[44px] lg:h-[44px] pl-2 pr-8 sm:pr-10 md:pr-15 lg:pr-15 w-full min-w-[56px] sm:min-w-[72px] md:min-w-[88px] lg:min-w-[88px] bg-white border border-[#E9EAEA] rounded-[8px]  text-[#242729] text-[10px] sm:text-[8px] md:text-base lg:text-sm focus:outline-none flex items-center box-border"
                onClick={() => setIsItemsPerPageDropdownOpen((open) => !open)}
              >
                <span className="truncate text-left flex-1">
                  {itemsPerPage}
                </span>
                <img
                  src="/caret-down.svg"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 md:right-3 lg:right-3 top-1/2 -translate-y-1/2 w-4 h-4"
                />
              </button>
              {isItemsPerPageDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-[12px] shadow-lg border border-gray-200 z-50 max-h-[200px] overflow-y-auto custom-scrollbar box-border">
                  {[5, 10, 20, 50].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        handleItemsPerPageChange(option);
                        setIsItemsPerPageDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-[#E7EFF8] text-xs sm:text-sm md:text-base lg:text-base ${
                        itemsPerPage === option
                          ? "bg-[#E7EFF8] font-bold text-[#003A72]"
                          : "text-[#545454]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div> */}

        {/* Lead List Table */}
        {/* <div className="hidden md:block w-full flex-grow overflow-x-auto overflow-y-hidden relative custom-scrollbar box-border">
          <table className="min-w-full border-collapse text-xs sm:text-sm md:text-base box-border">
            <thead>
              <tr className="text-left text-[#4B5563]">
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Shop Owners ID
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[180px]">
                  Shop Owners Name
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[160px]">
                  Email
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  Contact
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  City
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  WhatsApp
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[180px]">
                  Shop name
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[180px]">
                  Message
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm  max-w-[120px]">
                  Source
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Categories
                </th>
                <th className="py-4 px-2 sm:px-4 md:px-6 font-medium text-sm whitespace-nowrap  max-w-[120px]">
                  Assigned Member
                </th>
              </tr>
            </thead>
            <tbody>
              {currentLeads.length === 0 ? (
                <tr>
                  <td
                    colSpan="11"
                    className="py-8 px-6 text-center text-[#4B5563]"
                  >
                    {searchTerm
                      ? "No Shop Owners found matching your search."
                      : "Shop Owners available."}
                  </td>
                </tr>
              ) : (
                currentLeads.map((lead) => (
                  <tr
                    key={lead.customer_id}
                    className="border-t border-[#E5E7EB]"
                  >
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.customer_id}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      <div className="flex items-center gap-3 ">
                        <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          <img
                            src={lead.profile_pic || "/dummyavatar.jpeg"}
                            alt={lead.customer_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/dummyavatar.jpeg";
                            }}
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[#1F2837] font-medium">
                            {lead.customer_name}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.email}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.contact}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {(() => {
                        let parsedAddress = null;
                        if (
                          lead.city &&
                          typeof lead.city === "string" &&
                          lead.city.trim().startsWith("{")
                        ) {
                          try {
                            parsedAddress = JSON.parse(lead.city);
                          } catch (e) {
                            // ignore
                          }
                        } else if (lead.city && typeof lead.city === "object") {
                          parsedAddress = lead.city;
                        }
                        // Only show city if present and not empty
                        if (
                          parsedAddress &&
                          parsedAddress.city &&
                          parsedAddress.city.trim() !== ""
                        ) {
                          return parsedAddress.city;
                        }
                        // If not a JSON, but a plain string (legacy), show only if not empty and not a JSON string
                        if (
                          lead.city &&
                          typeof lead.city === "string" &&
                          lead.city.trim() !== "" &&
                          !lead.city.trim().startsWith("{")
                        ) {
                          return lead.city;
                        }
                        return "-";
                      })()}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.whatsapp_number || "-"}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.requirements}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.message}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.source}
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 max-w-xs overflow-hidden truncate">
                      <span
                        className={`
                        px-3 py-1 rounded-lg text-sm flex items-center gap-2
                        ${
                          lead.status_name === "Fresh List"
                            ? "bg-[#27AE60] text-white"
                            : lead.status_name === "Follow Up"
                            ? "bg-[#003A72] text-white"
                            : lead.status_name === "Get Call Back Us"
                            ? "bg-[#FFFBEB] text-[#D97706]"
                            : lead.status_name === "Contact In Future"
                            ? "bg-[#FFF8DD] text-[#F1C40F]"
                            : lead.status_name === "Next Day Payments"
                            ? "bg-[#27AE60] text-white"
                            : lead.status_name === "Quote Send"
                            ? "bg-[#003A72] text-white"
                            : lead.status_name === "Call Back"
                            ? "bg-[#FFFBEB] text-[#D97706]"
                            : lead.status_name === "Construction"
                            ? "bg-[#FFF8DD] text-[#F1C40F]"
                            : lead.status_name === "NPC"
                            ? "bg-[#27AE60] text-white"
                            : lead.status_name === "Switch off"
                            ? "bg-[#003A72] text-white"
                            : lead.status_name === "Not Reachable"
                            ? "bg-[#FFFBEB] text-[#D97706]"
                            : lead.status_name === "Quotation"
                            ? "bg-[#FFF8DD] text-[#ff0000]"
                            : lead.status_name === "Converted Client"
                            ? "bg-[#093d6e] text-white"
                            : "bg-[#173f12] text-white"
                        }
                      `}
                      >
                        {lead.status_name}
                      </span>
                    </td>
                    <td className="py-4 px-2 sm:px-4 md:px-6 text-sm text-[#4B5563] max-w-xs overflow-hidden truncate">
                      {lead.assigned_to}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div> */}

        {/* Lead List Cards for Mobile */}
        {/* <div className="md:hidden w-full space-y-4 sm:space-y-6 pb-20 sm:pb-24 flex-grow overflow-x-auto">
          {currentLeads.length === 0 ? (
            <div className="py-12 px-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4  rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-5.5a2.5 2.5 0 00-2.5 2.5v.5a2 2 0 01-2 2h-3a2 2 0 01-2-2v-.5a2.5 2.5 0 00-2.5-2.5H4"
                  />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">
                {searchTerm
                  ? "No Shop Owners found matching your search."
                  : "No Shop Owners available."}
              </p>
            </div>
          ) : (
            currentLeads.map((lead) => (
              <div
                key={lead.customer_id}
                className="bg-white rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg p-2 sm:p-4 "
              >
                {/* Header Section */}
                {/* <div className="p-4 sm:p-6 border-b border-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 sm:space-x-4">
                      <div className="flex items-center space-x-3 ">
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden ring-1 ring-gray-200">
                          <img
                            src={lead.profile_pic || "/dummyavatar.jpeg"}
                            alt={lead.customer_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/dummyavatar.jpeg";
                            }}
                          />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 whitespace-nowrap">
                            {lead.customer_name}
                          </h3>
                          <p className="text-xs text-gray-500">{lead.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div> */}
                {/* Details Section */}
                {/* <div className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 ">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                          Contact
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.contact}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          WhatsApp
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.whatsapp_number || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          City
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {(() => {
                            let parsedAddress = null;
                            if (
                              lead.city &&
                              typeof lead.city === "string" &&
                              lead.city.trim().startsWith("{")
                            ) {
                              try {
                                parsedAddress = JSON.parse(lead.city);
                              } catch (e) {
                                // ignore
                              }
                            } else if (
                              lead.city &&
                              typeof lead.city === "object"
                            ) {
                              parsedAddress = lead.city;
                            }
                            // Only show city if present and not empty
                            if (
                              parsedAddress &&
                              parsedAddress.city &&
                              parsedAddress.city.trim() !== ""
                            ) {
                              return parsedAddress.city;
                            }
                            // If not a JSON, but a plain string (legacy), show only if not empty and not a JSON string
                            if (
                              lead.city &&
                              typeof lead.city === "string" &&
                              lead.city.trim() !== "" &&
                              !lead.city.trim().startsWith("{")
                            ) {
                              return lead.city;
                            }
                            return "-";
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          Source
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900">
                          {lead.source}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide ">
                          Assigned User
                        </p>
                        <p className="text-[10px] ml-1 text-gray-900 whitespace-nowrap">
                          {lead.assigned_to}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                      <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                        <svg
                          className="w-3 h-3 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                          Follow Up
                        </p>
                        <p className="text-[7px] sm:text-xs ml-1 text-gray-900 whitespace-nowrap">
                          {formatDateTimeForTable(lead.follow_up_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Shop name
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.requirements}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Message
                      </p>
                      <p className="text-[10px] ml-1 text-gray-900 leading-relaxed">
                        {lead.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-1 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 ">
                    <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center shadow-sm">
                      <svg
                        className="w-3 h-3 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] ml-1 font-medium text-gray-500 uppercase tracking-wide">
                        Categories
                      </p>
                      <span
                        className={`
                        px-3 py-1 rounded-full text-xs font-medium
                        ${
                          lead.status_name === "Fresh List"
                            ? "bg-emerald-100 text-emerald-800"
                            : lead.status_name === "Follow Up"
                            ? "bg-Duskwood-100 text-Duskwood-800"
                            : lead.status_name === "Get Call Back Us"
                            ? "bg-amber-100 text-amber-800"
                            : lead.status_name === "Contact In Future"
                            ? "bg-yellow-100 text-yellow-800"
                            : lead.status_name === "Next Day Payments"
                            ? "bg-emerald-100 text-emerald-800"
                            : lead.status_name === "Quote Send"
                            ? "bg-Duskwood-100 text-Duskwood-800"
                            : lead.status_name === "Call Back"
                            ? "bg-amber-100 text-amber-800"
                            : lead.status_name === "Construction"
                            ? "bg-yellow-100 text-yellow-800"
                            : lead.status_name === "NPC"
                            ? "bg-emerald-100 text-emerald-800"
                            : lead.status_name === "Switch off"
                            ? "bg-Duskwood-100 text-Duskwood-800"
                            : lead.status_name === "Not Reachable"
                            ? "bg-amber-100 text-amber-800"
                            : lead.status_name === "Quotation"
                            ? "bg-red-100 text-red-800"
                            : lead.status_name === "Converted Client"
                            ? "bg-[#093d6e] text-white"
                            : "bg-[#173f12] text-white"
                        }
                      `}
                      >
                        {lead.status_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div> */} 
        {/* Pagination Controls */}
        {/* {filteredLeads.length > 0 && (
          <div className="flex justify-center pt-4 sm:pt-7 mt-auto">
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`w-[44px] h-[44px] lg:w-[52px] lg:h-[52px]
          rounded-full border border-[#0e4053]
          flex items-center justify-center transition-colors
          ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : "group hover:bg-Duskwood-200 hover:border-white "
          }
        `}
              >
                <svg
                  width="33"
                  height="32"
                  viewBox="0 0 33 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`stroke-current text-[#7E7B7B]
            ${currentPage === 1 ? "" : "group-hover"}
          `}
                >
                  <path
                    d="M23.1667 5.33398L12.06 13.3873C9.09198 15.5407 9.09198 16.462 12.06 18.614L23.1667 26.6673"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base text-[#4B5563]">
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <span>({filteredLeads.length} total)</span>
              </div>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`w-[44px] h-[44px] lg:w-[52px] lg:h-[52px]
          rounded-full border border-[#7E7B7B]
          flex items-center justify-center transition-colors
          ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : "group hover:bg-Duskwood-200 "
          }
        `}
              >
                <svg
                  width="52"
                  height="52"
                  viewBox="0 0 52 52"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`stroke-current text-[#7E7B7B]
            ${currentPage === totalPages ? "" : "group-hover"}
          `}
                >
                  <circle cx="26" cy="26" r="25.5" strokeWidth="1" />
                  <path
                    d="M20.8333 15.334L31.94 23.3873C34.908 25.5407 34.908 26.462 31.94 28.614L20.8333 36.6673"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        )} */}
      </div> 
  );
};

export default Dashboard;
