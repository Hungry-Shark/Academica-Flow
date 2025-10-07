# NEP 2020 Compliant Timetable System - Database Schema

## Overview

This comprehensive database schema is designed to support the National Education Policy (NEP) 2020 requirements for higher education institutions. It provides multi-tenant support, choice-based credit system (CBCS), and flexible timetable generation with comprehensive constraint management.

## Key NEP 2020 Compliance Features

### 1. Choice-Based Credit System (CBCS)
- **Flexible Subject Selection**: Students can choose from core, elective, and skill-based subjects
- **Credit Distribution**: Enforced 60% core, 30% elective, 10% skill-based subject distribution
- **Prerequisites Management**: Tracks subject prerequisites and dependencies
- **Cross-Department Electives**: Support for interdisciplinary learning

### 2. Multi-Disciplinary Education
- **Interdisciplinary Courses**: Support for courses spanning multiple departments
- **Flexible Department Structure**: Easy addition of new departments and specializations
- **Cross-Department Faculty**: Faculty can teach across departments

### 3. Continuous Assessment
- **Flexible Assessment Weights**: Configurable continuous assessment vs end-semester exam ratios
- **Multiple Assessment Types**: Support for various evaluation methods
- **Grade Tracking**: Comprehensive grade and credit tracking

## Database Schema Structure

### Core Organizational Structure

#### Organizations
- Multi-tenant architecture supporting multiple institutions
- NEP-specific settings and configurations
- Institution type classification (University, College, Institute, School)

#### Academic Years & Semesters
- Flexible academic year management
- Support for odd/even semester system
- Year-wise and semester-wise timetable generation

#### Departments
- Department-based organization
- NEP category classification
- Head of Department (HOD) management

### People Management

#### Faculty
- **Specializations**: Areas of expertise for flexible assignment
- **NEP Categories**: Categories they can teach (core, elective, skill-based)
- **Workload Management**: Maximum hours per week tracking
- **Availability**: Time-based availability windows
- **Cross-Department Teaching**: Support for interdisciplinary instruction

#### Students
- **Credit Tracking**: Real-time credit accumulation
- **NEP Distribution**: Automatic tracking of core/elective/skill-based credits
- **Enrollment Management**: Subject enrollment and grade tracking
- **Year/Semester Progression**: Academic progression tracking

### Academic Content

#### Subjects
- **NEP Classification**: Core, Elective, Skill-based, Foundation, Interdisciplinary
- **Credit System**: L-T-P (Lecture-Tutorial-Practical) format
- **Prerequisites**: Subject dependency management
- **Assessment Configuration**: Flexible assessment weight distribution
- **Multi-Year Offering**: Subjects can be offered across multiple years

#### Subject-Faculty Mapping
- **Primary/Co-Instructor**: Support for multiple instructors per subject
- **Teaching Capability**: Faculty-subject compatibility tracking

### Infrastructure

#### Rooms
- **Capacity Management**: Student capacity per room
- **Equipment Tracking**: Required equipment and features
- **Accessibility**: Support for differently-abled students
- **Availability Windows**: Time-based room availability

#### Time Slots
- **Flexible Scheduling**: Organization-specific time slot definitions
- **Daily/Weekly Patterns**: Support for different scheduling patterns
- **Duration Management**: Variable class durations

### Constraint Management

#### Comprehensive Constraint System
- **Faculty Constraints**: Workload limits, availability, back-to-back restrictions
- **Room Constraints**: Capacity, equipment, double-booking prevention
- **Student Constraints**: Credit limits, schedule conflicts, lunch breaks
- **Academic Constraints**: Prerequisites, subject conflicts, NEP compliance
- **Institutional Constraints**: Department preferences, cross-department rules

### Timetable Generation

#### Timetable Structure
- **Multi-Level Timetables**: Institution, department, year, semester level
- **Version Control**: Timetable versioning and history
- **Conflict Tracking**: Comprehensive conflict detection and resolution
- **Optimization Scoring**: AI-powered optimization with scoring

#### Timetable Slots
- **Detailed Scheduling**: Subject, faculty, room, time assignment
- **Class Types**: Lecture, Tutorial, Practical, Laboratory, Seminar, Project
- **Online Support**: Hybrid and online class support
- **Conflict Management**: Real-time conflict detection and reporting

## NEP 2020 Specific Features

