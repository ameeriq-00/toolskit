import { createTheme } from "@mui/material/styles";

const responsiveTheme = createTheme({
  direction: "rtl",
  palette: {
    mode: "dark",
    primary: {
      main: "#00ff88",
      dark: "#00cc6a",
      light: "#33ff9d",
      contrastText: "#000000",
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
    success: {
      main: "#4caf50",
      dark: "#388e3c",
      light: "#81c784",
    },
    warning: {
      main: "#ff9800",
      dark: "#f57c00",
      light: "#ffb74d",
    },
    error: {
      main: "#f44336",
      dark: "#d32f2f",
      light: "#e57373",
    },
    info: {
      main: "#2196f3",
      dark: "#1976d2",
      light: "#64b5f6",
    },
  },
  typography: {
    fontFamily: '"Tajawal", "Cairo", "Roboto", sans-serif',
    h1: {
      fontSize: "clamp(1.8rem, 4.5vw, 3rem)",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    h2: {
      fontSize: "clamp(1.6rem, 3.5vw, 2.5rem)",
      fontWeight: 700,
      letterSpacing: "0.01em",
    },
    h3: {
      fontSize: "clamp(1.4rem, 3vw, 2rem)",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    h4: {
      fontSize: "clamp(1.2rem, 2.5vw, 1.75rem)",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    h5: {
      fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    h6: {
      fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
      fontWeight: 600,
      letterSpacing: "0.01em",
    },
    body1: {
      fontSize: "clamp(0.85rem, 1.4vw, 0.95rem)",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "clamp(0.8rem, 1.2vw, 0.85rem)",
      lineHeight: 1.4,
    },
    caption: {
      fontSize: "clamp(0.7rem, 1vw, 0.75rem)",
      lineHeight: 1.3,
    },
    button: {
      fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)",
      fontWeight: 600,
      textTransform: "none",
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  spacing: (factor) => `${0.25 * factor}rem`,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "*": {
          boxSizing: "border-box",
        },
        html: {
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
          height: "100%",
          width: "100%",
        },
        body: {
          height: "100%",
          width: "100%",
          margin: 0,
          padding: 0,
          fontFamily: '"Tajawal", "Cairo", "Roboto", sans-serif',
        },
        "#root": {
          height: "100%",
          width: "100%",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          borderRight: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: 0,
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
          overflowX: "hidden",
          "&::-webkit-scrollbar": {
            width: "3px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 255, 136, 0.2)",
            borderRadius: 0,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "rgba(0, 255, 136, 0.3)",
            boxShadow: "0 6px 16px rgba(0, 255, 136, 0.1)",
            transform: "translateY(-1px)",
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
          padding: "8px 16px",
          transition: "all 0.2s ease",
          "@media (max-width: 600px)": {
            padding: "10px 16px",
            fontSize: "0.85rem",
          },
        },
        contained: {
          backgroundColor: "#00ff88",
          color: "#000",
          boxShadow: "0 3px 10px rgba(0, 255, 136, 0.3)",
          "&:hover": {
            backgroundColor: "#00cc6a",
            boxShadow: "0 5px 15px rgba(0, 255, 136, 0.4)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          borderColor: "#00ff88",
          color: "#00ff88",
          "&:hover": {
            borderColor: "#00cc6a",
            backgroundColor: "rgba(0, 255, 136, 0.08)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.08)",
            transform: "scale(1.05)",
          },
          "@media (max-width: 600px)": {
            padding: "8px",
          },
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          margin: "1px 4px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.05)",
            borderLeft: "3px solid #00ff88",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(0, 255, 136, 0.1)",
            borderLeft: "3px solid #00ff88",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#1a1a1a",
            borderRadius: 8,
            transition: "all 0.2s ease",
            "& fieldset": {
              borderColor: "rgba(255, 255, 255, 0.2)",
              borderWidth: 1,
            },
            "&:hover fieldset": {
              borderColor: "#00ff88",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00ff88",
              borderWidth: 2,
              boxShadow: "0 0 0 3px rgba(0, 255, 136, 0.1)",
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.7)",
            fontSize: "0.9rem",
            "&.Mui-focused": {
              color: "#00ff88",
            },
          },
          "& .MuiInputBase-input": {
            color: "white",
            fontSize: "0.9rem",
            "@media (max-width: 600px)": {
              fontSize: "16px",
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
            fontSize: "0.85rem",
            padding: "12px 16px",
            borderRadius: 0,
            "@media (max-width: 600px)": {
              padding: "8px 12px",
              fontSize: "0.75rem",
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "10px 16px",
          fontSize: "0.85rem",
          "@media (max-width: 600px)": {
            padding: "8px 12px",
            fontSize: "0.8rem",
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          backgroundImage: "none",
          borderRadius: 12,
          border: "1px solid rgba(255, 255, 255, 0.08)",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
        },
        elevation4: {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
        },
        elevation8: {
          boxShadow: "0 8px 32px rgba(0, 255, 136, 0.1)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          borderBottom: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: 0,
          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          fontSize: "0.75rem",
          height: "auto",
          padding: "4px 8px",
          transition: "all 0.2s ease",
          "&:hover": {
            transform: "scale(1.05)",
          },
        },
        colorPrimary: {
          backgroundColor: "#00ff88",
          color: "#000",
        },
        colorSecondary: {
          backgroundColor: "#ff6b00",
          color: "#fff",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid",
          fontSize: "0.85rem",
        },
        standardSuccess: {
          backgroundColor: "rgba(76, 175, 80, 0.08)",
          borderColor: "rgba(76, 175, 80, 0.2)",
          color: "#81c784",
        },
        standardError: {
          backgroundColor: "rgba(244, 67, 54, 0.08)",
          borderColor: "rgba(244, 67, 54, 0.2)",
          color: "#e57373",
        },
        standardWarning: {
          backgroundColor: "rgba(255, 152, 0, 0.08)",
          borderColor: "rgba(255, 152, 0, 0.2)",
          color: "#ffb74d",
        },
        standardInfo: {
          backgroundColor: "rgba(33, 150, 243, 0.08)",
          borderColor: "rgba(33, 150, 243, 0.2)",
          color: "#64b5f6",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
        },
        bar: {
          borderRadius: 4,
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: "#00ff88",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: 12,
          "@media (max-width: 600px)": {
            margin: "16px",
            width: "calc(100% - 32px)",
            maxHeight: "calc(100% - 32px)",
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#333",
          color: "#fff",
          fontSize: "0.75rem",
          borderRadius: 6,
          border: "1px solid rgba(0, 255, 136, 0.2)",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
          "@media (max-width: 600px)": {
            minHeight: 40,
          },
        },
        indicator: {
          backgroundColor: "#00ff88",
          height: 2,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.85rem",
          minHeight: 44,
          color: "rgba(255, 255, 255, 0.7)",
          "&.Mui-selected": {
            color: "#00ff88",
          },
          "@media (max-width: 600px)": {
            fontSize: "0.75rem",
            minHeight: 40,
            padding: "6px 12px",
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            paddingLeft: "12px",
            paddingRight: "12px",
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(0, 255, 136, 0.2)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "white",
          fontSize: "0.85rem",
          padding: "8px 16px",
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.08)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(0, 255, 136, 0.12)",
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            marginBottom: "12px",
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "16px",
          "&:last-child": {
            paddingBottom: "16px",
          },
          "@media (max-width: 600px)": {
            padding: "12px",
            "&:last-child": {
              paddingBottom: "12px",
            },
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: "64px !important",
          "@media (max-width: 600px)": {
            minHeight: "56px !important",
            paddingLeft: "12px",
            paddingRight: "12px",
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.08)",
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase.Mui-checked": {
            color: "#00ff88",
            "& + .MuiSwitch-track": {
              backgroundColor: "#00cc6a",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255, 255, 255, 0.2)",
            borderRadius: 8,
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00ff88",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00ff88",
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          borderRadius: 8,
          "&:before": {
            display: "none",
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.04)",
          },
        },
      },
    },
  },
});

export default responsiveTheme;
