import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // 1. Added Link import here
import axios from 'axios';

export default function Login() {
    // State variables
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Navigation hook
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Send login request to full backend host
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
                username,
                password,
            });

            // Save access token
            localStorage.setItem('access_token', response.data.access);

            // Redirect
            navigate('/dashboard');
        } catch (err) {
            setError('Invalid username or password.');
        }
    };

    return (
        <div
            style={{
                maxWidth: '400px',
                margin: '50px auto',
                padding: '20px',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontFamily: 'sans-serif'
            }}
        >
            <h2>System Login</h2>

            {/* Display error */}
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Username:</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '15px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginTop: '5px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <button
                    type="submit"
                    style={{
                        width: '100%',
                        padding: '10px',
                        cursor: 'pointer',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold'
                    }}
                >
                    Log In
                </button>
            </form>

            {/* 2. Registration Navigation Link Added Here */}
            <p style={{ marginTop: '20px', fontSize: '14px', textAlign: 'center' }}>
                New to the portal?{' '}
                <Link to="/register" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                    Create an account
                </Link>
            </p>
        </div>
    );
}