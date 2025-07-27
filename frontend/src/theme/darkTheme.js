import { createTheme } from "@mui/material/styles";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00ff88",
      dark: "#00cc6a",
      light: "#33ff9d",
    },
    secondary: {
      main: "#ff6b00",
      dark: "#cc5500",
      light: "#ff8533",
    },
    background: {
      default: "#0a0a0a",
      paper: "#1a1a1a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "0.02em",
    },
    h6: {
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          borderRight: "2px solid #00ff88",
          boxShadow: "4px 0 20px rgba(0, 255, 136, 0.2)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          border: "1px solid #333",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0, 255, 136, 0.1)",
          transition: "all 0.3s ease",
          "&:hover": {
            borderColor: "#00ff88",
            boxShadow: "0 8px 32px rgba(0, 255, 136, 0.3)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          borderRadius: 8,
        },
        contained: {
          background: "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          boxShadow: "0 4px 16px rgba(0, 255, 136, 0.3)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0, 255, 136, 0.4)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "4px 12px",
          transition: "all 0.3s ease",
          "&:hover": {
            background:
              "linear-gradient(90deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)",
            borderLeft: "4px solid #00ff88",
            transform: "translateX(4px)",
          },
          "&.Mui-selected": {
            background:
              "linear-gradient(90deg, rgba(0, 255, 136, 0.2) 0%, rgba(0, 255, 136, 0.1) 100%)",
            borderLeft: "4px solid #00ff88",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#1a1a1a",
            "& fieldset": {
              borderColor: "#333",
            },
            "&:hover fieldset": {
              borderColor: "#00ff88",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00ff88",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "#00ff88",
            color: "#000",
            fontWeight: 700,
          },
        },
      },
    },
  },
});

export default darkTheme;
