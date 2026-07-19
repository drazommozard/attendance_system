import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function SettingsPanel() {
    // --- System Settings State ---
    const [settings, setSettings] = useState({
        shift_start_time: '',
        shift_end_time: '',
        grace_period_minutes: 0,
        office_latitude: '',
        office_longitude: '',
        allowed_radius_km: ''
    });
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsMessage, setSettingsMessage] = useState('');
    const [settingsError, setSettingsError] = useState('');

    // --- Promotion State ---
    const [promoUsername, setPromoUsername] = useState('');
    const [promoMessage, setPromoMessage] = useState('');
    const [promoError, setPromoError] = useState('');

    const token = localStorage.getItem('access_token');

    // Fetch existing settings when the panel mounts
    useEffect(() => {
        const fetchCurrentSettings = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/api/admin/settings/', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setSettings(response.data);
                setSettingsLoading(false);
            } catch (err) {
                setSettingsError(err.response?.data?.detail || 'Failed to load system settings.');
                setSettingsLoading(false);
            }
        };
        fetchCurrentSettings();
    }, [token]);

    // Handle settings submission (PUT)
    const handleSettingsSubmit = async (e) => {
        e.preventDefault();
        setSettingsMessage('');
        setSettingsError('');
        try {
            const response = await axios.put('http://127.0.0.1:8000/api/admin/settings/', settings, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setSettingsMessage(response.data.message || 'Settings updated successfully!');
        } catch (err) {
            setSettingsError('Failed to update settings. Verify your input parameters.');
        }
    };

    // Handle user promotion submission (POST)
    const handlePromotionSubmit = async (e) => {
        e.preventDefault();
        setPromoMessage('');
        setPromoError('');
        if (!promoUsername.trim()) {
            setPromoError('Please enter a valid username.');
            return;
        }
        try {
            const response = await axios.post('http://127.0.0.1:8000/api/admin/promote/',
                { username: promoUsername },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setPromoMessage(response.data.message);
            setPromoUsername(''); // clear input field on success
        } catch (err) {
            setPromoError(err.response?.data?.error || 'Failed to promote user.');
        }
    };

    if (settingsLoading) return <div style={{ padding: '20px' }}>Loading configuration panel...</div>;

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px' }}>
            <h2>System Administration Center</h2>
            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

            {/* --- TASK 2: GLOBAL SYSTEM SETTINGS FORM --- */}
            <section style={{ marginBottom: '40px' }}>
                <h3>Global Rules & Operational Parameters</h3>
                {settingsMessage && <p style={{ color: 'green', fontWeight: 'bold' }}>{settingsMessage}</p>}
                {settingsError && <p style={{ color: 'red', fontWeight: 'bold' }}>{settingsError}</p>}

                <form onSubmit={handleSettingsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Shift Start Time:</label>
                        <input
                            type="text"
                            placeholder="HH:MM:SS"
                            value={settings.shift_start_time}
                            onChange={(e) => setSettings({ ...settings, shift_start_time: e.target.value })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Shift End Time:</label>
                        <input
                            type="text"
                            placeholder="HH:MM:SS"
                            value={settings.shift_end_time}
                            onChange={(e) => setSettings({ ...settings, shift_end_time: e.target.value })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Grace Period (Minutes):</label>
                        <input
                            type="number"
                            value={settings.grace_period_minutes}
                            onChange={(e) => setSettings({ ...settings, grace_period_minutes: parseInt(e.target.value) || 0 })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Office Latitude:</label>
                        <input
                            type="text"
                            value={settings.office_latitude}
                            onChange={(e) => setSettings({ ...settings, office_latitude: e.target.value })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Office Longitude:</label>
                        <input
                            type="text"
                            value={settings.office_longitude}
                            onChange={(e) => setSettings({ ...settings, office_longitude: e.target.value })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <label>Allowed Radius (KM):</label>
                        <input
                            type="text"
                            value={settings.allowed_radius_km}
                            onChange={(e) => setSettings({ ...settings, allowed_radius_km: e.target.value })}
                            style={{ padding: '5px', width: '200px' }}
                        />
                    </div>
                    <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '10px' }}>
                        Save Operational Configurations
                    </button>
                </form>
            </section>

            <hr style={{ margin: '20px 0', borderColor: '#eee' }} />

            {/* --- TASK 3: USER PROMOTION PANEL --- */}
            <section>
                <h3>Promote Staff to Standard Admin</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>Elevate standard employee accounts to Tier 3 supervisors instantly by username context.</p>

                {promoMessage && <p style={{ color: 'green', fontWeight: 'bold', marginTop: '10px' }}>{promoMessage}</p>}
                {promoError && <p style={{ color: 'red', fontWeight: 'bold', marginTop: '10px' }}>{promoError}</p>}

                <form onSubmit={handlePromotionSubmit} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <input
                        type="text"
                        placeholder="Enter target username..."
                        value={promoUsername}
                        onChange={(e) => setPromoUsername(e.target.value)}
                        style={{ padding: '8px', flex: 1, borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button type="submit" style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Promote User
                    </button>
                </form>
            </section>
        </div>
    );
}