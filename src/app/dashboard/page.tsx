"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  subscriptionTier: string;
  createdAt: string;
}

interface SavedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  watershedHuc12: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
}

interface Alert {
  id: string;
  locationId: string | null;
  locationName: string | null;
  alertType: string;
  thresholdValue: number | null;
  thresholdUnit: string | null;
  notifyEmail: boolean;
  active: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"locations" | "alerts">("locations");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch("/api/auth/me");
        if (!userRes.ok) {
          router.push("/login");
          return;
        }
        const userData = await userRes.json();
        setUser(userData.user);

        const locationsRes = await fetch("/api/locations");
        if (locationsRes.ok) {
          const locationsData = await locationsRes.json();
          setLocations(locationsData.locations);
        }

        if (userData.user.subscriptionTier !== "free") {
          const alertsRes = await fetch("/api/alerts");
          if (alertsRes.ok) {
            const alertsData = await alertsRes.json();
            setAlerts(alertsData.alerts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm("Are you sure you want to delete this location?")) return;

    try {
      const response = await fetch(`/api/locations?id=${locationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setLocations(locations.filter((loc) => loc.id !== locationId));
      }
    } catch (error) {
      console.error("Failed to delete location:", error);
    }
  };

  const handleToggleAlert = async (alertId: string, active: boolean) => {
    try {
      const response = await fetch("/api/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: alertId, active: !active }),
      });

      if (response.ok) {
        setAlerts(
          alerts.map((alert) =>
            alert.id === alertId ? { ...alert, active: !active } : alert
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle alert:", error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm("Are you sure you want to delete this alert?")) return;

    try {
      const response = await fetch(`/api/alerts?id=${alertId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAlerts(alerts.filter((alert) => alert.id !== alertId));
      }
    } catch (error) {
      console.error("Failed to delete alert:", error);
    }
  };

  const getTierInfo = (tier: string) => {
    const tiers: Record<string, { color: string; maxLocations: number; hasAlerts: boolean }> = {
      free: { color: "bg-gray-100 text-gray-800", maxLocations: 3, hasAlerts: false },
      enthusiast: { color: "bg-green-100 text-green-800", maxLocations: 10, hasAlerts: true },
      professional: { color: "bg-blue-100 text-blue-800", maxLocations: 100, hasAlerts: true },
      enterprise: { color: "bg-purple-100 text-purple-800", maxLocations: 1000, hasAlerts: true },
    };
    return tiers[tier] || tiers.free;
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      flood: "🌊 Flood Warning",
      low_flow: "💧 Low Flow",
      water_quality: "🧪 Water Quality",
      contamination: "☢️ Contamination",
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const tierInfo = getTierInfo(user.subscriptionTier);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Welcome back, {user.fullName || user.email.split("@")[0]}
                </h1>
                <p className="text-blue-100 mt-1">Manage your saved locations and alerts</p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${tierInfo.color}`}
                >
                  {user.subscriptionTier} Plan
                </span>
                {user.subscriptionTier === "free" && (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Upgrade
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-gray-200 border-b border-gray-200">
            <div className="px-6 py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
              <p className="text-sm text-gray-500">Saved Locations</p>
            </div>
            <div className="px-6 py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{tierInfo.maxLocations}</p>
              <p className="text-sm text-gray-500">Location Limit</p>
            </div>
            <div className="px-6 py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              <p className="text-sm text-gray-500">Active Alerts</p>
            </div>
            <div className="px-6 py-4 text-center">
              <p className="text-2xl font-bold text-gray-900">
                {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </p>
              <p className="text-sm text-gray-500">Member Since</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("locations")}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "locations"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                📍 Saved Locations ({locations.length})
              </button>
              <button
                onClick={() => setActiveTab("alerts")}
                disabled={!tierInfo.hasAlerts}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === "alerts"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                } ${!tierInfo.hasAlerts ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                🔔 Alerts ({alerts.length})
                {!tierInfo.hasAlerts && (
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                    Upgrade
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "locations" && (
              <>
                {locations.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved locations</h3>
                    <p className="text-gray-500 mb-6">
                      Start by exploring the map and saving locations you want to monitor.
                    </p>
                    <Link
                      href="/explore"
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      Explore the Map
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {locations.map((location) => (
                      <div
                        key={location.id}
                        className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-900 truncate flex-1">
                            {location.name}
                          </h3>
                          <button
                            onClick={() => handleDeleteLocation(location.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                        {location.address && (
                          <p className="text-sm text-gray-500 mb-2 truncate">{location.address}</p>
                        )}
                        <p className="text-xs text-gray-400 font-mono mb-3">
                          {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
                        </p>
                        {location.watershedHuc12 && (
                          <p className="text-xs text-blue-600 mb-3">
                            HUC-12: {location.watershedHuc12}
                          </p>
                        )}
                        <Link
                          href={`/explore?lat=${location.latitude}&lng=${location.longitude}`}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          View on Map
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "alerts" && tierInfo.hasAlerts && (
              <>
                {alerts.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 mx-auto text-gray-300 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No alerts configured</h3>
                    <p className="text-gray-500 mb-6">
                      Set up alerts to get notified about floods, low flow, and water quality issues.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`border rounded-xl p-4 ${
                          alert.active ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">
                                {getAlertTypeLabel(alert.alertType)}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  alert.active
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {alert.active ? "Active" : "Paused"}
                              </span>
                            </div>
                            {alert.locationName && (
                              <p className="text-sm text-gray-600">📍 {alert.locationName}</p>
                            )}
                            {alert.thresholdValue && (
                              <p className="text-sm text-gray-500 mt-1">
                                Threshold: {alert.thresholdValue} {alert.thresholdUnit}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAlert(alert.id, alert.active)}
                              className={`p-2 rounded-lg transition-colors ${
                                alert.active
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              }`}
                            >
                              {alert.active ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}