import { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    Grid,
    InputAdornment,
    IconButton,
    Alert,
    CircularProgress,
    Divider,
    Avatar
} from '@mui/material';
import {
    Person,
    Email,
    Lock,
    Visibility,
    VisibilityOff,
    Edit,
    Save,
    CreditCard
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import SavedCards from './SavedCards';

const Profile = () => {
    const { user, updateProfile } = useAuth();
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
        setSuccess('');
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match');
            return;
        }

        if (formData.newPassword && formData.newPassword.length < 6) {
            setError('New password must be at least 6 characters');
            return;
        }

        if (formData.newPassword && !formData.currentPassword) {
            setError('Current password is required to set new password');
            return;
        }

        setLoading(true);

        const updateData = {
            name: formData.name,
            email: formData.email
        };

        if (formData.newPassword) {
            updateData.currentPassword = formData.currentPassword;
            updateData.newPassword = formData.newPassword;
        }

        const result = await updateProfile(updateData);

        if (result.success) {
            setSuccess('Profile updated successfully');
            setEditing(false);
            setFormData({
                ...formData,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
            toast.success('Profile updated successfully!');
        } else {
            setError(result.message);
        }

        setLoading(false);
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || '',
            email: user?.email || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        });
        setEditing(false);
        setError('');
        setSuccess('');
    };

    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4 }}>
                Profile Settings
            </Typography>

            <Grid container spacing={4}>
                {/* Profile Card */}
                <Grid item xs={12} md={4}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Paper
                            sx={{
                                p: 4,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                                textAlign: 'center'
                            }}
                        >
                            <Avatar
                                sx={{
                                    width: 120,
                                    height: 120,
                                    mx: 'auto',
                                    mb: 3,
                                    fontSize: 48,
                                    fontWeight: 700,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                                }}
                            >
                                {user?.name?.charAt(0).toUpperCase()}
                            </Avatar>

                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                                {user?.name}
                            </Typography>

                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>
                                {user?.email}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'inline-flex',
                                    px: 2,
                                    py: 0.5,
                                    borderRadius: 20,
                                    background: user?.role === 'admin'
                                        ? 'rgba(255, 193, 7, 0.15)'
                                        : 'rgba(102, 126, 234, 0.15)',
                                    color: user?.role === 'admin' ? '#ffc107' : '#667eea',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    textTransform: 'uppercase'
                                }}
                            >
                                {user?.role}
                            </Box>

                            <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                Member since {new Date(user?.createdAt).toLocaleDateString()}
                            </Typography>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Edit Profile Form */}
                <Grid item xs={12} md={8}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Paper
                            component="form"
                            onSubmit={handleSubmit}
                            sx={{
                                p: 4,
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Account Information
                                </Typography>
                                {!editing && (
                                    <Button
                                        startIcon={<Edit />}
                                        onClick={() => setEditing(true)}
                                        sx={{
                                            color: '#667eea',
                                            '&:hover': {
                                                background: 'rgba(102, 126, 234, 0.1)'
                                            }
                                        }}
                                    >
                                        Edit
                                    </Button>
                                )}
                            </Box>

                            {error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {error}
                                </Alert>
                            )}

                            {success && (
                                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                                    {success}
                                </Alert>
                            )}

                            <TextField
                                fullWidth
                                label="Full Name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                disabled={!editing}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Person sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <TextField
                                fullWidth
                                label="Email Address"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={!editing}
                                margin="normal"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            {editing && (
                                <>
                                    <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.08)' }} />

                                    <Typography variant="subtitle2" sx={{ mb: 2, color: 'rgba(255,255,255,0.7)' }}>
                                        Change Password (optional)
                                    </Typography>

                                    <TextField
                                        fullWidth
                                        label="Current Password"
                                        name="currentPassword"
                                        type={showPasswords.current ? 'text' : 'password'}
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        margin="normal"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        onClick={() => togglePasswordVisibility('current')}
                                                        edge="end"
                                                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                                                    >
                                                        {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="New Password"
                                                name="newPassword"
                                                type={showPasswords.new ? 'text' : 'password'}
                                                value={formData.newPassword}
                                                onChange={handleChange}
                                                margin="normal"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => togglePasswordVisibility('new')}
                                                                edge="end"
                                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                                            >
                                                                {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                label="Confirm New Password"
                                                name="confirmPassword"
                                                type={showPasswords.confirm ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                margin="normal"
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Lock sx={{ color: 'rgba(255,255,255,0.5)' }} />
                                                        </InputAdornment>
                                                    ),
                                                    endAdornment: (
                                                        <InputAdornment position="end">
                                                            <IconButton
                                                                onClick={() => togglePasswordVisibility('confirm')}
                                                                edge="end"
                                                                sx={{ color: 'rgba(255,255,255,0.5)' }}
                                                            >
                                                                {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                                            </IconButton>
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                    </Grid>
                                </>
                            )}

                            {editing && (
                                <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                                    <Button
                                        variant="outlined"
                                        onClick={handleCancel}
                                        disabled={loading}
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            borderRadius: 2,
                                            borderColor: 'rgba(255,255,255,0.2)',
                                            color: 'rgba(255,255,255,0.7)'
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={loading}
                                        startIcon={loading ? <CircularProgress size={20} /> : <Save />}
                                        sx={{
                                            flex: 1,
                                            py: 1.5,
                                            borderRadius: 2,
                                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                            fontWeight: 600
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                            )}
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>

            {/* Saved Cards Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <Paper
                    sx={{
                        p: 4,
                        mt: 4,
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 3,
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <CreditCard sx={{ color: '#667eea' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Saved Payment Methods
                        </Typography>
                    </Box>
                    <SavedCards />
                </Paper>
            </motion.div>
        </Box>
    );
};

export default Profile;
