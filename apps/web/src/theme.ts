import { createTheme } from "@mui/material/styles";

// Colours taken from the original Robustify sidebar gradient.
export const theme = createTheme({
  colorSchemes: { light: true, dark: true },
  palette: {
    primary: { main: "#5748C5" },
    secondary: { main: "#6F5697" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", system-ui, sans-serif',
  },
});
