-- Database Schema for HostelConnect

-- Role-Based Access Control (RBAC) System
-- Support for Multi-Hostel Environments

-- 1. HOSTEL TABLE
-- Stores information about each hostel institution.
CREATE TABLE hostels (
    hostel_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name VARCHAR(255) NOT NULL,
    admin_name VARCHAR(255) NOT NULL,
    admin_phone VARCHAR(20) NOT NULL,
    admin_email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS TABLE
-- Stores profile and authentication information for Students, Workers, and Admins.
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Securely hashed password
    role VARCHAR(20) CHECK (role IN ('student', 'worker', 'admin')) NOT NULL,
    hostel_id UUID REFERENCES hostels(hostel_id) ON DELETE CASCADE,
    phone_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. HOSTEL_CODES TABLE
-- Stores unique join codes for each hostel.
CREATE TABLE hostel_codes (
    code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID UNIQUE REFERENCES hostels(hostel_id) ON DELETE CASCADE,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    worker_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. COMPLAINT TABLE
-- Managed through an SLA-based system.
CREATE TABLE complaints (
    complaint_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    worker_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    hostel_id UUID REFERENCES hostels(hostel_id) ON DELETE CASCADE,
    complaint_type VARCHAR(50) NOT NULL, -- e.g., electrical, water, cleaning
    description TEXT NOT NULL,
    status VARCHAR(20) CHECK (status IN ('Pending', 'In Progress', 'Completed')) DEFAULT 'Pending',
    created_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sla_deadline TIMESTAMP WITH TIME ZONE NOT NULL, -- Calculated based on type
    completed_time TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for performance and multi-tenant isolation
CREATE INDEX idx_users_hostel ON users(hostel_id);
CREATE INDEX idx_complaints_hostel ON complaints(hostel_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_hostel_codes_lookup ON hostel_codes(hostel_id);
