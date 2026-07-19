import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [history, setHistory] = useState([]);
    const [currentStatus, setCurrentStatus] = useState('Loading...');
    const [showHistory, setShowHistory] = useState(false); // New state for toggling
    const navigate = useNavigate();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return navigate('/login');

        const config = { headers: { Authorization: `Bearer ${token}` } };

        try {
            const res = await axios.get('/api/attendance/history/', config);
            setHistory(res.data);

            if (res.data.length > 0 && !res.data[0].time_out) {
                setCurrentStatus(`Clocked In (${res.data[0].status})`);
            } else {
                setCurrentStatus('Clocked Out');
            }
        } catch (err) {
            setError('Failed to load dashboard data.');
        }
    };

    const handleClockAction = async (actionType) => {
        setError('');
        setMessage('');

        navigator.geolocation.getCurrentPosition(async (position) => {
            const token = localStorage.getItem('access_token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const payload = { latitude: position.coords.latitude, longitude: position.coords.longitude };

            try {
                if (actionType === 'in') {
                    await axios.post('/api/attendance/clock-in/', payload, config);
                    setMessage('Clock-in successful!');
                } else {
                    await axios.put('/api/attendance/clock-out/', payload, config);
                    setMessage('Clock-out successful!');
                }
                fetchDashboardData();
            } catch (err) {
                setError(err.response?.data?.error || 'Action failed.');
            }
        });
    };

    return (
        <div style={{
            maxWidth: '600px',
            margin: '50px auto',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            backgroundColor: '#ffffff',
            fontFamily: 'Segoe UI, sans-serif'
        }}>
            <h2 style={{ color: '#333' }}>Employee Dashboard</h2>
            <div style={{ fontSize: '1.1em', margin: '20px 0', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                Status: <b style={{ color: currentStatus.includes('Clocked In') ? '#28a745' : '#dc3545' }}>{currentStatus}</b>
            </div>

            {error && <p style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '10px', borderRadius: '5px' }}>{error}</p>}
            {message && <p style={{ color: '#155724', backgroundColor: '#d4edda', padding: '10px', borderRadius: '5px' }}>{message}</p>}

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                <button onClick={() => handleClockAction('in')} style={{ padding: '12px 25px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Clock In</button>
                <button onClick={() => handleClockAction('out')} style={{ padding: '12px 25px', backgroundColor: '#ffc107', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Clock Out</button>
            </div>

            <button
                onClick={() => setShowHistory(!showHistory)}
                style={{ marginTop: '30px', padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}
            >
                {showHistory ? 'Hide History' : 'View Attendance History'}
            </button>

            {showHistory && (
                <div style={{ marginTop: '20px' }}>
                    <h3 style={{ color: '#555' }}>Recent Activity</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#e9ecef' }}>
                                <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Date</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>In</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Out</th>
                                <th style={{ padding: '10px', borderBottom: '2px solid #dee2e6' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.map((record) => (
                                <tr key={record.id} style={{ textAlign: 'center' }}>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{record.date}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{record.time_in}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{record.time_out || '-'}</td>
                                    <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6', color: record.status === 'Late' ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>{record.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}