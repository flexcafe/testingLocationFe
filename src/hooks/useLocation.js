import { useState, useEffect, useCallback, useRef } from 'react';
import io from 'socket.io-client';

export const useLocation = (userId, userName, userUuid, avatarColor) => {
    const [users, setUsers] = useState([]);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
        socketRef.current = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('Connected to server');
            setIsConnected(true);
            socket.emit('register-user', {
                userId,
                userUuid,
                displayName: userName,
                avatarColor
            });
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socket.on('initial-locations', (locations) => {
            console.log('Initial locations:', locations);
            setUsers(locations.filter(loc => loc.user_id !== userId));
        });

        socket.on('location-updated', (location) => {
            if (location.userId !== userId) {
                setUsers(prev => {
                    const filtered = prev.filter(u => u.user_id !== location.userId);
                    return [...filtered, {
                        user_id: location.userId,
                        user_name: location.userName,
                        latitude: location.latitude,
                        longitude: location.longitude,
                        accuracy: location.accuracy,
                        last_update: location.timestamp,
                        avatarColor: location.avatarColor,
                        users: location.userUuid ? {
                            id: location.userUuid,
                            display_name: location.userName,
                            avatar_color: location.avatarColor
                        } : null
                    }];
                });
            }
        });

        socket.on('user-online', ({ userId: onlineUserId, displayName }) => {
            console.log('User online:', onlineUserId, displayName);
        });

        socket.on('user-offline', ({ userId: offlineUserId }) => {
            setUsers(prev => prev.filter(u => u.user_id !== offlineUserId));
        });

        socket.on('nearby-users', (nearbyList) => {
            setUsers(nearbyList.filter(loc => loc.user_id !== userId));
        });

        socket.on('error', (err) => {
            console.error('Socket error:', err);
            setError(err.message);
        });

        return () => {
            if (socket) socket.disconnect();
        };
    }, [userId, userUuid, userName, avatarColor]);

    useEffect(() => {
        if (!userId || !socketRef.current) return;

        if (!navigator.geolocation) {
            setError('Geolocation is not supported');
            return;
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                setCurrentLocation({ latitude, longitude, accuracy });

                if (socketRef.current?.connected) {
                    socketRef.current.emit('update-location', {
                        userId,
                        userName,
                        latitude,
                        longitude,
                        accuracy,
                        userUuid,
                        avatarColor
                    });
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError(`GPS Error: ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );

        return () => {
            if (watchIdRef.current) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, [userId, userName, userUuid, avatarColor]);

    const getNearbyUsers = useCallback((latitude, longitude, radius = 20037) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('request-nearby', { latitude, longitude, radiusKm: radius });
        }
    }, []);

    return {
        users,
        currentLocation,
        isConnected,
        error,
        getNearbyUsers
    };
};

