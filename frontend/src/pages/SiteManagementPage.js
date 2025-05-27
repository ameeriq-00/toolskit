import React, { useState } from "react";
import {
  Container,
  Tabs,
  Tab,
  Box,
  Typography,
  Breadcrumbs,
  Link,
} from "@mui/material";
import {
  Upload as UploadIcon,
  Search as SearchIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import SiteUploadComponent from "../components/SiteUploadComponent";
import SiteSearchComponent from "../components/SiteSearchComponent";
import { useNavigate } from "react-router-dom";

const SiteManagementPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="xl">
      {/* Breadcrumbs */}
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            color="inherit"
            onClick={() => navigate("/")}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            الرئيسية
          </Link>
          <Typography
            sx={{ display: "flex", alignItems: "center" }}
            color="text.primary"
          >
            إدارة الأبراج
          </Typography>
        </Breadcrumbs>
      </Box>

      {/* Page Header */}
      <Typography variant="h4" gutterBottom>
        إدارة معلومات الأبراج
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        رفع، إدارة، والبحث في معلومات الأبراج لجميع التقنيات
      </Typography>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<UploadIcon />} label="رفع الملفات" iconPosition="start" />
          <Tab
            icon={<SearchIcon />}
            label="البحث والاستعلام"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 0 && <SiteUploadComponent />}
        {activeTab === 1 && <SiteSearchComponent />}
      </Box>
    </Container>
  );
};

export default SiteManagementPage;
