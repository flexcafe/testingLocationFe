import React, { useState } from 'react';
import axios from 'axios';

const AVATAR_COLORS = [
    { color: '#667eea', name: 'Indigo' },
    { color: '#ef4444', name: 'Red' },
    { color: '#10b981', name: 'Green' },
    { color: '#f59e0b', name: 'Amber' },
    { color: '#8b5cf6', name: 'Purple' },
    { color: '#ec4899', name: 'Pink' },
    { color: '#06b6d4', name: 'Cyan' },
    { color: '#f97316', name: 'Orange' },
];

const AuthScreen = ({ onAuth }) => {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [pin, setPin] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0].color);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'register') {
                if (!email || !displayName || !pin) {
                    throw new Error('Please fill in all required fields');
                }
                if (pin.length < 4) {
                    throw new Error('PIN must be at least 4 characters');
                }

                const res = await axios.post(`${serverUrl}/api/users/register`, {
                    email,
                    displayName,
                    pin,
                    phone: phone || null,
                    avatarColor
                });

                const user = res.data.data;
                localStorage.setItem('user', JSON.stringify(user));
                onAuth(user);
            } else {
                if (!email || !pin) {
                    throw new Error('Please enter email and PIN');
                }

                const res = await axios.post(`${serverUrl}/api/users/login`, {
                    email,
                    pin
                });

                const user = res.data.data;
                localStorage.setItem('user', JSON.stringify(user));
                onAuth(user);
            }
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="auth-screen">
            <div className="auth-card">
                <div className="auth-header">
                    <div className="auth-logo">📍</div>
                    <h1>C2C Location Sharing</h1>
                    <p>Test location sharing between 2 users on Median.co</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); setError(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); setError(''); }}
                    >
                        Register
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {mode === 'register' && (
                        <div className="avatar-preview-row">
                            <div
                                className="avatar-preview"
                                style={{ background: avatarColor }}
                            >
                                {getInitials(displayName)}
                            </div>
                            <span className="avatar-hint">Pick your color below</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <>
                            <div className="form-group">
                                <label>Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Your name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Phone (optional)</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>

                            <div className="form-group">
                                <label>Avatar Color</label>
                                <div className="color-picker">
                                    {AVATAR_COLORS.map(c => (
                                        <button
                                            key={c.color}
                                            type="button"
                                            className={`color-option ${avatarColor === c.color ? 'selected' : ''}`}
                                            style={{ background: c.color }}
                                            onClick={() => setAvatarColor(c.color)}
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>PIN</label>
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="At least 4 characters"
                            minLength={4}
                            required
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button type="submit" className="auth-submit" disabled={loading}>
                        {loading
                            ? 'Please wait...'
                            : mode === 'login'
                                ? 'Login'
                                : 'Create Account'
                        }
                    </button>
                </form>

                <div className="auth-footer">
                    {mode === 'login'
                        ? <p>Don't have an account? <button onClick={() => setMode('register')}>Register</button></p>
                        : <p>Already registered? <button onClick={() => setMode('login')}>Login</button></p>
                    }
                </div>
            </div>
        </div>
    );
};

export default AuthScreen;
