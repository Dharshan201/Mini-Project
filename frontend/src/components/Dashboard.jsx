import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    IconButton,
    Avatar,
    Divider,
    Switch,
    useMediaQuery,
    useTheme,
    AppBar,
    Toolbar,
    Button
} from '@mui/material';
import {
    CreditCard,
    Payment,
    History,
    BarChart,
    Person,
    Settings,
    Logout,
    DarkMode,
    LightMode,
    Menu as MenuIcon,
    AdminPanelSettings,
    Speed,
    CardMembership,
    Info
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../App';
import PaymentForm from './PaymentForm';
import TransactionHistory from './TransactionHistory';
import Charts from './Charts';
import Profile from './Profile';
import CreditScoreAnalyzer from './CreditScoreAnalyzer';
import CreditCardApply from './CreditCardApply';
import CardInfo from './CardInfo';

const drawerWidth = 280;

const menuItems = [
    { text: 'Make Payment', icon: <Payment />, path: '' },
    { text: 'Transaction History', icon: <History />, path: 'history' },
    { text: 'Analytics', icon: <BarChart />, path: 'analytics' },
    { text: 'Credit Score', icon: <Speed />, path: 'credit-score' },
    { text: 'Apply for Card', icon: <CardMembership />, path: 'apply-card' },
    { text: 'Card Info', icon: <Info />, path: 'card-info' },
    { text: 'Profile', icon: <Person />, path: 'profile' },
];

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useThemeMode();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleNavigation = (path) => {
        navigate(`/dashboard/${path}`);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentPath = location.pathname.replace('/dashboard/', '').replace('/dashboard', '');

    const drawer = (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                background: 'rgba(26, 26, 46, 0.95)',
                backdropFilter: 'blur(20px)'
            }}
        >
            {/* Logo */}
            <Box sx={{ p: 3 }}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <CreditCard sx={{ fontSize: 36, color: '#667eea' }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                SecurePay
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                                Payment Gateway
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* User Info */}
            <Box sx={{ p: 3 }}>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                            sx={{
                                width: 48,
                                height: 48,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                fontWeight: 700
                            }}
                        >
                            {user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: 600,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {user?.name}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: 'rgba(255,255,255,0.5)',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    display: 'block'
                                }}
                            >
                                {user?.email}
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Navigation */}
            <List sx={{ flex: 1, px: 2, py: 2 }}>
                {menuItems.map((item, index) => {
                    const isActive = currentPath === item.path;
                    return (
                        <motion.div
                            key={item.text}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                        >
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    onClick={() => handleNavigation(item.path)}
                                    sx={{
                                        borderRadius: 2,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                                            : 'transparent',
                                        '&:hover': {
                                            background: 'rgba(255,255,255,0.05)'
                                        },
                                        '&::before': isActive ? {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            width: 4,
                                            height: '60%',
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            borderRadius: 2
                                        } : {}
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: isActive ? '#667eea' : 'rgba(255,255,255,0.5)',
                                            minWidth: 40
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={item.text}
                                        sx={{
                                            '& .MuiTypography-root': {
                                                fontWeight: isActive ? 600 : 400,
                                                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)'
                                            }
                                        }}
                                    />
                                </ListItemButton>
                            </ListItem>
                        </motion.div>
                    );
                })}

            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Footer Actions */}
            <Box sx={{ p: 2 }}>
                {/* Dark Mode Toggle */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.03)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {darkMode ? (
                            <DarkMode sx={{ color: '#667eea' }} />
                        ) : (
                            <LightMode sx={{ color: '#ffc107' }} />
                        )}
                        <Typography variant="body2">
                            {darkMode ? 'Dark Mode' : 'Light Mode'}
                        </Typography>
                    </Box>
                    <Switch
                        checked={darkMode}
                        onChange={toggleDarkMode}
                        size="small"
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#667eea'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#667eea'
                            }
                        }}
                    />
                </Box>

                {/* Logout Button */}
                <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleLogout}
                    startIcon={<Logout />}
                    sx={{
                        mt: 2,
                        py: 1.5,
                        borderRadius: 2,
                        borderColor: 'rgba(244, 67, 54, 0.3)',
                        color: '#f44336',
                        '&:hover': {
                            borderColor: '#f44336',
                            background: 'rgba(244, 67, 54, 0.1)'
                        }
                    }}
                >
                    Logout
                </Button>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Mobile App Bar */}
            {isMobile && (
                <AppBar
                    position="fixed"
                    sx={{
                        background: 'rgba(26, 26, 46, 0.95)',
                        backdropFilter: 'blur(20px)',
                        borderBottom: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <Toolbar>
                        <IconButton
                            color="inherit"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2 }}
                        >
                            <MenuIcon />
                        </IconButton>
                        <CreditCard sx={{ mr: 1, color: '#667eea' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            SecurePay
                        </Typography>
                    </Toolbar>
                </AppBar>
            )}

            {/* Sidebar Drawer */}
            <Box
                component="nav"
                sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
            >
                {/* Mobile Drawer */}
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', md: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: 'transparent',
                            border: 'none'
                        }
                    }}
                >
                    {drawer}
                </Drawer>

                {/* Desktop Drawer */}
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', md: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                            background: 'transparent',
                            border: 'none',
                            borderRight: '1px solid rgba(255,255,255,0.08)'
                        }
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: { xs: 2, md: 4 },
                    width: { md: `calc(100% - ${drawerWidth}px)` },
                    mt: { xs: 8, md: 0 },
                    minHeight: '100vh',
                    overflow: 'auto'
                }}
            >
                <Routes>
                    <Route path="" element={<PaymentForm />} />
                    <Route path="history" element={<TransactionHistory />} />
                    <Route path="analytics" element={<Charts />} />
                    <Route path="credit-score" element={<CreditScoreAnalyzer />} />
                    <Route path="apply-card" element={<CreditCardApply />} />
                    <Route path="card-info" element={<CardInfo />} />
                    <Route path="profile" element={<Profile />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default Dashboard;
