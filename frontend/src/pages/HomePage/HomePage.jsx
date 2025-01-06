import React, { useEffect, useState } from "react";
import { Parallax } from "react-parallax";
import { Link } from "react-router-dom";
import axios from "axios";
import s from "./HomePage.module.css";
import backgroundImage from "../../assets/images/bg.png";
import API from "../../API.jsx";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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
          setIsLoggedIn(response.data.isLoggedIn);
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
        setIsLoggedIn(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (loading) {
    return <div className={s.loading}>Loading...</div>;
  }

  return (
    <div
      className={s.parallax}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className={s.overlay}></div>
      <div className={s.container}>
        <h1 className={s.title}>Welcome to Chats App</h1>
        <p className={s.subtitle}>Manage your chats easily and securely</p>
        <Link to={isLoggedIn ? "/chats" : "/register"} className={s.button}>
          {isLoggedIn ? "Get to Chats" : "Get Started"}
        </Link>
      </div>
    </div>
  );
}