### 1. Credit Distribution Enforcement
```sql
-- Example: Ensure 60-30-10 distribution
SELECT 
  student_id,
  (core_credits_earned * 100.0 / total_credits_earned) as core_percentage,
  (elective_credits_earned * 100.0 / total_credits_earned) as elective_percentage,
  (skill_credits_earned * 100.0 / total_credits_earned) as skill_percentage
FROM students 
WHERE total_credits_earned > 0;
```

### 2. Faculty Workload Management
```sql
-- Example: Check faculty workload compliance
SELECT 
  f.employee_id,
  f.max_hours_per_week,
  f.current_workload,
  (f.current_workload * 100.0 / f.max_hours_per_week) as workload_percentage
FROM faculties f
WHERE f.current_workload > f.max_hours_per_week;
```

### 3. Room Utilization Optimization
```sql
-- Example: Room utilization analysis
SELECT 
  r.name,
  r.capacity,
  COUNT(ts.id) as scheduled_slots,
  (COUNT(ts.id) * 100.0 / 40) as utilization_percentage -- Assuming 40 slots per week
FROM rooms r
LEFT JOIN timetable_slots ts ON r.id = ts.room_id
GROUP BY r.id, r.name, r.capacity;
```

## Data Relationships

### Key Relationships
1. **Organization** → **Departments** → **Faculty/Students**
2. **Subjects** → **SubjectFaculty** → **Faculty**
3. **Students** → **Enrollments** → **Subjects**
4. **Timetables** → **TimetableSlots** → **Subjects/Faculty/Rooms/TimeSlots**
5. **Constraints** → **Timetables** (Applied during generation)

### Junction Tables
- **SubjectFaculty**: Many-to-many relationship between subjects and faculty
- **Enrollments**: Student subject enrollment tracking
- **TimetableFaculty/Student/Subject/Room**: Timetable participation tracking

## Indexing Strategy

### Primary Indexes
- All primary keys (id fields)
- Unique constraints (email, roll_number, employee_id, etc.)
- Foreign key relationships

### Performance Indexes
```sql
-- Faculty workload queries
CREATE INDEX idx_faculty_workload ON faculties(organization_id, current_workload);

-- Student credit tracking
CREATE INDEX idx_student_credits ON students(organization_id, total_credits_earned);

-- Timetable generation queries
CREATE INDEX idx_timetable_slots ON timetable_slots(timetable_id, day_of_week, start_time);

-- Room availability
CREATE INDEX idx_room_availability ON room_availability(room_id, day_of_week, is_available);

-- Faculty availability
CREATE INDEX idx_faculty_availability ON faculty_availability(faculty_id, day_of_week, is_available);
```

## Security Considerations

### Data Privacy
- Personal information encryption
- Role-based access control
- Audit logging for all changes
- GDPR compliance features

### Multi-Tenancy
- Organization-level data isolation
- Tenant-specific configurations
- Cross-tenant data protection

## Scalability Features

### Horizontal Scaling
- Organization-based partitioning
- Read replicas for reporting
- Caching strategies for frequently accessed data

### Performance Optimization
- Efficient constraint checking algorithms
- Optimized timetable generation queries
- Real-time conflict detection
- Background processing for heavy operations

## Migration Strategy

### Phase 1: Core Structure
1. Organizations, Departments, Academic Years
2. Basic Faculty and Student management
3. Subject and Room management

### Phase 2: NEP Compliance
1. NEP settings and configurations
2. Credit tracking and distribution
3. Prerequisites and constraints

### Phase 3: Advanced Features
1. Timetable generation engine
2. Conflict resolution algorithms
3. Optimization and scoring

### Phase 4: Analytics & Reporting
1. Performance metrics
2. Utilization reports
3. Compliance monitoring

## API Integration Points

### Timetable Generation API
- Constraint-based optimization
- Real-time conflict detection
- Multi-objective optimization (faculty workload, room utilization, student preferences)

### NEP Compliance API
- Credit distribution validation
- Prerequisite checking
- Assessment weight validation

### Reporting API
- Faculty workload reports
- Room utilization analysis
- Student progress tracking
- NEP compliance monitoring

## Future Enhancements

### AI/ML Integration
- Predictive analytics for room utilization
- Faculty workload optimization
- Student success prediction
- Automated conflict resolution

### Advanced Features
- Mobile app support
- Real-time notifications
- Integration with learning management systems
- Advanced reporting and analytics

This schema provides a robust foundation for NEP 2020 compliant timetable management while maintaining flexibility for future enhancements and institutional-specific requirements.

