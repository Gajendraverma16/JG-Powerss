import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import logo from "../assets/website/logo.png"
import cart1 from "../assets/website/cart1.png"
import cart2 from "../assets/website/cart2.png"

import shilider1 from "../assets/website/shilider1.jpg";
import shilider2 from "../assets/website/shilider2.jpg";
import shilider3 from "../assets/website/shilider3.jpg";


function Website() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();
  
 const reviews = [
    {
      name: "Rajesh Kumar",
      role: "Homeowner, Delhi",
      image:
        "https://readdy.ai/api/search-image?query=Professional%20Indian%20man%20in%20business%20attire%20smiling%20confidently%2C%20clean%20professional%20headshot%20photo%20for%20testimonial%2C%20modern%20lighting%2C%20professional%20portrait%20photography%20style&width=60&height=60&seq=8&orientation=squarish",
      review:
        '"Excellent service! The electrician arrived on time and fixed my lighting issue quickly. Very professional and reasonably priced."',
    },
    {
      name: "Priya Sharma",
      role: "Business Owner, Mumbai",
      image:
        "https://readdy.ai/api/search-image?query=Professional%20Indian%20woman%20with%20friendly%20smile%2C%20business%20casual%20attire%2C%20professional%20headshot%20for%20customer%20testimonial%2C%20modern%20professional%20photography&width=60&height=60&seq=9&orientation=squarish",
      review:
        '"Great product quality and fast delivery. The LED bulbs I ordered are working perfectly and the customer service was helpful."',
    },
    {
      name: "Amit Patel",
      role: "Engineer, Bangalore",
      image:
        "https://readdy.ai/api/search-image?query=Professional%20Indian%20man%20with%20glasses%20and%20friendly%20expression%2C%20business%20professional%20headshot%2C%20clean%20modern%20portrait%20for%20customer%20testimonial&width=60&height=60&seq=10&orientation=squarish",
      review:
        '"Outstanding experience! Booked an electrician through the app and he completed the wiring work perfectly. Highly recommended!"',
    },
  ];

 const services = [
    {
      icon: "ri-home-line",
      title: "Home Wiring",
      description:
        "Complete home electrical wiring services for new constructions and renovations.",
      price: "₹2,999",
    },
    {
      icon: "ri-lightbulb-line",
      title: "Light Repair & Installation",
      description:
        "Professional lighting installation and repair services for homes and offices.",
      price: "₹499",
    },
    {
      icon: "ri-plug-line",
      title: "Switch & Socket Installation",
      description:
        "Installation and replacement of electrical switches, sockets, and outlets.",
      price: "₹299",
    },
    {
      icon: "ri-flashlight-line",
      title: "Emergency Repairs",
      description:
        "24/7 emergency electrical repair services for urgent electrical issues.",
      price: "₹799",
    },
    {
      icon: "ri-settings-line",
      title: "Electrical Maintenance",
      description:
        "Regular maintenance and inspection services to keep your electrical systems safe.",
      price: "₹1,299",
    },
    {
      icon: "ri-tools-line",
      title: "Panel Upgrades",
      description:
        "Electrical panel upgrades and circuit breaker installations for safety.",
      price: "₹4,999",
    },
  ];


