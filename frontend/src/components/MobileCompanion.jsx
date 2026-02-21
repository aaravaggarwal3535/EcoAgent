import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Smartphone, Zap, ZapOff, Wifi, WifiOff } from 'lucide-react';
import './Dashboard.css'; // Just re-using basic styles for demo

export default function MobileCompanion() {
    const [searchParams] = useSearchParams();
    const sessionToken = searchParams.get('session');

    const [connected, setConnected] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [error, setError] = useState(null);

    const socketRef = useRef(null);
    const trackRef = useRef(null);

    useEffect(() => {
        if (!sessionToken) {
            setError("No session token provided. Please scan the QR code again.");
            return;
        }

        // Initialize Camera and get video track
        const initCamera = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                const track = stream.getVideoTracks()[0];

                // Check if torch is supported
                const capabilities = track.getCapabilities();
                if (!capabilities.torch) {
                    setError("Torch is not supported on this device's camera.");
                    return;
                }

                trackRef.current = track;
            } catch (err) {
                console.error("Camera access error:", err);
                if (window.location.protocol !== 'https:') {
                    setError("Could not access camera. Please ensure you are accessing this page exactly via HTTPS (even with an IP address).");
                } else {
                    setError("Could not access camera. Please ensure permissions are granted and you accept the self-signed certificate warning.");
                }
            }
        };

        initCamera();

        // Connect to the proxy when local, or remote when production
        const serverUrl = window.location.origin;

        // Connect to socket server
        socketRef.current = io(serverUrl, {
            query: { session: sessionToken }
        });

        socketRef.current.on('connect', () => {
            setConnected(true);
            // Let the backend know we are explicitly joining
            socketRef.current.emit('join_room_event', { session: sessionToken });
        });

        socketRef.current.on('disconnect', () => {
            setConnected(false);
        });

        socketRef.current.on('torch_command', async (data) => {
            console.log("Received torch command:", data);
            if (data.command === 'torch' && trackRef.current) {
                try {
                    const action = data.action; // "on" or "off"
                    const turnOn = action === 'on';
                    await trackRef.current.applyConstraints({
                        advanced: [{ torch: turnOn }]
                    });
                    setTorchOn(turnOn);
                } catch (err) {
                    console.error("Failed to apply torch constraint:", err);
                    setError("Failed to control torch. It might not be supported.");
                }
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
            if (trackRef.current) trackRef.current.stop();
        };
    }, [sessionToken]);

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: '100vh',
            backgroundColor: 'var(--bg-color)', color: 'var(--text-color)',
            padding: '2rem', textAlign: 'center'
        }}>
            <Smartphone size={64} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
            <h1 style={{ marginBottom: '0.5rem' }}>Mobile Companion</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Keep this page open to allow EcoAgent to control your torch.
            </p>

            <div style={{
                backgroundColor: 'var(--surface-color)', padding: '1.5rem',
                borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)',
                width: '100%', maxWidth: '400px',
                display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>Connection Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: connected ? '#10b981' : '#ef4444' }}>
                        {connected ? <Wifi size={20} /> : <WifiOff size={20} />}
                        {connected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>Torch Status</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: torchOn ? '#eab308' : 'var(--text-secondary)' }}>
                        {torchOn ? <Zap size={20} /> : <ZapOff size={20} />}
                        {torchOn ? 'ON' : 'OFF'}
                    </div>
                </div>

                {error && (
                    <div style={{
                        color: '#ef4444', backgroundColor: '#fef2f2',
                        padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

            </div>
        </div>
    );
}
