-- HeadwatersAI Database Schema
-- Production D1 Database

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'enthusiast', 'professional', 'enterprise')),
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Saved locations for users
CREATE TABLE IF NOT EXISTS saved_locations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    watershed_huc12 TEXT,
    address TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Cached watershed boundaries from USGS NHD
CREATE TABLE IF NOT EXISTS watersheds (
    huc12 TEXT PRIMARY KEY,
    huc10 TEXT NOT NULL,
    huc8 TEXT NOT NULL,
    huc6 TEXT NOT NULL,
    huc4 TEXT NOT NULL,
    huc2 TEXT NOT NULL,
    name TEXT NOT NULL,
    area_sq_km REAL,
    states TEXT,
    centroid_lat REAL,
    centroid_lng REAL,
    boundary_geojson TEXT,
    upstream_huc12s TEXT,
    downstream_huc12 TEXT,
    total_upstream_area_sq_km REAL,
    cached_at TEXT DEFAULT (datetime('now'))
);

-- USGS stream gauge stations
CREATE TABLE IF NOT EXISTS stream_gauges (
    site_id TEXT PRIMARY KEY,
    site_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    huc12 TEXT REFERENCES watersheds(huc12),
    state_code TEXT,
    county TEXT,
    drainage_area_sq_mi REAL,
    datum_elevation_ft REAL,
    site_type TEXT,
    agency TEXT DEFAULT 'USGS',
    active INTEGER DEFAULT 1,
    cached_at TEXT DEFAULT (datetime('now'))
);

-- Real-time gauge readings (cached)
CREATE TABLE IF NOT EXISTS gauge_readings (
    id TEXT PRIMARY KEY,
    site_id TEXT NOT NULL REFERENCES stream_gauges(site_id) ON DELETE CASCADE,
    timestamp TEXT NOT NULL,
    discharge_cfs REAL,
    gage_height_ft REAL,
    water_temp_celsius REAL,
    dissolved_oxygen_mg_l REAL,
    ph REAL,
    specific_conductance REAL,
    turbidity_ntu REAL,
    cached_at TEXT DEFAULT (datetime('now')),
    UNIQUE(site_id, timestamp)
);

-- EPA regulated facilities
CREATE TABLE IF NOT EXISTS epa_facilities (
    registry_id TEXT PRIMARY KEY,
    facility_name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    huc12 TEXT REFERENCES watersheds(huc12),
    street_address TEXT,
    city TEXT,
    state_code TEXT,
    zip_code TEXT,
    facility_type TEXT,
    naics_codes TEXT,
    sic_codes TEXT,
    npdes_permit_ids TEXT,
    is_major_discharger INTEGER DEFAULT 0,
    compliance_status TEXT,
    last_inspection_date TEXT,
    violations_last_3_years INTEGER DEFAULT 0,
    cached_at TEXT DEFAULT (datetime('now'))
);

-- EPA discharge permits (NPDES)
CREATE TABLE IF NOT EXISTS discharge_permits (
    permit_id TEXT PRIMARY KEY,
    registry_id TEXT NOT NULL REFERENCES epa_facilities(registry_id) ON DELETE CASCADE,
    permit_type TEXT,
    issue_date TEXT,
    expiration_date TEXT,
    permitted_flow_mgd REAL,
    receiving_water TEXT,
    permit_status TEXT,
    major_minor TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
);

-- Water rights (state-specific data)
CREATE TABLE IF NOT EXISTS water_rights (
    id TEXT PRIMARY KEY,
    state TEXT NOT NULL,
    water_right_id TEXT NOT NULL,
    priority_date TEXT,
    owner_name TEXT,
    source_name TEXT,
    source_type TEXT CHECK (source_type IN ('surface', 'groundwater', 'spring', 'reservoir')),
    latitude REAL,
    longitude REAL,
    huc12 TEXT REFERENCES watersheds(huc12),
    decreed_amount REAL,
    decreed_units TEXT,
    use_type TEXT,
    status TEXT,
    adjudication_date TEXT,
    cached_at TEXT DEFAULT (datetime('now')),
    UNIQUE(state, water_right_id)
);

-- User alerts configuration
CREATE TABLE IF NOT EXISTS user_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location_id TEXT REFERENCES saved_locations(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('flood', 'low_flow', 'water_quality', 'contamination')),
    threshold_value REAL,
    threshold_unit TEXT,
    notify_email INTEGER DEFAULT 1,
    notify_push INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Alert history
CREATE TABLE IF NOT EXISTS alert_history (
    id TEXT PRIMARY KEY,
    alert_id TEXT NOT NULL REFERENCES user_alerts(id) ON DELETE CASCADE,
    triggered_at TEXT NOT NULL,
    value_at_trigger REAL,
    message TEXT,
    acknowledged INTEGER DEFAULT 0,
    acknowledged_at TEXT
);

-- NOAA weather data cache
CREATE TABLE IF NOT EXISTS weather_cache (
    grid_id TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    forecast_json TEXT,
    hourly_forecast_json TEXT,
    alerts_json TEXT,
    cached_at TEXT DEFAULT (datetime('now'))
);

-- Precipitation observations
CREATE TABLE IF NOT EXISTS precipitation_observations (
    id TEXT PRIMARY KEY,
    station_id TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    observation_time TEXT NOT NULL,
    precipitation_in REAL,
    precipitation_1hr_in REAL,
    precipitation_24hr_in REAL,
    cached_at TEXT DEFAULT (datetime('now')),
    UNIQUE(station_id, observation_time)
);

-- API request logging for rate limiting and analytics
CREATE TABLE IF NOT EXISTS api_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_saved_locations_user ON saved_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_watersheds_huc8 ON watersheds(huc8);
CREATE INDEX IF NOT EXISTS idx_watersheds_huc10 ON watersheds(huc10);
CREATE INDEX IF NOT EXISTS idx_stream_gauges_huc12 ON stream_gauges(huc12);
CREATE INDEX IF NOT EXISTS idx_stream_gauges_location ON stream_gauges(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_gauge_readings_site ON gauge_readings(site_id);
CREATE INDEX IF NOT EXISTS idx_gauge_readings_time ON gauge_readings(timestamp);
CREATE INDEX IF NOT EXISTS idx_epa_facilities_huc12 ON epa_facilities(huc12);
CREATE INDEX IF NOT EXISTS idx_epa_facilities_location ON epa_facilities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_water_rights_huc12 ON water_rights(huc12);
CREATE INDEX IF NOT EXISTS idx_water_rights_state ON water_rights(state);
CREATE INDEX IF NOT EXISTS idx_water_rights_priority ON water_rights(priority_date);
CREATE INDEX IF NOT EXISTS idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_created ON api_logs(created_at);