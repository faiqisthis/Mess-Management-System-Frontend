import React, { useState, useEffect } from 'react';
import { UserRole } from '../App';
import { Calendar, Check, X, Users, TrendingUp } from 'lucide-react';
import { attendanceService, AttendanceSummary, StudentInfo } from '../services/attendanceService';
import { userService, User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface AttendancePageProps {
  userRole: UserRole;
  userId: string;
}

export function AttendancePage({ userRole, userId }: AttendancePageProps) {
  const { user } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [maxDate] = useState(today); // Prevent future dates
  const [users, setUsers] = useState<User[]>([]);
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [studentSummary, setStudentSummary] = useState<AttendanceSummary | null>(null);
  const [teacherSummary, setTeacherSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'mark' | 'view'>('mark'); // For teacher tabs

  useEffect(() => {
    if (userRole === 'Student') {
      loadStudentAttendance();
    } else if (userRole === 'Teacher') {
      if (activeTab === 'mark') {
        loadUsersAndAttendance();
      } else {
        loadTeacherAttendance();
      }
    } else {
      loadUsersAndAttendance();
    }
  }, [selectedDate, userRole, activeTab]);

  const loadStudentAttendance = async () => {
    try {
      setIsLoading(true);
      const currentDate = new Date();
      const summary = await attendanceService.getUserAttendance(
        parseInt(userId),
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          includeSummary: true,
          includeMenuDetails: true,
        }
      ) as AttendanceSummary;
      setStudentSummary(summary);
    } catch (err: any) {
      console.error('Error loading student attendance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeacherAttendance = async () => {
    try {
      setIsLoading(true);
      const currentDate = new Date();
      const summary = await attendanceService.getUserAttendance(
        parseInt(userId),
        {
          year: currentDate.getFullYear(),
          month: currentDate.getMonth() + 1,
          includeSummary: true,
          includeMenuDetails: true,
        }
      ) as AttendanceSummary;
      setTeacherSummary(summary);
    } catch (err: any) {
      console.error('Error loading teacher attendance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsersAndAttendance = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (userRole === 'Admin') {
        // Admin can mark everyone's attendance
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } else if (userRole === 'Teacher') {
        // Teachers use the new /api/attendance/students endpoint
        // Backend ensures teachers can only mark student attendance
        const studentList = await attendanceService.getStudents();
        setStudents(studentList);
      }

      // Load attendance for selected date
      const attendance = await attendanceService.getAttendanceByDate(selectedDate);
      setAttendanceData(attendance);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAttendance = async (studentId: number, currentStatus: number | null) => {
    try {
      setIsSaving(true);
      const newStatus = currentStatus === 1 ? 0 : 1;
      
      const existingAttendance = attendanceData.find(a => a.userId === studentId);
      
      if (existingAttendance) {
        // Update existing attendance
        await attendanceService.updateAttendance(existingAttendance.id, newStatus);
      } else {
        // Create new attendance
        await attendanceService.markAttendance({
          userId: studentId,
          date: selectedDate,
          status: newStatus,
        });
      }
      
      // Reload attendance
      await loadUsersAndAttendance();
      toast.success('Attendance updated successfully');
    } catch (err: any) {
      console.error('Error updating attendance:', err);
      if (err.message.includes('403') || err.message.includes('Unauthorized')) {
        toast.error('You do not have permission to mark this user\'s attendance. Teachers can only mark student attendance.');
      } else {
        toast.error('Failed to update attendance: ' + err.message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkMark = async (status: number) => {
    try {
      setIsSaving(true);
      
      // Get the appropriate list based on user role
      const userList = userRole === 'Admin' ? users : students;
      
      const attendances = userList.map(user => ({
        userId: user.id,
        status: status,
      }));

      await attendanceService.markBulkAttendance({
        date: selectedDate,
        attendances,
      });

      await loadUsersAndAttendance();
      toast.success('Bulk attendance marked successfully!');
    } catch (err: any) {
      console.error('Error marking bulk attendance:', err);
      toast.error('Failed to mark bulk attendance: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getAttendanceStatus = (studentId: number) => {
    const record = attendanceData.find(a => a.userId === studentId);
    return record ? record.status : null;
  };

  const AttendanceIcon = ({ status }: { status: number | null }) => {
    if (status === null) {
      return (
        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
          <span className="text-xs">-</span>
        </div>
      );
    }
    
    return (
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          status === 1 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}
      >
        {status === 1 ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading attendance data...</div>
        </div>
      </div>
    );
  }

  // Student view
  if (userRole === 'Student') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Attendance & Bill Estimate
          </h1>
          <p className="text-gray-600">View your attendance records and estimated monthly bill</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {studentSummary && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Present Days</p>
                <p className="text-2xl text-green-600">{studentSummary.summary?.presentDays || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Absent Days</p>
                <p className="text-2xl text-red-600">{studentSummary.summary?.absentDays || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Food Cost</p>
                <p className="text-2xl text-blue-600">PKR {studentSummary.summary?.estimatedFoodCharges || 0}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Estimated Total</p>
                <p className="text-2xl text-purple-600">PKR {studentSummary.summary?.estimatedTotalCost || 0}</p>
              </div>
            </div>

            {/* Daily breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h2 className="text-xl text-white">Daily Attendance & Costs</h2>
                <p className="text-sm text-blue-100">{studentSummary.monthName}</p>
              </div>
              <div className="p-6 max-h-96 overflow-y-auto">
                {studentSummary.dailySummaries?.map((day) => (
                  <div key={day.date} className="border-b border-gray-200 last:border-0 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-700">{new Date(day.date).toLocaleDateString()}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            day.status === 'Present'
                              ? 'bg-green-100 text-green-700'
                              : day.status === 'Absent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {day.status}
                        </span>
                      </div>
                      <span className="font-semibold text-blue-600">PKR {day.dailyTotalCost}</span>
                    </div>
                    {day.meals && day.meals.length > 0 && (
                      <div className="text-sm text-gray-600 ml-4">
                        {day.meals.map((meal, idx) => (
                          <span key={idx}>
                            {meal.name} (PKR {meal.price})
                            {idx < day.meals.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Teacher view with tabs
  if (userRole === 'Teacher') {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-gray-600">Mark student attendance and view your own records</p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('mark')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'mark'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Mark Student Attendance
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 font-medium transition-colors cursor-pointer ${
              activeTab === 'view'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Attendance
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : activeTab === 'view' ? (
          // Teacher's own attendance view (same as student view)
          <div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {teacherSummary && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Present Days</p>
                    <p className="text-2xl text-green-600">{teacherSummary.summary?.presentDays || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Absent Days</p>
                    <p className="text-2xl text-red-600">{teacherSummary.summary?.absentDays || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Food Cost</p>
                    <p className="text-2xl text-blue-600">PKR {teacherSummary.summary?.estimatedFoodCharges || 0}</p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                    <p className="text-sm text-gray-600 mb-1">Estimated Total</p>
                    <p className="text-2xl text-purple-600">PKR {teacherSummary.summary?.estimatedTotalCost || 0}</p>
                  </div>
                </div>

                {/* Daily breakdown */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                    <h2 className="text-xl text-white">Daily Attendance & Costs</h2>
                    <p className="text-sm text-blue-100">{teacherSummary.monthName}</p>
                  </div>
                  <div className="p-6 max-h-96 overflow-y-auto">
                    {teacherSummary.dailySummaries?.map((day) => (
                      <div key={day.date} className="border-b border-gray-200 last:border-0 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700">{new Date(day.date).toLocaleDateString()}</span>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                day.status === 'Present'
                                  ? 'bg-green-100 text-green-700'
                                  : day.status === 'Absent'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {day.status}
                            </span>
                          </div>
                          <span className="font-semibold text-blue-600">PKR {day.dailyTotalCost}</span>
                        </div>
                        {day.meals && day.meals.length > 0 && (
                          <div className="text-sm text-gray-600 ml-4">
                            {day.meals.map((meal, idx) => (
                              <span key={idx}>
                                {meal.name} (PKR {meal.price})
                                {idx < day.meals.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          // Mark student attendance tab
          <div>
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={selectedDate}
                  max={maxDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  onClick={() => handleBulkMark(1)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Mark All Present
                </button>
                <button
                  onClick={() => handleBulkMark(0)}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-600">Total Students</span>
                </div>
                <p className="text-2xl text-gray-900">{students.length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm text-gray-600">Present</span>
                </div>
                <p className="text-2xl text-green-600">{attendanceData.filter(a => a.status === 1).length}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-sm text-gray-600">Absent</span>
                </div>
                <p className="text-2xl text-red-600">{attendanceData.filter(a => a.status === 0).length}</p>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Student Name</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Roll Number</th>
                      <th className="px-6 py-4 text-left text-sm text-gray-700">Room Number</th>
                      <th className="px-6 py-4 text-center text-sm text-gray-700">Attendance</th>
                      <th className="px-6 py-4 text-center text-sm text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => {
                      const status = getAttendanceStatus(student.id);
                      const firstName = student.firstName;
                      const lastName = student.lastName;
                      return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm">
                                {firstName.charAt(0)}
                              </div>
                              <span>{firstName} {lastName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.rollNumber || '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{student.roomNumber || '-'}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex justify-center">
                              <AttendanceIcon status={status} />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleToggleAttendance(student.id, status)}
                              disabled={isSaving}
                              className={`px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                                status === 1
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {status === 1 ? 'Mark Absent' : 'Mark Present'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Admin view
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Attendance Management
          </h1>
          <p className="text-gray-600">Mark and manage attendance for all users</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            max={maxDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            onClick={() => handleBulkMark(1)}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Mark All Present
          </button>
          <button
            onClick={() => handleBulkMark(0)}
            disabled={isSaving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Mark All Absent
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">{userRole === 'Admin' ? 'Total Users' : 'Total Students'}</span>
          </div>
          <p className="text-2xl text-gray-900">{userRole === 'Admin' ? users.length : students.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Present</span>
          </div>
          <p className="text-2xl text-green-600">{attendanceData.filter(a => a.status === 1).length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-sm text-gray-600">Absent</span>
          </div>
          <p className="text-2xl text-red-600">{attendanceData.filter(a => a.status === 0).length}</p>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-700">{userRole === 'Admin' ? 'Name' : 'Student Name'}</th>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Roll Number</th>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Room Number</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Attendance</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(userRole === 'Admin' ? users : students).map((student) => {
                const status = getAttendanceStatus(student.id);
                const firstName = 'firstName' in student ? student.firstName : '';
                const lastName = 'lastName' in student ? student.lastName : '';
                return (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm">
                          {firstName.charAt(0)}
                        </div>
                        <span>{firstName} {lastName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.rollNumber || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{student.roomNumber || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <AttendanceIcon status={status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleAttendance(student.id, status)}
                        disabled={isSaving}
                        className={`px-4 py-2 rounded-lg text-sm transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed ${
                          status === 1
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {status === 1 ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
