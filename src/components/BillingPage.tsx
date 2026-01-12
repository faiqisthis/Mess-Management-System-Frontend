import React, { useState, useEffect } from 'react';
import { UserRole } from '../App';
import { DollarSign, Download, FileText, Calendar, CheckCircle, XCircle, Users, FileDown, BarChart3 } from 'lucide-react';
import { billingService, Bill, MonthlyReport } from '../services/billingService';
import { userService, User } from '../services/userService';
import toast from 'react-hot-toast';

interface BillingPageProps {
  userRole: UserRole;
  userId: string;
}

export function BillingPage({ userRole, userId }: BillingPageProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [exportUserId, setExportUserId] = useState<number | null>(null);
  const [exportYear, setExportYear] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (userRole === 'Student' || userRole === 'Teacher') {
        // Load student's or teacher's own bills
        const userBills = await billingService.getUserBills(parseInt(userId));
        setBills(userBills);
      } else if (userRole === 'Admin') {
        // Load all bills and users for admin only
        const [allBills, allUsers] = await Promise.all([
          billingService.getAllBills(),
          userService.getAllUsers(),
        ]);
        setBills(allBills);
        setUsers(allUsers.filter(u => u.role === 0 || u.role === 1)); // Students and Teachers
      }
    } catch (err: any) {
      console.error('Error loading billing data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBill = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }
    if (!selectedYear || selectedYear < 2000 || selectedYear > 2100) {
      toast.error('Please enter a valid year');
      return;
    }

    try {
      setIsGenerating(true);
      await billingService.generateBill({
        userId: selectedUser,
        year: selectedYear,
        month: selectedMonth + 1, // API expects 1-12, but we store 0-11
      });
      toast.success('Bill generated successfully!');
      await loadData();
    } catch (err: any) {
      console.error('Error generating bill:', err);
      toast.error('Failed to generate bill: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = async (billId: number) => {
    try {
      await billingService.markBillAsPaid(billId);
      toast.success('Bill marked as paid!');
      await loadData();
    } catch (err: any) {
      console.error('Error marking bill as paid:', err);
      toast.error('Failed to mark bill as paid: ' + err.message);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      await billingService.deleteBill(billId);
      toast.success('Bill deleted successfully!');
      await loadData();
    } catch (err: any) {
      console.error('Error deleting bill:', err);
      toast.error('Failed to delete bill: ' + err.message);
    }
  };

  const handleGenerateBulkBills = async () => {
    if (!confirm(`Are you sure you want to generate bills for all ${users.length} users (students and teachers) for ${new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}?`)) return;

    try {
      setIsGenerating(true);
      let successCount = 0;
      let failCount = 0;
      
      for (const user of users) {
        try {
          await billingService.generateBill({
            userId: user.id,
            year: selectedYear,
            month: selectedMonth + 1,
          });
          successCount++;
        } catch (err) {
          console.error(`Failed to generate bill for user ${user.id}:`, err);
          failCount++;
        }
      }
      
      if (failCount === 0) {
        toast.success(`Successfully generated ${successCount} bills!`);
      } else {
        toast.success(`Generated ${successCount} bills. ${failCount} failed.`);
      }
      await loadData();
    } catch (err: any) {
      console.error('Error generating bulk bills:', err);
      toast.error('Failed to generate bulk bills: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const blob = await billingService.exportBillsCSV(exportUserId || undefined, exportYear || undefined);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = exportUserId 
        ? `Bills_History_User_${exportUserId}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`
        : `Bills_History_All_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Bills exported successfully!');
    } catch (err: any) {
      console.error('Error exporting bills:', err);
      toast.error('Failed to export bills: ' + err.message);
    }
  };

  const handleLoadMonthlyReport = async () => {
    try {
      setIsLoading(true);
      const report = await billingService.getMonthlyReport(reportYear, reportMonth);
      
      // Calculate revenue fields from bills if they're not provided by the backend
      const calculatedTotalRevenue = report.bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      const calculatedPaidRevenue = report.bills.filter(b => b.isPaid).reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      const calculatedUnpaidRevenue = report.bills.filter(b => !b.isPaid).reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
      
      const enrichedReport = {
        ...report,
        totalRevenue: report.totalRevenue || calculatedTotalRevenue,
        paidRevenue: report.paidRevenue || calculatedPaidRevenue,
        unpaidRevenue: report.unpaidRevenue || calculatedUnpaidRevenue,
      };
      
      setMonthlyReport(enrichedReport);
      setShowMonthlyReport(true);
      toast.success('Monthly report loaded successfully!');
    } catch (err: any) {
      console.error('Error loading monthly report:', err);
      toast.error('Failed to load monthly report: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportMonthlyReport = async () => {
    try {
      const blob = await billingService.exportMonthlyReportCSV(reportYear, reportMonth);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Monthly_Report_${reportYear}_${reportMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Monthly report exported successfully!');
    } catch (err: any) {
      console.error('Error exporting monthly report:', err);
      toast.error('Failed to export monthly report: ' + err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading billing data...</div>
        </div>
      </div>
    );
  }

  // Student/Teacher view - their own bills
  if (userRole === 'Student' || userRole === 'Teacher') {
    const handleExportMyBills = async () => {
      try {
        const blob = await billingService.exportBillsCSV(parseInt(userId));
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `My_Bills_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Bills exported successfully!');
      } catch (err: any) {
        console.error('Error exporting bills:', err);
        toast.error('Failed to export bills: ' + err.message);
      }
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Bills
            </h1>
            <p className="text-gray-600">View your monthly bills and payment status</p>
            {userRole === 'Teacher' && bills.length > 0 && (
              <p className="text-sm text-blue-600 mt-2">Note: Only administrators can generate new bills.</p>
            )}
          </div>
          {bills.length > 0 && (
            <button
              onClick={handleExportMyBills}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {bills.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No bills generated yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {bills.map((bill) => (
              <div key={bill.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-white" />
                    <div>
                      <h2 className="text-xl text-white">
                        {new Date(bill.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h2>
                      <p className="text-sm text-blue-100">
                        {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      bill.isPaid
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bill.isPaid ? 'Paid' : 'Unpaid'}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-600 mb-1">Present Days</p>
                      <p className="text-2xl text-blue-600">{bill.presentDays} / {bill.totalDays}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-sm text-gray-600 mb-1">Food Charges</p>
                      <p className="text-2xl text-purple-600">PKR {(bill.totalFoodCharges || 0).toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-gray-600 mb-1">Fixed Charges</p>
                      <p className="text-2xl text-green-600">PKR {(bill.totalFixedCharges || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xl text-gray-700">Total Amount</span>
                      <span className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                        PKR {(bill.totalAmount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Admin view
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Billing Management
        </h1>
        <p className="text-gray-600">Generate and manage student bills</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Generate Bill Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold">Generate New Bill</h2>
          <button
            onClick={handleGenerateBulkBills}
            disabled={isGenerating || users.length === 0}
            className={`px-6 py-2.5 border-2 border-green-700 bg-green-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-md font-medium cursor-pointer disabled:cursor-not-allowed ${isGenerating || users.length === 0 ? 'bg-gray-300 text-gray-500 border-gray-400' : ''}`}
            style={{ minWidth: 180, minHeight: 44 }}
            title={users.length === 0 ? 'No users available' : `Generate bills for all ${users.length} users`}
          >
            {isGenerating ? 'Generating...' : `Generate for All`}
          </button>
        </div>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">User</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">Select User</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.role === 0 ? 'Student' : 'Teacher'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateBill}
              disabled={isGenerating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? 'Generating...' : 'Generate Bill'}
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Note: Bills can only be generated for previous months, not the current month.
        </p>
      </div>

      {/* Export Bills Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Export Bills History</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">User (Optional)</label>
            <select
              value={exportUserId || ''}
              onChange={(e) => setExportUserId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              <option value="">All Users</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.role === 0 ? 'Student' : 'Teacher'})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Year (Optional)</label>
            <input
              type="number"
              value={exportYear || ''}
              onChange={(e) => setExportYear(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              placeholder="All Years"
              min="2000"
              max="2100"
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Bills CSV
            </button>
          </div>
        </div>
      </div>

      {/* Monthly Report Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Monthly Report</h2>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">Year</label>
            <input
              type="number"
              value={reportYear}
              onChange={(e) => setReportYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
              min="2000"
              max="2100"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Month</label>
            <select
              value={reportMonth}
              onChange={(e) => setReportMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleLoadMonthlyReport}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              <BarChart3 className="w-4 h-4" />
              View Report
            </button>
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={handleExportMonthlyReport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {showMonthlyReport && monthlyReport && (
          <div className="mt-6 border-t border-gray-200 pt-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-2xl text-blue-600">{monthlyReport.totalUsers}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Bills</p>
                <p className="text-2xl text-purple-600">{monthlyReport.totalBills}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-2xl text-green-600">PKR {(monthlyReport.totalRevenue || 0).toFixed(0)}</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Paid Revenue</p>
                <p className="text-2xl text-emerald-600">PKR {(monthlyReport.paidRevenue || 0).toFixed(0)}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Unpaid Revenue</p>
                <p className="text-2xl text-red-600">PKR {(monthlyReport.unpaidRevenue || 0).toFixed(0)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm text-gray-700">User ID</th>
                    <th className="px-4 py-3 text-left text-sm text-gray-700">Period</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-700">Present Days</th>
                    <th className="px-4 py-3 text-right text-sm text-gray-700">Food Charges</th>
                    <th className="px-4 py-3 text-right text-sm text-gray-700">Fixed Charges</th>
                    <th className="px-4 py-3 text-right text-sm text-gray-700">Total</th>
                    <th className="px-4 py-3 text-center text-sm text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyReport.bills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">User #{bill.userId}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(bill.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {bill.presentDays} / {bill.totalDays}
                      </td>
                      <td className="px-4 py-3 text-right text-sm">PKR {(bill.totalFoodCharges || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm">PKR {(bill.totalFixedCharges || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm font-semibold">PKR {(bill.totalAmount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs ${
                            bill.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {bill.isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-600">Total Bills</span>
          </div>
          <p className="text-2xl text-gray-900">{bills.length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">Paid Bills</span>
          </div>
          <p className="text-2xl text-green-600">{bills.filter((b) => b.isPaid).length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">Unpaid Bills</span>
          </div>
          <p className="text-2xl text-red-600">{bills.filter((b) => !b.isPaid).length}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm text-gray-600">Total Revenue</span>
          </div>
          <p className="text-2xl text-purple-600">
            PKR {bills.reduce((sum, bill) => sum + bill.totalAmount, 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Student ID</th>
                <th className="px-6 py-4 text-left text-sm text-gray-700">Period</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Present Days</th>
                <th className="px-6 py-4 text-right text-sm text-gray-700">Food Charges</th>
                <th className="px-6 py-4 text-right text-sm text-gray-700">Fixed Charges</th>
                <th className="px-6 py-4 text-right text-sm text-gray-700">Total</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.map((bill) => (
                <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm">User #{bill.userId}</td>
                  <td className="px-6 py-4 text-sm">
                    {new Date(bill.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {bill.presentDays} / {bill.totalDays}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">PKR {(bill.totalFoodCharges || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm">PKR {(bill.totalFixedCharges || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">PKR {(bill.totalAmount || 0).toFixed(2)}</td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-3 py-1 rounded-full text-xs ${
                        bill.isPaid
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {bill.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {!bill.isPaid && (
                        <button
                          onClick={() => handleMarkAsPaid(bill.id)}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs cursor-pointer"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
