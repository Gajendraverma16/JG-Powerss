import React, { useRef, useEffect, useState } from "react";
import api from "../../api";

import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Filler,
  Tooltip,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Filler,
  Tooltip
);

const AreaChart = () => {
  const chartRef = useRef(null);
  const [chartData, setChartData] = useState(null);
  const chartInstance = useRef(null);

  const dummyData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug" , "Sep", "Oct" , "Nov" , "Dec"],
    values: [120, 160, 140, 350, 500, 900, 750, 640 , 678, 420 , 700 ,400],
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
    const res = await api.get("https://your-api-url.com/data");

      if (res.data?.labels && res.data?.values) {
        setChartData(res.data);
      } else {
        setChartData(dummyData);
      }
    } catch (error) {
      console.log("API error, using dummy data");
      setChartData(dummyData);
    }
  };

  useEffect(() => {
    if (!chartData) return;

    const ctx = chartRef.current.getContext("2d");

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }


    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(100, 137, 225, 0.7)");
    gradient.addColorStop(1, "rgba(0, 77, 255, 0.05)");

    chartInstance.current = new Chart(ctx, {
      type: "line",
      data: {
        labels: chartData.labels,
        datasets: [
          {
            data: chartData.values,
            fill: true,
            backgroundColor: gradient,
            borderColor: "#5482edff",
            tension: 0.45,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: { enabled: true },
          legend: { display: false },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#777" },
          },
          y: {
            grid: { color: "#EEE" },
            ticks: { color: "#777" },
          },
        },
      },
    });
  }, [chartData]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-md p-4 border border-[#E9EAEA]" style={{ height: "280px" }}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default AreaChart;
