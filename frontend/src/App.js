import React from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Routes from "./Routes";

const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "Arial, sans-serif",
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          أدوات تحليل Excel والأبراج
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button color="inherit" onClick={() => navigate("/")}>
            الرئيسية
          </Button>
          <Button color="inherit" onClick={() => navigate("/excel-analyzer")}>
            محلل Excel
          </Button>
          <Button color="inherit" onClick={() => navigate("/excel-analyzer-z")}>
            محلل Excel Z
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate("/sheets-comparison")}
          >
            مقارنة الشيتات
          </Button>
          <Button color="inherit" onClick={() => navigate("/site-search")}>
            بحث الأبراج
          </Button>

          {/* روابط الأدمن */}
          {user?.is_staff && (
            <Button
              color="inherit"
              onClick={() => navigate("/site-management")}
            >
              إدارة الأبراج
            </Button>
          )}

          <Button
            color="inherit"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            sx={{ ml: 2 }}
          >
            تسجيل الخروج
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const AppContent = () => {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <NavigationBar />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Routes />
      </Container>
    </Box>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
