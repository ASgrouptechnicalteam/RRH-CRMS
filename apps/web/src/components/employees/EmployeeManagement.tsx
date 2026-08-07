import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Key,
  QrCode,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  Printer,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  DollarSign,
  CreditCard,
  Heart,
  GraduationCap,
  Calendar,
  FileText,
  User,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config';
import { QRCodeVisual } from '../common/QRCodeVisual';

interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  branchId: number;
  branch: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  attendanceRequired: boolean;
  firstLoginDone: boolean;
  roles: string[];
  createdAt: string;

  // Industrial Details
  phone: string;
  secondaryPhone: string;
  whatsappNumber: string;
  email: string;
  bloodGroup: string;
  socialLinks: string;
  currentAddress: string;
  permanentAddress: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  panNumber: string;
  aadhaarNumber: string;
  bankName: string;
  bankAccountNumber: string;
  bankIfsc: string;
  bankBranch: string;
  jobTitle: string;
  department: string;
  employmentType: string;
  reportingManagerId: number | null;
  dateOfJoining: string;
  salaryCtc: number;
  backgroundEducation: string;
}

interface Branch {
  id: number;
  name: string;
}

interface ManagerOption {
  id: number;
  label: string;
}

export const EmployeeManagement: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modals & Dossier Drawer
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep] = useState<1 | 2 | 3 | 4>(1);
  const [dossierEmp, setDossierEmp] = useState<Employee | null>(null);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [qrBadgeEmp, setQrBadgeEmp] = useState<Employee | null>(null);
  const [resetPwdEmp, setResetPwdEmp] = useState<Employee | null>(null);

  // 20 Industrial Form Fields State
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [socialLinks, setSocialLinks] = useState('');

  const [currentAddress, setCurrentAddress] = useState('');
  const [permanentAddress, setPermanentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelation, setEmergencyContactRelation] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  const [panNumber, setPanNumber] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('Sales & Leads');
  const [employmentType, setEmploymentType] = useState('FULL_TIME');
  const [addRole, setAddRole] = useState('Telecaller');
  const [addBranchId, setAddBranchId] = useState<string>('');
  const [reportingManagerId, setReportingManagerId] = useState<string>('');
  const [dateOfJoining, setDateOfJoining] = useState(new Date().toISOString().split('T')[0]);
  const [salaryCtc, setSalaryCtc] = useState('35000');
  const [backgroundEducation, setBackgroundEducation] = useState('');
  const [initialPassword, setInitialPassword] = useState('Password@123');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchEmployeesAndMetadata = async () => {
    setIsLoading(true);
    try {
      const [empRes, branchRes, mgrRes] = await Promise.all([
        fetchWithAuth(`${API_BASE_URL}/employees`),
        fetchWithAuth(`${API_BASE_URL}/employees/branches`),
        fetchWithAuth(`${API_BASE_URL}/employees/managers`),
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData.employees || []);
      }
      if (branchRes.ok) {
        const bData = await branchRes.json();
        setBranches(bData.branches || []);
        if (bData.branches?.length > 0) {
          setAddBranchId(String(bData.branches[0].id));
        }
      }
      if (mgrRes.ok) {
        const mData = await mgrRes.json();
        setManagers(mData.managers || []);
      }
    } catch (e) {
      console.error('Failed to load employee directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesAndMetadata();
  }, []);

  const resetForm = () => {
    setAddStep(1);
    setFullName('');
    setPhone('');
    setSecondaryPhone('');
    setWhatsappNumber('');
    setEmail('');
    setBloodGroup('O+');
    setSocialLinks('');
    setCurrentAddress('');
    setPermanentAddress('');
    setEmergencyContactName('');
    setEmergencyContactRelation('');
    setEmergencyContactPhone('');
    setPanNumber('');
    setAadhaarNumber('');
    setBankName('');
    setBankAccountNumber('');
    setBankIfsc('');
    setBankBranch('');
    setJobTitle('');
    setDepartment('Sales & Leads');
    setEmploymentType('FULL_TIME');
    setAddRole('Telecaller');
    setReportingManagerId('');
    setDateOfJoining(new Date().toISOString().split('T')[0]);
    setSalaryCtc('35000');
    setBackgroundEducation('');
    setInitialPassword('Password@123');
    setModalError(null);
  };

  const handleAddEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!fullName || !phone) {
      setModalError('Full Name and Primary Phone Number are required fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          secondary_phone: secondaryPhone,
          whatsapp_number: whatsappNumber || phone,
          email,
          blood_group: bloodGroup,
          social_links: socialLinks,
          current_address: currentAddress,
          permanent_address: permanentAddress || currentAddress,
          emergency_contact_name: emergencyContactName,
          emergency_contact_relation: emergencyContactRelation,
          emergency_contact_phone: emergencyContactPhone,
          pan_number: panNumber,
          aadhaar_number: aadhaarNumber,
          bank_name: bankName,
          bank_account_number: bankAccountNumber,
          bank_ifsc: bankIfsc,
          bank_branch: bankBranch,
          job_title: jobTitle || addRole,
          department,
          employment_type: employmentType,
          role_name: addRole,
          branch_id: addBranchId,
          reporting_manager_id: reportingManagerId,
          date_of_joining: dateOfJoining,
          salary_ctc: salaryCtc,
          background_education: backgroundEducation,
          initial_password: initialPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add employee');

      setSuccessMessage(`Employee ${data.employee.fullName} (${data.employee.employeeCode}) onboarded successfully!`);
      setShowAddModal(false);
      resetForm();
      fetchEmployeesAndMetadata();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setModalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPwdEmp) return;
    setIsSubmitting(true);

    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/employees/${resetPwdEmp.id}/reset-password`, {
        method: 'POST',
      });
      if (res.ok) {
        setSuccessMessage(`Password for ${resetPwdEmp.fullName} reset to default (Password@123)!`);
        setResetPwdEmp(null);
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch (e) {
      alert('Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.roles.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesBranch = branchFilter === 'ALL' || String(emp.branchId) === branchFilter;
    const matchesRole = roleFilter === 'ALL' || emp.roles.includes(roleFilter);

    return matchesSearch && matchesBranch && matchesRole;
  });

  const totalActive = employees.filter((e) => e.status === 'ACTIVE').length;
  const totalExempt = employees.filter((e) => !e.attendanceRequired).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shadow-inner border border-teal-100">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Industrial Employee Directory & Dossiers</h2>
              <p className="text-xs text-slate-500">
                Radha Real Homes & Sonthillu Enterprise HRMS & Payroll Registration System
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="py-3 px-5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard New Employee</span>
          </button>
        </div>

        {/* Global Success Notification Banner */}
        {successMessage && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Total Staff</span>
            <p className="text-2xl font-extrabold text-slate-800 font-mono mt-0.5">{employees.length}</p>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/60">
            <span className="text-[11px] text-emerald-700 font-semibold uppercase">Active Roster</span>
            <p className="text-2xl font-extrabold text-emerald-800 font-mono mt-0.5">{totalActive}</p>
          </div>

          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/60">
            <span className="text-[11px] text-amber-700 font-semibold uppercase">QR Exempted Staff</span>
            <p className="text-2xl font-extrabold text-amber-800 font-mono mt-0.5">{totalExempt}</p>
          </div>

          <div className="p-3.5 bg-teal-50 rounded-xl border border-teal-200/60">
            <span className="text-[11px] text-teal-700 font-semibold uppercase">Active Branches</span>
            <p className="text-2xl font-extrabold text-teal-800 font-mono mt-0.5">{branches.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Employee ID, Name, Phone, Branch, or Role..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={String(b.id)}>
                {b.name}
              </option>
            ))}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-600"
          >
            <option value="ALL">All Roles</option>
            <option value="MD">Managing Director (MD)</option>
            <option value="HR Manager">HR Manager</option>
            <option value="Telecaller">Telecaller</option>
            <option value="Digital Lead Operator">Digital Marketing</option>
            <option value="Project Manager">Operations / Project Manager</option>
            <option value="Finance">Finance</option>
          </select>
        </div>
      </div>

      {/* Main Employee Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-600" />
            <p>Loading Employee Dossiers...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No employees match your search filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Employee ID & Name</th>
                  <th className="py-3.5 px-4">Official Title & Dept</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Branch Location</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredEmployees.map((emp) => (
                  <tr
                    key={emp.id}
                    onClick={() => setDossierEmp(emp)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-teal-900">{emp.employeeCode}</div>
                      <div className="font-bold text-slate-800 text-sm">{emp.fullName}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{emp.jobTitle}</div>
                      <div className="text-[11px] text-slate-500">{emp.department}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{emp.phone}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{emp.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.branch}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          emp.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDossierEmp(emp)}
                          className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                          title="View Complete Industrial Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setQrBadgeEmp(emp)}
                          className="p-1.5 text-slate-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors border border-slate-200"
                          title="View & Print Visual 2D QR ID Badge"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setResetPwdEmp(emp)}
                          className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors border border-slate-200"
                          title="Reset Password to Default"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4-TAB INDUSTRIAL ENTERPRISE ONBOARDING MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 animate-scaleUp">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Industrial Employee Onboarding Form</h3>
                  <p className="text-xs text-slate-500">
                    Complete 20-Field Industrial Profile Registration Form
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stepper Tabs */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-5 text-[11px] font-bold text-center">
              <button
                onClick={() => setAddStep(1)}
                className={`py-2 rounded-xl transition-all ${
                  addStep === 1 ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                1. Basic Info
              </button>
              <button
                onClick={() => setAddStep(2)}
                className={`py-2 rounded-xl transition-all ${
                  addStep === 2 ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                2. Addresses & Emergency
              </button>
              <button
                onClick={() => setAddStep(3)}
                className={`py-2 rounded-xl transition-all ${
                  addStep === 3 ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                3. KYC & Bank Payroll
              </button>
              <button
                onClick={() => setAddStep(4)}
                className={`py-2 rounded-xl transition-all ${
                  addStep === 4 ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                4. Job & Salary CTC
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddEmployeeSubmit} className="space-y-4 text-xs font-medium">
              {/* TAB 1: BASIC & CONTACT DETAILS */}
              {addStep === 1 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Varma"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Primary Phone Number *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Work / Personal Email *</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="e.g. ramesh@radharealhomes.com"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Secondary Contact Number</label>
                      <input
                        type="text"
                        value={secondaryPhone}
                        onChange={(e) => setSecondaryPhone(e.target.value)}
                        placeholder="e.g. +91 91234 56789"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Blood Group</label>
                      <select
                        value={bloodGroup}
                        onChange={(e) => setBloodGroup(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Social Media Platforms / Profiles</label>
                    <input
                      type="text"
                      value={socialLinks}
                      onChange={(e) => setSocialLinks(e.target.value)}
                      placeholder="e.g. linkedin.com/in/rameshvarma"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="pt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAddStep(2)}
                      className="py-3 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <span>Next: Addresses & Emergency</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: ADDRESSES & EMERGENCY CONTACTS */}
              {addStep === 2 && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Current Residential Address</label>
                    <textarea
                      rows={2}
                      value={currentAddress}
                      onChange={(e) => setCurrentAddress(e.target.value)}
                      placeholder="Flat / House No, Street, Landmark, Area, City, Pincode"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Permanent Address</label>
                    <textarea
                      rows={2}
                      value={permanentAddress}
                      onChange={(e) => setPermanentAddress(e.target.value)}
                      placeholder="Native / Permanent Residence Address"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-3">
                    <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-amber-600" />
                      <span>Emergency Contact Person Details</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Contact Name</label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="Contact Person Name"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Relationship</label>
                        <input
                          type="text"
                          value={emergencyContactRelation}
                          onChange={(e) => setEmergencyContactRelation(e.target.value)}
                          placeholder="Father, Spouse, Sibling"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Emergency Phone</label>
                        <input
                          type="text"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setAddStep(1)}
                      className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStep(3)}
                      className="py-3 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <span>Next: KYC & Bank Payroll</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: GOVERNMENT KYC & PAYROLL BANK DETAILS */}
              {addStep === 3 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">PAN Card Number</label>
                      <input
                        type="text"
                        value={panNumber}
                        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Aadhaar Card Number</label>
                      <input
                        type="text"
                        value={aadhaarNumber}
                        onChange={(e) => setAadhaarNumber(e.target.value)}
                        placeholder="e.g. 1234 5678 9012"
                        maxLength={14}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-teal-50/50 border border-teal-200/80 rounded-2xl space-y-3">
                    <h4 className="font-bold text-teal-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-teal-700" />
                      <span>Payroll Direct Deposit Bank Account</span>
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Bank Name</label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          placeholder="e.g. HDFC Bank / ICICI Bank"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Bank Account Number</label>
                        <input
                          type="text"
                          value={bankAccountNumber}
                          onChange={(e) => setBankAccountNumber(e.target.value)}
                          placeholder="e.g. 50100234567890"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">IFSC Code</label>
                        <input
                          type="text"
                          value={bankIfsc}
                          onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                          placeholder="e.g. HDFC0001234"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-mono uppercase font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">Bank Branch Location</label>
                        <input
                          type="text"
                          value={bankBranch}
                          onChange={(e) => setBankBranch(e.target.value)}
                          placeholder="e.g. Miyapur Branch, Hyderabad"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setAddStep(2)}
                      className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddStep(4)}
                      className="py-3 px-6 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl flex items-center gap-1.5"
                    >
                      <span>Next: Job & Salary CTC</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: JOB TITLE, DEPARTMENT, REPORTING MANAGER & SALARY CTC */}
              {addStep === 4 && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Official Job Title *</label>
                      <input
                        type="text"
                        required
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Telecaller Lead"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Department *</label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                      >
                        <option value="Sales & Leads">Sales & Leads</option>
                        <option value="Marketing">Marketing & Digital Leads</option>
                        <option value="Operations">Operations & Site Management</option>
                        <option value="Finance">Accounts & Finance</option>
                        <option value="Human Resources">Human Resources (HR)</option>
                        <option value="Executive">Executive Office</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Employment Type</label>
                      <select
                        value={employmentType}
                        onChange={(e) => setEmploymentType(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="FULL_TIME">Full-Time Regular</option>
                        <option value="PART_TIME">Part-Time</option>
                        <option value="CONTRACT">Contractual</option>
                        <option value="INTERN">Trainee / Intern</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">System Role</label>
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="Telecaller">Telecaller</option>
                        <option value="Digital Lead Operator">Digital Marketing</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Finance">Finance</option>
                        <option value="HR Manager">HR Manager</option>
                        <option value="MD">Managing Director (MD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Work Location Branch *</label>
                      <select
                        value={addBranchId}
                        onChange={(e) => setAddBranchId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        {branches.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Reporting Manager</label>
                      <select
                        value={reportingManagerId}
                        onChange={(e) => setReportingManagerId(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      >
                        <option value="">Select Reporting Manager...</option>
                        {managers.map((m) => (
                          <option key={m.id} value={String(m.id)}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Date of Joining</label>
                      <input
                        type="date"
                        value={dateOfJoining}
                        onChange={(e) => setDateOfJoining(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-bold mb-1">Monthly Salary CTC (₹)</label>
                      <input
                        type="number"
                        value={salaryCtc}
                        onChange={(e) => setSalaryCtc(e.target.value)}
                        placeholder="35000"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Background, Education & Certifications</label>
                    <textarea
                      rows={2}
                      value={backgroundEducation}
                      onChange={(e) => setBackgroundEducation(e.target.value)}
                      placeholder="e.g. B.Tech / MBA Graduate, Real Estate Sales Certification, 3 Years Tele-sales experience"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="pt-3 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setAddStep(3)}
                      className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="py-3.5 px-8 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Complete & Onboard Employee</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* FULL INDUSTRIAL EMPLOYEE DOSSIER VIEW MODAL */}
      {dossierEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-8 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white font-bold text-lg flex items-center justify-center shadow-md">
                  {dossierEmp.employeeCode.split('-')[1] || 'EMP'}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-xl">{dossierEmp.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    ID: {dossierEmp.employeeCode} • {dossierEmp.jobTitle} ({dossierEmp.department})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full font-bold text-xs ${
                    dossierEmp.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}
                >
                  {dossierEmp.status}
                </span>
                <button onClick={() => setDossierEmp(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Dossier Grid Sections */}
            <div className="space-y-4 text-xs">
              {/* Section 1: Contact & Personal */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-4 h-4 text-teal-700" />
                  <span>Personal & Contact Information</span>
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Primary Phone</span>
                    <span className="font-bold text-slate-800">{dossierEmp.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Official Email</span>
                    <span className="font-bold text-slate-800">{dossierEmp.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Blood Group</span>
                    <span className="font-bold text-slate-800">{dossierEmp.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Secondary Phone</span>
                    <span className="font-bold text-slate-800">{dossierEmp.secondaryPhone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">WhatsApp</span>
                    <span className="font-bold text-slate-800">{dossierEmp.whatsappNumber || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Social Links</span>
                    <span className="font-bold text-slate-800">{dossierEmp.socialLinks || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Addresses & Emergency */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  <span>Addresses & Emergency Contacts</span>
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Address</span>
                    <span className="font-semibold text-slate-800">{dossierEmp.currentAddress}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Permanent Address</span>
                    <span className="font-semibold text-slate-800">{dossierEmp.permanentAddress}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency Person</span>
                    <span className="font-bold text-slate-800">{dossierEmp.emergencyContactName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Relationship</span>
                    <span className="font-bold text-slate-800">{dossierEmp.emergencyContactRelation}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Emergency Phone</span>
                    <span className="font-bold text-slate-800">{dossierEmp.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Government KYC & Payroll Bank */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-700" />
                  <span>Government KYC & Payroll Bank Details</span>
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">PAN Number</span>
                    <span className="font-mono font-bold text-slate-800">{dossierEmp.panNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Aadhaar UID</span>
                    <span className="font-mono font-bold text-slate-800">{dossierEmp.aadhaarNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Name</span>
                    <span className="font-bold text-slate-800">{dossierEmp.bankName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Account Number</span>
                    <span className="font-mono font-bold text-slate-800">{dossierEmp.bankAccountNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">IFSC Code</span>
                    <span className="font-mono font-bold text-slate-800">{dossierEmp.bankIfsc}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bank Branch</span>
                    <span className="font-bold text-slate-800">{dossierEmp.bankBranch}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Employment & Salary CTC */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-teal-700" />
                  <span>Employment Terms & Salary CTC</span>
                </h4>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Work Location</span>
                    <span className="font-bold text-slate-800">{dossierEmp.branch}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Employment Type</span>
                    <span className="font-bold text-slate-800">{dossierEmp.employmentType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Date of Joining</span>
                    <span className="font-bold text-slate-800">{dossierEmp.dateOfJoining}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Monthly Salary CTC</span>
                    <span className="font-mono font-extrabold text-teal-800 text-sm">₹{dossierEmp.salaryCtc?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Background & Education</span>
                  <span className="font-semibold text-slate-800">{dossierEmp.backgroundEducation || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setDossierEmp(null)}
                className="py-2.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Visual 2D QR Code Badge Modal */}
      {qrBadgeEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <span className="font-bold text-slate-800 text-sm">Official Employee QR Badge</span>
              <button onClick={() => setQrBadgeEmp(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 inline-block mb-3">
              <QRCodeVisual value={qrBadgeEmp.employeeCode} size={200} label={qrBadgeEmp.employeeCode} />
            </div>

            <p className="text-xs text-slate-500 font-medium mb-4">
              Permanent 2D QR badge for {qrBadgeEmp.fullName} ({qrBadgeEmp.employeeCode})
            </p>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official QR ID Badge</span>
            </button>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Dialog */}
      {resetPwdEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center animate-scaleUp">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Reset Password?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Reset password for <strong>{resetPwdEmp.fullName}</strong> ({resetPwdEmp.employeeCode}) back to default (<code>Password@123</code>)?
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setResetPwdEmp(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
