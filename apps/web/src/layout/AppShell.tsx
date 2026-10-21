import {
  AssignmentOutlined,
  DashboardOutlined,
  GroupsOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  Logout,
  Menu as MenuIcon,
  ReceiptLongOutlined,
} from "@mui/icons-material";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { LABELS } from "@robustify/shared";
import { type ReactNode, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { useUser } from "../auth/AuthProvider";
import { displayName } from "../lib/format";

const DRAWER_WIDTH = 248;

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
  { to: "/orders", label: "Orders", icon: <ReceiptLongOutlined /> },
  { to: "/purchases", label: "Purchases", icon: <LocalShippingOutlined /> },
  { to: "/inventory", label: "Stock", icon: <Inventory2Outlined /> },
  { to: "/team", label: "Team", icon: <GroupsOutlined /> },
];

const EMPLOYEE_NAV: NavItem[] = [
  { to: "/my-work", label: "My work", icon: <AssignmentOutlined /> },
  { to: "/inventory", label: "Stock", icon: <Inventory2Outlined /> },
];

export function AppShell({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const user = useUser();
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const nav = user.role === "ADMIN" ? ADMIN_NAV : EMPLOYEE_NAV;

  const signOut = async () => {
    await onSignOut();
    navigate("/login", { replace: true });
  };

  const drawer = (
    <Stack sx={{ height: "100%" }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 2 }}>
        <Box component="img" src="/logo.png" alt="" sx={{ width: 32, height: 32 }} />
        <Typography variant="h6" fontWeight={700}>
          Robustify
        </Typography>
      </Stack>
      <Divider />
      <List component="nav" aria-label="Main" sx={{ px: 1, py: 1.5, flex: 1 }}>
        {nav.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            onClick={() => setOpen(false)}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              "&.active": { bgcolor: "action.selected", fontWeight: 600 },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ p: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36, fontSize: 15 }}>
          {displayName(user.username)
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {displayName(user.username)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap component="p">
            {user.role === "ADMIN" ? "Admin" : LABELS.department[user.department]}
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton onClick={signOut} aria-label="Sign out" size="small">
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </Stack>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {!desktop && (
        <AppBar
          position="fixed"
          color="inherit"
          elevation={0}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Toolbar>
            <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ ml: 1 }}>
              Robustify
            </Typography>
          </Toolbar>
        </AppBar>
      )}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant={desktop ? "permanent" : "temporary"}
          open={desktop || open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ "& .MuiDrawer-paper": { width: DRAWER_WIDTH, boxSizing: "border-box" } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, lg: 4 },
          py: { xs: 3, md: 4 },
          mt: { xs: 7, md: 0 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
