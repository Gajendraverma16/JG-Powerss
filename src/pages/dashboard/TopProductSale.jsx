import React, { useEffect, useRef, useState } from "react";
import api from "../../api";
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const TopProductSale = ({
  leads,
  gradient = "linear-gradient(45deg, white, #e6f4fb)",
  icon,
  totalLeadsLabel = "Total Product Sale"
}) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Dummy data
  const dummyData = {
    labels: ["Vector", "Template", "Presentation"],
    values: [55, 25, 20]
  };

  // Unique API data state
  const [apiData, setApiData] = useState(null);

  // Fetch API
  useEffect(() => {
    fetchProductSale();
  }, []);

  const fetchProductSale = async () => {
    try {
     const res = await api.get("https://your-api-url.com/data");

      setApiData({
        productLabels: res.data?.productLabels,
        productValues: res.data?.productValues
      });
    } catch (err) {
      setApiData(null);
    }
  };

  const blue = "#003a72";
  const orange = "#ef7e1b";
  const grey = "#d3d3d3";

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");

    chartInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: apiData?.productLabels ?? dummyData.labels,

        datasets: [
          {
            data: apiData?.productValues ?? dummyData.values,
            backgroundColor: [blue, orange, grey],
            borderWidth: 0
          }
        ]
      },
      options: {
        cutout: "75%",
        plugins: {
          legend: { display: false }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }, [apiData]);

  return (
    <div
      className="relative inline-block p-[3px] rounded-2xl overflow-hidden 
                 w-full sm:w-[48%] lg:w-[23%] min-w-[280px]"
      style={{
        backgroundImage: `linear-gradient(to top right, transparent 70%, #ee7f1b)`
      }}
    >
      {/* Glow */}
      <div className="absolute bottom-0 right-0 w-[100px] h-[100px] bg-[#ee7f1b] rounded-full blur-[30px]" />

      {/* Inner Card */}
      <div
        className="relative z-10 rounded-[14px] min-h-[150px] h-full
                   px-5 pt-5 pb-3 flex flex-col justify-between
                   shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
        style={{
          background: "linear-gradient(45deg, white, #e6f4fb)"
        }}
      >
        {/* Title + Icon Row */}
        <div className="flex justify-between items-start">
          <h2 className="text-base font-bold text-[20px]" style={{ color: orange }}>
            Top Product Sale
          </h2>

          <div className="bg-[#3498DB33] rounded-full w-[55px] h-[55px] flex justify-center items-center mt-1">
            {icon && (
              <span className="w-[28px] h-[28px] flex items-center justify-center text-[28px] text-[#ef7e1b]">
                {icon}
              </span>
            )}
          </div>
        </div>

        {/* Chart + Legend */}
        <div className="flex justify-between items-center mt-2">
          <div className="w-[80px] h-[80px] relative">
            <canvas ref={chartRef}></canvas>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-[10px] font-semibold text-gray-500">
                Total Sale
              </p>
              <p className="text-base font-bold text-black">95K</p>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1 text-[13px] ml-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: blue }}></span>
              Vector
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: orange }}></span>
              Template
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-gray-400"></span>
              Presentation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopProductSale;
