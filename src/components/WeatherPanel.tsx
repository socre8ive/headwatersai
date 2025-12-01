"use client";

interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation: number | null;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  icon: string;
}

interface WeatherAlert {
  id: string;
  areaDesc: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
  headline: string;
  description: string;
  instruction: string | null;
  onset: string;
  expires: string;
  senderName: string;
}

interface WeatherData {
  forecast?: {
    updated: string;
    periods: ForecastPeriod[];
  };
  alerts?: WeatherAlert[];
}

interface WeatherPanelProps {
  weather: WeatherData | null;
  isLoading?: boolean;
}

export default function WeatherPanel({ weather, isLoading }: WeatherPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weather</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Weather</h2>
        <div className="text-center text-gray-500 py-8">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <p className="text-sm">Select a location to view weather data</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case "extreme":
        return "bg-red-600 text-white";
      case "severe":
        return "bg-orange-500 text-white";
      case "moderate":
        return "bg-yellow-500 text-gray-900";
      case "minor":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getWeatherIcon = (forecast: string, isDaytime: boolean): string => {
    const lowerForecast = forecast.toLowerCase();
    if (lowerForecast.includes("thunder") || lowerForecast.includes("storm")) return "⛈️";
    if (lowerForecast.includes("rain") || lowerForecast.includes("shower")) return "🌧️";
    if (lowerForecast.includes("snow")) return "❄️";
    if (lowerForecast.includes("cloud") || lowerForecast.includes("overcast")) return "☁️";
    if (lowerForecast.includes("partly")) return isDaytime ? "⛅" : "☁️";
    if (lowerForecast.includes("fog") || lowerForecast.includes("mist")) return "🌫️";
    if (lowerForecast.includes("wind")) return "💨";
    return isDaytime ? "☀️" : "🌙";
  };

  const formatAlertTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const hasAlerts = weather.alerts && weather.alerts.length > 0;
  const hasForecast = weather.forecast && weather.forecast.periods.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-sky-600 to-sky-700 px-6 py-4">
        <h2 className="text-lg font-bold text-white">Weather</h2>
        {weather.forecast && (
          <p className="text-sky-100 text-sm mt-1">
            Updated: {new Date(weather.forecast.updated).toLocaleTimeString()}
          </p>
        )}
      </div>

      {hasAlerts && (
        <div className="border-b border-gray-200">
          <div className="bg-red-50 px-4 py-2 border-b border-red-100">
            <p className="text-sm font-semibold text-red-800">
              ⚠️ {weather.alerts!.length} Active Alert{weather.alerts!.length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {weather.alerts!.map((alert) => (
              <div key={alert.id} className="p-4 border-b border-gray-100 last:border-b-0">
                <div className="flex items-start gap-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getSeverityColor(
                      alert.severity
                    )}`}
                  >
                    {alert.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900">{alert.event}</h4>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{alert.headline}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span>From: {formatAlertTime(alert.onset)}</span>
                      <span>Until: {formatAlertTime(alert.expires)}</span>
                    </div>
                    {alert.instruction && (
                      <p className="text-xs text-orange-700 mt-2 bg-orange-50 p-2 rounded">
                        {alert.instruction.length > 200
                          ? alert.instruction.substring(0, 200) + "..."
                          : alert.instruction}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasForecast && (
        <div className="p-4">
          <div className="grid grid-cols-1 gap-3">
            {weather.forecast!.periods.slice(0, 6).map((period) => (
              <div
                key={period.number}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  period.isDaytime ? "bg-sky-50" : "bg-slate-50"
                }`}
              >
                <div className="text-3xl">
                  {getWeatherIcon(period.shortForecast, period.isDaytime)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-gray-900">{period.name}</h4>
                    <span className="text-lg font-bold text-gray-900">
                      {period.temperature}°{period.temperatureUnit}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{period.shortForecast}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-500">
                    <span>💨 {period.windSpeed} {period.windDirection}</span>
                    {period.probabilityOfPrecipitation !== null && (
                      <span>💧 {period.probabilityOfPrecipitation}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasAlerts && !hasForecast && (
        <div className="p-6 text-center text-gray-500">
          <p className="text-sm">No weather data available</p>
        </div>
      )}
    </div>
  );
}