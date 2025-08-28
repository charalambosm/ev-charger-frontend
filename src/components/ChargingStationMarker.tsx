import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Defs, Filter, FeGaussianBlur, FeOffset, FeMerge, FeMergeNode, G, Text, Rect, Ellipse } from 'react-native-svg';

interface ChargingStationMarkerProps {
    size?: number;
    isFastDC?: boolean;
    connectorCount?: number;
    isAvailable?: boolean;
    connections?: Array<{
        status?: string;
        powerKW?: number;
    }>;
}

export default function ChargingStationMarker({
    size = 32,
    isFastDC = false,
    connectorCount,
    isAvailable = true,
    connections = []
}: ChargingStationMarkerProps) {
    const scale = size / 64; // Original SVG is 64x64

    // Determine availability status
    const getAvailabilityStatus = () => {
        if (!connections || connections.length === 0) return 'unknown';

        const operationalConnections = connections.filter(c => c.status === 'Operational');
        const availableConnections = connections.filter(c => c.status === 'Available');

        if (availableConnections.length > 0) return 'available'; // At least one available
        if (operationalConnections.length > 0) return 'busy'; // Operational but busy
        return 'unavailable'; // Out of order
    };

    // Determine power tier
    const getPowerTier = () => {
        if (!connections || connections.length === 0) return 'unknown';

        const maxPower = Math.max(...connections.map(c => c.powerKW || 0));

        if (maxPower >= 100) return 'ultra-fast'; // ≥100 kW
        if (maxPower >= 50) return 'fast'; // 50-99 kW
        if (maxPower >= 22) return 'standard'; // 22-49 kW
        if (maxPower >= 7) return 'slow'; // 7-21 kW
        return 'unknown';
    };

    const availabilityStatus = getAvailabilityStatus();
    const powerTier = getPowerTier();

    // Status colors (primary - availability)
    const statusColors = {
        available: '#10b981', // 🟢 Green - At least one charger available
        busy: '#f59e0b',      // 🟡 Yellow/Amber - All chargers busy but operational
        unavailable: '#ef4444', // 🔴 Red - Out of order / unavailable
        unknown: '#6b7280'    // ⚪ Gray - Unknown status
    };

    // Power tier colors (secondary - power level)
    const powerColors = {
        'slow': '#93c5fd',       // 🔵 Light Blue - Slow AC (7 kW)
        'standard': '#3b82f6',   // 🔵 Blue - Standard AC (22 kW)
        'fast': '#8b5cf6',       // 🟣 Purple - Fast DC (50 kW)
        'ultra-fast': '#f97316', // 🟠 Orange - Ultra-Fast DC (≥100 kW)
        'unknown': '#6b7280'     // Gray - Unknown
    };

    const pinColor = statusColors[availabilityStatus];
    const powerRingColor = powerColors[powerTier];
    const boltColor = '#ffffff';
    const strokeColor = '#00000022';
    const badgeColor = '#111827';
    const badgeTextColor = '#ffffff';

    return (
        <View style={{ width: size, height: size }}>
            <Svg width={size} height={size} viewBox="0 0 64 64">
                <Defs>
                    <Filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <FeGaussianBlur in="SourceAlpha" stdDeviation="1.6" result="blur" />
                        <FeOffset dy="1.2" result="off" />
                        <FeMerge>
                            <FeMergeNode in="off" />
                            <FeMergeNode in="SourceGraphic" />
                        </FeMerge>
                    </Filter>
                </Defs>

                {/* Pin body (status color) */}
                <Path
                    filter="url(#softShadow)"
                    d="M32 6 C20 6 10 14 10 26 c0 15 22 36 22 36 s22-21 22-36 C54 14 44 6 32 6z"
                    fill={pinColor}
                    stroke={strokeColor}
                    strokeWidth="1"
                />

                {/* Inner pin body (power tier color) */}
                <Path
                    d="M32 10 C22 10 14 16 14 26 c0 13 18 30 18 30 s18-17 18-30 C50 16 42 10 32 10z"
                    fill={powerRingColor}
                />

                {/* Subtle inner gloss / depth */}
                <Ellipse
                    cx="32"
                    cy="22"
                    rx="14"
                    ry="7"
                    fill="white"
                    opacity="0.08"
                />

                {/* EV Station Icon */}
                <G transform="translate(15,44) scale(0.035, 0.035)">
                    <Path
                        fill={boltColor}
                        d="m340-200 100-160h-60v-120L280-320h60v120ZM240-560h240v-200H240v200Zm0 360h240v-280H240v280Zm-80 80v-640q0-33 23.5-56.5T240-840h240q33 0 56.5 23.5T560-760v280h50q29 0 49.5 20.5T680-410v185q0 17 14 31t31 14q18 0 31.5-14t13.5-31v-375h-10q-17 0-28.5-11.5T720-640v-80h20v-60h40v60h40v-60h40v60h20v80q0 17-11.5 28.5T840-600h-10v375q0 42-30.5 73.5T725-120q-43 0-74-31.5T620-225v-185q0-5-2.5-7.5T610-420h-50v300H160Zm320-80H240h240Z"
                    />
                </G>

                

                
            </Svg>
        </View>
    );
}
