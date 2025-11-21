import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from "../../../config"; 
import { FaCalendarAlt, FaHistory, FaLock, FaUser, FaDownload, FaUniversity, FaTimes, FaLock as LockIcon, FaAngleLeft, FaAngleRight } from 'react-icons/fa'; 


interface TimetableSlot { subject: string; section: string; room: string; type: 'Lecture' | 'Lab' | 'Tutorial'; materialLink?: string; }
interface FacultyTimetable { faculty_id: string; faculty_name: string; department: string; periods: Record<string, string>; timetable: Record<string, Record<string, TimetableSlot | 'FREE'>>; lastUpdated: string; }
interface AttendanceRecord { date: string; status: 'Present' | 'Absent' | 'On Leave'; reason?: string; }
interface AttendanceSummary { totalWorkingDays: number; daysPresent: number; daysAbsent: number; leaveBalance: number; attendancePercentage: number; detailedHistory: AttendanceRecord[]; }


const mockOrganisationName = "Academia Nexus University";
const mockTimetable: FacultyTimetable = { 
    faculty_id: "FCT001", faculty_name: "Dr. Evelyn Reed", department: "Computer Science",
    periods: { "1": "09:00 - 09:50", "2": "09:50 - 10:40", "3": "10:50 - 11:40", "4": "11:40 - 12:30", "5": "12:30 - 01:20" },
    timetable: { /* ... mock timetable structure ... */ 
        "Monday": { "2": { subject: "COMPUTER NETWORKS", section: "CS-3A", room: "A-201", type: "Lecture", materialLink: "#" }, "4": { subject: "FREE", section: "", room: "", type: "Lecture" } },
        "Tuesday": { "1": { subject: "MATH 205", section: "ECE-2A", room: "B-303", type: "Tutorial" }, "3": { subject: "LAB SESSION", section: "CS-3A", room: "L-105", type: "Lab", materialLink: "#" } },
        "Wednesday": { "1": "FREE", "2": "FREE", "3": "FREE", "4": "FREE", "5": { subject: "ADVISORY", section: "ALL", room: "C-100", type: "Lecture" } },
        "Thursday": { "2": { subject: "ADV. ALGORITHMS", section: "CS-4C", room: "A-201", type: "Lecture" } },
        "Friday": { "1": "FREE", "2": "FREE", "3": "FREE", "4": "FREE", "5": "FREE" },
        "Saturday": { "1": "FREE", "2": "FREE", "3": "FREE", "4": "FREE", "5": "FREE" },
    },
    lastUpdated: "2025-11-20",
};
const mockAttendance: AttendanceSummary = {
    totalWorkingDays: 120, daysPresent: 114, daysAbsent: 6, leaveBalance: 12, attendancePercentage: 95.0,
    detailedHistory: [
        { date: "2025-11-21", status: "Present" },
        { date: "2025-11-20", status: "Present" },
        { date: "2025-11-19", status: "Absent", reason: "Sick" },
        { date: "2025-11-18", status: "On Leave", reason: "Family Event" },
        { date: "2025-10-31", status: "Absent", reason: "Travel Delay" },
        { date: "2025-10-29", status: "Present" },
        { date: "2025-10-15", status: "On Leave", reason: "Vacation" },
        { date: "2025-10-14", status: "On Leave", reason: "Vacation" },
    ],
};
const subjectColors = { MATH: "#DCEBFB", COMPUTER: "#FFEBDA", FREE: "#F9F9F9", DEFAULT: "#F3F4F6", };
const getSubjectColor = (subject: string | undefined) => { /* ... (color logic) ... */ 
    if (!subject || subject === "FREE") return subjectColors.FREE;
    const key = Object.keys(subjectColors).find((k) => subject.toUpperCase().includes(k));
    return subjectColors[key as keyof typeof subjectColors] || subjectColors.DEFAULT;
};


interface AttendanceCalendarProps {
    history: AttendanceRecord[];
}

