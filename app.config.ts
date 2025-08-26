import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => ({
    name: config.name ?? "ev-charger-map-cy",
    slug: config.slug ?? "ev-charger-map-cy",
    ...config,
    ios: {
      ...(config.ios ?? {}),
      bundleIdentifier: "com.yourname.evchargermapcy",
      config: {
        googleMapsApiKey: process.env.MAPS_IOS_KEY
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription: "We use your location to show nearby chargers.",
        ITSAppUsesNonExemptEncryption: false
      }
    }
  });
  