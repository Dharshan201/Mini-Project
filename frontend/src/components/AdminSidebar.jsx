import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    Typography, Avatar, Divider, Switch, Button, useMediaQuery, useTheme,
    AppBar, Toolbar, IconButton
} from '@mui/material';
import {
    Dashboard, People, Receipt, CardMembership, Speed, Logout,
    DarkMode, LightMode, Menu as MenuIcon, AdminPanelSettings
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../App';

const drawerWidth = 280;

const adminMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '' },
    { text: 'Users', icon: <People />, path: 'users' },
    { text: 'Transactions', icon: <Receipt />, path: 'transactions' },
    { text: 'Card Applications', icon: <CardMembership />, path: 'applications' },
    { text: 'Credit Scores', icon: <Speed />, path: 'credit-scores' },
];

const AdminSidebar = ({ currentPath, onNavigate }) => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { darkMode, toggleDarkMode } = useThemeMode();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNav = (path) => {
        onNavigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const drawer = (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(20px)' }}>
            {/* Logo */}
            <Box sx={{ p: 3 }}>
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AdminPanelSettings sx={{ fontSize: 36, color: '#ffc107' }} />
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>SecurePay</Typography>
                            <Typography variant="caption" sx={{ color: '#ffc107', fontWeight: 600 }}>Admin Console</Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Admin Info */}
            <Box sx={{ p: 3 }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ width: 48, height: 48, background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)', fontWeight: 700, color: '#000' }}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {user?.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                {user?.email}
                            </Typography>
                        </Box>
                    </Box>
                </motion.div>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Navigation */}
            <List sx={{ flex: 1, px: 2, py: 2 }}>
                {adminMenuItems.map((item, index) => {
                    const isActive = currentPath === item.path;
                    return (
                        <motion.div key={item.text} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + index * 0.05 }}>
                            <ListItem disablePadding sx={{ mb: 1 }}>
                                <ListItemButton
                                    onClick={() => handleNav(item.path)}
                                    sx={{
                                        borderRadius: 2, position: 'relative', overflow: 'hidden',
                                        background: isActive ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.15) 0%, rgba(255, 152, 0, 0.15) 100%)' : 'transparent',
                                        '&:hover': { background: 'rgba(255,255,255,0.05)' },
                                        '&::before': isActive ? {
                                            content: '""', position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                                            width: 4, height: '60%', background: 'linear-gradient(135deg, #ffc107 0%, #ff9800 100%)', borderRadius: 2
                                        } : {}
                                    }}
                                >
                                    <ListItemIcon sx={{ color: isActive ? '#ffc107' : 'rgba(255,255,255,0.5)', minWidth: 40 }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { fontWeight: isActive ? 600 : 400, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)' } }} />
                                </ListItemButton>
                            </ListItem>
                        </motion.div>
                    );
                })}
            </List>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

            {/* Footer */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderRadius: 2, background: 'rgba(255,255,255,0.03)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {darkMode ? <DarkMode sx={{ color: '#667eea' }} /> : <LightMode sx={{ color: '#ffc107' }} />}
                        <Typography variant="body2">{darkMode ? 'Dark Mode' : 'Light Mode'}</Typography>
                    </Box>
                    <Switch checked={darkMode} onChange={toggleDarkMode} size="small"
                        sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#ffc107' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#ffc107' } }}
                    />
                </Box>
                <Button fullWidth variant="outlined" onClick={handleLogout} startIcon={<Logout />}
                    sx={{ mt: 2, py: 1.5, borderRadius: 2, borderColor: 'rgba(244, 67, 54, 0.3)', color: '#f44336', '&:hover': { borderColor: '#f44336', background: 'rgba(244, 67, 54, 0.1)' } }}
                >Logout</Button>
            </Box>
        </Box>
    );

    return (
        <>
            {isMobile && (
                <AppBar position="fixed" sx={{ background: 'rgba(26, 26, 46, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <Toolbar>
                        <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}><MenuIcon /></IconButton>
                        <AdminPanelSettings sx={{ mr: 1, color: '#ffc107' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Admin Console</Typography>
                    </Toolbar>
                </AppBar>
            )}
            <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
                <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: 'transparent', border: 'none' } }}>
                    {drawer}
                </Drawer>
                <Drawer variant="permanent"
                    sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, background: 'transparent', border: 'none', borderRight: '1px solid rgba(255,255,255,0.08)' } }} open>
                    {drawer}
                </Drawer>
            </Box>
        </>
    );
};

export { drawerWidth };
export default AdminSidebar;
