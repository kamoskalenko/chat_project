import clsx from "clsx";
import { useEffect, useState } from "react";
import axios from "axios";
import s from "./AppBar.module.css";
import { NavLink } from "react-router-dom";
import API from "../../API.jsx";

const buildLinkClass = ({ isActive }) => {
  return clsx(s.link, isActive && s.active);
};

const useAuthStatus = () => {
  const [authData, setAuthData] = useState({ isLoggedIn: false, user: null });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const checkAuthStatus = async () => {
      try {
        if (token) {
          const response = await axios.get(`${API}/auth-status`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          setAuthData({
            isLoggedIn: response.data.isLoggedIn,
            user: response.data.user || null,
          });
        }
      } catch (err) {
        setAuthData({ isLoggedIn: false, user: null });
      }
    };

    checkAuthStatus();
  }, []);

  return { ...authData };
};

const Navigation = () => {
  return (
    <nav className={s.nav}>
      <NavLink to="/" className={buildLinkClass}>
        HomePage
      </NavLink>
    </nav>
  );
};

const AuthNav = () => {
  return (
    <div className={s.navLinks}>
      <NavLink to="/register" className={buildLinkClass}>
        Register
      </NavLink>
      <NavLink to="/login" className={buildLinkClass}>
        Log In
      </NavLink>
    </div>
  );
};

export const AppBar = () => {
  const { isLoggedIn } = useAuthStatus();

  return (
    <header className={s.header}>
      <Navigation isLoggedIn={isLoggedIn} />
      <AuthNav />
    </header>
  );
};
