import React, { useState, useEffect, useCallback } from 'react';
import LocationMap from './components/LocationMap';
import AuthScreen from './components/AuthScreen';
import { useLocation } from './hooks/useLocation';
import axios from 'axios';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch {
                localStorage.removeItem('user');
            }
        }
    }, []);

    const userId = user ? `user_${user.id.slice(0, 8)}` : '';
    const userName = user?.display_name || '';
    const userUuid = user?.id || '';
    const avatarColor = user?.avatar_color || '#667eea';

    const { users, currentLocation, isConnected, error, getNearbyUsers } = useLocation(
        userId, userName, userUuid, avatarColor
    );

    const handleAuth = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        window.location.reload();
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || newName.trim() === userName) {
            setEditingName(false);
            return;
        }
        try {
            const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
            const res = await axios.put(`${serverUrl}/api/users/${user.id}`, {
                display_name: newName.trim()
            });
            const updated = res.data.data;
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
            setEditingName(false);
        } catch (err) {
            alert('Failed to update name');
        }
    };

    const handleFindNearby = () => {
        if (currentLocation) {
            getNearbyUsers(currentLocation.latitude, currentLocation.longitude);
            alert('Showing all active users...');
        } else {
            alert('Waiting for your location...');
        }
    };

    const closeSidebar = useCallback(() => setSidebarOpen(false), []);

    const getInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    };

    if (!user) {
        return <AuthScreen onAuth={handleAuth} />;
    }

    return (
        <div className="App">
            {/* Toggle button — always visible, sits on top of everything */}
            <button
                className="toggle-btn"
                onClick={() => setSidebarOpen(prev => !prev)}
                type="button"
            >
                {sidebarOpen ? '\u2715' : '\u2630'}
            </button>

            {/* Dark overlay when sidebar is open */}
            <div
                className={`overlay ${sidebarOpen ? 'visible' : ''}`}
                onClick={closeSidebar}
            />

            {/* Sidebar drawer */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="header">
                    <h1>C2C Location Sharing</h1>
                    <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
                        {isConnected ? '● Connected' : '○ Disconnected'}
                    </div>
                </div>

                <div className="user-card">
                    <div className="user-avatar" style={{ background: avatarColor }}>
                        {getInitials(userName)}
                    </div>
                    <div className="user-info">
                        {editingName ? (
                            <div className="edit-name-row">
                                <input
                                    type="text"
                                    className="edit-name-input"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                                    autoFocus
                                />
                                <button className="save-name-btn" onClick={handleUpdateName}>Save</button>
                                <button className="cancel-name-btn" onClick={() => setEditingName(false)}>X</button>
                            </div>
                        ) : (
                            <h3>{userName}</h3>
                        )}
                        <p className="user-email">{user.email}</p>
                        {user.phone && <p className="user-phone">{user.phone}</p>}
                        {currentLocation && (
                            <p className="location-info">
                                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                                <br />
                                Accuracy: ±{(currentLocation.accuracy || 0).toFixed(0)}m
                            </p>
                        )}
                    </div>
                    <div className="user-card-actions">
                        <button
                            className="edit-btn"
                            onClick={() => { setNewName(userName); setEditingName(true); }}
                            title="Edit name"
                        >
                            ✎
                        </button>
                        <button className="logout-btn" onClick={handleLogout} title="Logout">
                            ⏻
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="error-banner">⚠️ {error}</div>
                )}

                <div className="stats">
                    <div className="stat">
                        <span className="stat-value">{users.length + 1}</span>
                        <span className="stat-label">Active Users</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{users.length}</span>
                        <span className="stat-label">Nearby</span>
                    </div>
                    <div className="stat">
                        <span className="stat-value">{currentLocation ? '✓' : '⟳'}</span>
                        <span className="stat-label">GPS</span>
                    </div>
                </div>

                <button className="nearby-btn" onClick={() => { handleFindNearby(); closeSidebar(); }}>
                    Show All Users
                </button>

                <div className="users-list">
                    <h3>Other Users ({users.length})</h3>
                    {users.length === 0 ? (
                        <div className="empty-state">
                            <p>No other users nearby</p>
                            <small>Open this app on another device to test location sharing!</small>
                        </div>
                    ) : (
                        <ul>
                            {users.map(u => {
                                const uColor = u.users?.avatar_color || u.avatarColor || '#e5e7eb';
                                const uName = u.users?.display_name || u.user_name;
                                const uEmail = u.users?.email || '';
                                return (
                                    <li key={u.user_id} className="user-list-item">
                                        <div className="user-list-avatar" style={{ background: uColor, color: '#fff' }}>
                                            {getInitials(uName)}
                                        </div>
                                        <div className="user-list-info">
                                            <div className="user-list-name">{uName}</div>
                                            {uEmail && <div className="user-list-email">{uEmail}</div>}
                                            <div className="user-list-time">
                                                Updated: {new Date(u.last_update).toLocaleTimeString()}
                                            </div>
                                        </div>
                                        {currentLocation && (
                                            <div className="user-list-distance">
                                                {(() => {
                                                    const R = 6371;
                                                    const dLat = (u.latitude - currentLocation.latitude) * Math.PI / 180;
                                                    const dLon = (u.longitude - currentLocation.longitude) * Math.PI / 180;
                                                    const a =
                                                        Math.sin(dLat/2) * Math.sin(dLat/2) +
                                                        Math.cos(currentLocation.latitude * Math.PI / 180) *
                                                        Math.cos(u.latitude * Math.PI / 180) *
                                                        Math.sin(dLon/2) * Math.sin(dLon/2);
                                                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                                                    return `${(R * c).toFixed(1)}km`;
                                                })()}
                                            </div>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>

                <div className="footer">
                    <p>Real-time location sharing</p>
                    <p>Updates every second</p>
                    <p>Median.co test app</p>
                </div>
            </aside>

            <div className="map-container">
                <LocationMap
                    users={users}
                    currentLocation={currentLocation}
                    userName={userName}
                    avatarColor={avatarColor}
                />
            </div>
        </div>
    );
}

export default App;
