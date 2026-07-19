import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Force sidebar to stay hidden on login and register pages
    if (location.pathname === '/login' || location.pathname === '/register') {
        return null;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return null;

    // Helper to decode JWT token
    const getPayload = () => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            return JSON.parse(window.atob(base64));
        } catch (e) {
            return {};
        }
    };

    const payload = getPayload();
    // Add this temporary console log to see what the token actually contains:
    console.log("Decoded Token Payload:", payload);

    // 2. Comprehensive admin checks:
    const isSuperAdmin = payload.is_superuser || payload.groups?.includes('Frontend Super Admin');
    const isStandardAdmin = payload.is_staff || payload.groups?.includes('Standard Admin');
    const isAdmin = isSuperAdmin || isStandardAdmin;

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        navigate('/login');
    };

    return (
        <nav style={{
            width: '240px',
            minHeight: '100vh',
            backgroundColor: '#1e293b',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '20px',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif'
        }}>
            <div>
                <h3 style={{ margin: '0 0 20px 0', color: '#38bdf8', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
                    AMS Portal
                </h3>

                <ul style={{ listStyleType: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <li>
                        <Link to="/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'block', padding: '8px', borderRadius: '4px' }}>
                            ⏰ My Attendance
                        </Link>
                    </li>

                    {/* Show Management section if ANY admin flag is true */}
                    {isAdmin && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #334155', paddingTop: '15px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Management</span>

                            <li style={{ marginTop: '8px' }}>
                                <Link to="/admin/dashboard" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'block', padding: '8px', borderRadius: '4px' }}>
                                    📊 Live Metrics
                                </Link>
                            </li>

                            {isSuperAdmin && (
                                <li style={{ marginTop: '8px' }}>
                                    <Link to="/admin/settings" style={{ color: '#cbd5e1', textDecoration: 'none', display: 'block', padding: '8px', borderRadius: '4px' }}>
                                        ⚙️ System Settings
                                    </Link>
                                </li>
                            )}
                        </div>
                    )}
                </ul>
            </div>

            <button
                onClick={handleLogout}
                style={{
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '10px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                }}
            >
                Log Out
            </button>
        </nav>
    );
}