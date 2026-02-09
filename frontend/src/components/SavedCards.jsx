import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Chip
} from '@mui/material';
import { Delete, CreditCard, CheckCircle } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getCardGradient } from '../utils/cardType';

const SavedCards = ({ onSelectCard, selectedCardId }) => {
    const { api } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialog, setDeleteDialog] = useState({ open: false, card: null });
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const response = await api.get('/card/saved');
            if (response.data.success) {
                setCards(response.data.cards);
            }
        } catch (error) {
            console.error('Failed to fetch cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            const response = await api.delete(`/card/${deleteDialog.card._id}`);
            if (response.data.success) {
                setCards(cards.filter(c => c._id !== deleteDialog.card._id));
                toast.success('Card removed successfully');
            }
        } catch (error) {
            toast.error('Failed to remove card');
        } finally {
            setDeleteLoading(false);
            setDeleteDialog({ open: false, card: null });
        }
    };

    const handleSelect = (card) => {
        if (onSelectCard) {
            onSelectCard(card);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (cards.length === 0) {
        return (
            <Box
                sx={{
                    textAlign: 'center',
                    p: 4,
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 2,
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}
            >
                <CreditCard sx={{ fontSize: 48, color: 'rgba(255,255,255,0.2)', mb: 2 }} />
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                    No saved cards yet
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                    Save a card during payment to see it here
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Grid container spacing={2}>
                <AnimatePresence>
                    {cards.map((card, index) => {
                        const isSelected = selectedCardId === card._id;
                        const gradient = getCardGradient(card.cardType);

                        return (
                            <Grid item xs={12} sm={6} key={card._id}>
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <Paper
                                        onClick={() => handleSelect(card)}
                                        sx={{
                                            p: 2.5,
                                            background: gradient,
                                            borderRadius: 3,
                                            cursor: onSelectCard ? 'pointer' : 'default',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            border: isSelected ? '2px solid #4caf50' : '2px solid transparent',
                                            transition: 'all 0.3s ease',
                                            '&:hover': onSelectCard ? {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 12px 40px rgba(0,0,0,0.3)'
                                            } : {}
                                        }}
                                    >
                                        {/* Selection indicator */}
                                        {isSelected && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    background: '#4caf50',
                                                    borderRadius: '50%',
                                                    p: 0.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <CheckCircle sx={{ fontSize: 20, color: '#fff' }} />
                                            </Box>
                                        )}

                                        {/* Card type chip */}
                                        <Chip
                                            label={card.cardType?.toUpperCase() || 'CARD'}
                                            size="small"
                                            sx={{
                                                background: 'rgba(255,255,255,0.2)',
                                                color: '#fff',
                                                fontWeight: 600,
                                                fontSize: '10px',
                                                mb: 2
                                            }}
                                        />

                                        {/* Masked card number */}
                                        <Typography
                                            variant="h6"
                                            sx={{
                                                fontFamily: '"OCR A Std", monospace',
                                                letterSpacing: 3,
                                                color: '#fff',
                                                mb: 2
                                            }}
                                        >
                                            •••• •••• •••• {card.lastFour}
                                        </Typography>

                                        {/* Card holder and expiry */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                                                    CARD HOLDER
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, textTransform: 'uppercase' }}>
                                                    {card.cardHolder}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ textAlign: 'right' }}>
                                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                                                    EXPIRES
                                                </Typography>
                                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600 }}>
                                                    {card.expiryDate}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Delete button */}
                                        {!onSelectCard && (
                                            <IconButton
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteDialog({ open: true, card });
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    color: 'rgba(255,255,255,0.7)',
                                                    '&:hover': {
                                                        color: '#f44336',
                                                        background: 'rgba(244,67,54,0.1)'
                                                    }
                                                }}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Paper>
                                </motion.div>
                            </Grid>
                        );
                    })}
                </AnimatePresence>
            </Grid>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ open: false, card: null })}
                PaperProps={{
                    sx: {
                        background: 'rgba(26, 26, 46, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle>Remove Card?</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to remove the card ending in{' '}
                        <strong>{deleteDialog.card?.lastFour}</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, card: null })}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleDelete}
                        disabled={deleteLoading}
                        sx={{
                            background: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)'
                        }}
                    >
                        {deleteLoading ? <CircularProgress size={20} /> : 'Remove'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SavedCards;