const slides = [
  {
    image: shilider1,
    title: "E-Commerce & Service Booking Platform",
    subtitle: "Shop Products & Book Trusted Professionals in One App",
    description:
      "Build a powerful all-in-one platform where users can buy products online and book verified service professionals like electricians, plumbers, and more — all from a single digital ecosystem. Deliver seamless shopping and service experiences with secure payments, real-time tracking, and future-ready scalability.",
    button1Text: "Start Your Project",
    button2Text: "Explore Features",
  },
  {
    image: shilider3,
    title: "On-Demand Service Booking",
    subtitle: "Book Verified Professionals Instantly",
    description:
      "Allow users to schedule trusted electricians, plumbers, cleaners, and more — with flexible time slots, location-based search, and secure digital payments — all within one unified platform.",
    button1Text: "Book a Service",
    button2Text: "Explore Services",
  },
  {
     image: shilider2,
    title: "Integrated E-Commerce Platform",
    subtitle: "Shop Products and Manage Orders Effortlessly",
    description:
      "Offer a seamless shopping experience with category-wise product listings, cart management, COD or online payments, and real-time order tracking — perfectly integrated with service bookings.",
    button1Text: "Start Shopping",
    button2Text: "View Features",
  },
];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="min-h-screen">
      {/* Add Google Fonts and Remix Icons */}
      <link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
      <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
      
      {/* Navigation */}
      <nav
  className="
    z-50 w-full
    bg-transparent 
    shadow-none border-none 
    absolute top-0
  "
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-24">
      
      {/* Logo */}
      <div className="flex items-center">
        <img
          className="h-20 w-auto"   
          src={logo}
          alt="Logo"
        />
      </div>

      {/* Desktop Button */}
      <div className="hidden md:flex items-center">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center border-2 border-white text-white hover:bg-[#ef7e1b] hover:text-white px-4 py-2 text-base"
        >
          Sign In
        </button>
      </div>

      {/* Mobile Button */}
      <div className="md:hidden flex items-center">
        <button
          type="button"
          onClick={() => navigate("/login")}
          className="font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center border-2 border-[#ef7e1b] text-[#ef7e1b] hover:bg-[#ef7e1b] hover:text-white px-4 py-2 text-base"
        >
          Sign In
        </button>
      </div>

    </div>
  </div>
</nav>


      <main>
        {/* Hero Section with Slider */}
   <section className="relative h-[600px] overflow-hidden">
  <div className="relative h-full">
    {slides.map((slide, index) => (
      <div
        key={index}
        className={`absolute inset-0 transition-opacity duration-1000 ${
          index === currentSlide ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url(${slide.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 h-full flex items-center mt-20 ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-3xl">
              <h1 className="text-5xl lg:text-6xl font-bold text-white  mb-6 leading-tight">
                {slide.title}
              </h1>
              <h2 className="text-2xl lg:text-3xl text-white/90 mb-6 font-medium">
                {slide.subtitle}
              </h2>
              <p className="text-xl text-white/80 mb-8 leading-relaxed max-w-2xl">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>

  {/* Slider Controls */}
  <button
    onClick={prevSlide}
    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
  >
    <i className="ri-arrow-left-line text-white text-xl"></i>
  </button>

  <button
    onClick={nextSlide}
    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm"
  >
    <i className="ri-arrow-right-line text-white text-xl"></i>
  </button>

  {/* Slider Indicators */}
  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex space-x-3">
    {slides.map((_, index) => (
      <button
        key={index}
        onClick={() => goToSlide(index)}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          index === currentSlide
            ? 'bg-white scale-125'
            : 'bg-white/50 hover:bg-white/75'
        }`}
      ></button>
    ))}
  </div>

  {/* Slide Counter */}
  <div className="absolute bottom-6 right-6 z-20 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
    <span className="text-white font-medium">
      {currentSlide + 1} / {slides.length}
    </span>
  </div>
</section>


{/*  */}
  <section className="py-20 bg-gradient-to-br from-blue-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-6">
            <span className="text-[#ef7e1b] font-semibold text-sm">
              Platform Features
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#003a72] mb-6">
            Everything You Need in{" "}
            <span className="text-[#ef7e1b]">One Platform</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover powerful features that make shopping and service booking
            seamless for your customers.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ef7e1b] to-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-shopping-cart-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              Smart E-Commerce
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Advanced product catalog with smart search, filters, wishlist, and
              secure checkout process.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003a72] to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-calendar-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              Service Booking
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Real-time availability, instant booking confirmations, and
              flexible scheduling options.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ef7e1b] to-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-shield-check-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              Verified Professionals
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Background-checked service providers with ratings, reviews, and
              quality guarantees.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003a72] to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-smartphone-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              Mobile Optimized
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Responsive design that works perfectly on all devices with native
              app experience.
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#ef7e1b] to-orange-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-secure-payment-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              Secure Payments
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Multiple payment options including COD, online payments, and
              digital wallets.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="w-16 h-16 bg-gradient-to-br from-[#003a72] to-blue-600 rounded-2xl flex items-center justify-center mb-6">
              <i className="ri-customer-service-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-[#003a72] mb-4">
              24/7 Support
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Round-the-clock customer support with live chat, phone, and email
              assistance.
            </p>
          </div>
        </div>
      </div>
    </section>





