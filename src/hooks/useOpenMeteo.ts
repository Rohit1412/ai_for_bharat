import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const DIRECT_URLS: Record<string, string> = {
  "air-quality": "https://air-quality-api.open-meteo.com/v1/air-quality",
  climate: "https://climate-api.open-meteo.com/v1/climate",
  forecast: "https://api.open-meteo.com/v1/forecast",
  archive: "https://archive-api.open-meteo.com/v1/archive",
};

async function callOpenMeteoDirect(apiType: string, params: Record<string, any>) {
  const baseUrl = DIRECT_URLS[apiType];
  if (!baseUrl) throw new Error(`Unknown API type: ${apiType}`);
  const queryParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      queryParams.set(key, String(value));
    }
  }
  const resp = await fetch(`${baseUrl}?${queryParams}`);
  if (!resp.ok) throw new Error(`Open-Meteo returned ${resp.status}`);
  return resp.json();
}

async function callOpenMeteo(apiType: string, params: Record<string, any>) {
  // Try edge function first, fall back to direct API call
  try {
    const { data, error } = await supabase.functions.invoke("open-meteo", {
      body: { apiType, params },
    });
    if (error) throw error;
    return data;
  } catch {
    // Edge function unavailable — call Open-Meteo directly (no API key needed)
    return callOpenMeteoDirect(apiType, params);
  }
}

// --- Response types ---

export interface AirQualityCurrent {
  pm10: number | null;
  pm2_5: number | null;
  carbon_monoxide: number | null;
  nitrogen_dioxide: number | null;
  sulphur_dioxide: number | null;
  ozone: number | null;
  uv_index: number | null;
}

export interface AirQualityHourly {
  time: string[];
  pm2_5: (number | null)[];
  pm10: (number | null)[];
  ozone: (number | null)[];
  nitrogen_dioxide: (number | null)[];
}

export interface AirQualityResponse {
  current: AirQualityCurrent;
  hourly: AirQualityHourly;
  current_units: Record<string, string>;
}

export interface ClimateProjectionResponse {
  daily: {
    time: string[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    precipitation_sum: (number | null)[];
  };
}

export interface WeatherForecastCurrent {
  temperature_2m: number | null;
  relative_humidity_2m: number | null;
  wind_speed_10m: number | null;
  weather_code: number | null;
}

export interface WeatherForecastDaily {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  precipitation_sum: (number | null)[];
  weather_code: (number | null)[];
}

export interface WeatherForecastResponse {
  current: WeatherForecastCurrent;
  daily: WeatherForecastDaily;
}

// --- Hooks ---

export const useAirQuality = (latitude: number, longitude: number) => {
  return useQuery<AirQualityResponse>({
    queryKey: ["open-meteo", "air-quality", latitude, longitude],
    queryFn: () =>
      callOpenMeteo("air-quality", {
        latitude,
        longitude,
        current: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,uv_index",
        hourly: "pm2_5,pm10,ozone,nitrogen_dioxide",
        forecast_days: 1,
      }),
    staleTime: 1000 * 60 * 5,
    retry: 2,
    enabled: latitude !== 0 && longitude !== 0,
  });
};

export const useWeatherForecast = (latitude: number, longitude: number) => {
  return useQuery<WeatherForecastResponse>({
    queryKey: ["open-meteo", "forecast", latitude, longitude],
    queryFn: () =>
      callOpenMeteo("forecast", {
        latitude,
        longitude,
        current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
        forecast_days: 7,
        timezone: "auto",
      }),
    staleTime: 1000 * 60 * 15,
    retry: 2,
    enabled: latitude !== 0 && longitude !== 0,
  });
};

export const useClimateProjection = (
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  models = "EC_Earth3P_HR,MRI_AGCM3_2_S"
) => {
  return useQuery<ClimateProjectionResponse>({
    queryKey: ["open-meteo", "climate", latitude, longitude, startDate, endDate],
    queryFn: () =>
      callOpenMeteo("climate", {
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        models,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_sum",
      }),
    staleTime: 1000 * 60 * 60 * 24,
    retry: 2,
    enabled: latitude !== 0 && longitude !== 0,
  });
};
