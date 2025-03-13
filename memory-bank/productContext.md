# Product Context: NcReserve

## Problem Statement
Laboratory environments face significant challenges in managing equipment usage efficiently:

1. **Manual Booking Systems**: Traditional paper-based or basic spreadsheet systems are error-prone and difficult to maintain
2. **Scheduling Conflicts**: Without a real-time reservation system, double-bookings and conflicts occur frequently
3. **Equipment Utilization**: Lack of visibility into equipment availability leads to underutilization
4. **User Coordination**: Researchers and staff have limited visibility into when equipment will be available
5. **Administrative Overhead**: Managing equipment access and reservations manually creates unnecessary administrative burden

NcReserve addresses these challenges by providing a centralized, visual, and intuitive system for equipment reservation management.

## User Personas

### Laboratory Administrator
**Name**: Dr. Tanaka
**Role**: Lab Director
**Goals**:
- Ensure efficient use of laboratory equipment
- Minimize conflicts and downtime
- Track equipment usage patterns
- Manage user access and permissions

**Pain Points**:
- Spends too much time resolving scheduling conflicts
- Difficult to track who is using what equipment and when
- Cannot easily plan for maintenance or new equipment purchases based on usage data

### Researcher
**Name**: Yamada-san
**Role**: Senior Researcher
**Goals**:
- Reserve equipment efficiently for experiments
- Plan research schedule based on equipment availability
- Avoid disruptions to experimental work

**Pain Points**:
- Uncertainty about equipment availability
- Time wasted checking physical sign-up sheets
- Experiments delayed due to unexpected equipment unavailability

### Student
**Name**: Suzuki-kun
**Role**: Graduate Student
**Goals**:
- Access necessary equipment for thesis work
- Learn how to use various laboratory equipment
- Complete research tasks within deadlines

**Pain Points**:
- Limited access to equipment due to seniority-based informal systems
- Difficulty planning work around equipment availability
- Confusion about reservation procedures

## User Journey

### Equipment Reservation Flow
1. User logs into the system
2. Views the equipment layout or list
3. Identifies the required equipment
4. Checks availability in the calendar view
5. Opens the reservation window for the specific equipment
6. Selects desired time slots
7. Confirms the reservation
8. Receives confirmation of successful booking

### Equipment Management Flow
1. Administrator logs into the system
2. Accesses the equipment management screen
3. Adds new equipment, edits details, or removes obsolete items
4. Updates equipment specifications and availability
5. Arranges equipment on the visual layout to match physical placement
6. Saves changes to the system

### User Management Flow
1. Administrator logs into the system
2. Accesses the user management screen
3. Reviews existing users
4. Adds new users, edits details, or removes inactive accounts
5. Saves changes to the system

## Functional Requirements

### Authentication and User Management
- Simple login with username and password
- Automatic registration for new usernames
- User profile management
- User listing and administration

### Equipment Management
- Equipment registration with details (name, type, specifications)
- Equipment editing and deletion
- Equipment status tracking (available, in use, under maintenance)
- Visual equipment layout configuration with drag-and-drop functionality
- Text label support for adding annotations to the layout

### Reservation System
- Calendar-based reservation interface
- 30-minute time slot increments from 8:00 to 22:00
- Toggle selection for time slots
- Conflict prevention
- Reservation confirmation and cancellation
- Current usage status display
- Date-based reservation view

### Visualization
- Equipment layout display with real-time status
- All-equipment reservation overview with time slot grid
- Individual equipment reservation details
- Visual indication of current equipment usage

## Non-Functional Requirements

### Usability
- Intuitive interface requiring minimal training
- Responsive design for various devices
- Clear visual indicators for equipment status
- Straightforward reservation process

### Performance
- Quick loading of equipment status and availability
- Real-time updates of reservation status
- Efficient handling of concurrent reservation requests

### Reliability
- Consistent data storage and retrieval
- Prevention of double-bookings
- System availability during laboratory operating hours

### Security
- Basic user authentication
- Data protection for user and reservation information
- Prevention of unauthorized reservation modifications

### Internationalization
- Support for both English and Japanese languages
- Consistent translation across all user interfaces
- Language-appropriate formatting for dates, times, and numbers
- Dual-language documentation (README.md in English, README.ja.md in Japanese)

## User Experience Goals

### Simplicity
The system should be immediately understandable to new users without extensive training. The visual nature of the equipment layout and reservation system should make the process intuitive.

### Efficiency
Users should be able to complete the reservation process in minimal steps. The system should reduce the time spent on administrative tasks related to equipment usage.

### Visibility
The system should provide clear visual indicators of equipment status, availability, and reservations. Users should be able to quickly assess when equipment is available.

### Confidence
Users should feel confident that their reservations are secure and that they will have access to the equipment when needed. The system should eliminate uncertainty in the reservation process.

### Accessibility
The system should be accessible to all laboratory users regardless of technical expertise. The interface should use familiar patterns and clear language.
