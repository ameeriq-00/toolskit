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
    fontFamily: '"Cairo", "Inter", "Roboto", sans-serif',
    h1: {
      fontSize: "clamp(2rem, 5vw, 3.5rem)",
      fontWeight: 700,
      letterSpacing: "0.02em",
    },
    h2: {
      fontSize: "clamp(1.75rem, 4vw, 3rem)",
      fontWeight: 700,
      letterSpacing: "0.02em",
    },
    h3: {
      fontSize: "clamp(1.5rem, 3.5vw, 2.5rem)",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    h4: {
      fontSize: "clamp(1.25rem, 3vw, 2rem)",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    h5: {
      fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    h6: {
      fontSize: "clamp(1rem, 2vw, 1.25rem)",
      fontWeight: 600,
      letterSpacing: "0.02em",
    },
    body1: {
      fontSize: "clamp(0.875rem, 1.5vw, 1rem)",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "clamp(0.75rem, 1.25vw, 0.875rem)",
      lineHeight: 1.5,
    },
    caption: {
      fontSize: "clamp(0.65rem, 1vw, 0.75rem)",
      lineHeight: 1.4,
    },
    button: {
      fontSize: "clamp(0.8rem, 1.5vw, 0.95rem)",
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
          fontFamily: '"Cairo", "Inter", "Roboto", sans-serif',
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
          borderRight: "2px solid #00ff88",
          boxShadow: "4px 0 20px rgba(0, 255, 136, 0.2)",
          backgroundImage: "linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)",
          // منع السكرول الأفقي
          overflowX: "hidden",
          // تحسين شريط التمرير
          "&::-webkit-scrollbar": {
            width: "4px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0, 255, 136, 0.3)",
            borderRadius: "2px",
          },
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
          padding: "8px 16px",
          transition: "all 0.3s ease",
          "@media (max-width: 600px)": {
            padding: "10px 16px",
            fontSize: "0.875rem",
          },
        },
        contained: {
          background: "linear-gradient(45deg, #00ff88 0%, #00cc6a 100%)",
          color: "#000",
          boxShadow: "0 4px 16px rgba(0, 255, 136, 0.3)",
          "&:hover": {
            boxShadow: "0 6px 20px rgba(0, 255, 136, 0.4)",
            transform: "translateY(-2px)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        outlined: {
          borderColor: "#00ff88",
          color: "#00ff88",
          "&:hover": {
            borderColor: "#00cc6a",
            backgroundColor: "rgba(0, 255, 136, 0.1)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.3s ease",
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.1)",
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
            borderRadius: 8,
            transition: "all 0.3s ease",
            "& fieldset": {
              borderColor: "#333",
              borderWidth: 1,
            },
            "&:hover fieldset": {
              borderColor: "#00ff88",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00ff88",
              borderWidth: 2,
            },
            "&.Mui-error fieldset": {
              borderColor: "#f44336",
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.7)",
            "&.Mui-focused": {
              color: "#00ff88",
            },
            "&.Mui-error": {
              color: "#f44336",
            },
          },
          "& .MuiInputBase-input": {
            color: "white",
            "@media (max-width: 600px)": {
              fontSize: "16px", // Prevent zoom on iOS
            },
          },
          "& .MuiFormHelperText-root": {
            fontSize: "0.75rem",
            "&.Mui-error": {
              color: "#f44336",
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
            fontSize: "0.875rem",
            padding: "12px 16px",
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
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
          padding: "12px 16px",
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
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        },
        elevation4: {
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.4)",
        },
        elevation8: {
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          borderBottom: "2px solid #00ff88",
          boxShadow: "0 2px 20px rgba(0, 255, 136, 0.3)",
          backgroundImage: "linear-gradient(90deg, #0f0f0f 0%, #1a1a1a 100%)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
          transition: "all 0.3s ease",
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
          "& .MuiAlert-icon": {
            fontSize: "1.2rem",
          },
        },
        standardSuccess: {
          backgroundColor: "rgba(76, 175, 80, 0.1)",
          borderColor: "rgba(76, 175, 80, 0.3)",
          color: "#81c784",
        },
        standardError: {
          backgroundColor: "rgba(244, 67, 54, 0.1)",
          borderColor: "rgba(244, 67, 54, 0.3)",
          color: "#e57373",
        },
        standardWarning: {
          backgroundColor: "rgba(255, 152, 0, 0.1)",
          borderColor: "rgba(255, 152, 0, 0.3)",
          color: "#ffb74d",
        },
        standardInfo: {
          backgroundColor: "rgba(33, 150, 243, 0.1)",
          borderColor: "rgba(33, 150, 243, 0.3)",
          color: "#64b5f6",
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
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
          border: "1px solid rgba(0, 255, 136, 0.3)",
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
          border: "1px solid rgba(0, 255, 136, 0.3)",
        },
        arrow: {
          color: "#333",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
          "@media (max-width: 600px)": {
            minHeight: 40,
          },
        },
        indicator: {
          backgroundColor: "#00ff88",
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.875rem",
          minHeight: 48,
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
            paddingLeft: "16px",
            paddingRight: "16px",
          },
        },
      },
    },
    MuiGrid: {
      styleOverrides: {
        container: {
          "@media (max-width: 600px)": {
            margin: 0,
            width: "100%",
          },
        },
        item: {
          "@media (max-width: 600px)": {
            paddingLeft: "8px",
            paddingTop: "8px",
          },
        },
      },
    },
    // تحسينات إضافية للسايد بار على الهاتف
    MuiBackdrop: {
      styleOverrides: {
        root: {
          "@media (max-width: 900px)": {
            // للهواتف - جعل الخلفية تبدأ من تحت التوب بار
            top: "64px !important",
          },
        },
      },
    },
    // تحسينات للقوائم المنسدلة
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(0, 255, 136, 0.3)",
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "white",
          "&:hover": {
            backgroundColor: "rgba(0, 255, 136, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(0, 255, 136, 0.2)",
          },
        },
      },
    },
    // تحسينات للجداول على الهاتف
    MuiTableContainer: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            "& .MuiTable-root": {
              minWidth: "auto",
            },
          },
        },
      },
    },
    // تحسينات للحقول على الهاتف
    MuiFormControl: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            marginBottom: "16px",
          },
        },
      },
    },
    // تحسينات للـ Chips
    MuiChip: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            fontSize: "0.7rem",
            height: "24px",
          },
        },
      },
    },
    // تحسينات للـ Typography
    MuiTypography: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            "&.MuiTypography-h4": {
              fontSize: "1.5rem",
            },
            "&.MuiTypography-h5": {
              fontSize: "1.25rem",
            },
            "&.MuiTypography-h6": {
              fontSize: "1.1rem",
            },
          },
        },
      },
    },
    // تحسينات للـ CardContent
    MuiCardContent: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            padding: "12px",
            "&:last-child": {
              paddingBottom: "12px",
            },
          },
        },
      },
    },
    // تحسينات للـ Toolbar
    MuiToolbar: {
      styleOverrides: {
        root: {
          "@media (max-width: 600px)": {
            minHeight: "56px",
            paddingLeft: "16px",
            paddingRight: "16px",
          },
        },
      },
    },
    // تحسينات للـ Divider
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    // تحسينات للـ Switch
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
    // تحسينات للـ Select
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#333",
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
    // تحسينات للـ Skeleton
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(255, 255, 255, 0.1)",
        },
      },
    },
    // تحسينات للـ Accordion
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          border: "1px solid rgba(255, 255, 255, 0.1)",
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
            backgroundColor: "rgba(0, 255, 136, 0.05)",
          },
        },
      },
    },
  },
});

export default responsiveTheme;