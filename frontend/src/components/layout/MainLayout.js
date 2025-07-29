import React from "react";
import {
  Box,
  CssBaseline,
  Toolbar,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useAuth } from "../../contexts/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { APP_CONFIG } from "../../utils/constants";

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!user) return null;

  const drawerWidth = isMobile ? 0 : APP_CONFIG.DRAWER_WIDTH;

  return (
    <Box sx={{ display: "flex", direction: "rtl" }}>
      <CssBaseline />
      <TopBar />
      {!isMobile && <Sidebar />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 3,
          width: `calc(100% - ${drawerWidth}px)`,
          minHeight: "100vh",
          backgroundColor: "background.default",
          direction: "ltr",
        }}
      >
        <Toolbar />
        <Box sx={{ mt: isMobile ? 1 : 2 }}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;