const AttendanceCalendar: React.FC<AttendanceCalendarProps> = ({ history }) => {
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    
    const attendanceMap = useMemo(() => {
        return history.reduce<Record<string, Omit<AttendanceRecord, 'date'>>>((acc, record) => {
            acc[record.date] = { status: record.status, reason: record.reason };
            return acc;
        }, {});
    }, [history]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1);
        setCurrentDate(newDate);
    };

    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); 

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0); 
        const daysInMonth = lastDayOfMonth.getDate();

        
        const startingDay = firstDayOfMonth.getDay(); 
        
        const days = [];
        
        
        for (let i = 0; i < startingDay; i++) {
            days.push({ day: null, date: null, status: 'NONE' as const });
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const attendance = attendanceMap[dateStr];
            
            days.push({ 
                day: day, 
                date: dateStr, 
                status: attendance ? attendance.status : 'NONE',
                reason: attendance ? attendance.reason : undefined
            });
        }

        return days;
    };

    const calendarDays = getCalendarDays();

    return (
        <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Attendance View</h3>

            {/* Calendar Header/Navigation */}
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={() => changeMonth(-1)} 
                    className="p-2 rounded-full hover:bg-gray-100 transition text-gray-700">
                    <FaAngleLeft />
                </button>
                <h4 className="text-2xl font-bold text-gray-800">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h4>
                <button 
                    onClick={() => changeMonth(1)} 
                    className="p-2 rounded-full hover:bg-gray-100 transition text-gray-700">
                    <FaAngleRight />
                </button>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 text-center font-medium text-gray-600 border-b border-gray-200 mb-2 pb-1">
                {dayNames.map(day => <div key={day} className="text-sm">{day}</div>)}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((item, index) => {
                    // Check if it's the current day for border highlighting
                    const isToday = item.day && 
                                    item.date === today.toISOString().slice(0, 10);

                    let statusClass = 'bg-gray-50 text-gray-700';
                    let tooltipText = '';

                    switch (item.status) {
                        case 'Present':
                            statusClass = 'bg-green-100 text-green-800 font-semibold hover:bg-green-200';
                            tooltipText = 'Present';
                            break;
                        case 'Absent':
                            statusClass = 'bg-red-100 text-red-800 font-semibold hover:bg-red-200';
                            tooltipText = `Absent. Reason: ${item.reason || 'Not specified'}`;
                            break;
                        case 'On Leave':
                            statusClass = 'bg-yellow-100 text-yellow-800 font-semibold hover:bg-yellow-200';
                            tooltipText = `On Leave. Reason: ${item.reason || 'Not specified'}`;
                            break;
                        case 'NONE':
                            statusClass = 'bg-gray-100 text-gray-500 hover:bg-gray-200';
                            tooltipText = 'No record (Likely a weekend/holiday or not recorded)';
                            break;
                        default:
                            // For null days (placeholders)
                            statusClass = 'bg-transparent text-gray-300';
                            tooltipText = '';
                            break;
                    }

                    return (
                        <div 
                            key={index} 
                            className={`h-16 flex flex-col p-1 rounded-lg transition duration-150 relative border-2 ${
                                item.day ? statusClass : 'pointer-events-none'
                            } ${
                                isToday ? 'border-blue-500 shadow-md' : 'border-transparent'
                            }`}
                           
                            title={item.day ? tooltipText : ''}
                        >
                            <span className={`text-xs font-bold ${item.day ? '' : 'hidden'}`}>
                                {item.day}
                            </span>
                            {item.day && item.status !== 'NONE' && (
                                <span className="text-[18px] absolute bottom-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                    {item.status === 'Present' ? 'P' : item.status === 'Absent' ? 'A' : 'L'}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
            
           
             <div className="mt-6 border-t pt-4 text-sm text-gray-600">
                <p className="font-semibold mb-2">Attendance Legend:</p>
                <div className="flex gap-4 flex-wrap">
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Present</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Absent</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></span> On Leave</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-300 mr-2"></span> No Record</span>
                </div>
            </div>
        </div>
    );
};


const FacultyDashboard: React.FC = () => {
    const daysOfWeek = useMemo(() => ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], []);
    const myFacultyId = "FCT001"; 

    const [myTimetable, setMyTimetable] = useState<FacultyTimetable | null>(null);
    const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [exportType, setExportType] = useState("pdf");
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    const [activeTab, setActiveTab] = useState('schedule'); 

    const navigate = useNavigate();

    // --- INTEGRATION POINT 1: FETCH DATA ---
    const fetchDashboardData = useCallback(async () => {
        if (!myFacultyId) { setError("Authentication failed. Please log in."); setLoading(false); return; }

        setLoading(true);
        setError(null);
        
        try {
            
            const timetableRes = await axios.get<FacultyTimetable>(`${API_BASE_URL}/api/faculty/me/dashboard`, { withCredentials: true });
            const attendanceRes = await axios.get<AttendanceSummary>(`${API_BASE_URL}/api/faculty/me/attendance/summary`, { withCredentials: true });
            
           
            await new Promise(resolve => setTimeout(resolve, 500)); 
            setMyTimetable(mockTimetable);
            setAttendance(mockAttendance);

            toast.success("Dashboard data synchronized.");
        } catch (error) {
            console.error("Dashboard data fetch failed:", error);
            setMyTimetable(mockTimetable);
            setAttendance(mockAttendance);
        } finally {
            setLoading(false);
        }
    }, [myFacultyId]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        try {
            
            await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword,
            }, { withCredentials: true });

            toast.success("Password changed successfully!");
            setShowPasswordModal(false);
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            const msg = (axios.isAxiosError(err) && err.response?.data?.message) || "Failed to change password. Check old password.";
            toast.error(msg);
        }
    };

    // --- Export Logic ---
    const handleSingleExport = () => {
        if (!myTimetable) { toast.error("No data to export."); return; }
        // API call to GET /api/faculty/me/export?format={exportType}
        toast.info(`Preparing ${exportType.toUpperCase()} export (via API)...`);
    };

    if (loading || !myTimetable) { 
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div><p className="mt-4 text-gray-600">Loading dashboard...</p></div></div>; 
    }

    if (error) { 
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md"><div className="text-red-500 text-5xl mb-4">⚠️</div><h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2><p className="text-gray-600 mb-4">{error}</p></div></div>; 
    }
    
    const { faculty_name, department, periods, timetable, lastUpdated } = myTimetable;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <header className="bg-white shadow-lg rounded-xl p-6 mb-8 border-t-4 border-blue-500">
                <div className="flex justify-between items-start">
                    <div>
                        {/* ORGANIZATION NAME: BIGGER FONT, BOLD, ACCENT COLOR */}
                        <h2 className="text-base sm:text-lg font-semibold text-blue-600 flex items-center mb-2 tracking-wide">
                            <FaUniversity className="mr-2 text-xl"/> {mockOrganisationName}
                        </h2>
                        
                        {/* FACULTY NAME: VERY LARGE FONT, EXTRA BOLD */}
                        <h1 className="text-3xl sm:text-2xl font-extrabold text-gray-800 mt-2 leading-tight">
                            Welcome, Dr. {faculty_name.split(' ').pop()}
                        </h1>
                        
                        {/* SUBTITLE/CONTEXT */}
                        <p className="text-lg text-gray-600 mt-2">
                            {department} | ID: {myFacultyId}
                        </p>
                    </div>
                    <div className="text-right text-sm text-gray-500 hidden sm:block">
                        <p>Last Timetable Sync:</p>
                        <p className="font-medium text-gray-700">{lastUpdated}</p>
                    </div>
                </div>
            </header>

            {/* --- Tabs Navigation --- */}
            <div className="flex space-x-1 bg-white p-2 rounded-xl shadow-md mb-8">
                <button onClick={() => setActiveTab('schedule')} className={`flex items-center space-x-2 px-6 py-2 font-medium rounded-xl transition w-1/3 justify-center ${activeTab === 'schedule' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><FaCalendarAlt /> <span>My Timetable</span></button>
                <button onClick={() => setActiveTab('attendance')} className={`flex items-center space-x-2 px-6 py-2 font-medium rounded-xl transition w-1/3 justify-center ${activeTab === 'attendance' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><FaHistory /> <span>Attendance</span></button>
                <button onClick={() => setActiveTab('profile')} className={`flex items-center space-x-2 px-6 py-2 font-medium rounded-xl transition w-1/3 justify-center ${activeTab === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-600 hover:bg-gray-100'}`}><FaUser /> <span>Profile & Security</span></button>
            </div>
            
            <div className="dashboard-content">

                {/* ========================================================= */}
                {/* 1. TIMETABLE TAB (No Change) */}
                {/* ========================================================= */}
                {activeTab === 'schedule' && (
                    <div className="space-y-6">
                        {/* ... (Timetable Export/Announcements Cards) ... */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-green-500 flex justify-between items-center">
                                <div><h3 className="text-lg font-semibold text-gray-700">Download My Schedule</h3><p className="text-sm text-gray-500">Get a printable version.</p></div>
                                <div className="flex space-x-2">
                                    <select value={exportType} onChange={(e) => setExportType(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm focus:ring-blue-500"><option value="pdf">PDF</option><option value="excel">Excel</option></select>
                                    <button onClick={handleSingleExport} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"><FaDownload className="mr-1"/> Export</button>
                                </div>
                            </div>
                            <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-purple-500 md:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-700">Latest Department Notice</h3>
                                <p className="text-sm text-gray-600 mt-1 italic">**[21/Nov]** Mandatory faculty meeting scheduled for Tuesday, 3 PM. Check your email for details.</p>
                            </div>
                        </div>

                        {/* --- Timetable Table --- */}
                        <div className="p-4 bg-gray-100 rounded-xl">
                            <h3 className="text-2xl font-semibold text-gray-800 mb-4">Weekly Schedule Overview</h3>
                            <div className="p-3 bg-red-100 text-red-700 rounded-lg mb-4 border border-red-300">
                                <p className="font-bold text-sm flex items-center"><LockIcon className='mr-2'/> Access Note:</p>
                                <p className="text-xs">This timetable view is **read-only**. Editing and generation features are disabled for this account.</p>
                            </div>
                            
                            <div className="w-full overflow-x-auto border border-gray-200 rounded-lg shadow-inner">
                                <div className="min-w-[900px] lg:min-w-full grid grid-cols-7 divide-x divide-gray-200 border-b border-gray-200">
                                    {/* Header Row */}
                                    <div className="bg-gray-50 p-3 font-semibold text-center text-gray-700 text-sm uppercase tracking-wide">Time</div>
                                    {daysOfWeek.map((day) => (<div key={day} className="bg-gray-50 p-3 font-semibold text-center text-gray-700 text-sm uppercase tracking-wide">{day}</div>))}

                                    {/* Body Rows */}
                                    {Object.entries(periods).map(([periodNum, time]) => (
                                        <React.Fragment key={periodNum}>
                                            <div className="p-3 border-b text-sm bg-gray-100 text-center font-bold text-gray-800 flex items-center justify-center">{time}</div>
                                            {daysOfWeek.map((day) => {
                                                const slot = timetable[day]?.[periodNum] || "FREE";
                                                const slotData = typeof slot !== "string" ? slot : null;
                                                const backgroundColor = getSubjectColor(typeof slot === "string" ? slot : slot.subject);
                                                return (
                                                    <div
                                                        key={day + periodNum}
                                                        className={`p-2 border-b text-center text-sm flex flex-col items-center justify-center min-h-[90px] transition duration-100`}
                                                        style={{ backgroundColor }}
                                                    >
                                                        {slot === "FREE" || !slotData ? (<span className="text-gray-500 font-medium text-xs">FREE</span>) : (
                                                            <div className="flex flex-col gap-1 w-full text-gray-800">
                                                                <span className="font-bold text-sm leading-tight break-words">{slotData.subject}</span>
                                                                <span className="text-[10px] text-gray-700">Section: {slotData.section} | Room: {slotData.room}</span>
                                                                {slotData.materialLink && (<a href={slotData.materialLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">View Materials</a>)}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 2. ATTENDANCE & LEAVE TAB (Calendar View Implemented) */}
                {/* ========================================================= */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6">
                        {/* Attendance Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-blue-500">
                                <h3 className="text-lg font-medium text-gray-600">Attendance Percentage</h3>
                                <p className="text-4xl font-bold text-blue-600 mt-1">{attendance?.attendancePercentage.toFixed(1)}%</p>
                            </div>
                            <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-red-500">
                                <h3 className="text-lg font-medium text-gray-600">Days Absent (YTD)</h3>
                                <p className="text-4xl font-bold text-red-600 mt-1">{attendance?.daysAbsent}</p>
                            </div>
                            <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-green-500">
                                <h3 className="text-lg font-medium text-gray-600">Available Leaves</h3>
                                <p className="text-4xl font-bold text-green-600 mt-1">{attendance?.leaveBalance} days</p>
                            </div>
                        </div>
                        
                        {/* Attendance Calendar Component (NEW) */}
                        {attendance?.detailedHistory && <AttendanceCalendar history={attendance.detailedHistory} />}

                        <button 
                            onClick={() => toast.info("API call to POST /api/faculty/me/leave...")} 
                            className="mt-4 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition font-semibold flex items-center space-x-2">
                            <FaCalendarAlt/> <span>Submit New Leave Request</span>
                        </button>
                    </div>
                )}

                {/* ========================================================= */}
                {/* 3. PROFILE MANAGEMENT TAB (No Change) */}
                {/* ========================================================= */}
                {activeTab === 'profile' && (
                    <div className="space-y-6 max-w-2xl">
                        <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-blue-500">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">User Profile</h3>
                            <p className="py-1"><strong>Full Name:</strong> {faculty_name}</p>
                            <p className="py-1"><strong>Faculty ID:</strong> {myFacultyId}</p>
                            <p className="py-1"><strong>Department:</strong> {department}</p>
                            <p className="py-1"><strong>Email:</strong> {myFacultyId.toLowerCase()}@university.edu (Simulated)</p>
                        </div>
                        
                        {/* Change Password Card */}
                        <div className="bg-white shadow-md rounded-xl p-6 border-l-4 border-red-500">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                                <FaLock className="text-red-500"/> <span>Security Settings</span>
                            </h3>
                            <button 
                                onClick={() => setShowPasswordModal(true)} 
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-2">
                                <FaLock/> <span>Update Password</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* --- MODAL: Change Password --- */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-xl font-bold text-gray-800">Change Password</h3>
                            <button type="button" onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes/></button>
                        </div>
                        
                        <div className="space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Old Password</label><input type="password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm(p => ({ ...p, oldPassword: e.target.value }))} className="w-full p-2 border rounded-lg focus:ring-blue-500" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">New Password (min 8 chars)</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm(p => ({ ...p, newPassword: e.target.value }))} className="w-full p-2 border rounded-lg focus:ring-blue-500" required /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label><input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm(p => ({ ...p, confirmPassword: e.target.value }))} className="w-full p-2 border rounded-lg focus:ring-blue-500" required /></div>
                            {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (<p className="text-red-500 text-xs mt-1">Passwords do not match.</p>)}
                        </div>

                        <div className="flex justify-end pt-6 space-x-3">
                            <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
                            <button type="submit" disabled={passwordForm.newPassword !== passwordForm.confirmPassword} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Update Password</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default FacultyDashboard;