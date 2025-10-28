// src/auth/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api, { setAuthToken } from "../api";

import { useNavigate } from "react-router-dom";

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [rolePermissions, setRolePermissions] = useState(() => {
    // Try to load from localStorage for persistence
    const stored = localStorage.getItem("rolePermissions");
    return stored ? JSON.parse(stored) : [];
  });

  // Sync axios header & fetch profile if token exists
  useEffect(() => {
    const initialize = async () => {
      if (token) {
        // 1. Set axios header
        setAuthToken(token);

        // 2. Try to load user from localStorage if stored
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
          } catch {
            setUser(null);
          }
        }

        // 3. Load permissions from localStorage if available
        const storedPerms = localStorage.getItem("rolePermissions");
        if (storedPerms) {
          setRolePermissions(JSON.parse(storedPerms));
        } else {
          setRolePermissions([]);
        }

        // 4. Optionally, verify token by calling a "get profile" endpoint if available.
        // If your API has something like GET /user or GET /profile:
        // try {
        //   const profileRes = await api.get('/user'); // adjust endpoint
        //   setUser(profileRes.data);
        //   localStorage.setItem('user', JSON.stringify(profileRes.data));
        // } catch (error) {
        //   // Token invalid or expired
        //   console.error('Token invalid, logging out', error);
        //   logout();
        // }
      } else {
        setAuthToken(null);
        setUser(null);
        setRolePermissions([]);
        localStorage.removeItem("rolePermissions");
      }
      setLoading(false);
    };
    initialize();
  }, [token]);

  // --- Periodically refresh permissions every 10 seconds ---
  useEffect(() => {
    let intervalId;
    const fetchPermissions = async () => {
      if (user && user.role) {
        // Skip fetching for admin role
        if (user.role === "admin") {
          setRolePermissions("ALL"); // or set to [] if you prefer
          localStorage.setItem("rolePermissions", JSON.stringify("ALL"));
          console.log(
            "[AuthContext] Admin role detected, all permissions enabled."
          );
          return;
        }
        try {
          // 1. Get all roles
          const rolesRes = await api.get("/roles");
          console.log("[AuthContext] Roles response:", rolesRes.data);
          if (rolesRes.data && rolesRes.data.success) {
            const roles = rolesRes.data.data;
            console.log("[AuthContext] Roles fetched:", roles);
            // 2. Find role id by name
            const userRoleName = user.role;
            console.log(
              "[AuthContext] User role from user object:",
              userRoleName
            );
            const matchedRole = roles.find((r) => r.name === userRoleName);
            console.log("[AuthContext] Matched role:", matchedRole);
            if (matchedRole) {
              // 3. Fetch permissions for this role id
              const permsRes = await api.get(
                `/role/${matchedRole.id}/module-permissions`
              );
              if (permsRes.data && permsRes.data.success) {
                setRolePermissions(permsRes.data.data);
                // Add extra permissions for 'user' role
                if (user && user.role === "user") {
                  let perms = permsRes.data.data;
                  if (Array.isArray(perms)) {
                    perms = [...perms, "noBulkAssign", "noCsv"];
                  }
                  setRolePermissions(perms);
                  localStorage.setItem(
                    "rolePermissions",
                    JSON.stringify(perms)
                  );
                } else {
                  setRolePermissions(permsRes.data.data);
                  localStorage.setItem(
                    "rolePermissions",
                    JSON.stringify(permsRes.data.data)
                  );
                }
              } else {
                setRolePermissions([]);
                localStorage.removeItem("rolePermissions");
                console.log(
                  "[AuthContext] Permissions cleared (no data returned)"
                );
              }
            } else {
              setRolePermissions([]);
              localStorage.removeItem("rolePermissions");
              console.log("[AuthContext] Permissions cleared (role not found)");
            }
          } else {
            setRolePermissions([]);
            localStorage.removeItem("rolePermissions");
            console.log(
              "[AuthContext] Permissions cleared (roles fetch failed)"
            );
          }
        } catch (err) {
          // Optionally handle error (e.g., network issue)
          console.log("[AuthContext] Permissions fetch error:", err);
        }
      }
    };
    if (user && user.role && user.role !== "admin") {
      intervalId = setInterval(fetchPermissions, 10000); // 10 seconds for testing
    } else if (user && user.role === "admin") {
      setRolePermissions("ALL");
      localStorage.setItem("rolePermissions", JSON.stringify("ALL"));
      console.log(
        "[AuthContext] Admin role detected, all permissions enabled."
      );
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user && user.role]);

  const login = async (email, password) => {
    try {
      // 1. Call the login endpoint
      const response = await api.post("/login", { email, password });
      // The API returns JSON like:
      // {
      //   success: true,
      //   message: "Login successful",
      //   user: { id, username, email, role },
      //   access_token: "...",
      //   token_type: "Bearer"
      // }
      const data = response.data;
      if (data.success && data.access_token) {
        // 2. Extract token and user
        const tokenValue = data.access_token;
        const userInfo = data.user;

        // 3. Persist token (and optionally user info)
        localStorage.setItem("token", tokenValue);
        // Optionally store user info as JSON if you want persistence across reloads:
        localStorage.setItem("user", JSON.stringify(userInfo));

        // 4. Update state
        setToken(tokenValue);
        setUser(userInfo);

        // 5. Set axios default header for future requests
        setAuthToken(tokenValue);

        // --- Set role permissions ---
        if (userInfo.role === "admin") {
          // Admin gets all permissions immediately
          setRolePermissions("ALL");
          localStorage.setItem("rolePermissions", JSON.stringify("ALL"));
          console.log(
            "[AuthContext] Admin role detected during login, all permissions enabled."
          );
        } else {
          // For non-admin users, fetch permissions from API
          try {
            // 1. Get all roles
            const rolesRes = await api.get("/roles");
            console.log("[AuthContext] Roles response:", rolesRes.data);
            if (rolesRes.data && rolesRes.data.success) {
              const roles = rolesRes.data.data;
              console.log("[AuthContext] Roles fetched:", roles);
              // 2. Find role id by name
              const userRoleName = userInfo.role;
              const matchedRole = roles.find((r) => r.name === userRoleName);
              if (matchedRole) {
                // 3. Fetch permissions for this role id
                const permsRes = await api.get(
                  `/role/${matchedRole.id}/module-permissions`
                );
                if (permsRes.data && permsRes.data.success) {
                  // Add extra permissions for 'user' role
                  if (userInfo.role === "user") {
                    let perms = permsRes.data.data;
                    if (Array.isArray(perms)) {
                      perms = [...perms, "nobulkassign", "nocsv"];
                    }
                    setRolePermissions(perms);
                    localStorage.setItem(
                      "rolePermissions",
                      JSON.stringify(perms)
                    );
                  } else {
                    setRolePermissions(permsRes.data.data);
                    localStorage.setItem(
                      "rolePermissions",
                      JSON.stringify(permsRes.data.data)
                    );
                  }
                } else {
                  setRolePermissions([]);
                  localStorage.removeItem("rolePermissions");
                }
              } else {
                setRolePermissions([]);
                localStorage.removeItem("rolePermissions");
              }
            } else {
              setRolePermissions([]);
              localStorage.removeItem("rolePermissions");
            }
          } catch (err) {
            console.log(
              "[AuthContext] Permissions fetch error during login:",
              err
            );
            setRolePermissions([]);
            localStorage.removeItem("rolePermissions");
          }
        }
        // --- End set role permissions ---

  // 6. Navigate to dashboard (or other post-login route)
  navigate("/dashboard", { replace: true });
        return;
      }
      // If API indicates failure:
      throw new Error(data.message || "Login failed");
    } catch (err) {
      // If axios error or API returned non-2xx, extract message if available
      if (err.response && err.response.data && err.response.data.message) {
        throw new Error(err.response.data.message);
      }
      throw new Error(err.message || "Login error");
    }
  };

  const logout = () => {
    // 1. Remove from storage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rolePermissions");
    // 2. Clear axios header
    setAuthToken(null);
    // 3. Clear state
    setToken(null);
    setUser(null);
    setRolePermissions([]);
    // 4. Redirect
    navigate("/login", { replace: true });
  };

  const updateUser = (newUserData) => {
    console.log("updating user from context", newUserData);
    setUser((currentUser) => {
      const updatedUser = { ...currentUser, ...newUserData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, updateUser, rolePermissions }}
    >
      {children}
    </AuthContext.Provider>
  );
}
