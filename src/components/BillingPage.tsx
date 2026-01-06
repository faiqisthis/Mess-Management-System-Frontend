import React, { useState, useEffect } from 'react';
import { UserRole } from '../App';
import { DollarSign, Download, FileText, Calendar, CheckCircle, XCircle, Users } from 'lucide-react';
import { billingService, Bill } from '../services/billingService';
import { userService, User } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';

interface BillingPageProps {
  userRole: UserRole;
  userId: string;
}

export function BillingPage({ userRole, userId }: BillingPageProps) {
  const { user, isAdmin } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  useEffect(() => {
    loadData();
  }, [userRole]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (userRole === 'Student') {
        // Load student's bills
        const studentBills = await billingService.getUserBills(parseInt(userId));
        setBills(studentBills);
      } else if (userRole === 'Admin') {
        // Load all bills and users for admin only
        const [allBills, allUsers] = await Promise.all([
          billingService.getAllBills(),
          userService.getAllUsers(),
        ]);
        setBills(allBills);
        setUsers(allUsers.filter(u => u.role === 0)); // Students only
      } else {
        // Teachers don't have access to billing
        setError('You do not have permission to view billing information');
        return;
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
      alert('Please select a student');
      return;
    }

    try {
      setIsGenerating(true);
      await billingService.generateBill({
        userId: selectedUser,
        year: selectedYear,
        month: selectedMonth + 1, // API expects 1-12, but we store 0-11
      });
      alert('Bill generated successfully!');
      await loadData();
    } catch (err: any) {
      console.error('Error generating bill:', err);
      alert('Failed to generate bill: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = async (billId: number) => {
    try {
      await billingService.markBillAsPaid(billId);
      alert('Bill marked as paid!');
      await loadData();
    } catch (err: any) {
      console.error('Error marking bill as paid:', err);
      alert('Failed to mark bill as paid: ' + err.message);
    }
  };

  const handleDeleteBill = async (billId: number) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;

    try {
      await billingService.deleteBill(billId);
      alert('Bill deleted successfully!');
      await loadData();
    } catch (err: any) {
      console.error('Error deleting bill:', err);
      alert('Failed to delete bill: ' + err.message);
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

  // Teacher view - no access
  if (userRole === 'Teacher') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Billing
          </h1>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Teachers do not have access to billing information.</p>
          <p className="text-sm text-gray-500 mt-2">Only students can view their bills and admins can manage billing.</p>
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
            My Bills
          </h1>
          <p className="text-gray-600">View your monthly bills and payment status</p>
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
                      <p className="text-2xl text-purple-600">PKR {bill.totalFoodCharges.toFixed(2)}</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-sm text-gray-600 mb-1">Fixed Charges</p>
                      <p className="text-2xl text-green-600">PKR {bill.totalFixedCharges.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xl text-gray-700">Total Amount</span>
                      <span className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
                        PKR {bill.totalAmount.toFixed(2)}
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
        <h2 className="text-lg font-semibold mb-4">Generate New Bill</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-700">Student</label>
            <select
              value={selectedUser || ''}
              onChange={(e) => setSelectedUser(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Select Student</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-700">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <td className="px-6 py-4 text-right text-sm">PKR {bill.totalFoodCharges.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm">PKR {bill.totalFixedCharges.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right text-sm font-semibold">PKR {bill.totalAmount.toFixed(2)}</td>
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
                          className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs"
                        >
                          Mark Paid
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteBill(bill.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-xs"
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
