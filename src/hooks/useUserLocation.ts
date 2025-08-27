import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

type UseUserLocationResult = {
	status: Location.PermissionStatus | null;
	coords: Location.LocationObjectCoords | null;
};

export const useUserLocation = (): UseUserLocationResult => {
	const isMountedRef = useRef(true);
	const [status, setStatus] = useState<Location.PermissionStatus | null>(null);
	const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);

	useEffect(() => {
		isMountedRef.current = true;

		const requestAndFetch = async () => {
			try {
				const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
				if (!isMountedRef.current) return;
				setStatus(permissionStatus);

				if (permissionStatus === 'granted') {
					const position = await Location.getCurrentPositionAsync({});
					if (!isMountedRef.current) return;
					setCoords(position.coords);
				}
			} catch {
				// Silently ignore errors; consumers can check for nulls
			}
		};

		requestAndFetch();

		return () => {
			isMountedRef.current = false;
		};
	}, []);

	return { status, coords };
};

export default useUserLocation;


