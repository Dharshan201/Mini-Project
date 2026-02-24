import { useState, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import AdminSidebar, { drawerWidth } from './AdminSidebar';
import AdminOverview from './admin/AdminOverview';
import AdminUsers from './admin/AdminUsers';
import AdminTransactions from './admin/AdminTransactions';
import AdminApplications from './admin/AdminApplications';
import AdminCreditScores from './admin/AdminCreditScores';

const AdminPanel = () => {
    const { api } = useAuth();
    const [activePage, setActivePage] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [applications, setApplications] = useState([]);
    const [creditScores, setCreditScores] = useState([]);
    const [userPage, setUserPage] = useState(1);
    const [transactionPage, setTransactionPage] = useState(1);
    const [appPage, setAppPage] = useState(1);
    const [totalUserPages, setTotalUserPages] = useState(1);
    const [totalTransactionPages, setTotalTransactionPages] = useState(1);
    const [totalAppPages, setTotalAppPages] = useState(1);
    const [filters, setFilters] = useState({ status: '', appStatus: '', appTier: '' });
    const [actionDialog, setActionDialog] = useState({ open: false, transaction: null, action: '' });
    const [appActionDialog, setAppActionDialog] = useState({ open: false, application: null, action: '' });
    const [userDetailDialog, setUserDetailDialog] = useState({ open: false, user: null });
    const [actionLoading, setActionLoading] = useState(false);
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        fetchStats();
        fetchUsers();
        fetchTransactions();
        fetchApplications();
        fetchCreditScores();
    }, []);

    useEffect(() => { fetchUsers(); }, [userPage, userSearch]);
    useEffect(() => { fetchTransactions(); }, [transactionPage, filters.status]);
    useEffect(() => { fetchApplications(); }, [appPage, filters.appStatus, filters.appTier]);

    const fetchStats = async () => {
        try {
            const response = await api.get('/admin/stats');
            if (response.data.success) setStats(response.data.stats);
        } catch (error) { console.error('Failed to fetch admin stats:', error); }
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: userPage, limit: 10 });
            if (userSearch) params.set('search', userSearch);
            const response = await api.get(`/admin/users?${params}`);
            if (response.data.success) {
                setUsers(response.data.users);
                setTotalUserPages(response.data.pages);
            }
        } catch (error) { console.error('Failed to fetch users:', error); }
        finally { setLoading(false); }
    };

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: transactionPage, limit: 10 });
            if (filters.status) params.set('status', filters.status);
            const response = await api.get(`/admin/transactions?${params}`);
            if (response.data.success) {
                setTransactions(response.data.transactions);
                setTotalTransactionPages(response.data.pages);
            }
        } catch (error) { console.error('Failed to fetch transactions:', error); }
        finally { setLoading(false); }
    };

    const fetchApplications = async () => {
        try {
            const params = new URLSearchParams({ page: appPage, limit: 10 });
            if (filters.appStatus) params.set('status', filters.appStatus);
            if (filters.appTier) params.set('tier', filters.appTier);
            const response = await api.get(`/admin/applications?${params}`);
            if (response.data.success) {
                setApplications(response.data.applications);
                setTotalAppPages(response.data.pages);
            }
        } catch (error) { console.error('Failed to fetch applications:', error); }
    };

    const fetchCreditScores = async () => {
        try {
            const response = await api.get('/admin/credit-scores');
            if (response.data.success) setCreditScores(response.data.creditScores);
        } catch (error) { console.error('Failed to fetch credit scores:', error); }
    };

    const fetchUserDetails = async (userId) => {
        try {
            const response = await api.get(`/admin/users/${userId}`);
            if (response.data.success) {
                setUserDetailDialog({ open: true, user: response.data });
            }
        } catch (error) { toast.error('Failed to fetch user details'); }
    };

    const handleTransactionAction = async () => {
        setActionLoading(true);
        try {
            const { transaction, action } = actionDialog;
            const response = await api.put(`/admin/transaction/${transaction._id}`, {
                action, reason: action === 'reject' ? 'Rejected by admin' : undefined
            });
            if (response.data.success) {
                toast.success(`Transaction ${action}d successfully`);
                fetchTransactions();
                fetchStats();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
            setActionDialog({ open: false, transaction: null, action: '' });
        }
    };

    const handleApplicationAction = async () => {
        setActionLoading(true);
        try {
            const { application, action } = appActionDialog;
            const response = await api.put(`/admin/application/${application._id}`, {
                action, reason: action === 'reject' ? 'Does not meet requirements' : undefined
            });
            if (response.data.success) {
                toast.success(`Application ${action}d successfully${action === 'approve' ? ' — Card created and stored!' : ''}`);
                fetchApplications();
                fetchStats();
                fetchCreditScores();
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
            setAppActionDialog({ open: false, application: null, action: '' });
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/export', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Export downloaded successfully');
        } catch (error) { toast.error('Export failed'); }
    };

    const refreshAll = () => {
        fetchStats(); fetchUsers(); fetchTransactions(); fetchApplications(); fetchCreditScores();
    };

    const renderPage = () => {
        switch (activePage) {
            case 'users':
                return <AdminUsers users={users} loading={loading} userSearch={userSearch} setUserSearch={setUserSearch}
                    userPage={userPage} setUserPage={setUserPage} totalUserPages={totalUserPages}
                    fetchUserDetails={fetchUserDetails} userDetailDialog={userDetailDialog} setUserDetailDialog={setUserDetailDialog}
                    onCardAction={() => { fetchUsers(); fetchStats(); }} />;
            case 'transactions':
                return <AdminTransactions transactions={transactions} loading={loading} filters={filters} setFilters={setFilters}
                    transactionPage={transactionPage} setTransactionPage={setTransactionPage} totalTransactionPages={totalTransactionPages}
                    actionDialog={actionDialog} setActionDialog={setActionDialog} handleTransactionAction={handleTransactionAction}
                    actionLoading={actionLoading} handleExport={handleExport} />;
            case 'applications':
                return <AdminApplications applications={applications} filters={filters} setFilters={setFilters}
                    appPage={appPage} setAppPage={setAppPage} totalAppPages={totalAppPages}
                    appActionDialog={appActionDialog} setAppActionDialog={setAppActionDialog}
                    handleApplicationAction={handleApplicationAction} actionLoading={actionLoading} />;
            case 'credit-scores':
                return <AdminCreditScores creditScores={creditScores} />;
            default:
                return <AdminOverview stats={stats} />;
        }
    };

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AdminSidebar currentPath={activePage} onNavigate={setActivePage} />
            <Box component="main" sx={{
                flexGrow: 1, p: { xs: 2, md: 4 },
                width: { md: `calc(100% - ${drawerWidth}px)` },
                mt: { xs: 8, md: 0 }, minHeight: '100vh', overflow: 'auto'
            }}>
                {/* Refresh button */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button startIcon={<Refresh />} onClick={refreshAll} sx={{ color: 'rgba(255,255,255,0.7)' }}>Refresh All</Button>
                </Box>
                {renderPage()}
            </Box>
        </Box>
    );
};

export default AdminPanel;
