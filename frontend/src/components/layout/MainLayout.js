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

  return (
    <Box sx={{ display: "flex", direction: "rtl", height: "100vh" }}>
      <CssBaseline />

      {/* شريط علوي */}
      <TopBar />

      {/* شريط جانبي للشاشات الكبيرة فقط */}
      {!isMobile && <Sidebar />}

      {/* المحتوى الرئيسي */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: isMobile
            ? "100%"
            : `calc(100% - ${APP_CONFIG.DRAWER_WIDTH}px)`,
          height: "100vh",
          overflow: "auto",
          backgroundColor: "background.default",
          direction: "ltr",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* مساحة للشريط العلوي */}
        <Toolbar
          sx={{
            minHeight: { xs: "56px", sm: "64px" },
            flexShrink: 0,
          }}
        />

        {/* محتوى الصفحة */}
        <Box
          sx={{
            flex: 1,
            overflow: "auto",
            p: { xs: 1, sm: 2, md: 3 },
            "&::-webkit-scrollbar": {
              width: "6px",
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: "transparent",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0, 255, 136, 0.2)",
              borderRadius: 0,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "rgba(0, 255, 136, 0.3)",
            },
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
