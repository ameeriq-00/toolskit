import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AppRoutes from "./Routes";
import { Container, AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const NavigationBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Excel Analysis Tools
        </Typography>
        <Button color="inherit" onClick={() => navigate("/")}>
          Home
        </Button>
        <Button color="inherit" onClick={() => navigate("/excel-analyzer")}>
          Excel Analyzer
        </Button>
        <Button color="inherit" onClick={() => navigate("/excel-analyzer-z")}>
          Excel Analyzer Z
        </Button>
        <Button color="inherit" onClick={() => navigate("/sheets-comparison")}>
          مقارنة الشيتات
        </Button>

        {/* رابط البحث الجديد - متاح للجميع */}
        <Button color="inherit" onClick={() => navigate("/site-search")}>
          بحث الأبراج
        </Button>

        {/* روابط الأدمن */}
        {user.is_staff && (
          <>
            <Button
              color="inherit"
              onClick={() => navigate("/site-management")}
            >
              إدارة الأبراج
            </Button>
            {/* الرابط القديم - للتوافق العكسي */}
            <Button
              color="inherit"
              onClick={() => navigate("/upload-site-information")}
            >
              Upload Site (Old)
            </Button>
          </>
        )}

        <Button
          color="inherit"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <NavigationBar />
        <Container>
          <AppRoutes />
        </Container>
      </Router>
    </AuthProvider>
  );
}

export default App;
