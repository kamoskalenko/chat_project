import { Outlet } from "react-router-dom";
import { AppBar } from "./AppBar/AppBar";
import { Suspense } from "react";

const Layout = () => {
  return (
    <div>
      <AppBar />
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </div>
  );
};

export default Layout;