{/*  */}
  <section id="products" className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-6">
            <span className="text-[#ef7e1b] font-semibold text-sm">
              Our Products
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#003a72] mb-6">
            Premium <span className="text-[#ef7e1b]">Electrical Products</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our wide range of high-quality electrical products for your
            home and business needs.
          </p>
        </div>

        {/* Product Grid */}
        <div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
          data-product-shop="true"
        >
          {/* Product 1 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="relative">
              <img
                alt="LED Bulbs"
                className="w-full h-48 object-cover"
                src="https://readdy.ai/api/search-image?query=Premium%20LED%20light%20bulbs%20collection%20with%20warm%20white%20and%20cool%20white%20options%2C%20energy%20efficient%20lighting%20solutions%2C%20modern%20bulb%20designs%20with%20sleek%20packaging%2C%20electrical%20store%20product%20display%2C%20clean%20white%20background%20with%20soft%20lighting%20effects&width=300&height=250&seq=4&orientation=landscape"
              />
              <div className="absolute top-4 right-4 bg-[#ef7e1b] text-white px-2 py-1 rounded-full text-xs font-semibold">
                Best Seller
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#003a72] mb-2">LED Bulbs</h3>
              <p className="text-gray-600  text-sm">
                Energy-efficient LED bulbs with long lifespan and excellent
                brightness.
              </p>
            </div>
          </div>

          {/* Product 2 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="relative">
              <img
                alt="Switches & Outlets"
                className="w-full h-48 object-cover"
                src="https://readdy.ai/api/search-image?query=Modern%20electrical%20switches%20and%20outlets%20collection%2C%20premium%20white%20and%20metallic%20finish%20switches%2C%20wall%20mounted%20electrical%20accessories%2C%20contemporary%20switch%20plate%20designs%2C%20home%20electrical%20fittings%20display%20with%20clean%20background&width=300&height=250&seq=5&orientation=landscape"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#003a72] mb-2">
                Switches & Outlets
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Premium quality switches and outlets for modern homes and
                offices.
              </p>
           
            </div>
          </div>

          {/* Product 3 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="relative">
              <img
                alt="Electrical Wires"
                className="w-full h-48 object-cover"
                src="https://readdy.ai/api/search-image?query=Copper%20electrical%20wires%20and%20cables%20collection%2C%20different%20gauge%20wires%20neatly%20arranged%2C%20insulated%20copper%20wiring%20for%20residential%20and%20commercial%20use%2C%20electrical%20cable%20display%20with%20various%20colors%20and%20sizes%2C%20professional%20electrical%20supplies&width=300&height=250&seq=6&orientation=landscape"
              />
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#003a72] mb-2">
                Electrical Wires
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                High-grade copper wires for safe and reliable electrical
                installations.
              </p>
            
            </div>
          </div>

          {/* Product 4 */}
          <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
            <div className="relative">
              <img
                alt="Electrical Tools"
                className="w-full h-48 object-cover"
                src="https://readdy.ai/api/search-image?query=Professional%20electrical%20tools%20and%20equipment%20set%2C%20multimeter%2C%20wire%20strippers%2C%20electrical%20tester%2C%20screwdrivers%2C%20professional%20electrician%20toolkit%20display%2C%20high%20quality%20electrical%20instruments%20with%20clean%20background&width=300&height=250&seq=7&orientation=landscape"
              />
              <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                New
              </div>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold text-[#003a72] mb-2">
                Electrical Tools
              </h3>
              <p className="text-gray-600 mb-4 text-sm">
                Professional-grade tools for electrical work and maintenance.
              </p>
           
            </div>
          </div>
        </div>
      </div>
    </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gradient-to-br from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-16">
  <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-6">
    <span className="text-[#ef7e1b] font-semibold text-sm">About Our Platform</span>
  </div>
  <h2 className="text-4xl lg:text-5xl font-bold text-[#003a72] mb-6">
    We Simplify <span className="text-[#ef7e1b]">Shopping & Services</span>
  </h2>
  <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
    Our goal is to build a one-stop digital platform where users can shop for products and book trusted professionals — all in one place. From e-commerce to on-demand services like electricians, plumbers, and more, we bring convenience, trust, and technology together for a seamless experience.
  </p>
</div>

<div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
  <div className="space-y-8">
    <div className="space-y-6">
      <h3 className="text-3xl font-bold text-[#003a72] leading-tight">
        Why Choose Polfa for Your Smart Lifestyle?
      </h3>
      <p className="text-lg text-gray-600 leading-relaxed">
        Polfa makes your everyday life smarter by offering a seamless blend of home essentials and professional services.
        Whether you need quality electrical products like bulbs, switches, and wires, or you want to book a certified
        electrician — Polfa brings everything together in one smart app.
      </p>
    </div>

    <div className="grid gap-6">
      <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="w-12 h-12 bg-[#ef7e1b] rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ri-lightbulb-flash-line text-white text-xl"></i>
        </div>
        <div>
          <h4 className="font-semibold text-[#003a72] mb-2 text-lg">Quality Electrical Essentials</h4>
          <p className="text-gray-600">
            Get access to high-quality bulbs, switches, wires, and fittings — all verified for safety and long-lasting performance.
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="w-12 h-12 bg-[#ef7e1b] rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ri-tools-line text-white text-xl"></i>
        </div>
        <div>
          <h4 className="font-semibold text-[#003a72] mb-2 text-lg">Verified Electricians On-Demand</h4>
          <p className="text-gray-600">
            Need an expert? Book certified electricians directly through Polfa for quick, trusted, and professional service.
          </p>
        </div>
      </div>

      <div className="flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
        <div className="w-12 h-12 bg-[#ef7e1b] rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ri-flashlight-line text-white text-xl"></i>
        </div>
        <div>
          <h4 className="font-semibold text-[#003a72] mb-2 text-lg">Safe, Reliable & Smart Solutions</h4>
          <p className="text-gray-600">
            Every product and service on Polfa is designed to ensure safety, reliability, and modern convenience — helping you
            build a smarter home effortlessly.
          </p>
        </div>
      </div>
    </div>
  </div>

{/* /cart 1 */}
  <div className="relative">
    <div className="relative z-10">
      <img
        alt="Polfa Electrical Essentials"
        className="rounded-2xl shadow-2xl object-cover w-full h-[500px]"
        src={cart1}
      />
    </div>

    {/* Brought this div above image using higher z-index */}
    <div className="absolute bottom-8 left-8 bg-white rounded-2xl shadow-xl p-6 border border-gray-100 z-20">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-[#ef7e1b] rounded-xl flex items-center justify-center">
          <i className="ri-trophy-line text-white text-xl"></i>
        </div>
        <div>
          <div className="text-2xl font-bold text-[#003a72]">98%</div>
          <div className="text-gray-600 text-sm">Customer Satisfaction</div>
        </div>
      </div>
    </div>

    <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#ef7e1b]/10 rounded-full"></div>
    <div className="absolute top-1/2 -right-8 w-16 h-16 bg-[#14B8A6]/10 rounded-full"></div>
  </div>
</div>

{/* /cart 2 */}
<section className="py-20 bg-white">
  <div className="container mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-12">
    {/* Left Side – Image */}
    <div className="lg:w-1/2 w-full">
      <img 
        src={cart2}
        alt="Electrician fixing light" 
        className="rounded-3xl shadow-lg w-full object-cover"
      />
    </div>

    {/* Right Side – Content */}
    <div className="lg:w-1/2 w-full">
      <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-4">
        <span className="text-[#ef7e1b] font-semibold text-sm">Professional Electrical Solutions</span>
      </div>
      <h2 className="text-4xl font-bold text-[#003a72] mb-4">
        Brighten Your Home <span className="text-[#ef7e1b]">with Trusted Experts</span>
      </h2>
      <p className="text-lg text-gray-600 leading-relaxed mb-6">
        From fixing lights to setting up complete electrical installations, Polfa connects you with 
        certified electricians who ensure safety, reliability, and precision. Whether it’s a small 
        repair or a major setup, our professionals deliver expert service using high-quality tools and equipment.
      </p>
      <div className="flex flex-wrap gap-4">
        <button className="bg-[#ef7e1b] text-white px-6 py-3 rounded-full font-medium hover:bg-[#d86f18] transition">
          Book an Electrician
        </button>
        <button className="border-2 border-[#ef7e1b] text-[#ef7e1b] px-6 py-3 rounded-full font-medium hover:bg-[#ef7e1b] hover:text-white transition">
          Learn More
        </button>
      </div>
    </div>
  </div>
</section>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#ef7e1b] mb-2">500+</div>
                <div className="text-gray-600 font-medium">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#ef7e1b] mb-2">1000+</div>
                <div className="text-gray-600 font-medium">Projects Completed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#ef7e1b] mb-2">5+</div>
                <div className="text-gray-600 font-medium">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#ef7e1b] mb-2">24/7</div>
                <div className="text-gray-600 font-medium">Support Available</div>
              </div>
            </div>
            
            <div className="mt-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold text-[#003a72] mb-4">Our Work Process</h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">We follow a proven methodology to ensure your project's success from start to finish.</p>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#ef7e1b] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="ri-lightbulb-line text-white text-2xl"></i>
                  </div>
                  <h4 className="font-semibold text-[#003a72] mb-2">1. Planning</h4>
                  <p className="text-gray-600 text-sm">We analyze your requirements and create a detailed project plan.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#ef7e1b] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="ri-palette-line text-white text-2xl"></i>
                  </div>
                  <h4 className="font-semibold text-[#003a72] mb-2">2. Design</h4>
                  <p className="text-gray-600 text-sm">Our designers create beautiful and user-friendly interfaces.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#ef7e1b] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="ri-code-line text-white text-2xl"></i>
                  </div>
                  <h4 className="font-semibold text-[#003a72] mb-2">3. Development</h4>
                  <p className="text-gray-600 text-sm">We build your project using the latest technologies and best practices.</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-[#ef7e1b] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i className="ri-rocket-line text-white text-2xl"></i>
                  </div>
                  <h4 className="font-semibold text-[#003a72] mb-2">4. Launch</h4>
                  <p className="text-gray-600 text-sm">We deploy your project and provide ongoing support and maintenance.</p>
                </div>
              </div>
            </div>
          </div>


          {/*  */}
        </section>

        {/* Services Section */}
     <section
      id="services"
      className="py-20 bg-gradient-to-br from-[#003a72] to-blue-800"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
            <span className="text-white font-semibold text-sm">Our Services</span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Professional{" "}
            <span className="text-[#ef7e1b]">Electrical Services</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
            Book certified electricians for all your electrical needs. From
            repairs to installations, we've got you covered.
          </p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="w-16 h-16 bg-[#ef7e1b] rounded-2xl flex items-center justify-center mb-6">
                <i className={`${service.icon} text-white text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-[#003a72] mb-4">
                {service.title}
              </h3>
              <p className="text-gray-600 mb-4">{service.description}</p>
         
            </div>
          ))}
        </div>
      </div>
    </section>




{/* reviews */}
<section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-6">
            <span className="text-[#ef7e1b] font-semibold text-sm">
              Customer Reviews
            </span>
          </div>
          <h2 className="text-4xl lg:text-5xl font-bold text-[#003a72] mb-6">
            What Our <span className="text-[#ef7e1b]">Customers Say</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Don't just take our word for it — hear from our satisfied customers
            who've experienced our excellent service.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
            >
              {/* Stars */}
              <div className="flex items-center mb-4">
                <div className="flex text-[#ef7e1b] text-lg">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <i key={i} className="ri-star-fill"></i>
                    ))}
                </div>
              </div>

              {/* Review Text */}
              <p className="text-gray-600 mb-6 leading-relaxed">
                {review.review}
              </p>

              {/* Customer Info */}
              <div className="flex items-center">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-12 h-12 rounded-full object-cover mr-4"
                />
                <div>
                  <h4 className="font-semibold text-[#003a72]">
                    {review.name}
                  </h4>
                  <p className="text-gray-500 text-sm">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>





        {/* Contact Section */}
        {/* <section id="contact" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center px-4 py-2 bg-[#ef7e1b]/10 rounded-full mb-6">
                <span className="text-[#ef7e1b] font-semibold text-sm">Get In Touch</span>
              </div>
              <h2 className="text-4xl lg:text-5xl font-bold text-[#003a72] mb-6">Let's Start Your <span className="text-[#ef7e1b]">Project</span></h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">Ready to transform your business? Contact us today and let's discuss how we can help you achieve your digital goals.</p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16">
              <div className="bg-gray-50 rounded-3xl p-8 lg:p-12">
                <h3 className="text-2xl font-bold text-[#003a72] mb-8">Send us a Message</h3>
                <form className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                      <input id="name" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ef7e1b] focus:border-transparent transition-all text-sm" placeholder="Enter your full name" type="text" name="name" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">Email Address *</label>
                      <input id="email" required className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ef7e1b] focus:border-transparent transition-all text-sm" placeholder="Enter your email" type="email" name="email" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                      <input id="phone" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ef7e1b] focus:border-transparent transition-all text-sm" placeholder="Enter your phone number" type="tel" name="phone" />
                    </div>
                    <div>
                      <label htmlFor="service" className="block text-sm font-semibold text-gray-700 mb-2">Service Needed</label>
                      <div className="relative">
                        <select id="service" name="service" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ef7e1b] focus:border-transparent transition-all text-sm appearance-none pr-8">
                          <option value="">Select a service</option>
                          <option value="web-development">Web Development</option>
                          <option value="mobile-apps">Mobile Apps</option>
                          <option value="digital-marketing">Digital Marketing</option>
                          <option value="cloud-solutions">Cloud Solutions</option>
                          <option value="ui-ux-design">UI/UX Design</option>
                          <option value="cybersecurity">Cybersecurity</option>
                        </select>
                        <i className="ri-arrow-down-s-line absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-2">Project Details *</label>
                    <textarea id="message" name="message" required maxLength="500" rows="5" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#ef7e1b] focus:border-transparent transition-all text-sm resize-none" placeholder="Tell us about your project requirements..."></textarea>
                    <div className="text-right text-xs text-gray-500 mt-1">0/500 characters</div>
                  </div>
                  <button type="submit" className="font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap flex items-center justify-center bg-[#ef7e1b] text-white hover:bg-[#0B6A94] px-6 py-3 text-lg w-full py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    Send Message<i className="ri-send-plane-line ml-2"></i>
                  </button>
                </form>
              </div>
              
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-bold text-[#003a72] mb-8">Get in Touch</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4 group">
                      <div className="w-14 h-14 bg-[#ef7e1b]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#ef7e1b] transition-colors duration-300">
                        <i className="ri-phone-line text-2xl text-[#ef7e1b] group-hover:text-white transition-colors"></i>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#003a72] mb-1">Phone</h4>
                        <p className="text-gray-600">+1 (555) 123-4567</p>
                        <p className="text-sm text-gray-500">Mon-Fri 9AM-6PM EST</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 group">
                      <div className="w-14 h-14 bg-[#ef7e1b]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#ef7e1b] transition-colors duration-300">
                        <i className="ri-mail-line text-2xl text-[#ef7e1b] group-hover:text-white transition-colors"></i>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#003a72] mb-1">Email</h4>
                        <p className="text-gray-600">hello@techsolutions.com</p>
                        <p className="text-sm text-gray-500">We'll respond within 24 hours</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4 group">
                      <div className="w-14 h-14 bg-[#ef7e1b]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#ef7e1b] transition-colors duration-300">
                        <i className="ri-map-pin-line text-2xl text-[#ef7e1b] group-hover:text-white transition-colors"></i>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-[#003a72] mb-1">Office</h4>
                        <p className="text-gray-600">123 Business Avenue<br />New York, NY 10001</p>
                        <p className="text-sm text-gray-500">Visit us for a consultation</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-[#ef7e1b] to-[#14B8A6] rounded-2xl p-8 text-white">
                  <h4 className="text-xl font-bold mb-4">Need Quick Help?</h4>
                  <p className="mb-6 opacity-90">Chat with our AI assistant for instant answers to your questions or to schedule a consultation.</p>
                  <button className="bg-white text-[#ef7e1b] px-6 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors transform hover:scale-105 duration-300 cursor-pointer whitespace-nowrap">Start Chat Now<i className="ri-chat-3-line ml-2"></i></button>
                </div>
                
                <div className="rounded-2xl overflow-hidden shadow-lg">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.9663095343008!2d-74.00425878459418!3d40.74844097932681!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259bf5c1654f3%3A0xc80f9cfce5383d5d!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1635959542207!5m2!1sen!2s" 
                    width="100%" 
                    height="250" 
                    allowFullScreen="" 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade" 
                    title="Office Location" 
                    style={{border: '0px'}}
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section> */}
      </main>

      {/* Footer */}
   <footer className="bg-gray-950 text-gray-300 py-6 border-t border-gray-800">
  <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-center md:text-left gap-4">

    {/* Logo */}
    <div className="flex items-center space-x-3">
      <img
        src={logo}
        alt="JG Powers"
        className="h-10 w-auto"
      />
        <p className="text-sm text-gray-400">
        Helpline:{" "}
        <span className="text-[#ef7e1b] font-medium">
          +91 76579 50091
        </span>
      </p>
    </div>

    {/* Helpline Number */}
    <div>
    
    </div>

    {/* Copyright */}
    <div className="text-sm text-gray-500">
      © 2025 JG POWERS. All rights reserved.
    </div>

  </div>
</footer>

    </div>
  )
}

export default Website