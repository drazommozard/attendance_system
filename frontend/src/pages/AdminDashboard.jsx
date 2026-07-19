import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminDashboard() {
    const [logData, setLogData] = useState({
        summary: { total_present: 0, total_on_time: 0, total_late: 0 },
        records: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');

    useEffect(() => {
        const fetchDailyLogs = async () => {
            try {
                const token = localStorage.getItem('access_token');

                const response = await axios.get('http://127.0.0.1:8000/api/admin/daily-log/', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                setLogData(response.data);
                setLoading(false);
            } catch (err) {
                // ADD THIS LINE FOR DEBUGGING:
                console.log("Full Axios Error Object:", err);

                setError(err.response?.data?.detail || 'Failed to fetch dashboard metrics.');
                setLoading(false);
            }
        };

        fetchDailyLogs();
    }, []);

    if (loading) return <div style={{ padding: '20px' }}>Loading analytics engine...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    const handleExportCSV = async () => {
        try {
            const token = localStorage.getItem('access_token');

            // Build the URL, attaching dates if the user selected them
            let url = 'http://127.0.0.1:8000/api/admin/export-csv/';
            const params = new URLSearchParams();
            if (exportStartDate) params.append('start_date', exportStartDate);
            if (exportEndDate) params.append('end_date', exportEndDate);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });

            const fileUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = fileUrl;

            // Name the file based on whether a filter was used
            const fileName = exportStartDate ? `attendance_${exportStartDate}_to_${exportEndDate || 'now'}.csv` : 'attendance_all.csv';
            link.setAttribute('download', fileName);

            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            console.error("Error downloading the CSV file", error);
            alert("Failed to download CSV.");
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Attendance Monitoring Engine</h2>
            {/* --- CSV EXPORT CONTROL PANEL --- */}
            <div style={{
                backgroundColor: '#f8fafc',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '20px',
                display: 'flex',
                gap: '15px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>Start Date</label>
                    <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>End Date (Optional)</label>
                    <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                    />
                </div>

                <button
                    onClick={handleExportCSV}
                    style={{
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        padding: '10px 15px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        marginTop: '18px' // Aligns the button with the inputs
                    }}
                >
                    📥 Download CSV
                </button>
            </div>
            {/* -------------------------------- */}

            {/* --- Summary Counter Cards --- */}
            <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minWidth: '120px' }}>
                    <h3>{logData.summary.total_present}</h3>
                    <p style={{ color: '#666', margin: '5px 0 0 0' }}>Total Present</p>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minWidth: '120px', borderLeft: '5px solid green' }}>
                    <h3>{logData.summary.total_on_time}</h3>
                    <p style={{ color: 'green', margin: '5px 0 0 0' }}>On-Time</p>
                </div>
                <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', minWidth: '120px', borderLeft: '5px solid orange' }}>
                    <h3>{logData.summary.total_late}</h3>
                    <p style={{ color: 'orange', margin: '5px 0 0 0' }}>Late Arrivals</p>
                </div>
            </div>

            {/* --- Real-Time Activity Log Table --- */}
            <h3 style={{ marginTop: '30px' }}>Today's Activity Records</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        <th style={{ padding: '12px' }}>User ID</th>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Clock In</th>
                        <th style={{ padding: '12px' }}>Clock Out</th>
                        <th style={{ padding: '12px' }}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {logData.records.length === 0 ? (
                        <tr>
                            <td colSpan="5" style={{ padding: '12px', textAlign: 'center', color: '#888' }}>
                                No attendance markers submitted yet for today.
                            </td>
                        </tr>
                    ) : (
                        logData.records.map((record) => (
                            <tr key={record.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px' }}>{record.user}</td>
                                <td style={{ padding: '12px' }}>{record.date}</td>
                                <td style={{ padding: '12px' }}>{record.time_in}</td>
                                <td style={{ padding: '12px' }}>{record.time_out || '---'}</td>
                                <td style={{
                                    padding: '12px',
                                    fontWeight: 'bold',
                                    color: record.status === 'Late' ? 'orange' : 'green'
                                }}>
                                    {record.status}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}