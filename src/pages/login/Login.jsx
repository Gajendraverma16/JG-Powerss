import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import Swal from "sweetalert2";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      const apiMessage = err.response?.data?.message || err.message;
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: apiMessage,
        confirmButtonColor: "#278AFF",
      });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Login Form */}
      <div className="flex flex-col justify-center w-full md:w-1/2 px-6 sm:px-12 py-12 bg-white">
        <div className="max-w-md mx-auto w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <h1 className="text-3xl font-bold text-[#ee7f1b]">JG POWERS</h1>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Welcome
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-6 sm:mb-8 text-base sm:text-lg leading-relaxed">
            Sign in to start managing your projects.
          </p>

          {/* Form */}
          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-[44px] px-3 rounded-lg bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-[44px] px-3 rounded-lg bg-[#E7EFF8]/60 border border-white/20 focus:ring-2 focus:ring-[#0e4053] outline-none text-[#545454] placeholder-[#545454]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#003a72] hover:bg-[#002f5a] text-white font-semibold rounded-lg transition-colors focus:ring-2 focus:ring-[#002f5a] focus:ring-offset-2 outline-none"
            >
              Sign In
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#959CB6]">© 2025 ALL RIGHTS RESERVED</p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden md:flex w-1/2 bg-gray-100 justify-center items-center p-10">
        <img
          src="/JGPOWER.png"
          alt="JG POWERS Logo"
          className="object-contain h-full rounded-2xl"
        />
      </div>
    </div>
  );
}
