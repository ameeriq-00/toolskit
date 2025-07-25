// frontend/src/components/SimpleNetworkGraph.js
import React, { useState } from "react";
import {
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  AccountCircle as PersonIcon,
  Phone as PhoneIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

const SimpleNetworkGraph = ({ data }) => {
  const [filterMode, setFilterMode] = useState("all");

  if (!data || !data.nodes) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography>لا توجد بيانات شبكة متاحة</Typography>
      </Paper>
    );
  }

  // Filter data
  const owners = data.nodes.filter((n) => n.type === "owner");
  let contacts = data.nodes.filter((n) => n.type === "contact");

  if (filterMode === "common") {
    contacts = contacts.filter((n) => n.appearances > 1);
  }

  // Group contacts by appearance count
  const contactsByAppearance = {};
  contacts.forEach((contact) => {
    const count = contact.appearances || 1;
    if (!contactsByAppearance[count]) {
      contactsByAppearance[count] = [];
    }
    contactsByAppearance[count].push(contact);
  });

  // Get connections for each owner
  const getOwnerConnections = (ownerId) => {
    return data.links
      .filter((link) => link.source === ownerId)
      .map((link) => link.target);
  };

  const renderOwnerCard = (owner) => {
    const connections = getOwnerConnections(owner.id);
    const sharedConnections = connections.filter((contactId) =>
      contacts.find((c) => c.id === contactId && c.appearances > 1)
    );

    return (
      <Card key={owner.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <PersonIcon sx={{ mr: 1, color: "primary.main", fontSize: 32 }} />
            <Box>
              <Typography variant="h6">{owner.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {owner.id}
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1,
                  bgcolor: "primary.light",
                  borderRadius: 1,
                }}
              >
                <Typography variant="h5" color="white">
                  {connections.length}
                </Typography>
                <Typography variant="caption" color="white">
                  إجمالي الاتصالات
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box
                sx={{
                  textAlign: "center",
                  p: 1,
                  bgcolor: "success.light",
                  borderRadius: 1,
                }}
              >
                <Typography variant="h5" color="white">
                  {sharedConnections.length}
                </Typography>
                <Typography variant="caption" color="white">
                  اتصالات مشتركة
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  const renderContactsByLevel = () => {
    return Object.entries(contactsByAppearance)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .map(([appearanceCount, contactList]) => (
        <Paper key={appearanceCount} sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <ShareIcon sx={{ mr: 1, color: "secondary.main" }} />
            <Typography variant="h6">
              أرقام مشتركة في {appearanceCount} شيت(ات)
            </Typography>
            <Chip
              label={`${contactList.length} رقم`}
              color="secondary"
              size="small"
              sx={{ ml: 2 }}
            />
          </Box>

          <Grid container spacing={1}>
            {contactList.slice(0, 20).map(
              (
                contact,
                index // عرض أول 20 رقم فقط
              ) => (
                <Grid item xs={12} sm={6} md={4} key={contact.id}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      p: 1,
                      bgcolor:
                        appearanceCount > 2 ? "warning.light" : "info.light",
                      borderRadius: 1,
                      mb: 1,
                    }}
                  >
                    <PhoneIcon sx={{ mr: 1, fontSize: 16 }} />
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: "monospace" }}
                    >
                      {contact.id}
                    </Typography>
                  </Box>
                </Grid>
              )
            )}
            {contactList.length > 20 && (
              <Grid item xs={12}>
                <Typography variant="caption" color="textSecondary">
                  ... و {contactList.length - 20} رقم آخر
                </Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      ));
  };

  const renderConnectionMatrix = () => {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          مصفوفة الاتصالات
        </Typography>

        <Grid container spacing={2}>
          {owners.map((owner, ownerIndex) => (
            <Grid item xs={12} key={owner.id}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    {owner.name}
                  </Typography>

                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {owners.map((otherOwner, otherIndex) => {
                      if (ownerIndex === otherIndex) return null;

                      const ownerConnections = new Set(
                        getOwnerConnections(owner.id)
                      );
                      const otherConnections = new Set(
                        getOwnerConnections(otherOwner.id)
                      );
                      const commonConnections = [...ownerConnections].filter(
                        (x) => otherConnections.has(x)
                      );
                      const percentage =
                        ownerConnections.size > 0
                          ? Math.round(
                              (commonConnections.length /
                                ownerConnections.size) *
                                100
                            )
                          : 0;

                      return (
                        <Chip
                          key={otherOwner.id}
                          label={`${otherOwner.name}: ${percentage}%`}
                          color={
                            percentage > 50
                              ? "success"
                              : percentage > 25
                              ? "warning"
                              : "default"
                          }
                          variant={percentage > 0 ? "filled" : "outlined"}
                        />
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        تحليل الشبكة المبسط
      </Typography>

      {/* Filter Controls */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>عرض الأرقام</InputLabel>
          <Select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
            label="عرض الأرقام"
          >
            <MenuItem value="all">جميع الأرقام</MenuItem>
            <MenuItem value="common">الأرقام المشتركة فقط</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        {/* Owners Summary */}
        <Grid item xs={12} md={4}>
          <Typography variant="h6" gutterBottom>
            أشخاص الشيتات
          </Typography>
          {owners.map(renderOwnerCard)}
        </Grid>

        {/* Shared Contacts */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            الأرقام المشتركة
          </Typography>
          {renderContactsByLevel()}
        </Grid>

        {/* Connection Matrix */}
        <Grid item xs={12}>
          {renderConnectionMatrix()}
        </Grid>
      </Grid>
    </Box>
  );
};

export default SimpleNetworkGraph;
