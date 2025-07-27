import React from "react";
import { Box, CssBaseline, Toolbar } from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { APP_CONFIG } from "../../utils/constants";

const MainLayout = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return null; // This will be handled by the route protection
  }

  return (
    <Box sx={{ display: "flex", direction: "rtl" }}>
      <CssBaseline />

      {/* Top Bar */}
      <TopBar />

      {/* Sidebar */}
      <Sidebar open={true} />

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${APP_CONFIG.DRAWER_WIDTH}px)`,
          minHeight: "100vh",
          backgroundColor: "background.default",
          direction: "ltr", // Content direction
        }}
      >
        {/* Toolbar spacer */}
        <Toolbar />

        {/* Page Content */}
        <Box sx={{ mt: 2 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
